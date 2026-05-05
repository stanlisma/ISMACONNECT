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

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
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
  const hasMountedRef = useRef(false);

  const otherTyping = viewerId === buyerId ? sellerTyping : buyerTyping;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: hasMountedRef.current ? "smooth" : "auto" });
    hasMountedRef.current = true;
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
    <div className="surface messages-thread-shell">
      <div className="messages-thread-feed">
        {messages.map((message, index) => {
          const mine = message.sender_id === viewerId;
          const previousMessage = messages[index - 1];
          const showDayDivider =
            !previousMessage ||
            new Date(previousMessage.created_at).toDateString() !==
              new Date(message.created_at).toDateString();

          return (
            <div key={message.id}>
              {showDayDivider ? (
                <div className="messages-day-divider">
                  <span>{formatDayLabel(message.created_at)}</span>
                </div>
              ) : null}

              <div className={`messages-bubble-row ${mine ? "is-mine" : "is-theirs"}`}>
                <div className={`messages-bubble-stack ${mine ? "is-mine" : "is-theirs"}`}>
                  <div className={`messages-bubble ${mine ? "is-mine" : "is-theirs"}`}>
                    {message.body ? <div className="messages-bubble-text">{message.body}</div> : null}

                    {message.image_url ? (
                      <img
                        src={message.image_url}
                        alt="Attachment"
                        className="messages-bubble-image"
                      />
                    ) : null}
                  </div>

                  <small className="messages-bubble-meta">
                    {mine ? "You" : otherUserName} · {formatTime(message.created_at)}
                    {mine && message.id === lastMine?.id ? ` · ${message.seen_at ? "Seen" : "Delivered"}` : ""}
                  </small>
                </div>
              </div>
            </div>
          );
        })}

        {otherTyping ? (
          <div className="messages-typing-indicator">{otherUserName} is typing…</div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
