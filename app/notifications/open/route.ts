import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/notifications";
  }

  return next;
}

export async function GET(request: Request) {
  const viewer = await getViewer();

  if (!viewer) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const url = new URL(request.url);
  const notificationId = url.searchParams.get("notification");
  const savedSearchId = url.searchParams.get("savedSearch");
  const markAll = url.searchParams.get("all") === "1";
  const next = getSafeNextPath(url.searchParams.get("next"));
  const viewedAt = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  if (markAll) {
    await Promise.all([
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", viewer.user.id)
        .eq("is_read", false),
      supabase
        .from("saved_searches")
        .update({ last_checked_at: viewedAt })
        .eq("user_id", viewer.user.id)
    ]);
  } else {
    await Promise.all([
      notificationId
        ? supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
            .eq("user_id", viewer.user.id)
        : Promise.resolve(),
      savedSearchId
        ? supabase
            .from("saved_searches")
            .update({ last_checked_at: viewedAt })
            .eq("id", savedSearchId)
            .eq("user_id", viewer.user.id)
        : Promise.resolve()
    ]);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
