"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "ismaconnect-mobile-install-banner-dismissed";

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

export function MobileInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setInstalled(isStandaloneMode());
    setIsIos(isIosDevice(window.navigator.userAgent));
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_KEY);
      setStatusMessage("Installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const copy = useMemo(() => {
    if (deferredPrompt) {
      return {
        title: "Install the app",
        detail: "Open ISMACONNECT faster and come back with one tap.",
        label: "Install now"
      };
    }

    if (isIos) {
      return {
        title: "Add to Home Screen",
        detail: "In Safari, tap Share, then Add to Home Screen.",
        label: "Safari steps"
      };
    }

    return null;
  }, [deferredPrompt, isIos]);

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
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
  }

  if (installed || dismissed || !copy) {
    return null;
  }

  return (
    <div className="mobile-install-banner">
      <div className="mobile-install-banner-copy">
        <strong>{copy.title}</strong>
        <span>{statusMessage || copy.detail}</span>
      </div>

      <div className="mobile-install-banner-actions">
        {deferredPrompt ? (
          <button type="button" className="button button-secondary mobile-install-banner-button" onClick={handleInstall}>
            <Download aria-hidden="true" size={15} strokeWidth={2.2} />
            <span>{copy.label}</span>
          </button>
        ) : (
          <span className="mobile-install-banner-ios">
            <Share2 aria-hidden="true" size={14} strokeWidth={2.2} />
            <span>{copy.label}</span>
          </span>
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
