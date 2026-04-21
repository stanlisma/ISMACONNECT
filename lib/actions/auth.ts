"use server";

import { redirect } from "next/navigation";

import { getBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { firstMessage } from "@/lib/utils";

function redirectWithMessage(path: string, key: "error" | "success", message: string) {
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

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectWithMessage("/auth/sign-up", "error", "Add your Supabase keys before creating an account.");
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectWithMessage("/auth/sign-up", "error", firstMessage(parsed.error));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data!.email,
    password: parsed.data!.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      data: {
        full_name: parsed.data!.fullName
      }
    }
  });

  if (error) {
    redirectWithMessage("/auth/sign-up", "error", error.message);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirectWithMessage(
    "/auth/sign-in",
    "success",
    "Account created. Check your inbox if email confirmation is enabled."
  );
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

