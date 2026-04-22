import { notFound } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendThreadMessageAction } from "@/lib/actions/thread-messages";

export default async function MessageThreadPage({
  params
}: {
  params: { id: string };
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

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const action = sendThreadMessageAction.bind(null, params.id);

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{(conversation as any).listing?.title ?? "Conversation"}</h1>

        <div className="stack-md" style={{ marginBottom: "1.5rem" }}>
          {messages?.map((message) => (
            <div key={message.id} className="surface">
              <p>{message.body}</p>
              <small>
                {message.sender_id === viewer.user.id ? "You" : "Other user"} ·{" "}
                {new Date(message.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>

        <form action={action} className="form-grid">
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