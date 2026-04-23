import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getViewer } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${SITE_NAME} | Fort McMurray Marketplace`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_CA",
    type: "website"
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  let unreadMessagesCount = 0;
  let unreadNotificationsCount = 0;

  if (viewer) {
    const supabase = await createServerSupabaseClient();

    const { data: conversations } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
      .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`);

    unreadMessagesCount =
      conversations?.reduce((total: number, convo: any) => {
        if (convo.buyer_id === viewer.user.id) {
          return total + (convo.buyer_unread_count ?? 0);
        }

        if (convo.seller_id === viewer.user.id) {
          return total + (convo.seller_unread_count ?? 0);
        }

        return total;
      }, 0) ?? 0;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", viewer.user.id)
      .eq("is_read", false);

    unreadNotificationsCount = count ?? 0;
  }

  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <SiteHeader
            viewer={viewer}
            unreadMessagesCount={unreadMessagesCount}
            unreadNotificationsCount={unreadNotificationsCount}
          />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}