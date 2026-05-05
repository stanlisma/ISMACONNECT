import { CATEGORY_MAP } from "@/lib/constants";
import {
  applyStructuredListingFilters,
  getStructuredFilterSummaryItems,
  normalizeStructuredFilterValues
} from "@/lib/listing-structured-fields";
import { getSubcategories } from "@/lib/subcategories";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveCategory } from "@/lib/utils";
import type { Listing, ListingCategory, SavedSearch } from "@/types/database";

const VALID_SORTS = new Set(["price_asc", "price_desc"]);

export interface SavedSearchFilters {
  path: string;
  search?: string | null;
  category?: ListingCategory | string | null;
  subcategory?: string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  sort?: string | null;
  extraFilters?: Record<string, unknown> | null;
}

export interface NormalizedSavedSearchFilters {
  path: string;
  search: string | null;
  category: ListingCategory | null;
  subcategory: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: string | null;
  extraFilters: Record<string, string | boolean>;
}

export interface SavedSearchWithStats extends SavedSearch {
  href: string;
  label: string;
  description: string;
  newMatchesCount: number;
  latestMatches: Listing[];
}

function normalizePath(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "/browse";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeSort(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && VALID_SORTS.has(trimmed) ? trimmed : null;
}

function formatSavedSearchValue(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getSubcategoryLabel(category: ListingCategory | null, subcategory: string | null) {
  if (!subcategory) {
    return null;
  }

  const match = category
    ? getSubcategories(category).find((item) => item.value === subcategory)
    : null;

  return match?.label ?? formatSavedSearchValue(subcategory);
}

export function normalizeSavedSearchFilters(filters: SavedSearchFilters): NormalizedSavedSearchFilters {
  const category = resolveCategory(filters.category ?? null) ?? null;

  return {
    path: normalizePath(filters.path),
    search: normalizeText(filters.search),
    category,
    subcategory: normalizeText(filters.subcategory),
    minPrice: normalizeNumber(filters.minPrice),
    maxPrice: normalizeNumber(filters.maxPrice),
    sort: normalizeSort(filters.sort),
    extraFilters: normalizeStructuredFilterValues(category, filters.extraFilters)
  };
}

export function hasMeaningfulSavedSearchCriteria(filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);

  return Boolean(
    normalized.search ||
      normalized.category ||
      normalized.subcategory ||
      normalized.minPrice !== null ||
      normalized.maxPrice !== null ||
      normalized.sort ||
      Object.keys(normalized.extraFilters).length > 0
  );
}

export function buildSavedSearchSignature(filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);

  return JSON.stringify({
    path: normalized.path,
    search: normalized.search,
    category: normalized.category,
    subcategory: normalized.subcategory,
    minPrice: normalized.minPrice,
    maxPrice: normalized.maxPrice,
    sort: normalized.sort,
    extraFilters: normalized.extraFilters
  });
}

export function buildSavedSearchHref(filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const params = new URLSearchParams();

  if (normalized.search) {
    params.set("q", normalized.search);
  }

  if (normalized.category) {
    params.set("category", normalized.category);
  }

  if (normalized.subcategory) {
    params.set("subcategory", normalized.subcategory);
  }

  if (normalized.minPrice !== null) {
    params.set("minPrice", String(normalized.minPrice));
  }

  if (normalized.maxPrice !== null) {
    params.set("maxPrice", String(normalized.maxPrice));
  }

  if (normalized.sort) {
    params.set("sort", normalized.sort);
  }

  Object.entries(normalized.extraFilters).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `${normalized.path}?${queryString}` : normalized.path;
}

export function getSavedSearchLabel(filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const categoryLabel = normalized.category ? CATEGORY_MAP[normalized.category].label : "All listings";
  const subcategoryLabel = getSubcategoryLabel(normalized.category, normalized.subcategory);

  if (normalized.search && subcategoryLabel) {
    return `${normalized.search} in ${subcategoryLabel}`;
  }

  if (normalized.search) {
    return `${normalized.search} in ${categoryLabel}`;
  }

  if (subcategoryLabel) {
    return `${subcategoryLabel} in ${categoryLabel}`;
  }

  return categoryLabel;
}

export function getSavedSearchDescription(filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const details: string[] = [];
  const subcategoryLabel = getSubcategoryLabel(normalized.category, normalized.subcategory);

  details.push(normalized.path === "/browse" ? "Browse" : "Category page");

  if (subcategoryLabel) {
    details.push(subcategoryLabel);
  }

  if (normalized.minPrice !== null || normalized.maxPrice !== null) {
    const min = normalized.minPrice !== null ? `$${normalized.minPrice}` : "Any";
    const max = normalized.maxPrice !== null ? `$${normalized.maxPrice}` : "Any";
    details.push(`${min} - ${max}`);
  }

  if (normalized.sort === "price_asc") {
    details.push("Price: Low to High");
  }

  if (normalized.sort === "price_desc") {
    details.push("Price: High to Low");
  }

  details.push(...getStructuredFilterSummaryItems(normalized.category, normalized.extraFilters));

  return details.join(" | ");
}

export function getSavedSearchFiltersFromRecord(savedSearch: SavedSearch): NormalizedSavedSearchFilters {
  return normalizeSavedSearchFilters({
    path: savedSearch.path,
    search: savedSearch.search_query,
    category: savedSearch.category,
    subcategory: savedSearch.subcategory,
    minPrice: savedSearch.min_price,
    maxPrice: savedSearch.max_price,
    sort: savedSearch.sort,
    extraFilters: savedSearch.extra_filters ?? {}
  });
}

function applyListingFilters(query: any, filters: SavedSearchFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  let nextQuery = query.eq("status", "active");

  if (normalized.category) {
    nextQuery = nextQuery.eq("category", normalized.category);
  }

  if (normalized.subcategory) {
    nextQuery = nextQuery.eq("subcategory", normalized.subcategory);
  }

  if (normalized.search) {
    nextQuery = nextQuery.textSearch("search_document", normalized.search, {
      type: "websearch",
      config: "simple"
    });
  }

  if (normalized.minPrice !== null) {
    nextQuery = nextQuery.gte("price", normalized.minPrice);
  }

  if (normalized.maxPrice !== null) {
    nextQuery = nextQuery.lte("price", normalized.maxPrice);
  }

  return applyStructuredListingFilters(nextQuery, normalized.category, normalized.extraFilters);
}

export async function getSavedSearchByFilters(userId: string, filters: SavedSearchFilters) {
  const supabase = await createServerSupabaseClient();
  const signature = buildSavedSearchSignature(filters);

  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("signature", signature)
    .maybeSingle();

  return (data as SavedSearch | null) ?? null;
}

export async function getSavedSearchesWithStats(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const savedSearches = (data ?? []) as SavedSearch[];

  if (!savedSearches.length) {
    return [] as SavedSearchWithStats[];
  }

  const publicSupabase = createPublicSupabaseClient();

  return Promise.all(
    savedSearches.map(async (savedSearch) => {
      const filters = getSavedSearchFiltersFromRecord(savedSearch);

      let alertCountQuery = applyListingFilters(
        publicSupabase.from("listings").select("id", { count: "exact", head: true }),
        filters
      );

      if (savedSearch.last_checked_at) {
        alertCountQuery = alertCountQuery.gt("created_at", savedSearch.last_checked_at);
      }

      const latestMatchesQuery = applyListingFilters(
        publicSupabase.from("listings").select("*"),
        filters
      )
        .order("created_at", { ascending: false })
        .limit(2);

      const [{ count: newMatchesCount }, { data: latestMatches }] = await Promise.all([
        alertCountQuery,
        latestMatchesQuery
      ]);

      return {
        ...savedSearch,
        href: buildSavedSearchHref(filters),
        label: getSavedSearchLabel(filters),
        description: getSavedSearchDescription(filters),
        newMatchesCount: newMatchesCount ?? 0,
        latestMatches: (latestMatches ?? []) as Listing[]
      } satisfies SavedSearchWithStats;
    })
  );
}

export function countSavedSearchAlerts(savedSearches: SavedSearchWithStats[]) {
  return savedSearches.filter((savedSearch) => savedSearch.newMatchesCount > 0).length;
}

export async function getSavedSearchAlertCount(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId);

  const savedSearches = (data ?? []) as SavedSearch[];

  if (!savedSearches.length) {
    return 0;
  }

  const publicSupabase = createPublicSupabaseClient();

  const counts = await Promise.all(
    savedSearches.map(async (savedSearch) => {
      let alertCountQuery = applyListingFilters(
        publicSupabase.from("listings").select("id", { count: "exact", head: true }),
        getSavedSearchFiltersFromRecord(savedSearch)
      );

      if (savedSearch.last_checked_at) {
        alertCountQuery = alertCountQuery.gt("created_at", savedSearch.last_checked_at);
      }

      const { count } = await alertCountQuery;
      return count && count > 0 ? 1 : 0;
    })
  );

  return counts.reduce<number>((total, count) => total + count, 0);
}
