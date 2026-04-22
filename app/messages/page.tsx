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
      <div className="container">
        <h1 className="section-title">Messages</h1>

        <div className="stack-md">
          {conversations?.length ? (
            conversations.map((conversation: any) => {
              const unreadCount =
                conversation.buyer_id === viewer.user.id
                  ? conversation.buyer_unread_count
                  : conversation.seller_unread_count;

              return (
                <article key={conversation.id} className="surface">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem"
                    }}
                  >
                    <div>
                      <h3>{conversation.listing?.title ?? "Listing conversation"}</h3>
                      {unreadCount > 0 ? (
                        <span className="badge badge-featured">{unreadCount} unread</span>
                      ) : null}
                    </div>

                    <Link href={`/messages/${conversation.id}`} className="button button-secondary">
                      Open thread
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="surface">
              <p>No messages yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}