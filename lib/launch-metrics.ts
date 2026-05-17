import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ListingCategory } from "@/types/database";

type MetricsSupabase =
  | ReturnType<typeof createServiceRoleSupabaseClient>
  | Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface SoftLaunchSnapshot {
  recentListingCount: number;
  freshListingCount: number;
  staleListingCount: number;
  recentNeedCount: number;
  recentOfferCount: number;
  respondedListingCount: number;
  conversationCount: number;
  responseRate: number;
  averageConversationsPerRespondedListing: number;
  uniquePosterCount: number;
  repeatPosterCount: number;
  repeatPosterRate: number;
  savedSearchCount: number;
  savedSearchUserCount: number;
  activeSavedSearchUserCount: number;
  unansweredNeedCount: number;
  staleUnansweredCount: number;
  heroCategoryCounts: Array<{
    category: ListingCategory;
    count: number;
  }>;
  heroCategoryResponseCounts: Array<{
    category: ListingCategory;
    count: number;
  }>;
}

const HERO_CATEGORY_ORDER: ListingCategory[] = ["ride-share", "services", "rentals", "jobs", "buy-sell"];

function getWindowStart(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function asPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

async function getMetricsSupabase(): Promise<MetricsSupabase> {
  if (isSupabaseServiceRoleConfigured()) {
    return createServiceRoleSupabaseClient();
  }

  return createServerSupabaseClient();
}

export async function getSoftLaunchSnapshot(): Promise<SoftLaunchSnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      recentListingCount: 0,
      freshListingCount: 0,
      staleListingCount: 0,
      recentNeedCount: 0,
      recentOfferCount: 0,
      respondedListingCount: 0,
      conversationCount: 0,
      responseRate: 0,
      averageConversationsPerRespondedListing: 0,
      uniquePosterCount: 0,
      repeatPosterCount: 0,
      repeatPosterRate: 0,
      savedSearchCount: 0,
      savedSearchUserCount: 0,
      activeSavedSearchUserCount: 0,
      unansweredNeedCount: 0,
      staleUnansweredCount: 0,
      heroCategoryCounts: HERO_CATEGORY_ORDER.map((category) => ({ category, count: 0 })),
      heroCategoryResponseCounts: HERO_CATEGORY_ORDER.map((category) => ({ category, count: 0 }))
    };
  }

  const supabase = await getMetricsSupabase();
  const listingsWindowStart = getWindowStart(30);
  const freshWindowStart = getWindowStart(7);
  const staleWindowStart = getWindowStart(14);
  const savedSearchActivityWindowStart = getWindowStart(14);

  const [recentListingsResult, savedSearchesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("id, owner_id, category, created_at, status, listing_intent")
      .gte("created_at", listingsWindowStart),
    supabase
      .from("saved_searches")
      .select("user_id, created_at, last_checked_at")
  ]);

  if (recentListingsResult.error) {
    console.error("Soft launch listing metrics failed:", recentListingsResult.error.message);
  }

  if (savedSearchesResult.error) {
    console.error("Soft launch saved-search metrics failed:", savedSearchesResult.error.message);
  }

  const recentListings =
    ((recentListingsResult.data ?? []) as Array<{
      id: string;
      owner_id: string;
      category: ListingCategory;
      created_at: string;
      status: string;
      listing_intent: "offer" | "need" | null;
    }>).filter((listing) => listing.status !== "removed");

  const conversationsResult = recentListings.length
    ? await supabase
        .from("conversations")
        .select("listing_id")
        .in("listing_id", recentListings.map((listing) => listing.id))
    : { data: [], error: null };

  if (conversationsResult.error) {
    console.error("Soft launch conversation metrics failed:", conversationsResult.error.message);
  }

  const respondedListingIds = new Set(
    ((conversationsResult.data ?? []) as Array<{ listing_id: string | null }>)
      .map((conversation) => conversation.listing_id)
      .filter(Boolean) as string[]
  );
  const conversationCount = (conversationsResult.data ?? []).length;
  const respondedListings = recentListings.filter((listing) => respondedListingIds.has(listing.id));
  const freshListings = recentListings.filter((listing) => listing.created_at >= freshWindowStart);
  const staleListings = recentListings.filter((listing) => listing.created_at < staleWindowStart);

  const posterCounts = new Map<string, number>();
  recentListings.forEach((listing) => {
    posterCounts.set(listing.owner_id, (posterCounts.get(listing.owner_id) ?? 0) + 1);
  });

  const repeatPosterCount = Array.from(posterCounts.values()).filter((count) => count > 1).length;

  const savedSearchRows = (savedSearchesResult.data ?? []) as Array<{
    user_id: string;
    created_at: string;
    last_checked_at: string | null;
  }>;

  const activeSavedSearchUserCount = new Set(
    savedSearchRows.flatMap((savedSearch) => {
      const activityAt = savedSearch.last_checked_at ?? savedSearch.created_at;
      return activityAt >= savedSearchActivityWindowStart ? [savedSearch.user_id] : [];
    })
  ).size;

  return {
    recentListingCount: recentListings.length,
    freshListingCount: freshListings.length,
    staleListingCount: staleListings.length,
    recentNeedCount: recentListings.filter((listing) => listing.listing_intent === "need").length,
    recentOfferCount: recentListings.filter((listing) => listing.listing_intent !== "need").length,
    respondedListingCount: respondedListingIds.size,
    conversationCount,
    responseRate: asPercent(respondedListingIds.size, recentListings.length),
    averageConversationsPerRespondedListing: respondedListingIds.size
      ? Number((conversationCount / respondedListingIds.size).toFixed(1))
      : 0,
    uniquePosterCount: posterCounts.size,
    repeatPosterCount,
    repeatPosterRate: asPercent(repeatPosterCount, posterCounts.size),
    savedSearchCount: savedSearchRows.length,
    savedSearchUserCount: new Set(savedSearchRows.map((savedSearch) => savedSearch.user_id)).size,
    activeSavedSearchUserCount,
    unansweredNeedCount: recentListings.filter(
      (listing) => listing.listing_intent === "need" && !respondedListingIds.has(listing.id)
    ).length,
    staleUnansweredCount: recentListings.filter(
      (listing) => listing.created_at < staleWindowStart && !respondedListingIds.has(listing.id)
    ).length,
    heroCategoryCounts: HERO_CATEGORY_ORDER.map((category) => ({
      category,
      count: recentListings.filter((listing) => listing.category === category).length
    })),
    heroCategoryResponseCounts: HERO_CATEGORY_ORDER.map((category) => ({
      category,
      count: respondedListings.filter((listing) => listing.category === category).length
    }))
  };
}
