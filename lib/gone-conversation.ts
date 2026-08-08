import type { SupabaseClient } from "@supabase/supabase-js";

const CONVERSATION_ID_PATTERN = /^\/messages\/([^/]+)\/?$/;

export function extractConversationId(pathname: string): string | null {
  const match = CONVERSATION_ID_PATTERN.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

// RLS on conversations already scopes SELECT to buyer_id = auth.uid() or
// seller_id = auth.uid(), so this single query answers both "does it exist"
// and "is the viewer a participant" - anything it can't see is gone for
// this viewer, same as the page's own notFound() check. Same
// streaming-status limitation as lib/gone-listing.ts and lib/gone-seller.ts.
export async function isConversationGone(
  supabase: SupabaseClient,
  conversationId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      return false;
    }

    return !data;
  } catch {
    return false;
  }
}
