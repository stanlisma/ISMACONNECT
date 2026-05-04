const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const vapidSubject = process.env.VAPID_SUBJECT?.trim() || "";
const resendApiKey = process.env.RESEND_API_KEY?.trim() || "";
const emailFrom = process.env.EMAIL_FROM?.trim() || "";

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

export function isWebPushConfigured() {
  return Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);
}

export function getWebPushEnv() {
  if (!isWebPushConfigured()) {
    throw new Error(
      "Missing web push environment variables. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT."
    );
  }

  return {
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject
  };
}

export function isEmailConfigured() {
  return Boolean(resendApiKey && emailFrom);
}

export function getEmailEnv() {
  if (!isEmailConfigured()) {
    throw new Error(
      "Missing email environment variables. Set RESEND_API_KEY and EMAIL_FROM."
    );
  }

  return {
    resendApiKey,
    emailFrom
  };
}
