import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSavedSearchAlertState } from "@/lib/saved-searches";

export interface UnreadActivitySummary {
  count: number;
  marker: string | null;
}

export async function getUnreadActivitySummary(userId: string): Promise<UnreadActivitySummary> {
  const supabase = await createServerSupabaseClient();

  const [notificationsResult, savedSearchAlertsState] = await Promise.all([
    supabase
      .from("notifications")
      .select("created_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1),
    getSavedSearchAlertState(userId)
  ]);

  const count = (notificationsResult.count ?? 0) + savedSearchAlertsState.count;

  const latestUnreadNotificationAt = notificationsResult.data?.[0]?.created_at ?? null;
  const latestUnreadSavedSearchAt = savedSearchAlertsState.latestCreatedAt ?? null;

  const marker =
    [latestUnreadNotificationAt, latestUnreadSavedSearchAt]
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

  return { count, marker };
}
