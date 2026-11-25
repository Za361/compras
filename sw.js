// Offline support: serve everything from cache first (fast with bad signal in the shop),
// refresh the cache in the background so updates appear on the next launch.
// Bump VERSION whenever you change any file, to force a clean re-cache.
const VERSION = 'compras-v6';
const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  SDK + 'firebase-app.js', SDK + 'firebase-firestore.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Only the app's own files and the pinned Firebase SDK; live database traffic goes straight to the network.
  if (req.method !== 'GET' || (new URL(req.url).origin !== location.origin && !req.url.startsWith(SDK))) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    if (cached) { e.waitUntil(fresh); return cached; }
    return fresh;
  }));
});
