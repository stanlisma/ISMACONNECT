"use client";

import { useClearedActivityBadgeCount } from "@/lib/hooks/use-cleared-activity-badge";

interface AccountActivityBadgeProps {
  viewerId: string;
  unreadActivityCount: number;
  unreadActivityMarker: string | null;
}

export function AccountActivityBadge({
  viewerId,
  unreadActivityCount,
  unreadActivityMarker
}: AccountActivityBadgeProps) {
  const activityBadgeCount = useClearedActivityBadgeCount(viewerId, unreadActivityCount, unreadActivityMarker);

  if (activityBadgeCount <= 0) {
    return null;
  }

  return <span className="account-menu-badge">{activityBadgeCount}</span>;
}
