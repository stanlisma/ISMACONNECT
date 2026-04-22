"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    .select("id, slug, owner_id, title")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    redirectWithMessage("/browse", "error", "Listing not found.");
  }

  if (listing.owner_id === viewer.user.id) {
    redirectWithMessage(`/listings/${listing.slug}`, "error", "You cannot message your own listing.");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert(
      {
        listing_id: listing.id,
        buyer_id: viewer.user.id,
        seller_id: listing.owner_id
      },
      { onConflict: "listing_id,buyer_id,seller_id" }
    )
    .select("id")
    .single();

  if (conversationError || !conversation) {
    redirectWithMessage(`/listings/${listing.slug}`, "error", conversationError?.message || "Could not start conversation.");
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: viewer.user.id,
    body
  });

  if (messageError) {
    redirectWithMessage(`/listings/${listing.slug}`, "error", messageError.message);
  }

  redirectWithMessage(`/messages/${conversation.id}`, "success", "Message sent.");
}