import type { CSSProperties } from "react";

import type { SellerTrustSummary } from "@/types/database";

interface SellerRatingInlineProps {
  summary?: SellerTrustSummary | null;
  compact?: boolean;
}

export function SellerRatingInline({ summary, compact = false }: SellerRatingInlineProps) {
  if (!summary || summary.review_count <= 0 || summary.average_rating === null) {
    return null;
  }

  const average = Math.max(0, Math.min(5, summary.average_rating));
  const fillWidth = `${(average / 5) * 100}%`;
  const label = `${average.toFixed(1)} out of 5 from ${summary.review_count} ${
    summary.review_count === 1 ? "review" : "reviews"
  }`;

  return (
    <div className={`seller-rating-inline${compact ? " is-compact" : ""}`} aria-label={label}>
      <span
        className="seller-rating-stars"
        style={{ ["--seller-rating-fill" as string]: fillWidth } as CSSProperties}
        aria-hidden="true"
      >
        <span className="seller-rating-stars-base">★★★★★</span>
        <span className="seller-rating-stars-fill">★★★★★</span>
      </span>
      <span className="seller-rating-value">{average.toFixed(1)}</span>
      <span className="seller-rating-count">({summary.review_count})</span>
    </div>
  );
}
