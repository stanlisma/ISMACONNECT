"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendNewMessageEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/env";

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
    .select(`
      id,
      buyer_id,
      seller_id,
      listing:listings(title),
      buyer:profiles!conversations_buyer_id_fkey(email, full_name, email_notifications),
      seller:profiles!conversations_seller_id_fkey(email, full_name, email_notifications)
    `)
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    redirectWithMessage("/messages", "error", "Conversation not found.");
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    redirectWithMessage("/messages", "error", "You do not have access to this conversation.");
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", viewer.user.id)
    .single();

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
    body: "You have a new reply in a conversation.",
    link: `/messages/${conversationId}`
  });

  const recipientProfile = isBuyer
    ? (conversation.seller as {
        email?: string | null;
        full_name?: string | null;
        email_notifications?: boolean | null;
      } | null)
    : (conversation.buyer as {
        email?: string | null;
        full_name?: string | null;
        email_notifications?: boolean | null;
      } | null);

  const listingTitle =
    ((conversation.listing as { title?: string | null } | null)?.title ?? "your listing");

  if (recipientProfile?.email && recipientProfile.email_notifications !== false) {
    try {
      await sendNewMessageEmail({
        to: recipientProfile.email,
        recipientName: recipientProfile.full_name ?? null,
        senderName:
          senderProfile?.full_name ??
          viewer.user.user_metadata?.full_name ??
          "Someone",
        listingTitle,
        conversationUrl: `${getBaseUrl()}/messages/${conversationId}`,
        messagePreview: body
          ? body.length > 240
            ? `${body.slice(0, 240)}…`
            : body
          : "Sent an image attachment."
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  redirect(`/messages/${conversationId}`);
}