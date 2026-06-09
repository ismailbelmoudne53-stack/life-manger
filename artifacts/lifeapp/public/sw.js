const CACHE_NAME = "lifeapp-v1";
const CACHE_NAME_STATIC = "lifeapp-static-v1";

// App shell — always cache these on install
const APP_SHELL = [
  "/",
  "/tasks",
  "/skills",
  "/translate",
  "/assistant",
  "/notes",
];

// On install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Non-fatal — shell pages may not all pre-render
      });
    })
  );
  self.skipWaiting();
});

// On activate: purge old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== CACHE_NAME_STATIC)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — network first, no caching
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: "You are offline. Please check your connection." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML pages) — network first, fall back to cached "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const root = await caches.match("/");
          return root ?? new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
