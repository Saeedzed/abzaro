/*
 * Abzaro service worker — tiny, hand-written, no build step.
 *
 * Strategy
 *  - Static assets under /_next/static and the icons: cache-first (immutable).
 *  - Page navigations: network-first, falling back to the cached copy so the
 *    last visited tools keep working offline.
 *  - /ffmpeg/* is deliberately NOT cached: the core is 31 MB and would blow
 *    through the browser storage quota.
 */

const VERSION = "abzaro-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_PAGE = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_PAGE, "/tools"]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/ffmpeg/")) return;

  // Pages → network first, cache as a fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_PAGE)),
        ),
    );
    return;
  }

  // Static assets → cache first.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|woff2?|css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});
