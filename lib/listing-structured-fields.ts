import { z } from "zod";

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
  kind: "select" | "checkbox" | "number";
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

const RENTAL_PARKING_OPTIONS = [
  { value: "none", label: "No parking" },
  { value: "street", label: "Street parking" },
  { value: "stall", label: "Stall / driveway" },
  { value: "truck", label: "Truck-friendly parking" }
] as const satisfies StructuredFieldOption[];

const RIDE_SHARE_AREA_OPTIONS = [
  { value: "downtown", label: "Downtown" },
  { value: "thickwood", label: "Thickwood" },
  { value: "timberlea", label: "Timberlea" },
  { value: "gregoire", label: "Gregoire" },
  { value: "airport", label: "Airport" },
  { value: "site-camp", label: "Site / camp" },
  { value: "edmonton", label: "Edmonton" },
  { value: "calgary", label: "Calgary" }
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
const RENTAL_PARKING_VALUES = RENTAL_PARKING_OPTIONS.map((option) => option.value) as [
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
    },
    {
      name: "parkingType",
      label: "Parking",
      kind: "select",
      options: [...RENTAL_PARKING_OPTIONS],
      showInFilters: true
    }
  ],
  "ride-share": [
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

const jobsStructuredDataSchema = z.object({
  shiftPattern: toOptionalEnum(JOB_SHIFT_VALUES),
  workSetup: toOptionalEnum(JOB_WORK_SETUP_VALUES),
  payBand: toOptionalEnum(JOB_PAY_BAND_VALUES),
  ticketsRequired: z.boolean().default(false)
});

const rentalsStructuredDataSchema = z.object({
  furnished: z.boolean().default(false),
  utilitiesIncluded: z.boolean().default(false),
  shortTerm: z.boolean().default(false),
  parkingType: toOptionalEnum(RENTAL_PARKING_VALUES)
});

const rideShareStructuredDataSchema = z.object({
  departureArea: toOptionalEnum(RIDE_SHARE_AREA_VALUES),
  destinationArea: toOptionalEnum(RIDE_SHARE_AREA_VALUES),
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
        furnished: formData.has("furnished"),
        utilitiesIncluded: formData.has("utilitiesIncluded"),
        shortTerm: formData.has("shortTerm"),
        parkingType: getFormValue(formData, "parkingType")
      });
    case "ride-share":
      return rideShareStructuredDataSchema.safeParse({
        departureArea: getFormValue(formData, "departureArea"),
        destinationArea: getFormValue(formData, "destinationArea"),
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
        optionLabel(RIDE_SHARE_AREA_OPTIONS, data.departureArea)
          ? `Departure: ${optionLabel(RIDE_SHARE_AREA_OPTIONS, data.departureArea)}`
          : null,
        optionLabel(RIDE_SHARE_AREA_OPTIONS, data.destinationArea)
          ? `Destination: ${optionLabel(RIDE_SHARE_AREA_OPTIONS, data.destinationArea)}`
          : null,
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
