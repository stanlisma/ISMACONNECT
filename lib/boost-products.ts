import type { Listing } from "@/types/database";

export type BoostProductKey = "top_boost_3d" | "featured_spotlight_7d" | "urgent_badge_7d";

export interface BoostProduct {
  key: BoostProductKey;
  name: string;
  shortLabel: string;
  description: string;
  amountCents: number;
  currency: "cad";
  featuredDays?: number;
  urgentDays?: number;
  boostDays?: number;
  callout: string;
  highlights: string[];
}

export const BOOST_PRODUCTS: BoostProduct[] = [
  {
    key: "top_boost_3d",
    name: "Top Boost",
    shortLabel: "Boost 3 days",
    description:
      "Push your listing higher in browse and category feeds for the next 3 days.",
    amountCents: 790,
    currency: "cad",
    boostDays: 3,
    callout: "Best for urgent tools, rides, and fast-moving local sales.",
    highlights: ["Ranks ahead of standard listings", "Fresh top-of-feed push", "Works on browse + categories"]
  },
  {
    key: "featured_spotlight_7d",
    name: "Featured Spotlight",
    shortLabel: "Featured 7 days",
    description:
      "Add a featured badge and priority placement for 7 days, including homepage eligibility.",
    amountCents: 1490,
    currency: "cad",
    featuredDays: 7,
    callout: "Best for rentals, jobs, and higher-value listings.",
    highlights: ["Featured badge on cards + detail pages", "Homepage spotlight eligibility", "Priority in public feeds"]
  },
  {
    key: "urgent_badge_7d",
    name: "Urgent Badge",
    shortLabel: "Urgent 7 days",
    description:
      "Add an urgent badge for 7 days so time-sensitive posts stand out on mobile and desktop.",
    amountCents: 490,
    currency: "cad",
    urgentDays: 7,
    callout: "Best for same-week rentals, ride shares, and shift-fill jobs.",
    highlights: ["Urgent badge on listing cards", "High-visibility detail badge", "Great for time-sensitive posts"]
  }
];

export function getBoostProduct(productKey: string | null | undefined) {
  return BOOST_PRODUCTS.find((product) => product.key === productKey) ?? null;
}

export function getListingBoostState(listing: Listing) {
  const now = Date.now();

  const featuredActive =
    listing.is_featured &&
    (!listing.featured_until || new Date(listing.featured_until).getTime() > now);
  const urgentActive =
    listing.is_urgent &&
    (!listing.urgent_until || new Date(listing.urgent_until).getTime() > now);
  const boostedActive =
    Boolean(listing.boosted_until) && new Date(listing.boosted_until as string).getTime() > now;

  return {
    featuredActive,
    urgentActive,
    boostedActive
  };
}
