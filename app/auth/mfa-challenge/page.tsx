import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";
import { getViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Two-Factor Verification"
};

export default async function MfaChallengePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth/sign-in");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = getSingleParam(resolvedSearchParams?.next) || "/admin/moderation";

  const supabase = await createServerSupabaseClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === aal.nextLevel) {
    redirect(redirectTo);
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "480px" }}>
        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Two-factor authentication</p>
          <h1 className="section-title">Enter your verification code</h1>
          <p className="section-copy">Open your authenticator app and enter the current 6-digit code.</p>

          <div style={{ marginTop: "1.5rem" }}>
            <MfaChallengeForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </section>
  );
}
