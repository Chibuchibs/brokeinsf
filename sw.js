/* The service worker — the half of "installable" that is not the manifest.

   It does one useful thing: keeps a copy of every file the game is made of,
   so a second visit opens instantly and a visit with no signal opens at all.
   That matters more here than it sounds. The game is played on a phone, on
   foot, and the place it is set has the worst reception in the city.

   The strategy is network-first with a cache fallback, NOT cache-first.
   Cache-first is faster by a few milliseconds and would have meant that
   every player who had ever opened the game was permanently stuck on
   whatever build they first saw, with no way to get a fix short of clearing
   site data. For a game that is still being changed every day, serving the
   stale copy only when the network actually fails is the right trade.

   Bump VERSION on release and the old cache is dropped on activate. */

const VERSION = 'brokeinsf-20261121141823';   // bump on release; drops the old cache
const SHELL = [
  './',
  './index.html',
  './game.js',
  './city.js',
  './walker.js',
  './traffic.js',
  './sound.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', e => {
  /* addAll rejects the whole install if any one file 404s, which would
     leave the game with no offline copy at all and no clue why. Each file
     is fetched on its own so a missing one costs only itself. */
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(SHELL.map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* Same origin only. Nothing else is ours to cache. */
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      /* Opaque and error responses are not worth keeping. */
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      const hit = await caches.match(req);
      if (hit) return hit;
      /* A navigation with nothing cached: hand back the game itself rather
         than the browser's dinosaur. */
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw new Error('offline and not cached');
    }
  })());
});
