const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const HOMEPAGE_FRESH_DAYS = 14;
export const STALE_LISTING_DAYS = 14;
export const FRESH_LISTING_DAYS = 7;

function formatStaticDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(dateString));
}

export function getListingAgeDays(dateString: string, now = Date.now()) {
  const date = new Date(dateString);
  const diffMs = Math.max(0, now - date.getTime());
  return Math.floor(diffMs / DAY_MS);
}

export function isFreshListing(dateString: string, freshnessDays = HOMEPAGE_FRESH_DAYS) {
  return getListingAgeDays(dateString) < freshnessDays;
}

export function getListingFreshness(createdAt: string, now = Date.now()) {
  const date = new Date(createdAt);
  const diffMs = Math.max(0, now - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const isStale = diffDays >= STALE_LISTING_DAYS;

  if (diffMinutes < 60) {
    return {
      isNew: true,
      isFresh: true,
      isStale: false,
      ageDays: 0,
      timeLabel: "New",
      badgeLabel: "Just listed",
      detailLabel: "Fresh listing"
    };
  }

  if (diffHours < 24) {
    return {
      isNew: true,
      isFresh: true,
      isStale: false,
      ageDays: 0,
      timeLabel: `${diffHours}h`,
      badgeLabel: `${diffHours}h ago`,
      detailLabel: "Fresh listing"
    };
  }

  if (diffDays < FRESH_LISTING_DAYS) {
    return {
      isNew: diffHours <= 48,
      isFresh: true,
      isStale: false,
      ageDays: diffDays,
      timeLabel: `${diffDays}d`,
      badgeLabel: `${diffDays}d ago`,
      detailLabel: "Fresh listing"
    };
  }

  if (isStale) {
    return {
      isNew: false,
      isFresh: false,
      isStale: true,
      ageDays: diffDays,
      timeLabel: formatStaticDateLabel(createdAt),
      badgeLabel: formatStaticDateLabel(createdAt),
      detailLabel: "Listed"
    };
  }

  return {
    isNew: false,
    isFresh: false,
    isStale: false,
    ageDays: diffDays,
    timeLabel: formatStaticDateLabel(createdAt),
    badgeLabel: formatStaticDateLabel(createdAt),
    detailLabel: "Listed"
  };
}
