"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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

function isSameMessageGroup(
  previousMessage: Message | undefined,
  currentMessage: Message | undefined
) {
  if (!previousMessage || !currentMessage) {
    return false;
  }

  const sameSender = previousMessage.sender_id === currentMessage.sender_id;
  const sameDay =
    new Date(previousMessage.created_at).toDateString() ===
    new Date(currentMessage.created_at).toDateString();
  const diffMs =
    new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime();

  return sameSender && sameDay && diffMs < 5 * 60 * 1000;
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const lastMessageIdRef = useRef(initialMessages[initialMessages.length - 1]?.id ?? null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const otherTyping = viewerId === buyerId ? sellerTyping : buyerTyping;

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    const latestMessageChanged = latestMessage?.id !== lastMessageIdRef.current;
    const latestIsMine = latestMessage?.sender_id === viewerId;

    if (!hasMountedRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      hasMountedRef.current = true;
      lastMessageIdRef.current = latestMessage?.id ?? null;
      return;
    }

    if (shouldStickToBottomRef.current || latestIsMine) {
      bottomRef.current?.scrollIntoView({
        behavior: latestMessageChanged && !latestIsMine ? "smooth" : "auto"
      });
    }

    lastMessageIdRef.current = latestMessage?.id ?? null;
  }, [messages, otherTyping, viewerId]);

  useEffect(() => {
    const feed = feedRef.current;

    if (!feed) {
      return;
    }

    const updateStickState = () => {
      const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 120;
    };

    updateStickState();
    feed.addEventListener("scroll", updateStickState);

    return () => {
      feed.removeEventListener("scroll", updateStickState);
    };
  }, []);

  useEffect(() => {
    const unseenIncomingMessageIds = initialMessages
      .filter((message) => message.sender_id !== viewerId && !message.seen_at)
      .map((message) => message.id);
    const unreadField = viewerId === buyerId ? "buyer_unread_count" : "seller_unread_count";

    async function syncOpenedConversation() {
      const seenAt = new Date().toISOString();

      if (unseenIncomingMessageIds.length) {
        await supabase.from("messages").update({ seen_at: seenAt }).in("id", unseenIncomingMessageIds);

        setMessages((current) =>
          current.map((message) =>
            unseenIncomingMessageIds.includes(message.id)
              ? { ...message, seen_at: seenAt }
              : message
          )
        );
      }

      await supabase
        .from("conversations")
        .update({ [unreadField]: 0 })
        .eq("id", conversationId);
    }

    void syncOpenedConversation();
  }, [buyerId, conversationId, initialMessages, supabase, viewerId]);

  useEffect(() => {
    const unreadField = viewerId === buyerId ? "buyer_unread_count" : "seller_unread_count";

    async function markIncomingMessageSeen(messageId: string) {
      const seenAt = new Date().toISOString();

      await supabase.from("messages").update({ seen_at: seenAt }).eq("id", messageId);
      await supabase.from("conversations").update({ [unreadField]: 0 }).eq("id", conversationId);

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, seen_at: seenAt } : message
        )
      );
    }

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
            const nextMessage = payload.new as Message;

            setMessages((current) => {
              const exists = current.some((message) => message.id === nextMessage.id);
              if (exists) {
                return current;
              }

              return [...current, nextMessage];
            });

            if (nextMessage.sender_id !== viewerId && !nextMessage.seen_at) {
              void markIncomingMessageSeen(nextMessage.id);
            }
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
  }, [buyerId, conversationId, sellerId, supabase, viewerId]);

  const lastMine = [...messages].reverse().find((message) => message.sender_id === viewerId);

  return (
    <div className="surface messages-thread-shell">
      <div ref={feedRef} className="messages-thread-feed">
        {messages.length === 0 ? (
          <div className="messages-empty-state">
            <strong>No messages yet</strong>
            <p>Start the conversation with a clear question so the other person can reply faster.</p>
          </div>
        ) : null}

        {messages.map((message, index) => {
          const mine = message.sender_id === viewerId;
          const previousMessage = messages[index - 1];
          const nextMessage = messages[index + 1];
          const showDayDivider =
            !previousMessage ||
            new Date(previousMessage.created_at).toDateString() !==
              new Date(message.created_at).toDateString();
          const continuesPreviousGroup = isSameMessageGroup(previousMessage, message);
          const continuesNextGroup = isSameMessageGroup(message, nextMessage);
          const showMeta = !continuesNextGroup;

          return (
            <div key={message.id}>
              {showDayDivider ? (
                <div className="messages-day-divider">
                  <span>{formatDayLabel(message.created_at)}</span>
                </div>
              ) : null}

              <div className={`messages-bubble-row ${mine ? "is-mine" : "is-theirs"}`}>
                <div
                  className={`messages-bubble-stack ${mine ? "is-mine" : "is-theirs"}${
                    continuesPreviousGroup ? " is-clustered" : ""
                  }`}
                >
                  <div className={`messages-bubble ${mine ? "is-mine" : "is-theirs"}`}>
                    {message.body ? <div className="messages-bubble-text">{message.body}</div> : null}

                    {message.image_url ? (
                      <button
                        type="button"
                        className="messages-bubble-image-button"
                        onClick={() => setLightboxImage(message.image_url ?? null)}
                        aria-label="Open attachment"
                      >
                        <img
                          src={message.image_url}
                          alt="Attachment"
                          className="messages-bubble-image"
                        />
                      </button>
                    ) : null}
                  </div>

                  {showMeta ? (
                    <small className="messages-bubble-meta">
                      {mine ? "You" : otherUserName} · {formatTime(message.created_at)}
                      {mine && message.id === lastMine?.id ? ` · ${message.seen_at ? "Seen" : "Delivered"}` : ""}
                    </small>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {otherTyping ? (
          <div className="messages-bubble-row is-theirs is-typing-row">
            <div className="messages-bubble-stack is-theirs">
              <div className="messages-typing-bubble" aria-label={`${otherUserName} is typing`}>
                <span />
                <span />
                <span />
              </div>
              <small className="messages-typing-indicator">{otherUserName} is typing...</small>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {lightboxImage ? (
        <ImageLightbox
          images={[lightboxImage]}
          initialIndex={0}
          title="Message attachment"
          onClose={() => setLightboxImage(null)}
        />
      ) : null}
    </div>
  );
}
