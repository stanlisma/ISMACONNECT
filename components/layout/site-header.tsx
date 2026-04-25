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
          <Link href="/" className="brand" aria-label="ISMACONNECT home">
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
                <Link href="/messages" className="icon-link" aria-label="Messages">
                  💬
                  {unreadMessagesCount > 0 && (
                    <span className="badge">{unreadMessagesCount}</span>
                  )}
                </Link>

                <Link
                  href="/notifications"
                  className="icon-link"
                  aria-label="Notifications"
                >
                  🔔
                  {unreadNotificationsCount > 0 && (
                    <span className="badge">{unreadNotificationsCount}</span>
                  )}
                </Link>

                <Link href="/dashboard/listings/new" className="post-btn">
                  Post
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in" className="plain-link">
                  Login
                </Link>

                <Link href="/auth/sign-up" className="post-btn">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="header-bottom">
          <nav className="main-nav" aria-label="Marketplace navigation">
            <Link href="/browse">Browse</Link>
            <Link href="/browse?category=rentals">Rentals</Link>
            <Link href="/browse?category=ride-share">Ride Share</Link>
            <Link href="/browse?category=jobs">Jobs</Link>
            <Link href="/browse?category=services">Services</Link>
            <Link href="/browse?category=buy-sell">Buy & Sell</Link>
            <Link href="/categories">Categories</Link>
          </nav>

          {viewer && (
            <nav className="account-nav" aria-label="Account navigation">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/saved">Saved</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/auth/sign-out">Sign Out</Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
