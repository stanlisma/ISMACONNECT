"use client";

import { Bell, MessageCircle, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveMessageState } from "@/components/messages/live-message-provider";
import { CATEGORIES } from "@/lib/constants";
import { useClearedActivityBadgeCount } from "@/lib/hooks/use-cleared-activity-badge";
import { getSubcategories } from "@/lib/subcategories";
import "./site-header.css";

type Viewer = {
  user: {
    id: string;
    email?: string;
  };
} | null;

interface SiteHeaderProps {
  viewer: Viewer;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  unreadNotificationsMarker: string | null;
}

function formatBadgeCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export function SiteHeader({
  viewer,
  unreadMessagesCount,
  unreadNotificationsCount,
  unreadNotificationsMarker,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { unreadMessagesCount: liveUnreadMessagesCount } = useLiveMessageState();
  const viewerId = viewer?.user.id ?? null;
  const notificationBadgeCount = useClearedActivityBadgeCount(
    viewerId,
    unreadNotificationsCount,
    unreadNotificationsMarker
  );
  const headerCategoryLinks = CATEGORIES.filter((category) => category.value !== "buy-sell").map((category) => ({
    ...category,
    subcategories: getSubcategories(category.value)
  }));

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-top">
          <Link href="/" className="brand" aria-label="ISMACONNECT home">
            <img src="/logo/logo-light.svg" alt="ISMACONNECT" />
          </Link>

          <form
            action="/browse"
            className="header-search market-header-search market-header-search-hidden-mobile"
          >
            <label className="header-search-field">
              <Search aria-hidden="true" className="header-search-icon" strokeWidth={2.2} />
              <input name="q" placeholder="Search Fort McMurray listings" aria-label="Search listings" />
            </label>

            <select name="category" defaultValue="" className="header-search-select" aria-label="Choose a category">
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <button type="submit" className="header-search-submit" aria-label="Search">
              <Search aria-hidden="true" className="header-search-submit-icon" strokeWidth={2.4} />
              <span>Search</span>
            </button>
          </form>

          <div className="header-actions market-header-actions">
            {viewer ? (
              <>
                <Link
                  href="/messages"
                  className="icon-link header-utility-link header-messages-link"
                  aria-label="Messages"
                >
                  <MessageCircle aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {(liveUnreadMessagesCount || unreadMessagesCount) > 0 ? (
                    <span className="header-action-badge">
                      {formatBadgeCount(liveUnreadMessagesCount || unreadMessagesCount)}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href="/notifications"
                  className="icon-link header-utility-link header-notifications-link"
                  aria-label="Notifications"
                >
                  <Bell aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {notificationBadgeCount > 0 ? (
                    <span className="header-action-badge">{formatBadgeCount(notificationBadgeCount)}</span>
                  ) : null}
                </Link>

                <Link
                  href="/account"
                  className="icon-link header-utility-link header-account-link"
                  aria-label="Account"
                >
                  <User aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                </Link>

                <Link href="/dashboard/listings/new" className="post-btn post-btn-market header-post-link">
                  <Plus aria-hidden="true" className="post-btn-icon" strokeWidth={2.6} />
                  <span>Post</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in" className="plain-link header-auth-link">Sign in</Link>
                <Link href="/auth/sign-up" className="post-btn post-btn-market">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        <div className="header-bottom market-header-bottom market-header-bottom-hidden-mobile">
          <nav className="main-nav market-main-nav">

            <Link href="/browse" className="market-nav-link market-nav-link-all">Browse</Link>

            {headerCategoryLinks.map((category) => (
              <div key={category.value} className="nav-dropdown">
                <Link href={category.href} className="market-nav-link">
                  {category.label}
                </Link>
                <div className="nav-dropdown-menu">
                  {category.subcategories.map((item) => (
                    <Link
                      key={item.value}
                      href={`${category.href}?subcategory=${item.value}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

          </nav>

          {viewer && (
            <nav className="account-nav">
              <Link href="/dashboard">My Listings</Link>
              <Link href="/dashboard/storefronts">Storefronts</Link>
              <Link href="/dashboard/searches">Saved Searches</Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
