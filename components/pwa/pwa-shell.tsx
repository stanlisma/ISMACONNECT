"use client";

import { useEffect, useRef, useState } from "react";

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function syncStandaloneModeClass() {
  if (typeof window === "undefined") {
    return false;
  }

  const standalone = isStandaloneMode();
  document.documentElement.classList.toggle("app-standalone", standalone);
  document.body.classList.toggle("app-standalone", standalone);
  return standalone;
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function shouldDisableServiceWorker() {
  if (typeof window === "undefined") {
    return true;
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function PwaShell() {
  const [updateReady, setUpdateReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const refreshStandaloneMode = () => {
      syncStandaloneModeClass();
    };

    refreshStandaloneMode();
    setOffline(!navigator.onLine);

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("appinstalled", refreshStandaloneMode);
    mediaQuery?.addEventListener?.("change", refreshStandaloneMode);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("appinstalled", refreshStandaloneMode);
      mediaQuery?.removeEventListener?.("change", refreshStandaloneMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (shouldDisableServiceWorker()) {
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          await Promise.all(registrations.map((registration) => registration.unregister()));

          if ("caches" in window) {
            const cacheKeys = await window.caches.keys();
            await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
          }

          const reloadKey = "ismaconnect-local-sw-reset";
          if (navigator.serviceWorker.controller && !window.sessionStorage.getItem(reloadKey)) {
            window.sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
            return;
          }

          window.sessionStorage.removeItem(reloadKey);
        })
        .catch(() => undefined);

      return;
    }

    const runtimeWindow = window as WindowWithIdleCallback;
    let activeRegistration: ServiceWorkerRegistration | null = null;
    let cancelled = false;
    let timeoutId: number | null = null;
    let idleCallbackId: number | null = null;
    const shouldAutoApplyUpdate =
      window.location.pathname === "/" ||
      window.location.pathname === "/browse" ||
      window.location.pathname.startsWith("/categories/");
    const registerServiceWorker = () => {
      if (cancelled) {
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          activeRegistration = registration;

          const syncUpdateState = () => {
            if (registration.waiting) {
              if (shouldAutoApplyUpdate) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
                return;
              }

              setUpdateReady(true);
            }
          };

          registration.update().catch(() => undefined);
          syncUpdateState();

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;

            if (!installingWorker) {
              return;
            }

            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                syncUpdateState();
              }
            });
          });
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    if (runtimeWindow.requestIdleCallback) {
      idleCallbackId = runtimeWindow.requestIdleCallback(registerServiceWorker, {
        timeout: 1200
      });
    } else {
      timeoutId = window.setTimeout(registerServiceWorker, 250);
    }

    const handleControllerChange = () => {
      if (reloadingRef.current) {
        return;
      }

      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );

      if (idleCallbackId !== null) {
        runtimeWindow.cancelIdleCallback?.(idleCallbackId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (activeRegistration?.waiting) {
        activeRegistration.waiting.postMessage({ type: "KEEP_WAITING" });
      }
    };
  }, []);

  async function handleUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration?.waiting) {
      setUpdateReady(false);
      return;
    }

    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <>
      {offline ? (
        <div className="app-status-banner app-status-banner-offline">
          You&apos;re offline. ISMACONNECT will keep the last-loaded pages available and refresh when you&apos;re back online.
        </div>
      ) : null}

      {updateReady ? (
        <div className="app-status-banner app-status-banner-update">
          <span>A fresh version of ISMACONNECT is ready.</span>
          <button className="button" type="button" onClick={handleUpdate}>
            Update now
          </button>
        </div>
      ) : null}
    </>
  );
}
