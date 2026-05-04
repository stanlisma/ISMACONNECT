"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { getBaseUrl, isStripeWebhookConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createStripeIdentityVerificationSession,
  retrieveStripeIdentityVerificationSession
} from "@/lib/stripe";
import { canViewerRateSeller, getViewerSellerReview } from "@/lib/trust";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function requestSellerVerificationAction() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "verification_status, stripe_identity_verification_session_id, stripe_identity_session_status"
    )
    .eq("id", viewer.user.id)
    .single();

  if (!profile) {
    redirectWithMessage("/settings", "error", "Your profile could not be loaded.");
  }

  if (!isStripeWebhookConfigured()) {
    redirectWithMessage(
      "/settings",
      "error",
      "Stripe Identity is not configured yet. Add Stripe keys and webhook settings first."
    );
  }

  if (profile.verification_status === "verified") {
    redirectWithMessage("/settings", "success", "Your seller verification is already active.");
  }

  let existingSession:
    | Awaited<ReturnType<typeof retrieveStripeIdentityVerificationSession>>
    | null = null;

  if (profile.stripe_identity_verification_session_id) {
    try {
      existingSession = await retrieveStripeIdentityVerificationSession(
        profile.stripe_identity_verification_session_id
      );
    } catch {
      // Fall through and create a fresh session if Stripe no longer accepts the previous one.
    }
  }

  if (existingSession?.status === "verified") {
    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: "verified",
        verification_requested_at: null,
        verified_at: new Date().toISOString(),
        stripe_identity_session_status: existingSession.status,
        stripe_identity_last_error_code: null,
        stripe_identity_last_error_reason: null
      })
      .eq("id", viewer.user.id);

    if (error) {
      redirectWithMessage("/settings", "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/account");
    revalidatePath("/settings");

    redirectWithMessage(
      "/settings",
      "success",
      "Your seller verification is already complete."
    );
  }

  if (
    existingSession &&
    (existingSession.status === "processing" || existingSession.status === "requires_input")
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
        verification_requested_at: new Date().toISOString(),
        verified_at: null,
        stripe_identity_session_status: existingSession.status,
        stripe_identity_last_error_code: existingSession.last_error?.code ?? null,
        stripe_identity_last_error_reason: existingSession.last_error?.reason ?? null
      })
      .eq("id", viewer.user.id);

    if (error) {
      redirectWithMessage("/settings", "error", error.message);
    }

    if (existingSession.url) {
      redirect(existingSession.url);
    }

    redirectWithMessage(
      "/settings",
      "success",
      existingSession.status === "processing"
        ? "Stripe is still processing your document verification."
        : "Continue your Stripe ID verification."
    );
  }

  let session;

  try {
    session = await createStripeIdentityVerificationSession({
      userId: viewer.user.id,
      returnUrl: `${getBaseUrl()}/settings?success=${encodeURIComponent(
        "Verification submitted. We will update your badge after Stripe finishes processing."
      )}`
    });
  } catch (error) {
    redirectWithMessage(
      "/settings",
      "error",
      error instanceof Error ? error.message : "Could not start Stripe ID verification."
    );
  }

  if (!session.url) {
    redirectWithMessage(
      "/settings",
      "error",
      "Stripe Identity did not return a redirect URL."
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: "pending",
      verification_requested_at: new Date().toISOString(),
      verified_at: null,
      stripe_identity_verification_session_id: session.id,
      stripe_identity_session_status: session.status,
      stripe_identity_last_error_code: session.last_error?.code ?? null,
      stripe_identity_last_error_reason: session.last_error?.reason ?? null
    })
    .eq("id", viewer.user.id);

  if (error) {
    redirectWithMessage("/settings", "error", error.message);
  }

  revalidatePath("/account");
  revalidatePath("/settings");
  revalidatePath("/admin/moderation");

  redirect(session.url);
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
