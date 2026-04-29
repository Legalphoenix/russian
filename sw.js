/**
 * Service worker for offline access to Russian language trainers.
 *
 * Strategy: Cache-first for static assets (HTML, CSS, JS, fonts),
 * network-first for API calls. Allows studying offline with
 * localStorage-backed trainers.
 */

const CACHE_NAME = "russian-trainers-v3";

const STATIC_ASSETS = [
  "/launcher/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/favicon.svg",
  "/possessives.html",
  "/possessives.js",
  "/possessives.css",
  "/colours/index.html",
  "/colours/app.js",
  "/colours/styles.css",
  "/plurals/index.html",
  "/plurals/app.js",
  "/plurals/styles.css",
  "/pronunciation/index.html",
  "/pronunciation/app.js",
  "/pronunciation/styles.css",
  "/sentences/index.html",
  "/sentences/app.js",
  "/sentences/styles.css",
  "/speed/",
  "/speed/index.html",
  "/speed/app.js",
  "/speed/styles.css",
  "/hvpt/index.html",
  "/hvpt/app.js",
  "/hvpt/styles.css",
  "/shared/utils.js",
  "/shared/sync.js",
  "/shared/srs.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: network-first, fall through silently on failure
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{"offline":true}', {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  // Google Fonts: cache-first (they rarely change)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      )
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        // Cache successful responses for same-origin requests
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
    )
  );
});
