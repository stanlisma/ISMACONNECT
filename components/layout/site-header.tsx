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
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "1.25rem",
        height: "1.25rem",
        padding: "0 0.375rem",
        borderRadius: "999px",
        background: "#ef4444",
        color: "white",
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1,
        marginLeft: "0.375rem"
      }}
    >
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

          {viewer ? (
            <>
              <Link className="main-nav-link" href="/messages">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Messages
                  <CountBadge count={unreadMessagesCount} />
                </span>
              </Link>

              <Link className="main-nav-link" href="/notifications">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Notifications
                  <CountBadge count={unreadNotificationsCount} />
                </span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="header-actions">
          {viewer ? (
            <>
              {viewer.profile.role === "admin" ? (
                <Link className="button button-secondary" href="/admin/moderation">
                  Moderation
                </Link>
              ) : null}

              <Link className="button button-secondary" href="/messages">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Messages
                  <CountBadge count={unreadMessagesCount} />
                </span>
              </Link>

              <Link className="button button-secondary" href="/notifications">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Alerts
                  <CountBadge count={unreadNotificationsCount} />
                </span>
              </Link>

              <Link className="button button-secondary" href="/dashboard">
                Dashboard
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
                Register or Sign In
              </Link>
              <Link className="button" href="/auth/sign-up">
                Post a Listing
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}