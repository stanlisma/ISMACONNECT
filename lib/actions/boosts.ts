"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { getBoostProduct } from "@/lib/boost-products";
import {
  activateBoostOrder,
  attachStripeSessionToBoostOrder,
  createPendingBoostOrder,
  getBoostRevalidationPaths,
  markBoostOrderStatus
} from "@/lib/boosts";
import { getBaseUrl, canUseDemoPayments, isStripeConfigured } from "@/lib/env";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { getEditableListing } from "@/lib/data";
import { formatDate } from "@/lib/utils";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function startBoostCheckoutAction(listingId: string, productKey: string) {
  const viewer = await requireViewer();
  const listing = await getEditableListing(listingId);

  if (!listing || listing.owner_id !== viewer.user.id) {
    redirectWithMessage("/dashboard", "error", "You do not have access to promote this listing.");
  }

  if (listing.status !== "active") {
    redirectWithMessage(
      `/dashboard/listings/${listing.id}/boost`,
      "error",
      "Only active listings can be promoted right now."
    );
  }

  const product = getBoostProduct(productKey);

  if (!product) {
    redirectWithMessage(
      `/dashboard/listings/${listing.id}/boost`,
      "error",
      "That boost product is not available."
    );
  }

  const orderId = crypto.randomUUID();

  if (!isStripeConfigured()) {
    if (!canUseDemoPayments()) {
      redirectWithMessage(
        `/dashboard/listings/${listing.id}/boost`,
        "error",
        "Boost checkout is not configured yet. Add Stripe keys to go live."
      );
    }

    await createPendingBoostOrder({
      id: orderId,
      listing,
      ownerId: viewer.user.id,
      product,
      provider: "demo"
    });

    const updatedListing = await activateBoostOrder({ orderId });

    getBoostRevalidationPaths(updatedListing).forEach((path) => {
      revalidatePath(path);
    });

    redirectWithMessage(
      `/dashboard/listings/${listing.id}/boost`,
      "success",
      `${product.name} activated in demo mode until ${
        updatedListing.featured_until || updatedListing.boosted_until || updatedListing.urgent_until
          ? formatDate(
              updatedListing.featured_until ||
                updatedListing.boosted_until ||
                (updatedListing.urgent_until as string)
            )
          : "later"
      }.`
    );
  }

  await createPendingBoostOrder({
    id: orderId,
    listing,
    ownerId: viewer.user.id,
    product,
    provider: "stripe"
  });

  let session: Awaited<ReturnType<typeof createStripeCheckoutSession>>;

  try {
    const baseUrl = getBaseUrl();
    session = await createStripeCheckoutSession({
      amountCents: product.amountCents,
      currency: product.currency,
      name: `${product.name} for ${listing.title}`,
      description: product.description,
      successUrl: `${baseUrl}/dashboard/listings/${listing.id}/boost?success=Payment%20received.%20We%27ll%20activate%20your%20boost%20as%20soon%20as%20Stripe%20confirms%20it.&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard/listings/${listing.id}/boost?error=Checkout%20was%20canceled.`,
      metadata: {
        boost_order_id: orderId,
        listing_id: listing.id,
        owner_id: viewer.user.id,
        product_key: product.key
      }
    });

    await attachStripeSessionToBoostOrder(orderId, session.id);
  } catch (error) {
    await markBoostOrderStatus(orderId, "failed");

    redirectWithMessage(
      `/dashboard/listings/${listing.id}/boost`,
      "error",
      error instanceof Error ? error.message : "Could not start Stripe checkout."
    );
  }

  if (!session.url) {
    await markBoostOrderStatus(orderId, "failed", session.payment_intent ?? null);

    redirectWithMessage(
      `/dashboard/listings/${listing.id}/boost`,
      "error",
      "Stripe checkout did not return a redirect URL."
    );
  }

  redirect(session.url);
}
