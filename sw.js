// --- CONFIG ---
const version = 1; // bump only when static assets change
const staticCache = `moneyballsCache-v${version}`;
const dynamicCache = "moneyballsDynamicCache"; // fixed, keeps data across updates

const cacheList = [
  '/vite/',
  '/vite/index.html',
  '/vite/main.js',
  '/vite/manifest.json',
  '/vite/js/app.js',
  '/vite/js/store.js',
  '/vite/css/transitions.css',
  '/vite/css/shadows.css',
  '/vite/css/mobile-swipe.css',
  '/vite/icons/favicon-16x16.png',
  '/vite/icons/favicon-32x32.png',
  '/vite/icons/favicon-48x48.png',
  '/vite/icons/favicon.ico',
  '/vite/icons/android-chrome-36x36.png',
  '/vite/icons/android-chrome-48x48.png',
  '/vite/icons/android-chrome-72x72.png',
  '/vite/icons/android-chrome-96x96.png',
  '/vite/icons/android-chrome-144x144.png',
  '/vite/icons/android-chrome-192x192.png',
  '/vite/icons/android-chrome-256x256.png',
  '/vite/icons/android-chrome-384x384.png',
  '/vite/icons/android-chrome-512x512.png',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js',
  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons|Material+Icons+Outlined'
];

// --- INSTALL ---
self.addEventListener('install', (ev) => {
  console.log('SW: Installing and caching static assets');
  console.log('SW: Caching static assets:', cacheList);

  ev.waitUntil(
    caches.open(staticCache).then(cache => {
      // Add files one by one to handle failures gracefully
      return Promise.allSettled(
        cacheList.map(url =>
          cache.add(url).catch(err => {
            console.warn('SW: Failed to cache:', url, err);
            return null;
          })
        )
      );
    }).then(() => {
      console.log('SW: Static assets cached successfully');
      self.skipWaiting();
    }).catch(err => {
      console.error('SW: Cache installation failed:', err);
    })
  );
});

// --- ACTIVATE ---
self.addEventListener('activate', (ev) => {
  console.log('SW: Activating new service worker');
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // Delete old static caches
        keys
          .filter((key) => key.startsWith("moneyballsCache-v") && key !== staticCache)
          .map((key) => {
            console.log('SW: Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('SW: Service worker activated');
      return self.clients.claim();
    }).catch(err => {
      console.error('SW: Activation failed:', err);
    })
  );
});

// --- FETCH (Stale-While-Revalidate) ---
self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  const url = new URL(request.url);

  console.log('SW: Fetching:', request.url);

  ev.respondWith(
    caches.match(request).then((cacheRes) => {
      // Return cached version immediately if available
      if (cacheRes) {
        console.log('SW: Serving from cache:', request.url);
        // Update cache in background
        fetch(request).then(fetchRes => {
          if (fetchRes && fetchRes.status === 200) {
            caches.open(dynamicCache).then(cache => {
              cache.put(request, fetchRes.clone());
            });
          }
        }).catch(() => {
          console.log('SW: Background fetch failed, using cache');
        });
        return cacheRes;
      }

      // If not in cache, fetch from network
      return fetch(request).then(fetchRes => {
        console.log('SW: Serving from network:', request.url);

        // Cache successful responses
        if (fetchRes && fetchRes.status === 200) {
          caches.open(dynamicCache).then(cache => {
            cache.put(request, fetchRes.clone());
          });
        }

        return fetchRes;
      }).catch(err => {
        console.log('SW: Network failed, trying cache fallback:', err);

        // For navigation requests, try to serve index.html (handle SPA routing)
        if (request.mode === 'navigate') {
          // Handle GitHub Pages SPA routing with /vite/ prefix
          if (request.url.includes('/vite/')) {
            return caches.match('/vite/index.html');
          }
          return caches.match('/index.html');
        }

        // Return a basic offline response for other requests
        return new Response('Offline - No network connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// --- SYNC ---
self.addEventListener('sync', (ev) => {
  console.log('SW: Sync event triggered:', ev.tag);
  if (ev.tag === 'sync-database') {
    ev.waitUntil(
      console.log('SW: Database sync completed')
    );
  }
});

// --- MESSAGE HANDLER ---
self.addEventListener('message', (ev) => {
  console.log("SW message received:", ev.data);

  if (ev.data && ev.data.ONLINE !== undefined) {
    console.log('SW: Online status changed to:', ev.data.ONLINE);
  }

  if (ev.data && ev.data.action === 'SKIP_WAITING') {
    console.log('SW: Skipping waiting');
    self.skipWaiting();
  }
});

// --- Background Sync for periodic updates ---
self.addEventListener('periodicsync', (ev) => {
  console.log('SW: Periodic sync triggered:', ev.tag);
  if (ev.tag === 'sync-database') {
    ev.waitUntil(
      console.log('SW: Periodic database sync completed')
    );
  }
});
