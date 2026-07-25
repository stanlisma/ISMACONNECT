import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import {
  retrieveStripeCheckoutSession,
  retrieveStripeIdentityVerificationSession
} from "@/lib/stripe";
import { isStripeConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import type { IdentityVerificationOrder, Profile } from "@/types/database";

const DEFAULT_IDENTITY_VERIFICATION_PRICE_CENTS = 499;
const DEFAULT_IDENTITY_VERIFICATION_CURRENCY = "cad";

type VerificationProfileSnapshot = Pick<
  Profile,
  | "email_notifications"
  | "verification_status"
  | "verification_requested_at"
  | "verified_at"
  | "stripe_identity_verification_session_id"
  | "stripe_identity_session_status"
  | "stripe_identity_last_error_code"
  | "stripe_identity_last_error_reason"
>;

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

export async function reconcileLatestIdentityVerificationPayment(userId: string) {
  const latestOrder = await getLatestIdentityVerificationOrder(userId);

  if (
    !latestOrder ||
    latestOrder.status !== "pending" ||
    !latestOrder.stripe_checkout_session_id
  ) {
    return latestOrder;
  }

  const session = await retrieveStripeCheckoutSession(latestOrder.stripe_checkout_session_id);

  if (session.payment_status === "paid") {
    await markIdentityVerificationOrderStatus(
      latestOrder.id,
      "paid",
      typeof session.payment_intent === "string" ? session.payment_intent : null
    );

    return {
      ...latestOrder,
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paid_at: new Date().toISOString()
    } as IdentityVerificationOrder;
  }

  if (session.status === "expired") {
    await markIdentityVerificationOrderStatus(latestOrder.id, "canceled");

    return {
      ...latestOrder,
      status: "canceled"
    } as IdentityVerificationOrder;
  }

  return latestOrder;
}

export async function reconcileIdentityVerificationProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "email_notifications, verification_status, verification_requested_at, verified_at, stripe_identity_verification_session_id, stripe_identity_session_status, stripe_identity_last_error_code, stripe_identity_last_error_reason"
    )
    .eq("id", userId)
    .maybeSingle();

  const profile = (data as VerificationProfileSnapshot | null) ?? null;

  if (
    !profile ||
    !profile.stripe_identity_verification_session_id ||
    !isStripeConfigured()
  ) {
    return profile;
  }

  try {
    const session = await retrieveStripeIdentityVerificationSession(
      profile.stripe_identity_verification_session_id
    );

    const nextProfile: VerificationProfileSnapshot = {
      ...profile,
      verification_status:
        session.status === "verified"
          ? "verified"
          : session.status === "processing"
            ? "pending"
            : "unverified",
      verification_requested_at:
        session.status === "processing"
          ? profile.verification_requested_at ?? new Date().toISOString()
          : null,
      verified_at:
        session.status === "verified"
          ? profile.verified_at ?? new Date().toISOString()
          : null,
      stripe_identity_session_status: session.status,
      stripe_identity_last_error_code: session.last_error?.code ?? null,
      stripe_identity_last_error_reason: session.last_error?.reason ?? null
    };

    const hasChanges =
      nextProfile.verification_status !== profile.verification_status ||
      nextProfile.verification_requested_at !== profile.verification_requested_at ||
      nextProfile.verified_at !== profile.verified_at ||
      nextProfile.stripe_identity_session_status !== profile.stripe_identity_session_status ||
      nextProfile.stripe_identity_last_error_code !== profile.stripe_identity_last_error_code ||
      nextProfile.stripe_identity_last_error_reason !== profile.stripe_identity_last_error_reason;

    if (hasChanges && isSupabaseServiceRoleConfigured()) {
      const serviceSupabase = createServiceRoleSupabaseClient();
      const { error: updateError } = await serviceSupabase
        .from("profiles")
        .update({
          verification_status: nextProfile.verification_status,
          verification_requested_at: nextProfile.verification_requested_at,
          verified_at: nextProfile.verified_at,
          stripe_identity_verification_session_id: profile.stripe_identity_verification_session_id,
          stripe_identity_session_status: nextProfile.stripe_identity_session_status,
          stripe_identity_last_error_code: nextProfile.stripe_identity_last_error_code,
          stripe_identity_last_error_reason: nextProfile.stripe_identity_last_error_reason
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to reconcile identity verification profile:", updateError);
      }
    }

    return nextProfile;
  } catch {
    return profile;
  }
}
