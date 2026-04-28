/* sw.js — Service Worker: network-first for fresh updates, cache as offline fallback */

const CACHE = 'dream-chalet-v12';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/main.js',
  '/js/animations.js',
  '/js/cursor.js',
  '/js/scroll-video.js',
  '/js/gallery.js',
  '/js/reviews.js',
  '/js/three-bg.js',
  '/js/map.js',
  '/js/calendar.js',
  '/js/weather.js',
  '/js/i18n.js',
  '/js/cookie-consent.js',
  '/locales/el.json',
  '/locales/en.json',
  '/images/logo-removebg2.png',
  '/images/icons.svg',
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

/* Network-first: always try the network first, fall back to cache if offline */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  /* Skip cross-origin (CDN scripts, fonts, APIs) */
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        /* Update cache with fresh copy */
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match('/index.html')))
  );
});
