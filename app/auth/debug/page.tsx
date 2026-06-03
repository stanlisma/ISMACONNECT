import type { Metadata } from "next";

import { AuthDebugClient } from "@/components/auth/auth-debug-client";
import { getServerAuthDiagnostics } from "@/lib/auth-debug";

export const metadata: Metadata = {
  title: "Auth Debug",
  description: "Temporary authentication diagnostics for ISMACONNECT.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthDebugPage() {
  const diagnostics = await getServerAuthDiagnostics();

  return (
    <section className="section">
      <div className="container auth-debug-page">
        <div className="section-heading">
          <span className="eyebrow">Diagnostics</span>
          <h1 className="section-title">Authentication debug</h1>
          <p className="section-copy">
            This temporary page compares what the browser sees against what the server sees for
            your current ISMACONNECT session.
          </p>
        </div>

        <AuthDebugClient initialServerDiagnostics={diagnostics} />
      </div>
    </section>
  );
}
