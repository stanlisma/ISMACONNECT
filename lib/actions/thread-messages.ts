"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { sendNewMessageEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/env";
import { createNotificationAndPush } from "@/lib/push";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function sendThreadMessageAction(formData: FormData) {
  const conversationId = String(formData.get("conversationId") ?? "").trim();

  if (!conversationId) {
    redirectWithMessage("/messages", "error", "Conversation ID missing.");
  }

  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!body && !imageUrl) {
    redirectWithMessage(`/messages/${conversationId}`, "error", "Message cannot be empty.");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, listing_id, buyer_unread_count, seller_unread_count")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    redirectWithMessage(
      `/messages/${conversationId}`,
      "error",
      conversationError?.message || "Conversation not found or access denied."
    );
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    redirectWithMessage("/messages", "error", "You do not have access to this conversation.");
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: viewer.user.id,
    body: body || "",
    image_url: imageUrl
  });

  if (messageError) {
    redirectWithMessage(`/messages/${conversation.id}`, "error", messageError.message);
  }

  const isBuyer = viewer.user.id === conversation.buyer_id;
  const unreadField = isBuyer ? "seller_unread_count" : "buyer_unread_count";
  const typingField = isBuyer ? "buyer_typing" : "seller_typing";
  const recipientId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  await supabase
    .from("conversations")
    .update({
      [unreadField]: ((conversation as any)[unreadField] ?? 0) + 1,
      [typingField]: false,
      last_message_at: new Date().toISOString()
    })
    .eq("id", conversation.id);

  try {
    await createNotificationAndPush({
      userId: recipientId,
      type: "message",
      title: "New reply",
      body: body ? "You have a new reply in a conversation." : "You received a new image reply.",
      link: `/messages/${conversation.id}`
    });
  } catch (error) {
    console.error("Reply notification failed:", error);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("title")
    .eq("id", conversation.listing_id)
    .maybeSingle();

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("email, full_name, email_notifications")
    .eq("id", recipientId)
    .maybeSingle();

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", viewer.user.id)
    .maybeSingle();

  if (recipientProfile?.email && recipientProfile.email_notifications !== false) {
    try {
      await sendNewMessageEmail({
        to: recipientProfile.email,
        recipientName: recipientProfile.full_name ?? null,
        senderName: senderProfile?.full_name ?? viewer.user.user_metadata?.full_name ?? "Someone",
        listingTitle: listing?.title ?? "your listing",
        conversationUrl: `${getBaseUrl()}/messages/${conversation.id}`,
        messagePreview: body
          ? body.length > 240
            ? `${body.slice(0, 240)}...`
            : body
          : "Sent an image attachment."
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  redirect(`/messages/${conversation.id}`);
}
