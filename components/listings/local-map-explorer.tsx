"use client";

import Link from "next/link";
import { ArrowRight, Compass, MapPinned, Minus, Plus, RotateCcw, Route } from "lucide-react";
import { useId, useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from "react";

import { getRentalAreaCounts, getRideShareRouteCounts } from "@/lib/local-marketplace";
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

type MapCanvasProps = {
  badge: ReactNode;
  children: ReactNode;
  summary?: ReactNode;
};

const MIN_MAP_ZOOM = 1;
const MAX_MAP_ZOOM = 2.8;
const MAP_ZOOM_STEP = 0.22;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toStringFilterRecord(filters?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).map(([key, value]) => [key, typeof value === "boolean" ? String(value) : value])
  ) as Record<string, string | undefined>;
}

function MapCanvas({ badge, children, summary }: MapCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [zoom, setZoom] = useState(MIN_MAP_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  function clampOffset(nextOffset: { x: number; y: number }, nextZoom = zoom) {
    if (!stageRef.current) {
      return nextOffset;
    }

    const bounds = stageRef.current.getBoundingClientRect();
    const maxX = Math.max(0, (bounds.width * nextZoom - bounds.width) / 2);
    const maxY = Math.max(0, (bounds.height * nextZoom - bounds.height) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY)
    };
  }

  function updateZoom(delta: number) {
    setZoom((currentZoom) => {
      const nextZoom = clamp(Number((currentZoom + delta).toFixed(2)), MIN_MAP_ZOOM, MAX_MAP_ZOOM);
      setOffset((currentOffset) =>
        nextZoom === MIN_MAP_ZOOM ? { x: 0, y: 0 } : clampOffset(currentOffset, nextZoom)
      );
      return nextZoom;
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const target = stageRef.current;
    if (!target) {
      return;
    }

    target.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }

    const nextOffset = clampOffset({
      x: dragState.current.originX + (event.clientX - dragState.current.startX),
      y: dragState.current.originY + (event.clientY - dragState.current.startY)
    });

    setOffset(nextOffset);
  }

  function endDrag(event?: PointerEvent<HTMLDivElement>) {
    if (event && stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }

    dragState.current = null;
    setIsDragging(false);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    updateZoom(event.deltaY < 0 ? MAP_ZOOM_STEP : -MAP_ZOOM_STEP);
  }

  return (
    <div className="local-map-canvas">
      <div className="local-map-canvas-top">
        <div className="local-map-canvas-badge">{badge}</div>

        <div className="local-map-controls" aria-label="Map controls">
          <button
            type="button"
            className="local-map-control"
            onClick={() => updateZoom(MAP_ZOOM_STEP)}
            aria-label="Zoom in"
          >
            <Plus size={16} strokeWidth={2.3} />
          </button>
          <button
            type="button"
            className="local-map-control"
            onClick={() => updateZoom(-MAP_ZOOM_STEP)}
            aria-label="Zoom out"
          >
            <Minus size={16} strokeWidth={2.3} />
          </button>
          <button
            type="button"
            className="local-map-control local-map-control-reset"
            onClick={() => {
              setZoom(MIN_MAP_ZOOM);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Reset map view"
          >
            <RotateCcw size={15} strokeWidth={2.3} />
            <span>{Math.round(zoom * 100)}%</span>
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`local-map-stage${isDragging ? " is-dragging" : ""}`}
        onDoubleClick={() => updateZoom(MAP_ZOOM_STEP)}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerLeave={endDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onWheel={handleWheel}
      >
        <div className="local-map-stage-grid" aria-hidden="true" />

        <div
          className="local-map-scene"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
          }}
        >
          {children}
        </div>
      </div>

      <div className="local-map-stage-meta">
        <span>Drag to pan</span>
        <span>Double-click or use +/- to zoom</span>
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
  const routeGradientId = useId().replace(/:/g, "");
  const fillGradientId = useId().replace(/:/g, "");
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
        fillGradientId={fillGradientId}
        listings={listings}
      />
    );
  }

  return (
    <RideShareMapExplorer
      activeDeparture={typeof structuredFilters?.departureArea === "string" ? structuredFilters.departureArea : null}
      activeDestination={typeof structuredFilters?.destinationArea === "string" ? structuredFilters.destinationArea : null}
      buildHref={buildHref}
      fillGradientId={fillGradientId}
      listings={listings}
      routeGradientId={routeGradientId}
    />
  );
}

function RentalMapExplorer({
  activeArea,
  buildHref,
  fillGradientId,
  listings
}: {
  activeArea: string | null;
  buildHref: (overrides: Record<string, string | number | boolean | null | undefined>) => string;
  fillGradientId: string;
  listings: Listing[];
}) {
  const { knownAreas, unknownCount } = getRentalAreaCounts(listings);
  const [selectedArea, setSelectedArea] = useState<string | null>(activeArea ?? knownAreas[0]?.value ?? null);
  const selectedAreaData = knownAreas.find((area) => area.value === selectedArea) ?? null;

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>Rental inventory by area</h3>
          <p>Scan where active rentals are concentrated across Fort McMurray before opening every listing.</p>
        </div>
        <div className="local-map-mini-stats">
          <span>
            <strong>{knownAreas.length}</strong>
            <span>active areas</span>
          </span>
          <span>
            <strong>{unknownCount}</strong>
            <span>without area</span>
          </span>
        </div>
      </div>

      <div className="local-map-layout">
        <MapCanvas
          badge={
            <>
              <MapPinned aria-hidden="true" size={16} strokeWidth={2.3} />
              <span>Neighbourhood coverage</span>
            </>
          }
          summary={
            selectedAreaData ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected area</span>
                  <strong>{selectedAreaData.label}</strong>
                  <p>
                    {selectedAreaData.count} active rental{selectedAreaData.count === 1 ? "" : "s"} currently mapped
                    here.
                  </p>
                </div>
                <Link href={buildHref({ rentalArea: selectedAreaData.value })} className="local-map-summary-link">
                  View listings
                  <ArrowRight size={15} strokeWidth={2.4} />
                </Link>
              </div>
            ) : null
          }
        >
          <svg viewBox="0 0 100 100" className="local-map-svg" aria-hidden="true">
            <defs>
              <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(47, 109, 246, 0.16)" />
                <stop offset="100%" stopColor="rgba(21, 73, 183, 0.06)" />
              </linearGradient>
            </defs>
            <path
              d="M15,78 C12,59 20,34 33,20 C43,10 59,8 72,15 C84,22 90,35 87,53 C84,72 68,85 48,87 C30,88 18,86 15,78 Z"
              fill={`url(#${fillGradientId})`}
              stroke="rgba(21, 73, 183, 0.18)"
              strokeWidth="1.2"
            />

            {knownAreas.map((area) => (
              <g key={area.value}>
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={Math.min(8, 3.5 + area.count * 0.9)}
                  className={`local-map-node${selectedArea === area.value ? " is-active" : ""}`}
                />
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={Math.min(13, 7 + area.count)}
                  className={`local-map-node-pulse${selectedArea === area.value ? " is-active" : ""}`}
                />
              </g>
            ))}
          </svg>

          <div className="local-map-labels">
            {knownAreas.map((area) => (
              <button
                key={area.value}
                type="button"
                className={`local-map-label-button${selectedArea === area.value ? " is-active" : ""}`}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`
                }}
                onClick={() => setSelectedArea(area.value)}
              >
                <strong>{area.label}</strong>
                <span>{area.count}</span>
              </button>
            ))}
          </div>
        </MapCanvas>

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
            <strong>What this helps with</strong>
            <ul className="local-map-list">
              <li>Spot whether active rental supply is concentrated in Timberlea, Thickwood, Downtown, or Gregoire.</li>
              <li>Pair map view with furnished, short-term, and parking filters for worker-friendly searches.</li>
              <li>Use the structured area field when posting new rentals so buyers can find you faster.</li>
            </ul>
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
  fillGradientId,
  listings,
  routeGradientId
}: {
  activeDeparture: string | null;
  activeDestination: string | null;
  buildHref: (overrides: Record<string, string | number | boolean | null | undefined>) => string;
  fillGradientId: string;
  listings: Listing[];
  routeGradientId: string;
}) {
  const { routes, endpoints, flexibleCount } = getRideShareRouteCounts(listings);
  const topRoutes = routes.slice(0, 6);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(activeDeparture ?? activeDestination ?? null);
  const selectedEndpointData = endpoints.find((area) => area.value === selectedEndpoint) ?? null;

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>Ride-share routes at a glance</h3>
          <p>See where trips start, where they go, and which routes show up most often in active listings.</p>
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
        <MapCanvas
          badge={
            <>
              <Route aria-hidden="true" size={16} strokeWidth={2.3} />
              <span>Popular route pairs</span>
            </>
          }
          summary={
            selectedEndpointData ? (
              <div className="local-map-summary-inner">
                <div>
                  <span className="local-map-summary-eyebrow">Selected stop</span>
                  <strong>{selectedEndpointData.label}</strong>
                  <p>
                    {selectedEndpointData.count} route touchpoint{selectedEndpointData.count === 1 ? "" : "s"} in the
                    current results.
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
          <svg viewBox="0 0 100 100" className="local-map-svg" aria-hidden="true">
            <defs>
              <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(47, 109, 246, 0.16)" />
                <stop offset="100%" stopColor="rgba(21, 73, 183, 0.06)" />
              </linearGradient>
              <linearGradient id={routeGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(47, 109, 246, 0.82)" />
                <stop offset="100%" stopColor="rgba(21, 73, 183, 0.55)" />
              </linearGradient>
            </defs>
            <path
              d="M18,84 C21,66 28,49 38,33 C50,16 68,9 82,17 C92,23 92,37 87,49 C81,65 66,82 47,87 C33,91 22,89 18,84 Z"
              fill={`url(#${fillGradientId})`}
              stroke="rgba(21, 73, 183, 0.18)"
              strokeWidth="1.2"
            />

            {topRoutes.map((route, index) => {
              const midX = (route.departurePoint.x + route.destinationPoint.x) / 2;
              const midY = Math.min(route.departurePoint.y, route.destinationPoint.y) - 10 - index * 1.2;
              const isEndpointActive =
                selectedEndpoint === route.departure || selectedEndpoint === route.destination;

              return (
                <path
                  key={`${route.departure}-${route.destination}-${index}`}
                  d={`M ${route.departurePoint.x} ${route.departurePoint.y} Q ${midX} ${midY} ${route.destinationPoint.x} ${route.destinationPoint.y}`}
                  className={`local-map-route-line${
                    selectedEndpoint ? (isEndpointActive ? " is-active" : " is-dim") : ""
                  }`}
                  stroke={`url(#${routeGradientId})`}
                  strokeWidth={Math.min(4.6, 1.3 + route.count * 0.5)}
                />
              );
            })}

            {endpoints.map((area) => (
              <g key={area.value}>
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={Math.min(7.5, 3.4 + area.count * 0.55)}
                  className={`local-map-node${selectedEndpoint === area.value ? " is-active" : ""}`}
                />
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={Math.min(12, 6 + area.count * 0.8)}
                  className={`local-map-node-pulse${selectedEndpoint === area.value ? " is-active" : ""}`}
                />
              </g>
            ))}
          </svg>

          <div className="local-map-labels">
            {endpoints.map((area) => (
              <button
                key={area.value}
                type="button"
                className={`local-map-label-button${selectedEndpoint === area.value ? " is-active" : ""}`}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`
                }}
                onClick={() => setSelectedEndpoint(area.value)}
              >
                <strong>{area.label}</strong>
                <span>{area.count}</span>
              </button>
            ))}
          </div>
        </MapCanvas>

        <div className="local-map-sidebar">
          <div className="local-map-sidebar-card">
            <div className="local-map-sidebar-head">
              <Compass aria-hidden="true" size={16} strokeWidth={2.3} />
              <strong>Popular routes</strong>
            </div>

            <div className="local-map-route-list">
              {topRoutes.length ? (
                topRoutes.map((route) => (
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
                ))
              ) : (
                <p className="local-map-empty-copy">
                  Map routes become more useful as riders and drivers fill in departure and destination areas.
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
            <strong>How to get better matches</strong>
            <ul className="local-map-list">
              <li>Use airport, camp, Edmonton, and Calgary route filters before opening individual ride posts.</li>
              <li>Listings with departure, destination, and tool-space details are easier to trust and compare.</li>
              <li>Flexible trips still show up, but routes become more accurate as posters use the structured fields.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
