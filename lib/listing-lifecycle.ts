import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ListingCategory, ListingIntent } from "@/types/database";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const CATEGORY_EXPIRY_DAYS: Record<ListingCategory, number> = {
  "ride-share": 14,
  rentals: 30,
  jobs: 30,
  services: 60,
  "buy-sell": 30
};

const NEED_EXPIRY_DAYS = 21;

export const DAILY_LISTING_POST_LIMIT = 5;
export const DUPLICATE_TITLE_SIMILARITY_THRESHOLD = 0.6;

function isExpirySchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return message.includes("expires_at") || message.includes("expire_listings");
}

export function getListingExpiryWindowDays(category: ListingCategory, intent: ListingIntent) {
  return intent === "need" ? NEED_EXPIRY_DAYS : CATEGORY_EXPIRY_DAYS[category];
}

export function computeExpiresAt(category: ListingCategory, intent: ListingIntent, from: Date = new Date()) {
  const days = getListingExpiryWindowDays(category, intent);
  return new Date(from.getTime() + days * DAY_IN_MS).toISOString();
}

export async function expireListings(supabase?: SupabaseClient) {
  const client = supabase ?? (await createServerSupabaseClient());
  const { error } = await client.rpc("expire_listings");

  if (error && !isExpirySchemaError(error)) {
    throw new Error(error.message);
  }
}

function normalizeTitleWords(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

export function titleSimilarity(titleA: string, titleB: string) {
  const wordsA = normalizeTitleWords(titleA);
  const wordsB = normalizeTitleWords(titleB);

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      overlap += 1;
    }
  }

  const unionSize = new Set([...wordsA, ...wordsB]).size;
  return overlap / unionSize;
}
