"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { sendNewMessageEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/env";
import { createNotificationAndPush } from "@/lib/push";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveUserEmail } from "@/lib/user-email";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function sendListingMessageAction(listingId: string, formData: FormData) {
  const viewer = await requireViewer();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirectWithMessage(`/listings/${listingId}`, "error", "Message cannot be empty.");
  }

  const supabase = await createServerSupabaseClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, slug, owner_id, title, contact_name")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    redirectWithMessage("/browse", "error", "Listing not found.");
  }

  if (listing.owner_id === viewer.user.id) {
    redirectWithMessage(`/listings/${listing.slug}`, "error", "You cannot message your own listing.");
  }

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("full_name, email_notifications")
    .eq("id", listing.owner_id)
    .single();

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", viewer.user.id)
    .single();

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert(
      {
        listing_id: listing.id,
        buyer_id: viewer.user.id,
        seller_id: listing.owner_id,
        last_message_at: new Date().toISOString()
      },
      { onConflict: "listing_id,buyer_id,seller_id" }
    )
    .select("id, buyer_id, seller_id")
    .single();

  if (conversationError || !conversation) {
    redirectWithMessage(
      `/listings/${listing.slug}`,
      "error",
      conversationError?.message || "Could not start conversation."
    );
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: viewer.user.id,
    body
  });

  if (messageError) {
    redirectWithMessage(`/listings/${listing.slug}`, "error", messageError.message);
  }

  const isBuyer = viewer.user.id === conversation.buyer_id;
  const unreadField = isBuyer ? "seller_unread_count" : "buyer_unread_count";
  const recipientId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  const { data: currentConversation } = await supabase
    .from("conversations")
    .select("buyer_unread_count, seller_unread_count")
    .eq("id", conversation.id)
    .single();

  await supabase
    .from("conversations")
    .update({
      [unreadField]: ((currentConversation as any)?.[unreadField] ?? 0) + 1,
      last_message_at: new Date().toISOString()
    })
    .eq("id", conversation.id);

  try {
    await createNotificationAndPush({
      userId: recipientId,
      type: "message",
      title: "New message",
      body: `You have a new message about "${listing.title}"`,
      link: `/messages/${conversation.id}`
    });
  } catch (error) {
    console.error("Message notification failed:", error);
  }

  const recipientAllowsEmail = recipientProfile?.email_notifications !== false;
  const recipientEmail = recipientAllowsEmail ? await resolveUserEmail(recipientId) : null;

  if (recipientEmail && recipientAllowsEmail) {
    try {
      await sendNewMessageEmail({
        to: recipientEmail,
        recipientName: recipientProfile?.full_name ?? listing.contact_name ?? null,
        senderName:
          senderProfile?.full_name ??
          viewer.user.user_metadata?.full_name ??
          "Someone",
        listingTitle: listing.title,
        conversationUrl: `${getBaseUrl()}/messages/${conversation.id}`,
        messagePreview: body.length > 240 ? `${body.slice(0, 240)}...` : body
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  redirectWithMessage(`/messages/${conversation.id}`, "success", "Message sent.");
}
