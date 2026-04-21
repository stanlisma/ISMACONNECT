import { CATEGORY_MAP, DEFAULT_LOCATION } from "@/lib/constants";
import type { ListingCategory } from "@/types/database";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
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

