import Link from "next/link";
import { notFound } from "next/navigation";

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
      <div className="container" style={{ maxWidth: "960px" }}>
        <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

        <div className="surface" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {listing?.image_url ? (
              <Link href={`/listings/${listing.slug}`}>
                <img
                  src={listing.image_url}
                  alt={listing.title ?? "Listing image"}
                  style={{
                    width: "88px",
                    height: "88px",
                    objectFit: "cover",
                    borderRadius: "16px",
                    border: "1px solid #d0d5dd",
                    display: "block"
                  }}
                />
              </Link>
            ) : (
              <div
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "16px",
                  border: "1px solid #d0d5dd",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#667085",
                  fontSize: "0.9rem",
                  fontWeight: 600
                }}
              >
                Listing
              </div>
            )}

            <div>
              <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>
                <Link
                  href={`/listings/${listing?.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {listing?.title ?? "Conversation"}
                </Link>
              </h1>
              <p className="section-copy" style={{ marginBottom: 0 }}>
                Chat with {otherUserFirstName} about this listing.
              </p>
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
          className="surface"
          style={{ marginTop: "1rem", padding: "1rem" }}
        >
          <input type="hidden" name="conversationId" value={id} />

          <label className="field" style={{ display: "block" }}>
            <span className="field-label">Reply</span>
            <MessageComposer conversationId={id} />
          </label>

          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="button" type="submit">
              Send reply
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}