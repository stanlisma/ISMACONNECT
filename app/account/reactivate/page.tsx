import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import { reactivateAccountAction } from "@/lib/actions/account";
import { getViewer } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reactivate Your Account"
};

export default async function ReactivateAccountPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth/sign-in");
  }

  if (!viewer.profile.deactivated_at) {
    redirect("/account");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px" }}>
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

        <div className="surface" style={{ padding: "2rem", borderRadius: "24px" }}>
          <p className="eyebrow">Account deactivated</p>
          <h1 className="section-title">Your account is deactivated</h1>
          <p className="section-copy">
            Your profile, listings, and storefronts are hidden from other users. Nothing was deleted — reactivate
            below to bring everything back exactly as it was.
          </p>

          <form action={reactivateAccountAction} style={{ marginTop: "1.5rem" }}>
            <SubmitButton pendingLabel="Reactivating...">Reactivate my account</SubmitButton>
          </form>

          <div style={{ marginTop: "1rem" }}>
            <SignOutButton className="button button-secondary">Sign out instead</SignOutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
