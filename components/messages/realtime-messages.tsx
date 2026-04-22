"use client";

import { useEffect, useRef, useState } from "react";
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div
      className="surface"
      style={{
        marginTop: "1.5rem",
        padding: "1rem",
        maxHeight: "560px",
        overflowY: "auto"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {messages.map((message) => {
          const isMine = message.sender_id === viewerId;

          return (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  background: isMine ? "#2563eb" : "#f3f4f6",
                  color: isMine ? "white" : "#111827",
                  borderRadius: "18px",
                  padding: "0.75rem 1rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
                }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.body}</p>
                <small
                  style={{
                    display: "block",
                    marginTop: "0.5rem",
                    opacity: 0.8
                  }}
                >
                  {isMine ? "You" : "Seller"} · {new Date(message.created_at).toLocaleString()}
                </small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}