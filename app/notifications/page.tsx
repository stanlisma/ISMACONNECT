import {
  OpenSavedSearchForm
} from "@/components/saved-searches/saved-search-forms";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { requireViewer } from "@/lib/auth";
import { getSavedSearchesWithStats } from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  let savedSearches = await getSavedSearchesWithStats(viewer.user.id);
  let savedSearchAlerts = savedSearches.filter((savedSearch) => savedSearch.newMatchesCount > 0);

  let { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false });

  const hasUnreadNotifications = notifications?.some((notification) => !notification.is_read) ?? false;
  const hasSavedSearchAlerts = savedSearchAlerts.length > 0;

  if (hasUnreadNotifications || hasSavedSearchAlerts) {
    const viewedAt = new Date().toISOString();

    await Promise.all([
      hasUnreadNotifications
        ? supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", viewer.user.id)
            .eq("is_read", false)
        : Promise.resolve(),
      hasSavedSearchAlerts
        ? supabase
            .from("saved_searches")
            .update({ last_checked_at: viewedAt })
            .eq("user_id", viewer.user.id)
        : Promise.resolve()
    ]);

    savedSearches = await getSavedSearchesWithStats(viewer.user.id);
    savedSearchAlerts = savedSearches.filter((savedSearch) => savedSearch.newMatchesCount > 0);

    const refreshedNotifications = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", viewer.user.id)
      .order("created_at", { ascending: false });

    notifications = refreshedNotifications.data;
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Notifications</h1>

        <div className="stack-md">
          {savedSearchAlerts.length ? (
            <div className="surface">
              <h2 style={{ marginBottom: "0.5rem" }}>Saved search alerts</h2>
              <p className="section-copy" style={{ marginBottom: "1rem" }}>
                New listings have matched the searches you asked ISMACONNECT to keep an eye on.
              </p>

              <div className="stack-md">
                {savedSearchAlerts.map((savedSearch) => (
                  <article key={savedSearch.id} className="saved-search-alert-item">
                    <div>
                      <h3>{savedSearch.label}</h3>
                      <p className="saved-search-description">{savedSearch.description}</p>
                    </div>

                    <div className="saved-search-alert-actions">
                      <span className="saved-search-alert-badge">{savedSearch.newMatchesCount} new</span>
                      <OpenSavedSearchForm
                        href={savedSearch.href}
                        savedSearchId={savedSearch.id}
                        hasAlerts
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

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
              <p>{savedSearchAlerts.length ? "No message or account notifications yet." : "No notifications yet."}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
