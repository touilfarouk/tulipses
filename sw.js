// ================= CONFIG =================
const VERSION = 2;
const STATIC_CACHE = `moneyballs-static-v${VERSION}`;
const DYNAMIC_CACHE = `moneyballs-dynamic-v${VERSION}`;

// Only REAL files here
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',

  // Icons
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon.ico',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',

  // CDN
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js',
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'
];

// ================= INSTALL =================
self.addEventListener("install", event => {
  console.log("SW installing...");

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ================= ACTIVATE =================
self.addEventListener("activate", event => {
  console.log("SW activating...");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ================= FETCH =================
self.addEventListener("fetch", event => {

  // Ignore chrome-extension requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then(cacheRes => {

      if (cacheRes) return cacheRes;

      return fetch(event.request)
        .then(networkRes => {

          if (networkRes.status === 200) {
            return caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, networkRes.clone());
              return networkRes;
            });
          }

          return networkRes;
        })
        .catch(() => {
          // SPA fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          return new Response("Offline", { status: 503 });
        });
    })
  );
});
