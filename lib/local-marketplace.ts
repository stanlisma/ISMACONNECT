import type {
  FortMcMurrayArea,
  Listing,
  ListingCategory,
  RentalListingStructuredData,
  RideShareArea,
  RideShareListingStructuredData
} from "@/types/database";

export type LocalMarketplaceAreaOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

type LocalAreaDefinition = {
  value: string;
  label: string;
  x: number;
  y: number;
  aliases: string[];
};

type CategoryQuickLink = {
  label: string;
  href: string;
};

type CategoryFaqItem = {
  question: string;
  answer: string;
};

export type CategoryLocalContent = {
  heroTitle: string;
  heroDescription: string;
  supportingCopy: string;
  localHighlights: string[];
  quickLinks: CategoryQuickLink[];
  buyerTips: string[];
  faqs: CategoryFaqItem[];
};

export const FORT_MCMURRAY_AREA_OPTIONS: Array<LocalMarketplaceAreaOption<FortMcMurrayArea>> = [
  { value: "downtown", label: "Downtown" },
  { value: "thickwood", label: "Thickwood" },
  { value: "timberlea", label: "Timberlea" },
  { value: "gregoire", label: "Gregoire" },
  { value: "airport", label: "Airport" },
  { value: "abasand", label: "Abasand" },
  { value: "eagle-ridge", label: "Eagle Ridge" }
];

export const RIDE_SHARE_AREA_OPTIONS: Array<LocalMarketplaceAreaOption<RideShareArea>> = [
  ...FORT_MCMURRAY_AREA_OPTIONS,
  { value: "site-camp", label: "Site / camp" },
  { value: "edmonton", label: "Edmonton" },
  { value: "calgary", label: "Calgary" }
];

const FORT_MCMURRAY_AREA_DEFINITIONS: Record<FortMcMurrayArea, LocalAreaDefinition> = {
  downtown: {
    value: "downtown",
    label: "Downtown",
    x: 58,
    y: 42,
    aliases: ["downtown", "city centre", "city center", "river city"]
  },
  thickwood: {
    value: "thickwood",
    label: "Thickwood",
    x: 34,
    y: 28,
    aliases: ["thickwood", "thickwood heights"]
  },
  timberlea: {
    value: "timberlea",
    label: "Timberlea",
    x: 26,
    y: 16,
    aliases: ["timberlea", "parsons creek"]
  },
  gregoire: {
    value: "gregoire",
    label: "Gregoire",
    x: 65,
    y: 60,
    aliases: ["gregoire", "gregoire lake", "gregoire industrial"]
  },
  airport: {
    value: "airport",
    label: "Airport",
    x: 78,
    y: 30,
    aliases: ["airport", "ymm"]
  },
  abasand: {
    value: "abasand",
    label: "Abasand",
    x: 47,
    y: 52,
    aliases: ["abasand"]
  },
  "eagle-ridge": {
    value: "eagle-ridge",
    label: "Eagle Ridge",
    x: 40,
    y: 18,
    aliases: ["eagle ridge", "eagleridge"]
  }
};

const RIDE_SHARE_AREA_DEFINITIONS: Record<RideShareArea, LocalAreaDefinition> = {
  ...FORT_MCMURRAY_AREA_DEFINITIONS,
  "site-camp": {
    value: "site-camp",
    label: "Site / camp",
    x: 90,
    y: 16,
    aliases: ["site", "camp", "site-camp", "oil sands", "work site"]
  },
  edmonton: {
    value: "edmonton",
    label: "Edmonton",
    x: 18,
    y: 84,
    aliases: ["edmonton", "yeg"]
  },
  calgary: {
    value: "calgary",
    label: "Calgary",
    x: 8,
    y: 96,
    aliases: ["calgary", "yyc"]
  }
};

export const CATEGORY_LOCAL_CONTENT: Record<ListingCategory, CategoryLocalContent> = {
  rentals: {
    heroTitle: "Fort McMurray rentals that feel local, not generic",
    heroDescription:
      "Browse furnished rooms, worker-friendly apartments, short-term stays, and truck-friendly rental options posted by people who know the area.",
    supportingCopy:
      "Renters in Fort McMurray usually care about commute time, parking, furnished setups, and whether a place works for shift schedules. ISMACONNECT highlights those details directly in the listing filters.",
    localHighlights: [
      "Worker-friendly filters for furnished, short-term, and parking-sensitive rentals.",
      "Neighbourhood-aware browsing for Timberlea, Thickwood, Downtown, Gregoire, and nearby areas.",
      "Shorter back-and-forth because listings can surface utilities, parking, and furnished status up front."
    ],
    quickLinks: [
      { label: "Furnished rentals", href: "/categories/rentals?subcategory=furnished-rentals" },
      { label: "Short-term friendly", href: "/categories/rentals?shortTerm=true" },
      { label: "Truck-friendly parking", href: "/categories/rentals?parkingType=truck" },
      { label: "Timberlea rentals", href: "/categories/rentals?rentalArea=timberlea&view=map" }
    ],
    buyerTips: [
      "Use the map view to scan neighbourhood coverage before you start messaging.",
      "Check furnished and short-term filters first if you are moving for shift work or camp rotations.",
      "Listings with clear parking details tend to get more useful replies faster."
    ],
    faqs: [
      {
        question: "Can I find short-term rentals for shift work?",
        answer:
          "Yes. Use the short-term filter and furnished rental subcategories to narrow in on listings that are better suited to temporary work schedules."
      },
      {
        question: "How should landlords improve rental responses?",
        answer:
          "Include the neighbourhood, parking type, furnished status, and whether utilities are included. Those details matter quickly in Fort McMurray."
      },
      {
        question: "What makes the rental map useful?",
        answer:
          "The map groups active rentals by area so you can immediately see whether current inventory is concentrated in Timberlea, Thickwood, Downtown, Gregoire, and nearby areas."
      }
    ]
  },
  "ride-share": {
    heroTitle: "Ride share built for camp runs, airport pickups, and local commutes",
    heroDescription:
      "Find seats, drivers, and route matches for airport trips, site commutes, Edmonton or Calgary rides, and everyday travel around Fort McMurray.",
    supportingCopy:
      "Ride-share posts work best when they show where a trip starts, where it ends, and whether there is room for tools or luggage. ISMACONNECT makes those route details filterable.",
    localHighlights: [
      "Departure and destination filters tuned for Fort McMurray, camp routes, and intercity travel.",
      "Quick route visibility for airport pickups, site commutes, Edmonton trips, and Calgary trips.",
      "Tool-space and seat-count context helps workers and commuters decide faster."
    ],
    quickLinks: [
      { label: "Airport rides", href: "/categories/ride-share?subcategory=airport-rides&view=map" },
      { label: "Camp rides", href: "/categories/ride-share?subcategory=camp-rides&view=map" },
      { label: "Edmonton trips", href: "/categories/ride-share?destinationArea=edmonton&view=map" },
      { label: "Tools / luggage space", href: "/categories/ride-share?toolSpace=true&view=map" }
    ],
    buyerTips: [
      "Use the map view to spot the most active pickup and destination areas before you message.",
      "If you need room for work gear, use the tool-space filter before checking one-off rides.",
      "Airport and camp categories are the fastest way to narrow high-intent travel listings."
    ],
    faqs: [
      {
        question: "Can riders find Edmonton or Calgary trips here?",
        answer:
          "Yes. Ride-share listings can show those destinations directly, and the map view highlights the routes that are currently being posted."
      },
      {
        question: "Why is map view useful for ride share?",
        answer:
          "It shows where trips start, where they end, and which routes show up most often, so commuters can decide faster without opening every post."
      },
      {
        question: "What should drivers include in ride listings?",
        answer:
          "Add your departure area, destination, available seats, and whether there is room for tools or luggage. Those details help the right riders contact you."
      }
    ]
  },
  jobs: {
    heroTitle: "Local job posts with rotation, camp, and ticket details up front",
    heroDescription:
      "Browse Fort McMurray job listings with structured filters for shift pattern, work setup, pay band, and required tickets.",
    supportingCopy:
      "The strongest local job listings are the ones that clearly show shift pattern, pay band, and whether the role is camp, FIFO, DIDO, or local.",
    localHighlights: [
      "Structured filters for camp, FIFO, DIDO, local, and hybrid job setups.",
      "Rotation and ticket details reduce back-and-forth for both employers and applicants.",
      "Built for practical Fort McMurray hiring, not generic job-board noise."
    ],
    quickLinks: [
      { label: "Camp jobs", href: "/categories/jobs?subcategory=camp-jobs" },
      { label: "7 on / 7 off", href: "/categories/jobs?shiftPattern=7-on-7-off" },
      { label: "Tickets required", href: "/categories/jobs?ticketsRequired=true" },
      { label: "Salary roles", href: "/categories/jobs?payBand=salary" }
    ],
    buyerTips: [
      "Check work setup first if you are comparing local, camp, FIFO, or DIDO options.",
      "Rotation filters save time when you already know the schedule you can work.",
      "Ticket requirements are a strong trust signal for trade and site-based roles."
    ],
    faqs: [
      {
        question: "What job filters matter most locally?",
        answer:
          "Shift pattern, work setup, pay band, and ticket requirements are usually the fastest way to separate casual local jobs from site-based roles."
      },
      {
        question: "Can employers target camp-ready workers?",
        answer:
          "Yes. Listings can state camp, FIFO, or DIDO directly so workers do not have to guess."
      },
      {
        question: "Why use ISMACONNECT for local jobs?",
        answer:
          "The platform is tuned for the fields local workers actually check first instead of hiding them in long paragraphs."
      }
    ]
  },
  services: {
    heroTitle: "Find trusted Fort McMurray services without scrolling generic directories",
    heroDescription:
      "Browse cleaning, repairs, moving help, senior care, tutoring, and more from local service providers and businesses.",
    supportingCopy:
      "Service listings work best when they feel local and credible, especially for repeat or in-home jobs. ISMACONNECT pairs those listings with seller trust and business storefronts.",
    localHighlights: [
      "Designed for repeat local services like cleaning, repairs, and senior care.",
      "Business storefronts and trust badges help people decide who to contact first.",
      "Subcategories stay focused on the services locals actually search for."
    ],
    quickLinks: [
      { label: "Cleaning services", href: "/categories/services?subcategory=cleaning" },
      { label: "Senior care", href: "/categories/services?subcategory=senior-care" },
      { label: "Automotive services", href: "/categories/services?subcategory=automotive-services" },
      { label: "Tutoring", href: "/categories/services?subcategory=tutoring" }
    ],
    buyerTips: [
      "Open the seller storefront before messaging so you can compare business details and active listings.",
      "Shorter service listings perform better when the storefront explains service area and specialty.",
      "Use subcategories early to separate home, personal, and business-focused services."
    ],
    faqs: [
      {
        question: "Can service providers use business storefronts?",
        answer:
          "Yes. Service-focused sellers can now add business names, logos, service areas, and website links to look more professional."
      },
      {
        question: "What makes a strong local service listing?",
        answer:
          "Clear service type, location coverage, response-friendly description, and a business-aware storefront are the biggest trust builders."
      },
      {
        question: "How should buyers evaluate service listings?",
        answer:
          "Check ratings, business profile details, active listings, and whether the listing clearly states what is included."
      }
    ]
  },
  "buy-sell": {
    heroTitle: "Buy and sell locally with faster browsing and cleaner seller trust signals",
    heroDescription:
      "Shop furniture, electronics, tools, clothing, and everyday items from Fort McMurray sellers without digging through generic community feeds.",
    supportingCopy:
      "The best local buy-and-sell listings combine clear photos, specific subcategories, and seller trust signals so buyers can move quickly.",
    localHighlights: [
      "Stronger listing images, saved searches, and seller trust profiles improve conversion.",
      "Subcategories help buyers move directly into furniture, electronics, tools, or clothing.",
      "Built for local pickup-style transactions and faster response loops."
    ],
    quickLinks: [
      { label: "Furniture", href: "/categories/buy-sell?subcategory=furniture" },
      { label: "Electronics", href: "/categories/buy-sell?subcategory=electronics" },
      { label: "Tools & equipment", href: "/categories/buy-sell?subcategory=tools-equipment" },
      { label: "Vehicles / parts", href: "/categories/buy-sell?subcategory=vehicles-parts" }
    ],
    buyerTips: [
      "Use subcategories first, then seller trust signals, before opening individual posts.",
      "Listings with stronger photo coverage usually convert better because buyers can decide faster.",
      "Saved searches are especially useful for fast-moving items like tools, furniture, and electronics."
    ],
    faqs: [
      {
        question: "What kinds of items fit best here?",
        answer:
          "Furniture, electronics, tools, clothing, vehicles and parts, baby items, and other everyday local buy-and-sell posts all fit well."
      },
      {
        question: "How can sellers get more replies?",
        answer:
          "Use strong cover photos, choose the right subcategory, and keep contact details and seller profile information current."
      },
      {
        question: "How can buyers shop more efficiently?",
        answer:
          "Start with subcategories, then use seller ratings, verification, and saved searches to avoid rechecking the same posts."
      }
    ]
  }
};

export function getCategoryLocalContent(category: ListingCategory) {
  return CATEGORY_LOCAL_CONTENT[category];
}

export function getFortMcmurrayAreaDefinition(area?: FortMcMurrayArea | null) {
  return area ? FORT_MCMURRAY_AREA_DEFINITIONS[area] : null;
}

export function getRideShareAreaDefinition(area?: RideShareArea | null) {
  return area ? RIDE_SHARE_AREA_DEFINITIONS[area] : null;
}

export function inferFortMcmurrayAreaFromLocation(location?: string | null) {
  const normalized = normalizeLookupText(location);

  if (!normalized) {
    return null;
  }

  return (
    (Object.values(FORT_MCMURRAY_AREA_DEFINITIONS).find((definition) =>
      definition.aliases.some((alias) => normalized.includes(normalizeLookupText(alias)))
    )?.value as FortMcMurrayArea | undefined) ?? null
  );
}

export function inferRideShareAreaFromText(text?: string | null) {
  const normalized = normalizeLookupText(text);

  if (!normalized) {
    return null;
  }

  return (
    (Object.values(RIDE_SHARE_AREA_DEFINITIONS).find((definition) =>
      definition.aliases.some((alias) => normalized.includes(normalizeLookupText(alias)))
    )?.value as RideShareArea | undefined) ?? null
  );
}

export function getRentalAreaFromListing(listing: Listing) {
  const structuredData = (listing.structured_data ?? {}) as RentalListingStructuredData;
  return structuredData.rentalArea ?? inferFortMcmurrayAreaFromLocation(listing.location);
}

export function getRideShareAreasFromListing(listing: Listing) {
  const structuredData = (listing.structured_data ?? {}) as RideShareListingStructuredData;
  const departureArea =
    structuredData.departureArea ??
    inferRideShareAreaFromText(listing.location) ??
    inferRideShareAreaFromText(`${listing.title} ${listing.description}`);

  const destinationArea =
    structuredData.destinationArea ?? inferRideShareAreaFromText(`${listing.title} ${listing.description}`);

  return {
    departureArea: departureArea ?? null,
    destinationArea: destinationArea ?? null
  };
}

export function getRentalAreaCounts(listings: Listing[]) {
  const counts = new Map<FortMcMurrayArea, number>();
  let unknownCount = 0;

  for (const listing of listings) {
    const area = getRentalAreaFromListing(listing);

    if (!area) {
      unknownCount += 1;
      continue;
    }

    counts.set(area, (counts.get(area) ?? 0) + 1);
  }

  return {
    knownAreas: FORT_MCMURRAY_AREA_OPTIONS.map((option) => ({
      ...FORT_MCMURRAY_AREA_DEFINITIONS[option.value],
      count: counts.get(option.value) ?? 0
    }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count),
    unknownCount
  };
}

export function getRideShareRouteCounts(listings: Listing[]) {
  const routeCounts = new Map<string, { departure: RideShareArea; destination: RideShareArea; count: number }>();
  const endpointCounts = new Map<RideShareArea, number>();
  let flexibleCount = 0;

  for (const listing of listings) {
    const { departureArea, destinationArea } = getRideShareAreasFromListing(listing);

    if (!departureArea && !destinationArea) {
      flexibleCount += 1;
      continue;
    }

    if (departureArea) {
      endpointCounts.set(departureArea, (endpointCounts.get(departureArea) ?? 0) + 1);
    }

    if (destinationArea) {
      endpointCounts.set(destinationArea, (endpointCounts.get(destinationArea) ?? 0) + 1);
    }

    if (departureArea && destinationArea) {
      const key = `${departureArea}:${destinationArea}`;
      const current = routeCounts.get(key);

      routeCounts.set(key, {
        departure: departureArea,
        destination: destinationArea,
        count: (current?.count ?? 0) + 1
      });
    }
  }

  return {
    routes: Array.from(routeCounts.values())
      .map((route) => ({
        ...route,
        departureLabel: RIDE_SHARE_AREA_DEFINITIONS[route.departure].label,
        destinationLabel: RIDE_SHARE_AREA_DEFINITIONS[route.destination].label,
        departurePoint: RIDE_SHARE_AREA_DEFINITIONS[route.departure],
        destinationPoint: RIDE_SHARE_AREA_DEFINITIONS[route.destination]
      }))
      .sort((left, right) => right.count - left.count),
    endpoints: Array.from(endpointCounts.entries())
      .map(([area, count]) => ({
        ...RIDE_SHARE_AREA_DEFINITIONS[area],
        count
      }))
      .sort((left, right) => right.count - left.count),
    flexibleCount
  };
}

export function getCategorySeoTitle(category: ListingCategory) {
  switch (category) {
    case "rentals":
      return "Fort McMurray rentals, furnished rooms, and short-term stays";
    case "ride-share":
      return "Fort McMurray ride share, camp rides, and airport trips";
    case "jobs":
      return "Fort McMurray jobs with camp, FIFO, DIDO, and rotation filters";
    case "services":
      return "Fort McMurray local services and business storefronts";
    case "buy-sell":
      return "Fort McMurray buy and sell marketplace";
    default:
      return "Fort McMurray marketplace listings";
  }
}

function normalizeLookupText(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}
