"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Message = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
};

type Props = {
  conversationId: string;
  initialMessages: Message[];
  viewerId: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RealtimeMessages({ conversationId, initialMessages, viewerId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((current) => {
            const exists = current.some((m) => m.id === payload.new.id);
            if (exists) return current;
            return [...current, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="stack-md" style={{ marginTop: "1.5rem" }}>
      {messages.map((message) => (
        <div
          key={message.id}
          className="surface"
          style={{
            background: message.sender_id === viewerId ? "#eff6ff" : undefined
          }}
        >
          <p>{message.body}</p>
          <small>
            {message.sender_id === viewerId ? "You" : "Other user"} ·{" "}
            {new Date(message.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}