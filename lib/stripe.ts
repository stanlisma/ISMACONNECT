import crypto from "node:crypto";

import { getStripeEnv, getStripeWebhookSecret } from "@/lib/env";

export const STRIPE_API_VERSION = "2026-02-25.clover";

interface CreateCheckoutSessionInput {
  amountCents: number;
  currency: string;
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  payment_status: string;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent<T = any> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}

export async function createStripeCheckoutSession({
  amountCents,
  currency,
  name,
  description,
  successUrl,
  cancelUrl,
  metadata
}: CreateCheckoutSessionInput) {
  const { stripeSecretKey } = getStripeEnv();

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", successUrl);
  body.set("cancel_url", cancelUrl);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", currency);
  body.set("line_items[0][price_data][unit_amount]", String(amountCents));
  body.set("line_items[0][price_data][product_data][name]", name);
  body.set("line_items[0][price_data][product_data][description]", description);

  for (const [key, value] of Object.entries(metadata)) {
    body.set(`metadata[${key}]`, value);
    body.set(`payment_intent_data[metadata][${key}]`, value);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION
    },
    body
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe checkout could not be created.");
  }

  return payload as StripeCheckoutSession;
}

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null) {
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header.");
  }

  const endpointSecret = getStripeWebhookSecret();
  const entries = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = entries.find((entry) => entry.startsWith("t="))?.slice(2);
  const signatures = entries
    .filter((entry) => entry.startsWith("v1="))
    .map((entry) => entry.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe-Signature header.");
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));

  if (Number.isNaN(ageSeconds) || ageSeconds > 300) {
    throw new Error("Stripe webhook signature timestamp is too old.");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", endpointSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const verified = signatures.some((signature) => secureCompare(signature, expectedSignature));

  if (!verified) {
    throw new Error("Stripe webhook signature verification failed.");
  }

  return true;
}
