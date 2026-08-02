import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/lib/actions/auth";
import { getViewer } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to post listings, message local members, and manage your ISMACONNECT account."
};

export default async function SignInPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await getViewer();

  if (viewer) {
    redirect("/browse");
  }

  return (
    <section className="section">
      <div className="container">
        <AuthForm
          action={signInAction}
          description="Sign in to post listings, message local members, and manage your account."
          message={getSingleParam(resolvedSearchParams?.error) ?? getSingleParam(resolvedSearchParams?.success)}
          messageTone={getSingleParam(resolvedSearchParams?.error) ? "error" : "success"}
          mode="sign-in"
          title="Sign in to ISMACONNECT"
        />
      </div>
    </section>
  );
}
