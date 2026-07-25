"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getSafeAppPath(path: string | null | undefined, fallback = "/notifications") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

export async function markNotificationReadAction(notificationId: string, link?: string) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", viewer.user.id);

  if (error) {
    console.error("Failed to mark notification read:", error);
  }

  redirect(getSafeAppPath(link, "/notifications"));
}
