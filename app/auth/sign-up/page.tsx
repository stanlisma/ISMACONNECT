import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getViewer } from "@/lib/auth";
import { signUpAction } from "@/lib/actions/auth";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an ISMACONNECT account to message posters, save searches, post listings, and manage your activity."
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
        <AuthForm
          action={signUpAction}
          description="Message posters, save searches, post listings, and manage your activity on ISMACONNECT."
          helpText="Use one account to browse, message, save searches, post rides, rentals, jobs, services, and manage storefront activity when you need it."
          message={getSingleParam(resolvedSearchParams?.error)}
          mode="sign-up"
          title="Create your account"
        />
      </div>
    </section>
  );
}
