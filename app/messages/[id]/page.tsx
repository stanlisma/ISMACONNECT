import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, ImageIcon, ShieldAlert, ShieldBan } from "lucide-react";

import { MessageComposer } from "@/components/messages/message-composer";
import { RealtimeMessages } from "@/components/messages/realtime-messages";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import { blockConversationUserAction, reportConversationUserAction } from "@/lib/actions/message-safety";
import { sendThreadMessageAction } from "@/lib/actions/thread-messages";
import { requireViewer } from "@/lib/auth";
import {
  getConversationSafetyState,
  getExistingConversationReport,
  getMessagingDisabledMessage
} from "@/lib/message-safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export default async function MessageThreadPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id,
      buyer_id,
      seller_id,
      buyer_typing,
      seller_typing,
      listing:listings(id, title, slug, owner_id, contact_name, image_url),
      seller:profiles!conversations_seller_id_fkey(full_name),
      buyer:profiles!conversations_buyer_id_fkey(full_name)
    `)
    .eq("id", id)
    .single();

  if (!conversation) {
    notFound();
  }

  if (conversation.buyer_id !== viewer.user.id && conversation.seller_id !== viewer.user.id) {
    notFound();
  }

  const isBuyer = conversation.buyer_id === viewer.user.id;
  const otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  await supabase
    .from("conversations")
    .update({
      [isBuyer ? "buyer_unread_count" : "seller_unread_count"]: 0
    })
    .eq("id", id);

  await supabase
    .from("messages")
    .update({ seen_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .neq("sender_id", viewer.user.id)
    .is("seen_at", null);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, image_url, created_at, sender_id, seen_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const sellerFullName =
    (conversation.seller as { full_name?: string | null } | null)?.full_name ??
    (conversation.listing as { contact_name?: string | null } | null)?.contact_name ??
    "User";

  const buyerFullName =
    (conversation.buyer as { full_name?: string | null } | null)?.full_name ?? "User";

  const otherUserFullName =
    viewer.user.id === conversation.seller_id ? buyerFullName : sellerFullName;

  const otherUserFirstName = otherUserFullName.trim().split(" ")[0] || "User";
  const safetyState = await getConversationSafetyState(supabase, viewer.user.id, otherUserId);
  const existingReport = await getExistingConversationReport(supabase, viewer.user.id, otherUserId, id);
  const messagingDisabledMessage = getMessagingDisabledMessage(safetyState);

  const listing = conversation.listing as {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    image_url?: string | null;
  } | null;

  return (
    <section className="section">
      <div className="container messages-thread-page-container">
        <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

        <div className="surface messages-thread-hero">
          <div className="messages-thread-back">
            <Link href="/messages" className="button button-secondary messages-thread-back-link">
              <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.4} />
              <span>Back to inbox</span>
            </Link>
          </div>

          <div className="messages-thread-summary">
            {listing?.image_url ? (
              <Link href={`/listings/${listing.slug}`} className="messages-thread-listing-thumb">
                <img
                  src={listing.image_url}
                  alt={listing.title ?? "Listing image"}
                />
              </Link>
            ) : (
              <div className="messages-thread-listing-thumb messages-thread-listing-thumb-placeholder">
                <ImageIcon aria-hidden="true" size={20} strokeWidth={2.1} />
              </div>
            )}

            <div className="messages-thread-copy">
              <span className="eyebrow">Conversation</span>
              <h1 className="section-title">
                {listing?.slug ? (
                  <Link href={`/listings/${listing.slug}`} className="messages-thread-title-link">
                    {listing.title ?? "Conversation"}
                  </Link>
                ) : (
                  <span>{listing?.title ?? "Conversation"}</span>
                )}
              </h1>
              <p className="section-copy">
                Chat with {otherUserFirstName} about this listing and keep everything in one thread.
              </p>

              <div className="messages-thread-meta">
                <span className="messages-thread-person-pill">{otherUserFullName}</span>
                {safetyState.viewerBlockedOther ? <span className="badge badge-neutral">Blocked</span> : null}
                {existingReport ? <span className="badge badge-soft">Reported</span> : null}
                {listing?.slug ? (
                  <Link href={`/listings/${listing.slug}`} className="messages-thread-listing-link">
                    <span>View public listing</span>
                    <ExternalLink aria-hidden="true" size={14} strokeWidth={2.3} />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="surface messages-safety-panel">
          <div className="messages-safety-head">
            <div>
              <span className="eyebrow">Safety tools</span>
              <h2>Manage this conversation</h2>
            </div>
            <p>
              Use these controls if someone is spamming, harassing, or behaving suspiciously in chat.
            </p>
          </div>

          {messagingDisabledMessage ? (
            <div className="messages-safety-notice is-blocked">
              <ShieldBan aria-hidden="true" size={18} strokeWidth={2.2} />
              <span>{messagingDisabledMessage}</span>
            </div>
          ) : null}

          {existingReport ? (
            <div className="messages-safety-notice">
              <ShieldAlert aria-hidden="true" size={18} strokeWidth={2.2} />
              <span>Your report is already in the moderation queue. Submit again to update the reason if needed.</span>
            </div>
          ) : null}

          <div className="messages-safety-grid">
            <form action={blockConversationUserAction} className="messages-safety-card">
              <input type="hidden" name="conversationId" value={id} />
              <input type="hidden" name="blockedUserId" value={otherUserId} />
              <input type="hidden" name="reason" value="Blocked from conversation" />

              <div className="messages-safety-card-copy">
                <strong>Block user</strong>
                <p>Turn off messaging in this thread immediately. They will no longer be able to send you replies here.</p>
              </div>

              <SubmitButton
                className="button button-ghost button-danger"
                pendingLabel="Blocking..."
                disabled={safetyState.viewerBlockedOther}
              >
                {safetyState.viewerBlockedOther ? "User blocked" : "Block user"}
              </SubmitButton>
            </form>

            <form action={reportConversationUserAction} className="messages-safety-card">
              <input type="hidden" name="conversationId" value={id} />
              <input type="hidden" name="reportedUserId" value={otherUserId} />
              <input type="hidden" name="listingId" value={listing?.id ?? ""} />

              <div className="messages-safety-card-copy">
                <strong>Report user</strong>
                <p>Send this conversation to the moderation queue if it looks like spam, harassment, or a scam.</p>
              </div>

              <label className="field">
                <span className="field-label">Reason</span>
                <select name="reason" className="input" defaultValue={existingReport?.reason ?? "spam"}>
                  <option value="spam">Spam or unwanted contact</option>
                  <option value="harassment">Harassment or abusive language</option>
                  <option value="scam">Scam or suspicious payment request</option>
                  <option value="fake-listing">Fake listing or misleading info</option>
                  <option value="other">Other safety concern</option>
                </select>
              </label>

              <SubmitButton className="button button-secondary" pendingLabel="Submitting...">
                {existingReport ? "Update report" : "Report user"}
              </SubmitButton>
            </form>
          </div>
        </div>

        <RealtimeMessages
          conversationId={id}
          initialMessages={messages ?? []}
          viewerId={viewer.user.id}
          buyerId={conversation.buyer_id}
          sellerId={conversation.seller_id}
          initialBuyerTyping={conversation.buyer_typing}
          initialSellerTyping={conversation.seller_typing}
          otherUserName={otherUserFirstName}
        />

        <form
          action={sendThreadMessageAction}
          className="surface messages-reply-shell"
        >
          <input type="hidden" name="conversationId" value={id} />

          <div className="messages-reply-head">
            <div>
              <h2>Send reply</h2>
              <p>Keep it clear and local. Photos, pickup details, and timing questions usually get the fastest response.</p>
            </div>
          </div>

          <label className="field messages-reply-field">
            <span className="field-label">Reply</span>
            <MessageComposer
              conversationId={id}
              disabled={Boolean(messagingDisabledMessage)}
              disabledMessage={messagingDisabledMessage}
            />
          </label>

          <div className="messages-reply-actions">
            <SubmitButton
              className="button"
              pendingLabel="Sending..."
              disabled={Boolean(messagingDisabledMessage)}
            >
              {messagingDisabledMessage ? "Messaging disabled" : "Send reply"}
            </SubmitButton>
          </div>
        </form>
      </div>
    </section>
  );
}
