export interface BusinessProfileFields {
  full_name: string | null;
  is_business: boolean;
  business_name: string | null;
  business_description: string | null;
  business_logo_url: string | null;
  business_website: string | null;
  service_areas: string[];
}

export const EMPTY_BUSINESS_PROFILE: BusinessProfileFields = {
  full_name: null,
  is_business: false,
  business_name: null,
  business_description: null,
  business_logo_url: null,
  business_website: null,
  service_areas: []
};

export function isBusinessProfileSchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    message.includes("is_business") ||
    message.includes("business_name") ||
    message.includes("business_description") ||
    message.includes("business_logo_url") ||
    message.includes("business_website") ||
    message.includes("service_areas")
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

export function normalizeBusinessWebsite(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeBusinessProfileRow(row: any): BusinessProfileFields {
  return {
    full_name: row?.full_name ?? null,
    is_business: Boolean(row?.is_business),
    business_name: row?.business_name?.trim() || null,
    business_description: row?.business_description?.trim() || null,
    business_logo_url: row?.business_logo_url?.trim() || null,
    business_website: normalizeBusinessWebsite(row?.business_website ?? null),
    service_areas: normalizeServiceAreas(row?.service_areas)
  };
}
