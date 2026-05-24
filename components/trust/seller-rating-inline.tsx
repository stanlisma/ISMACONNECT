import type { CSSProperties } from "react";

import type { SellerTrustSummary } from "@/types/database";

interface SellerRatingInlineProps {
  summary?: SellerTrustSummary | null;
  rating?: number | null;
  reviewCount?: number | null;
  compact?: boolean;
  showCount?: boolean;
}

export function SellerRatingInline({
  summary,
  rating,
  reviewCount,
  compact = false,
  showCount = true
}: SellerRatingInlineProps) {
  const averageSource = summary?.average_rating ?? rating ?? null;
  const reviewCountSource = summary?.review_count ?? reviewCount ?? null;

  if (averageSource === null || averageSource === undefined) {
    return null;
  }

  if (showCount && (reviewCountSource === null || reviewCountSource === undefined || reviewCountSource <= 0)) {
    return null;
  }

  const average = Math.max(0, Math.min(5, averageSource));
  const fillWidth = `${(average / 5) * 100}%`;
  const stars = "\u2605\u2605\u2605\u2605\u2605";
  const label = showCount
    ? `${average.toFixed(1)} out of 5 from ${reviewCountSource} ${
        reviewCountSource === 1 ? "review" : "reviews"
      }`
    : `${average.toFixed(1)} out of 5 stars`;

  return (
    <div className={`seller-rating-inline${compact ? " is-compact" : ""}`} aria-label={label}>
      <span
        className="seller-rating-stars"
        style={{ ["--seller-rating-fill" as string]: fillWidth } as CSSProperties}
        aria-hidden="true"
      >
        <span className="seller-rating-stars-base">{stars}</span>
        <span className="seller-rating-stars-fill">{stars}</span>
      </span>
      <span className="seller-rating-value">{average.toFixed(1)}</span>
      {showCount ? <span className="seller-rating-count">({reviewCountSource})</span> : null}
    </div>
  );
}
