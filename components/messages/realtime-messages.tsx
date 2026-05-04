"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  image_url?: string | null;
  created_at: string;
  sender_id: string;
  seen_at?: string | null;
};

type Props = {
  conversationId: string;
  initialMessages: Message[];
  viewerId: string;
  buyerId: string;
  sellerId: string;
  initialBuyerTyping?: boolean;
  initialSellerTyping?: boolean;
  otherUserName: string;
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

export function RealtimeMessages({
  conversationId,
  initialMessages,
  viewerId,
  buyerId,
  sellerId,
  initialBuyerTyping = false,
  initialSellerTyping = false,
  otherUserName
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [buyerTyping, setBuyerTyping] = useState(initialBuyerTyping);
  const [sellerTyping, setSellerTyping] = useState(initialSellerTyping);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const otherTyping = viewerId === buyerId ? sellerTyping : buyerTyping;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  useEffect(() => {
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((current) => {
              const exists = current.some((message) => message.id === payload.new.id);
              if (exists) {
                return current;
              }

              return [...current, payload.new as Message];
            });
          }

          if (payload.eventType === "UPDATE") {
            setMessages((current) =>
              current.map((message) =>
                message.id === payload.new.id ? (payload.new as Message) : message
              )
            );
          }
        }
      )
      .subscribe();

    const conversationChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          setBuyerTyping(Boolean((payload.new as any).buyer_typing));
          setSellerTyping(Boolean((payload.new as any).seller_typing));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [conversationId]);

  const lastMine = [...messages].reverse().find((message) => message.sender_id === viewerId);

  return (
    <div
      className="surface"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        minHeight: "420px",
        maxHeight: "60vh",
        overflowY: "auto",
        padding: "1rem"
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
                  background: mine
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "white",
                  color: mine ? "white" : "#101828",
                  border: mine ? "none" : "1px solid rgba(201, 219, 251, 0.9)",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.08)"
                }}
              >
                {message.body ? <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div> : null}

                {message.image_url ? (
                  <img
                    src={message.image_url}
                    alt="Attachment"
                    style={{
                      marginTop: message.body ? "0.75rem" : 0,
                      maxWidth: "280px",
                      width: "100%",
                      borderRadius: "12px",
                      display: "block"
                    }}
                  />
                ) : null}
              </div>

              <small style={{ marginTop: "0.35rem", color: "#667085" }}>
                {mine ? "You" : otherUserName} · {formatTime(message.created_at)}
                {mine && message.id === lastMine?.id ? ` · ${message.seen_at ? "Seen" : "Delivered"}` : ""}
              </small>
            </div>
          </div>
        );
      })}

      {otherTyping ? (
        <div style={{ color: "#667085", fontSize: "0.9rem" }}>{otherUserName} is typing...</div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
