const CACHE_NAME = 'scanner-carico-v3';

const ASSETS = [
  '/Scanner-android-per-Carico-Tom/',
  '/Scanner-android-per-Carico-Tom/index.html',
  '/Scanner-android-per-Carico-Tom/manifest.json',
  // CDN
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js',
  // Font
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap',
];

// ── INSTALL: scarica e metti in cache tutto ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Cache miss:', url, err.message)
          )
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: elimina cache vecchie ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminata cache vecchia:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first per asset noti ──────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  const isCacheable =
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'unpkg.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === self.location.hostname;

  if (isCacheable) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
  }
});
