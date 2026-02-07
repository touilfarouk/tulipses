const VERSION = 'v1.0.1'; // Incremented version
const CACHE_PREFIX = 'moneyballs-cache';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${VERSION}`;

// List of files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  
  // Core JavaScript files
  '/js/app.js',
  '/js/store.js',
  '/main.js',
  '/manifest.json',
  
  // Layouts
  '/src/layouts/MainLayout.js',
  
  // Pages
  '/src/pages/PageEntries.js',
  '/src/pages/PageSettings.js',
  '/src/pages/utils.js',
  
  // Router
  '/src/router/index.js',
  '/src/router/routes.js',
  
  // Hooks
  '/src/use/useAmountColorClass.js',
  '/src/use/useCurrencify.js',
  
  // Icons and assets
  '/icons/favicon-128x128.png',
  '/icons/favicon-96x96.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/favicon.ico',
  
  // CSS files
  '/css/transitions.css',
  '/css/shadows.css',
  '/css/mobile-swipe.css'
];

// External CDN resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/vue-router@4.2.4/dist/vue-router.global.prod.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/axios@1.6.2/dist/axios.min.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/lang/fr.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/lang/en-US.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/lang/ar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/@quasar/quasar-ui-qcalendar/dist/QCalendarMonth.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@quasar/quasar-ui-qcalendar/dist/Timestamp.umd.min.js',
  'https://cdn.jsdelivr.net/npm/workbox-sw@7.0.0/build/workbox-sw.js',
  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons|Material+Icons+Outlined',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
  'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        return caches.open(DYNAMIC_CACHE)
          .then(cache => cache.addAll(EXTERNAL_RESOURCES));
      })
      .catch(err => {
        console.error('[Service Worker] Cache addAll failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key.startsWith(CACHE_PREFIX)) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Helper function to check if request is for an external resource
function isExternalResource(url) {
  const externalHosts = [
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  return externalHosts.some(host => url.includes(host));
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension:')) {
    return;
  }

  const requestUrl = new URL(request.url);
  
  // Handle external resources (CDN)
  if (isExternalResource(request.url)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(request)
          .then(networkResponse => {
            // Cache the response if valid
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              cache.put(request, responseToCache);
            }
            return networkResponse;
          })
          .catch(() => {
            // If network fails, try to get from cache
            return cache.match(request).then(cachedResponse => {
              return cachedResponse || new Response('CDN resource not available offline', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
      })
    );
    return;
  }

  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Cache successful API responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response(
              JSON.stringify({ error: 'You are offline and no cached data is available' }), 
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, try the network
      return fetch(request)
        .then(networkResponse => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(error => {
          console.log('Fetch failed:', error);
          // If the request is for a page, return the offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // For other requests, return a generic error response
          return new Response('You are offline and no cached content is available.', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});