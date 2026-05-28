"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { usePathname } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LiveMessageContextValue = {
  unreadMessagesCount: number;
};

type LiveMessagePreview = {
  conversationId: string;
  listingTitle: string | null;
  listingImageUrl: string | null;
  otherUserName: string;
  preview: string;
};

type RawConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_unread_count: number | null;
  seller_unread_count: number | null;
  last_message_at: string | null;
  listing:
    | {
        title?: string | null;
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

type RawMessageRow = {
  body: string | null;
  image_url: string | null;
  sender_id: string | null;
};

const LIVE_MESSAGE_CONTEXT = createContext<LiveMessageContextValue>({
  unreadMessagesCount: 0
});

const TOAST_AUTO_HIDE_MS = 5200;

function sumUnreadMessages(viewerId: string, conversations: RawConversationRow[]) {
  return conversations.reduce((total, conversation) => {
    if (conversation.buyer_id === viewerId) {
      return total + (conversation.buyer_unread_count ?? 0);
    }

    if (conversation.seller_id === viewerId) {
      return total + (conversation.seller_unread_count ?? 0);
    }

    return total;
  }, 0);
}

async function loadUnreadConversations(supabase: ReturnType<typeof createBrowserSupabaseClient>, viewerId: string) {
  const { data } = await supabase
    .from("conversations")
    .select(`
      id,
      buyer_id,
      seller_id,
      buyer_unread_count,
      seller_unread_count,
      last_message_at,
      listing:listings(title, image_url),
      seller:profiles!conversations_seller_id_fkey(full_name),
      buyer:profiles!conversations_buyer_id_fkey(full_name)
    `)
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
    .order("last_message_at", { ascending: false });

  return (data ?? []) as RawConversationRow[];
}

async function loadLatestUnreadPreview(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  viewerId: string
) {
  const conversations = await loadUnreadConversations(supabase, viewerId);
  const latestUnreadConversation = conversations.find((conversation) => {
    const unreadCount =
      conversation.buyer_id === viewerId
        ? conversation.buyer_unread_count ?? 0
        : conversation.seller_unread_count ?? 0;

    return unreadCount > 0;
  });

  if (!latestUnreadConversation) {
    return null;
  }

  const { data: latestMessages } = await supabase
    .from("messages")
    .select("body, image_url, sender_id")
    .eq("conversation_id", latestUnreadConversation.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestMessage = (latestMessages?.[0] ?? null) as RawMessageRow | null;
  const otherUserName =
    latestUnreadConversation.buyer_id === viewerId
      ? latestUnreadConversation.seller?.full_name?.trim() || "Seller"
      : latestUnreadConversation.buyer?.full_name?.trim() || "Buyer";

  return {
    conversationId: latestUnreadConversation.id,
    listingTitle: latestUnreadConversation.listing?.title ?? null,
    listingImageUrl: latestUnreadConversation.listing?.image_url ?? null,
    otherUserName,
    preview: latestMessage?.body?.trim()
      ? latestMessage.body.trim()
      : latestMessage?.image_url
        ? "Sent a photo"
        : "New message received"
  } satisfies LiveMessagePreview;
}

export function useLiveMessageState() {
  return useContext(LIVE_MESSAGE_CONTEXT);
}

export function LiveMessageProvider({
  viewerId,
  initialUnreadMessagesCount,
  children
}: {
  viewerId: string | null;
  initialUnreadMessagesCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialUnreadMessagesCount);
  const [toast, setToast] = useState<LiveMessagePreview | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUnreadCountRef = useRef(initialUnreadMessagesCount);

  const refreshUnreadMessages = useCallback(async () => {
    if (!viewerId) {
      setUnreadMessagesCount(0);
      return;
    }

    const conversations = await loadUnreadConversations(supabase, viewerId);
    setUnreadMessagesCount(sumUnreadMessages(viewerId, conversations));
  }, [supabase, viewerId]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      void refreshUnreadMessages();
    }, 180);
  }, [refreshUnreadMessages]);

  useEffect(() => {
    setUnreadMessagesCount(initialUnreadMessagesCount);
    previousUnreadCountRef.current = initialUnreadMessagesCount;
  }, [initialUnreadMessagesCount]);

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const buyerChannel = supabase
      .channel(`live-message-count-buyer:${viewerId}`)
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
      .channel(`live-message-count-seller:${viewerId}`)
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

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      supabase.removeChannel(buyerChannel);
      supabase.removeChannel(sellerChannel);
    };
  }, [scheduleRefresh, supabase, viewerId]);

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    if (unreadMessagesCount <= previousUnreadCountRef.current) {
      previousUnreadCountRef.current = unreadMessagesCount;
      return;
    }

    previousUnreadCountRef.current = unreadMessagesCount;

    if (pathname.startsWith("/messages")) {
      return;
    }

    void loadLatestUnreadPreview(supabase, viewerId).then((preview) => {
      if (!preview) {
        return;
      }

      setToast(preview);
    });
  }, [pathname, supabase, unreadMessagesCount, viewerId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_AUTO_HIDE_MS);

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [toast]);

  return (
    <LIVE_MESSAGE_CONTEXT.Provider value={{ unreadMessagesCount }}>
      {children}
      {toast ? (
        <Link
          href={`/messages/${toast.conversationId}`}
          className="live-message-toast"
          onClick={() => setToast(null)}
        >
          <div className="live-message-toast-media">
            {toast.listingImageUrl ? (
              <img src={toast.listingImageUrl} alt={toast.listingTitle ?? "Listing"} />
            ) : (
              <div className="live-message-toast-fallback">
                <MessageCircle aria-hidden="true" size={18} strokeWidth={2.2} />
              </div>
            )}
          </div>
          <div className="live-message-toast-copy">
            <strong>{toast.otherUserName}</strong>
            <span>{toast.listingTitle ?? "New message"}</span>
            <p>{toast.preview}</p>
          </div>
        </Link>
      ) : null}
    </LIVE_MESSAGE_CONTEXT.Provider>
  );
}
