import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  activateBoostOrder,
  findBoostOrderByStripeSession,
  getBoostRevalidationPaths,
  markBoostOrderStatus
} from "@/lib/boosts";
import { isStripeWebhookConfigured } from "@/lib/env";
import {
  findIdentityVerificationOrderByStripeSession,
  markIdentityVerificationOrderStatus
} from "@/lib/identity-verification";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import {
  type StripeIdentityVerificationSession,
  verifyStripeWebhookSignature,
  type StripeCheckoutSession,
  type StripeWebhookEvent
} from "@/lib/stripe";

export const runtime = "nodejs";

async function fulfillBoostSession(session: StripeCheckoutSession) {
  const boostOrderId = session.metadata?.boost_order_id;
  const order = await findBoostOrderByStripeSession(boostOrderId, session.id);

  if (!order) {
    return;
  }

  const listing = await activateBoostOrder({
    orderId: order.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null
  });

  getBoostRevalidationPaths(listing).forEach((path) => {
    revalidatePath(path);
  });
}

async function revalidateSellerTrustPaths(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("slug, category")
    .eq("owner_id", userId);

  ["/", "/browse", "/account", "/settings", "/dashboard", "/dashboard/saved", "/saved"].forEach(
    (path) => {
      revalidatePath(path);
    }
  );

  (listings || []).forEach((listing) => {
    if (listing.category) {
      revalidatePath(`/categories/${listing.category}`);
    }

    if (listing.slug) {
      revalidatePath(`/listings/${listing.slug}`);
    }
  });
}

async function syncIdentityVerificationSession(
  session: StripeIdentityVerificationSession,
  nextStatus: "verified" | "unverified"
) {
  const profileId = session.metadata?.user_id || session.client_reference_id;

  if (!profileId) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: nextStatus,
      verification_requested_at: null,
      verified_at: nextStatus === "verified" ? new Date().toISOString() : null,
      stripe_identity_verification_session_id: session.id,
      stripe_identity_session_status: session.status,
      stripe_identity_last_error_code: session.last_error?.code ?? null,
      stripe_identity_last_error_reason: session.last_error?.reason ?? null
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  await revalidateSellerTrustPaths(profileId);
}

function revalidateIdentityPaymentPaths() {
  revalidatePath("/account");
  revalidatePath("/settings");
}

export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    verifyStripeWebhookSignature(payload, signature);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid Stripe webhook signature."
      },
      { status: 400 }
    );
  }

  const event = JSON.parse(payload) as StripeWebhookEvent<any>;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as StripeCheckoutSession;
      const boostOrderId = session.metadata?.boost_order_id;
      const order = await findBoostOrderByStripeSession(boostOrderId, session.id);

      if (!order) {
        const identityOrder = await findIdentityVerificationOrderByStripeSession(
          session.metadata?.identity_verification_order_id,
          session.id
        );

        if (!identityOrder) {
          break;
        }

        if (session.payment_status === "paid") {
          await markIdentityVerificationOrderStatus(
            identityOrder.id,
            "paid",
            typeof session.payment_intent === "string" ? session.payment_intent : null
          );
          revalidateIdentityPaymentPaths();
        }

        break;
      }

      if (session.payment_status === "paid") {
        await fulfillBoostSession(session);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as StripeCheckoutSession;
      const boostOrderId = session.metadata?.boost_order_id;
      const order = await findBoostOrderByStripeSession(boostOrderId, session.id);

      if (!order) {
        const identityOrder = await findIdentityVerificationOrderByStripeSession(
          session.metadata?.identity_verification_order_id,
          session.id
        );

        if (!identityOrder) {
          break;
        }

        await markIdentityVerificationOrderStatus(identityOrder.id, "canceled");
        revalidateIdentityPaymentPaths();
        break;
      }

      await markBoostOrderStatus(order.id, "canceled");
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as StripeCheckoutSession;
      const boostOrderId = session.metadata?.boost_order_id;
      const order = await findBoostOrderByStripeSession(boostOrderId, session.id);

      if (!order) {
        const identityOrder = await findIdentityVerificationOrderByStripeSession(
          session.metadata?.identity_verification_order_id,
          session.id
        );

        if (!identityOrder) {
          break;
        }

        await markIdentityVerificationOrderStatus(
          identityOrder.id,
          "failed",
          typeof session.payment_intent === "string" ? session.payment_intent : null
        );
        revalidateIdentityPaymentPaths();
        break;
      }

      await markBoostOrderStatus(
        order.id,
        "failed",
        typeof session.payment_intent === "string" ? session.payment_intent : null
      );
      break;
    }
    case "identity.verification_session.verified":
      await syncIdentityVerificationSession(
        event.data.object as StripeIdentityVerificationSession,
        "verified"
      );
      break;
    case "identity.verification_session.requires_input":
      await syncIdentityVerificationSession(
        event.data.object as StripeIdentityVerificationSession,
        "unverified"
      );
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
