import { ShieldCheck, Star } from "lucide-react";

import {
  hasPublicSellerRating,
  hasPublicTopRatedSeller
} from "@/lib/trust-presentation";
import type { SellerTrustSummary } from "@/types/database";

interface TrustBadgesProps {
  summary?: SellerTrustSummary | null;
  compact?: boolean;
}

export function TrustBadges({ summary, compact = false }: TrustBadgesProps) {
  if (!summary) {
    return null;
  }

  const showVerified = summary.verification_status === "verified";
  const showTopRated = hasPublicTopRatedSeller(summary);
  const showRating = hasPublicSellerRating(summary);

  if (!showVerified && !showTopRated && !showRating) {
    return null;
  }

  return (
    <div className={`trust-badges ${compact ? "is-compact" : ""}`}>
      {showVerified ? (
        <span className="trust-badge trust-badge-verified">
          <ShieldCheck aria-hidden="true" size={compact ? 12 : 14} strokeWidth={2.4} />
          <span>{compact ? "Verified" : "Verified Seller"}</span>
        </span>
      ) : null}

      {showTopRated ? (
        <span className="trust-badge trust-badge-top-rated">
          <Star aria-hidden="true" size={compact ? 12 : 14} strokeWidth={2.4} />
          <span>{compact ? "Top Rated" : "Top Rated Seller"}</span>
        </span>
      ) : null}

      {showRating ? (
        <span className="trust-badge trust-badge-rating">
          <Star aria-hidden="true" size={compact ? 12 : 14} strokeWidth={2.4} />
          <span>
            {summary.average_rating?.toFixed(1)} ({summary.review_count})
          </span>
        </span>
      ) : null}
    </div>
  );
}
