"use client";

import { Bell, CircleUserRound, MessageCircle, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBottomNavProps {
  viewer: boolean;
  unreadMessagesCount: number;
  unreadActivityCount: number;
}

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function MobileBottomNav({
  viewer,
  unreadMessagesCount,
  unreadActivityCount
}: MobileBottomNavProps) {
  const pathname = usePathname();

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
          {viewer && unreadActivityCount > 0 ? (
            <span className="mobile-nav-badge">{formatBadgeCount(unreadActivityCount)}</span>
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
