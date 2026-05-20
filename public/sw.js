const CACHE_NAME = "ismaconnect-shell-v3";
const PAGE_CACHE_NAME = "ismaconnect-pages-v1";
const OFFLINE_URL = "/offline-fallback.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/logo/logo-light.svg"
];
const CACHEABLE_DESTINATIONS = new Set(["style", "script", "image", "font"]);
const PRIVATE_PATH_PREFIXES = [
  "/account",
  "/admin",
  "/auth",
  "/dashboard",
  "/messages",
  "/notifications",
  "/saved",
  "/settings"
];

function isPublicNavigation(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (PRIVATE_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  return (
    url.pathname === "/" ||
    url.pathname === "/browse" ||
    url.pathname === "/businesses" ||
    url.pathname.startsWith("/categories/") ||
    url.pathname.startsWith("/listings/") ||
    url.pathname.startsWith("/sellers/") ||
    url.pathname.startsWith("/privacy") ||
    url.pathname.startsWith("/terms") ||
    url.pathname.startsWith("/safety") ||
    url.pathname.startsWith("/about") ||
    url.pathname.startsWith("/contact")
  );
}

async function handlePublicNavigation(request) {
  const cache = await caches.open(PAGE_CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return caches.match(OFFLINE_URL);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== PAGE_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();

  event.waitUntil(
    self.registration.showNotification(payload.title || "ISMACONNECT", {
      body: payload.body || "You have a new marketplace update.",
      data: {
        url: payload.url || "/notifications"
      },
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
      tag: payload.tag || `push-${Date.now()}`
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      isPublicNavigation(url)
        ? handlePublicNavigation(request)
        : fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (!CACHEABLE_DESTINATIONS.has(request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const targetUrl = event.notification?.data?.url || "/notifications";

  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
