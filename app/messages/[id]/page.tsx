import Link from "next/link";
import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/ui/flash-message";
import { RealtimeMessages } from "@/components/messages/realtime-messages";
import { MessageComposer } from "@/components/messages/message-composer";
import { sendThreadMessageAction } from "@/lib/actions/thread-messages";
import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export default async function MessageThreadPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
      listing:listings(id, title, slug, owner_id, contact_name),
      seller:profiles!conversations_seller_id_fkey(full_name),
      buyer:profiles!conversations_buyer_id_fkey(full_name)
    `)
    .eq("id", params.id)
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
    .eq("id", params.id);

  await supabase
    .from("messages")
    .update({ seen_at: new Date().toISOString() })
    .eq("conversation_id", params.id)
    .neq("sender_id", viewer.user.id)
    .is("seen_at", null);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, image_url, created_at, sender_id, seen_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const action = sendThreadMessageAction.bind(null, params.id);

  const sellerFullName =
    (conversation.seller as { full_name?: string | null } | null)?.full_name ??
    (conversation.listing as { contact_name?: string | null } | null)?.contact_name ??
    "User";

  const buyerFullName =
    (conversation.buyer as { full_name?: string | null } | null)?.full_name ??
    "User";

  const otherUserFullName = viewer.user.id === conversation.seller_id ? buyerFullName : sellerFullName;
  const otherUserFirstName = otherUserFullName.trim().split(" ")[0] || "User";

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />

        <div className="surface" style={{ marginBottom: "1rem" }}>
          <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>
            <Link
              href={`/listings/${(conversation.listing as any)?.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {(conversation.listing as any)?.title ?? "Conversation"}
            </Link>
          </h1>
          <p className="section-copy">Chat directly about this listing.</p>
        </div>

        <RealtimeMessages
          conversationId={params.id}
          initialMessages={messages ?? []}
          viewerId={viewer.user.id}
          buyerId={conversation.buyer_id}
          sellerId={conversation.seller_id}
          initialBuyerTyping={conversation.buyer_typing}
          initialSellerTyping={conversation.seller_typing}
          otherUserName={otherUserFirstName}
        />

        <form action={action} className="surface" style={{ marginTop: "1rem", padding: "1rem" }}>
          <label className="field" style={{ display: "block" }}>
            <span className="field-label">Reply</span>
            <MessageComposer conversationId={params.id} />
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