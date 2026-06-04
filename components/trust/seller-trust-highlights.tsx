import { Clock3, FileText, MailCheck, MessageSquareMore, Phone, Store } from "lucide-react";

import type { PublicSellerSignals } from "@/lib/trust";

interface SellerTrustHighlightsProps {
  signals?: PublicSellerSignals | null;
  compact?: boolean;
  storefrontCount?: number;
  showActiveListings?: boolean;
  showRecentPosts?: boolean;
  showConversationCount?: boolean;
  showStorefrontCount?: boolean;
}

export function SellerTrustHighlights({
  signals,
  compact = false,
  storefrontCount = 0,
  showActiveListings = true,
  showRecentPosts = true,
  showConversationCount = false,
  showStorefrontCount = false
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

  if (signals.last_active_label) {
    items.push({
      key: "active",
      icon: Clock3,
      label: signals.last_active_label,
      tone: "activity"
    });
  }

  if (showRecentPosts && signals.recent_listing_count > 0) {
    items.push({
      key: "recent",
      icon: FileText,
      label: `${signals.recent_listing_count} recent post${signals.recent_listing_count === 1 ? "" : "s"}`,
      tone: "activity"
    });
  }

  if (showActiveListings && signals.active_listing_count > 0) {
    items.push({
      key: "live",
      icon: FileText,
      label: `${signals.active_listing_count} live post${signals.active_listing_count === 1 ? "" : "s"}`,
      tone: "neutral"
    });
  }

  if (showStorefrontCount && storefrontCount > 0) {
    items.push({
      key: "storefronts",
      icon: Store,
      label: `${storefrontCount} storefront${storefrontCount === 1 ? "" : "s"}`,
      tone: "neutral"
    });
  }

  if (showConversationCount && signals.conversation_count > 0) {
    items.push({
      key: "conversations",
      icon: MessageSquareMore,
      label: `${signals.conversation_count} local chat${signals.conversation_count === 1 ? "" : "s"}`,
      tone: "activity"
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
