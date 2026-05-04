import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { IdentityVerificationOrder } from "@/types/database";

const DEFAULT_IDENTITY_VERIFICATION_PRICE_CENTS = 499;
const DEFAULT_IDENTITY_VERIFICATION_CURRENCY = "cad";

export function getIdentityVerificationPriceCents() {
  const rawValue = Number(process.env.STRIPE_IDENTITY_VERIFICATION_PRICE_CENTS ?? "");

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_IDENTITY_VERIFICATION_PRICE_CENTS;
  }

  return Math.round(rawValue);
}

export function getIdentityVerificationCurrency() {
  return DEFAULT_IDENTITY_VERIFICATION_CURRENCY;
}

export function getIdentityVerificationPriceLabel() {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: getIdentityVerificationCurrency().toUpperCase(),
    maximumFractionDigits: 2
  }).format(getIdentityVerificationPriceCents() / 100);
}

export async function getLatestIdentityVerificationOrder(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("identity_verification_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as IdentityVerificationOrder | null) ?? null;
}

export async function hasPaidIdentityVerification(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("identity_verification_orders")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function createPendingIdentityVerificationOrder(params: {
  id: string;
  userId: string;
}) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data, error } = await serviceSupabase
    .from("identity_verification_orders")
    .insert({
      id: params.id,
      user_id: params.userId,
      amount_cents: getIdentityVerificationPriceCents(),
      currency: getIdentityVerificationCurrency(),
      status: "pending"
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create the verification payment order.");
  }

  return data as IdentityVerificationOrder;
}

export async function attachStripeSessionToIdentityVerificationOrder(orderId: string, sessionId: string) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const { error } = await serviceSupabase
    .from("identity_verification_orders")
    .update({
      stripe_checkout_session_id: sessionId
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markIdentityVerificationOrderStatus(
  orderId: string,
  status: "canceled" | "failed" | "paid",
  stripePaymentIntentId?: string | null
) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const updates: Record<string, string | null> = {
    status,
    stripe_payment_intent_id: stripePaymentIntentId ?? null
  };

  if (status === "paid") {
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await serviceSupabase
    .from("identity_verification_orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function findIdentityVerificationOrderByStripeSession(
  orderId: string | null | undefined,
  stripeCheckoutSessionId: string | null | undefined
) {
  const serviceSupabase = createServiceRoleSupabaseClient();

  if (orderId) {
    const { data } = await serviceSupabase
      .from("identity_verification_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (data) {
      return data as IdentityVerificationOrder;
    }
  }

  if (!stripeCheckoutSessionId) {
    return null;
  }

  const { data } = await serviceSupabase
    .from("identity_verification_orders")
    .select("*")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .maybeSingle();

  return (data as IdentityVerificationOrder | null) ?? null;
}
