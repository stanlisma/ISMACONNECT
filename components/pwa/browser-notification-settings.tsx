"use client";

import { useEffect, useState } from "react";

import { FieldHelp } from "@/components/ui/field-help";

type PushSubscriptionServerRecord = {
  endpoint: string;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_reason: string | null;
};

type PushSubscriptionsResponse = {
  subscriptions: PushSubscriptionServerRecord[];
  webPushConfigured: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(normalized);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function BrowserNotificationSettings() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [supported, setSupported] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(Boolean(vapidPublicKey));
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverSubscriptionCount, setServerSubscriptionCount] = useState(0);
  const [lastFailureReason, setLastFailureReason] = useState<string | null>(null);
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
    setServerConfigured(Boolean(vapidPublicKey));
    setPermission(isSupported ? Notification.permission : "unsupported");
  }, [vapidPublicKey]);

  useEffect(() => {
    async function loadSubscriptionState() {
      if (!supported || !vapidPublicKey) {
        setLoadingState(false);
        return;
      }

      await syncSubscriptionState();
    }

    loadSubscriptionState();
  }, [supported, vapidPublicKey]);

  async function getPushRegistration() {
    const existingRegistration = await navigator.serviceWorker.getRegistration();

    if (existingRegistration) {
      try {
        await existingRegistration.update();
      } catch {
        // Ignore update failures and continue with the active registration.
      }

      return existingRegistration;
    }

    return navigator.serviceWorker.ready;
  }

  async function fetchServerState() {
    const response = await fetch("/api/push-subscriptions", {
      cache: "no-store"
    });
    const data = (await response.json()) as PushSubscriptionsResponse & { error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Could not load push notification status.");
    }

    return data;
  }

  async function saveSubscriptionToServer(subscription: PushSubscription) {
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
  }

  async function syncSubscriptionState(options?: { repair?: boolean; showRepairMessage?: boolean }) {
    if (!supported || !vapidPublicKey) {
      setLoadingState(false);
      return;
    }

    const { repair = true, showRepairMessage = false } = options ?? {};

    try {
      setPermission(Notification.permission);
      const registration = await getPushRegistration();
      const localSubscription = await registration.pushManager.getSubscription();
      let serverState = await fetchServerState();
      let repaired = false;

      if (
        repair &&
        Notification.permission === "granted" &&
        localSubscription &&
        !serverState.subscriptions.some(
          (record) => record.endpoint === localSubscription.endpoint
        )
      ) {
        await saveSubscriptionToServer(localSubscription);
        serverState = await fetchServerState();
        repaired = true;
      }

      const localRecord = localSubscription
        ? serverState.subscriptions.find((record) => record.endpoint === localSubscription.endpoint) ?? null
        : null;

      setServerConfigured(serverState.webPushConfigured);
      setSubscribed(Boolean(localSubscription));
      setServerConnected(Boolean(localRecord));
      setServerSubscriptionCount(serverState.subscriptions.length);
      setLastFailureReason(localRecord?.failure_reason ?? null);

      if (repaired && showRepairMessage) {
        setStatusMessage("This device was reconnected for push alerts.");
      }
    } catch (error) {
      console.error("Push subscription lookup failed:", error);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not check push notification status."
      );
    } finally {
      setLoadingState(false);
    }
  }

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

      const registration = await getPushRegistration();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      await saveSubscriptionToServer(subscription);
      await syncSubscriptionState({ repair: false });
      setStatusMessage(
        serverConfigured
          ? "Browser push notifications are enabled."
          : "This device is connected. Push delivery is still being finalized for the app."
      );
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
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not remove this device from push notifications.");
        }

        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setServerConnected(false);
      setLastFailureReason(null);
      await syncSubscriptionState({ repair: false });
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
      await syncSubscriptionState({ repair: false });
    } catch (error) {
      console.error("Push test failed:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Could not send a test notification."
      );
    } finally {
      setSendingTest(false);
    }
  }

  async function handleReconnect() {
    setRequesting(true);
    setStatusMessage("");

    try {
      await syncSubscriptionState({ repair: true, showRepairMessage: true });
    } finally {
      setRequesting(false);
    }
  }

  const pushSummary =
    !supported
      ? "Push notifications need a supported browser plus VAPID keys configured in the app environment."
      : !serverConfigured
        ? "Push notifications are still being finalized for the app. You can still allow notifications on this device, then test again once delivery is fully ready."
      : permission === "denied"
        ? "Notifications are blocked in this browser. Re-enable them from browser site settings to keep marketplace alerts active."
        : "Turn on browser push notifications to get instant alerts for new messages, saved-search matches, boost activity, and verification updates even when ISMACONNECT is closed.";

  return (
    <div className="browser-notification-card">
      <div className="browser-notification-copy">
        <div className="browser-notification-title">
          <strong>Browser notifications</strong>
          <FieldHelp label="Browser notifications" text={pushSummary} />
        </div>
        <p>Enable push for this device so saved-search alerts and message replies reach you faster.</p>
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
            <span className="account-menu-pill is-muted">Checking this device</span>
          </div>
        </div>
      ) : permission === "granted" && subscribed && serverConnected ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-success">Enabled on this device</span>
            {serverSubscriptionCount > 1 ? (
              <span className="account-menu-pill is-muted">
                {serverSubscriptionCount} connected devices
              </span>
            ) : null}
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
            onClick={handleReconnect}
          >
            {requesting ? "Refreshing..." : "Reconnect this device"}
          </button>
          <button
            className="button button-secondary"
            disabled={requesting || sendingTest}
            type="button"
            onClick={handleDisable}
          >
            {requesting ? "Updating..." : "Turn off on this device"}
          </button>
          {lastFailureReason ? (
            <span className="browser-notification-note">
              Last delivery issue: {lastFailureReason}
            </span>
          ) : null}
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : permission === "granted" && subscribed ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-warning">Needs reconnect</span>
          </div>
          <button
            className="button button-secondary"
            disabled={requesting}
            type="button"
            onClick={handleReconnect}
          >
            {requesting ? "Reconnecting..." : "Reconnect this device"}
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      ) : permission === "granted" ? (
        <div className="browser-notification-actions">
          <div className="browser-notification-pill-row">
            <span className="account-menu-pill is-muted">
              {serverConfigured ? "Permission granted" : "Permission granted"}
            </span>
          </div>
          <button
            className="button button-secondary"
            disabled={requesting}
            type="button"
            onClick={handleEnable}
          >
            {requesting
              ? "Connecting..."
              : serverConfigured
                ? "Finish enabling push"
                : "Connect this device"}
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
            {requesting
              ? "Enabling..."
              : serverConfigured
                ? "Enable notifications"
                : "Allow notifications"}
          </button>
          {statusMessage ? <span className="browser-notification-note">{statusMessage}</span> : null}
        </div>
      )}
    </div>
  );
}
