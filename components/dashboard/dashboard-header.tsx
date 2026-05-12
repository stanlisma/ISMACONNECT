"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardHeaderProps = {
  fullName?: string | null;
  isAdmin: boolean;
};

function isListingEditorPath(pathname: string) {
  return pathname === "/dashboard/listings/new" || /^\/dashboard\/listings\/[^/]+\/edit$/.test(pathname);
}

export function DashboardHeader({ fullName, isAdmin }: DashboardHeaderProps) {
  const pathname = usePathname();

  if (isListingEditorPath(pathname)) {
    return null;
  }

  return (
    <div className="dashboard-header">
      <span className="eyebrow">My Listings</span>
      <h1>Manage your marketplace presence</h1>
      <p className="section-copy">
        Signed in as <strong>{fullName || "Local member"}</strong>. Create listings, edit existing posts, and keep
        your public information current.
      </p>
      <div className="dashboard-nav">
        <Link className="button button-secondary" href="/dashboard">
          Overview
        </Link>
        <Link className="button button-secondary" href="/saved">
          Favourites
        </Link>
        <Link className="button button-secondary" href="/dashboard/searches">
          Saved searches
        </Link>
        <Link className="button button-secondary" href="/dashboard/boosts">
          Boost products
        </Link>
        <Link className="button" href="/dashboard/listings/new">
          New listing
        </Link>
        {isAdmin ? (
          <Link className="button button-ghost" href="/admin/moderation">
            Review flags
          </Link>
        ) : null}
      </div>
    </div>
  );
}
