import { getGoogleServerGeocodingEnv, isGoogleServerGeocodingConfigured } from "@/lib/env";
import {
  getCommunityMapAreaFromText,
  resolveCommunityMapArea,
  type CommunityMapArea
} from "@/lib/local-marketplace";
import type { ListingCategory } from "@/types/database";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  formatted_address: string;
  address_components: GoogleAddressComponent[];
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
};

type GoogleGeocodeResponse = {
  results?: GoogleGeocodeResult[];
  status?: string;
  error_message?: string;
};

export type PersistedGeocode = {
  lat: number;
  lng: number;
  area: CommunityMapArea | null;
  formattedAddress: string | null;
};

function isFortMcmurrayScopedAddress(address: string) {
  return Boolean(
    getCommunityMapAreaFromText(address, { includeCamp: true }) ||
      /\bfort\s*mcmurray\b|\bfort\s*mac\b|\balberta\b|\bcanada\b/i.test(address)
  );
}

function buildAddressQuery(address: string) {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  if (isFortMcmurrayScopedAddress(trimmed)) {
    return trimmed;
  }

  return `${trimmed}, Fort McMurray, Alberta, Canada`;
}

function getComponentStrings(components: GoogleAddressComponent[]) {
  return components.flatMap((component) => [component.long_name, component.short_name]).filter(Boolean);
}

function inferAreaFromGoogleResults(
  results: GoogleGeocodeResult[],
  options?: { includeCamp?: boolean }
): CommunityMapArea | null {
  const candidateTexts: string[] = [];

  for (const result of results) {
    candidateTexts.push(result.formatted_address);

    const componentPriority = [
      "neighborhood",
      "sublocality",
      "sublocality_level_1",
      "locality",
      "administrative_area_level_3",
      "route"
    ];

    for (const type of componentPriority) {
      const matchingComponents = result.address_components
        .filter((component) => component.types.includes(type))
        .flatMap((component) => [component.long_name, component.short_name]);

      candidateTexts.push(...matchingComponents);
    }

    candidateTexts.push(...getComponentStrings(result.address_components));
  }

  for (const candidateText of candidateTexts) {
    const resolvedArea = getCommunityMapAreaFromText(candidateText, options);
    if (resolvedArea) {
      return resolvedArea;
    }
  }

  return null;
}

async function fetchGoogleGeocoding(params: URLSearchParams) {
  const { googleMapsServerApiKey } = getGoogleServerGeocodingEnv();
  params.set("key", googleMapsServerApiKey);
  params.set("region", "ca");

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Google Geocoding API returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;

  if (payload.status !== "OK" || !payload.results?.length) {
    if (payload.status === "ZERO_RESULTS") {
      return [];
    }

    throw new Error(
      payload.error_message || `Google Geocoding API returned ${payload.status ?? "UNKNOWN_ERROR"}.`
    );
  }

  return payload.results;
}

async function reverseGeocodeCommunity(lat: number, lng: number, includeCamp: boolean) {
  const reverseParams = new URLSearchParams({
    latlng: `${lat},${lng}`,
    result_type: "neighborhood|sublocality|locality|administrative_area_level_3"
  });

  try {
    const reverseResults = await fetchGoogleGeocoding(reverseParams);
    return inferAreaFromGoogleResults(reverseResults, { includeCamp });
  } catch (error) {
    console.warn("Reverse geocoding community lookup failed:", error);
    return null;
  }
}

function normalizeLatLng(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(6));
}

export async function geocodeMarketplaceAddress(
  address: string | null | undefined,
  options?: { category?: ListingCategory; includeCamp?: boolean }
): Promise<PersistedGeocode | null> {
  const query = buildAddressQuery(address ?? "");

  if (!query || !isGoogleServerGeocodingConfigured()) {
    return null;
  }

  const includeCamp = options?.includeCamp ?? options?.category === "jobs";

  try {
    const forwardResults = await fetchGoogleGeocoding(
      new URLSearchParams({
        address: query,
        components: "country:CA|administrative_area:AB"
      })
    );

    const primaryResult = forwardResults[0];
    const location = primaryResult?.geometry?.location;

    if (!location) {
      return null;
    }

    const lat = normalizeLatLng(location.lat);
    const lng = normalizeLatLng(location.lng);

    if (lat === null || lng === null) {
      return null;
    }

    const reverseArea = await reverseGeocodeCommunity(lat, lng, includeCamp);
    const fallbackArea = inferAreaFromGoogleResults(forwardResults, { includeCamp });
    const resolvedArea = resolveCommunityMapArea(reverseArea ?? fallbackArea ?? null) ?? reverseArea ?? fallbackArea;

    return {
      lat,
      lng,
      area: resolvedArea ?? null,
      formattedAddress: primaryResult.formatted_address ?? null
    };
  } catch (error) {
    console.warn("Marketplace geocoding failed:", error);
    return null;
  }
}
