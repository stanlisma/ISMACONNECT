"use server";

import { redirect } from "next/navigation";

import { getBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data!.email,
    password: parsed.data!.password
  });

  if (error) {
    redirectWithMessage("/auth/sign-in", "error", error.message);
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
    confirmEmail: formData.get("confirmEmail"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    phoneVerificationMethod: formData.get("phoneVerificationMethod"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectWithMessage("/auth/sign-up", "error", firstMessage(parsed.error));
  }

  const fullName = `${parsed.data!.firstName} ${parsed.data!.lastName}`.trim();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data!.email,
    password: parsed.data!.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      data: {
        first_name: parsed.data!.firstName,
        last_name: parsed.data!.lastName,
        full_name: fullName,
        phone: parsed.data!.phone,
        address: parsed.data!.address,
        phone_verification_method: parsed.data!.phoneVerificationMethod
      }
    }
  });

  if (error) {
    redirectWithMessage("/auth/sign-up", "error", error.message);
  }

  redirectWithMessage(
    "/auth/sign-in",
    "success",
    "Account created. Check your email for the confirmation link, then sign in to continue."
  );
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
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

  const supabase = await createServerSupabaseClient();
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

  if (password.length < 6) {
    redirectWithMessage(
      "/auth/reset-password",
      "error",
      "Password must be at least 6 characters."
    );
  }

  if (password !== confirmPassword) {
    redirectWithMessage("/auth/reset-password", "error", "Passwords do not match.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithMessage("/auth/reset-password", "error", error.message);
  }

  redirectWithMessage("/auth/sign-in", "success", "Password updated successfully. Please sign in.");
}
