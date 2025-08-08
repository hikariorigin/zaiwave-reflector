// sw.js
const CACHE_NAME = 'nl-cache-v4';
const PRECACHE = ['.', 'index.html', 'manifest.webmanifest', /* アイコン等あれば */];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    self.skipWaiting(); // 旧SWを早期置換
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isGeo = url.pathname.endsWith('.geojson');
  const isJS  = url.pathname.endsWith('.js');

  // GeoJSON & JS はネット優先（キャッシュはフォールバック）
  if (isGeo || isJS) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        return fresh;
      } catch {
        const cached = await caches.match(e.request);
        return cached || new Response('', { status: 503 });
      }
    })());
    return;
  }

  // その他はキャッシュ優先→なければネット
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    return cached || fetch(e.request);
  })());
});