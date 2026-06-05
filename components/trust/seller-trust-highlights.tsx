import { MailCheck, Phone } from "lucide-react";

import type { PublicSellerSignals } from "@/lib/trust";

interface SellerTrustHighlightsProps {
  signals?: PublicSellerSignals | null;
  compact?: boolean;
}

export function SellerTrustHighlights({
  signals,
  compact = false
}: SellerTrustHighlightsProps) {
  if (!signals) {
    return null;
  }

  const items: Array<{
    key: string;
    icon: typeof MailCheck;
    label: string;
    tone: "verified" | "activity" | "neutral";
  }> = [];

  if (signals.email_confirmed) {
    items.push({
      key: "email",
      icon: MailCheck,
      label: "Email confirmed",
      tone: "verified"
    });
  }

  if (signals.phone_verified) {
    items.push({
      key: "phone",
      icon: Phone,
      label: "Phone confirmed",
      tone: "verified"
    });
  }

  if (!items.length) {
    return null;
  }

  return (
    <div className={`seller-trust-highlights${compact ? " is-compact" : ""}`}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <span
            key={item.key}
            className={`seller-trust-highlight seller-trust-highlight-${item.tone}`}
          >
            <Icon aria-hidden="true" size={compact ? 13 : 14} strokeWidth={2.2} />
            <span>{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}
