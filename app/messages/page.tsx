import Link from "next/link";

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

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <div className="surface" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "1rem"
            }}
          >
            <div>
              <span className="eyebrow">Inbox</span>
              <h1 className="section-title" style={{ marginBottom: "0.4rem" }}>
                Messages
              </h1>
              <p className="section-copy" style={{ marginBottom: 0 }}>
                Keep track of buyers, sellers, and listing conversations from one place.
              </p>
            </div>

            <form action="/messages" method="get" className="messages-toolbar-form">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="field-label">Search conversations</span>
                <input
                  className="input"
                  type="search"
                  name="q"
                  defaultValue={rawQuery}
                  placeholder="Search by listing or person"
                />
              </label>

              {activeFilter === "unread" ? <input type="hidden" name="filter" value="unread" /> : null}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="button" type="submit">
                  Search
                </button>
                <Link className="button button-secondary" href="/messages">
                  Clear
                </Link>
              </div>
            </form>
          </div>

          <div className="stats-grid" style={{ marginTop: "1rem" }}>
            <div className="stat-card">
              <span>Total conversations</span>
              <strong>{conversationEntries.length}</strong>
            </div>
            <div className="stat-card">
              <span>Unread messages</span>
              <strong>{totalUnreadCount}</strong>
            </div>
            <div className="stat-card">
              <span>Filtered results</span>
              <strong>{filteredConversations.length}</strong>
            </div>
          </div>

          <div className="pill-row" style={{ marginTop: "1rem" }}>
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
          <div style={{ borderRight: "1px solid #e5e7eb" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Conversation list</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredConversations.length ? (
                filteredConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #f2f4f7",
                      textDecoration: "none",
                      color: "inherit"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.75rem"
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", marginBottom: "0.2rem" }}>
                          {conversation.listing?.title ?? "Listing conversation"}
                        </strong>
                        <span style={{ display: "block", color: "#1e3a8a", fontSize: "0.88rem", fontWeight: 600 }}>
                          {conversation.otherUserName}
                        </span>
                        <small
                          style={{
                            color: "#667085",
                            display: "block",
                            marginTop: "0.3rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {conversation.preview}
                        </small>
                        <small style={{ color: "#94a3b8", display: "block", marginTop: "0.35rem" }}>
                          {conversation.last_message_at
                            ? new Date(conversation.last_message_at).toLocaleString()
                            : "No messages yet"}
                        </small>
                      </div>

                      {conversation.unreadCount > 0 ? (
                        <span
                          style={{
                            minWidth: "1.3rem",
                            height: "1.3rem",
                            borderRadius: "999px",
                            background: "#ef4444",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 0.35rem"
                          }}
                        >
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))
              ) : (
                <div style={{ padding: "1.25rem", color: "#667085" }}>
                  {conversationEntries.length
                    ? "No conversations match the current filter."
                    : "No messages yet."}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "2rem",
              color: "#667085"
            }}
          >
            <h3 style={{ marginBottom: "0.5rem", color: "#102a43" }}>Select a conversation</h3>
            <p style={{ margin: 0 }}>
              Choose a thread on the left to review replies, send a message, or follow up with a buyer or seller.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
