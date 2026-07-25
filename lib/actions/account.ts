"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { getViewer, requireViewer } from "@/lib/auth";
import { isEmailConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import {
  sendAccountDeactivatedEmail,
  sendAccountDeletedEmail,
  sendAccountReactivatedEmail
} from "@/lib/email";
import { createMutableServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

async function sendAccountStatusEmailSafely(
  send: () => Promise<void>,
  context: string
) {
  if (!isEmailConfigured()) {
    return;
  }

  try {
    await send();
  } catch (error) {
    console.error(`Failed to send ${context} email:`, error);
  }
}

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

const PERSONAL_DATA_TABLES = ["saved_searches", "saved_listings", "notifications", "push_subscriptions"] as const;

export async function deleteAccountAction(formData: FormData) {
  const viewer = await requireViewer();
  const userId = viewer.user.id;

  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (confirmation !== "DELETE") {
    redirectWithMessage("/settings", "error", 'Type "DELETE" to confirm account deletion.');
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(
      "/settings",
      "error",
      "Account deletion is temporarily unavailable. Please contact support."
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  // Conversations, messages, reviews, and payment/boost records are kept
  // (with an anonymized display name) for dispute and fraud-prevention
  // purposes, matching the data-retention terms in the Privacy Policy.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: "Deleted User",
      phone: null,
      address: null,
      phone_verification_method: null,
      phone_verified_at: null,
      business_name: null,
      business_description: null,
      business_logo_url: null,
      business_website: null,
      service_areas: [],
      business_address: null,
      show_exact_business_location: false,
      business_geocoded_lat: null,
      business_geocoded_lng: null,
      business_geocoded_area: null,
      business_geocoded_formatted_address: null,
      business_geocoded_at: null,
      business_services: [],
      business_hours: {},
      is_business: false,
      email_notifications: false,
      deleted_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (profileError) {
    console.error("Failed to anonymize profile on account deletion:", profileError);
  }

  const { error: listingsError } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("owner_id", userId)
    .eq("status", "active");

  if (listingsError) {
    console.error("Failed to remove listings on account deletion:", listingsError);
  }

  const { error: storefrontsError } = await supabase
    .from("business_storefronts")
    .delete()
    .eq("owner_id", userId);

  if (storefrontsError) {
    console.error("Failed to remove storefronts on account deletion:", storefrontsError);
  }

  await Promise.all(
    PERSONAL_DATA_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);

      if (error) {
        console.error(`Failed to clear ${table} on account deletion:`, error);
      }
    })
  );

  const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
    password: randomUUID()
  });

  if (banError) {
    console.error("Failed to lock auth account on account deletion:", banError);
    redirectWithMessage(
      "/settings",
      "error",
      "Your data was removed, but we could not fully lock your account. Please contact support."
    );
  }

  if (viewer.user.email) {
    await sendAccountStatusEmailSafely(
      () => sendAccountDeletedEmail({ to: viewer.user.email!, recipientName: viewer.profile.full_name }),
      "account deleted"
    );
  }

  const mutableSupabase = await createMutableServerSupabaseClient();
  await mutableSupabase.auth.signOut();

  redirect("/account-deleted");
}

export async function deactivateAccountAction() {
  const viewer = await requireViewer();
  const userId = viewer.user.id;

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(
      "/settings",
      "error",
      "Account deactivation is temporarily unavailable. Please contact support."
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) {
    console.error("Failed to deactivate profile:", profileError);
  }

  const { error: listingsError } = await supabase
    .from("listings")
    .update({ status: "paused" })
    .eq("owner_id", userId)
    .eq("status", "active");

  if (listingsError) {
    console.error("Failed to pause listings on deactivation:", listingsError);
  }

  const { error: storefrontsError } = await supabase
    .from("business_storefronts")
    .update({ is_active: false })
    .eq("owner_id", userId);

  if (storefrontsError) {
    console.error("Failed to hide storefronts on deactivation:", storefrontsError);
  }

  if (viewer.user.email) {
    await sendAccountStatusEmailSafely(
      () => sendAccountDeactivatedEmail({ to: viewer.user.email!, recipientName: viewer.profile.full_name }),
      "account deactivated"
    );
  }

  const mutableSupabase = await createMutableServerSupabaseClient();
  await mutableSupabase.auth.signOut();

  redirectWithMessage(
    "/auth/sign-in",
    "success",
    "Your account is deactivated. Sign back in anytime to reactivate it."
  );
}

export async function reactivateAccountAction() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth/sign-in");
  }

  const userId = viewer.user.id;

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(
      "/account/reactivate",
      "error",
      "Reactivation is temporarily unavailable. Please contact support."
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ deactivated_at: null })
    .eq("id", userId);

  if (profileError) {
    console.error("Failed to reactivate profile:", profileError);
  }

  const { error: listingsError } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("owner_id", userId)
    .eq("status", "paused");

  if (listingsError) {
    console.error("Failed to restore listings on reactivation:", listingsError);
  }

  const { error: storefrontsError } = await supabase
    .from("business_storefronts")
    .update({ is_active: true })
    .eq("owner_id", userId);

  if (storefrontsError) {
    console.error("Failed to restore storefronts on reactivation:", storefrontsError);
  }

  if (viewer.user.email) {
    await sendAccountStatusEmailSafely(
      () => sendAccountReactivatedEmail({ to: viewer.user.email!, recipientName: viewer.profile.full_name }),
      "account reactivated"
    );
  }

  redirectWithMessage("/account", "success", "Welcome back! Your account is active again.");
}
