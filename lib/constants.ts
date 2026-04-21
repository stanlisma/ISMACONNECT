import type { ListingCategory, ListingStatus } from "@/types/database";

export const SITE_NAME = "ISMACONNECT";
export const SITE_TAGLINE = "Fort McMurray's local marketplace for everyday needs.";
export const SITE_DESCRIPTION =
  "ISMACONNECT helps Fort McMurray residents discover rentals, ride shares, jobs, services, and local buy & sell listings in one place.";
export const DEFAULT_LOCATION = "Fort McMurray, AB";

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
    description: "Apartments, rooms, storage, and local rental opportunities across Fort McMurray.",
    href: "/categories/rentals",
    seoTitle: "Fort McMurray rentals"
  },
  {
    value: "ride-share",
    label: "Ride Share",
    description: "Daily commutes, camp rides, airport pickups, and local travel coordination.",
    href: "/categories/ride-share",
    seoTitle: "Fort McMurray ride share listings"
  },
  {
    value: "jobs",
    label: "Jobs",
    description: "Part-time, full-time, and contract roles for local workers and employers.",
    href: "/categories/jobs",
    seoTitle: "Fort McMurray jobs"
  },
  {
    value: "services",
    label: "Services",
    description: "Trusted help for cleaning, moving, repairs, tutoring, and more.",
    href: "/categories/services",
    seoTitle: "Fort McMurray services"
  },
  {
    value: "buy-sell",
    label: "Buy & Sell",
    description: "Furniture, electronics, tools, and everyday items from local sellers.",
    href: "/categories/buy-sell",
    seoTitle: "Fort McMurray buy and sell"
  }
];

export const CATEGORY_OPTIONS = CATEGORIES.map((category) => category.value) as [
  ListingCategory,
  ...ListingCategory[]
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category])
) as Record<ListingCategory, (typeof CATEGORIES)[number]>;

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  flagged: "Flagged",
  removed: "Removed"
};

export const HOMEPAGE_FEATURES = [
  "Mobile-first listing experience for Fort McMurray shoppers and sellers",
  "Supabase Auth and Postgres-ready moderation workflows",
  "SEO-friendly category and listing pages built with the Next.js App Router"
];

