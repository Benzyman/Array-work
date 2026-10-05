// CardinalGIS service worker: makes the app installable and lets the app
// shell (page, styles, scripts, fonts) open quickly or without a network.
// Data (/api/...) and map tiles always come from the network.
const CACHE = 'cardinalgis-v1';
const SHELL = [
  '/', '/css/style.css', '/js/theme.js', '/js/coords.js', '/js/app.js',
  '/vendor/leaflet/leaflet.css', '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet-draw/leaflet.draw.css', '/vendor/leaflet-draw/leaflet.draw.js',
  '/vendor/proj4/proj4.js', '/vendor/inter/inter-latin-wght-normal.woff2',
  '/icons/logo.svg', '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // Network first so updates show straight away; fall back to the cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/'))),
  );
});
