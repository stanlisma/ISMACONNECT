"use client";

import { useEffect, useState } from "react";

import { FieldHelp } from "@/components/ui/field-help";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(normalized);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function BrowserNotificationSettings() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      Boolean(vapidPublicKey);

    setSupported(isSupported);
    setPermission(isSupported ? Notification.permission : "unsupported");
  }, [vapidPublicKey]);

  useEffect(() => {
    async function loadSubscriptionState() {
      if (!supported || !vapidPublicKey) {
        setLoadingState(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscribed(Boolean(existingSubscription));
      } catch (error) {
        console.error("Push subscription lookup failed:", error);
      } finally {
        setLoadingState(false);
      }
    }

    loadSubscriptionState();
  }, [supported, vapidPublicKey]);

  async function handleEnable() {
    if (!supported) {
      return;
    }

    setRequesting(true);
    setStatusMessage("");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setStatusMessage("Browser notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save push subscription.");
      }

      setSubscribed(true);
      setStatusMessage("Browser push notifications are enabled.");
    } catch (error) {
      console.error("Push subscribe failed:", error);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not enable browser push notifications."
      );
    } finally {
      setRequesting(false);
    }
  }

  async function handleDisable() {
    if (!supported) {
      return;
    }

    setRequesting(true);
    setStatusMessage("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setStatusMessage("Browser push notifications are turned off for this device.");
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      setStatusMessage("Could not turn off browser push notifications.");
    } finally {
      setRequesting(false);
    }
  }

  async function handleSendTest() {
    setSendingTest(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/push-subscriptions/test", {
        method: "POST"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not send a test notification.");
      }

      setStatusMessage("Test notification sent. Check this device now.");
    } catch (error) {
      console.error("Push test failed:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Could not send a test notification."
      );
    } finally {
      setSendingTest(false);
    }
  }

  const pushSummary =
    !supported
      ? "Push notifications need a supported browser plus VAPID keys configured in the app environment."
      : permission === "denied"
        ? "Notifications are blocked in this browser. Re-enable them from browser site settings to keep marketplace alerts active."
        : "Turn on browser push notifications to get instant alerts for new messages, boost activity, and verification updates even when ISMACONNECT is closed.";

  return (
    <div className="browser-notification-card">
      <div className="browser-notification-copy">
        <div className="browser-notification-title">
          <strong>Browser notifications</strong>
          <FieldHelp label="Browser notifications" text={pushSummary} />
        </div>
      </div>

      {!supported ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Unavailable</span>
          </div>
        </div>
      ) : loadingState ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Checking</span>
          </div>
        </div>
      ) : permission === "granted" && subscribed ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-success">Enabled</span>
          </div>
          <button
            className="button button-secondary"
            disabled={requesting || sendingTest}
            type="button"
            onClick={handleSendTest}
          >
            {sendingTest ? "Sending test..." : "Send test alert"}
          </button>
          <button
            className="button button-secondary"
            disabled={requesting || sendingTest}
            type="button"
            onClick={handleDisable}
          >
            {requesting ? "Updating..." : "Turn off on this device"}
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : permission === "granted" ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Permission granted</span>
          </div>
          <button
            className="button button-secondary"
            disabled={requesting}
            type="button"
            onClick={handleEnable}
          >
            {requesting ? "Connecting..." : "Finish enabling push"}
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : permission === "denied" ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Blocked</span>
          </div>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">Off</span>
          </div>
          <button
            className="button button-secondary"
            disabled={requesting}
            type="button"
            onClick={handleEnable}
          >
            {requesting ? "Enabling..." : "Enable notifications"}
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      )}
    </div>
  );
}
