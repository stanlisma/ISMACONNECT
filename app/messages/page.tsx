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
      listing:listings(title, slug),
      buyer:profiles!conversations_buyer_id_fkey(full_name),
      seller:profiles!conversations_seller_id_fkey(full_name)
    `)
    .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`)
    .order("created_at", { ascending: false });

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Messages</h1>

        <div className="stack-md">
          {conversations?.length ? (
            conversations.map((conversation: any) => (
              <article key={conversation.id} className="surface">
                <h3>{conversation.listing?.title ?? "Listing conversation"}</h3>
                <p className="section-copy">
                  Buyer: {conversation.buyer?.full_name ?? "Unknown"} · Seller: {conversation.seller?.full_name ?? "Unknown"}
                </p>
                <Link href={`/messages/${conversation.id}`} className="button button-secondary">
                  Open thread
                </Link>
              </article>
            ))
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