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

  const event = JSON.parse(payload) as StripeWebhookEvent<StripeCheckoutSession>;
  const session = event.data.object;
  const boostOrderId = session.metadata?.boost_order_id;
  const order = await findBoostOrderByStripeSession(boostOrderId, session.id);

  if (!order) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (session.payment_status === "paid") {
        await fulfillBoostSession(session);
      }
      break;
    case "checkout.session.expired":
      await markBoostOrderStatus(order.id, "canceled");
      break;
    case "checkout.session.async_payment_failed":
      await markBoostOrderStatus(
        order.id,
        "failed",
        typeof session.payment_intent === "string" ? session.payment_intent : null
      );
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
