"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InstallButton from "@/components/install-button";
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

const CLEARED_NOTIFICATIONS_MARKER_KEY = "ismaconnect-cleared-notifications-marker";

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
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(
    pathname === "/notifications" ? 0 : unreadNotificationsCount
  );
  const previousUnreadNotificationsMarker = useRef<string | null>(unreadNotificationsMarker);
  const isExactPath = (path: string) => pathname === path;
  const isPathGroup = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  useEffect(() => {
    if (pathname === "/notifications") {
      setNotificationBadgeCount(0);

      if (unreadNotificationsMarker) {
        window.localStorage.setItem(CLEARED_NOTIFICATIONS_MARKER_KEY, unreadNotificationsMarker);
      } else {
        window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
      }
    }
  }, [pathname, unreadNotificationsMarker]);

  useEffect(() => {
    const clearedMarker = window.localStorage.getItem(CLEARED_NOTIFICATIONS_MARKER_KEY);

    if (pathname === "/notifications") {
      setNotificationBadgeCount(0);
      return;
    }

    if (!unreadNotificationsMarker || unreadNotificationsCount <= 0) {
      window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
      setNotificationBadgeCount(0);
      previousUnreadNotificationsMarker.current = unreadNotificationsMarker;
      return;
    }

    if (clearedMarker && clearedMarker === unreadNotificationsMarker) {
      setNotificationBadgeCount(0);
      previousUnreadNotificationsMarker.current = unreadNotificationsMarker;
      return;
    }

    if (
      previousUnreadNotificationsMarker.current &&
      previousUnreadNotificationsMarker.current !== unreadNotificationsMarker
    ) {
      window.localStorage.removeItem(CLEARED_NOTIFICATIONS_MARKER_KEY);
    }

    setNotificationBadgeCount(unreadNotificationsCount);
    previousUnreadNotificationsMarker.current = unreadNotificationsMarker;
  }, [pathname, unreadNotificationsCount, unreadNotificationsMarker]);

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
              <option value="rentals">Rentals</option>
              <option value="ride-share">Ride Share</option>
              <option value="jobs">Jobs</option>
              <option value="services">Services</option>
              <option value="buy-sell">Buy & Sell</option>
            </select>

            <button type="submit" className="header-search-submit" aria-label="Search">
              <Search aria-hidden="true" className="header-search-submit-icon" strokeWidth={2.4} />
              <span>Search</span>
            </button>
          </form>

          <div className="header-actions market-header-actions">
            <InstallButton />

            {viewer ? (
              <>
                <Link
                  href="/messages"
                  className="icon-link header-utility-link header-messages-link"
                  aria-label="Messages"
                >
                  <MessageCircle aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {unreadMessagesCount > 0 ? (
                    <span className="header-action-badge">{formatBadgeCount(unreadMessagesCount)}</span>
                  ) : null}
                </Link>

                <Link href="/notifications" className="icon-link header-utility-link" aria-label="Notifications">
                  <Bell aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {notificationBadgeCount > 0 ? (
                    <span className="header-action-badge">{formatBadgeCount(notificationBadgeCount)}</span>
                  ) : null}
                </Link>

                <Link href="/account" className="icon-link header-utility-link header-account-link" aria-label="Account">
                  <User aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                </Link>

                <Link href="/dashboard/listings/new" className="post-btn post-btn-market">
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

            {/* RENTALS */}
            <div className="nav-dropdown">
              <Link href="/categories/rentals" className="market-nav-link">Rentals</Link>
              <div className="nav-dropdown-menu">
                <Link href="/categories/rentals?subcategory=apartments">Apartments</Link>
                <Link href="/categories/rentals?subcategory=rooms-for-rent">Rooms for Rent</Link>
                <Link href="/categories/rentals?subcategory=short-term-rentals">Short-Term Rentals</Link>
                <Link href="/categories/rentals?subcategory=basement-suites">Basement Suites</Link>
                <Link href="/categories/rentals?subcategory=furnished-rentals">Furnished Rentals</Link>
                <Link href="/categories/rentals?subcategory=storage-parking">Storage / Parking</Link>
              </div>
            </div>

            {/* RIDE SHARE */}
            <div className="nav-dropdown">
              <Link href="/categories/ride-share" className="market-nav-link">Ride Share</Link>
              <div className="nav-dropdown-menu">
                <Link href="/categories/ride-share?subcategory=daily-commute&view=map">Daily Commute</Link>
                <Link href="/categories/ride-share?subcategory=camp-rides&view=map">Camp Rides</Link>
                <Link href="/categories/ride-share?subcategory=airport-rides&view=map">Airport Rides</Link>
                <Link href="/categories/ride-share?subcategory=edmonton-calgary-trips&view=map">Edmonton / Calgary Trips</Link>
                <Link href="/categories/ride-share?subcategory=one-time-rides&view=map">One-Time Rides</Link>
                <Link href="/categories/ride-share?subcategory=drivers-available&view=map">Drivers Available</Link>
              </div>
            </div>

            {/* JOBS */}
            <div className="nav-dropdown">
              <Link href="/categories/jobs" className="market-nav-link">Jobs</Link>
              <div className="nav-dropdown-menu">
                <Link href="/categories/jobs?subcategory=full-time">Full-Time</Link>
                <Link href="/categories/jobs?subcategory=part-time">Part-Time</Link>
                <Link href="/categories/jobs?subcategory=contract">Contract</Link>
                <Link href="/categories/jobs?subcategory=camp-jobs">Camp Jobs</Link>
                <Link href="/categories/jobs?subcategory=skilled-trades">Skilled Trades</Link>
                <Link href="/categories/jobs?subcategory=general-labour">General Labour</Link>
              </div>
            </div>

            {/* SERVICES */}
            <div className="nav-dropdown">
              <Link href="/categories/services" className="market-nav-link">Services</Link>
              <div className="nav-dropdown-menu">
                <Link href="/categories/services?subcategory=cleaning">Cleaning</Link>
                <Link href="/categories/services?subcategory=moving">Moving</Link>
                <Link href="/categories/services?subcategory=repairs-handyman">Repairs / Handyman</Link>
                <Link href="/categories/services?subcategory=tutoring">Tutoring</Link>
                <Link href="/categories/services?subcategory=beauty-personal-care">Beauty / Personal Care</Link>
                <Link href="/categories/services?subcategory=senior-care">Senior Care</Link>
                <Link href="/categories/services?subcategory=automotive-services">Automotive Services</Link>
              </div>
            </div>

            {/* BUY & SELL */}
            <div className="nav-dropdown">
              <Link href="/categories/buy-sell" className="market-nav-link">Buy & Sell</Link>
              <div className="nav-dropdown-menu">
                <Link href="/categories/buy-sell?subcategory=furniture">Furniture</Link>
                <Link href="/categories/buy-sell?subcategory=electronics">Electronics</Link>
                <Link href="/categories/buy-sell?subcategory=tools-equipment">Tools & Equipment</Link>
                <Link href="/categories/buy-sell?subcategory=appliances">Appliances</Link>
                <Link href="/categories/buy-sell?subcategory=clothing">Clothing</Link>
                <Link href="/categories/buy-sell?subcategory=baby-kids-items">Baby / Kids Items</Link>
                <Link href="/categories/buy-sell?subcategory=vehicles-parts">Vehicles / Parts</Link>
              </div>
            </div>

          </nav>

          {viewer && (
            <nav className="account-nav">
              <Link href="/dashboard">My Listings</Link>
              <Link href="/dashboard/searches">Saved Searches</Link>
              <Link href="/dashboard/saved">Favourites</Link>
              <Link href="/settings">Settings</Link>

              <button
                className="plain-link"
                onClick={async () => {
                  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
                  const supabase = createBrowserSupabaseClient();

                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign Out
              </button>
            </nav>
          )}
        </div>

        {viewer ? (
          <nav className="mobile-account-nav" aria-label="Mobile account shortcuts">
            <Link href="/dashboard" className={isExactPath("/dashboard") ? "is-active" : ""}>
              Listings
            </Link>
            <Link href="/dashboard/searches" className={isPathGroup("/dashboard/searches") ? "is-active" : ""}>
              Saved Searches
            </Link>
            <Link href="/dashboard/saved" className={isPathGroup("/dashboard/saved") ? "is-active" : ""}>
              Favourites
            </Link>
            <Link href="/settings" className={isPathGroup("/settings") ? "is-active" : ""}>
              Settings
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
