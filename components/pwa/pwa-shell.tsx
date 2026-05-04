"use client";

import { useEffect, useRef, useState } from "react";

export function PwaShell() {
  const [updateReady, setUpdateReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setOffline(!navigator.onLine);

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let activeRegistration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        activeRegistration = registration;

        const syncUpdateState = () => {
          if (registration.waiting) {
            setUpdateReady(true);
          }
        };

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
              setUpdateReady(true);
            }
          });
        });
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    const handleControllerChange = () => {
      if (reloadingRef.current) {
        return;
      }

      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );

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
