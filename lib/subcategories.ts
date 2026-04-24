export const SUBCATEGORY_MAP = {
  rentals: [
    { value: "apartments", label: "Apartments" },
    { value: "rooms-for-rent", label: "Rooms for Rent" },
    { value: "short-term-rentals", label: "Short-Term Rentals" },
    { value: "basement-suites", label: "Basement Suites" },
    { value: "furnished-rentals", label: "Furnished Rentals" },
    { value: "storage-parking", label: "Storage / Parking" }
  ],
  "ride-share": [
    { value: "daily-commute", label: "Daily Commute" },
    { value: "camp-rides", label: "Camp Rides" },
    { value: "airport-rides", label: "Airport Rides" },
    { value: "edmonton-calgary-trips", label: "Edmonton / Calgary Trips" },
    { value: "one-time-rides", label: "One-Time Rides" },
    { value: "drivers-available", label: "Drivers Available" }
  ],
  jobs: [
    { value: "full-time", label: "Full-Time" },
    { value: "part-time", label: "Part-Time" },
    { value: "contract", label: "Contract" },
    { value: "camp-jobs", label: "Camp Jobs" },
    { value: "skilled-trades", label: "Skilled Trades" },
    { value: "general-labour", label: "General Labour" }
  ],
  services: [
    { value: "cleaning", label: "Cleaning" },
    { value: "moving", label: "Moving" },
    { value: "repairs-handyman", label: "Repairs / Handyman" },
    { value: "tutoring", label: "Tutoring" },
    { value: "beauty-personal-care", label: "Beauty / Personal Care" },
    { value: "senior-care", label: "Senior Care" },
    { value: "automotive-services", label: "Automotive Services" }
  ],
  "buy-sell": [
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "tools-equipment", label: "Tools & Equipment" },
    { value: "appliances", label: "Appliances" },
    { value: "clothing", label: "Clothing" },
    { value: "baby-kids-items", label: "Baby / Kids Items" },
    { value: "vehicles-parts", label: "Vehicles / Parts" }
  ]
} as const;

export type SubcategoryCategory = keyof typeof SUBCATEGORY_MAP;

export function getSubcategories(category?: string | null) {
  if (!category || !(category in SUBCATEGORY_MAP)) {
    return [];
  }

  return SUBCATEGORY_MAP[category as SubcategoryCategory];
}

export function getSubcategoryLabel(category?: string | null, subcategory?: string | null) {
  if (!subcategory) return null;

  const match = getSubcategories(category).find((item) => item.value === subcategory);

  return match?.label ?? subcategory;
}