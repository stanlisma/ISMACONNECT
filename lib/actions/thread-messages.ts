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
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!body && !imageUrl) {
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
    body: body || "",
    image_url: imageUrl
  });

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, "error", error.message);
  }

  const isBuyer = viewer.user.id === conversation.buyer_id;
  const unreadField = isBuyer ? "seller_unread_count" : "buyer_unread_count";
  const typingField = isBuyer ? "buyer_typing" : "seller_typing";
  const recipientId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  const { data: currentConversation } = await supabase
    .from("conversations")
    .select("buyer_unread_count, seller_unread_count")
    .eq("id", conversationId)
    .single();

  await supabase
    .from("conversations")
    .update({
      [unreadField]: ((currentConversation as any)?.[unreadField] ?? 0) + 1,
      [typingField]: false,
      last_message_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "message",
    title: "New reply",
    body: "You have a new message.",
    link: `/messages/${conversationId}`
  });

  redirect(`/messages/${conversationId}`);
}