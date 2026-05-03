import type { Metadata } from "next";
import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your ISMACONNECT account."
};

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
        <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account recovery</p>
          <h1 className="section-title">Forgot your password?</h1>
          <p className="section-copy">
            Enter the email linked to your account and we’ll send you a password reset link.
          </p>

          <form action={forgotPasswordAction} className="stack-md" style={{ marginTop: "1.5rem" }}>
            <label className="field">
              <span className="field-label">Email address</span>
              <input
                className="input"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
              />
            </label>

            <button className="button" type="submit">
              Send reset link
            </button>
          </form>

          <div style={{ marginTop: "1rem" }}>
            <Link href="/auth/sign-in" className="button button-secondary">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
