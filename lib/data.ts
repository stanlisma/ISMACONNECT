import { expireListingPromotions } from "@/lib/boosts";
import {
  EMPTY_BUSINESS_PROFILE,
  isBusinessProfileSchemaError,
  normalizeBusinessProfileRow
} from "@/lib/business-profile";
import { getSubcategoryQueryValues } from "@/lib/subcategories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { applyStructuredListingFilters } from "@/lib/listing-structured-fields";
import type {
  FlaggedListing,
  Listing,
  ListingCategory,
  PublicSellerStorefront
} from "@/types/database";

interface ListingFilters {
  category?: ListingCategory;
  subcategory?: string | null;
  search?: string;
  limit?: number;
  extraFilters?: Record<string, unknown>;
}

const DEFAULT_PUBLIC_LISTINGS_PAGE_SIZE = 24;

function isPromotionSchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    message.includes("boosted_at") ||
    message.includes("is_urgent") ||
    message.includes("urgent_until") ||
    message.includes("expire_listing_promotions")
  );
}

function logDataError(context: string, error: { message?: string | null } | null | undefined) {
  if (error) {
    console.error(`${context}:`, error.message || error);
  }
}

export async function getHomepageData() {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      featuredListings: [] as Listing[],
      latestListings: [] as Listing[]
    };
  }

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const [featuredResponse, latestResponse] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .eq("is_featured", true)
      .order("featured_until", { ascending: false, nullsFirst: false })
      .order("boosted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3),

    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("boosted_at", { ascending: false, nullsFirst: false })
      .order("is_urgent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  let featuredListings = (featuredResponse.data || []) as Listing[];
  let latestListings = (latestResponse.data || []) as Listing[];

  if (featuredResponse.error && isPromotionSchemaError(featuredResponse.error)) {
    const fallbackResponse = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .eq("is_featured", true)
      .order("featured_until", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (fallbackResponse.error) {
      logDataError("Homepage featured listings fallback failed", fallbackResponse.error);
    } else {
      featuredListings = (fallbackResponse.data || []) as Listing[];
    }
  } else if (featuredResponse.error) {
    logDataError("Homepage featured listings query failed", featuredResponse.error);
  }

  if (latestResponse.error && isPromotionSchemaError(latestResponse.error)) {
    const fallbackResponse = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);

    if (fallbackResponse.error) {
      logDataError("Homepage latest listings fallback failed", fallbackResponse.error);
    } else {
      latestListings = (fallbackResponse.data || []) as Listing[];
    }
  } else if (latestResponse.error) {
    logDataError("Homepage latest listings query failed", latestResponse.error);
  }

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
  extraFilters?: Record<string, unknown>;
  limit?: number;
  page?: number;
}) {
  const pageSize = filters.limit ?? DEFAULT_PUBLIC_LISTINGS_PAGE_SIZE;
  const page = Math.max(filters.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      listings: [] as Listing[],
      hasMore: false,
      totalCount: 0,
      page,
      pageSize
    };
  }

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const buildBaseQuery = () => {
    let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.subcategory) {
      const subcategoryValues = getSubcategoryQueryValues(filters.category, filters.subcategory);

      if (subcategoryValues.length === 1) {
        query = query.eq("subcategory", subcategoryValues[0]);
      } else if (subcategoryValues.length > 1) {
        query = query.in("subcategory", subcategoryValues);
      }
    }

    if (filters.search?.trim()) {
      query = query.textSearch("search_document", filters.search.trim(), {
        type: "websearch",
        config: "simple"
      });
    }

    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }

    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    return applyStructuredListingFilters(query, filters.category, filters.extraFilters);
  };

  const applySort = (query: any, includePromotionOrdering: boolean) => {
    switch (filters.sort) {
      case "price_asc":
        if (includePromotionOrdering) {
          query = query
            .order("is_featured", { ascending: false })
            .order("boosted_at", { ascending: false, nullsFirst: false })
            .order("is_urgent", { ascending: false });
        } else {
          query = query.order("is_featured", { ascending: false });
        }

        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        if (includePromotionOrdering) {
          query = query
            .order("is_featured", { ascending: false })
            .order("boosted_at", { ascending: false, nullsFirst: false })
            .order("is_urgent", { ascending: false });
        } else {
          query = query.order("is_featured", { ascending: false });
        }

        query = query.order("price", { ascending: false });
        break;
      default:
        query = query.order("is_featured", { ascending: false });

        if (includePromotionOrdering) {
          query = query
            .order("boosted_at", { ascending: false, nullsFirst: false })
            .order("is_urgent", { ascending: false });
        }

        query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + pageSize);

    return query;
  };

  let primaryResponse = await applySort(buildBaseQuery(), true);

  if (primaryResponse.error && isPromotionSchemaError(primaryResponse.error)) {
    primaryResponse = await applySort(buildBaseQuery(), false);
  }

  if (primaryResponse.error) {
    logDataError("Public listings query failed", primaryResponse.error);
  }

  const rawListings = (primaryResponse.data || []) as Listing[];
  const hasMore = rawListings.length > pageSize;
  const listings = hasMore ? rawListings.slice(0, pageSize) : rawListings;

  return {
    isConfigured: true,
    listings,
    hasMore,
    totalCount: primaryResponse.count ?? listings.length,
    page,
    pageSize
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

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

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

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  let response = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("is_featured", { ascending: false })
    .order("boosted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(3);

  if (response.error && isPromotionSchemaError(response.error)) {
    response = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .eq("category", listing.category)
      .neq("id", listing.id)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);
  }

  if (response.error) {
    logDataError("Related listings query failed", response.error);
  }

  return (response.data || []) as Listing[];
}

export async function getUserListings(userId: string) {
  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  let response = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", userId)
    .order("is_featured", { ascending: false })
    .order("boosted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (response.error && isPromotionSchemaError(response.error)) {
    response = await supabase
      .from("listings")
      .select("*")
      .eq("owner_id", userId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (response.error) {
    logDataError("User listings query failed", response.error);
  }

  return (response.data || []) as Listing[];
}

export async function getEditableListing(listingId: string) {
  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

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
  await expireListingPromotions(supabase);

  const { data } = await supabase
    .from("saved_listings")
    .select("listing:listings(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || [])
    .map((row: any) => row.listing)
    .filter(Boolean) as Listing[];
}

export async function getPublicSellerStorefront(
  sellerId: string,
  limit = 12
): Promise<PublicSellerStorefront | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  let response = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .eq("owner_id", sellerId)
    .order("is_featured", { ascending: false })
    .order("boosted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error && isPromotionSchemaError(response.error)) {
    response = await supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .eq("owner_id", sellerId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  if (response.error) {
    logDataError("Public seller storefront query failed", response.error);
    return null;
  }

  const listings = (response.data || []) as Listing[];

  if (!listings.length) {
    return null;
  }

  const firstListing = listings[0];
  const activeCategories = Array.from(new Set(listings.map((listing) => listing.category)));
  let businessProfile = EMPTY_BUSINESS_PROFILE;

  const businessProfileResponse = await supabase
    .from("profiles")
    .select("full_name, is_business, business_name, business_description, business_logo_url, business_website, service_areas")
    .eq("id", sellerId)
    .maybeSingle();

  if (businessProfileResponse.error) {
    if (isBusinessProfileSchemaError(businessProfileResponse.error)) {
      const fallbackProfile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sellerId)
        .maybeSingle();

      businessProfile = {
        ...EMPTY_BUSINESS_PROFILE,
        full_name: fallbackProfile.data?.full_name ?? null
      };
    } else {
      logDataError("Public seller business profile query failed", businessProfileResponse.error);
    }
  } else {
    businessProfile = normalizeBusinessProfileRow(businessProfileResponse.data);
  }

  const displayName = businessProfile.is_business
    ? businessProfile.business_name || businessProfile.full_name || firstListing.contact_name || "Local business"
    : businessProfile.full_name || firstListing.contact_name || "Local seller";

  return {
    seller_id: sellerId,
    display_name: displayName,
    is_business: businessProfile.is_business,
    business_description: businessProfile.business_description,
    business_logo_url: businessProfile.business_logo_url,
    business_website: businessProfile.business_website,
    service_areas: businessProfile.service_areas,
    primary_location: firstListing.location,
    total_active_listings: response.count ?? listings.length,
    active_categories: activeCategories,
    listings
  };
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
