import { notFound } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendThreadMessageAction } from "@/lib/actions/thread-messages";
import { FlashMessage } from "@/components/ui/flash-message";
import { getSingleParam } from "@/lib/utils";
import { RealtimeMessages } from "@/components/messages/realtime-messages";

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
      <div className="container">
        <FlashMessage message={getSingleParam(searchParams?.success)} tone="success" />
        <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />

        <h1 className="section-title">{(conversation as any).listing?.title ?? "Conversation"}</h1>

        <RealtimeMessages
          conversationId={params.id}
          initialMessages={messages ?? []}
          viewerId={viewer.user.id}
        />

        <form action={action} className="form-grid" style={{ marginTop: "1.5rem" }}>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span className="field-label">Reply</span>
            <textarea className="input" name="body" rows={4} required />
          </label>

          <div>
            <button className="button" type="submit">
              Send reply
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}