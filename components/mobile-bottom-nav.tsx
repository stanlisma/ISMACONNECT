"use client";

import { Bell, CircleUserRound, MessageCircle, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface MobileBottomNavProps {
  viewer: boolean;
  unreadMessagesCount: number;
  unreadActivityCount: number;
  unreadActivityMarker: string | null;
}

const CLEARED_NOTIFICATIONS_MARKER_KEY = "ismaconnect-cleared-notifications-marker";

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function MobileBottomNav({
  viewer,
  unreadMessagesCount,
  unreadActivityCount,
  unreadActivityMarker
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [activityBadgeCount, setActivityBadgeCount] = useState(
    pathname === "/notifications" ? 0 : unreadActivityCount
  );
  const previousUnreadActivityMarker = useRef<string | null>(unreadActivityMarker);

  const isSearchSurface =
    pathname === "/" ||
    pathname === "/browse" ||
    pathname.startsWith("/categories/") ||
    pathname === "/rentals" ||
    pathname === "/ride-share" ||
    pathname === "/jobs" ||
    pathname === "/services" ||
    pathname === "/buy-sell" ||
    pathname.startsWith("/listings/");
  const isChatSurface = pathname === "/messages" || pathname.startsWith("/messages/");
  const isPostSurface =
    pathname === "/dashboard/listings/new" ||
    pathname.endsWith("/edit") ||
    pathname.endsWith("/boost");
  const isAlertsSurface = pathname === "/notifications";
  const isAccountSurface =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/account" ||
    pathname === "/saved" ||
    pathname.startsWith("/settings");

  useEffect(() => {
    if (pathname === "/notifications") {
      setActivityBadgeCount(0);

      if (unreadActivityMarker) {
        window.localStorage.setItem(CLEARED_NOTIFICATIONS_MARKER_KEY, unreadActivityMarker);
      } else {
        window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
      }
    }
  }, [pathname, unreadActivityMarker]);

  useEffect(() => {
    const clearedMarker = window.localStorage.getItem(CLEARED_NOTIFICATIONS_MARKER_KEY);

    if (pathname === "/notifications") {
      setActivityBadgeCount(0);
      return;
    }

    if (!unreadActivityMarker || unreadActivityCount <= 0) {
      window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
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
      window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
    }

    setActivityBadgeCount(unreadActivityCount);
    previousUnreadActivityMarker.current = unreadActivityMarker;
  }, [pathname, unreadActivityCount, unreadActivityMarker]);

  return (
    <nav className="mobile-nav">
      <Link href="/browse" className={isSearchSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <Search aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        </span>
        <span>Browse</span>
      </Link>

      <Link href="/messages" className={isChatSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <MessageCircle aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
          {viewer && unreadMessagesCount > 0 ? (
            <span className="mobile-nav-badge">{formatBadgeCount(unreadMessagesCount)}</span>
          ) : null}
        </span>
        <span>Messages</span>
      </Link>

      <Link
        href="/dashboard/listings/new"
        className={`post-button ${isPostSurface ? "active" : ""}`}
      >
        <span className="mobile-nav-icon-wrap">
          <PlusCircle aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        </span>
        <span>Post</span>
      </Link>

      <Link href="/notifications" className={isAlertsSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <Bell aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
          {viewer && activityBadgeCount > 0 ? (
            <span className="mobile-nav-badge">{formatBadgeCount(activityBadgeCount)}</span>
          ) : null}
        </span>
        <span>Alerts</span>
      </Link>

      <Link href="/account" className={isAccountSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <CircleUserRound aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        </span>
        <span>Account</span>
      </Link>
    </nav>
  );
}
