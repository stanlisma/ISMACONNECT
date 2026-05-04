const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";

export function getBaseUrl() {
  return appUrl.replace(/\/$/, "");
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function isSupabaseServiceRoleConfigured() {
  return Boolean(isSupabaseConfigured() && supabaseServiceRoleKey);
}

export function getSupabaseEnv() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey
  };
}

export function getSupabaseServiceRoleEnv() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(
      "Missing Supabase service role environment variable. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey
  };
}

export function isStripeConfigured() {
  return Boolean(stripePublishableKey && stripeSecretKey);
}

export function isStripeWebhookConfigured() {
  return Boolean(isStripeConfigured() && stripeWebhookSecret);
}

export function getStripeEnv() {
  if (!isStripeConfigured()) {
    throw new Error(
      "Missing Stripe environment variables. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY."
    );
  }

  return {
    stripePublishableKey,
    stripeSecretKey
  };
}

export function getStripeWebhookSecret() {
  if (!stripeWebhookSecret) {
    throw new Error("Missing Stripe webhook secret. Set STRIPE_WEBHOOK_SECRET.");
  }

  return stripeWebhookSecret;
}

export function canUseDemoPayments() {
  return process.env.NODE_ENV !== "production" || getBaseUrl().includes("localhost");
}
