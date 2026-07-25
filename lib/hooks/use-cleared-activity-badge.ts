"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const CLEARED_NOTIFICATIONS_MARKER_KEY = "ismaconnect-cleared-notifications-marker";

function getClearedNotificationsMarkerKey(viewerId?: string | null) {
  return viewerId ? `${CLEARED_NOTIFICATIONS_MARKER_KEY}:${viewerId}` : null;
}

/**
 * Tracks the same "seen /notifications this session" marker used by the header bell
 * and bottom nav, so any surface showing an activity/unread count agrees with them
 * even though visiting /notifications doesn't itself mark rows is_read in the DB
 * (that only happens via the explicit "Mark all read" action).
 */
export function useClearedActivityBadgeCount(
  viewerId: string | null | undefined,
  unreadActivityCount: number,
  unreadActivityMarker: string | null
) {
  const pathname = usePathname();
  const [activityBadgeCount, setActivityBadgeCount] = useState(
    pathname === "/notifications" ? 0 : unreadActivityCount
  );
  const previousUnreadActivityMarker = useRef<string | null>(unreadActivityMarker);

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const markerStorageKey = getClearedNotificationsMarkerKey(viewerId);

    if (pathname === "/notifications") {
      setActivityBadgeCount(0);

      if (markerStorageKey) {
        if (unreadActivityMarker) {
          window.localStorage.setItem(markerStorageKey, unreadActivityMarker);
        } else {
          window.localStorage.removeItem(markerStorageKey);
        }
      }
    }
  }, [pathname, unreadActivityMarker, viewerId]);

  useEffect(() => {
    if (!viewerId) {
      setActivityBadgeCount(0);
      previousUnreadActivityMarker.current = unreadActivityMarker;
      return;
    }

    const markerStorageKey = getClearedNotificationsMarkerKey(viewerId);
    const clearedMarker = markerStorageKey ? window.localStorage.getItem(markerStorageKey) : null;

    if (pathname === "/notifications") {
      setActivityBadgeCount(0);
      return;
    }

    if (!unreadActivityMarker || unreadActivityCount <= 0) {
      if (markerStorageKey) {
        window.localStorage.removeItem(markerStorageKey);
      }
      setActivityBadgeCount(0);
      previousUnreadActivityMarker.current = unreadActivityMarker;
      return;
    }

    if (clearedMarker && clearedMarker === unreadActivityMarker) {
      setActivityBadgeCount(0);
      previousUnreadActivityMarker.current = unreadActivityMarker;
      return;
    }

    if (
      previousUnreadActivityMarker.current &&
      previousUnreadActivityMarker.current !== unreadActivityMarker
    ) {
      if (markerStorageKey) {
        window.localStorage.removeItem(markerStorageKey);
      }
    }

    setActivityBadgeCount(unreadActivityCount);
    previousUnreadActivityMarker.current = unreadActivityMarker;
  }, [pathname, unreadActivityCount, unreadActivityMarker, viewerId]);

  return activityBadgeCount;
}
