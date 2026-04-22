"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function sendThreadMessageAction(conversationId: string, formData: FormData) {
  const viewer = await requireViewer();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirectWithMessage(`/messages/${conversationId}`, "error", "Message cannot be empty.");
  }

  const supabase = await createServerSupabaseClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    redirectWithMessage("/messages", "error", "Conversation not found.");
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    redirectWithMessage("/messages", "error", "You do not have access to this conversation.");
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: viewer.user.id,
    body
  });

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, "error", error.message);
  }

  redirect(`/messages/${conversationId}`);
}