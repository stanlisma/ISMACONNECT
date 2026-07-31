import type {
  ListingCategory,
  ListingIntent,
  ListingPriceType,
  ListingStatus,
  RequestWindow
} from "@/types/database";

export const SITE_NAME = "ISMACONNECT";
export const SITE_TAGLINE = "Fort McMurray rides, rentals, services, jobs, and worker logistics.";
export const SITE_DESCRIPTION =
  "Fort McMurray's local marketplace for rides, rentals, jobs, and services — built to replace scattered group chats and community posts.";
export const DEFAULT_LOCATION = "Fort McMurray, AB";
export const DEFAULT_MARKETPLACE_CATEGORY: ListingCategory = "services";
export const SITE_SUPPORT_EMAIL = "admin@ismaconnect.ca";
export const FOUNDING_MEMBER_CAP = 100;

// SVG is deliberately excluded: it can carry an embedded <script> that
// runs when the "image" is opened directly, unlike raster formats.
export const ALLOWED_IMAGE_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
export const HERO_CATEGORY_VALUES: ListingCategory[] = ["ride-share", "services", "rentals", "jobs"];
export const SUPPORT_CATEGORY_VALUES: ListingCategory[] = [DEFAULT_MARKETPLACE_CATEGORY];

export const CATEGORIES: Array<{
  value: ListingCategory;
  label: string;
  description: string;
  href: string;
  seoTitle: string;
}> = [
  {
    value: "rentals",
    label: "Rentals",
    description: "Apartments, houses, shared rooms, commercial space, and parking across Fort McMurray.",
    href: "/categories/rentals",
    seoTitle: "Fort McMurray rentals"
  },
  {
    value: "ride-share",
    label: "Ride Share",
    description: "Daily commutes, airport trips, camp transport, and long-distance local travel coordination.",
    href: "/categories/ride-share",
    seoTitle: "Fort McMurray ride share listings"
  },
  {
    value: "jobs",
    label: "Jobs",
    description: "Construction, oilfield, delivery, hospitality, healthcare, and office jobs for local workers.",
    href: "/categories/jobs",
    seoTitle: "Fort McMurray jobs"
  },
  {
    value: "services",
    label: "Services",
    description: "Trusted local help for trades, cleaning, moving, childcare, senior care, tutoring, beauty, and business services.",
    href: "/categories/services",
    seoTitle: "Fort McMurray services"
  },
  {
    value: "buy-sell",
    label: "Buy & Sell",
    description: "Furniture, electronics, tools, and everyday items from local sellers when you need them.",
    href: "/categories/buy-sell",
    seoTitle: "Fort McMurray buy and sell"
  }
];

export const CATEGORY_OPTIONS = CATEGORIES.map((category) => category.value) as [
  ListingCategory,
  ...ListingCategory[]
];

export const LISTING_INTENT_OPTIONS = ["offer", "need"] as [ListingIntent, ...ListingIntent[]];
export const LISTING_PRICE_TYPE_OPTIONS = [
  "flat-rate",
  "hourly",
  "per-trip",
  "per-day",
  "per-week",
  "per-month",
  "contact"
] as [ListingPriceType, ...ListingPriceType[]];

export const LISTING_INTENT_LABELS: Record<ListingIntent, string> = {
  offer: "Offer",
  need: "Need"
};

export const LISTING_PRICE_TYPE_LABELS: Record<ListingPriceType, string> = {
  "flat-rate": "Flat rate",
  hourly: "Hourly",
  "per-trip": "Per trip",
  "per-day": "Per day",
  "per-week": "Per week",
  "per-month": "Per month",
  contact: "Contact for price"
};

export const REQUEST_WINDOW_OPTIONS = ["today", "this-week", "flexible"] as [
  RequestWindow,
  ...RequestWindow[]
];

export const REQUEST_WINDOW_LABELS: Record<RequestWindow, string> = {
  today: "Today",
  "this-week": "This week",
  flexible: "Flexible"
};

export function getDefaultPriceType(category?: ListingCategory | null): ListingPriceType {
  switch (category) {
    case "rentals":
      return "per-month";
    case "ride-share":
      return "per-trip";
    case "jobs":
      return "hourly";
    case "services":
      return "flat-rate";
    case "buy-sell":
    default:
      return "flat-rate";
  }
}

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category])
) as Record<ListingCategory, (typeof CATEGORIES)[number]>;

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  flagged: "Flagged",
  removed: "Removed",
  paused: "Paused",
  deactivated: "Paused"
};

export const HOMEPAGE_FEATURES = [
  "Mobile-first listing experience for Fort McMurray shoppers and sellers",
  "Supabase Auth and Postgres-ready moderation workflows",
  "SEO-friendly category and listing pages built with the Next.js App Router"
];
