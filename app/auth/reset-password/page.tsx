import type { Metadata } from "next";

import { FlashMessage } from "@/components/ui/flash-message";
import { resetPasswordAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your ISMACONNECT account."
};

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />

        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account recovery</p>
          <h1 className="section-title">Set a new password</h1>
          <p className="section-copy">
            Enter your new password below.
          </p>

          <form action={resetPasswordAction} className="stack-md" style={{ marginTop: "1.5rem" }}>
            <label className="field">
              <span className="field-label">New password</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Enter new password"
              />
            </label>

            <label className="field">
              <span className="field-label">Confirm new password</span>
              <input
                className="input"
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Confirm new password"
              />
            </label>

            <button className="button" type="submit">
              Update password
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}