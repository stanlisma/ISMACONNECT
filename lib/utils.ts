import {
  CATEGORY_MAP,
  DEFAULT_LOCATION,
  LISTING_INTENT_LABELS,
  LISTING_PRICE_TYPE_LABELS,
  REQUEST_WINDOW_LABELS
} from "@/lib/constants";
import type {
  ListingCategory,
  ListingIntent,
  ListingPriceType,
  RequestWindow
} from "@/types/database";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPhoneNumber(rawValue: string) {
  let digits = rawValue.replace(/\D/g, "");

  if (digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length === 0) {
    return "";
  }

  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);

  if (digits.length < 4) {
    return `1 (${area}`;
  }

  if (digits.length < 7) {
    return `1 (${area}) ${prefix}`;
  }

  return `1 (${area}) ${prefix}-${line}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Contact for price";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function formatListingPrice(
  value: number | null,
  priceType: ListingPriceType | null | undefined,
  intent?: ListingIntent
) {
  const resolvedPriceType = priceType ?? "flat-rate";
  const budgetPrefix = intent === "need" ? "Budget " : "";

  if (resolvedPriceType === "contact" || value === null || Number.isNaN(value)) {
    return intent === "need" ? "Budget on request" : "Contact for price";
  }

  if (value === 0) {
    return "Free";
  }

  const amount = formatCurrency(value);

  switch (resolvedPriceType) {
    case "hourly":
      return `${budgetPrefix}${amount} / hr`;
    case "per-trip":
      return `${budgetPrefix}${amount} / trip`;
    case "per-day":
      return `${budgetPrefix}${amount} / day`;
    case "per-week":
      return `${budgetPrefix}${amount} / week`;
    case "per-month":
      return `${budgetPrefix}${amount} / month`;
    case "flat-rate":
    default:
      return `${budgetPrefix}${amount}${intent === "need" ? "" : " flat rate"}`;
  }
}

export function getListingPriceTypeLabel(priceType: ListingPriceType | null | undefined) {
  return LISTING_PRICE_TYPE_LABELS[priceType ?? "flat-rate"];
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Edmonton"
  }).format(new Date(value));
}

export function excerpt(value: string, length = 140) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trimEnd()}...`;
}

export function resolveCategory(value?: string | null): ListingCategory | undefined {
  if (!value) {
    return undefined;
  }

  return value in CATEGORY_MAP ? (value as ListingCategory) : undefined;
}

export function resolveListingIntent(value?: string | null): ListingIntent | undefined {
  if (!value) {
    return undefined;
  }

  return value in LISTING_INTENT_LABELS ? (value as ListingIntent) : undefined;
}

export function resolveRequestWindow(value?: string | null): RequestWindow | undefined {
  if (!value) {
    return undefined;
  }

  return value in REQUEST_WINDOW_LABELS ? (value as RequestWindow) : undefined;
}

export function getCategoryLabel(value: ListingCategory) {
  return CATEGORY_MAP[value].label;
}

export function getCategoryHref(value: ListingCategory) {
  return CATEGORY_MAP[value].href;
}

export function getLocationOrDefault(value?: string | null) {
  return value?.trim() || DEFAULT_LOCATION;
}

export function firstMessage(error: { issues?: Array<{ message: string }> }) {
  return error.issues?.[0]?.message || "Something went wrong. Please try again.";
}

export function getSingleParam(
  value?: string | string[] | null
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}

export function getPositiveIntParam(
  value?: string | string[] | null,
  fallback = 1
) {
  const singleValue = getSingleParam(value);

  if (!singleValue) {
    return fallback;
  }

  const parsed = Number(singleValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function buildPathWithQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}
