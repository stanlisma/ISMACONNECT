"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canViewerRateSeller, getViewerSellerReview } from "@/lib/trust";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function requestSellerVerificationAction() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", viewer.user.id)
    .single();

  if (!profile) {
    redirectWithMessage("/settings", "error", "Your profile could not be loaded.");
  }

  if (profile.verification_status === "verified") {
    redirectWithMessage("/settings", "success", "Your seller verification is already active.");
  }

  if (profile.verification_status === "pending") {
    redirectWithMessage("/settings", "success", "Your verification request is already pending review.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: "pending",
      verification_requested_at: new Date().toISOString(),
      verified_at: null
    })
    .eq("id", viewer.user.id);

  if (error) {
    redirectWithMessage("/settings", "error", error.message);
  }

  revalidatePath("/account");
  revalidatePath("/settings");
  revalidatePath("/admin/moderation");

  redirectWithMessage("/settings", "success", "Verification request submitted.");
}

export async function reviewVerificationRequestAction(
  profileId: string,
  decision: "approve" | "reject"
) {
  await requireAdminViewer();
  const supabase = await createServerSupabaseClient();

  const updates =
    decision === "approve"
      ? {
          verification_status: "verified",
          verified_at: new Date().toISOString()
        }
      : {
          verification_status: "unverified",
          verified_at: null
        };

  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      verification_requested_at: null
    })
    .eq("id", profileId);

  if (error) {
    redirectWithMessage("/admin/moderation", "error", error.message);
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/account");
  revalidatePath("/settings");
  revalidatePath("/admin/moderation");

  redirectWithMessage(
    "/admin/moderation",
    "success",
    decision === "approve"
      ? "Seller verification approved."
      : "Verification request declined."
  );
}

export async function submitSellerReviewAction(
  listingId: string,
  listingSlug: string,
  sellerId: string,
  formData: FormData
) {
  const viewer = await requireViewer();

  if (viewer.user.id === sellerId) {
    redirectWithMessage(`/listings/${listingSlug}`, "error", "You cannot rate your own listing.");
  }

  const rating = Number(formData.get("rating"));
  const rawComment = String(formData.get("comment") ?? "").trim();
  const comment = rawComment || null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirectWithMessage(`/listings/${listingSlug}`, "error", "Choose a rating from 1 to 5.");
  }

  if (comment && (comment.length < 10 || comment.length > 280)) {
    redirectWithMessage(
      `/listings/${listingSlug}`,
      "error",
      "Review comments must be between 10 and 280 characters."
    );
  }

  const existingReview = await getViewerSellerReview(listingId, viewer.user.id);

  if (existingReview) {
    redirectWithMessage(`/listings/${listingSlug}`, "error", "You already rated this listing.");
  }

  const canRate = await canViewerRateSeller(listingId, viewer.user.id, sellerId);

  if (!canRate) {
    redirectWithMessage(
      `/listings/${listingSlug}`,
      "error",
      "Rate sellers after you have contacted them through ISMACONNECT."
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("slug, category")
    .eq("id", listingId)
    .single();

  const { error } = await supabase.from("seller_reviews").insert({
    listing_id: listingId,
    seller_id: sellerId,
    reviewer_id: viewer.user.id,
    rating,
    comment
  });

  if (error) {
    const duplicateMessage =
      error.code === "23505"
        ? "You already rated this listing."
        : error.message || "Could not submit your rating.";

    redirectWithMessage(`/listings/${listingSlug}`, "error", duplicateMessage);
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard/saved");
  revalidatePath("/account");
  revalidatePath(`/listings/${listingSlug}`);

  if (listing?.category) {
    revalidatePath(`/categories/${listing.category}`);
  }

  redirectWithMessage(`/listings/${listingSlug}`, "success", "Thanks for rating this seller.");
}
