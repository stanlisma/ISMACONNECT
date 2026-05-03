import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { getViewer } from "@/lib/auth";
import { signUpAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an ISMACONNECT account and start posting local marketplace listings."
};

export default async function SignUpPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await getViewer();

  if (viewer) {
    redirect("/dashboard");
  }

  return (
    <section className="section">
      <div className="container">
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
        <AuthForm
          action={signUpAction}
          description="Create an account to post listings, edit them later, and manage responses from buyers, renters, and applicants."
          mode="sign-up"
          title="Create your seller account"
        />
      </div>
    </section>
  );
}
