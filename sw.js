  // ================= CONFIG =================
const VERSION = 3;
const STATIC_CACHE = `moneyballs-static-v${VERSION}`;
const DYNAMIC_CACHE = `moneyballs-dynamic-v${VERSION}`;

// Only REAL files here - adjust paths based on deployment
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',

  // JavaScript files
  '/main.js',
  '/js/app.js',
  '/js/store.js',
  '/src/pages/PageEntries.js',
  '/src/pages/PageSettings.js',
  '/src/use/useAmountColorClass.js',
  '/src/use/useCurrencify.js',

  // CSS files
  '/css/mobile-swipe.css',
  '/css/shadows.css',
  '/css/transitions.css',

  // Icons that actually exist
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',

  // CDN
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js',
  'https://cdn.jsdelivr.net/npm/axios@1.6.2/dist/axios.min.js',
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'
];


  // ================= INSTALL =================
self.addEventListener("install", event => {
  console.log("SW installing v" + VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log("SW: Caching", STATIC_ASSETS.length, "static assets");

        // Cache each file individually with better error handling
        const cachePromises = STATIC_ASSETS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                console.log("SW: Cached:", url);
                return cache.put(url, response);
              } else {
                console.warn("SW: Failed to fetch:", url, response.status);
                return Promise.resolve();
              }
            })
            .catch(err => {
              console.warn("SW: Failed to cache:", url, err.message);
              return Promise.resolve();
            });
        });

        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log("SW: Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch(err => {
        console.error("SW: Cache installation failed:", err);
        // Continue with partial success
        return self.skipWaiting();
      })
  );
});

  // ================= ACTIVATE =================
self.addEventListener("activate", event => {
  console.log("SW activating v" + VERSION);

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => {
            console.log("SW: Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      console.log("SW: Activation complete");
      return self.clients.claim();
    })
  );
});

// ================= FETCH STRATEGIES =================

// Cache First Strategy for static assets
const cacheFirst = (request) => {
  return caches.match(request).then(cacheRes => {
    if (cacheRes) {
      console.log("SW: Cache First - Serving from cache:", request.url);
      return cacheRes;
    }

    return fetch(request).then(networkRes => {
      if (networkRes && networkRes.status === 200) {
        console.log("SW: Cache First - Caching new resource:", request.url);
        const responseClone = networkRes.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
      }
      return networkRes;
    }).catch(err => {
      console.warn("SW: Cache First - Network failed:", request.url, err.message);
      return new Response('Offline: Resource not available', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    });
  });
};

  // Network First Strategy for API calls
const networkFirst = (request) => {
  return fetch(request).then(networkRes => {
    if (networkRes && networkRes.status === 200) {
      console.log("SW: Network First - Caching API response:", request.url);
      const responseClone = networkRes.clone();
      caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
    }
    return networkRes;
  }).catch(() => {
    console.log("SW: Network First - Fallback to cache:", request.url);
    return caches.match(request);
  });
};

// Stale While Revalidate Strategy
const staleWhileRevalidate = (request) => {
  return caches.match(request).then(cacheRes => {
    const fetchPromise = fetch(request).then(networkRes => {
      if (networkRes && networkRes.status === 200) {
        console.log("SW: SWR - Updating cache:", request.url);
        const responseClone = networkRes.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
      }
      return networkRes;
    });

    if (cacheRes) {
      console.log("SW: SWR - Serving stale cache:", request.url);
      return cacheRes;
    }

    return fetchPromise;
  });
};

// ================= FETCH ROUTER =================
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http requests and chrome-extension requests
  if (!request.url.startsWith("http") || request.url.startsWith("chrome-extension://")) return;

  console.log("SW: Fetching:", request.url);

  // Route requests to appropriate strategy
  event.respondWith(
    // Static assets - Cache First
    (url.pathname.includes('/css/') ||
     url.pathname.includes('/js/') ||
     url.pathname.includes('/icons/') ||
     request.destination === 'script' ||
     request.destination === 'style' ||
     request.destination === 'image') ?
      cacheFirst(request) :

    // Navigation requests - Network First with SPA fallback
    request.mode === 'navigate' ?
      networkFirst(request).catch(() => {
        console.log("SW: Navigation fallback to index.html");
        return caches.match('/index.html');
      }) :

    // Everything else - Stale While Revalidate
    staleWhileRevalidate(request)
  );
});

  // ================= MESSAGE HANDLER =================
self.addEventListener("message", event => {
  console.log("SW: Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("SW: Skipping waiting");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_VERSION") {
    event.ports[0].postMessage({ version: VERSION });
  }
});

// ================= SYNC =================
self.addEventListener("sync", event => {
  console.log("SW: Sync event:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      console.log("SW: Background sync completed")
    );
  }
});

// ================= PERIODIC SYNC =================
self.addEventListener("periodicsync", event => {
  console.log("SW: Periodic sync:", event.tag);

  if (event.tag === "periodic-sync") {
    event.waitUntil(
      console.log("SW: Periodic sync completed")
    );
  }
});
