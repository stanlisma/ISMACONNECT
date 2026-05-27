import Link from "next/link";
import {
  Bell,
  ChevronRight,
  MessageCircle,
  CheckCheck,
  Rocket,
  Search,
  ShieldCheck,
  Star
} from "lucide-react";

import { requireViewer } from "@/lib/auth";
import { getSavedSearchesWithStats } from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
};

type ListingPreview = {
  id: string;
  slug: string;
  title: string;
  location: string;
  imageUrl: string | null;
  href: string;
};

type ConversationListingReference = {
  id: string;
  listing_id: string;
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getListingPreviewImage(
  listing: Pick<Listing, "image_url" | "image_urls"> | null | undefined
) {
  return listing?.image_url ?? listing?.image_urls?.[0] ?? null;
}

function getConversationIdFromLink(link: string | null | undefined) {
  if (!link) {
    return null;
  }

  const match = /^\/messages\/([^/?#]+)/.exec(link);
  return match?.[1] ?? null;
}

function getListingSlugFromLink(link: string | null | undefined) {
  if (!link) {
    return null;
  }

  const match = /^\/listings\/([^/?#]+)/.exec(link);
  return match?.[1] ?? null;
}

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

function buildListingPreview(
  listing: Pick<Listing, "id" | "slug" | "title" | "location" | "image_url" | "image_urls">
): ListingPreview {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    location: listing.location,
    imageUrl: getListingPreviewImage(listing),
    href: `/listings/${listing.slug}`
  };
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

  const savedSearches = await getSavedSearchesWithStats(viewer.user.id);
  const savedSearchAlerts = savedSearches.filter((savedSearch) => savedSearch.newMatchesCount > 0);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false });

  const hasUnreadNotifications = notifications?.some((notification) => !notification.is_read) ?? false;
  const hasSavedSearchAlerts = savedSearchAlerts.length > 0;
  const hasUnreadActivity = hasUnreadNotifications || hasSavedSearchAlerts;

  const notificationItems = (notifications ?? []) as NotificationRecord[];
  const notificationConversationIds = uniqueStrings(
    notificationItems.map((notification) => getConversationIdFromLink(notification.link))
  );
  const directListingSlugs = uniqueStrings(
    notificationItems.map((notification) => getListingSlugFromLink(notification.link))
  );

  const { data: conversationReferences } = notificationConversationIds.length
    ? await supabase
        .from("conversations")
        .select("id, listing_id")
        .in("id", notificationConversationIds)
    : { data: [] as ConversationListingReference[] };

  const listingIdsFromConversations = uniqueStrings(
    ((conversationReferences ?? []) as ConversationListingReference[]).map(
      (conversation) => conversation.listing_id
    )
  );

  const [{ data: listingsById }, { data: listingsBySlug }] = await Promise.all([
    listingIdsFromConversations.length
      ? supabase
          .from("listings")
          .select("id, slug, title, location, image_url, image_urls")
          .in("id", listingIdsFromConversations)
      : Promise.resolve({ data: [] as Array<
          Pick<Listing, "id" | "slug" | "title" | "location" | "image_url" | "image_urls">
        > }),
    directListingSlugs.length
      ? supabase
          .from("listings")
          .select("id, slug, title, location, image_url, image_urls")
          .in("slug", directListingSlugs)
      : Promise.resolve({ data: [] as Array<
          Pick<Listing, "id" | "slug" | "title" | "location" | "image_url" | "image_urls">
        > })
  ]);

  const listingPreviewById = new Map<string, ListingPreview>();
  const listingPreviewBySlug = new Map<string, ListingPreview>();

  [...(listingsById ?? []), ...(listingsBySlug ?? [])].forEach((listing) => {
    const preview = buildListingPreview(listing);
    listingPreviewById.set(preview.id, preview);
    listingPreviewBySlug.set(preview.slug, preview);
  });

  const listingPreviewByConversationId = new Map<string, ListingPreview>();

  ((conversationReferences ?? []) as ConversationListingReference[]).forEach((conversation) => {
    const preview = listingPreviewById.get(conversation.listing_id);

    if (preview) {
      listingPreviewByConversationId.set(conversation.id, preview);
    }
  });

  const enrichedNotifications = notificationItems.map((notification) => {
    const conversationId = getConversationIdFromLink(notification.link);
    const listingSlug = getListingSlugFromLink(notification.link);
    const preview =
      (conversationId ? listingPreviewByConversationId.get(conversationId) : null) ??
      (listingSlug ? listingPreviewBySlug.get(listingSlug) : null) ??
      null;

    return {
      ...notification,
      preview
    };
  });

  return (
    <section className="section notifications-page">
      <div className="container notifications-page-container">
        <div className="notifications-page-header">
          <div>
            <h1 className="section-title">Notifications</h1>
            <p className="section-copy">
              Keep up with replies, saved-search matches, and account updates without losing your place.
            </p>
          </div>
          {hasUnreadActivity ? (
            <Link
              href="/notifications/open?all=1&next=/notifications"
              className="button button-secondary notifications-mark-all"
            >
              <CheckCheck aria-hidden="true" size={16} strokeWidth={2.2} />
              <span>Mark all read</span>
            </Link>
          ) : null}
        </div>

        <div className="notifications-stack">
          {savedSearchAlerts.length ? (
            <section className="surface notifications-section notifications-section-priority">
              <div className="notifications-section-head">
                <div>
                  <span className="notifications-section-label">Priority</span>
                  <h2>Saved search alerts</h2>
                </div>

                <div className="notifications-section-count">
                  <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                  <strong>{savedSearchAlerts.length}</strong>
                </div>
              </div>

              <div className="notifications-list">
                {savedSearchAlerts.map((savedSearch) => (
                  <Link
                    key={savedSearch.id}
                    href={`/notifications/open?savedSearch=${savedSearch.id}&next=${encodeURIComponent(savedSearch.href)}`}
                    className="notification-card notification-card-search notification-card-link"
                  >
                    <div className="notification-card-media notification-card-search">
                      {savedSearch.latestMatches[0] ? (
                        <>
                          {getListingPreviewImage(savedSearch.latestMatches[0]) ? (
                            <img
                              src={getListingPreviewImage(savedSearch.latestMatches[0]) ?? undefined}
                              alt={savedSearch.latestMatches[0].title}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="notification-card-media-fallback notification-card-icon-search">
                              <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                            </div>
                          )}
                          <span className="notification-card-media-badge notification-card-search">
                            <Search aria-hidden="true" size={14} strokeWidth={2.2} />
                          </span>
                        </>
                      ) : (
                        <div className="notification-card-media-fallback notification-card-icon-search">
                          <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                        </div>
                      )}
                    </div>

                    <div className="notification-card-body">
                      <div className="notification-card-head">
                        <div className="notification-card-headline">
                          <span className="notification-type-pill">Saved search</span>
                          <h3>{savedSearch.label}</h3>
                        </div>
                        <span className="saved-search-alert-badge">{savedSearch.newMatchesCount} new</span>
                      </div>

                      <div className="notification-card-meta">
                        {savedSearch.latestMatches[0]?.title ? (
                          <span className="notification-card-related">
                            {savedSearch.latestMatches[0].title}
                          </span>
                        ) : null}
                        {savedSearch.latestMatches[0]?.location ? (
                          <span>{savedSearch.latestMatches[0].location}</span>
                        ) : null}
                        <time className="notification-card-time">
                          {formatNotificationTimestamp(savedSearch.latestMatches[0]?.created_at)}
                        </time>
                      </div>
                    </div>

                    <div className="notification-card-trailing">
                      <ChevronRight aria-hidden="true" size={16} strokeWidth={2.4} />
                    </div>
                  </Link>
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
                </div>

                <div className="notifications-section-count">
                  <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
                  <strong>{notificationItems.length}</strong>
                </div>
              </div>

              <div className="notifications-list">
                {enrichedNotifications.map((notification) => {
                  const presentation = getNotificationPresentation(notification.type);
                  const isUnread = !notification.is_read;

                  const cardContent = (
                    <>
                      <div className={`notification-card-media ${presentation.className}`}>
                        {notification.preview?.imageUrl ? (
                          <>
                            <img
                              src={notification.preview.imageUrl}
                              alt={notification.preview.title}
                              loading="lazy"
                              decoding="async"
                            />
                            <span className={`notification-card-media-badge ${presentation.className}`}>
                              {presentation.icon}
                            </span>
                          </>
                        ) : (
                          <div className={`notification-card-media-fallback ${presentation.className}`}>
                            {presentation.icon}
                          </div>
                        )}
                      </div>

                      <div className="notification-card-body">
                        <div className="notification-card-head">
                          <div className="notification-card-headline">
                            <span className="notification-type-pill">{presentation.label}</span>
                            <h3>{notification.title}</h3>
                          </div>
                          {isUnread ? <span className="notification-card-status">New</span> : null}
                        </div>

                        {notification.body ? (
                          <p className="notification-card-description">{notification.body}</p>
                        ) : null}

                        <div className="notification-card-meta">
                          {notification.preview?.title ? (
                            <span className="notification-card-related">{notification.preview.title}</span>
                          ) : null}
                          {notification.preview?.location ? (
                            <span>{notification.preview.location}</span>
                          ) : null}
                          <time className="notification-card-time">
                            {formatNotificationTimestamp(notification.created_at)}
                          </time>
                        </div>
                      </div>

                      <div className="notification-card-trailing">
                        {notification.link ? (
                          <ChevronRight aria-hidden="true" size={16} strokeWidth={2.4} />
                        ) : (
                          <span className="notification-card-meta-line">Viewed</span>
                        )}
                      </div>
                    </>
                  );

                  if (notification.link) {
                    return (
                      <Link
                        key={notification.id}
                        href={`/notifications/open?notification=${notification.id}&next=${encodeURIComponent(notification.link)}`}
                        className={`notification-card notification-card-link ${presentation.className}${isUnread ? " is-unread" : ""}`}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  if (isUnread) {
                    return (
                      <Link
                        key={notification.id}
                        href={`/notifications/open?notification=${notification.id}&next=/notifications`}
                        className={`notification-card notification-card-link ${presentation.className} is-unread`}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return (
                    <article
                      key={notification.id}
                      className={`notification-card ${presentation.className}`}
                    >
                      {cardContent}
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
