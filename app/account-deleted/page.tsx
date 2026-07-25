import type { Metadata } from "next";
import Link from "next/link";

import { SITE_SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Account Deleted",
  description: "Your ISMACONNECT account has been deleted."
};

export default function AccountDeletedPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account deleted</p>
          <h1 className="section-title">Your account has been deleted</h1>
          <p className="section-copy">
            Your profile, listings, and storefronts have been removed, and you have been signed out. Some records,
            such as payment history and conversations with other users, are retained where we have a legal or
            fraud-prevention reason to keep them, as described in our Privacy Policy.
          </p>
          <p className="section-copy">
            If this was a mistake or you have questions, contact{" "}
            <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>.
          </p>

          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/" className="button">
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
