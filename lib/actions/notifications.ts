"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(notificationId: string, link?: string) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", viewer.user.id);

  redirect(link || "/notifications");
}