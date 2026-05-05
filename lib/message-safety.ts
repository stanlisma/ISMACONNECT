import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BlockedUser, UserReport } from "@/types/database";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface ConversationSafetyState {
  viewerBlockedOther: boolean;
  blockedByOther: boolean;
  blockRecord: BlockedUser | null;
}

export interface ModerationUserReport extends UserReport {
  reporter: {
    full_name: string | null;
    email: string | null;
  } | null;
  reported_user: {
    full_name: string | null;
    email: string | null;
  } | null;
  listing: {
    title: string | null;
    slug: string | null;
  } | null;
}

export async function getConversationSafetyState(
  supabase: ServerSupabase,
  viewerId: string,
  otherUserId: string
): Promise<ConversationSafetyState> {
  const [viewerBlockResult, reverseBlockResult] = await Promise.all([
    supabase
      .from("blocked_users")
      .select("id, blocker_id, blocked_id, conversation_id, reason, created_at")
      .eq("blocker_id", viewerId)
      .eq("blocked_id", otherUserId)
      .maybeSingle(),
    supabase
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", otherUserId)
      .eq("blocked_id", viewerId)
      .maybeSingle()
  ]);

  return {
    viewerBlockedOther: Boolean(viewerBlockResult.data),
    blockedByOther: Boolean(reverseBlockResult.data),
    blockRecord: (viewerBlockResult.data as BlockedUser | null) ?? null
  };
}

export function getMessagingDisabledMessage(state: ConversationSafetyState) {
  if (state.viewerBlockedOther) {
    return "You blocked this user. Messaging is turned off for this conversation.";
  }

  if (state.blockedByOther) {
    return "This user is not available for messaging right now.";
  }

  return null;
}

export async function getExistingConversationReport(
  supabase: ServerSupabase,
  reporterId: string,
  reportedUserId: string,
  conversationId: string
) {
  const { data } = await supabase
    .from("user_reports")
    .select("id, reporter_id, reported_user_id, conversation_id, listing_id, reason, status, created_at, updated_at")
    .eq("reporter_id", reporterId)
    .eq("reported_user_id", reportedUserId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  return (data as UserReport | null) ?? null;
}

export async function getOpenUserReports() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("user_reports")
    .select(`
      id,
      reporter_id,
      reported_user_id,
      conversation_id,
      listing_id,
      reason,
      status,
      created_at,
      updated_at,
      reporter:profiles!user_reports_reporter_id_fkey(full_name, email),
      reported_user:profiles!user_reports_reported_user_id_fkey(full_name, email),
      listing:listings(title, slug)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (data ?? []).map((report: any) => ({
    id: report.id,
    reporter_id: report.reporter_id,
    reported_user_id: report.reported_user_id,
    conversation_id: report.conversation_id,
    listing_id: report.listing_id,
    reason: report.reason,
    status: report.status,
    created_at: report.created_at,
    updated_at: report.updated_at,
    reporter: Array.isArray(report.reporter) ? report.reporter[0] ?? null : report.reporter ?? null,
    reported_user: Array.isArray(report.reported_user)
      ? report.reported_user[0] ?? null
      : report.reported_user ?? null,
    listing: Array.isArray(report.listing) ? report.listing[0] ?? null : report.listing ?? null
  })) as ModerationUserReport[];
}
