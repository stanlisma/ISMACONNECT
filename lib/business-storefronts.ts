import {
  normalizeBusinessAddress,
  normalizeBusinessHours,
  normalizeBusinessServices,
  normalizeBusinessWebsite,
  parseBusinessHoursFormData,
  normalizeServiceAreas,
  parseBusinessServicesInput,
  parseServiceAreasInput
} from "@/lib/business-profile";
import { slugify } from "@/lib/utils";
import type { AdditionalBusinessStorefront, BusinessHours } from "@/types/database";

export const MAX_STOREFRONT_IMAGE_COUNT = 8;

export function isAdditionalStorefrontSchemaError(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    message.includes("business_storefronts") ||
    message.includes("storefront_id") ||
    message.includes("show_exact_location") ||
    message.includes("geocoded_lat") ||
    message.includes("geocoded_lng") ||
    message.includes("geocoded_area") ||
    message.includes("geocoded_formatted_address") ||
    message.includes("service_areas") ||
    message.includes("services") ||
    message.includes("hours") ||
    message.includes("image_urls") ||
    message.includes("claimed")
  );
}

function normalizeStorefrontImageUrls(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  ).slice(0, MAX_STOREFRONT_IMAGE_COUNT);
}

export function normalizeAdditionalStorefrontRow(row: any): AdditionalBusinessStorefront {
  return {
    id: String(row?.id ?? ""),
    owner_id: String(row?.owner_id ?? ""),
    claimed: row?.claimed === false ? false : true,
    slug: typeof row?.slug === "string" ? row.slug : "",
    name: typeof row?.name === "string" ? row.name.trim() : "",
    description: typeof row?.description === "string" && row.description.trim() ? row.description.trim() : null,
    logo_url: typeof row?.logo_url === "string" && row.logo_url.trim() ? row.logo_url.trim() : null,
    image_urls: normalizeStorefrontImageUrls(row?.image_urls),
    website: normalizeBusinessWebsite(row?.website ?? null),
    phone: typeof row?.phone === "string" && row.phone.trim() ? row.phone.trim() : null,
    address: normalizeBusinessAddress(row?.address ?? null),
    show_exact_location: Boolean(row?.show_exact_location),
    geocoded_lat: typeof row?.geocoded_lat === "number" ? row.geocoded_lat : null,
    geocoded_lng: typeof row?.geocoded_lng === "number" ? row.geocoded_lng : null,
    geocoded_area: typeof row?.geocoded_area === "string" && row.geocoded_area.trim() ? row.geocoded_area.trim() : null,
    geocoded_formatted_address:
      typeof row?.geocoded_formatted_address === "string" && row.geocoded_formatted_address.trim()
        ? row.geocoded_formatted_address.trim()
        : null,
    geocoded_at: typeof row?.geocoded_at === "string" ? row.geocoded_at : null,
    service_areas: normalizeServiceAreas(row?.service_areas),
    services: normalizeBusinessServices(row?.services),
    hours: normalizeBusinessHours(row?.hours),
    created_at: typeof row?.created_at === "string" ? row.created_at : "",
    updated_at: typeof row?.updated_at === "string" ? row.updated_at : ""
  };
}

export function buildStorefrontHref(sellerId: string, storefrontId?: string | null) {
  return storefrontId ? `/sellers/${sellerId}?storefront=${storefrontId}` : `/sellers/${sellerId}`;
}

export function buildStorefrontSlug(name: string) {
  return slugify(name) || "storefront";
}

export function parseAdditionalStorefrontFormData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const logoUrl = String(formData.get("logo_url") ?? "").trim() || null;
  const imageUrls = Array.from(
    new Set(
      formData
        .getAll("image_urls")
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    )
  ).slice(0, MAX_STOREFRONT_IMAGE_COUNT);
  const website = normalizeBusinessWebsite(String(formData.get("website") ?? ""));
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = normalizeBusinessAddress(String(formData.get("address") ?? ""));
  const showExactLocation = formData.get("show_exact_location") === "on";
  const serviceAreas = parseServiceAreasInput(String(formData.get("service_areas") ?? ""));
  const services = parseBusinessServicesInput(String(formData.get("services") ?? ""));
  const hours = parseBusinessHoursFormData(formData);

  return {
    name,
    description,
    logoUrl,
    imageUrls,
    website,
    phone,
    address,
    showExactLocation,
    serviceAreas,
    services,
    hours
  };
}

export function getAdditionalStorefrontHoursFromPrimary(hours: BusinessHours | null | undefined) {
  return normalizeBusinessHours(hours);
}
