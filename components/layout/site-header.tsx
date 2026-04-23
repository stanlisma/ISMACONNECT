import Link from "next/link";

import { signOutAction } from "@/lib/actions/auth";
import type { Viewer } from "@/types/database";

interface SiteHeaderProps {
  viewer: Viewer | null;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="header-count-badge">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SiteHeader({
  viewer,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand" href="/">
          <span className="brand-mark">I</span>
          <span className="brand-copy">
            <strong>ISMACONNECT</strong>
            <small>Fort McMurray Marketplace</small>
          </span>
        </Link>

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

        <div className="header-actions">
          {viewer ? (
            <>
              <Link className="header-icon-link" href="/messages" aria-label="Messages" title="Messages">
                <span aria-hidden="true">💬</span>
                <CountBadge count={unreadMessagesCount} />
              </Link>

              <Link
                className="header-icon-link"
                href="/notifications"
                aria-label="Notifications"
                title="Notifications"
              >
                <span aria-hidden="true">🔔</span>
                <CountBadge count={unreadNotificationsCount} />
              </Link>

              {viewer.profile.role === "admin" ? (
                <Link className="button button-secondary" href="/admin/moderation">
                  Moderation
                </Link>
              ) : null}

              <Link className="button button-secondary" href="/dashboard">
                Dashboard
              </Link>

              <Link className="button" href="/dashboard/listings/new">
                Post listing
              </Link>

              <form action={signOutAction}>
                <button className="button button-ghost" type="submit">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="button button-secondary" href="/auth/sign-in">
                Sign In
              </Link>

              <Link className="button" href="/auth/sign-up">
                Post listing
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}