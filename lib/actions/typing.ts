"use server";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function setTypingAction(conversationId: string, isTyping: boolean) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) return;

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) return;

  const field = conversation.buyer_id === viewer.user.id ? "buyer_typing" : "seller_typing";

  await supabase
    .from("conversations")
    .update({ [field]: isTyping })
    .eq("id", conversationId);
}