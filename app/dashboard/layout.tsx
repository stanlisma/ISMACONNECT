import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireViewer } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer();

  return (
    <section className="dashboard-shell">
      <div className="container">
        <DashboardHeader fullName={viewer.profile.full_name} isAdmin={viewer.profile.role === "admin"} />

        {children}
      </div>
    </section>
  );
}
