import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaShell } from "@/components/pwa/pwa-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { getViewer } from "@/lib/auth";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { getSavedSearchAlertState } from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  let unreadMessagesCount = 0;
  let unreadNotificationsCount = 0;
  let unreadNotificationsMarker: string | null = null;

  if (viewer) {
    const supabase = await createServerSupabaseClient();

    const [conversationsResult, notificationsResult, latestUnreadNotificationResult, unreadSavedSearchAlertsState] = await Promise.all([
      supabase
        .from("conversations")
        .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
        .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", viewer.user.id)
        .eq("is_read", false),
      supabase
        .from("notifications")
        .select("created_at")
        .eq("user_id", viewer.user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      getSavedSearchAlertState(viewer.user.id)
    ]);

    unreadMessagesCount =
      conversationsResult.data?.reduce((total: number, convo: any) => {
        if (convo.buyer_id === viewer.user.id) {
          return total + (convo.buyer_unread_count ?? 0);
        }

        if (convo.seller_id === viewer.user.id) {
          return total + (convo.seller_unread_count ?? 0);
        }

        return total;
      }, 0) ?? 0;

    unreadNotificationsCount = (notificationsResult.count ?? 0) + unreadSavedSearchAlertsState.count;

    const latestUnreadNotificationAt = latestUnreadNotificationResult.data?.created_at ?? null;
    const latestUnreadSavedSearchAt = unreadSavedSearchAlertsState.latestCreatedAt ?? null;

    unreadNotificationsMarker =
      [latestUnreadNotificationAt, latestUnreadSavedSearchAt]
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
  }

  return (
    <html lang="en">
      <body>
        <PwaShell />
        <MobileBottomNav />
        <div className="site-shell">
          <SiteHeader
            viewer={viewer}
            unreadMessagesCount={unreadMessagesCount}
            unreadNotificationsCount={unreadNotificationsCount}
            unreadNotificationsMarker={unreadNotificationsMarker}
          />

          <main>{children}</main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  }
};

export const viewport: Viewport = {
  themeColor: "#1E5FE0"
};
