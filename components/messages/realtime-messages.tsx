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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        minHeight: "420px",
        maxHeight: "60vh",
        overflowY: "auto",
        paddingRight: "0.25rem"
      }}
    >
      {messages.map((message) => {
        const mine = message.sender_id === viewerId;

        return (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: mine ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                display: "flex",
                flexDirection: "column",
                alignItems: mine ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: mine ? "#3157d5" : "white",
                  color: mine ? "white" : "#101828",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
                  whiteSpace: "pre-wrap"
                }}
              >
                {message.body}
              </div>

              <small style={{ marginTop: "0.35rem", color: "#667085" }}>
                {mine ? "You" : "Seller"} · {formatTime(message.created_at)}
              </small>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}