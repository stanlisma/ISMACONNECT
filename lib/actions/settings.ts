"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateNotificationSettingsAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const emailNotifications =
    formData.get("email_notifications") === "on";

  await supabase
    .from("profiles")
    .update({
      email_notifications: emailNotifications
    })
    .eq("id", viewer.user.id);

  redirect("/settings?success=Settings updated");
}