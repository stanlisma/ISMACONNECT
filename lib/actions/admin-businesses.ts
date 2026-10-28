"use server";

import { revalidatePath } from "next/cache";

import { requireAdminViewer } from "@/lib/auth";
import { normalizeBusinessName } from "@/lib/business-storefronts";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { redirectWithMessage } from "@/lib/redirects";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { getSafeInternalPath } from "@/lib/utils";

const ADMIN_BUSINESSES_PATH = "/admin/businesses";

function resolveReturnPath(formData: FormData) {
  const safePath = getSafeInternalPath(String(formData.get("returnPath") ?? ""), ADMIN_BUSINESSES_PATH);
  return safePath.startsWith(ADMIN_BUSINESSES_PATH) ? safePath : ADMIN_BUSINESSES_PATH;
}

function revalidateBusinessSurfaces(ownerId: string) {
  revalidatePath(ADMIN_BUSINESSES_PATH);
  revalidatePath("/businesses");
  revalidatePath("/browse");
  revalidatePath("/");
  revalidatePath(`/sellers/${ownerId}`);
}

// Suspending only hides the business profile (its page, the directory and
// the homepage strip) - it is reversible and leaves listings and the owner's
// account alone.
export async function adminSetBusinessActiveAction(storefrontId: string, active: boolean, formData: FormData) {
  await requireAdminViewer();
  const returnPath = resolveReturnPath(formData);

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(returnPath, "error", "Business moderation is temporarily unavailable.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("business_storefronts")
    .update({ is_active: active })
    .eq("id", storefrontId)
    .select("id, name, owner_id");

  if (error) {
    redirectWithMessage(returnPath, "error", error.message);
  }

  const business = data?.[0];

  if (!business) {
    redirectWithMessage(returnPath, "error", "That business could not be found.");
  }

  revalidateBusinessSurfaces(business.owner_id);
  redirectWithMessage(
    returnPath,
    "success",
    active ? `"${business.name}" restored.` : `"${business.name}" suspended and hidden from the site.`
  );
}

// Permanent. The database detaches the business's listings rather than
// deleting them (listings.storefront_id is ON DELETE SET NULL), and removes
// its claims. If the owner has no business profiles left, business mode is
// switched off on their account, same as when an owner deletes their last one.
export async function adminDeleteBusinessAction(storefrontId: string, formData: FormData) {
  await requireAdminViewer();
  const returnPath = resolveReturnPath(formData);

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(returnPath, "error", "Business moderation is temporarily unavailable.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: deleted, error } = await supabase
    .from("business_storefronts")
    .delete()
    .eq("id", storefrontId)
    .select("id, name, owner_id");

  if (error) {
    redirectWithMessage(returnPath, "error", error.message);
  }

  const business = deleted?.[0];

  if (!business) {
    redirectWithMessage(returnPath, "error", "That business could not be found - it may already be deleted.");
  }

  const { count: remaining } = await supabase
    .from("business_storefronts")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", business.owner_id);

  if ((remaining ?? 0) === 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_business: false })
      .eq("id", business.owner_id);

    if (profileError) {
      console.error("Failed to unmark profile as business (admin delete):", profileError);
    }
  }

  revalidateBusinessSurfaces(business.owner_id);
  redirectWithMessage(returnPath, "success", `"${business.name}" deleted.`);
}

// Collapses accidental repeats: keeps one profile and deletes every other
// profile on the same account with the same name. Listings attached to the
// deleted copies are moved onto the kept profile (same owner, so the
// ownership trigger allows it) instead of being left unlinked.
export async function adminKeepOneBusinessAction(keepStorefrontId: string, formData: FormData) {
  await requireAdminViewer();
  const returnPath = resolveReturnPath(formData);

  if (!isSupabaseServiceRoleConfigured()) {
    redirectWithMessage(returnPath, "error", "Business moderation is temporarily unavailable.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: keep } = await supabase
    .from("business_storefronts")
    .select("id, name, owner_id")
    .eq("id", keepStorefrontId)
    .maybeSingle();

  if (!keep) {
    redirectWithMessage(returnPath, "error", "That business could not be found.");
  }

  const { data: ownerStorefronts, error: loadError } = await supabase
    .from("business_storefronts")
    .select("id, name")
    .eq("owner_id", keep.owner_id);

  if (loadError) {
    redirectWithMessage(returnPath, "error", loadError.message);
  }

  const target = normalizeBusinessName(keep.name);
  const duplicateIds = (ownerStorefronts ?? [])
    .filter((storefront) => storefront.id !== keep.id && normalizeBusinessName(storefront.name) === target)
    .map((storefront) => storefront.id);

  if (duplicateIds.length === 0) {
    redirectWithMessage(returnPath, "error", `"${keep.name}" has no duplicates on this account.`);
  }

  const { error: moveError } = await supabase
    .from("listings")
    .update({ storefront_id: keep.id })
    .in("storefront_id", duplicateIds);

  if (moveError) {
    redirectWithMessage(returnPath, "error", moveError.message);
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("business_storefronts")
    .delete()
    .in("id", duplicateIds)
    .select("id");

  if (deleteError) {
    redirectWithMessage(returnPath, "error", deleteError.message);
  }

  revalidateBusinessSurfaces(keep.owner_id);
  redirectWithMessage(
    returnPath,
    "success",
    `Kept "${keep.name}" and deleted ${deleted?.length ?? 0} duplicate${deleted?.length === 1 ? "" : "s"}.`
  );
}
