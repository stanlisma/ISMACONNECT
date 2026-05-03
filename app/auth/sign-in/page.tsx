import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { getViewer } from "@/lib/auth";
import { signInAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to browse Fort McMurray listings and manage your ISMACONNECT account."
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
        <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
        <AuthForm
          action={signInAction}
          description="Sign in to browse local listings, publish your own posts, and manage your account."
          mode="sign-in"
          title="Sign in to ISMACONNECT"
        />
      </div>
    </section>
  );
}
