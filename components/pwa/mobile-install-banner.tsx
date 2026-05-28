"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "ismaconnect-mobile-install-banner-dismissed";
const PAGE_VIEWS_KEY = "ismaconnect-mobile-install-banner-page-views";
const FIRST_BROWSE_AT_KEY = "ismaconnect-mobile-install-banner-first-browse-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const INSTALL_DELAY_MS = 6500;

type MobileInstallBannerContext = "home" | "browse" | "ride-share" | "storefront";

function getContextCopy(context: MobileInstallBannerContext) {
  switch (context) {
    case "ride-share":
      return {
        title: "Pin ride-share to your home screen",
        detail: "Check camp routes, airport trips, and saved ride alerts in one tap."
      };
    case "storefront":
      return {
        title: "Keep storefront leads one tap away",
        detail: "Open messages, listings, and business updates faster from your home screen."
      };
    case "browse":
      return {
        title: "Install the app",
        detail: "Open ISMACONNECT faster and come back to new local matches with one tap."
      };
    case "home":
    default:
      return {
        title: "Add ISMACONNECT to your home screen",
        detail: "Make local rides, rentals, jobs, and messages feel more like an app."
      };
  }
}

function isIosDevice(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
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

export function MobileInstallBanner({
  context = "browse"
}: {
  context?: MobileInstallBannerContext;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [readyToPrompt, setReadyToPrompt] = useState(false);
  const contextCopy = getContextCopy(context);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentViews = Number(window.localStorage.getItem(PAGE_VIEWS_KEY) ?? "0") || 0;
    window.localStorage.setItem(PAGE_VIEWS_KEY, String(currentViews + 1));
    setInstalled(isStandaloneMode());
    setIsIos(isIosDevice(window.navigator.userAgent));

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
    const isDismissed = dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL_MS;
    setDismissed(isDismissed);

    if (!isDismissed && dismissedAt > 0) {
      window.localStorage.removeItem(DISMISS_KEY);
    }

    let firstBrowseAt = Number(window.sessionStorage.getItem(FIRST_BROWSE_AT_KEY) ?? "0");

    if (!firstBrowseAt) {
      firstBrowseAt = Date.now();
      window.sessionStorage.setItem(FIRST_BROWSE_AT_KEY, String(firstBrowseAt));
    }

    const remainingDelay = Math.max(0, INSTALL_DELAY_MS - (Date.now() - firstBrowseAt));
    const readyTimer = window.setTimeout(() => {
      setReadyToPrompt(true);
    }, remainingDelay);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_KEY);
      window.localStorage.removeItem(PAGE_VIEWS_KEY);
      window.sessionStorage.removeItem(FIRST_BROWSE_AT_KEY);
      setStatusMessage("Installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const copy = useMemo(() => {
    if (deferredPrompt) {
      return {
        title: contextCopy.title,
        detail: contextCopy.detail,
        label: "Install now"
      };
    }

    if (isIos) {
      return {
        title: contextCopy.title,
        detail: contextCopy.detail,
        label: "Show steps"
      };
    }

    return null;
  }, [contextCopy.detail, contextCopy.title, deferredPrompt, isIos]);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    setStatusMessage("");
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setDeferredPrompt(null);
      setStatusMessage("Install started");
      return;
    }

    setStatusMessage("Install dismissed");
  }

  function dismissBanner() {
    setDismissed(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  }

  const pageViews =
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem(PAGE_VIEWS_KEY) ?? "0") || 0
      : 0;
  const canShowBanner = readyToPrompt && (pageViews >= 1 || Boolean(deferredPrompt));

  if (installed || dismissed || !copy || !canShowBanner) {
    return null;
  }

  return (
    <div className={`mobile-install-banner${showIosSteps ? " is-expanded" : ""}`}>
      <div className="mobile-install-banner-copy">
        <strong>{copy.title}</strong>
        <span>{statusMessage || copy.detail}</span>
        {isIos && showIosSteps ? (
          <ol className="mobile-install-banner-steps">
            <li>Open ISMACONNECT in Safari.</li>
            <li>Tap the <Share2 aria-hidden="true" size={13} strokeWidth={2.2} /> share button.</li>
            <li>Choose <strong>Add to Home Screen</strong>.</li>
          </ol>
        ) : null}
      </div>

      <div className="mobile-install-banner-actions">
        {deferredPrompt ? (
          <button type="button" className="button button-secondary mobile-install-banner-button" onClick={handleInstall}>
            <Download aria-hidden="true" size={15} strokeWidth={2.2} />
            <span>{copy.label}</span>
          </button>
        ) : (
          <button
            type="button"
            className="mobile-install-banner-ios"
            onClick={() => setShowIosSteps((current) => !current)}
          >
            <Share2 aria-hidden="true" size={14} strokeWidth={2.2} />
            <span>{showIosSteps ? "Hide steps" : copy.label}</span>
          </button>
        )}

        <button
          type="button"
          className="mobile-install-banner-dismiss"
          aria-label="Dismiss install prompt"
          onClick={dismissBanner}
        >
          <X aria-hidden="true" size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
