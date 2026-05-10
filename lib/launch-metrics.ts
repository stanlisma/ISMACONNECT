import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ListingCategory } from "@/types/database";

type MetricsSupabase =
  | ReturnType<typeof createServiceRoleSupabaseClient>
  | Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface SoftLaunchSnapshot {
  recentListingCount: number;
  respondedListingCount: number;
  responseRate: number;
  uniquePosterCount: number;
  repeatPosterCount: number;
  repeatPosterRate: number;
  savedSearchCount: number;
  savedSearchUserCount: number;
  activeSavedSearchUserCount: number;
  heroCategoryCounts: Array<{
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
      respondedListingCount: 0,
      responseRate: 0,
      uniquePosterCount: 0,
      repeatPosterCount: 0,
      repeatPosterRate: 0,
      savedSearchCount: 0,
      savedSearchUserCount: 0,
      activeSavedSearchUserCount: 0,
      heroCategoryCounts: HERO_CATEGORY_ORDER.map((category) => ({ category, count: 0 }))
    };
  }

  const supabase = await getMetricsSupabase();
  const listingsWindowStart = getWindowStart(30);
  const savedSearchActivityWindowStart = getWindowStart(14);

  const [recentListingsResult, savedSearchesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("id, owner_id, category, created_at, status")
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
    respondedListingCount: respondedListingIds.size,
    responseRate: asPercent(respondedListingIds.size, recentListings.length),
    uniquePosterCount: posterCounts.size,
    repeatPosterCount,
    repeatPosterRate: asPercent(repeatPosterCount, posterCounts.size),
    savedSearchCount: savedSearchRows.length,
    savedSearchUserCount: new Set(savedSearchRows.map((savedSearch) => savedSearch.user_id)).size,
    activeSavedSearchUserCount,
    heroCategoryCounts: HERO_CATEGORY_ORDER.map((category) => ({
      category,
      count: recentListings.filter((listing) => listing.category === category).length
    }))
  };
}
