import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account Suspended"
};

export default async function SuspendedAccountPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth/sign-in");
  }

  if (!viewer.profile.suspended_at) {
    redirect("/account");
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account suspended</p>
          <h1 className="section-title">Your account has been suspended</h1>
          <p className="section-copy">
            An ISMACONNECT admin has suspended your account. Your listings and storefronts are hidden from other
            users, and only an admin can restore your access.
          </p>

          {viewer.profile.suspended_reason ? (
            <p className="section-copy">
              <strong>Reason:</strong> {viewer.profile.suspended_reason}
            </p>
          ) : null}

          <p className="section-copy">
            If you believe this is a mistake, contact{" "}
            <a href="mailto:admin@ismaconnect.ca">admin@ismaconnect.ca</a>.
          </p>

          <div style={{ marginTop: "1rem" }}>
            <SignOutButton className="button button-secondary">Sign out</SignOutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
