import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { getViewer } from "@/lib/auth";
import { signInAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your ISMACONNECT dashboard to manage listings."
};

export default async function SignInPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const viewer = await getViewer();

  if (viewer) {
    redirect("/dashboard");
  }

  return (
    <section className="section">
      <div className="container">
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />
        <AuthForm
          action={signInAction}
          description="Sign in to publish listings, update your posts, and manage flags from your dashboard."
          mode="sign-in"
          title="Sign in to ISMACONNECT"
        />
      </div>
    </section>
  );
}

