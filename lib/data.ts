import { expireListingPromotions } from "@/lib/boosts";
import {
  isAdditionalStorefrontSchemaError,
  normalizeAdditionalStorefrontRow
} from "@/lib/business-storefronts";
import {
  EMPTY_BUSINESS_PROFILE,
  isBusinessProfileSchemaError,
  normalizeBusinessProfileRow
} from "@/lib/business-profile";
import { getSubcategoryQueryValues } from "@/lib/subcategories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/env";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { applyListingKeywordSearch, type ListingKeywordSearchMode } from "@/lib/listing-search";
import { applyStructuredListingFilters } from "@/lib/listing-structured-fields";
import {
  filterListingsByCommunityArea,
  getPublicListingLocationLabel,
  type CommunityMapArea
} from "@/lib/local-marketplace";
import type {
  AdditionalBusinessStorefront,
  BusinessMapProfile,
  FlaggedListing,
  Listing,
  ListingCategory,
  ListingIntent,
  PublicBusinessStorefrontDirectoryItem,
  PublicSellerReviewItem,
  PublicSellerStorefrontLink,
  PublicSellerStorefront
} from "@/types/database";

interface ListingFilters {
  category?: ListingCategory;
  intent?: ListingIntent;
  requestWindow?: string | null;
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

export async function getOwnedAdditionalStorefronts(ownerId: string) {
  if (!ownerId) {
    return {
      schemaReady: true,
      storefronts: [] as AdditionalBusinessStorefront[]
    };
  }

  const supabase = isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();
  const response = await supabase
    .from("business_storefronts")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (response.error) {
    if (isAdditionalStorefrontSchemaError(response.error)) {
      return {
        schemaReady: false,
        storefronts: [] as AdditionalBusinessStorefront[]
      };
    }

    logDataError("Additional storefront query failed", response.error);
    return {
      schemaReady: true,
      storefronts: [] as AdditionalBusinessStorefront[]
    };
  }

  return {
    schemaReady: true,
    storefronts: ((response.data as Array<Record<string, unknown>> | null) ?? []).map((row) =>
      normalizeAdditionalStorefrontRow(row)
    )
  };
}

export async function getBusinessMapProfileMap(storefrontIds: string[]) {
  const uniqueStorefrontIds = [...new Set(storefrontIds.filter(Boolean))];

  if (!uniqueStorefrontIds.length || !isSupabaseServiceRoleConfigured()) {
    return new Map<string, BusinessMapProfile>();
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("business_storefronts")
    .select(
      "id, owner_id, name, address, show_exact_location, geocoded_lat, geocoded_lng, geocoded_area, geocoded_formatted_address"
    )
    .in("id", uniqueStorefrontIds)
    .eq("show_exact_location", true);

  if (error) {
    logDataError("Business map profile query failed", error);
    return new Map<string, BusinessMapProfile>();
  }

  return new Map(
    ((data as Array<Record<string, unknown>> | null) ?? [])
      .filter((row) => Boolean(row.id) && Boolean(row.owner_id))
      .map((row) => [
        String(row.id),
        {
          storefront_id: String(row.id),
          owner_id: String(row.owner_id),
          business_name: typeof row.name === "string" ? row.name : null,
          business_address: typeof row.address === "string" ? row.address : null,
          show_exact_business_location: Boolean(row.show_exact_location),
          business_geocoded_lat:
            typeof row.geocoded_lat === "number" ? row.geocoded_lat : null,
          business_geocoded_lng:
            typeof row.geocoded_lng === "number" ? row.geocoded_lng : null,
          business_geocoded_area:
            typeof row.geocoded_area === "string" ? row.geocoded_area : null,
          business_geocoded_formatted_address:
            typeof row.geocoded_formatted_address === "string"
              ? row.geocoded_formatted_address
              : null
        } satisfies BusinessMapProfile
      ])
  );
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
  intent?: ListingIntent;
  requestWindow?: string | null;
  communityArea?: CommunityMapArea | null;
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

  const buildBaseQuery = (searchMode: ListingKeywordSearchMode = "fts") => {
    let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.intent) {
      query = query.eq("listing_intent", filters.intent);
    }

    if (filters.requestWindow) {
      query = query.eq("request_window", filters.requestWindow);
    }

    if (filters.subcategory) {
      const subcategoryValues = getSubcategoryQueryValues(filters.category, filters.subcategory);

      if (subcategoryValues.length === 1) {
        query = query.eq("subcategory", subcategoryValues[0]);
      } else if (subcategoryValues.length > 1) {
        query = query.in("subcategory", subcategoryValues);
      }
    }

    query = applyListingKeywordSearch(query, filters.search, searchMode);

    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }

    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    return applyStructuredListingFilters(query, filters.category, filters.extraFilters);
  };

  const applySortOrder = (query: any, includePromotionOrdering: boolean) => {
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

    return query;
  };

  const shouldRetryKeywordSearch =
    Boolean(filters.search?.trim());

  const runListingsQuery = async (rangeStart: number, rangeEnd: number) => {
    let response = await applySortOrder(buildBaseQuery("fts"), true).range(rangeStart, rangeEnd);

    if (response.error && isPromotionSchemaError(response.error)) {
      response = await applySortOrder(buildBaseQuery("fts"), false).range(rangeStart, rangeEnd);
    }

    if (shouldRetryKeywordSearch && (response.error || !(response.data?.length ?? 0))) {
      let fallbackResponse = await applySortOrder(buildBaseQuery("ilike"), true).range(rangeStart, rangeEnd);

      if (fallbackResponse.error && isPromotionSchemaError(fallbackResponse.error)) {
        fallbackResponse = await applySortOrder(buildBaseQuery("ilike"), false).range(rangeStart, rangeEnd);
      }

      if (!fallbackResponse.error || !(response.data?.length ?? 0)) {
        response = fallbackResponse;
      }
    }

    return response;
  };

  if (filters.communityArea && filters.category && filters.category !== "ride-share") {
    let areaResponse = await runListingsQuery(0, 499);

    if (areaResponse.error) {
      logDataError("Community area listings query failed", areaResponse.error);
    }

    const areaListings = (areaResponse.data || []) as Listing[];
    const businessMapProfiles = Object.fromEntries(
      await getBusinessMapProfileMap(areaListings.map((listing) => listing.storefront_id ?? ""))
    );
    const filteredListings = filterListingsByCommunityArea(
      areaListings,
      filters.communityArea,
      businessMapProfiles
    );
    const pagedListings = filteredListings.slice(offset, offset + pageSize);

    return {
      isConfigured: true,
      listings: pagedListings,
      hasMore: offset + pageSize < filteredListings.length,
      totalCount: filteredListings.length,
      page,
      pageSize
    };
  }

  const primaryResponse = await runListingsQuery(offset, offset + pageSize);

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
  limit = 12,
  storefrontId?: string | null
): Promise<PublicSellerStorefront | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  let additionalStorefront: AdditionalBusinessStorefront | null = null;

  if (storefrontId) {
    const storefrontResponse = await supabase
      .from("business_storefronts")
      .select("*")
      .eq("id", storefrontId)
      .eq("owner_id", sellerId)
      .maybeSingle();

    if (storefrontResponse.error) {
      if (!isAdditionalStorefrontSchemaError(storefrontResponse.error)) {
        logDataError("Public additional storefront query failed", storefrontResponse.error);
      }
      return null;
    }

    if (!storefrontResponse.data) {
      return null;
    }

    additionalStorefront = normalizeAdditionalStorefrontRow(storefrontResponse.data);
  }

  let listingsQuery = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .eq("owner_id", sellerId);

  if (additionalStorefront) {
    listingsQuery = listingsQuery.eq("storefront_id", additionalStorefront.id);
  }

  let response = await listingsQuery
    .order("is_featured", { ascending: false })
    .order("boosted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error && isPromotionSchemaError(response.error)) {
    let fallbackQuery = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .eq("owner_id", sellerId);

    if (additionalStorefront) {
      fallbackQuery = fallbackQuery.eq("storefront_id", additionalStorefront.id);
    }

    response = await fallbackQuery
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  if (response.error) {
    logDataError("Public seller storefront query failed", response.error);
    return null;
  }

  const listings = (response.data || []) as Listing[];

  if (!listings.length && !additionalStorefront) {
    return null;
  }

  const firstListing = listings[0] ?? null;
  const activeCategories = Array.from(new Set(listings.map((listing) => listing.category)));
  let businessProfile = EMPTY_BUSINESS_PROFILE;

  const businessProfileResponse = await supabase
    .from("profiles")
    .select("full_name, phone, is_business, business_name, business_description, business_logo_url, business_website, business_address, show_exact_business_location, service_areas, business_services, business_hours")
    .eq("id", sellerId)
    .maybeSingle();

  if (businessProfileResponse.error) {
    if (isBusinessProfileSchemaError(businessProfileResponse.error)) {
      const fallbackProfile = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", sellerId)
        .maybeSingle();

      businessProfile = {
        ...EMPTY_BUSINESS_PROFILE,
        full_name: fallbackProfile.data?.full_name ?? null,
        phone: fallbackProfile.data?.phone ?? null
      };
    } else {
      logDataError("Public seller business profile query failed", businessProfileResponse.error);
    }
  } else {
    businessProfile = normalizeBusinessProfileRow(businessProfileResponse.data);
  }

  const displayName = additionalStorefront
    ? additionalStorefront.name
    : businessProfile.full_name || firstListing?.contact_name || "Local seller";

  return {
    seller_id: sellerId,
    storefront_id: additionalStorefront?.id ?? null,
    display_name: displayName,
    is_business: Boolean(additionalStorefront),
    business_description: additionalStorefront?.description ?? null,
    business_logo_url: additionalStorefront?.logo_url ?? null,
    business_image_urls: additionalStorefront?.image_urls ?? [],
    business_website: additionalStorefront?.website ?? null,
    business_address: additionalStorefront?.address ?? null,
    show_exact_business_location: additionalStorefront?.show_exact_location ?? false,
    service_areas: additionalStorefront?.service_areas ?? [],
    business_services: additionalStorefront?.services ?? [],
    business_hours: additionalStorefront?.hours ?? {},
    phone: additionalStorefront ? additionalStorefront.phone : businessProfile.phone,
    primary_location: firstListing ? getPublicListingLocationLabel(firstListing) : additionalStorefront?.address ?? "Fort McMurray",
    total_active_listings: response.count ?? listings.length,
    active_categories: activeCategories,
    listings
  };
}

export async function getPublicSellerStorefrontLinks(sellerId: string) {
  if (!isSupabaseConfigured()) {
    return [] as PublicSellerStorefrontLink[];
  }

  const supabase = await createServerSupabaseClient();

  const storefrontResponse = await supabase
    .from("business_storefronts")
    .select("id, name, logo_url")
    .eq("owner_id", sellerId)
    .order("updated_at", { ascending: false });

  if (storefrontResponse.error) {
    if (!isAdditionalStorefrontSchemaError(storefrontResponse.error)) {
      logDataError("Public seller storefront links query failed", storefrontResponse.error);
    }

    return [] as PublicSellerStorefrontLink[];
  }

  const storefrontRows = (storefrontResponse.data ?? []) as Array<{
    id: string;
    name: string;
    logo_url: string | null;
  }>;

  if (!storefrontRows.length) {
    return [] as PublicSellerStorefrontLink[];
  }

  const listingsResponse = await supabase
    .from("listings")
    .select("storefront_id")
    .eq("owner_id", sellerId)
    .eq("status", "active")
    .not("storefront_id", "is", null);

  if (listingsResponse.error) {
    logDataError("Public seller storefront listing counts query failed", listingsResponse.error);
  }

  const counts = new Map<string, number>();

  for (const row of ((listingsResponse.data ?? []) as Array<{ storefront_id: string | null }>)) {
    if (!row.storefront_id) {
      continue;
    }

    counts.set(row.storefront_id, (counts.get(row.storefront_id) ?? 0) + 1);
  }

  return storefrontRows.map((row) => ({
    storefront_id: row.id,
    name: row.name,
    logo_url: row.logo_url,
    active_listing_count: counts.get(row.id) ?? 0
  }));
}

export async function getPublicSellerReviews(sellerId: string, limit = 6) {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return [] as PublicSellerReviewItem[];
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("seller_reviews")
    .select("id, listing_id, rating, comment, created_at, listing:listings(slug, title)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDataError("Public seller reviews query failed", error);
    return [] as PublicSellerReviewItem[];
  }

  return ((data ?? []) as Array<{
    id: string;
    listing_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    listing?: { slug?: string | null; title?: string | null } | null;
  }>).map((row) => ({
    id: row.id,
    listing_id: row.listing_id,
    listing_slug: row.listing?.slug ?? null,
    listing_title: row.listing?.title ?? null,
    rating: row.rating,
    comment: row.comment?.trim() ? row.comment.trim() : null,
    created_at: row.created_at
  }));
}

export async function getPublicBusinessStorefrontDirectory(filters?: {
  category?: ListingCategory;
  limit?: number;
}) {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      schemaReady: true,
      storefronts: [] as PublicBusinessStorefrontDirectoryItem[]
    };
  }

  const supabase = await createServerSupabaseClient();
  await expireListingPromotions(supabase);

  const storefrontResponse = await supabase
    .from("business_storefronts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(filters?.limit ? Math.max(filters.limit * 2, filters.limit) : 80);

  if (storefrontResponse.error) {
    if (isAdditionalStorefrontSchemaError(storefrontResponse.error)) {
      return {
        isConfigured: true,
        schemaReady: false,
        storefronts: [] as PublicBusinessStorefrontDirectoryItem[]
      };
    }

    logDataError("Public business storefront directory query failed", storefrontResponse.error);
    return {
      isConfigured: true,
      schemaReady: true,
      storefronts: [] as PublicBusinessStorefrontDirectoryItem[]
    };
  }

  const storefrontRows = ((storefrontResponse.data as Array<Record<string, unknown>> | null) ?? []).map((row) =>
    normalizeAdditionalStorefrontRow(row)
  );

  if (!storefrontRows.length) {
    return {
      isConfigured: true,
      schemaReady: true,
      storefronts: [] as PublicBusinessStorefrontDirectoryItem[]
    };
  }

  let listingsQuery = supabase
    .from("listings")
    .select("id, owner_id, storefront_id, category, title, description, location, show_exact_address_on_map, geocoded_area, created_at")
    .eq("status", "active")
    .not("storefront_id", "is", null);

  if (filters?.category) {
    listingsQuery = listingsQuery.eq("category", filters.category);
  }

  const listingsResponse = await listingsQuery.order("created_at", { ascending: false }).limit(400);

  if (listingsResponse.error) {
    logDataError("Business storefront active listings query failed", listingsResponse.error);
    return {
      isConfigured: true,
      schemaReady: true,
      storefronts: [] as PublicBusinessStorefrontDirectoryItem[]
    };
  }

  const listings = (listingsResponse.data || []) as Array<
    Pick<
      Listing,
      | "id"
      | "owner_id"
      | "storefront_id"
      | "category"
      | "title"
      | "description"
      | "location"
      | "show_exact_address_on_map"
      | "geocoded_area"
      | "created_at"
    >
  >;
  const groupedListings = new Map<string, typeof listings>();

  for (const listing of listings) {
    if (!listing.storefront_id) {
      continue;
    }

    const existing = groupedListings.get(listing.storefront_id) ?? [];
    existing.push(listing);
    groupedListings.set(listing.storefront_id, existing);
  }

  const storefronts = storefrontRows
    .map((storefront) => {
      const storefrontListings = groupedListings.get(storefront.id) ?? [];
      const hasCategoryMatch = !filters?.category || storefrontListings.length > 0;

      if (!hasCategoryMatch) {
        return null;
      }

      const latestListing = storefrontListings[0];
      const activeCategories = Array.from(new Set(storefrontListings.map((listing) => listing.category)));

      return {
        storefront_id: storefront.id,
        owner_id: storefront.owner_id,
        slug: storefront.slug,
        name: storefront.name,
        description: storefront.description,
        logo_url: storefront.logo_url,
        image_urls: storefront.image_urls,
        website: storefront.website,
        phone: storefront.phone,
        address: storefront.address,
        service_areas: storefront.service_areas,
        services: storefront.services,
        hours: storefront.hours,
        primary_location:
          storefront.address?.trim() ||
          (latestListing ? getPublicListingLocationLabel(latestListing as Listing) : null) ||
          "Fort McMurray",
        active_listing_count: storefrontListings.length,
        active_categories: activeCategories,
        latest_listing_created_at: latestListing?.created_at ?? null
      } satisfies PublicBusinessStorefrontDirectoryItem;
    })
    .filter(Boolean) as PublicBusinessStorefrontDirectoryItem[];

  return {
    isConfigured: true,
    schemaReady: true,
    storefronts: storefronts
      .sort((left, right) => {
        if (right.active_listing_count !== left.active_listing_count) {
          return right.active_listing_count - left.active_listing_count;
        }

        return (right.latest_listing_created_at ?? "").localeCompare(left.latest_listing_created_at ?? "");
      })
      .slice(0, filters?.limit ?? 40)
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
