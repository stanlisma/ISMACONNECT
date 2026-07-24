import type { BusinessDayKey, BusinessHours } from "@/types/database";

export interface BusinessProfileFields {
  full_name: string | null;
  phone: string | null;
  is_business: boolean;
  business_name: string | null;
  business_description: string | null;
  business_logo_url: string | null;
  business_website: string | null;
  business_address: string | null;
  show_exact_business_location: boolean;
  business_geocoded_lat: number | null;
  business_geocoded_lng: number | null;
  business_geocoded_area: string | null;
  business_geocoded_formatted_address: string | null;
  business_geocoded_at: string | null;
  service_areas: string[];
  business_services: string[];
  business_hours: BusinessHours;
}

export const EMPTY_BUSINESS_PROFILE: BusinessProfileFields = {
  full_name: null,
  phone: null,
  is_business: false,
  business_name: null,
  business_description: null,
  business_logo_url: null,
  business_website: null,
  business_address: null,
  show_exact_business_location: false,
  business_geocoded_lat: null,
  business_geocoded_lng: null,
  business_geocoded_area: null,
  business_geocoded_formatted_address: null,
  business_geocoded_at: null,
  service_areas: [],
  business_services: [],
  business_hours: {}
};

export const BUSINESS_DAY_ORDER: ReadonlyArray<{ key: BusinessDayKey; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" }
];

export function isBusinessProfileSchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
} | null | undefined) {
  if (error?.code === "42703") {
    return true;
  }

  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    /column .*does not exist/.test(message) ||
    message.includes("is_business") ||
    message.includes("business_name") ||
    message.includes("business_description") ||
    message.includes("business_logo_url") ||
    message.includes("business_website") ||
    message.includes("business_address") ||
    message.includes("show_exact_business_location") ||
    message.includes("business_geocoded_lat") ||
    message.includes("business_geocoded_lng") ||
    message.includes("business_geocoded_area") ||
    message.includes("business_geocoded_formatted_address") ||
    message.includes("business_geocoded_at") ||
    message.includes("service_areas") ||
    message.includes("business_services") ||
    message.includes("business_hours") ||
    message.includes("phone")
  );
}

export function normalizeServiceAreas(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function parseServiceAreasInput(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function normalizeBusinessServices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function parseBusinessServicesInput(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function normalizeBusinessWebsite(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeBusinessAddress(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeBusinessHoursDay(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const maybeDay = value as Record<string, unknown>;
  const open = typeof maybeDay.open === "string" && maybeDay.open.trim() ? maybeDay.open.trim() : null;
  const close = typeof maybeDay.close === "string" && maybeDay.close.trim() ? maybeDay.close.trim() : null;
  const closed = Boolean(maybeDay.closed);

  if (closed) {
    return { closed: true };
  }

  if (open && close) {
    return { open, close };
  }

  return {};
}

export function normalizeBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== "object") {
    return {};
  }

  const hours = value as Record<string, unknown>;
  return BUSINESS_DAY_ORDER.reduce<BusinessHours>((accumulator, { key }) => {
    const normalizedDay = normalizeBusinessHoursDay(hours[key]);

    if (Object.keys(normalizedDay).length) {
      accumulator[key] = normalizedDay;
    }

    return accumulator;
  }, {});
}

export function parseBusinessHoursFormData(formData: FormData): BusinessHours {
  return BUSINESS_DAY_ORDER.reduce<BusinessHours>((accumulator, { key }) => {
    const closed = formData.get(`business_hours_${key}_closed`) === "on";
    const open = String(formData.get(`business_hours_${key}_open`) ?? "").trim();
    const close = String(formData.get(`business_hours_${key}_close`) ?? "").trim();

    if (closed) {
      accumulator[key] = { closed: true };
      return accumulator;
    }

    if (open && close) {
      accumulator[key] = { open, close };
    }

    return accumulator;
  }, {});
}

export function hasConfiguredBusinessHours(hours: BusinessHours | null | undefined) {
  return BUSINESS_DAY_ORDER.some(({ key }) => {
    const day = hours?.[key];
    return Boolean(day?.closed || (day?.open && day?.close));
  });
}

export function formatBusinessTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [hourText = "0", minuteText = "00"] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = String(minute).padStart(2, "0");

  return `${displayHour}:${displayMinute} ${period}`;
}

export function getBusinessHoursRows(hours: BusinessHours | null | undefined) {
  return BUSINESS_DAY_ORDER.map(({ key, label }) => {
    const day = hours?.[key];

    if (day?.closed) {
      return {
        dayKey: key,
        label,
        closed: true,
        range: "Closed"
      };
    }

    if (day?.open && day?.close) {
      return {
        dayKey: key,
        label,
        closed: false,
        range: `${formatBusinessTime(day.open)} - ${formatBusinessTime(day.close)}`
      };
    }

    return {
      dayKey: key,
      label,
      closed: false,
      range: "By appointment"
    };
  });
}

const WEEKDAY_PARTS_TO_KEY: Record<string, BusinessDayKey> = {
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
  sun: "sun"
};

function getCurrentEdmontonDayAndMinutes(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value?.toLowerCase().slice(0, 3) ?? "mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    dayKey: WEEKDAY_PARTS_TO_KEY[weekday] ?? "mon",
    minutes: hour * 60 + minute
  };
}

function toMinutes(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

export function getBusinessHoursStatus(hours: BusinessHours | null | undefined, now = new Date()) {
  if (!hasConfiguredBusinessHours(hours)) {
    return null;
  }

  const { dayKey, minutes } = getCurrentEdmontonDayAndMinutes(now);
  const day = hours?.[dayKey];

  if (!day || (!day.closed && !day.open && !day.close)) {
    return {
      label: "Hours on request",
      isOpen: false
    };
  }

  if (day.closed) {
    return {
      label: "Closed today",
      isOpen: false
    };
  }

  const openMinutes = toMinutes(day.open);
  const closeMinutes = toMinutes(day.close);

  if (openMinutes === null || closeMinutes === null) {
    return {
      label: "Hours on request",
      isOpen: false
    };
  }

  const isOpen = minutes >= openMinutes && minutes <= closeMinutes;
  return {
    label: isOpen
      ? `Open now · until ${formatBusinessTime(day.close)}`
      : `Closed now · opens ${formatBusinessTime(day.open)}`,
    isOpen
  };
}

export function normalizeBusinessProfileRow(row: any): BusinessProfileFields {
  return {
    full_name: row?.full_name ?? null,
    phone: row?.phone?.trim?.() || null,
    is_business: Boolean(row?.is_business),
    business_name: row?.business_name?.trim() || null,
    business_description: row?.business_description?.trim() || null,
    business_logo_url: row?.business_logo_url?.trim() || null,
    business_website: normalizeBusinessWebsite(row?.business_website ?? null),
    business_address: normalizeBusinessAddress(row?.business_address ?? null),
    show_exact_business_location: Boolean(row?.show_exact_business_location),
    business_geocoded_lat: typeof row?.business_geocoded_lat === "number" ? row.business_geocoded_lat : null,
    business_geocoded_lng: typeof row?.business_geocoded_lng === "number" ? row.business_geocoded_lng : null,
    business_geocoded_area: row?.business_geocoded_area?.trim?.() || null,
    business_geocoded_formatted_address: row?.business_geocoded_formatted_address?.trim?.() || null,
    business_geocoded_at: row?.business_geocoded_at ?? null,
    service_areas: normalizeServiceAreas(row?.service_areas),
    business_services: normalizeBusinessServices(row?.business_services),
    business_hours: normalizeBusinessHours(row?.business_hours)
  };
}
