"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { getConversationSafetyState } from "@/lib/message-safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function blockConversationUserAction(formData: FormData) {
  const viewer = await requireViewer();
  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const blockedUserId = String(formData.get("blockedUserId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!conversationId || !blockedUserId) {
    redirectWithMessage("/messages", "error", "Conversation details are missing.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    redirectWithMessage("/messages", "error", "Conversation not found.");
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    redirectWithMessage("/messages", "error", "You do not have access to this conversation.");
  }

  const otherUserId = conversation.buyer_id === viewer.user.id ? conversation.seller_id : conversation.buyer_id;

  if (otherUserId !== blockedUserId || blockedUserId === viewer.user.id) {
    redirectWithMessage(`/messages/${conversationId}`, "error", "Invalid user selected for blocking.");
  }

  const safetyState = await getConversationSafetyState(supabase, viewer.user.id, blockedUserId);

  if (safetyState.viewerBlockedOther) {
    redirectWithMessage(`/messages/${conversationId}`, "success", "This user is already blocked.");
  }

  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: viewer.user.id,
    blocked_id: blockedUserId,
    conversation_id: conversationId,
    reason
  });

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, "error", error.message);
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/admin/moderation");
  redirectWithMessage(`/messages/${conversationId}`, "success", "User blocked. Messaging has been turned off.");
}

export async function reportConversationUserAction(formData: FormData) {
  const viewer = await requireViewer();
  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const reportedUserId = String(formData.get("reportedUserId") ?? "").trim();
  const listingId = String(formData.get("listingId") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!conversationId || !reportedUserId) {
    redirectWithMessage("/messages", "error", "Conversation details are missing.");
  }

  if (reason.length < 4) {
    redirectWithMessage(`/messages/${conversationId}`, "error", "Choose a report reason before submitting.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    redirectWithMessage("/messages", "error", "Conversation not found.");
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    redirectWithMessage("/messages", "error", "You do not have access to this conversation.");
  }

  const otherUserId = conversation.buyer_id === viewer.user.id ? conversation.seller_id : conversation.buyer_id;

  if (otherUserId !== reportedUserId || reportedUserId === viewer.user.id) {
    redirectWithMessage(`/messages/${conversationId}`, "error", "Invalid user selected for reporting.");
  }

  const { data: existingReport } = await supabase
    .from("user_reports")
    .select("id")
    .eq("reporter_id", viewer.user.id)
    .eq("reported_user_id", reportedUserId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  const payload = {
    reporter_id: viewer.user.id,
    reported_user_id: reportedUserId,
    conversation_id: conversationId,
    listing_id: listingId,
    reason,
    status: "open"
  };

  const { error } = existingReport
    ? await supabase.from("user_reports").update(payload).eq("id", existingReport.id)
    : await supabase.from("user_reports").insert(payload);

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, "error", error.message);
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/admin/moderation");
  redirectWithMessage(`/messages/${conversationId}`, "success", "Report submitted for admin review.");
}

export async function reviewUserReportAction(reportId: string, status: "resolved" | "dismissed") {
  await requireAdminViewer();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("user_reports")
    .update({
      status
    })
    .eq("id", reportId);

  if (error) {
    redirectWithMessage("/admin/moderation", "error", error.message);
  }

  revalidatePath("/admin/moderation");
  redirectWithMessage(
    "/admin/moderation",
    "success",
    status === "resolved" ? "User report resolved." : "User report dismissed."
  );
}
