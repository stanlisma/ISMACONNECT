"use client";

import Link from "next/link";
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

export function SiteHeader({
  viewer,
  unreadMessagesCount,
  unreadNotificationsCount,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">

        <div className="header-top">
          <Link href="/" className="brand">
            <img src="/logo/logo-light.svg" alt="ISMACONNECT" />
          </Link>

          <form action="/browse" className="header-search">
            <input name="q" placeholder="What are you looking for?" />

            <select name="category" defaultValue="">
              <option value="">All categories</option>
              <option value="rentals">Rentals</option>
              <option value="ride-share">Ride Share</option>
              <option value="jobs">Jobs</option>
              <option value="services">Services</option>
              <option value="buy-sell">Buy & Sell</option>
            </select>

            <button type="submit">Search</button>
          </form>

          <div className="header-actions">
            <InstallButton />

            {viewer ? (
              <>
                <Link href="/messages" className="icon-link">💬</Link>
                <Link href="/notifications" className="icon-link">🔔</Link>
                <Link href="/dashboard/listings/new" className="post-btn">
                  Post
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in" className="plain-link">Login</Link>
                <Link href="/auth/sign-up" className="post-btn">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        <div className="header-bottom">
          <nav className="main-nav">

            <Link href="/browse">Browse</Link>

            {/* RENTALS */}
            <div className="nav-dropdown">
              <Link href="/browse?category=rentals">Rentals</Link>
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
              <Link href="/browse?category=ride-share">Ride Share</Link>
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
              <Link href="/browse?category=jobs">Jobs</Link>
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
              <Link href="/browse?category=services">Services</Link>
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
              <Link href="/browse?category=buy-sell">Buy & Sell</Link>
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