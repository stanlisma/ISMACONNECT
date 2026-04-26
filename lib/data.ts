import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { FlaggedListing, Listing, ListingCategory } from "@/types/database";

interface ListingFilters {
  category?: ListingCategory;
  subcategory?: string | null;
  search?: string;
  limit?: number;
}

export async function getHomepageData() {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      featuredListings: [] as Listing[],
      latestListings: [] as Listing[]
    };
  }

  const supabase = createPublicSupabaseClient();

  const [featuredResponse, latestResponse] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3),

    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const featuredListings = (featuredResponse.data || []) as Listing[];
  const latestListings = (latestResponse.data || []) as Listing[];

  return {
    isConfigured: true,
    featuredListings: featuredListings.length > 0 ? featuredListings : latestListings.slice(0, 3),
    latestListings
  };
}

export async function getPublicListings(filters: {
  category?: ListingCategory;
  subcategory?: string | null;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  limit?: number;
}) {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      listings: [] as Listing[]
    };
  }

  const supabase = createPublicSupabaseClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active");

  // CATEGORY
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  // SUBCATEGORY
  if (filters.subcategory) {
    query = query.eq("subcategory", filters.subcategory);
  }

  // SEARCH
  if (filters.search?.trim()) {
    query = query.textSearch("search_document", filters.search.trim(), {
      type: "websearch",
      config: "simple"
    });
  }

  // PRICE FILTER
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  // SORTING
  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data } = await query;

  return {
    isConfigured: true,
    listings: (data || []) as Listing[]
  };
}

export async function incrementListingViews(listingId: string, userId?: string | null) {
  const supabase = await createServerSupabaseClient();

  const visitorKey = userId ? null : "guest";

  const { error } = await supabase.from("listing_views").insert({
    listing_id: listingId,
    viewer_id: userId ?? null,
    visitor_key: visitorKey
  });

  if (error) {
    // Duplicate view = already counted. Ignore it.
    if (error.code === "23505") {
      return;
    }

    console.error("View tracking failed:", error);
    return;
  }

  await supabase.rpc("increment_listing_views", {
    listing_id_input: listingId
  });
}

export async function getPublicListingBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createPublicSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) {
    return null;
  }

  return (data as Listing | null) || null;
}

export async function getRelatedListings(listing: Listing) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createPublicSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (data || []) as Listing[];
}

export async function getUserListings(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return (data || []) as Listing[];
}

export async function getEditableListing(listingId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  return (data as Listing | null) || null;
}

export async function getFlaggedListings() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("*, listing_flags(*)")
    .eq("status", "flagged")
    .order("updated_at", { ascending: false });

  return (data || []) as FlaggedListing[];
}

export async function getSavedListingIds(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", userId);

  return new Set((data || []).map((item) => item.listing_id));
}

export async function getSavedListings(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("saved_listings")
    .select("listing:listings(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || [])
    .map((row: any) => row.listing)
    .filter(Boolean) as Listing[];
}

export async function getConversationForListing(listingId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle();

  return data as { id: string } | null;
}