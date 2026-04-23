import Link from "next/link";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

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
      listing:listings(title, slug)
    `)
    .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`)
    .order("last_message_at", { ascending: false });

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        <div
          className="surface"
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            minHeight: "70vh",
            overflow: "hidden",
            padding: 0
          }}
        >
          <div style={{ borderRight: "1px solid #e5e7eb" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
              <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Messages</h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {conversations?.length ? (
                conversations.map((conversation: any) => {
                  const unreadCount =
                    conversation.buyer_id === viewer.user.id
                      ? conversation.buyer_unread_count
                      : conversation.seller_unread_count;

                  return (
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
                        <div>
                          <strong style={{ display: "block" }}>
                            {conversation.listing?.title ?? "Listing conversation"}
                          </strong>
                          <small style={{ color: "#667085" }}>
                            {conversation.last_message_at
                              ? new Date(conversation.last_message_at).toLocaleString()
                              : "No messages yet"}
                          </small>
                        </div>

                        {unreadCount > 0 ? (
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
                            {unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div style={{ padding: "1.25rem" }}>No messages yet.</div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#667085",
              padding: "2rem"
            }}
          >
            Select a conversation to start chatting.
          </div>
        </div>
      </div>
    </section>
  );
}