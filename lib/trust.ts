import { isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Profile,
  SellerReview,
  SellerTrustSummary
} from "@/types/database";

function normalizeTrustSummary(row: any): SellerTrustSummary {
  const average =
    row.average_rating === null || row.average_rating === undefined
      ? null
      : Number(row.average_rating);

  return {
    seller_id: row.seller_id,
    verification_status: row.verification_status ?? "unverified",
    verified_at: row.verified_at ?? null,
    average_rating: Number.isFinite(average) ? average : null,
    review_count: row.review_count ?? 0,
    top_rated: Boolean(row.top_rated),
    member_since: row.member_since
  };
}

export function isVerifiedSeller(summary?: SellerTrustSummary | null) {
  return summary?.verification_status === "verified";
}

export function isTrustedSeller(summary?: SellerTrustSummary | null) {
  return Boolean(summary?.top_rated);
}

export async function getSellerTrustSummaryMap(sellerIds: string[]) {
  const uniqueSellerIds = Array.from(new Set(sellerIds.filter(Boolean)));

  if (!isSupabaseConfigured() || uniqueSellerIds.length === 0) {
    return new Map<string, SellerTrustSummary>();
  }

  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.rpc("get_seller_trust_summaries", {
    seller_ids: uniqueSellerIds
  });

  return new Map<string, SellerTrustSummary>(
    ((data ?? []) as any[]).map((row) => {
      const summary = normalizeTrustSummary(row);
      return [summary.seller_id, summary];
    })
  );
}

export async function getSellerTrustSummary(sellerId: string) {
  const trustMap = await getSellerTrustSummaryMap([sellerId]);
  return trustMap.get(sellerId) ?? null;
}

export async function getViewerSellerReview(listingId: string, viewerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("seller_reviews")
    .select("*")
    .eq("listing_id", listingId)
    .eq("reviewer_id", viewerId)
    .maybeSingle();

  return (data as SellerReview | null) ?? null;
}

export async function canViewerRateSeller(listingId: string, viewerId: string, sellerId: string) {
  if (!viewerId || viewerId === sellerId) {
    return false;
  }

  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
    .maybeSingle();

  return Boolean(data);
}

export async function getPendingVerificationProfiles() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, verification_status, verification_requested_at, verified_at, created_at, updated_at")
    .eq("verification_status", "pending")
    .order("verification_requested_at", { ascending: true });

  return ((data ?? []) as Profile[]).map((profile) => ({
    ...profile,
    verification_status: profile.verification_status ?? "unverified"
  }));
}
