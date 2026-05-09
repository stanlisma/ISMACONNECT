"use client";

import Link from "next/link";
import { ArrowRight, Compass, MapPinned, RotateCcw, Route } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  getRentalAreaCounts,
  getRentalListingMapPoint,
  getRideShareRouteCounts,
  getRideShareRouteMapPoints
} from "@/lib/local-marketplace";
import { buildPathWithQuery } from "@/lib/utils";
import type { Listing } from "@/types/database";

type LocalMapExplorerProps = {
  category: "rentals" | "ride-share";
  listings: Listing[];
  actionPath: string;
  search?: string;
  subcategory?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  structuredFilters?: Record<string, unknown>;
};

type RentalAreaSummary = ReturnType<typeof getRentalAreaCounts>["knownAreas"][number];
type RideShareEndpointSummary = ReturnType<typeof getRideShareRouteCounts>["endpoints"][number];
type RideShareRouteSummary = ReturnType<typeof getRideShareRouteCounts>["routes"][number];
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
type RentalListingPoint = NonNullable<ReturnType<typeof getRentalListingMapPoint>> & { listing: Listing };
type RideShareListingPoint = ReturnType<typeof getRideShareRouteMapPoints> & { listing: Listing };

const EMBEDDED_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
const EMBEDDED_GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() || undefined;
const GOOGLE_MAPS_CALLBACK = "__ismaconnectGoogleMapsInit";
const FORT_MCMURRAY_CENTER = { lat: 56.7269, lng: -111.3806 };
const ALBERTA_CENTER = { lat: 54.9, lng: -112.6 };

let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null;

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
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
            <p>Pulling in the live map tiles and interactive controls.</p>
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
            <p>Double-check your Google Maps JavaScript API key and billing setup, then refresh.</p>
          </div>
        ) : null}
      </div>

      <div className="local-map-stage-meta">
        <span>Google Maps with native pan and zoom</span>
        <span>Tap markers or route chips to narrow results faster</span>
      </div>

      {summary ? <div className="local-map-summary-card">{summary}</div> : null}
    </div>
  );
}

export function LocalMapExplorer({
  category,
  listings,
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
      subcategory,
      minPrice,
      maxPrice,
      sort,
      view: "map",
      ...serializedFilters,
      ...overrides
    });

  if (category === "rentals") {
    return (
      <RentalMapExplorer
        activeArea={typeof structuredFilters?.rentalArea === "string" ? structuredFilters.rentalArea : null}
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

function RentalMapExplorer({
  activeArea,
  buildHref,
  listings
}: {
  activeArea: string | null;
  buildHref: (overrides: Record<string, string | number | boolean | null | undefined>) => string;
  listings: Listing[];
}) {
  const mapRootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const markersRef = useRef<Record<string, GoogleMarkerInstance>>({});
  const { config: googleMapsConfig, status: configStatus } = useGoogleMapsConfig();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");
  const { knownAreas, unknownCount } = useMemo(() => getRentalAreaCounts(listings), [listings]);
  const listingPoints = useMemo<RentalListingPoint[]>(
    () =>
      listings
        .map((listing) => {
          const point = getRentalListingMapPoint(listing);
          return point ? { ...point, listing } : null;
        })
        .filter(Boolean) as RentalListingPoint[],
    [listings]
  );
  const dataKey = useMemo(
    () => listingPoints.map((item) => `${item.listing.id}:${item.lat}:${item.lng}`).join("|"),
    [listingPoints]
  );
  const [selectedArea, setSelectedArea] = useState<string | null>(activeArea ?? listingPoints[0]?.area ?? null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(listingPoints[0]?.listing.id ?? null);

  useEffect(() => {
    const nextSelectedListing =
      activeArea
        ? listingPoints.find((item) => item.area === activeArea)?.listing.id
        : listingPoints[0]?.listing.id ?? null;
    setSelectedArea(activeArea ?? listingPoints[0]?.area ?? null);
    setSelectedListingId(nextSelectedListing ?? null);
  }, [activeArea, dataKey, listingPoints]);

  useEffect(() => {
    if (!mapRootRef.current) {
      return;
    }

    if (configStatus === "missing-key") {
      setStatus("missing-key");
      return;
    }

    if (configStatus === "error") {
      setStatus("error");
      return;
    }

    if (!googleMapsConfig?.apiKey) {
      setStatus("loading");
      return;
    }
    const resolvedGoogleMapsConfig = googleMapsConfig;

    let cancelled = false;

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

        listingPoints.forEach((item) => {
          const area = { label: item.areaLabel, count: 1, value: item.area };
          const marker = new googleMaps.Marker({
            map,
            position: { lat: item.lat, lng: item.lng },
            title: `${area.label} · ${area.count} rental${area.count === 1 ? "" : "s"}`,
            label: {
              text: "",
              color: "#FFFFFF",
              fontWeight: "800",
              fontSize: "12px"
            },
            icon: createPillMarkerIcon(
              googleMaps,
              formatCompactPrice(item.listing.price),
              selectedListingId === item.listing.id
            )
          });

          marker.addListener("click", () => {
            setSelectedArea(item.area);
            setSelectedListingId(item.listing.id);
            infoWindowRef.current?.setContent(
              createInfoContent(
                item.listing.title,
                `${formatCompactPrice(item.listing.price)} · ${item.areaLabel}`,
                item.listing.location
              )
            );
            infoWindowRef.current?.open({ anchor: marker, map });
          });

          markersRef.current[item.listing.id] = marker;
        });

        fitMapToPoints(
          googleMaps,
          map,
          listingPoints.map((item) => ({ lat: item.lat, lng: item.lng })),
          FORT_MCMURRAY_CENTER,
          11
        );
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [dataKey, listingPoints, selectedListingId]);
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
    const selectedMarker = selectedListingId ? markersRef.current[selectedListingId] : null;

    Object.entries(markersRef.current).forEach(([value, marker]) => {
      const point = listingPoints.find((item) => item.listing.id === value);
      if (!point) {
        return;
      }

      marker.setIcon(
        createPillMarkerIcon(
          googleMaps,
          formatCompactPrice(point.listing.price),
          selectedListingId === point.listing.id
        )
      );
      marker.setZIndex(selectedListingId === point.listing.id ? 20 : 10);
    });

    if (map && selectedMarker) {
      const position = selectedMarker.getPosition?.();
      if (position) {
        map.panTo(position);
      }
    }
  }, [listingPoints, selectedListingId]);

  const selectedListingPoint =
    listingPoints.find((item) => item.listing.id === selectedListingId) ??
    (selectedArea ? listingPoints.find((item) => item.area === selectedArea) : null) ??
    listingPoints[0] ??
    null;
  const selectedAreaData = knownAreas.find((area) => area.value === selectedArea) ?? null;

  function handleReset() {
    const map = mapRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    fitMapToPoints(
      window.google.maps,
      map,
      listingPoints.map((item) => ({ lat: item.lat, lng: item.lng })),
      FORT_MCMURRAY_CENTER,
      11
    );
  }

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>Rental inventory by area</h3>
          <p>Scan real rental pins, compare neighbourhoods, and open the right listing faster.</p>
        </div>
        <div className="local-map-mini-stats">
          <span>
            <strong>{listingPoints.length}</strong>
            <span>mapped rentals</span>
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
              <span>Live rental map</span>
            </>
          }
          status={status}
          onReset={handleReset}
          summary={
            selectedListingPoint ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected listing</span>
                  <strong>{selectedListingPoint.listing.title}</strong>
                  <p>
                    {formatCompactPrice(selectedListingPoint.listing.price)} · {selectedListingPoint.areaLabel}
                  </p>
                </div>
                <div className="local-map-summary-actions">
                  <Link href={`/listings/${selectedListingPoint.listing.slug}`} className="local-map-summary-link">
                    Open listing
                    <ArrowRight size={15} strokeWidth={2.4} />
                  </Link>
                  <Link
                    href={buildHref({ rentalArea: selectedListingPoint.area })}
                    className="local-map-summary-link is-secondary"
                  >
                    View area
                  </Link>
                </div>
              </div>
            ) : selectedAreaData ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected area</span>
                  <strong>{selectedAreaData.label}</strong>
                  <p>
                    {selectedAreaData.count} active rental{selectedAreaData.count === 1 ? "" : "s"} currently mapped
                    in this neighbourhood.
                  </p>
                </div>
                <Link href={buildHref({ rentalArea: selectedAreaData.value })} className="local-map-summary-link">
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
              <strong>Browse by area</strong>
            </div>

            <div className="local-map-chip-row">
              {knownAreas.map((area) => (
                <Link
                  key={area.value}
                  href={buildHref({ rentalArea: area.value })}
                  className={`local-map-chip${activeArea === area.value ? " is-active" : ""}`}
                >
                  <span>{area.label}</span>
                  <strong>{area.count}</strong>
                </Link>
              ))}
            </div>

            {activeArea ? (
              <Link href={buildHref({ rentalArea: undefined })} className="local-map-clear">
                Clear area filter
              </Link>
            ) : null}
          </div>

          <div className="local-map-sidebar-card">
            <strong>Why this is better</strong>
            <ul className="local-map-list">
              <li>Rentals now behave like real listing pins instead of abstract neighbourhood dots.</li>
              <li>Native Google pan and zoom feel familiar for Kijiji and Facebook Marketplace users.</li>
              <li>Area chips still narrow the feed, but the map now helps people pick a listing faster.</li>
            </ul>
            {unknownCount > 0 ? (
              <p className="local-map-empty-copy">
                {unknownCount} listing{unknownCount === 1 ? "" : "s"} still need a clearer area to land on the map.
              </p>
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
    if (!mapRootRef.current) {
      return;
    }

    if (configStatus === "missing-key") {
      setStatus("missing-key");
      return;
    }

    if (configStatus === "error") {
      setStatus("error");
      return;
    }

    if (!googleMapsConfig?.apiKey) {
      setStatus("loading");
      return;
    }
    const resolvedGoogleMapsConfig = googleMapsConfig;

    let cancelled = false;

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
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [endpointDataKey, mappedRouteListings, routeDataKey, endpoints, topRoutes, selectedEndpoint]);
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
                  Route chips become more precise as riders and drivers fill in departure and destination fields.
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

          <div className="local-map-sidebar-card">
            <strong>Why this is better</strong>
            <ul className="local-map-list">
              <li>The map now behaves like a real marketplace map with native Google zoom and pan.</li>
              <li>Endpoint markers and route lines stay familiar for users coming from Kijiji or Facebook.</li>
              <li>Route chips still refine the list, but the map now carries real browsing weight.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
