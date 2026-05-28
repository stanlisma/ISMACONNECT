"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type MessagesFilter = "all" | "unread";

export type InboxConversationEntry = {
  id: string;
  created_at: string;
  last_message_at: string | null;
  buyer_id: string;
  seller_id: string;
  buyer_unread_count: number;
  seller_unread_count: number;
  buyer_typing: boolean;
  seller_typing: boolean;
  listingTitle: string | null;
  listingSlug: string | null;
  listingImageUrl: string | null;
  otherUserName: string;
  preview: string;
  previewSenderId: string | null;
};

type RawConversationRecord = {
  id: string;
  created_at: string;
  last_message_at: string | null;
  buyer_id: string;
  seller_id: string;
  buyer_unread_count: number | null;
  seller_unread_count: number | null;
  buyer_typing: boolean | null;
  seller_typing: boolean | null;
  listing:
    | {
        title?: string | null;
        slug?: string | null;
        image_url?: string | null;
      }
    | null;
  seller:
    | {
        full_name?: string | null;
      }
    | null;
  buyer:
    | {
        full_name?: string | null;
      }
    | null;
};

type RawLatestMessageRecord = {
  conversation_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  sender_id: string;
};

type Props = {
  viewerId: string;
  activeFilter: MessagesFilter;
  rawQuery: string;
  initialConversations: InboxConversationEntry[];
};

const LIVE_REFRESH_DEBOUNCE_MS = 180;
const LIVE_REFRESH_INTERVAL_MS = 30000;

function formatInboxTimestamp(value: string | null, fallback: string) {
  const date = new Date(value ?? fallback);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-CA", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function mapConversationEntries(
  viewerId: string,
  conversations: RawConversationRecord[],
  latestMessages: RawLatestMessageRecord[]
) {
  const latestMessageMap = new Map<string, RawLatestMessageRecord>();

  latestMessages.forEach((message) => {
    if (!latestMessageMap.has(message.conversation_id)) {
      latestMessageMap.set(message.conversation_id, message);
    }
  });

  return conversations.map((conversation) => {
    const unreadCount =
      conversation.buyer_id === viewerId
        ? conversation.buyer_unread_count ?? 0
        : conversation.seller_unread_count ?? 0;

    const otherUserName =
      conversation.buyer_id === viewerId
        ? conversation.seller?.full_name?.trim() || "Seller"
        : conversation.buyer?.full_name?.trim() || "Buyer";

    const latestMessage = latestMessageMap.get(conversation.id) ?? null;
    const otherTyping =
      conversation.buyer_id === viewerId
        ? Boolean(conversation.seller_typing)
        : Boolean(conversation.buyer_typing);

    const preview = otherTyping
      ? `${otherUserName.split(" ")[0] || "Someone"} is typing…`
      : latestMessage?.body?.trim()
        ? latestMessage.sender_id === viewerId
          ? `You: ${latestMessage.body.trim()}`
          : latestMessage.body.trim()
        : latestMessage?.image_url
          ? latestMessage.sender_id === viewerId
            ? "You sent a photo"
            : "Sent a photo"
          : "No messages yet";

    return {
      id: conversation.id,
      created_at: conversation.created_at,
      last_message_at: conversation.last_message_at,
      buyer_id: conversation.buyer_id,
      seller_id: conversation.seller_id,
      buyer_unread_count: conversation.buyer_unread_count ?? 0,
      seller_unread_count: conversation.seller_unread_count ?? 0,
      buyer_typing: Boolean(conversation.buyer_typing),
      seller_typing: Boolean(conversation.seller_typing),
      listingTitle: conversation.listing?.title ?? null,
      listingSlug: conversation.listing?.slug ?? null,
      listingImageUrl: conversation.listing?.image_url ?? null,
      otherUserName,
      preview,
      previewSenderId: latestMessage?.sender_id ?? null
    } satisfies InboxConversationEntry;
  });
}

export function MessagesInboxLive({
  viewerId,
  activeFilter,
  rawQuery,
  initialConversations
}: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [conversations, setConversations] = useState(initialConversations);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshInbox = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const { data: conversationRows } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          last_message_at,
          buyer_id,
          seller_id,
          buyer_unread_count,
          seller_unread_count,
          buyer_typing,
          seller_typing,
          listing:listings(title, slug, image_url),
          seller:profiles!conversations_seller_id_fkey(full_name),
          buyer:profiles!conversations_buyer_id_fkey(full_name)
        `)
        .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
        .order("last_message_at", { ascending: false });

      const conversationList = (conversationRows ?? []) as RawConversationRecord[];
      const conversationIds = conversationList.map((conversation) => conversation.id);

      let latestMessages: RawLatestMessageRecord[] = [];

      if (conversationIds.length) {
        const { data: messageRows } = await supabase
          .from("messages")
          .select("conversation_id, body, image_url, created_at, sender_id")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        latestMessages = (messageRows ?? []) as RawLatestMessageRecord[];
      }

      setConversations(mapConversationEntries(viewerId, conversationList, latestMessages));
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase, viewerId]);

  const scheduleRefresh = useCallback(
    (delay = LIVE_REFRESH_DEBOUNCE_MS) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        void refreshInbox();
      }, delay);
    },
    [refreshInbox]
  );

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const buyerChannel = supabase
      .channel(`messages-inbox-buyer:${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${viewerId}`
        },
        () => scheduleRefresh()
      )
      .subscribe();

    const sellerChannel = supabase
      .channel(`messages-inbox-seller:${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${viewerId}`
        },
        () => scheduleRefresh()
      )
      .subscribe();

    pollTimerRef.current = setInterval(() => {
      void refreshInbox();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }

      supabase.removeChannel(buyerChannel);
      supabase.removeChannel(sellerChannel);
    };
  }, [refreshInbox, scheduleRefresh, supabase, viewerId]);

  const normalizedQuery = rawQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => {
    const unreadCount =
      conversation.buyer_id === viewerId
        ? conversation.buyer_unread_count
        : conversation.seller_unread_count;

    if (activeFilter === "unread" && unreadCount < 1) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      conversation.listingTitle ?? "",
      conversation.otherUserName,
      conversation.preview
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const unreadThreadCount = conversations.filter((conversation) => {
    const unreadCount =
      conversation.buyer_id === viewerId
        ? conversation.buyer_unread_count
        : conversation.seller_unread_count;

    return unreadCount > 0;
  }).length;

  function openConversation(href: string) {
    if (typeof window !== "undefined") {
      window.location.assign(href);
    }
  }

  return (
    <div className="surface messages-shell messages-shell-single">
      <div className="messages-list-pane">
        <div className="messages-list-status">
          <span className={`messages-live-indicator${isRefreshing ? " is-refreshing" : ""}`}>
            <span className="messages-live-dot" />
            <span>{isRefreshing ? "Refreshing…" : "Live inbox"}</span>
          </span>
          <span className="messages-list-status-meta">
            {unreadThreadCount > 0 ? `${unreadThreadCount} unread` : "All caught up"}
          </span>
        </div>

        <div className="messages-list">
          {filteredConversations.length ? (
            filteredConversations.map((conversation) => {
              const unreadCount =
                conversation.buyer_id === viewerId
                  ? conversation.buyer_unread_count
                  : conversation.seller_unread_count;
              const otherTyping =
                conversation.buyer_id === viewerId
                  ? conversation.seller_typing
                  : conversation.buyer_typing;

              return (
                <a
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className={`messages-list-item${unreadCount > 0 ? " is-unread" : ""}${otherTyping ? " is-typing" : ""}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openConversation(`/messages/${conversation.id}`);
                  }}
                >
                  <div className="messages-list-leading">
                    <div
                      className={`messages-list-avatar${conversation.listingImageUrl ? "" : " is-placeholder"}`}
                    >
                      {conversation.listingImageUrl ? (
                        <img
                          src={conversation.listingImageUrl}
                          alt={conversation.listingTitle ?? "Listing image"}
                        />
                      ) : (
                        conversation.otherUserName.trim().charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    {unreadCount > 0 ? <span className="messages-list-unread-dot" /> : null}
                  </div>

                  <div className="messages-list-content">
                    <div className="messages-list-topline">
                      <strong>{conversation.listingTitle ?? "Listing conversation"}</strong>
                      <span className="messages-list-time">
                        {formatInboxTimestamp(conversation.last_message_at, conversation.created_at)}
                      </span>
                    </div>

                    <div className="messages-list-subline">
                      <span className="messages-list-name">{conversation.otherUserName}</span>
                      {otherTyping ? (
                        <span className="messages-list-live">Typing…</span>
                      ) : unreadCount > 0 ? (
                        <span className="messages-unread-badge">{unreadCount}</span>
                      ) : null}
                    </div>

                    <p className={`messages-list-preview${unreadCount > 0 ? " is-unread" : ""}${otherTyping ? " is-typing" : ""}`}>
                      {conversation.preview}
                    </p>
                  </div>
                </a>
              );
            })
          ) : (
            <div className="messages-empty-list">
              {conversations.length ? (
                <>
                  <h3>No conversations match this view</h3>
                  <p>Try a broader search or switch back to all conversations.</p>
                  <div className="messages-empty-actions">
                    <Link href="/messages" className="button button-secondary">
                      Show all conversations
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3>No messages yet</h3>
                  <p>Your buyer and seller conversations will appear here as soon as someone reaches out. Browse local listings or post what you need to start the first reply.</p>
                  <div className="messages-empty-actions">
                    <Link href="/browse" className="button button-secondary">
                      Browse listings
                    </Link>
                    <Link href="/dashboard/listings/new?intent=need" className="button">
                      Post a need
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
