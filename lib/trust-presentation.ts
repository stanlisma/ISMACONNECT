import type { SellerTrustSummary } from "@/types/database";

const MIN_PUBLIC_RATING_REVIEWS = 3;
const MIN_TOP_RATED_REVIEWS = 5;

export function hasPublicSellerRating(summary?: SellerTrustSummary | null) {
  return Boolean(
    summary &&
      summary.average_rating !== null &&
      summary.review_count >= MIN_PUBLIC_RATING_REVIEWS
  );
}

export function hasPublicTopRatedSeller(summary?: SellerTrustSummary | null) {
  return Boolean(
    summary &&
      summary.top_rated &&
      summary.average_rating !== null &&
      summary.review_count >= MIN_TOP_RATED_REVIEWS
  );
}

export function getSellerReviewSummary(summary?: SellerTrustSummary | null) {
  if (!summary || summary.review_count <= 0) {
    return "No public rating yet";
  }

  if (hasPublicSellerRating(summary)) {
    return `${summary.average_rating?.toFixed(1)} from ${summary.review_count} reviews`;
  }

  return `${summary.review_count} early ${summary.review_count === 1 ? "review" : "reviews"}`;
}

export function getSellerReviewBadgeLabel(summary?: SellerTrustSummary | null, compact = false) {
  if (!summary || summary.review_count <= 0) {
    return null;
  }

  if (hasPublicSellerRating(summary)) {
    return compact
      ? `${summary.average_rating?.toFixed(1)} (${summary.review_count})`
      : `${summary.average_rating?.toFixed(1)} stars (${summary.review_count})`;
  }

  if (summary.review_count === 1) {
    return compact ? "1 review" : "1 early review";
  }

  return compact ? `${summary.review_count} reviews` : `${summary.review_count} early reviews`;
}

export function getSellerTrustSummaryCopy(summary?: SellerTrustSummary | null) {
  if (!summary) {
    return "No public rating yet.";
  }

  if (hasPublicSellerRating(summary)) {
    return `${summary.average_rating?.toFixed(1)} average rating from ${summary.review_count} reviews.`;
  }

  if (summary.review_count > 0) {
    return `${summary.review_count} early ${
      summary.review_count === 1 ? "review has" : "reviews have"
    } been posted. Public star ratings appear once more feedback comes in.`;
  }

  if (summary.verification_status === "verified") {
    return "Your listings show a verified seller badge.";
  }

  return "No public rating yet.";
}
