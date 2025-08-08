const CACHE_NAME = 'nl-cache-v1';
const ASSETS = ['.', 'index.html', 'app.js', 'manifest.webmanifest', 'resonance-spots.geojson'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});