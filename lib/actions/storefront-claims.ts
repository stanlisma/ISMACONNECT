"use server";

import { revalidatePath } from "next/cache";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import {
  sendStorefrontClaimAdminEmail,
  sendStorefrontClaimApprovedEmail,
  sendStorefrontClaimRejectedEmail
} from "@/lib/email";
import { isEmailConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { redirectWithMessage } from "@/lib/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const ADMIN_CLAIMS_PATH = "/admin/claims";

async function createClaimsMutationClient() {
  return isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();
}

export async function submitStorefrontClaimAction(storefrontId: string, formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: storefront } = await supabase
    .from("business_storefronts")
    .select("id, owner_id, name, claimed")
    .eq("id", storefrontId)
    .maybeSingle();

  if (!storefront) {
    redirectWithMessage("/businesses", "error", "That business could not be found.");
  }

  const returnPath = `${buildStorefrontHref(storefront.owner_id, storefront.id)}`;

  if (storefront.claimed) {
    redirectWithMessage(returnPath, "error", "This business has already been claimed.");
  }

  const message = String(formData.get("message") ?? "").trim().slice(0, 500) || null;

  const { error } = await supabase.from("business_storefront_claims").insert({
    storefront_id: storefront.id,
    claimant_id: viewer.user.id,
    message
  });

  if (error) {
    if (error.code === "23505") {
      redirectWithMessage(returnPath, "success", "You already have a pending claim on this business - we'll review it soon.");
    }

    redirectWithMessage(returnPath, "error", error.message);
  }

  if (isEmailConfigured()) {
    try {
      await sendStorefrontClaimAdminEmail({
        businessName: storefront.name,
        claimantName: viewer.profile.full_name,
        claimantEmail: viewer.user.email ?? "(no email on file)",
        message
      });
    } catch (emailError) {
      console.error("Failed to send storefront claim admin notification:", emailError);
    }
  }

  redirectWithMessage(returnPath, "success", "Claim submitted - we'll review it and get back to you soon.");
}

export async function approveStorefrontClaimAction(claimId: string) {
  const viewer = await requireAdminViewer();
  const supabase = await createClaimsMutationClient();

  const { data: claim } = await supabase
    .from("business_storefront_claims")
    .select("id, storefront_id, claimant_id, status")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", "That claim could not be found.");
  }

  if (claim.status !== "pending") {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", "That claim has already been reviewed.");
  }

  const { data: storefront } = await supabase
    .from("business_storefronts")
    .select("id, owner_id, name")
    .eq("id", claim.storefront_id)
    .maybeSingle();

  if (!storefront) {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", "That business could not be found.");
  }

  const previousOwnerId = storefront.owner_id;

  const { error: storefrontError } = await supabase
    .from("business_storefronts")
    .update({ owner_id: claim.claimant_id, claimed: true })
    .eq("id", storefront.id);

  if (storefrontError) {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", storefrontError.message);
  }

  const { error: listingsError } = await supabase
    .from("listings")
    .update({ owner_id: claim.claimant_id })
    .eq("storefront_id", storefront.id);

  if (listingsError) {
    console.error("Failed to transfer listings on claim approval:", listingsError);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_business: true })
    .eq("id", claim.claimant_id);

  if (profileError) {
    console.error("Failed to mark claimant profile as business:", profileError);
  }

  const now = new Date().toISOString();

  const { error: claimError } = await supabase
    .from("business_storefront_claims")
    .update({ status: "approved", reviewed_by: viewer.user.id, reviewed_at: now })
    .eq("id", claimId);

  if (claimError) {
    console.error("Failed to mark claim approved:", claimError);
  }

  const { error: otherClaimsError } = await supabase
    .from("business_storefront_claims")
    .update({
      status: "rejected",
      rejection_reason: "This business was claimed by another user.",
      reviewed_by: viewer.user.id,
      reviewed_at: now
    })
    .eq("storefront_id", storefront.id)
    .eq("status", "pending")
    .neq("id", claimId);

  if (otherClaimsError) {
    console.error("Failed to reject competing claims:", otherClaimsError);
  }

  if (isEmailConfigured()) {
    try {
      const { data: claimantProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", claim.claimant_id)
        .maybeSingle();

      if (claimantProfile?.email) {
        await sendStorefrontClaimApprovedEmail({
          to: claimantProfile.email,
          recipientName: claimantProfile.full_name,
          businessName: storefront.name
        });
      }
    } catch (emailError) {
      console.error("Failed to send storefront claim approved email:", emailError);
    }
  }

  revalidatePath(ADMIN_CLAIMS_PATH);
  revalidatePath("/businesses");
  revalidatePath("/dashboard/storefronts");
  revalidatePath(buildStorefrontHref(previousOwnerId, storefront.id));
  revalidatePath(buildStorefrontHref(claim.claimant_id, storefront.id));
  redirectWithMessage(ADMIN_CLAIMS_PATH, "success", `Claim approved - ${storefront.name} transferred to the claimant.`);
}

export async function rejectStorefrontClaimAction(claimId: string, formData: FormData) {
  const viewer = await requireAdminViewer();
  const supabase = await createClaimsMutationClient();

  const { data: claim } = await supabase
    .from("business_storefront_claims")
    .select("id, storefront_id, claimant_id, status")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", "That claim could not be found.");
  }

  if (claim.status !== "pending") {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", "That claim has already been reviewed.");
  }

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;

  const { error } = await supabase
    .from("business_storefront_claims")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: viewer.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", claimId);

  if (error) {
    redirectWithMessage(ADMIN_CLAIMS_PATH, "error", error.message);
  }

  if (isEmailConfigured()) {
    try {
      const [{ data: claimantProfile }, { data: storefront }] = await Promise.all([
        supabase.from("profiles").select("email, full_name").eq("id", claim.claimant_id).maybeSingle(),
        supabase.from("business_storefronts").select("name").eq("id", claim.storefront_id).maybeSingle()
      ]);

      if (claimantProfile?.email && storefront?.name) {
        await sendStorefrontClaimRejectedEmail({
          to: claimantProfile.email,
          recipientName: claimantProfile.full_name,
          businessName: storefront.name,
          reason
        });
      }
    } catch (emailError) {
      console.error("Failed to send storefront claim rejected email:", emailError);
    }
  }

  revalidatePath(ADMIN_CLAIMS_PATH);
  redirectWithMessage(ADMIN_CLAIMS_PATH, "success", "Claim rejected.");
}
