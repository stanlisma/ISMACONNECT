import { z } from "zod";

import {
  FORT_MCMURRAY_AREA_OPTIONS,
  RIDE_SHARE_AREA_OPTIONS
} from "@/lib/local-marketplace";
import type {
  JobListingStructuredData,
  ListingCategory,
  ListingStructuredData,
  RentalListingStructuredData,
  RideShareListingStructuredData
} from "@/types/database";

type StructuredFieldOption = {
  label: string;
  value: string;
};

export type StructuredFieldDefinition = {
  name: string;
  label: string;
  kind: "select" | "checkbox" | "number" | "date";
  helpText?: string;
  options?: StructuredFieldOption[];
  showInFilters?: boolean;
};

export type StructuredFilterRecord = Record<string, string | boolean>;

const JOB_SHIFT_OPTIONS = [
  { value: "day-shift", label: "Day shift" },
  { value: "night-shift", label: "Night shift" },
  { value: "7-on-7-off", label: "7 on / 7 off" },
  { value: "14-on-7-off", label: "14 on / 7 off" },
  { value: "14-on-14-off", label: "14 on / 14 off" },
  { value: "other", label: "Other rotation" }
] as const satisfies StructuredFieldOption[];

const JOB_WORK_SETUP_OPTIONS = [
  { value: "local", label: "Local" },
  { value: "camp", label: "Camp" },
  { value: "fifo", label: "FIFO" },
  { value: "dido", label: "DIDO" },
  { value: "hybrid", label: "Hybrid" }
] as const satisfies StructuredFieldOption[];

const JOB_PAY_BAND_OPTIONS = [
  { value: "under-25", label: "Under $25/hr" },
  { value: "25-35", label: "$25 - $35/hr" },
  { value: "35-50", label: "$35 - $50/hr" },
  { value: "50-plus", label: "$50+/hr" },
  { value: "salary", label: "Salary" }
] as const satisfies StructuredFieldOption[];

const RENTAL_AREA_OPTIONS = FORT_MCMURRAY_AREA_OPTIONS as readonly StructuredFieldOption[];

const RENTAL_PARKING_OPTIONS = [
  { value: "none", label: "No parking" },
  { value: "street", label: "Street parking" },
  { value: "stall", label: "Stall / driveway" },
  { value: "truck", label: "Truck-friendly parking" }
] as const satisfies StructuredFieldOption[];

const RENTAL_AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Available now" },
  { value: "from-date", label: "Available from a date" },
  { value: "short-term-worker-stay", label: "Short-term worker stay" },
  { value: "rotation-friendly", label: "Rotation-friendly" }
] as const satisfies StructuredFieldOption[];

const RENTAL_LEASE_PATTERN_OPTIONS = [
  { value: "month-to-month", label: "Month-to-month" },
  { value: "weekly", label: "Weekly" },
  { value: "rotation-stay", label: "Rotation stay" },
  { value: "flexible", label: "Flexible" }
] as const satisfies StructuredFieldOption[];

const RENTAL_BEST_FOR_OPTIONS = [
  { value: "fifo-worker", label: "FIFO worker" },
  { value: "shift-worker", label: "Shift worker" },
  { value: "crew-housing", label: "Crew housing" },
  { value: "single-occupant", label: "Single occupant" }
] as const satisfies StructuredFieldOption[];

const RIDE_SHARE_TRIP_TYPE_OPTIONS = [
  { value: "one-time", label: "One-time trip" },
  { value: "recurring", label: "Recurring trip" }
] as const satisfies StructuredFieldOption[];

const RIDE_SHARE_TIME_WINDOW_OPTIONS = [
  { value: "early-morning", label: "Early morning" },
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" }
] as const satisfies StructuredFieldOption[];

const RIDE_SHARE_SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "7-on-7-off", label: "7 on / 7 off" },
  { value: "14-on-7-off", label: "14 on / 7 off" },
  { value: "14-on-14-off", label: "14 on / 14 off" },
  { value: "custom", label: "Custom rotation" }
] as const satisfies StructuredFieldOption[];

const RIDE_SHARE_SITE_CAMP_OPTIONS = [
  { value: "cnrl-horizon", label: "CNRL Horizon" },
  { value: "suncor-base-plant", label: "Suncor Base Plant" },
  { value: "mildred-lake", label: "Mildred Lake" },
  { value: "albian", label: "Albian" },
  { value: "fort-hills", label: "Fort Hills" },
  { value: "syncrude", label: "Syncrude" },
  { value: "other", label: "Other site / camp" }
] as const satisfies StructuredFieldOption[];

const JOB_SHIFT_VALUES = JOB_SHIFT_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const JOB_WORK_SETUP_VALUES = JOB_WORK_SETUP_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const JOB_PAY_BAND_VALUES = JOB_PAY_BAND_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RENTAL_AVAILABILITY_VALUES = RENTAL_AVAILABILITY_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RENTAL_LEASE_PATTERN_VALUES = RENTAL_LEASE_PATTERN_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RENTAL_BEST_FOR_VALUES = RENTAL_BEST_FOR_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RENTAL_AREA_VALUES = RENTAL_AREA_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RENTAL_PARKING_VALUES = RENTAL_PARKING_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RIDE_SHARE_TRIP_TYPE_VALUES = RIDE_SHARE_TRIP_TYPE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RIDE_SHARE_TIME_WINDOW_VALUES = RIDE_SHARE_TIME_WINDOW_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RIDE_SHARE_SCHEDULE_VALUES = RIDE_SHARE_SCHEDULE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RIDE_SHARE_SITE_CAMP_VALUES = RIDE_SHARE_SITE_CAMP_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];
const RIDE_SHARE_AREA_VALUES = RIDE_SHARE_AREA_OPTIONS.map((option) => option.value) as [
  string,
  ...string[]
];

const STRUCTURED_FIELD_DEFINITIONS: Partial<Record<ListingCategory, StructuredFieldDefinition[]>> = {
  jobs: [
    {
      name: "shiftPattern",
      label: "Shift pattern",
      kind: "select",
      options: [...JOB_SHIFT_OPTIONS],
      showInFilters: true
    },
    {
      name: "workSetup",
      label: "Work setup",
      kind: "select",
      options: [...JOB_WORK_SETUP_OPTIONS],
      showInFilters: true
    },
    {
      name: "payBand",
      label: "Pay band",
      kind: "select",
      options: [...JOB_PAY_BAND_OPTIONS],
      showInFilters: true
    },
    {
      name: "ticketsRequired",
      label: "Tickets required",
      kind: "checkbox",
      helpText: "Use this when the role needs CSTS, H2S, Class 5, or similar tickets.",
      showInFilters: true
    }
  ],
  rentals: [
    {
      name: "rentalArea",
      label: "Area / neighbourhood",
      kind: "select",
      options: [...RENTAL_AREA_OPTIONS],
      helpText: "Help renters spot where the place sits in Fort McMurray or nearby RMWB communities.",
      showInFilters: true
    },
    {
      name: "availabilityType",
      label: "Availability",
      kind: "select",
      options: [...RENTAL_AVAILABILITY_OPTIONS],
      helpText: "Tell workers and short-term renters whether the place is ready now, date-based, or rotation-friendly.",
      showInFilters: true
    },
    {
      name: "availableFrom",
      label: "Available from",
      kind: "date"
    },
    {
      name: "availableTo",
      label: "Available to",
      kind: "date",
      helpText: "Leave empty if the rental is open-ended."
    },
    {
      name: "leasePattern",
      label: "Lease pattern",
      kind: "select",
      options: [...RENTAL_LEASE_PATTERN_OPTIONS],
      showInFilters: true
    },
    {
      name: "bestFor",
      label: "Best for",
      kind: "select",
      options: [...RENTAL_BEST_FOR_OPTIONS],
      showInFilters: true
    },
    {
      name: "nearbySite",
      label: "Nearby site / camp",
      kind: "select",
      options: [...RIDE_SHARE_SITE_CAMP_OPTIONS],
      helpText: "Optional. Useful when a rental mainly serves one worksite or camp corridor.",
      showInFilters: true
    },
    {
      name: "parkingType",
      label: "Parking",
      kind: "select",
      options: [...RENTAL_PARKING_OPTIONS],
      showInFilters: true
    },
    {
      name: "furnished",
      label: "Furnished",
      kind: "checkbox",
      showInFilters: true
    },
    {
      name: "utilitiesIncluded",
      label: "Utilities included",
      kind: "checkbox",
      showInFilters: true
    },
    {
      name: "shortTerm",
      label: "Short-term friendly",
      kind: "checkbox",
      showInFilters: true
    }
  ],
  "ride-share": [
    {
      name: "tripType",
      label: "Trip type",
      kind: "select",
      options: [...RIDE_SHARE_TRIP_TYPE_OPTIONS],
      helpText: "Use one-time for a single trip and recurring for rides that repeat around a shift or work pattern.",
      showInFilters: true
    },
    {
      name: "departureArea",
      label: "Departure area",
      kind: "select",
      options: [...RIDE_SHARE_AREA_OPTIONS],
      showInFilters: true
    },
    {
      name: "destinationArea",
      label: "Destination area",
      kind: "select",
      options: [...RIDE_SHARE_AREA_OPTIONS],
      showInFilters: true
    },
    {
      name: "tripDate",
      label: "Trip date",
      kind: "date",
      helpText: "Best for one-time rides that happen on a specific day.",
      showInFilters: true
    },
    {
      name: "pickupWindow",
      label: "Pickup window",
      kind: "select",
      options: [...RIDE_SHARE_TIME_WINDOW_OPTIONS],
      showInFilters: true
    },
    {
      name: "returnWindow",
      label: "Return window",
      kind: "select",
      options: [...RIDE_SHARE_TIME_WINDOW_OPTIONS],
      showInFilters: true
    },
    {
      name: "schedulePattern",
      label: "Schedule pattern",
      kind: "select",
      options: [...RIDE_SHARE_SCHEDULE_OPTIONS],
      showInFilters: true
    },
    {
      name: "siteCamp",
      label: "Site / camp",
      kind: "select",
      options: [...RIDE_SHARE_SITE_CAMP_OPTIONS],
      helpText: "Choose the main site or camp if this ride mainly serves shift workers.",
      showInFilters: true
    },
    {
      name: "startDate",
      label: "Start date",
      kind: "date",
      helpText: "Useful for recurring rides or ongoing shift coverage."
    },
    {
      name: "endDate",
      label: "End date",
      kind: "date",
      helpText: "Leave empty if the ride stays open-ended."
    },
    {
      name: "ongoing",
      label: "Ongoing schedule",
      kind: "checkbox",
      helpText: "Use this if the ride repeats and does not have a fixed end date.",
      showInFilters: true
    },
    {
      name: "seatsAvailable",
      label: "Seats available",
      kind: "number",
      helpText: "Share the number of open seats so riders know if the trip still fits.",
      showInFilters: false
    },
    {
      name: "toolSpace",
      label: "Room for tools or luggage",
      kind: "checkbox",
      showInFilters: true
    }
  ]
};

function toOptionalEnum(values: [string, ...string[]]) {
  return z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .refine((value) => value === null || values.includes(value), {
      message: "Choose a valid option."
    });
}

function toOptionalInteger(label: string, min = 1, max = 8) {
  return z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === null || (Number.isInteger(value) && value >= min && value <= max), {
      message: `${label} must be between ${min} and ${max}.`
    });
}

function toOptionalDateString() {
  return z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Choose a valid date."
    });
}

const jobsStructuredDataSchema = z.object({
  shiftPattern: toOptionalEnum(JOB_SHIFT_VALUES),
  workSetup: toOptionalEnum(JOB_WORK_SETUP_VALUES),
  payBand: toOptionalEnum(JOB_PAY_BAND_VALUES),
  ticketsRequired: z.boolean().default(false)
});

const rentalsStructuredDataSchema = z.object({
  rentalArea: toOptionalEnum(RENTAL_AREA_VALUES),
  availabilityType: toOptionalEnum(RENTAL_AVAILABILITY_VALUES),
  availableFrom: toOptionalDateString(),
  availableTo: toOptionalDateString(),
  leasePattern: toOptionalEnum(RENTAL_LEASE_PATTERN_VALUES),
  bestFor: toOptionalEnum(RENTAL_BEST_FOR_VALUES),
  nearbySite: toOptionalEnum(RIDE_SHARE_SITE_CAMP_VALUES),
  furnished: z.boolean().default(false),
  utilitiesIncluded: z.boolean().default(false),
  shortTerm: z.boolean().default(false),
  parkingType: toOptionalEnum(RENTAL_PARKING_VALUES)
});

const rideShareStructuredDataSchema = z.object({
  tripType: toOptionalEnum(RIDE_SHARE_TRIP_TYPE_VALUES),
  departureArea: toOptionalEnum(RIDE_SHARE_AREA_VALUES),
  destinationArea: toOptionalEnum(RIDE_SHARE_AREA_VALUES),
  tripDate: toOptionalDateString(),
  pickupWindow: toOptionalEnum(RIDE_SHARE_TIME_WINDOW_VALUES),
  returnWindow: toOptionalEnum(RIDE_SHARE_TIME_WINDOW_VALUES),
  schedulePattern: toOptionalEnum(RIDE_SHARE_SCHEDULE_VALUES),
  siteCamp: toOptionalEnum(RIDE_SHARE_SITE_CAMP_VALUES),
  startDate: toOptionalDateString(),
  endDate: toOptionalDateString(),
  ongoing: z.boolean().default(false),
  seatsAvailable: toOptionalInteger("Seats available"),
  toolSpace: z.boolean().default(false)
});

export function getStructuredFieldDefinitions(category?: ListingCategory | null) {
  return category ? STRUCTURED_FIELD_DEFINITIONS[category] ?? [] : [];
}

export function getStructuredFilterDefinitions(category?: ListingCategory | null) {
  return getStructuredFieldDefinitions(category).filter((field) => field.showInFilters);
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseBooleanFilterValue(value: unknown) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return null;
}

function getStructuredSchema(category: ListingCategory) {
  switch (category) {
    case "jobs":
      return jobsStructuredDataSchema;
    case "rentals":
      return rentalsStructuredDataSchema;
    case "ride-share":
      return rideShareStructuredDataSchema;
    default:
      return z.object({});
  }
}

function safeParseStructuredData(category: ListingCategory, structuredData?: ListingStructuredData | null) {
  return getStructuredSchema(category).safeParse(structuredData ?? {});
}

export function parseStructuredListingData(category: ListingCategory, formData: FormData) {
  switch (category) {
    case "jobs":
      return jobsStructuredDataSchema.safeParse({
        shiftPattern: getFormValue(formData, "shiftPattern"),
        workSetup: getFormValue(formData, "workSetup"),
        payBand: getFormValue(formData, "payBand"),
        ticketsRequired: formData.has("ticketsRequired")
      });
    case "rentals":
      return rentalsStructuredDataSchema.safeParse({
        rentalArea: getFormValue(formData, "rentalArea"),
        availabilityType: getFormValue(formData, "availabilityType"),
        availableFrom: getFormValue(formData, "availableFrom"),
        availableTo: getFormValue(formData, "availableTo"),
        leasePattern: getFormValue(formData, "leasePattern"),
        bestFor: getFormValue(formData, "bestFor"),
        nearbySite: getFormValue(formData, "nearbySite"),
        furnished: formData.has("furnished"),
        utilitiesIncluded: formData.has("utilitiesIncluded"),
        shortTerm: formData.has("shortTerm"),
        parkingType: getFormValue(formData, "parkingType")
      });
    case "ride-share":
      return rideShareStructuredDataSchema.safeParse({
        tripType: getFormValue(formData, "tripType"),
        departureArea: getFormValue(formData, "departureArea"),
        destinationArea: getFormValue(formData, "destinationArea"),
        tripDate: getFormValue(formData, "tripDate"),
        pickupWindow: getFormValue(formData, "pickupWindow"),
        returnWindow: getFormValue(formData, "returnWindow"),
        schedulePattern: getFormValue(formData, "schedulePattern"),
        siteCamp: getFormValue(formData, "siteCamp"),
        startDate: getFormValue(formData, "startDate"),
        endDate: getFormValue(formData, "endDate"),
        ongoing: formData.has("ongoing"),
        seatsAvailable: getFormValue(formData, "seatsAvailable"),
        toolSpace: formData.has("toolSpace")
      });
    default:
      return z.object({}).safeParse({});
  }
}

export function normalizeStructuredFilterValues(
  category: ListingCategory | null | undefined,
  filters?: Record<string, unknown> | null
) {
  if (!category || !filters) {
    return {} as StructuredFilterRecord;
  }

  const definitions = getStructuredFilterDefinitions(category);
  const normalizedEntries: Array<[string, string | boolean]> = [];

  for (const field of definitions) {
    const value = filters[field.name];

    if (field.kind === "checkbox") {
      const parsed = parseBooleanFilterValue(value);

      if (parsed !== null) {
        normalizedEntries.push([field.name, parsed]);
      }

      continue;
    }

    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      continue;
    }

    if (field.kind === "date") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        normalizedEntries.push([field.name, trimmed]);
      }
      continue;
    }

    if (field.kind === "number") {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        normalizedEntries.push([field.name, String(parsed)]);
      }
      continue;
    }

    if (field.options && !field.options.some((option) => option.value === trimmed)) {
      continue;
    }

    normalizedEntries.push([field.name, trimmed]);
  }

  return Object.fromEntries(normalizedEntries) as StructuredFilterRecord;
}

export function serializeStructuredFilterValue(value: string | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return typeof value === "boolean" ? String(value) : value;
}

export function applyStructuredListingFilters(
  query: any,
  category: ListingCategory | null | undefined,
  filters?: Record<string, unknown> | null
) {
  const normalized = normalizeStructuredFilterValues(category, filters);
  const entries = Object.entries(normalized);

  if (!entries.length) {
    return query;
  }

  let nextQuery = query;

  for (const [key, value] of entries) {
    nextQuery = nextQuery.contains("structured_data", { [key]: value });
  }

  return nextQuery;
}

export function getStructuredFilterSummaryItems(
  category: ListingCategory | null | undefined,
  filters?: Record<string, unknown> | null
) {
  if (!category || !filters) {
    return [] as string[];
  }

  const definitions = getStructuredFilterDefinitions(category);
  const normalized = normalizeStructuredFilterValues(category, filters);

  return definitions
    .map((field) => {
      const value = normalized[field.name];

      if (typeof value === "boolean") {
        return `${field.label}: ${booleanLabel(value)}`;
      }

      if (typeof value === "string") {
        return `${field.label}: ${optionLabel(field.options, value) ?? value}`;
      }

      return null;
    })
    .filter(Boolean) as string[];
}

function optionLabel(options: readonly StructuredFieldOption[] | undefined, value: string | null | undefined) {
  if (!value || !options) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function booleanLabel(value: boolean) {
  return value ? "Yes" : "No";
}

function dateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function getStructuredDetailItems(
  category: ListingCategory,
  structuredData?: ListingStructuredData | null
) {
  if (
    !structuredData ||
    (typeof structuredData === "object" && Object.keys(structuredData).length === 0)
  ) {
    return [] as string[];
  }

  switch (category) {
    case "jobs": {
      const data = getStructuredSchema(category).parse(structuredData) as JobListingStructuredData;
      const details = [
        optionLabel(JOB_SHIFT_OPTIONS, data.shiftPattern)
          ? `Shift pattern: ${optionLabel(JOB_SHIFT_OPTIONS, data.shiftPattern)}`
          : null,
        optionLabel(JOB_WORK_SETUP_OPTIONS, data.workSetup)
          ? `Work setup: ${optionLabel(JOB_WORK_SETUP_OPTIONS, data.workSetup)}`
          : null,
        optionLabel(JOB_PAY_BAND_OPTIONS, data.payBand)
          ? `Pay band: ${optionLabel(JOB_PAY_BAND_OPTIONS, data.payBand)}`
          : null,
        typeof data.ticketsRequired === "boolean"
          ? `Tickets required: ${booleanLabel(data.ticketsRequired)}`
          : null
      ];

      return details.filter(Boolean) as string[];
    }
    case "rentals": {
      const data = getStructuredSchema(category).parse(structuredData) as RentalListingStructuredData;
      const details = [
        optionLabel(RENTAL_AREA_OPTIONS, data.rentalArea)
          ? `Area: ${optionLabel(RENTAL_AREA_OPTIONS, data.rentalArea)}`
          : null,
        optionLabel(RENTAL_AVAILABILITY_OPTIONS, data.availabilityType)
          ? `Availability: ${optionLabel(RENTAL_AVAILABILITY_OPTIONS, data.availabilityType)}`
          : null,
        dateLabel(data.availableFrom) ? `Available from: ${dateLabel(data.availableFrom)}` : null,
        dateLabel(data.availableTo) ? `Available to: ${dateLabel(data.availableTo)}` : null,
        optionLabel(RENTAL_LEASE_PATTERN_OPTIONS, data.leasePattern)
          ? `Lease pattern: ${optionLabel(RENTAL_LEASE_PATTERN_OPTIONS, data.leasePattern)}`
          : null,
        optionLabel(RENTAL_BEST_FOR_OPTIONS, data.bestFor)
          ? `Best for: ${optionLabel(RENTAL_BEST_FOR_OPTIONS, data.bestFor)}`
          : null,
        optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.nearbySite)
          ? `Nearby site / camp: ${optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.nearbySite)}`
          : null,
        typeof data.furnished === "boolean" ? `Furnished: ${booleanLabel(data.furnished)}` : null,
        typeof data.utilitiesIncluded === "boolean"
          ? `Utilities included: ${booleanLabel(data.utilitiesIncluded)}`
          : null,
        typeof data.shortTerm === "boolean"
          ? `Short-term friendly: ${booleanLabel(data.shortTerm)}`
          : null,
        optionLabel(RENTAL_PARKING_OPTIONS, data.parkingType)
          ? `Parking: ${optionLabel(RENTAL_PARKING_OPTIONS, data.parkingType)}`
          : null
      ];

      return details.filter(Boolean) as string[];
    }
    case "ride-share": {
      const data = getStructuredSchema(category).parse(structuredData) as RideShareListingStructuredData;
      const details = [
        optionLabel(RIDE_SHARE_TRIP_TYPE_OPTIONS, data.tripType)
          ? `Trip type: ${optionLabel(RIDE_SHARE_TRIP_TYPE_OPTIONS, data.tripType)}`
          : null,
        optionLabel(RIDE_SHARE_AREA_OPTIONS, data.departureArea)
          ? `Departure: ${optionLabel(RIDE_SHARE_AREA_OPTIONS, data.departureArea)}`
          : null,
        optionLabel(RIDE_SHARE_AREA_OPTIONS, data.destinationArea)
          ? `Destination: ${optionLabel(RIDE_SHARE_AREA_OPTIONS, data.destinationArea)}`
          : null,
        dateLabel(data.tripDate) ? `Trip date: ${dateLabel(data.tripDate)}` : null,
        optionLabel(RIDE_SHARE_TIME_WINDOW_OPTIONS, data.pickupWindow)
          ? `Pickup window: ${optionLabel(RIDE_SHARE_TIME_WINDOW_OPTIONS, data.pickupWindow)}`
          : null,
        optionLabel(RIDE_SHARE_TIME_WINDOW_OPTIONS, data.returnWindow)
          ? `Return window: ${optionLabel(RIDE_SHARE_TIME_WINDOW_OPTIONS, data.returnWindow)}`
          : null,
        optionLabel(RIDE_SHARE_SCHEDULE_OPTIONS, data.schedulePattern)
          ? `Schedule: ${optionLabel(RIDE_SHARE_SCHEDULE_OPTIONS, data.schedulePattern)}`
          : null,
        optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.siteCamp)
          ? `Site / camp: ${optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.siteCamp)}`
          : null,
        dateLabel(data.startDate) ? `Start date: ${dateLabel(data.startDate)}` : null,
        dateLabel(data.endDate) ? `End date: ${dateLabel(data.endDate)}` : null,
        typeof data.ongoing === "boolean" ? `Ongoing: ${booleanLabel(data.ongoing)}` : null,
        typeof data.seatsAvailable === "number" ? `Seats available: ${data.seatsAvailable}` : null,
        typeof data.toolSpace === "boolean"
          ? `Room for tools or luggage: ${booleanLabel(data.toolSpace)}`
          : null
      ];

      return details.filter(Boolean) as string[];
    }
    default:
      return [] as string[];
  }
}

export function getStructuredCardHighlights(
  category: ListingCategory,
  structuredData?: ListingStructuredData | null
) {
  if (!structuredData) {
    return [] as string[];
  }

  switch (category) {
    case "rentals": {
      const data = rentalsStructuredDataSchema.safeParse(structuredData);

      if (!data.success) {
        return [] as string[];
      }

      const highlights = [
        optionLabel(RENTAL_AVAILABILITY_OPTIONS, data.data.availabilityType),
        dateLabel(data.data.availableFrom),
        optionLabel(RENTAL_LEASE_PATTERN_OPTIONS, data.data.leasePattern),
        optionLabel(RENTAL_BEST_FOR_OPTIONS, data.data.bestFor),
        optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.data.nearbySite),
        data.data.shortTerm ? "Short-term" : null
      ].filter(Boolean) as string[];

      return highlights.slice(0, 3);
    }
    case "ride-share": {
      const data = rideShareStructuredDataSchema.safeParse(structuredData);

      if (!data.success) {
        return [] as string[];
      }

      const highlights = [
        optionLabel(RIDE_SHARE_TRIP_TYPE_OPTIONS, data.data.tripType),
        dateLabel(data.data.tripDate),
        optionLabel(RIDE_SHARE_SCHEDULE_OPTIONS, data.data.schedulePattern),
        optionLabel(RIDE_SHARE_SITE_CAMP_OPTIONS, data.data.siteCamp),
        optionLabel(RIDE_SHARE_TIME_WINDOW_OPTIONS, data.data.pickupWindow),
        data.data.ongoing ? "Ongoing" : null
      ].filter(Boolean) as string[];

      return highlights.slice(0, 3);
    }
    default:
      return [] as string[];
  }
}

function getScheduleRelevantKeys(category: ListingCategory) {
  switch (category) {
    case "ride-share":
      return [
        "tripType",
        "tripDate",
        "pickupWindow",
        "returnWindow",
        "schedulePattern",
        "siteCamp",
        "ongoing"
      ] as const;
    case "rentals":
      return [
        "availabilityType",
        "availableFrom",
        "availableTo",
        "leasePattern",
        "bestFor",
        "nearbySite",
        "shortTerm"
      ] as const;
    default:
      return [] as const;
  }
}

function formatMatchValue(
  field: StructuredFieldDefinition | undefined,
  value: unknown
) {
  if (!field || value === null || value === undefined || value === "") {
    return null;
  }

  if (field.kind === "checkbox") {
    return value === true ? field.label : null;
  }

  if (field.kind === "date" && typeof value === "string") {
    return dateLabel(value);
  }

  if (typeof value === "string") {
    return optionLabel(field.options, value) ?? value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

export function getStructuredFilterMatchHints(
  category: ListingCategory,
  structuredData?: ListingStructuredData | null,
  filters?: Record<string, unknown> | null
) {
  const parsed = safeParseStructuredData(category, structuredData);

  if (!parsed.success) {
    return [] as string[];
  }

  const normalizedFilters = normalizeStructuredFilterValues(category, filters);
  const definitions = getStructuredFieldDefinitions(category);
  const relevantKeys = getScheduleRelevantKeys(category);
  const hints: string[] = [];

  for (const key of relevantKeys) {
    const filterValue = normalizedFilters[key];

    if (filterValue === undefined) {
      continue;
    }

    const listingValue = (parsed.data as Record<string, unknown>)[key];

    if (listingValue !== filterValue) {
      continue;
    }

    const field = definitions.find((item) => item.name === key);
    const label = formatMatchValue(field, listingValue);

    if (label) {
      hints.push(label);
    }
  }

  return hints.slice(0, 2);
}

export function getStructuredCrossListingMatchHints(
  category: ListingCategory,
  sourceStructuredData?: ListingStructuredData | null,
  targetStructuredData?: ListingStructuredData | null
) {
  const source = safeParseStructuredData(category, sourceStructuredData);
  const target = safeParseStructuredData(category, targetStructuredData);

  if (!source.success || !target.success) {
    return [] as string[];
  }

  const definitions = getStructuredFieldDefinitions(category);
  const relevantKeys = getScheduleRelevantKeys(category);
  const hints: string[] = [];

  for (const key of relevantKeys) {
    const sourceValue = (source.data as Record<string, unknown>)[key];
    const targetValue = (target.data as Record<string, unknown>)[key];

    if (
      sourceValue === null ||
      sourceValue === undefined ||
      sourceValue === "" ||
      targetValue === null ||
      targetValue === undefined ||
      targetValue === "" ||
      sourceValue !== targetValue
    ) {
      continue;
    }

    const field = definitions.find((item) => item.name === key);
    const label = formatMatchValue(field, targetValue);

    if (label) {
      hints.push(label);
    }
  }

  return hints.slice(0, 2);
}
