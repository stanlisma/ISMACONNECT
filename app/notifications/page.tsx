import { markNotificationReadAction } from "@/lib/actions/notifications";
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
            notifications.map((notification) => {
              const action = markNotificationReadAction.bind(
                null,
                notification.id,
                notification.link ?? "/notifications"
              );

              return (
                <article
                  key={notification.id}
                  className="surface"
                  style={{
                    border: notification.is_read ? undefined : "1px solid #93c5fd",
                    background: notification.is_read ? undefined : "#eff6ff"
                  }}
                >
                  <h3>{notification.title}</h3>
                  {notification.body ? <p>{notification.body}</p> : null}

                  <div style={{ marginTop: "0.75rem" }}>
                    <form action={action}>
                      <button className="button button-secondary" type="submit">
                        {notification.link ? "Open" : "Mark as read"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
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