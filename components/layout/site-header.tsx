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
  categories: Record<string, string[]>;
}

function formatLabel(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SiteHeader({
  viewer,
  unreadMessagesCount,
  unreadNotificationsCount,
  categories,
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

              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {formatLabel(category)}
                </option>
              ))}
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

            {Object.entries(categories).map(([category, subcategories]) => (
              <div className="nav-dropdown" key={category}>
                <Link href={`/browse?category=${category}`}>
                  {formatLabel(category)}
                </Link>

                {subcategories.length > 0 && (
                  <div className="nav-dropdown-menu">
                    {subcategories.map((subcategory) => (
                      <Link
                        key={subcategory}
                        href={`/browse?category=${category}&subcategory=${subcategory}`}
                      >
                        {formatLabel(subcategory)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {viewer && (
            <nav className="account-nav" aria-label="Account navigation">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/saved">Saved</Link>
              <Link href="/settings">Settings</Link>

              <button
                className="plain-link"
                onClick={async () => {
                  const { createBrowserSupabaseClient } = await import(
                    "@/lib/supabase/client"
                  );
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