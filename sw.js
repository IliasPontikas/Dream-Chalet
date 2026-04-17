/* sw.js — Service Worker: cache-first for offline support */

const CACHE = 'dream-chalet-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/animations.js',
  '/js/cursor.js',
  '/js/scroll-video.js',
  '/js/gallery.js',
  '/js/reviews.js',
  '/js/three-bg.js',
  '/js/map.js',
  '/js/calendar.js',
  '/js/i18n.js',
  '/js/cookie-consent.js',
  '/js/analytics.js',
  '/locales/el.json',
  '/locales/en.json',
  '/images/exterior1.avif',
  '/images/exterior2.avif',
  '/images/logo-removebg2.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
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

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(
      (cached) => cached || fetch(e.request).catch(() => caches.match('/index.html'))
    )
  );
});