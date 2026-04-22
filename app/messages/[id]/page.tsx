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
    .select("id, buyer_id, seller_id, listing:listings(title)")
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

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const action = sendThreadMessageAction.bind(null, params.id);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />

        <div className="surface" style={{ marginBottom: "1rem" }}>
          <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>
            {(conversation as any).listing?.title ?? "Conversation"}
          </h1>
          <p className="section-copy">Chat directly about this listing.</p>
        </div>

        <RealtimeMessages
          conversationId={params.id}
          initialMessages={messages ?? []}
          viewerId={viewer.user.id}
        />

        <form action={action} className="surface" style={{ marginTop: "1rem", padding: "1rem" }}>
          <label className="field" style={{ display: "block" }}>
            <span className="field-label">Reply</span>
            <textarea
              className="input"
              name="body"
              rows={4}
              required
              placeholder="Type your message..."
            />
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