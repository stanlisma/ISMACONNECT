import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FlashMessage } from "@/components/ui/flash-message";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordAction } from "@/lib/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your ISMACONNECT account."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  // The recovery link only establishes an AAL1 session, but Supabase
  // rejects updateUser({ password }) for MFA-enrolled accounts unless the
  // session has been elevated to AAL2 - send them through the same
  // challenge sign-in already uses, then land back here to finish.
  const supabase = await createServerSupabaseClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect("/auth/mfa-challenge?next=/auth/reset-password");
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
        <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account recovery</p>
          <h1 className="section-title">Set a new password</h1>
          <p className="section-copy">
            Enter your new password below.
          </p>

          <form action={resetPasswordAction} className="stack-md" style={{ marginTop: "1.5rem" }}>
            <label className="field">
              <span className="field-label">New password</span>
              <PasswordInput
                name="password"
                required
                minLength={8}
                placeholder="Use at least 8 characters"
              />
            </label>

            <label className="field">
              <span className="field-label">Confirm new password</span>
              <PasswordInput
                name="confirmPassword"
                required
                minLength={8}
                placeholder="Confirm your new password"
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
