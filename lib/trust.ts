import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Profile,
  SellerReview,
  SellerTrustSummary
} from "@/types/database";

const SELLER_RECENT_POST_WINDOW_DAYS = 14;

export interface PublicSellerSignals {
  seller_id: string;
  email_confirmed: boolean;
  phone_verified: boolean;
  last_active_at: string | null;
  last_active_label: string | null;
  active_listing_count: number;
  recent_listing_count: number;
  conversation_count: number;
}

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

export function formatSellerActivityLabel(lastActiveAt?: string | null) {
  if (!lastActiveAt) {
    return null;
  }

  const activityDate = new Date(lastActiveAt);

  if (Number.isNaN(activityDate.getTime())) {
    return null;
  }

  const diffMs = Math.max(0, Date.now() - activityDate.getTime());
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    return "Active today";
  }

  if (diffDays < 7) {
    return "Active this week";
  }

  if (diffDays < 30) {
    return "Active this month";
  }

  return `Last active ${new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(activityDate)}`;
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

export async function getPublicSellerSignals(sellerId: string): Promise<PublicSellerSignals | null> {
  if (!isSupabaseConfigured() || !sellerId) {
    return null;
  }

  const recentWindowStart = new Date();
  recentWindowStart.setDate(recentWindowStart.getDate() - SELLER_RECENT_POST_WINDOW_DAYS);

  const supabase = isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();

  const [profileResponse, activeListingsResponse, recentListingsResponse, conversationResponse] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("phone_verified_at")
        .eq("id", sellerId)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", sellerId)
        .eq("status", "active"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", sellerId)
        .eq("status", "active")
        .gte("created_at", recentWindowStart.toISOString()),
      isSupabaseServiceRoleConfigured()
        ? supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", sellerId)
        : Promise.resolve({ count: 0, data: null, error: null })
    ]);

  let emailConfirmed = false;
  let lastActiveAt: string | null = null;

  if (isSupabaseServiceRoleConfigured()) {
    try {
      const serviceSupabase = createServiceRoleSupabaseClient();
      const { data, error } = await serviceSupabase.auth.admin.getUserById(sellerId);

      if (!error && data.user) {
        emailConfirmed = Boolean(data.user.email_confirmed_at);
        lastActiveAt = data.user.last_sign_in_at ?? null;
      }
    } catch (error) {
      console.error("Public seller auth signal lookup failed:", error);
    }
  }

  return {
    seller_id: sellerId,
    email_confirmed: emailConfirmed,
    phone_verified: Boolean(profileResponse.data?.phone_verified_at),
    last_active_at: lastActiveAt,
    last_active_label: formatSellerActivityLabel(lastActiveAt),
    active_listing_count: activeListingsResponse.count ?? 0,
    recent_listing_count: recentListingsResponse.count ?? 0,
    conversation_count: conversationResponse.count ?? 0
  };
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
    .is("stripe_identity_verification_session_id", null)
    .order("verification_requested_at", { ascending: true });

  return ((data ?? []) as Profile[]).map((profile) => ({
    ...profile,
    verification_status: profile.verification_status ?? "unverified"
  }));
}
