import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { LiveMessageProvider } from "@/components/messages/live-message-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaShell } from "@/components/pwa/pwa-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { getViewer } from "@/lib/auth";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { getBaseUrl } from "@/lib/env";
import { getUnreadActivitySummary } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  let unreadMessagesCount = 0;
  let unreadNotificationsCount = 0;
  let unreadNotificationsMarker: string | null = null;

  if (viewer) {
    const supabase = await createServerSupabaseClient();

    const [conversationsResult, activitySummary] = await Promise.all([
      supabase
        .from("conversations")
        .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
        .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`),
      getUnreadActivitySummary(viewer.user.id)
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

    unreadNotificationsCount = activitySummary.count;
    unreadNotificationsMarker = activitySummary.marker;
  }

  return (
    <html lang="en">
      <body>
        <AnalyticsProvider userId={viewer?.user.id ?? null} nonce={nonce} />
        <Analytics />
        <PwaShell />
        <LiveMessageProvider
          viewerId={viewer?.user.id ?? null}
          initialUnreadMessagesCount={unreadMessagesCount}
        >
          <MobileBottomNav
            viewer={Boolean(viewer)}
            viewerId={viewer?.user.id ?? null}
            unreadMessagesCount={unreadMessagesCount}
            unreadActivityCount={unreadNotificationsCount}
            unreadActivityMarker={unreadNotificationsMarker}
          />
          <div className="site-shell">
            <SiteHeader
              viewer={viewer}
              unreadMessagesCount={unreadMessagesCount}
              unreadNotificationsCount={unreadNotificationsCount}
              unreadNotificationsMarker={unreadNotificationsMarker}
            />

            <main>{children}</main>

            <SiteFooter viewer={Boolean(viewer)} />
          </div>
        </LiveMessageProvider>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_CA"
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  }
};

export const viewport: Viewport = {
  themeColor: "#1E5FE0"
};
