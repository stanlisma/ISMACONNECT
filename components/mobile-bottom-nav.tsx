"use client";

import { Heart, List, MessageCircle, PlusCircle, Search } from "lucide-react";
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
  const isListingsSurface =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/account" ||
    pathname.startsWith("/settings") ||
    pathname === "/notifications";
  const isSavedSurface = pathname === "/saved";

  return (
    <nav className="mobile-nav">
      <Link href="/browse" className={isSearchSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <Search aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        </span>
        <span>Search</span>
      </Link>

      <Link href="/messages" className={isChatSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <MessageCircle aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
          {viewer && unreadMessagesCount > 0 ? (
            <span className="mobile-nav-badge">{formatBadgeCount(unreadMessagesCount)}</span>
          ) : null}
        </span>
        <span>Chat</span>
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

      <Link href="/dashboard" className={isListingsSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <List aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
          {viewer && unreadActivityCount > 0 ? (
            <span className="mobile-nav-badge">{formatBadgeCount(unreadActivityCount)}</span>
          ) : null}
        </span>
        <span>Listings</span>
      </Link>

      <Link href="/saved" className={isSavedSurface ? "active" : ""}>
        <span className="mobile-nav-icon-wrap">
          <Heart aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        </span>
        <span>Favourites</span>
      </Link>
    </nav>
  );
}
