import type { Listing } from "@/types/database";

export type ListingKeywordSearchMode = "fts" | "ilike";

function normalizeSearchVariant(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildKeywordVariants(search: string) {
  const normalized = normalizeSearchVariant(search);
  const variants = new Set<string>();

  const addVariant = (value: string) => {
    const next = normalizeSearchVariant(value);

    if (next.length >= 2) {
      variants.add(next);
    }
  };

  addVariant(search);
  addVariant(normalized);

  if (normalized.includes(" ")) {
    addVariant(normalized.replace(/\s+/g, "-"));
  }

  if (normalized.includes("-")) {
    addVariant(normalized.replace(/-/g, " "));
  }

  const tokens = normalized.split(/[\s-]+/).filter((token) => token.length >= 3);

  if (tokens.length > 1 && tokens.length <= 4) {
    tokens.forEach(addVariant);
  }

  return Array.from(variants);
}

export function matchesListingKeywordSearch(
  listing: Pick<Listing, "title" | "description" | "location">,
  search?: string | null
) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return true;
  }

  const haystack = normalizeSearchVariant(
    `${listing.title} ${listing.description} ${listing.location}`
  );

  return buildKeywordVariants(trimmed).some((variant) => haystack.includes(variant));
}

export function applyListingKeywordSearch(
  query: any,
  search?: string | null,
  mode: ListingKeywordSearchMode = "fts"
) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return query;
  }

  if (mode === "fts") {
    return query.textSearch("search_document", trimmed, {
      type: "websearch",
      config: "simple"
    });
  }

  const clauses = buildKeywordVariants(trimmed).flatMap((variant) => [
    `title.ilike.%${variant}%`,
    `description.ilike.%${variant}%`,
    `location.ilike.%${variant}%`
  ]);

  return clauses.length ? query.or(clauses.join(",")) : query;
}
