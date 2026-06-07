import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FieldHelp } from "@/components/ui/field-help";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Check Your Email",
  description: "Finish confirming your ISMACONNECT account and learn what to do next."
};

export default async function PostSignUpPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect("/browse");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-shell">
          <div className="auth-card">
            <div className="auth-header-row">
              <span className="eyebrow">Account Created</span>
            </div>

            <h1>Check your email</h1>
            <p>
              We sent a confirmation link to your inbox. Open that email, confirm your account,
              then sign in to start browsing, posting, messaging, and opening storefronts.
            </p>

            <div className="auth-post-signup-card">
              <div className="settings-title-row">
                <h2>Want an ID Verified badge later?</h2>
                <FieldHelp
                  label="Seller verification"
                  text="Verification is optional. An ID Verified badge builds stronger trust on listings and storefronts, which can help people feel more confident about replying. After you confirm your email and sign in, you can start verification any time from Settings."
                />
              </div>
              <p className="section-copy">
                You do not need verification to begin using ISMACONNECT. When you are ready, open
                Settings after sign-in to start it.
              </p>
              <div className="action-row auth-post-signup-actions">
                <Link
                  href="/auth/sign-in?success=Sign in first, then open Settings any time you're ready to start verification."
                  className="button button-secondary"
                >
                  Plan to verify later
                </Link>
              </div>
            </div>

            <div className="action-row auth-post-signup-actions">
              <Link href="/auth/sign-in" className="button">
                Go to sign in
              </Link>
              <Link href="/browse" className="button button-ghost">
                Browse public listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
