"use client";

import { CheckCircle2, Download, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FieldHelp } from "@/components/ui/field-help";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

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

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setInstalled(isStandaloneMode());
    setIsIos(isIosDevice(window.navigator.userAgent));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setStatusMessage("Installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const summary = useMemo(() => {
    if (installed) {
      return "ISMACONNECT is already installed on this device. Launch it from your home screen for the fastest mobile experience.";
    }

    if (deferredPrompt) {
      return "Install the app on this phone for faster loading, better launch behavior, and easier return visits.";
    }

    if (isIos) {
      return "To install on iPhone, open ISMACONNECT in Safari, tap Share, then choose Add to Home Screen.";
    }

    return "If your browser does not show an install prompt, open the browser menu and choose Install app or Add to Home Screen.";
  }, [deferredPrompt, installed, isIos]);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    setStatusMessage("");
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setStatusMessage("Install started on this device.");
      setDeferredPrompt(null);
      return;
    }

    setStatusMessage("Install was dismissed. You can try again anytime from this page.");
  }

  return (
    <div className="browser-notification-card install-app-card">
      <div className="browser-notification-copy">
        <div className="browser-notification-title">
          <strong>Install ISMACONNECT</strong>
          <FieldHelp label="Install ISMACONNECT" text={summary} />
        </div>
      </div>

      {installed ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-success">Installed</span>
            <span className="account-menu-pill is-muted">Home screen</span>
          </div>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : deferredPrompt ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-active">Ready to install</span>
          </div>
          <button className="button button-secondary" type="button" onClick={handleInstall}>
            <Download aria-hidden="true" size={16} strokeWidth={2.2} />
            Install app
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : isIos ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Safari</span>
            <span className="install-app-inline-tip">
              <Share2 aria-hidden="true" size={15} strokeWidth={2.2} />
              <span>Share</span>
              <span aria-hidden="true">-&gt;</span>
              <span>Add to Home Screen</span>
            </span>
          </div>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Browser menu</span>
            <span className="install-app-inline-tip">
              <CheckCircle2 aria-hidden="true" size={15} strokeWidth={2.2} />
              <span>Install app / Add to Home Screen</span>
            </span>
          </div>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      )}
    </div>
  );
}
