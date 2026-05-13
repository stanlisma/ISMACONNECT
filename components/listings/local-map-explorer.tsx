"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, MapPinned, RotateCcw, Route } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  type CommunityMapArea,
  getCommunityMapAreaDefinition,
  getCommunityMapAreaFromText,
  getCommunityListingMapPoint,
  getPublicListingLocationLabel,
  getRentalListingMapPoint,
  getRideShareRouteCounts,
  getRideShareRouteMapPoints,
  resolveCommunityMapArea,
  shouldShowExactListingAddressOnMap
} from "@/lib/local-marketplace";
import { buildPathWithQuery } from "@/lib/utils";
import type { BusinessMapProfile, Listing, ListingCategory } from "@/types/database";

type LocalMapExplorerProps = {
  category: ListingCategory;
  listings: Listing[];
  businessMapProfiles?: Record<string, BusinessMapProfile>;
  actionPath: string;
  search?: string;
  subcategory?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  structuredFilters?: Record<string, unknown>;
};

type RideShareEndpointSummary = ReturnType<typeof getRideShareRouteCounts>["endpoints"][number];
type RideShareRouteSummary = ReturnType<typeof getRideShareRouteCounts>["routes"][number];
type CommunityAreaSummary = {
  value: CommunityMapArea;
  label: string;
  lat: number;
  lng: number;
  count: number;
};
type GoogleMapsConfig = {
  apiKey: string;
  mapId?: string | null;
};

type GoogleMapsNamespace = any;
type GoogleMapInstance = any;
type GoogleMarkerInstance = any;
type GooglePolylineInstance = any;
type GoogleInfoWindowInstance = any;
type LatLngLike = { lat: number; lng: number };
type CommunityListingPoint = {
  listing: Listing;
  ownerId: string;
  area: CommunityMapArea;
  areaLabel: string;
  lat: number;
  lng: number;
  businessName: string | null;
  businessAddress: string | null;
  exactAddress: string | null;
  exactLat: number | null;
  exactLng: number | null;
};
type RideShareListingPoint = ReturnType<typeof getRideShareRouteMapPoints> & { listing: Listing };
type ExactAddressMapPoint = {
  key: string;
  ownerId: string;
  businessName: string | null;
  exactAddress: string;
  lat: number;
  lng: number;
  area: string;
  areaLabel: string;
  listings: Listing[];
  representativeListing: Listing;
};
type ExactAddressCandidate = Omit<ExactAddressMapPoint, "lat" | "lng"> & {
  lat: number | null;
  lng: number | null;
};

const EMBEDDED_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
const EMBEDDED_GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() || undefined;
const GOOGLE_MAPS_CALLBACK = "__ismaconnectGoogleMapsInit";
const FORT_MCMURRAY_CENTER = { lat: 56.7269, lng: -111.3806 };
const ALBERTA_CENTER = { lat: 54.9, lng: -112.6 };

let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null;

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    gm_authFailure?: () => void;
    [GOOGLE_MAPS_CALLBACK]?: () => void;
  }
}

function toStringFilterRecord(filters?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).map(([key, value]) => [key, typeof value === "boolean" ? String(value) : value])
  ) as Record<string, string | undefined>;
}

function loadGoogleMapsApi(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="ismaconnect"]');

    window[GOOGLE_MAPS_CALLBACK] = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        googleMapsPromise = null;
        reject(new Error("Google Maps loaded without a usable maps namespace."));
      }
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "ismaconnect";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=${GOOGLE_MAPS_CALLBACK}`;
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Failed to load Google Maps JavaScript API."));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function buildMapOptions(center: LatLngLike, zoom: number, mapId?: string) {
  return {
    center,
    zoom,
    mapId,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: "greedy" as const
  };
}

function useGoogleMapsConfig() {
  const [config, setConfig] = useState<GoogleMapsConfig | null>(() =>
    EMBEDDED_GOOGLE_MAPS_API_KEY
      ? {
          apiKey: EMBEDDED_GOOGLE_MAPS_API_KEY,
          mapId: EMBEDDED_GOOGLE_MAP_ID
        }
      : null
  );
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">(
    EMBEDDED_GOOGLE_MAPS_API_KEY ? "ready" : "loading"
  );

  useEffect(() => {
    if (EMBEDDED_GOOGLE_MAPS_API_KEY) {
      return;
    }

    let cancelled = false;

    async function loadRuntimeConfig() {
      try {
        const response = await fetch("/api/maps/config", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load runtime Google Maps config.");
        }

        const payload = (await response.json()) as {
          configured?: boolean;
          apiKey?: string | null;
          mapId?: string | null;
        };

        if (cancelled) {
          return;
        }

        if (payload.configured && payload.apiKey) {
          setConfig({
            apiKey: payload.apiKey,
            mapId: payload.mapId ?? undefined
          });
          setStatus("ready");
          return;
        }

        setStatus("missing-key");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadRuntimeConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, status };
}

function useGoogleMapsAuthFailure() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setFailed(true);
      if (typeof previous === "function") {
        previous();
      }
    };

    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  return failed;
}

function createCircleMarkerIcon(
  googleMaps: GoogleMapsNamespace,
  count: number,
  isActive: boolean
) {
  return {
    path: googleMaps.SymbolPath.CIRCLE,
    scale: Math.min(23, isActive ? 11 + count * 1.05 : 9 + count * 0.9),
    fillColor: isActive ? "#1549B7" : "#1E5FE0",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: isActive ? 2.6 : 2.1
  };
}

function formatCompactPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) {
    return "View";
  }

  if (price >= 1000) {
    return `$${(price / 1000).toFixed(price >= 10000 ? 0 : 1).replace(".0", "")}k`;
  }

  return `$${Math.round(price)}`;
}

function createPillMarkerIcon(
  googleMaps: GoogleMapsNamespace,
  label: string,
  isActive: boolean,
  tone: "primary" | "dark" = "primary"
) {
  const safeLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fill = tone === "dark" ? (isActive ? "#0F2C52" : "#15365B") : isActive ? "#1549B7" : "#1E5FE0";
  const stroke = isActive ? "#BFD8FF" : "#FFFFFF";
  const textColor = "#FFFFFF";
  const width = Math.max(74, Math.min(132, 28 + safeLabel.length * 7));
  const height = 34;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" fill="${textColor}">${safeLabel}</text>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new googleMaps.Size(width, height),
    anchor: new googleMaps.Point(width / 2, height / 2)
  };
}

function buildBusinessMarkerLabel(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) {
    return "Business";
  }

  return trimmed.length > 14 ? `${trimmed.slice(0, 13).trimEnd()}...` : trimmed;
}

function buildExactAddressMarkerLabel(point: ExactAddressMapPoint) {
  if (point.businessName) {
    return buildBusinessMarkerLabel(point.businessName);
  }

  if (point.listings.length > 1) {
    return `${point.listings.length} listings`;
  }

  return formatCompactPrice(point.representativeListing.price);
}

function buildFallbackGeocodeQuery(address: string) {
  return /fort\s*mcmurray|alberta|canada/i.test(address)
    ? address
    : `${address}, Fort McMurray, Alberta, Canada`;
}

async function geocodeAddressFallback(geocoder: any, address: string): Promise<LatLngLike | null> {
  return new Promise<LatLngLike | null>((resolve) => {
    geocoder.geocode({ address: buildFallbackGeocodeQuery(address) }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.length) {
        resolve(null);
        return;
      }

      const location = results[0]?.geometry?.location;
      if (!location) {
        resolve(null);
        return;
      }

      resolve({
        lat: location.lat(),
        lng: location.lng()
      });
    });
  });
}

function createInfoContent(title: string, body: string, caption?: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "local-map-info-card";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const copy = document.createElement("p");
  copy.textContent = body;

  wrapper.append(heading, copy);

  if (caption) {
    const meta = document.createElement("p");
    meta.textContent = caption;
    wrapper.append(meta);
  }

  return wrapper;
}

function fitMapToPoints(
  googleMaps: GoogleMapsNamespace,
  map: GoogleMapInstance,
  points: LatLngLike[],
  fallbackCenter: LatLngLike,
  fallbackZoom: number
) {
  if (!points.length) {
    map.setCenter(fallbackCenter);
    map.setZoom(fallbackZoom);
    return;
  }

  if (points.length === 1) {
    map.setCenter(points[0]);
    map.setZoom(fallbackZoom);
    return;
  }

  const bounds = new googleMaps.LatLngBounds();
  points.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, 48);
}

function clearMapSurface(root: HTMLDivElement | null) {
  if (root) {
    root.innerHTML = "";
  }
}

function watchMapUntilReady(
  googleMaps: GoogleMapsNamespace,
  map: GoogleMapInstance,
  onReady: () => void,
  onError: () => void
) {
  let settled = false;
  const listeners: Array<{ remove?: () => void }> = [];

  const finalize = (callback: () => void) => {
    if (settled) {
      return;
    }

    settled = true;
    window.clearTimeout(timeoutId);

    listeners.forEach((listener) => {
      if (typeof listener.remove === "function") {
        listener.remove();
      } else if (googleMaps.event?.removeListener) {
        googleMaps.event.removeListener(listener);
      }
    });

    callback();
  };

  listeners.push(
    googleMaps.event.addListenerOnce(map, "tilesloaded", () => finalize(onReady)),
    googleMaps.event.addListenerOnce(map, "idle", () => finalize(onReady))
  );

  const timeoutId = window.setTimeout(() => finalize(onError), 10000);

  return () => {
    if (settled) {
      return;
    }

    settled = true;
    window.clearTimeout(timeoutId);

    listeners.forEach((listener) => {
      if (typeof listener.remove === "function") {
        listener.remove();
      } else if (googleMaps.event?.removeListener) {
        googleMaps.event.removeListener(listener);
      }
    });
  };
}

function MapSurface({
  badge,
  children,
  status,
  summary,
  onReset
}: {
  badge: ReactNode;
  children: ReactNode;
  status: "loading" | "ready" | "error" | "missing-key";
  summary?: ReactNode;
  onReset: () => void;
}) {
  return (
    <div className="local-map-canvas">
      <div className="local-map-canvas-top">
        <div className="local-map-canvas-badge">{badge}</div>
        <div className="local-map-stage-actions">
          <button type="button" className="local-map-reset" onClick={onReset}>
            <RotateCcw size={15} strokeWidth={2.3} />
            <span>Reset view</span>
          </button>
        </div>
      </div>

      <div className="local-map-stage">
        {children}

        {status === "loading" ? (
          <div className="local-map-status">
            <strong>Loading Google Maps</strong>
            <p>Loading live map.</p>
          </div>
        ) : null}

        {status === "missing-key" ? (
          <div className="local-map-status is-warning">
            <strong>Google Maps key required</strong>
            <p>Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to render the real map on this screen.</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="local-map-status is-warning">
            <strong>Map failed to load</strong>
            <p>Double-check your Maps JavaScript API setup, billing, and HTTP referrer restrictions, then refresh.</p>
          </div>
        ) : null}
      </div>

      {summary ? <div className="local-map-summary-card">{summary}</div> : null}
    </div>
  );
}

function getCommunityMapContent(category: ListingCategory) {
  switch (category) {
    case "rentals":
      return {
        title: "Rental listings by community",
        description: "See rental activity by community.",
        badge: "Live rental map",
        statsLabel: "mapped rentals",
        browseLabel: "Browse by area"
      };
    case "jobs":
      return {
        title: "Jobs across Fort McMurray and site areas",
        description: "See job activity by community and site area.",
        badge: "Live jobs map",
        statsLabel: "mapped jobs",
        browseLabel: "Browse job areas"
      };
    case "services":
      return {
        title: "Service listings across local communities",
        description: "See service coverage by community.",
        badge: "Live services map",
        statsLabel: "mapped services",
        browseLabel: "Browse service areas"
      };
    case "buy-sell":
    default:
      return {
        title: "Local listings by community",
        description: "See local listings by community.",
        badge: "Live marketplace map",
        statsLabel: "mapped listings",
        browseLabel: "Browse local areas"
      };
  }
}

export function LocalMapExplorer({
  category,
  listings,
  businessMapProfiles = {},
  actionPath,
  search,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  structuredFilters
}: LocalMapExplorerProps) {
  const serializedFilters = toStringFilterRecord(structuredFilters);

  const buildHref = (overrides: Record<string, string | number | boolean | null | undefined>) =>
    buildPathWithQuery(actionPath, {
      q: search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort,
      view: "map",
      ...serializedFilters,
      ...overrides
    });

  if (category !== "ride-share") {
    return (
      <CommunityMapExplorer
        category={category}
        activeArea={
          typeof structuredFilters?.communityArea === "string"
            ? structuredFilters.communityArea
            : typeof structuredFilters?.rentalArea === "string"
              ? structuredFilters.rentalArea
              : null
        }
        businessMapProfiles={businessMapProfiles}
        buildHref={buildHref}
        listings={listings}
      />
    );
  }

  return (
    <RideShareMapExplorer
      activeDeparture={typeof structuredFilters?.departureArea === "string" ? structuredFilters.departureArea : null}
      activeDestination={typeof structuredFilters?.destinationArea === "string" ? structuredFilters.destinationArea : null}
      buildHref={buildHref}
      listings={listings}
    />
  );
}

function CommunityMapExplorer({
  category,
  activeArea,
  businessMapProfiles,
  buildHref,
  listings
}: {
  category: Exclude<ListingCategory, "ride-share">;
  activeArea: string | null;
  businessMapProfiles: Record<string, BusinessMapProfile>;
  buildHref: (overrides: Record<string, string | number | boolean | null | undefined>) => string;
  listings: Listing[];
}) {
  const router = useRouter();
  const mapRootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const markersRef = useRef<Record<string, GoogleMarkerInstance>>({});
  const exactLocationMarkersRef = useRef<Record<string, GoogleMarkerInstance>>({});
  const { config: googleMapsConfig, status: configStatus } = useGoogleMapsConfig();
  const authFailed = useGoogleMapsAuthFailure();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");
  const [exactLocationPoints, setExactLocationPoints] = useState<ExactAddressMapPoint[]>([]);
  const [selectedExactLocationKey, setSelectedExactLocationKey] = useState<string | null>(null);
  const mapContent = useMemo(() => getCommunityMapContent(category), [category]);
  const includeCampAreas = category === "jobs";
  const listingPoints = useMemo<CommunityListingPoint[]>(
    () =>
      listings
        .map((listing) => {
          const point =
            category === "rentals" ? getRentalListingMapPoint(listing) : getCommunityListingMapPoint(listing);

          if (!point) {
            return null;
          }

          const businessProfile = businessMapProfiles[listing.owner_id];
          const businessAddress = businessProfile?.business_address?.trim() || null;
          const geocodedBusinessArea = resolveCommunityMapArea(businessProfile?.business_geocoded_area);
          const inferredBusinessArea = businessAddress
            ? getCommunityMapAreaFromText(businessAddress, { includeCamp: includeCampAreas })
            : null;
          const resolvedArea = (geocodedBusinessArea ?? inferredBusinessArea ?? point.area) as CommunityMapArea;
          const resolvedDefinition =
            getCommunityMapAreaDefinition(resolvedArea) ?? getCommunityMapAreaDefinition(point.area as CommunityMapArea);

          if (!resolvedDefinition) {
            return null;
          }

          const listingExactGeocode =
            shouldShowExactListingAddressOnMap(listing) &&
            typeof listing.geocoded_lat === "number" &&
            typeof listing.geocoded_lng === "number"
              ? {
                  lat: listing.geocoded_lat,
                  lng: listing.geocoded_lng
                }
              : null;
          const businessExactGeocode =
            listing.show_exact_address_on_map === null &&
            businessProfile?.show_exact_business_location &&
            typeof businessProfile.business_geocoded_lat === "number" &&
            typeof businessProfile.business_geocoded_lng === "number"
              ? {
                  lat: businessProfile.business_geocoded_lat,
                  lng: businessProfile.business_geocoded_lng
                }
              : null;

          return {
            listing,
            ownerId: listing.owner_id,
            area: resolvedDefinition.value as CommunityMapArea,
            areaLabel: resolvedDefinition.label,
            lat: point.lat,
            lng: point.lng,
            businessName: businessProfile?.business_name ?? null,
            businessAddress,
            exactAddress: shouldShowExactListingAddressOnMap(listing)
              ? listing.location.trim()
              : listing.show_exact_address_on_map === null &&
                  businessProfile?.show_exact_business_location &&
                  businessAddress
                ? businessAddress
                : null,
            exactLat: listingExactGeocode?.lat ?? businessExactGeocode?.lat ?? null,
            exactLng: listingExactGeocode?.lng ?? businessExactGeocode?.lng ?? null
          };
        })
        .filter(Boolean) as CommunityListingPoint[],
    [businessMapProfiles, category, includeCampAreas, listings]
  );
  const knownAreas = useMemo<CommunityAreaSummary[]>(() => {
    const counts = new Map<CommunityMapArea, number>();

    for (const point of listingPoints) {
      counts.set(point.area, (counts.get(point.area) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([area, count]) => {
        const definition = getCommunityMapAreaDefinition(area);
        return definition
          ? {
              value: definition.value as CommunityMapArea,
              label: definition.label,
              lat: definition.lat,
              lng: definition.lng,
              count
            }
          : null;
      })
      .filter(Boolean)
      .sort((left, right) => right!.count - left!.count) as CommunityAreaSummary[];
  }, [listingPoints]);
  const exactAddressCandidates = useMemo<ExactAddressCandidate[]>(() => {
    const byAddress = new Map<string, ExactAddressCandidate>();

    for (const point of listingPoints) {
      if (!point.exactAddress) {
        continue;
      }

      const key = `${point.ownerId}:${point.exactAddress.toLowerCase()}`;
      const existing = byAddress.get(key);
      if (existing) {
        existing.listings.push(point.listing);
        if (existing.lat === null && point.exactLat !== null) {
          existing.lat = point.exactLat;
        }
        if (existing.lng === null && point.exactLng !== null) {
          existing.lng = point.exactLng;
        }
        continue;
      }

      byAddress.set(key, {
        key,
        ownerId: point.ownerId,
        businessName: point.businessName,
        exactAddress: point.exactAddress,
        area: point.area,
        areaLabel: point.areaLabel,
        lat: point.exactLat,
        lng: point.exactLng,
        listings: [point.listing],
        representativeListing: point.listing
      });
    }

    return Array.from(byAddress.values());
  }, [listingPoints]);
  const dataKey = useMemo(
    () =>
      knownAreas.map((area) => `${area.value}:${area.count}:${area.lat}:${area.lng}`).join("|") +
      "|" +
      listingPoints.map((item) => `${item.listing.id}:${item.area}`).join("|") +
      "|" +
      exactAddressCandidates.map((item) => `${item.key}:${item.listings.length}`).join("|"),
    [exactAddressCandidates, knownAreas, listingPoints]
  );
  const [selectedArea, setSelectedArea] = useState<string | null>(activeArea ?? listingPoints[0]?.area ?? null);
  const selectedAreaData = knownAreas.find((area) => area.value === selectedArea) ?? null;

  useEffect(() => {
    setSelectedArea(activeArea ?? listingPoints[0]?.area ?? null);
    setSelectedExactLocationKey(null);
  }, [activeArea, dataKey, listingPoints]);

  useEffect(() => {
    if (selectedExactLocationKey && !exactLocationPoints.some((point) => point.key === selectedExactLocationKey)) {
      setSelectedExactLocationKey(null);
    }
  }, [exactLocationPoints, selectedExactLocationKey]);

  useEffect(() => {
    if (status === "error" || status === "missing-key") {
      clearMapSurface(mapRootRef.current);
    }
  }, [status]);

  useEffect(() => {
    if (authFailed) {
      clearMapSurface(mapRootRef.current);
      setExactLocationPoints([]);
      setStatus("error");
      return;
    }

    if (!mapRootRef.current) {
      return;
    }

    if (configStatus === "missing-key") {
      clearMapSurface(mapRootRef.current);
      setExactLocationPoints([]);
      setStatus("missing-key");
      return;
    }

    if (configStatus === "error") {
      clearMapSurface(mapRootRef.current);
      setExactLocationPoints([]);
      setStatus("error");
      return;
    }

    if (!googleMapsConfig?.apiKey) {
      setStatus("loading");
      return;
    }
    const resolvedGoogleMapsConfig = googleMapsConfig;

    let cancelled = false;
    let stopWatching: (() => void) | null = null;

    async function renderMap() {
      try {
        const googleMaps = await loadGoogleMapsApi(resolvedGoogleMapsConfig.apiKey);
        if (cancelled || !mapRootRef.current) {
          return;
        }

        const map =
          mapRef.current ??
          new googleMaps.Map(
            mapRootRef.current,
            buildMapOptions(FORT_MCMURRAY_CENTER, 11, resolvedGoogleMapsConfig.mapId ?? undefined)
          );
        mapRef.current = map;
        infoWindowRef.current = infoWindowRef.current ?? new googleMaps.InfoWindow();

        Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
        markersRef.current = {};
        Object.values(exactLocationMarkersRef.current).forEach((marker) => marker.setMap(null));
        exactLocationMarkersRef.current = {};

        const geocoder = exactAddressCandidates.some((candidate) => candidate.lat === null || candidate.lng === null)
          ? new googleMaps.Geocoder()
          : null;
        const resolvedExactLocations =
          exactAddressCandidates.length
          ? (
              await Promise.all(
                exactAddressCandidates.map(async (candidate) => {
                  if (candidate.lat !== null && candidate.lng !== null) {
                    return {
                      ...candidate,
                      lat: candidate.lat,
                      lng: candidate.lng
                    };
                  }

                  const resolvedPoint =
                    geocoder ? await geocodeAddressFallback(geocoder, candidate.exactAddress) : null;
                  return resolvedPoint && geocoder
                    ? {
                        ...candidate,
                        lat: resolvedPoint.lat,
                        lng: resolvedPoint.lng
                      }
                    : null;
                })
              )
            ).filter(Boolean) as ExactAddressMapPoint[]
          : [];

        if (cancelled) {
          return;
        }

        setExactLocationPoints(resolvedExactLocations);

        knownAreas.forEach((area) => {
          const representativeListing = listingPoints.find((item) => item.area === area.value) ?? null;
          const marker = new googleMaps.Marker({
            map,
            position: { lat: area.lat, lng: area.lng },
            title: `${area.label} listings`,
            label: {
              text: String(area.count),
              color: "#FFFFFF",
              fontWeight: "800",
              fontSize: area.count > 9 ? "11px" : "12px"
            },
            icon: createCircleMarkerIcon(googleMaps, area.count, selectedArea === area.value)
          });

          marker.addListener("click", () => {
            setSelectedArea(area.value);
            setSelectedExactLocationKey(null);
            infoWindowRef.current?.setContent(
              createInfoContent(
                area.label,
                `${area.count} listing${area.count === 1 ? "" : "s"} in this community`,
                representativeListing?.listing.title ?? "Filtering mapped listings in this area."
              )
            );
            infoWindowRef.current?.open({ anchor: marker, map });
            router.replace(buildHref({ communityArea: area.value }));
          });

          markersRef.current[area.value] = marker;
        });

        resolvedExactLocations.forEach((exactPoint) => {
          const marker = new googleMaps.Marker({
            map,
            position: { lat: exactPoint.lat, lng: exactPoint.lng },
            title: `${exactPoint.businessName ?? exactPoint.representativeListing.title} | ${exactPoint.listings.length} listing${
              exactPoint.listings.length === 1 ? "" : "s"
            }`,
            icon: createPillMarkerIcon(
              googleMaps,
              buildExactAddressMarkerLabel(exactPoint),
              selectedExactLocationKey === exactPoint.key,
              exactPoint.businessName ? "dark" : "primary"
            ),
            zIndex: selectedExactLocationKey === exactPoint.key ? 30 : 18
          });

          marker.addListener("click", () => {
            setSelectedArea(exactPoint.area);
            setSelectedExactLocationKey(exactPoint.key);
            infoWindowRef.current?.setContent(
              createInfoContent(
                exactPoint.businessName ?? exactPoint.representativeListing.title,
                exactPoint.exactAddress,
                `${exactPoint.listings.length} active listing${
                  exactPoint.listings.length === 1 ? "" : "s"
                } at this location.`
              )
            );
            infoWindowRef.current?.open({ anchor: marker, map });
          });

          exactLocationMarkersRef.current[exactPoint.key] = marker;
        });

        fitMapToPoints(
          googleMaps,
          map,
          [
            ...knownAreas.map((area) => ({ lat: area.lat, lng: area.lng })),
            ...resolvedExactLocations.map((exactPoint) => ({ lat: exactPoint.lat, lng: exactPoint.lng }))
          ],
          FORT_MCMURRAY_CENTER,
          11
        );
        stopWatching = watchMapUntilReady(
          googleMaps,
          map,
          () => {
            if (!cancelled) {
              setStatus("ready");
            }
          },
          () => {
            if (!cancelled) {
              clearMapSurface(mapRootRef.current);
              setExactLocationPoints([]);
              setStatus("error");
            }
          }
        );
      } catch {
        if (!cancelled) {
          clearMapSurface(mapRootRef.current);
          setExactLocationPoints([]);
          setStatus("error");
        }
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
      stopWatching?.();
    };
  }, [
    authFailed,
    configStatus,
    dataKey,
    exactAddressCandidates,
    googleMapsConfig,
    knownAreas,
    listingPoints,
    selectedArea,
    selectedExactLocationKey
  ]);
  useEffect(() => {
    if (mapRef.current && googleMapsConfig?.mapId) {
      mapRef.current.setOptions({ mapId: googleMapsConfig.mapId });
    }
  }, [googleMapsConfig?.mapId]);

  useEffect(() => {
    if (!window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const map = mapRef.current;
    const selectedAreaMarker = selectedArea ? markersRef.current[selectedArea] : null;
    const selectedExactMarker = selectedExactLocationKey
      ? exactLocationMarkersRef.current[selectedExactLocationKey]
      : null;

    Object.entries(markersRef.current).forEach(([value, marker]) => {
      const area = knownAreas.find((item) => item.value === value);
      if (!area) {
        return;
      }

      marker.setIcon(createCircleMarkerIcon(googleMaps, area.count, selectedArea === area.value));
      marker.setLabel({
        text: String(area.count),
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: area.count > 9 ? "11px" : "12px"
      });
      marker.setZIndex(selectedArea === area.value ? 20 : 10);
    });

    Object.entries(exactLocationMarkersRef.current).forEach(([key, marker]) => {
      const exactPoint = exactLocationPoints.find((item) => item.key === key);
      if (!exactPoint) {
        return;
      }

      marker.setIcon(
        createPillMarkerIcon(
          googleMaps,
          buildExactAddressMarkerLabel(exactPoint),
          selectedExactLocationKey === key,
          exactPoint.businessName ? "dark" : "primary"
        )
      );
      marker.setZIndex(selectedExactLocationKey === key ? 30 : 18);
    });

    if (map && selectedExactMarker) {
      const position = selectedExactMarker.getPosition?.();
      if (position) {
        map.panTo(position);
        if ((map.getZoom?.() ?? 0) < 13) {
          map.setZoom(13);
        }
      }
      return;
    }

    if (map && selectedAreaMarker) {
      const position = selectedAreaMarker.getPosition?.();
      if (position) {
        map.panTo(position);
        if ((map.getZoom?.() ?? 0) < 12) {
          map.setZoom(12);
        }
      }
    }
  }, [exactLocationPoints, knownAreas, selectedArea, selectedExactLocationKey]);

  const selectedExactLocationPoint =
    selectedExactLocationKey ? exactLocationPoints.find((point) => point.key === selectedExactLocationKey) ?? null : null;

  function handleReset() {
    const map = mapRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    fitMapToPoints(
      window.google.maps,
      map,
      [
        ...knownAreas.map((area) => ({ lat: area.lat, lng: area.lng })),
        ...exactLocationPoints.map((exactPoint) => ({ lat: exactPoint.lat, lng: exactPoint.lng }))
      ],
      FORT_MCMURRAY_CENTER,
      11
    );
  }

  function handleAreaSelection(areaValue: string | null) {
    setSelectedArea(areaValue);
    setSelectedExactLocationKey(null);

    if (activeArea !== areaValue) {
      router.replace(buildHref({ communityArea: areaValue ?? undefined }));
    }
  }

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>{mapContent.title}</h3>
          <p>{mapContent.description}</p>
        </div>
        <div className="local-map-mini-stats">
          <span>
            <strong>{listingPoints.length}</strong>
            <span>{mapContent.statsLabel}</span>
          </span>
          <span>
            <strong>{knownAreas.length}</strong>
            <span>active areas</span>
          </span>
        </div>
      </div>

      <div className="local-map-layout">
        <MapSurface
          badge={
            <>
              <MapPinned aria-hidden="true" size={16} strokeWidth={2.3} />
              <span>{mapContent.badge}</span>
            </>
          }
          status={status}
          onReset={handleReset}
          summary={
            selectedExactLocationPoint ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">
                    {selectedExactLocationPoint.businessName
                      ? "Selected business"
                      : selectedExactLocationPoint.listings.length > 1
                        ? "Selected address"
                        : "Selected listing"}
                  </span>
                  <strong>
                    {selectedExactLocationPoint.businessName ??
                      selectedExactLocationPoint.representativeListing.title}
                  </strong>
                  <p>
                    {selectedExactLocationPoint.exactAddress} | {selectedExactLocationPoint.listings.length} active
                    listing{selectedExactLocationPoint.listings.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="local-map-summary-actions">
                  <Link
                    href={`/listings/${selectedExactLocationPoint.representativeListing.slug}`}
                    className="local-map-summary-link"
                  >
                    Open listing
                    <ArrowRight size={15} strokeWidth={2.4} />
                  </Link>
                  <Link
                    href={buildHref({ communityArea: selectedExactLocationPoint.area })}
                    className="local-map-summary-link is-secondary"
                  >
                    View area
                    <ArrowRight size={15} strokeWidth={2.4} />
                  </Link>
                </div>
              </div>
            ) : selectedAreaData ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected area</span>
                  <strong>{selectedAreaData.label}</strong>
                  <p>
                    {selectedAreaData.count} active listing{selectedAreaData.count === 1 ? "" : "s"} currently mapped
                    in this area.
                  </p>
                </div>
                <Link href={buildHref({ communityArea: selectedAreaData.value })} className="local-map-summary-link">
                  View area
                  <ArrowRight size={15} strokeWidth={2.4} />
                </Link>
              </div>
            ) : null
          }
        >
          <div ref={mapRootRef} className="local-map-google-stage" />
        </MapSurface>

        <div className="local-map-sidebar">
          <div className="local-map-sidebar-card">
            <div className="local-map-sidebar-head">
              <Compass aria-hidden="true" size={16} strokeWidth={2.3} />
              <strong>{mapContent.browseLabel}</strong>
            </div>

            <div className="local-map-chip-row">
              {knownAreas.map((area) => (
                <Link
                  key={area.value}
                  href={buildHref({ communityArea: area.value })}
                  className={`local-map-chip${activeArea === area.value ? " is-active" : ""}`}
                >
                  <span>{area.label}</span>
                  <strong>{area.count}</strong>
                </Link>
              ))}
            </div>

            {activeArea ? (
              <Link href={buildHref({ communityArea: undefined })} className="local-map-clear">
                Clear area filter
              </Link>
            ) : selectedArea ? (
              <button type="button" className="local-map-clear" onClick={() => handleAreaSelection(null)}>
                Clear selection
              </button>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}

function RideShareMapExplorer({
  activeDeparture,
  activeDestination,
  buildHref,
  listings
}: {
  activeDeparture: string | null;
  activeDestination: string | null;
  buildHref: (overrides: Record<string, string | number | boolean | null | undefined>) => string;
  listings: Listing[];
}) {
  const mapRootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const markersRef = useRef<Record<string, GoogleMarkerInstance>>({});
  const routeRefs = useRef<Array<{ route: RideShareRouteSummary; polyline: GooglePolylineInstance }>>([]);
  const { config: googleMapsConfig, status: configStatus } = useGoogleMapsConfig();
  const authFailed = useGoogleMapsAuthFailure();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");
  const { routes, endpoints, flexibleCount } = useMemo(() => getRideShareRouteCounts(listings), [listings]);
  const mappedRouteListings = useMemo<RideShareListingPoint[]>(
    () =>
      listings
        .map((listing) => ({ ...getRideShareRouteMapPoints(listing), listing }))
        .filter((item) => item.departure || item.destination),
    [listings]
  );
  const topRoutes = useMemo(() => routes.slice(0, 6), [routes]);
  const routeDataKey = useMemo(
    () => topRoutes.map((route) => `${route.departure}:${route.destination}:${route.count}`).join("|"),
    [topRoutes]
  );
  const endpointDataKey = useMemo(
    () => endpoints.map((endpoint) => `${endpoint.value}:${endpoint.count}`).join("|"),
    [endpoints]
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(activeDeparture ?? activeDestination ?? null);

  useEffect(() => {
    setSelectedEndpoint(activeDeparture ?? activeDestination ?? endpoints[0]?.value ?? null);
  }, [activeDeparture, activeDestination, endpointDataKey, endpoints]);

  useEffect(() => {
    if (status === "error" || status === "missing-key") {
      clearMapSurface(mapRootRef.current);
    }
  }, [status]);

  useEffect(() => {
    if (authFailed) {
      clearMapSurface(mapRootRef.current);
      setStatus("error");
      return;
    }

    if (!mapRootRef.current) {
      return;
    }

    if (configStatus === "missing-key") {
      clearMapSurface(mapRootRef.current);
      setStatus("missing-key");
      return;
    }

    if (configStatus === "error") {
      clearMapSurface(mapRootRef.current);
      setStatus("error");
      return;
    }

    if (!googleMapsConfig?.apiKey) {
      setStatus("loading");
      return;
    }
    const resolvedGoogleMapsConfig = googleMapsConfig;

    let cancelled = false;
    let stopWatching: (() => void) | null = null;

    async function renderMap() {
      try {
        const googleMaps = await loadGoogleMapsApi(resolvedGoogleMapsConfig.apiKey);
        if (cancelled || !mapRootRef.current) {
          return;
        }

        const map =
          mapRef.current ??
          new googleMaps.Map(
            mapRootRef.current,
            buildMapOptions(ALBERTA_CENTER, 6, resolvedGoogleMapsConfig.mapId ?? undefined)
          );
        mapRef.current = map;
        infoWindowRef.current = infoWindowRef.current ?? new googleMaps.InfoWindow();

        Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
        markersRef.current = {};
        routeRefs.current.forEach(({ polyline }) => polyline.setMap(null));
        routeRefs.current = [];

        endpoints.forEach((endpoint) => {
          const marker = new googleMaps.Marker({
            map,
            position: { lat: endpoint.lat, lng: endpoint.lng },
            title: `${endpoint.label} · ${endpoint.count} route touchpoint${endpoint.count === 1 ? "" : "s"}`,
            label: {
              text: String(endpoint.count),
              color: "#FFFFFF",
              fontWeight: "800",
              fontSize: "12px"
            },
            icon: createCircleMarkerIcon(googleMaps, endpoint.count, selectedEndpoint === endpoint.value)
          });

          marker.addListener("click", () => {
            setSelectedEndpoint(endpoint.value);
            infoWindowRef.current?.setContent(
              createInfoContent(
                endpoint.label,
                `${endpoint.count} ride-share stop${endpoint.count === 1 ? "" : "s"} in the current result set.`
              )
            );
            infoWindowRef.current?.open({ anchor: marker, map });
          });

          markersRef.current[endpoint.value] = marker;
        });

        topRoutes
          .filter((route) => route.departure !== route.destination)
          .forEach((route) => {
            const polyline = new googleMaps.Polyline({
              map,
              path: [
                { lat: route.departurePoint.lat, lng: route.departurePoint.lng },
                { lat: route.destinationPoint.lat, lng: route.destinationPoint.lng }
              ],
              geodesic: true,
              strokeColor: "#2F6DF6",
              strokeOpacity: 0.72,
              strokeWeight: Math.min(7, 2.2 + route.count * 0.75),
              icons: [
                {
                  icon: {
                    path: googleMaps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3.5,
                    strokeColor: "#1549B7",
                    fillColor: "#1549B7",
                    fillOpacity: 1
                  },
                  offset: "100%"
                }
              ]
            });

            polyline.addListener("click", (event: { latLng?: any }) => {
              setSelectedEndpoint(route.departure);
              if (event.latLng) {
                infoWindowRef.current?.setPosition(event.latLng);
                infoWindowRef.current?.setContent(
                  createInfoContent(
                    `${route.departureLabel} → ${route.destinationLabel}`,
                    `${route.count} active ride${route.count === 1 ? "" : "s"} currently follow this route.`
                  )
                );
                infoWindowRef.current?.open({ map });
              }
            });

            routeRefs.current.push({ route, polyline });
          });

        const routePoints = [
          ...mappedRouteListings.flatMap((item) =>
            [item.departure, item.destination]
              .filter(Boolean)
              .map((point) => ({ lat: point!.lat, lng: point!.lng }))
          ),
          ...endpoints.map((endpoint) => ({ lat: endpoint.lat, lng: endpoint.lng }))
        ];
        fitMapToPoints(googleMaps, map, routePoints, ALBERTA_CENTER, 6);
        stopWatching = watchMapUntilReady(
          googleMaps,
          map,
          () => {
            if (!cancelled) {
              setStatus("ready");
            }
          },
          () => {
            if (!cancelled) {
              clearMapSurface(mapRootRef.current);
              setStatus("error");
            }
          }
        );
      } catch {
        if (!cancelled) {
          clearMapSurface(mapRootRef.current);
          setStatus("error");
        }
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
      stopWatching?.();
    };
  }, [authFailed, endpointDataKey, mappedRouteListings, routeDataKey, endpoints, topRoutes, selectedEndpoint]);
  useEffect(() => {
    if (mapRef.current && googleMapsConfig?.mapId) {
      mapRef.current.setOptions({ mapId: googleMapsConfig.mapId });
    }
  }, [googleMapsConfig?.mapId]);

  useEffect(() => {
    if (!window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const map = mapRef.current;
    const selectedMarker = selectedEndpoint ? markersRef.current[selectedEndpoint] : null;

    Object.entries(markersRef.current).forEach(([value, marker]) => {
      const endpoint = endpoints.find((item) => item.value === value);
      if (!endpoint) {
        return;
      }

      marker.setIcon(createCircleMarkerIcon(googleMaps, endpoint.count, selectedEndpoint === value));
      marker.setZIndex(selectedEndpoint === value ? 20 : 10);
    });

    routeRefs.current.forEach(({ route, polyline }) => {
      const related = selectedEndpoint
        ? route.departure === selectedEndpoint || route.destination === selectedEndpoint
        : true;
      polyline.setOptions({
        strokeOpacity: related ? 0.82 : 0.18,
        zIndex: related ? 3 : 1
      });
    });

    if (map && selectedMarker) {
      const position = selectedMarker.getPosition?.();
      if (position) {
        map.panTo(position);
      }
    }
  }, [selectedEndpoint, endpoints]);

  const selectedEndpointData = endpoints.find((endpoint) => endpoint.value === selectedEndpoint) ?? null;

  function handleReset() {
    const map = mapRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    fitMapToPoints(
      window.google.maps,
      map,
      endpoints.map((endpoint) => ({ lat: endpoint.lat, lng: endpoint.lng })),
      ALBERTA_CENTER,
      6
    );
  }

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>Ride-share routes on a real map</h3>
          <p>See live stops and route lines on Google Maps instead of guessing from raw listing text.</p>
        </div>
        <div className="local-map-mini-stats">
          <span>
            <strong>{topRoutes.length}</strong>
            <span>visible routes</span>
          </span>
          <span>
            <strong>{flexibleCount}</strong>
            <span>flexible trips</span>
          </span>
        </div>
      </div>

      <div className="local-map-layout">
        <MapSurface
          badge={
            <>
              <Route aria-hidden="true" size={16} strokeWidth={2.3} />
              <span>Live route map</span>
            </>
          }
          status={status}
          onReset={handleReset}
          summary={
            selectedEndpointData ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected stop</span>
                  <strong>{selectedEndpointData.label}</strong>
                  <p>
                    {selectedEndpointData.count} route touchpoint{selectedEndpointData.count === 1 ? "" : "s"} in the
                    current result set.
                  </p>
                </div>
                <div className="local-map-summary-actions">
                  <Link
                    href={buildHref({ departureArea: selectedEndpointData.value, destinationArea: undefined })}
                    className="local-map-summary-link"
                  >
                    Use as departure
                  </Link>
                  <Link
                    href={buildHref({ departureArea: undefined, destinationArea: selectedEndpointData.value })}
                    className="local-map-summary-link is-secondary"
                  >
                    Use as destination
                  </Link>
                </div>
              </div>
            ) : null
          }
        >
          <div ref={mapRootRef} className="local-map-google-stage" />
        </MapSurface>

        <div className="local-map-sidebar">
          <div className="local-map-sidebar-card">
            <div className="local-map-sidebar-head">
              <Compass aria-hidden="true" size={16} strokeWidth={2.3} />
              <strong>Popular routes</strong>
            </div>

            <div className="local-map-route-list">
              {topRoutes.length ? (
                topRoutes.map((route) => (
                  route.departure === route.destination ? (
                    <Link
                      key={`${route.departure}-${route.destination}`}
                      href={buildHref({
                        departureArea: route.departure,
                        destinationArea: undefined
                      })}
                      className={`local-map-route-pill${
                        activeDeparture === route.departure && !activeDestination ? " is-active" : ""
                      }`}
                    >
                      <span>{route.departureLabel} area trips</span>
                      <strong>{route.count}</strong>
                    </Link>
                  ) : (
                    <Link
                      key={`${route.departure}-${route.destination}`}
                      href={buildHref({
                        departureArea: route.departure,
                        destinationArea: route.destination
                      })}
                      className={`local-map-route-pill${
                        activeDeparture === route.departure && activeDestination === route.destination
                          ? " is-active"
                          : ""
                      }`}
                    >
                      <span>{route.departureLabel}</span>
                      <ArrowRight size={14} strokeWidth={2.4} />
                      <span>{route.destinationLabel}</span>
                      <strong>{route.count}</strong>
                    </Link>
                  )
                ))
              ) : (
                <p className="local-map-empty-copy">
                  No route groups yet.
                </p>
              )}
            </div>

            {activeDeparture || activeDestination ? (
              <Link
                href={buildHref({ departureArea: undefined, destinationArea: undefined })}
                className="local-map-clear"
              >
                Clear route filter
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
