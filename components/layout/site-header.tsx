"use client";

import { Bell, MessageCircle, Plus, Search } from "lucide-react";
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
}: SiteHeaderProps) {
  const pathname = usePathname();
  const usePageLevelBrowseSearch =
    pathname === "/browse" || pathname.startsWith("/categories/");

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-top">
          <Link href="/" className="brand" aria-label="ISMACONNECT home">
            <img src="/logo/logo-light.svg" alt="ISMACONNECT" />
          </Link>

          <form
            action="/browse"
            className={`header-search market-header-search${usePageLevelBrowseSearch ? " market-header-search-hidden-mobile" : ""}`}
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
                <Link href="/messages" className="icon-link header-utility-link" aria-label="Messages">
                  <MessageCircle aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {unreadMessagesCount > 0 ? (
                    <span className="header-action-badge">{formatBadgeCount(unreadMessagesCount)}</span>
                  ) : null}
                </Link>

                <Link href="/notifications" className="icon-link header-utility-link" aria-label="Notifications">
                  <Bell aria-hidden="true" className="header-action-icon" strokeWidth={2.2} />
                  {unreadNotificationsCount > 0 ? (
                    <span className="header-action-badge">{formatBadgeCount(unreadNotificationsCount)}</span>
                  ) : null}
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

        <div
          className={`header-bottom market-header-bottom${usePageLevelBrowseSearch ? " market-header-bottom-hidden-mobile" : ""}`}
        >
          <nav className="main-nav market-main-nav">

            <Link href="/browse" className="market-nav-link market-nav-link-all">Browse</Link>

            {/* RENTALS */}
            <div className="nav-dropdown">
              <Link href="/browse?category=rentals" className="market-nav-link">Rentals</Link>
              <div className="nav-dropdown-menu">
                <a href="/browse?category=rentals&subcategory=apartments">Apartments</a>
                <a href="/browse?category=rentals&subcategory=rooms-for-rent">Rooms for Rent</a>
                <a href="/browse?category=rentals&subcategory=short-term-rentals">Short-Term Rentals</a>
                <a href="/browse?category=rentals&subcategory=basement-suites">Basement Suites</a>
                <a href="/browse?category=rentals&subcategory=furnished-rentals">Furnished Rentals</a>
                <a href="/browse?category=rentals&subcategory=storage-parking">Storage / Parking</a>
              </div>
            </div>

            {/* RIDE SHARE */}
            <div className="nav-dropdown">
              <Link href="/browse?category=ride-share" className="market-nav-link">Ride Share</Link>
              <div className="nav-dropdown-menu">
                <a href="/browse?category=ride-share&subcategory=daily-commute">Daily Commute</a>
                <a href="/browse?category=ride-share&subcategory=camp-rides">Camp Rides</a>
                <a href="/browse?category=ride-share&subcategory=airport-rides">Airport Rides</a>
                <a href="/browse?category=ride-share&subcategory=edmonton-calgary-trips">Edmonton / Calgary Trips</a>
                <a href="/browse?category=ride-share&subcategory=one-time-rides">One-Time Rides</a>
                <a href="/browse?category=ride-share&subcategory=drivers-available">Drivers Available</a>
              </div>
            </div>

            {/* JOBS */}
            <div className="nav-dropdown">
              <Link href="/browse?category=jobs" className="market-nav-link">Jobs</Link>
              <div className="nav-dropdown-menu">
                <a href="/browse?category=jobs&subcategory=full-time">Full-Time</a>
                <a href="/browse?category=jobs&subcategory=part-time">Part-Time</a>
                <a href="/browse?category=jobs&subcategory=contract">Contract</a>
                <a href="/browse?category=jobs&subcategory=camp-jobs">Camp Jobs</a>
                <a href="/browse?category=jobs&subcategory=skilled-trades">Skilled Trades</a>
                <a href="/browse?category=jobs&subcategory=general-labour">General Labour</a>
              </div>
            </div>

            {/* SERVICES */}
            <div className="nav-dropdown">
              <Link href="/browse?category=services" className="market-nav-link">Services</Link>
              <div className="nav-dropdown-menu">
                <a href="/browse?category=services&subcategory=cleaning">Cleaning</a>
                <a href="/browse?category=services&subcategory=moving">Moving</a>
                <a href="/browse?category=services&subcategory=repairs-handyman">Repairs / Handyman</a>
                <a href="/browse?category=services&subcategory=tutoring">Tutoring</a>
                <a href="/browse?category=services&subcategory=beauty-personal-care">Beauty / Personal Care</a>
                <a href="/browse?category=services&subcategory=senior-care">Senior Care</a>
                <a href="/browse?category=services&subcategory=automotive-services">Automotive Services</a>
              </div>
            </div>

            {/* BUY & SELL */}
            <div className="nav-dropdown">
              <Link href="/browse?category=buy-sell" className="market-nav-link">Buy & Sell</Link>
              <div className="nav-dropdown-menu">
                <a href="/browse?category=buy-sell&subcategory=furniture">Furniture</a>
                <a href="/browse?category=buy-sell&subcategory=electronics">Electronics</a>
                <a href="/browse?category=buy-sell&subcategory=tools-equipment">Tools & Equipment</a>
                <a href="/browse?category=buy-sell&subcategory=appliances">Appliances</a>
                <a href="/browse?category=buy-sell&subcategory=clothing">Clothing</a>
                <a href="/browse?category=buy-sell&subcategory=baby-kids-items">Baby / Kids Items</a>
                <a href="/browse?category=buy-sell&subcategory=vehicles-parts">Vehicles / Parts</a>
              </div>
            </div>

          </nav>

          {viewer && (
            <nav className="account-nav">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/saved">Saved</Link>
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
      </div>
    </header>
  );
}
