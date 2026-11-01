"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getClientAnalyticsMeasurementId,
  reportClientError,
  trackPageView
} from "@/lib/analytics";

type AnalyticsProviderProps = {
  userId?: string | null;
  nonce?: string;
};

type ReportableErrorPayload = Omit<Parameters<typeof reportClientError>[0], "source">;

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || "Unknown client error",
      stack: error.stack ?? null
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      stack: null
    };
  }

  return {
    name: "Error",
    message: "Unknown client error",
    stack: null
  };
}

export function AnalyticsProvider({ userId, nonce }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = getClientAnalyticsMeasurementId();
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const lastTrackedRouteRef = useRef<string | null>(null);
  const lastErrorSignatureRef = useRef<string | null>(null);

  const route = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!measurementId || !analyticsReady || lastTrackedRouteRef.current === route) {
      return;
    }

    trackPageView(route);
    lastTrackedRouteRef.current = route;
  }, [analyticsReady, measurementId, route]);

  // First-party, anonymous daily visit count for the admin Traffic page. Runs
  // independently of Google Analytics (which isn't configured in production)
  // and sends at most once per page per day per browser session.
  useEffect(() => {
    if (typeof window === "undefined" || !pathname || pathname.startsWith("/admin")) {
      return;
    }

    try {
      const sentKey = `ismaconnect-visit:${new Date().toDateString()}:${pathname}`;

      if (window.sessionStorage.getItem(sentKey)) {
        return;
      }

      window.sessionStorage.setItem(sentKey, "1");
    } catch {
      // Storage blocked - the server still dedupes per visitor, page and day.
    }

    let source: string | null = null;

    try {
      const referrerHost = document.referrer ? new URL(document.referrer).host.toLowerCase() : "";

      if (referrerHost && referrerHost !== window.location.host.toLowerCase()) {
        source = referrerHost.replace(/^www\./, "");
      } else if (new URLSearchParams(window.location.search).has("fbclid")) {
        // Facebook's in-app browser usually strips the referrer but keeps fbclid.
        source = "facebook.com";
      }
    } catch {
      source = null;
    }

    void fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, source }),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    const capture = (source: string, payload: ReportableErrorPayload) => {
      const signature = `${source}:${payload.message}:${payload.pathname ?? route}`;

      if (lastErrorSignatureRef.current === signature) {
        return;
      }

      lastErrorSignatureRef.current = signature;

      reportClientError({
        ...payload,
        source,
        userId,
        pathname: payload.pathname ?? route
      });
    };

    const handleError = (event: ErrorEvent) => {
      const details = getErrorDetails(event.error ?? event.message);
      capture("window-error", {
        ...details,
        metadata: {
          filename: event.filename ?? null,
          line: event.lineno ?? null,
          column: event.colno ?? null
        }
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const details = getErrorDetails(event.reason);
      capture("unhandledrejection", {
        ...details,
        metadata: {
          reasonType: typeof event.reason
        }
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [route, userId]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        onReady={() => setAnalyticsReady(true)}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
