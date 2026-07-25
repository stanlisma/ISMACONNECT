import Link from "next/link";
import { Search } from "lucide-react";

import { MessagesInboxLive } from "@/components/messages/messages-inbox-live";
import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

function buildMessagesHref(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `/messages?${queryString}` : "/messages";
}

export default async function MessagesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawQuery = getSingleParam(resolvedSearchParams?.q)?.trim() ?? "";
  const activeFilter = getSingleParam(resolvedSearchParams?.filter) === "unread" ? "unread" : "all";

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      created_at,
      last_message_at,
      buyer_id,
      seller_id,
      buyer_unread_count,
      seller_unread_count,
      buyer_typing,
      seller_typing,
      listing:listings(title, slug, image_url),
      seller:profiles!conversations_seller_id_fkey(full_name),
      buyer:profiles!conversations_buyer_id_fkey(full_name)
    `)
    .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`)
    .order("last_message_at", { ascending: false });

  const conversationIds = (conversations ?? []).map((conversation: any) => conversation.id);
  const latestMessageMap = new Map<
    string,
    {
      body: string;
      image_url: string | null;
      created_at: string;
      sender_id: string | null;
    }
  >();

  if (conversationIds.length) {
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, body, image_url, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    (messages ?? []).forEach((message: any) => {
      if (!latestMessageMap.has(message.conversation_id)) {
        latestMessageMap.set(message.conversation_id, {
          body: message.body ?? "",
          image_url: message.image_url ?? null,
          created_at: message.created_at,
          sender_id: message.sender_id ?? null
        });
      }
    });
  }

  const conversationEntries = (conversations ?? []).map((conversation: any) => {
    const unreadCount =
      conversation.buyer_id === viewer.user.id
        ? conversation.buyer_unread_count
        : conversation.seller_unread_count;

    const otherUserName =
      conversation.buyer_id === viewer.user.id
        ? conversation.seller?.full_name ?? "Seller"
        : conversation.buyer?.full_name ?? "Buyer";

    const latestMessage = latestMessageMap.get(conversation.id);
    const otherTyping =
      conversation.buyer_id === viewer.user.id
        ? Boolean(conversation.seller_typing)
        : Boolean(conversation.buyer_typing);
    const preview = latestMessage?.body?.trim()
      ? latestMessage.sender_id === viewer.user.id
        ? `You: ${latestMessage.body.trim()}`
        : latestMessage.body.trim()
      : latestMessage?.image_url
        ? latestMessage.sender_id === viewer.user.id
          ? "You sent a photo"
          : "Sent a photo"
        : "No messages yet";
    const sortTimestamp =
      latestMessage?.created_at ?? conversation.last_message_at ?? conversation.created_at;

    return {
      id: conversation.id,
      created_at: conversation.created_at,
      last_message_at: conversation.last_message_at,
      sortTimestamp,
      buyer_id: conversation.buyer_id,
      seller_id: conversation.seller_id,
      buyer_unread_count: conversation.buyer_unread_count ?? 0,
      seller_unread_count: conversation.seller_unread_count ?? 0,
      buyer_typing: Boolean(conversation.buyer_typing),
      seller_typing: Boolean(conversation.seller_typing),
      listingTitle: conversation.listing?.title ?? null,
      listingSlug: conversation.listing?.slug ?? null,
      listingImageUrl: conversation.listing?.image_url ?? null,
      unreadCount,
      otherUserName,
      preview: otherTyping ? `${otherUserName.split(" ")[0] || "Someone"} is typing...` : preview,
      previewSenderId: latestMessage?.sender_id ?? null
    };
  });
  conversationEntries.sort(
    (a, b) => new Date(b.sortTimestamp).getTime() - new Date(a.sortTimestamp).getTime()
  );
  const unreadThreadCount = conversationEntries.filter((conversation) => conversation.unreadCount > 0).length;

  return (
    <section className="section">
      <div className="container messages-page-container">
        <div className="messages-page-header">
          <div className="messages-overview-head">
            <div className="messages-overview-copy">
              <h1 className="section-title">Messages</h1>
            </div>

            <form action="/messages" method="get" className="messages-toolbar-form">
              <label className="messages-search-field">
                <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                <input
                  className="messages-search-input"
                  type="search"
                  name="q"
                  defaultValue={rawQuery}
                  placeholder="Search messages"
                />
              </label>

              {activeFilter === "unread" ? <input type="hidden" name="filter" value="unread" /> : null}

              <div className="messages-toolbar-actions">
                <button className="button" type="submit">
                  Search
                </button>
                {rawQuery || activeFilter === "unread" ? (
                  <Link className="button button-secondary" href="/messages">
                    Clear
                  </Link>
                ) : null}
              </div>
            </form>
          </div>

          <div className="pill-row messages-filter-pills">
            <Link
              className={`account-menu-pill ${activeFilter === "all" ? "is-active" : ""}`}
              href={buildMessagesHref({ q: rawQuery || null })}
            >
              All
            </Link>
            {unreadThreadCount > 0 || activeFilter === "unread" ? (
              <Link
                className={`account-menu-pill ${activeFilter === "unread" ? "is-active" : ""}`}
                href={buildMessagesHref({ q: rawQuery || null, filter: "unread" })}
              >
                Unread{unreadThreadCount > 0 ? ` (${unreadThreadCount})` : ""}
              </Link>
            ) : null}
          </div>
        </div>

        <MessagesInboxLive
          viewerId={viewer.user.id}
          activeFilter={activeFilter}
          rawQuery={rawQuery}
          initialConversations={conversationEntries}
        />
      </div>
    </section>
  );
}
