import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BOOST_PRODUCTS,
  getBoostProduct,
  getListingBoostState,
  type BoostProduct,
  type BoostProductKey
} from "@/lib/boost-products";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { Listing, ListingBoostOrder } from "@/types/database";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isBoostSchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    message.includes("listing_boost_orders") ||
    message.includes("boost_order_status") ||
    message.includes("expire_listing_promotions") ||
    message.includes("boosted_at") ||
    message.includes("boosted_until") ||
    message.includes("is_urgent") ||
    message.includes("urgent_until")
  );
}

function getBoostSchemaErrorMessage() {
  return "Boost database schema is not installed yet. Run 202605030003_featured_boosts.sql in Supabase.";
}

export function getBoostProducts() {
  return BOOST_PRODUCTS;
}

export function getPromotionChips(listing: Listing) {
  const { featuredActive, urgentActive, boostedActive } = getListingBoostState(listing);

  return [
    featuredActive ? "Featured" : null,
    urgentActive ? "Urgent" : null,
    boostedActive ? "Boosted" : null
  ].filter(Boolean) as string[];
}

function extendExpiry(currentValue: string | null | undefined, durationDays: number, now: Date) {
  const currentTime = currentValue ? new Date(currentValue).getTime() : 0;
  const baseTime = currentTime > now.getTime() ? currentTime : now.getTime();

  return new Date(baseTime + durationDays * DAY_IN_MS).toISOString();
}

function latestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export async function expireListingPromotions(supabase?: SupabaseClient) {
  const client = supabase ?? (await createServerSupabaseClient());
  const { error } = await client.rpc("expire_listing_promotions");

  if (error && !isBoostSchemaError(error)) {
    throw new Error(error.message);
  }
}

export async function getUserBoostOrders(userId: string) {
  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const { data, error } = await supabase
    .from("listing_boost_orders")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isBoostSchemaError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data || []) as ListingBoostOrder[];
}

export async function getListingBoostOrders(listingId: string, ownerId: string) {
  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const { data, error } = await supabase
    .from("listing_boost_orders")
    .select("*")
    .eq("listing_id", listingId)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isBoostSchemaError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data || []) as ListingBoostOrder[];
}

export async function createPendingBoostOrder(params: {
  id: string;
  listing: Listing;
  ownerId: string;
  product: BoostProduct;
  provider: "stripe" | "demo" | "manual";
  stripeCheckoutSessionId?: string | null;
}) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const { id, listing, ownerId, product, provider, stripeCheckoutSessionId } = params;

  const { data, error } = await serviceSupabase
    .from("listing_boost_orders")
    .insert({
      id,
      listing_id: listing.id,
      owner_id: ownerId,
      product_key: product.key,
      product_name: product.name,
      product_description: product.description,
      amount_cents: product.amountCents,
      currency: product.currency,
      provider,
      status: "pending",
      stripe_checkout_session_id: stripeCheckoutSessionId ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error
        ? isBoostSchemaError(error)
          ? getBoostSchemaErrorMessage()
          : error.message
        : "Could not create the boost order."
    );
  }

  return data as ListingBoostOrder;
}

export async function attachStripeSessionToBoostOrder(orderId: string, sessionId: string) {
  const serviceSupabase = createServiceRoleSupabaseClient();

  const { error } = await serviceSupabase
    .from("listing_boost_orders")
    .update({
      stripe_checkout_session_id: sessionId
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(isBoostSchemaError(error) ? getBoostSchemaErrorMessage() : error.message);
  }
}

export async function markBoostOrderStatus(
  orderId: string,
  status: "canceled" | "failed",
  stripePaymentIntentId?: string | null
) {
  const serviceSupabase = createServiceRoleSupabaseClient();

  await serviceSupabase
    .from("listing_boost_orders")
    .update({
      status,
      stripe_payment_intent_id: stripePaymentIntentId ?? null
    })
    .eq("id", orderId);
}

export async function getBoostOrderById(orderId: string) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data } = await serviceSupabase
    .from("listing_boost_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  return (data as ListingBoostOrder | null) ?? null;
}

export function getBoostRevalidationPaths(listing: Listing) {
  return Array.from(
    new Set([
      "/",
      "/browse",
      "/dashboard",
      "/dashboard/boosts",
      `/dashboard/listings/${listing.id}/boost`,
      `/categories/${listing.category}`,
      `/listings/${listing.slug}`
    ])
  );
}

export async function activateBoostOrder(params: {
  orderId: string;
  stripePaymentIntentId?: string | null;
}) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const order = await getBoostOrderById(params.orderId);

  if (!order) {
    throw new Error("That boost order could not be found.");
  }

  if (order.status === "active") {
    const { data: existingListing } = await serviceSupabase
      .from("listings")
      .select("*")
      .eq("id", order.listing_id)
      .single();

    return existingListing as Listing;
  }

  const product = getBoostProduct(order.product_key);

  if (!product) {
    throw new Error("That boost product is not supported.");
  }

  const { data: listing, error: listingError } = await serviceSupabase
    .from("listings")
    .select("*")
    .eq("id", order.listing_id)
    .single();

  if (listingError || !listing) {
    throw new Error(listingError?.message || "Could not load the listing for boost activation.");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const updates: Record<string, string | boolean | null> = {};

  if (product.featuredDays) {
    updates.is_featured = true;
    updates.featured_until = extendExpiry(listing.featured_until, product.featuredDays, now);
  }

  if (product.boostDays) {
    updates.boosted_at = nowIso;
    updates.boosted_until = extendExpiry(listing.boosted_until, product.boostDays, now);
  }

  if (product.urgentDays) {
    updates.is_urgent = true;
    updates.urgent_until = extendExpiry(listing.urgent_until, product.urgentDays, now);
  }

  if (order.stripe_checkout_session_id) {
    updates.stripe_checkout_session_id = order.stripe_checkout_session_id;
  }

  const expiresAt = latestTimestamp([
    updates.featured_until as string | null | undefined,
    updates.boosted_until as string | null | undefined,
    updates.urgent_until as string | null | undefined
  ]);

  const { data: updatedListing, error: updateError } = await serviceSupabase
    .from("listings")
    .update(updates)
    .eq("id", listing.id)
    .select("*")
    .single();

  if (updateError || !updatedListing) {
    throw new Error(updateError?.message || "Could not activate the listing boost.");
  }

  const { error: orderError } = await serviceSupabase
    .from("listing_boost_orders")
    .update({
      status: "active",
      applied_at: nowIso,
      expires_at: expiresAt,
      stripe_payment_intent_id: params.stripePaymentIntentId ?? order.stripe_payment_intent_id ?? null
    })
    .eq("id", order.id);

  if (orderError) {
    throw new Error(orderError.message);
  }

  return updatedListing as Listing;
}

export async function getBoostListingOverview(userId: string) {
  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const [listingsResult, ordersResult] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("listing_boost_orders")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
  ]);

  return {
    listings: (listingsResult.data || []) as Listing[],
    orders: ordersResult.error && isBoostSchemaError(ordersResult.error)
      ? []
      : ((ordersResult.data || []) as ListingBoostOrder[])
  };
}

export async function findBoostOrderByStripeSession(
  orderId: string | null | undefined,
  stripeCheckoutSessionId: string | null | undefined
) {
  const serviceSupabase = createServiceRoleSupabaseClient();

  if (orderId) {
    const { data } = await serviceSupabase
      .from("listing_boost_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (data) {
      return data as ListingBoostOrder;
    }
  }

  if (!stripeCheckoutSessionId) {
    return null;
  }

  const { data } = await serviceSupabase
    .from("listing_boost_orders")
    .select("*")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .maybeSingle();

  return (data as ListingBoostOrder | null) ?? null;
}

export function getBoostProductPriceLabel(productKey: BoostProductKey | string) {
  const product = getBoostProduct(productKey);

  if (!product) {
    return null;
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: product.currency.toUpperCase(),
    maximumFractionDigits: 2
  }).format(product.amountCents / 100);
}
