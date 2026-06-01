// Service worker — offline-first caching for the prototype.
//
// Strategy: cache-first for the known app shell so the game launches with no
// network (important when installed to a home screen). Bump CACHE_VERSION to
// invalidate old caches when files change.

const CACHE_VERSION = "shift-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/main.js",
  "./src/engine/PuzzleMechanic.js",
  "./src/engine/LightsOut.js",
  "./src/engine/JewelShelves.js",
  "./src/engine/mechanics.js",
  "./src/engine/levelGenerator.js",
  "./src/engine/EventBus.js",
  "./src/engine/GameState.js",
  "./src/engine/SaveManager.js",
  "./src/ui/BoardRenderer.js",
  "./src/ui/ShelfRenderer.js",
  "./levels/jewels.json",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache same-origin successful responses for next time.
          if (response.ok && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
