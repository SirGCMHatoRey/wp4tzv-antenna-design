/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

// Offline shell for the static PWA (ADR-0001). Precache the built app +
// static assets on install; serve cache-first with a network fallback.
// All calculators are client-side math, so a cached shell = a working app offline.

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `adp-cache-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // don't touch cross-origin

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      // Prebuilt assets are immutable — serve straight from cache.
      if (ASSETS.includes(url.pathname)) {
        const cached = await cache.match(url.pathname);
        if (cached) return cached;
      }

      // Everything else: network-first, fall back to cache when offline.
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw new Error('offline and no cached response');
      }
    })()
  );
});
