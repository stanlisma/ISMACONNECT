import Link from "next/link";
import {
  Bell,
  ChevronRight,
  MessageCircle,
  Rocket,
  Search,
  ShieldCheck,
  Star
} from "lucide-react";

import {
  OpenSavedSearchForm
} from "@/components/saved-searches/saved-search-forms";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { requireViewer } from "@/lib/auth";
import { getSavedSearchesWithStats } from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
};

function formatNotificationTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getNotificationPresentation(type: string | null | undefined) {
  switch (type) {
    case "message":
      return {
        label: "Messages",
        className: "notification-card-message",
        icon: <MessageCircle aria-hidden="true" size={18} strokeWidth={2.2} />
      };
    case "boost":
      return {
        label: "Promotions",
        className: "notification-card-boost",
        icon: <Rocket aria-hidden="true" size={18} strokeWidth={2.2} />
      };
    case "verification":
      return {
        label: "Verification",
        className: "notification-card-verification",
        icon: <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
      };
    case "review":
      return {
        label: "Ratings",
        className: "notification-card-review",
        icon: <Star aria-hidden="true" size={18} strokeWidth={2.2} />
      };
    default:
      return {
        label: "Updates",
        className: "notification-card-general",
        icon: <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
      };
  }
}

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

  const notificationItems = (notifications ?? []) as NotificationRecord[];
  const totalItems = notificationItems.length + savedSearchAlerts.length;
  const messageCount = notificationItems.filter((notification) => notification.type === "message").length;
  const accountUpdateCount = notificationItems.filter(
    (notification) => notification.type && notification.type !== "message"
  ).length;

  return (
    <section className="section notifications-page">
      <div className="container notifications-page-container">
        <div className="notifications-hero surface">
          <div className="notifications-hero-copy">
            <span className="eyebrow">Notification center</span>
            <h1 className="section-title">Notifications</h1>
            <p className="section-copy">
              Track replies, saved-search matches, boost updates, and seller account activity in one place.
            </p>
          </div>

          <div className="notifications-summary-grid">
            <div className="notifications-summary-card">
              <span>Total updates</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="notifications-summary-card">
              <span>Saved search matches</span>
              <strong>{savedSearchAlerts.length}</strong>
            </div>
            <div className="notifications-summary-card">
              <span>Message replies</span>
              <strong>{messageCount}</strong>
            </div>
            <div className="notifications-summary-card">
              <span>Account activity</span>
              <strong>{accountUpdateCount}</strong>
            </div>
          </div>
        </div>

        <div className="notifications-stack">
          {savedSearchAlerts.length ? (
            <section className="surface notifications-section notifications-section-priority">
              <div className="notifications-section-head">
                <div>
                  <span className="notifications-section-label">Priority</span>
                  <h2>Saved search alerts</h2>
                  <p className="section-copy">
                    New listings have matched the searches you asked ISMACONNECT to keep an eye on.
                  </p>
                </div>

                <div className="notifications-section-count">
                  <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                  <strong>{savedSearchAlerts.length}</strong>
                </div>
              </div>

              <div className="notifications-list">
                {savedSearchAlerts.map((savedSearch) => (
                  <article key={savedSearch.id} className="notification-card notification-card-search">
                    <div className="notification-card-icon notification-card-icon-search">
                      <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                    </div>

                    <div className="notification-card-body">
                      <div className="notification-card-head">
                        <div>
                          <span className="notification-type-pill">Saved search</span>
                          <h3>{savedSearch.label}</h3>
                        </div>
                        <span className="saved-search-alert-badge">{savedSearch.newMatchesCount} new</span>
                      </div>

                      <p className="saved-search-description notification-card-description">
                        {savedSearch.description}
                      </p>
                    </div>

                    <div className="notification-card-actions notification-card-actions-stacked">
                      <OpenSavedSearchForm
                        href={savedSearch.href}
                        savedSearchId={savedSearch.id}
                        hasAlerts
                      />
                      <span className="notification-card-meta-line">Opens your latest matching results</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {notificationItems.length ? (
            <section className="surface notifications-section">
              <div className="notifications-section-head">
                <div>
                  <span className="notifications-section-label">Activity feed</span>
                  <h2>Recent updates</h2>
                  <p className="section-copy">
                    Replies, verification changes, promotions, and trust updates appear here.
                  </p>
                </div>

                <div className="notifications-section-count">
                  <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
                  <strong>{notificationItems.length}</strong>
                </div>
              </div>

              <div className="notifications-list">
                {notificationItems.map((notification) => {
                  const action = markNotificationReadAction.bind(
                    null,
                    notification.id,
                    notification.link ?? "/notifications"
                  );
                  const presentation = getNotificationPresentation(notification.type);

                  return (
                    <article
                      key={notification.id}
                      className={`notification-card ${presentation.className}`}
                    >
                      <div className={`notification-card-icon ${presentation.className}`}>
                        {presentation.icon}
                      </div>

                      <div className="notification-card-body">
                        <div className="notification-card-head">
                          <div>
                            <span className="notification-type-pill">{presentation.label}</span>
                            <h3>{notification.title}</h3>
                          </div>

                          <time className="notification-card-time">
                            {formatNotificationTimestamp(notification.created_at)}
                          </time>
                        </div>

                        {notification.body ? (
                          <p className="notification-card-description">{notification.body}</p>
                        ) : null}
                      </div>

                      <div className="notification-card-actions">
                        {notification.link ? (
                          <form action={action}>
                            <button className="button button-secondary notification-open-button" type="submit">
                              <span>Open</span>
                              <ChevronRight aria-hidden="true" size={16} strokeWidth={2.4} />
                            </button>
                          </form>
                        ) : (
                          <span className="notification-card-meta-line">Viewed in your notification center</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="surface notifications-empty-state">
              <div className="notification-card-icon notification-card-general">
                <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h2>{savedSearchAlerts.length ? "No additional updates yet" : "No notifications yet"}</h2>
                <p className="section-copy">
                  {savedSearchAlerts.length
                    ? "Your saved-search matches are shown above. Message replies and account updates will appear here next."
                    : "When someone replies to you, leaves a rating, or a saved search finds new matches, they will show up here."}
                </p>
              </div>
              <Link href="/browse" className="button button-secondary notifications-empty-action">
                Explore listings
              </Link>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
