import { getAnalyticsMeasurementId } from "@/lib/env";

type AnalyticsPrimitive = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsPrimitive | null | undefined>;

type ClientErrorPayload = {
  source: string;
  message: string;
  name?: string | null;
  stack?: string | null;
  pathname?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  metadata?: AnalyticsParams;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeAnalyticsParams(params: AnalyticsParams = {}) {
  const cleaned: Record<string, AnalyticsPrimitive> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "number" && !Number.isFinite(value)) {
      return;
    }

    cleaned[key] = typeof value === "string" ? value.slice(0, 200) : value;
  });

  return cleaned;
}

export function getClientAnalyticsMeasurementId() {
  return getAnalyticsMeasurementId();
}

export function trackMarketplaceEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, sanitizeAnalyticsParams(params));
}

export function trackPageView(route: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: route,
    page_location: `${window.location.origin}${route}`,
    page_title: document.title
  });
}

export async function reportClientError(payload: ClientErrorPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const body = {
    ...payload,
    pathname: payload.pathname ?? `${window.location.pathname}${window.location.search}`,
    userAgent: payload.userAgent ?? window.navigator.userAgent,
    metadata: sanitizeAnalyticsParams(payload.metadata ?? {})
  };

  try {
    await fetch("/api/monitoring/client-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      keepalive: true
    });
  } catch {
    // Ignore client-side monitoring failures.
  }
}
