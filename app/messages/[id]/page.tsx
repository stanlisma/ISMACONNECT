import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, ImageIcon } from "lucide-react";

import { MessageComposer } from "@/components/messages/message-composer";
import { RealtimeMessages } from "@/components/messages/realtime-messages";
import { FlashMessage } from "@/components/ui/flash-message";
import { sendThreadMessageAction } from "@/lib/actions/thread-messages";
import { requireViewer } from "@/lib/auth";
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

  const listing = conversation.listing as {
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
            <MessageComposer conversationId={id} />
          </label>

          <div className="messages-reply-actions">
            <button className="button" type="submit">
              Send reply
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
