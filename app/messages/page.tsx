import Link from "next/link";
import { Inbox, Search } from "lucide-react";

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
  const normalizedQuery = rawQuery.toLowerCase();

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
      listing:listings(title, slug),
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
    }
  >();

  if (conversationIds.length) {
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, body, image_url, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    (messages ?? []).forEach((message: any) => {
      if (!latestMessageMap.has(message.conversation_id)) {
        latestMessageMap.set(message.conversation_id, {
          body: message.body ?? "",
          image_url: message.image_url ?? null,
          created_at: message.created_at
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
    const preview = latestMessage?.body?.trim()
      ? latestMessage.body.trim()
      : latestMessage?.image_url
        ? "Image attachment"
        : "No messages yet";

    return {
      ...conversation,
      unreadCount,
      otherUserName,
      preview
    };
  });

  const filteredConversations = conversationEntries.filter((conversation) => {
    if (activeFilter === "unread" && conversation.unreadCount < 1) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      conversation.listing?.title ?? "",
      conversation.otherUserName,
      conversation.preview
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const totalUnreadCount = conversationEntries.reduce(
    (total, conversation) => total + (conversation.unreadCount ?? 0),
    0
  );

  const latestConversationAt = conversationEntries[0]?.last_message_at
    ? new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(conversationEntries[0].last_message_at))
    : "No activity yet";

  return (
    <section className="section">
      <div className="container messages-page-container">
        <div className="surface messages-overview-card">
          <div className="messages-overview-head">
            <div className="messages-overview-copy">
              <span className="eyebrow">Inbox</span>
              <h1 className="section-title">Messages</h1>
              <p className="section-copy">
                Keep track of buyers, sellers, and listing conversations from one place.
              </p>
            </div>

            <form action="/messages" method="get" className="messages-toolbar-form">
              <label className="messages-search-field">
                <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                <input
                  className="messages-search-input"
                  type="search"
                  name="q"
                  defaultValue={rawQuery}
                  placeholder="Search by listing, person, or preview"
                />
              </label>

              {activeFilter === "unread" ? <input type="hidden" name="filter" value="unread" /> : null}

              <div className="messages-toolbar-actions">
                <button className="button" type="submit">
                  Search
                </button>
                <Link className="button button-secondary" href="/messages">
                  Clear
                </Link>
              </div>
            </form>
          </div>

          <div className="messages-stats-grid">
            <div className="stat-card messages-stat-card">
              <span>Total conversations</span>
              <strong>{conversationEntries.length}</strong>
            </div>
            <div className="stat-card messages-stat-card">
              <span>Unread messages</span>
              <strong>{totalUnreadCount}</strong>
            </div>
            <div className="stat-card messages-stat-card">
              <span>Filtered results</span>
              <strong>{filteredConversations.length}</strong>
            </div>
            <div className="stat-card messages-stat-card">
              <span>Latest activity</span>
              <strong className="messages-stat-meta">{latestConversationAt}</strong>
            </div>
          </div>

          <div className="pill-row messages-filter-pills">
            <Link
              className={`account-menu-pill ${activeFilter === "all" ? "is-active" : ""}`}
              href={buildMessagesHref({ q: rawQuery || null })}
            >
              All conversations
            </Link>
            <Link
              className={`account-menu-pill ${activeFilter === "unread" ? "is-active" : ""}`}
              href={buildMessagesHref({ q: rawQuery || null, filter: "unread" })}
            >
              Unread only
            </Link>
          </div>
        </div>

        <div className="surface messages-shell">
          <div className="messages-list-pane">
            <div className="messages-list-head">
              <div>
                <h2>Conversation list</h2>
                <p>
                  {activeFilter === "unread"
                    ? "Showing unread threads only."
                    : "Open any thread to reply, send images, or follow up."}
                </p>
              </div>
            </div>

            <div className="messages-list">
              {filteredConversations.length ? (
                filteredConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="messages-list-item"
                  >
                    <div className="messages-list-avatar">
                      {conversation.otherUserName.trim().charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="messages-list-content">
                      <div className="messages-list-topline">
                        <strong>{conversation.listing?.title ?? "Listing conversation"}</strong>
                        {conversation.unreadCount > 0 ? (
                          <span className="messages-unread-badge">{conversation.unreadCount}</span>
                        ) : null}
                      </div>

                      <div className="messages-list-subline">
                        <span className="messages-list-name">{conversation.otherUserName}</span>
                        <span>·</span>
                        <span>
                          {conversation.last_message_at
                            ? new Intl.DateTimeFormat("en-CA", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              }).format(new Date(conversation.last_message_at))
                            : "No messages yet"}
                        </span>
                      </div>

                      <p className="messages-list-preview">
                        {conversation.preview}
                      </p>

                      <div className="messages-list-meta">
                        <span className="messages-list-chip">
                          {conversation.unreadCount > 0 ? "Needs reply" : "Up to date"}
                        </span>
                        {conversation.listing?.slug ? (
                          <span className="messages-list-meta-link">View listing from thread</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="messages-empty-list">
                  {conversationEntries.length ? (
                    <>
                      <h3>No conversations match this view</h3>
                      <p>Try a broader search or switch back to all conversations.</p>
                    </>
                  ) : (
                    <>
                      <h3>No messages yet</h3>
                      <p>Your buyer and seller conversations will appear here as soon as someone reaches out.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="messages-empty-pane">
            <div className="messages-empty-pane-card">
              <div className="messages-empty-pane-icon">
                <Inbox aria-hidden="true" size={28} strokeWidth={2.1} />
              </div>
              <h3>Select a conversation</h3>
              <p>
                Choose a thread on the left to review replies, send a message, or follow up with a buyer or seller.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
