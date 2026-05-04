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
import { createNotificationAndPush } from "@/lib/push";
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

  const alreadyActive = order.status === "active";
  const listing = await activateBoostOrder({
    orderId: order.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null
  });

  getBoostRevalidationPaths(listing).forEach((path) => {
    revalidatePath(path);
  });

  if (!alreadyActive) {
    try {
      await createNotificationAndPush({
        userId: order.owner_id,
        type: "boost",
        title: "Boost activated",
        body: `${order.product_name} is now live on "${listing.title}".`,
        link: `/dashboard/listings/${listing.id}/boost`
      });
    } catch (error) {
      console.error("Boost activation notification failed:", error);
    }
  }
}

async function notifyBoostStateChange(params: {
  userId: string;
  listingId: string;
  productName: string;
  title: string;
  body: string;
}) {
  try {
    await createNotificationAndPush({
      userId: params.userId,
      type: "boost",
      title: params.title,
      body: params.body,
      link: `/dashboard/listings/${params.listingId}/boost`
    });
  } catch (error) {
    console.error("Boost status notification failed:", error);
  }
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
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", profileId)
    .maybeSingle();

  if (currentProfileError) {
    throw new Error(currentProfileError.message);
  }

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

  if (currentProfile?.verification_status !== nextStatus) {
    try {
      await createNotificationAndPush({
        userId: profileId,
        type: "verification",
        title:
          nextStatus === "verified"
            ? "Seller verification approved"
            : "Stripe ID verification needs attention",
        body:
          nextStatus === "verified"
            ? "Your verified seller badge is now active on ISMACONNECT."
            : session.last_error?.reason ||
              "Stripe needs more information before your seller badge can be approved.",
        link: "/settings"
      });
    } catch (notificationError) {
      console.error("Verification status notification failed:", notificationError);
    }
  }

  await revalidateSellerTrustPaths(profileId);
}

function revalidateIdentityPaymentPaths() {
  revalidatePath("/account");
  revalidatePath("/settings");
}

async function handleIdentityPaymentSuccess(session: StripeCheckoutSession) {
  const identityOrder = await findIdentityVerificationOrderByStripeSession(
    session.metadata?.identity_verification_order_id,
    session.id
  );

  if (!identityOrder) {
    return false;
  }

  if (session.payment_status === "paid" && identityOrder.status !== "paid") {
    await markIdentityVerificationOrderStatus(
      identityOrder.id,
      "paid",
      typeof session.payment_intent === "string" ? session.payment_intent : null
    );

    try {
      await createNotificationAndPush({
        userId: identityOrder.user_id,
        type: "verification",
        title: "Verification payment received",
        body: "You can now start Stripe ID verification from your settings page.",
        link: "/settings"
      });
    } catch (error) {
      console.error("Identity payment notification failed:", error);
    }
  }

  revalidateIdentityPaymentPaths();
  return true;
}

async function handleIdentityPaymentUpdate(
  session: StripeCheckoutSession,
  status: "canceled" | "failed",
  title: string,
  body: string
) {
  const identityOrder = await findIdentityVerificationOrderByStripeSession(
    session.metadata?.identity_verification_order_id,
    session.id
  );

  if (!identityOrder) {
    return false;
  }

  if (identityOrder.status !== status) {
    await markIdentityVerificationOrderStatus(
      identityOrder.id,
      status,
      typeof session.payment_intent === "string" ? session.payment_intent : null
    );

    try {
      await createNotificationAndPush({
        userId: identityOrder.user_id,
        type: "verification",
        title,
        body,
        link: "/settings"
      });
    } catch (error) {
      console.error("Identity payment status notification failed:", error);
    }
  }

  revalidateIdentityPaymentPaths();
  return true;
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
      const boostOrder = await findBoostOrderByStripeSession(
        session.metadata?.boost_order_id,
        session.id
      );

      if (boostOrder) {
        if (session.payment_status === "paid") {
          await fulfillBoostSession(session);
        }
        break;
      }

      await handleIdentityPaymentSuccess(session);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as StripeCheckoutSession;
      const boostOrder = await findBoostOrderByStripeSession(
        session.metadata?.boost_order_id,
        session.id
      );

      if (boostOrder) {
        if (boostOrder.status !== "canceled") {
          await markBoostOrderStatus(boostOrder.id, "canceled");
          await notifyBoostStateChange({
            userId: boostOrder.owner_id,
            listingId: boostOrder.listing_id,
            productName: boostOrder.product_name,
            title: "Boost checkout expired",
            body: `${boostOrder.product_name} was not completed. You can try again any time.`
          });
        }
        break;
      }

      await handleIdentityPaymentUpdate(
        session,
        "canceled",
        "Verification payment canceled",
        "Your Stripe verification checkout was canceled before payment completed."
      );
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as StripeCheckoutSession;
      const boostOrder = await findBoostOrderByStripeSession(
        session.metadata?.boost_order_id,
        session.id
      );

      if (boostOrder) {
        if (boostOrder.status !== "failed") {
          await markBoostOrderStatus(
            boostOrder.id,
            "failed",
            typeof session.payment_intent === "string" ? session.payment_intent : null
          );
          await notifyBoostStateChange({
            userId: boostOrder.owner_id,
            listingId: boostOrder.listing_id,
            productName: boostOrder.product_name,
            title: "Boost payment failed",
            body: `${boostOrder.product_name} could not be activated because Stripe marked the payment as failed.`
          });
        }
        break;
      }

      await handleIdentityPaymentUpdate(
        session,
        "failed",
        "Verification payment failed",
        "Stripe could not confirm your seller verification payment."
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
