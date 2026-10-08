
/* sw.js — Service Worker: network-first for fresh updates, cache as offline fallback */

const CACHE = 'dream-chalet-v45';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/theme.js',
  '/js/main.js',
  '/js/animations.js',
  '/js/scroll-video.js',
  '/js/gallery.js',
  '/js/reviews.js',
  '/js/map.js',
  '/js/calendar.js',
  '/js/weather.js',
  '/js/i18n.js',
  '/js/cookie-consent.js',
  '/locales/el.json',
  '/locales/en.json',
  '/images/logo-removebg2.png',
  '/images/icons.svg',
  '/vendor/cookieconsent/cookieconsent.css',
  '/vendor/cookieconsent/cookieconsent.umd.js',
  '/vendor/gsap/gsap.min.js',
  '/vendor/gsap/ScrollTrigger.min.js',
  '/vendor/gsap/ScrollToPlugin.min.js',
  '/vendor/gsap/Flip.min.js',
  '/vendor/gsap/Draggable.min.js',
  '/vendor/lenis/lenis.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Hosts whose URLs are immutable (versioned in path) — cache-first is safe */
const IMMUTABLE_HOSTS = new Set([
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.gstatic.com',
]);

/* Hosts that should NEVER be cached (live data) */
const NO_CACHE_HOSTS = new Set([
  'api.open-meteo.com',
  'tiles.openfreemap.org',
]);

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  /* Live APIs / map tiles: pass through, no caching */
  if (NO_CACHE_HOSTS.has(url.hostname)) return;

  /* Immutable CDN assets (versioned in URL): cache-first, fall back to network */
  if (url.origin !== self.location.origin && IMMUTABLE_HOSTS.has(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return response;
        });
      })
    );
    return;
  }

  /* Other cross-origin: pass through */
  if (url.origin !== self.location.origin) return;

  /* Same-origin: network-first, fall back to cache */
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(e.request).then(
          (c) => c
              || caches.match('/index.html').then((idx) => idx
              || new Response('Offline — please reconnect', {
                   status: 504,
                   statusText: 'Gateway Timeout',
                   headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                 }))
        )
      )
  );
});
