import type { ReactNode } from "react";
import Link from "next/link";

import { requireViewer } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer();

  return (
    <section className="dashboard-shell">
      <div className="container">
        <div className="dashboard-header">
          <span className="eyebrow">My Listings</span>
          <h1>Manage your marketplace presence</h1>
          <p className="section-copy">
            Signed in as <strong>{viewer.profile.full_name}</strong>. Create listings, edit existing posts,
            and keep your public information current.
          </p>
          <div className="dashboard-nav">
            <Link className="button button-secondary" href="/dashboard">
              Overview
            </Link>
            <Link className="button" href="/dashboard/listings/new">
              New listing
            </Link>
            {viewer.profile.role === "admin" ? (
              <Link className="button button-ghost" href="/admin/moderation">
                Review flags
              </Link>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
