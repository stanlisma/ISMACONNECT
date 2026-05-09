import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppErrorLog } from "@/types/database";

export async function getRecentAppErrorLogs(limit = 10) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("app_error_logs")
    .select("id, user_id, source, message, name, stack, pathname, user_agent, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AppErrorLog[];
}
