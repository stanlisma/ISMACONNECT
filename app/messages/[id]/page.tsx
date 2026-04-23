import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/ui/flash-message";
import { RealtimeMessages } from "@/components/messages/realtime-messages";
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
      listing:listings(title, slug)
    `)
    .eq("id", params.id)
    .single();

  if (!conversation) notFound();

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

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const action = sendThreadMessageAction.bind(null, params.id);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "960px" }}>
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />

        <div className="surface" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
                {(conversation as any).listing?.title ?? "Conversation"}
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "#667085" }}>
                Message about this listing
              </p>
            </div>
          </div>

          <div style={{ padding: "1rem", background: "#f8fafc" }}>
            <RealtimeMessages
              conversationId={params.id}
              initialMessages={messages ?? []}
              viewerId={viewer.user.id}
            />
          </div>

          <form
            action={action}
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "1rem",
              background: "white",
              position: "sticky",
              bottom: 0
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <textarea
                className="input"
                name="body"
                rows={3}
                required
                placeholder="Write a message..."
                style={{ flex: 1, resize: "vertical" }}
              />
              <button className="button" type="submit">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}