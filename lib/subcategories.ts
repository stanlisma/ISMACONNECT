import type { ListingCategory } from "@/types/database";

type SubcategoryItem = {
  value: string;
  label: string;
};

type SubcategoryCategory = ListingCategory;

export const SUBCATEGORY_MAP: Record<SubcategoryCategory, SubcategoryItem[]> = {
  rentals: [
    { value: "apartments", label: "Apartments & Condos" },
    { value: "houses", label: "Houses" },
    { value: "rooms-shared", label: "Rooms & Shared" },
    { value: "basement-suites", label: "Basement Suites" },
    { value: "short-term-rentals", label: "Short-Term Rentals" },
    { value: "parking-storage", label: "Parking & Storage" },
    { value: "commercial-space", label: "Commercial Space" }
  ],
  "ride-share": [
    { value: "daily-commute", label: "Daily Commute" },
    { value: "one-time-ride", label: "One-Time Ride" },
    { value: "airport-ride", label: "Airport Ride" },
    { value: "camp-site-transport", label: "Camp / Site Transport" },
    { value: "long-distance-ride", label: "Long-Distance Ride" },
    { value: "delivery-item-transport", label: "Delivery / Item Transport" }
  ],
  jobs: [
    { value: "construction-trades", label: "Construction & Trades" },
    { value: "oilfield-camp-site", label: "Oilfield / Camp / Site Jobs" },
    { value: "general-labour", label: "General Labour" },
    { value: "driving-delivery", label: "Driving & Delivery" },
    { value: "hospitality", label: "Hospitality" },
    { value: "healthcare", label: "Healthcare" },
    { value: "admin-office", label: "Admin & Office" },
    { value: "other-jobs", label: "Other Jobs" }
  ],
  services: [
    { value: "skilled-trades", label: "Skilled Trades" },
    { value: "cleaning", label: "Cleaning" },
    { value: "home-services", label: "Home Services" },
    { value: "moving-hauling", label: "Moving & Hauling" },
    { value: "automotive-services", label: "Automotive Services" },
    { value: "beauty-wellness", label: "Beauty & Wellness" },
    { value: "lessons-tutoring", label: "Lessons & Tutoring" },
    { value: "business-services", label: "Business Services" },
    { value: "senior-care", label: "Senior Care" },
    { value: "other-services", label: "Other Services" }
  ],
  "buy-sell": [
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "phones", label: "Phones" },
    { value: "computers", label: "Computers" },
    { value: "home", label: "Home" },
    { value: "tools-equipment", label: "Tools & Equipment" },
    { value: "clothing", label: "Clothing" },
    { value: "baby-kids", label: "Baby & Kids" },
    { value: "auto-parts", label: "Auto Parts" },
    { value: "sports-outdoors", label: "Sports & Outdoors" },
    { value: "free-stuff", label: "Free Stuff" },
    { value: "wanted", label: "Wanted" },
    { value: "other-buy-sell", label: "Other Buy & Sell" }
  ]
};

const LEGACY_SUBCATEGORY_MAP: Record<SubcategoryCategory, Record<string, string>> = {
  rentals: {
    "rooms-for-rent": "rooms-shared",
    "furnished-rentals": "apartments",
    "storage-parking": "parking-storage"
  },
  "ride-share": {
    "one-time-rides": "one-time-ride",
    "airport-rides": "airport-ride",
    "camp-rides": "camp-site-transport",
    "edmonton-calgary-trips": "long-distance-ride",
    "drivers-available": "one-time-ride"
  },
  jobs: {
    "full-time": "other-jobs",
    "part-time": "other-jobs",
    contract: "other-jobs",
    "camp-jobs": "oilfield-camp-site",
    "skilled-trades": "construction-trades"
  },
  services: {
    moving: "moving-hauling",
    "repairs-handyman": "home-services",
    tutoring: "lessons-tutoring",
    "beauty-personal-care": "beauty-wellness"
  },
  "buy-sell": {
    appliances: "home",
    "baby-kids-items": "baby-kids",
    "vehicles-parts": "auto-parts"
  }
};

function getCategoryItems(category?: string | null) {
  if (!category || !(category in SUBCATEGORY_MAP)) {
    return [];
  }

  return SUBCATEGORY_MAP[category as SubcategoryCategory];
}

export function getSubcategories(category?: string | null) {
  return getCategoryItems(category);
}

export function normalizeSubcategory(category?: string | null, subcategory?: string | null) {
  if (!subcategory) {
    return null;
  }

  const items = getCategoryItems(category);
  const directMatch = items.find((item) => item.value === subcategory);

  if (directMatch) {
    return directMatch.value;
  }

  if (!category || !(category in LEGACY_SUBCATEGORY_MAP)) {
    return subcategory;
  }

  return LEGACY_SUBCATEGORY_MAP[category as SubcategoryCategory][subcategory] ?? subcategory;
}

export function getSubcategoryQueryValues(category?: string | null, subcategory?: string | null) {
  const normalized = normalizeSubcategory(category, subcategory);

  if (!normalized) {
    return [];
  }

  const legacyMatches =
    category && category in LEGACY_SUBCATEGORY_MAP
      ? Object.entries(LEGACY_SUBCATEGORY_MAP[category as SubcategoryCategory])
          .filter(([, canonicalValue]) => canonicalValue === normalized)
          .map(([legacyValue]) => legacyValue)
      : [];

  return Array.from(new Set([normalized, ...legacyMatches]));
}

export function getSubcategoryLabel(category?: string | null, subcategory?: string | null) {
  const normalized = normalizeSubcategory(category, subcategory);

  if (!normalized) {
    return null;
  }

  const match = getCategoryItems(category).find((item) => item.value === normalized);

  return match?.label ?? normalized;
}
