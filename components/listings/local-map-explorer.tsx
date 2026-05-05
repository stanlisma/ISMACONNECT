import Link from "next/link";
import { Compass, MapPinned, Route } from "lucide-react";

import {
  getRentalAreaCounts,
  getRideShareRouteCounts
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

function toStringFilterRecord(filters?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).map(([key, value]) => [key, typeof value === "boolean" ? String(value) : value])
  ) as Record<string, string | undefined>;
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
    const { knownAreas, unknownCount } = getRentalAreaCounts(listings);
    const activeArea = typeof structuredFilters?.rentalArea === "string" ? structuredFilters.rentalArea : null;

    return (
      <div className="local-map-shell surface">
        <div className="local-map-shell-head">
          <div>
            <span className="eyebrow">Map view</span>
            <h3>Rental inventory by area</h3>
            <p>
              Scan where active rentals are concentrated across Fort McMurray before opening every listing.
            </p>
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
          <div className="local-map-canvas">
            <div className="local-map-canvas-badge">
              <MapPinned aria-hidden="true" size={16} strokeWidth={2.3} />
              <span>Neighbourhood coverage</span>
            </div>

            <svg viewBox="0 0 100 100" className="local-map-svg" aria-hidden="true">
              <defs>
                <linearGradient id="local-map-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(47, 109, 246, 0.14)" />
                  <stop offset="100%" stopColor="rgba(21, 73, 183, 0.06)" />
                </linearGradient>
              </defs>
              <path
                d="M15,78 C12,59 20,34 33,20 C43,10 59,8 72,15 C84,22 90,35 87,53 C84,72 68,85 48,87 C30,88 18,86 15,78 Z"
                fill="url(#local-map-fill)"
                stroke="rgba(21, 73, 183, 0.18)"
                strokeWidth="1.2"
              />

              {knownAreas.map((area) => (
                <g key={area.value}>
                  <circle
                    cx={area.x}
                    cy={area.y}
                    r={Math.min(8, 3.5 + area.count * 0.9)}
                    className="local-map-node"
                  />
                  <circle
                    cx={area.x}
                    cy={area.y}
                    r={Math.min(13, 7 + area.count)}
                    className="local-map-node-pulse"
                  />
                </g>
              ))}
            </svg>

            <div className="local-map-labels">
              {knownAreas.map((area) => (
                <div
                  key={area.value}
                  className="local-map-label"
                  style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`
                  }}
                >
                  <strong>{area.label}</strong>
                  <span>{area.count}</span>
                </div>
              ))}
            </div>
          </div>

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

  const { routes, endpoints, flexibleCount } = getRideShareRouteCounts(listings);
  const topRoutes = routes.slice(0, 6);
  const activeDeparture = typeof structuredFilters?.departureArea === "string" ? structuredFilters.departureArea : null;
  const activeDestination = typeof structuredFilters?.destinationArea === "string" ? structuredFilters.destinationArea : null;

  return (
    <div className="local-map-shell surface">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <h3>Ride-share routes at a glance</h3>
          <p>
            See where trips start, where they go, and which routes show up most often in active listings.
          </p>
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
        <div className="local-map-canvas">
          <div className="local-map-canvas-badge">
            <Route aria-hidden="true" size={16} strokeWidth={2.3} />
            <span>Popular route pairs</span>
          </div>

          <svg viewBox="0 0 100 100" className="local-map-svg" aria-hidden="true">
            <defs>
              <linearGradient id="route-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(47, 109, 246, 0.82)" />
                <stop offset="100%" stopColor="rgba(21, 73, 183, 0.55)" />
              </linearGradient>
            </defs>
            <path
              d="M18,84 C21,66 28,49 38,33 C50,16 68,9 82,17 C92,23 92,37 87,49 C81,65 66,82 47,87 C33,91 22,89 18,84 Z"
              fill="url(#local-map-fill)"
              stroke="rgba(21, 73, 183, 0.18)"
              strokeWidth="1.2"
            />

            {topRoutes.map((route, index) => {
              const midX = (route.departurePoint.x + route.destinationPoint.x) / 2;
              const midY =
                Math.min(route.departurePoint.y, route.destinationPoint.y) - 10 - index * 1.2;

              return (
                <path
                  key={`${route.departure}-${route.destination}-${index}`}
                  d={`M ${route.departurePoint.x} ${route.departurePoint.y} Q ${midX} ${midY} ${route.destinationPoint.x} ${route.destinationPoint.y}`}
                  className="local-map-route-line"
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
                  className="local-map-node"
                />
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={Math.min(12, 6 + area.count * 0.8)}
                  className="local-map-node-pulse"
                />
              </g>
            ))}
          </svg>

          <div className="local-map-labels">
            {endpoints.map((area) => (
              <div
                key={area.value}
                className="local-map-label"
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`
                }}
              >
                <strong>{area.label}</strong>
                <span>{area.count}</span>
              </div>
            ))}
          </div>
        </div>

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
                    <span className="local-map-route-arrow">→</span>
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
