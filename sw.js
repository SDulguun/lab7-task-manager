/* ═══════════════════════════════════════════════════════════
   sw.js — Service Worker (offline support + PWA install)
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'taskflow-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/animations.css',
  './css/mobile.css',
  './js/app.js',
  './js/storage.js',
  './js/render.js',
  './js/calendar.js',
  './js/chart.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

/* ── Install: cache all app shell assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: cache-first for app shell, network-first otherwise ── */
self.addEventListener('fetch', event => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
