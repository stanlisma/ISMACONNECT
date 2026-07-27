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

// Third-party in-app browsers (notably Facebook/Instagram's Android
// WebView) inject their own tracking scripts that throw errors we can't
// fix and that carry no useful information - most commonly a bare
// "Script error." with no stack (a cross-origin script the browser won't
// give details on) or a postMessage failure from their own native bridge
// tearing down mid-navigation. These aren't bugs in this app.
function isIgnorableClientError(payload: ClientErrorPayload) {
  const message = payload.message?.toLowerCase() ?? "";
  const filename = String(payload.metadata?.filename ?? "").toLowerCase();

  if (message === "script error." && !payload.stack) {
    return true;
  }

  if (filename.startsWith("iabjs://") || message.includes("java object is gone")) {
    return true;
  }

  return false;
}

export async function reportClientError(payload: ClientErrorPayload) {
  if (typeof window === "undefined" || isIgnorableClientError(payload)) {
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
