"use server";

import { redirect } from "next/navigation";

import { getBaseUrl, isSupabaseConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createMutableServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { firstMessage } from "@/lib/utils";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectWithMessage("/auth/sign-in", "error", "Add your Supabase keys before signing in.");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectWithMessage("/auth/sign-in", "error", firstMessage(parsed.error));
  }

  const supabase = await createMutableServerSupabaseClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data!.email,
    password: parsed.data!.password
  });

  if (error) {
    if (error.code === "user_banned") {
      const bannedProfile = isSupabaseServiceRoleConfigured()
        ? (
            await createServiceRoleSupabaseClient()
              .from("profiles")
              .select("suspended_at")
              .eq("email", parsed.data!.email)
              .maybeSingle()
          ).data
        : null;

      redirectWithMessage(
        "/auth/sign-in",
        "error",
        bannedProfile?.suspended_at
          ? "This account has been suspended. Contact admin@ismaconnect.ca if you believe this is a mistake."
          : "This account has been deleted and can no longer be used to sign in."
      );
    }

    redirectWithMessage("/auth/sign-in", "error", error.message);
  }

  if (signInData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("deactivated_at")
      .eq("id", signInData.user.id)
      .maybeSingle();

    if (profile?.deactivated_at) {
      redirect("/account/reactivate");
    }
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect("/auth/mfa-challenge");
  }

  redirect("/browse");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectWithMessage("/auth/sign-up", "error", "Add your Supabase keys before creating an account.");
  }

  const parsed = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirectWithMessage("/auth/sign-up", "error", firstMessage(parsed.error));
  }

  const fullName = `${parsed.data!.firstName} ${parsed.data!.lastName}`.trim();

  const supabase = await createMutableServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data!.email,
    password: parsed.data!.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      data: {
        first_name: parsed.data!.firstName,
        last_name: parsed.data!.lastName,
        full_name: fullName
      }
    }
  });

  if (error) {
    redirectWithMessage("/auth/sign-up", "error", error.message);
  }

  redirect("/auth/post-sign-up");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createMutableServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectWithMessage(
      "/auth/forgot-password",
      "error",
      "Add your Supabase keys before resetting a password."
    );
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirectWithMessage("/auth/forgot-password", "error", "Email is required.");
  }

  const supabase = await createMutableServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/auth/reset-password`
  });

  if (error) {
    redirectWithMessage("/auth/forgot-password", "error", error.message);
  }

  redirectWithMessage(
    "/auth/sign-in",
    "success",
    "Password reset link sent. Check your email."
  );
}

export async function resetPasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectWithMessage(
      "/auth/reset-password",
      "error",
      "Add your Supabase keys before resetting a password."
    );
  }

  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!password) {
    redirectWithMessage("/auth/reset-password", "error", "Password is required.");
  }

  if (password.length < 8) {
    redirectWithMessage(
      "/auth/reset-password",
      "error",
      "Password must be at least 8 characters."
    );
  }

  if (password !== confirmPassword) {
    redirectWithMessage("/auth/reset-password", "error", "Passwords do not match.");
  }

  const supabase = await createMutableServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithMessage("/auth/reset-password", "error", error.message);
  }

  redirectWithMessage("/auth/sign-in", "success", "Password updated successfully. Please sign in.");
}
