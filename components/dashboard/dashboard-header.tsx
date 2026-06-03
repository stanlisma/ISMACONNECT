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
  const isOverviewPath = pathname === "/dashboard";
  const isStorefrontsPath = pathname.startsWith("/dashboard/storefronts");
  const heading = isStorefrontsPath ? "My storefronts" : "My listings";
  const subheading = isStorefrontsPath
    ? "Keep your public business pages sharp and easy to trust."
    : "Edit live posts, refresh details, and keep replies moving.";

  if (isListingEditorPath(pathname)) {
    return null;
  }

  return (
    <div className="dashboard-header dashboard-header-compact">
      <div className="dashboard-header-main">
        <h1>{heading}</h1>
        <p className="dashboard-header-meta">{fullName ? `${fullName} · ${subheading}` : subheading}</p>
      </div>

      <div className="dashboard-nav dashboard-nav-compact">
        {!isOverviewPath ? (
          <Link className="button button-secondary" href="/dashboard">
            Overview
          </Link>
        ) : null}
        <Link className="button button-secondary" href="/dashboard/storefronts">
          Storefronts
        </Link>
        <Link className="button button-secondary" href="/dashboard/searches">
          Searches
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
