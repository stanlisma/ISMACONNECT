import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdminViewer } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminViewer();

  return (
    <section className="dashboard-shell">
      <div className="container">
        <div className="dashboard-header">
          <span className="eyebrow">Admin</span>
          <h1>Moderation queue</h1>
          <p className="section-copy">
            Review flagged listings, restore valid posts, or remove content from public view.
          </p>
          <div className="dashboard-nav">
            <Link className="button button-secondary" href="/admin/moderation">
              Flagged listings
            </Link>
            <Link className="button button-ghost" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

