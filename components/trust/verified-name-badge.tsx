import { BadgeCheck } from "lucide-react";

import { isVerifiedSeller } from "@/lib/trust";
import type { SellerTrustSummary } from "@/types/database";

export function VerifiedNameBadge({
  summary,
  compact = false
}: {
  summary?: SellerTrustSummary | null;
  compact?: boolean;
}) {
  if (!isVerifiedSeller(summary)) {
    return null;
  }

  return (
    <span
      className={`verified-name-badge${compact ? " is-compact" : ""}`}
      aria-label="Verified account"
      title="Verified account"
    >
      <BadgeCheck aria-hidden="true" size={compact ? 15 : 17} strokeWidth={2.3} />
    </span>
  );
}
