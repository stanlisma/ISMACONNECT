import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";
import type { Viewer } from "@/types/database";

interface SiteHeaderProps {
  viewer: Viewer | null;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return <span className="header-count-badge">{count > 99 ? "99+" : count}</span>;
}

export function SiteHeader({
  viewer,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="container site-header-top">
        <Link className="brand" href="/">
          <span className="brand-mark">I</span>
          <span className="brand-copy">
            <strong>ISMACONNECT</strong>
            <small>Fort McMurray Marketplace</small>
          </span>
        </Link>

        <form action="/browse" method="get" className="header-search" role="search">
          <input
            className="header-search-input"
            type="text"
            name="q"
            placeholder="What are you looking for?"
          />

          <select className="header-search-select" name="category" defaultValue="">
            <option value="">All categories</option>
            <option value="rentals">Rentals</option>
            <option value="ride-share">Ride Share</option>
            <option value="jobs">Jobs</option>
            <option value="services">Services</option>
            <option value="buy-sell">Buy &amp; Sell</option>
          </select>

          <button className="button header-search-button" type="submit">
            Search
          </button>
        </form>

        <div className="header-actions">
          {viewer ? (
            <>
              <Link
                className="header-icon-link"
                href="/messages"
                aria-label="Messages"
                title="Messages"
              >
                <MessageCircle size={22} strokeWidth={2.1} />
                <CountBadge count={unreadMessagesCount} />
              </Link>

              <Link
                className="header-icon-link"
                href="/notifications"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={22} strokeWidth={2.1} />
                <CountBadge count={unreadNotificationsCount} />
              </Link>

              <Link className="button button-secondary header-compact-button" href="/dashboard">
                Dashboard
              </Link>

              <Link className="button button-ghost header-compact-button" href="/dashboard/saved">
                Saved
              </Link>

              <Link className="button header-compact-button" href="/dashboard/listings/new">
                Post
              </Link>

              <Link
                className="button button-ghost header-compact-button" href="/settings">
                Settings
              </Link>

              <form action={signOutAction}>
                <button className="button button-ghost header-compact-button" type="submit">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="button button-secondary header-compact-button" href="/auth/sign-in">
                Sign In
              </Link>

              <Link className="button header-compact-button" href="/auth/sign-up">
                Post
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="container site-header-bottom">
        <nav className="nav-links" aria-label="Primary">
          <Link className="main-nav-link" href="/browse">
            Browse
          </Link>
          <Link className="main-nav-link" href="/categories/rentals">
            Rentals
          </Link>
          <Link className="main-nav-link" href="/categories/jobs">
            Jobs
          </Link>
          <Link className="main-nav-link" href="/categories/services">
            Services
          </Link>
          <Link className="main-nav-link" href="/categories/buy-sell">
            Buy &amp; Sell
          </Link>
        </nav>
      </div>
    </header>
  );
}