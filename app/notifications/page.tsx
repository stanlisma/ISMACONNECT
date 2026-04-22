import Link from "next/link";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Notifications</h1>

        <div className="stack-md">
          {notifications?.length ? (
            notifications.map((notification) => (
              <article key={notification.id} className="surface">
                <h3>{notification.title}</h3>
                {notification.body ? <p>{notification.body}</p> : null}
                {notification.link ? (
                  <Link href={notification.link} className="button button-secondary">
                    Open
                  </Link>
                ) : null}
              </article>
            ))
          ) : (
            <div className="surface">
              <p>No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}