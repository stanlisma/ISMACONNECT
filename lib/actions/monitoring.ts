"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminViewer } from "@/lib/auth";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function dismissAppErrorLogAction(logId: string) {
  await requireAdminViewer();

  const supabase = isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();

  const { error } = await supabase.from("app_error_logs").delete().eq("id", logId);

  if (error) {
    redirectWithMessage("/admin/moderation", "error", error.message);
  }

  revalidatePath("/admin/moderation");
  redirectWithMessage("/admin/moderation", "success", "Error log dismissed.");
}
