"use client";

import { useClearedActivityBadgeCount } from "@/lib/hooks/use-cleared-activity-badge";

interface AccountUnreadStatProps {
  viewerId: string;
  unreadMessagesCount: number;
  unreadActivityCount: number;
  unreadActivityMarker: string | null;
}

export function AccountUnreadStat({
  viewerId,
  unreadMessagesCount,
  unreadActivityCount,
  unreadActivityMarker
}: AccountUnreadStatProps) {
  const activityBadgeCount = useClearedActivityBadgeCount(viewerId, unreadActivityCount, unreadActivityMarker);
  const unreadTotal = unreadMessagesCount + activityBadgeCount;

  return (
    <div className="account-stat-card">
      <span className="account-stat-label">Unread</span>
      <strong>{unreadTotal}</strong>
    </div>
  );
}
