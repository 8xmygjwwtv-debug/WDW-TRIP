/* Service worker: app-shell cache + last-known live data when offline. */
const VERSION = 'wdw-v3';
const SHELL = ['/', '/index.html', '/app.js', '/data.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const DATA_CACHE = 'wdw-data-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== DATA_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isLive = (url.origin === location.origin && (url.pathname === '/api/tp' || url.pathname === '/api/deals')) || url.hostname === 'api.themeparks.wiki';
  if (isLive) {   // network first, fall back to the last copy we saw
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(DATA_CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then((m) => m || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'content-type': 'application/json' } }))));
    return;
  }
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return; // never cache send/prefs endpoints
  if (url.origin === location.origin) {   // our own files: network first so a new deploy shows immediately; cache only when offline
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
    return;
  }
  // Only cache our own files, fonts, Tailwind and Leaflet. Map tiles, weather, routing and Overpass always go straight to the network.
  const CACHEABLE = url.origin === location.origin || ['cdnjs.cloudflare.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
  if (!CACHEABLE) return;
  // stale-while-revalidate for the app shell, fonts and CDN libraries
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(req, { ignoreSearch: false });
    const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { net.catch(() => {}); return hit; }
    return (await net) || (req.mode === 'navigate' ? cache.match('/index.html') : Response.error());
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('/'))));
});
