const VERSION = 'v1.0.3'; // Incremented version
const CACHE_PREFIX = 'moneyballs-cache';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;

// List of all files to cache
const PRECACHE_ASSETS = [
  // Core HTML
  '/',
  '/index.html',
  '/manifest.json',
  
  // Local JavaScript files
  '/js/app.js',
  '/js/store.js',
  '/js/vue.global.prod.js',
  '/js/vue-router.global.prod.js',
  '/js/quasar.umd.prod.js',
  '/js/axios.min.js',
  '/js/fr.umd.prod.js',
  '/js/en-US.umd.prod.js',
  '/js/ar.umd.prod.js',
  '/js/QCalendarMonth.umd.min.js',
  '/js/Timestamp.umd.min.js',
  
  // Local CSS files
  '/css/quasar.prod.css',
  '/css/transitions.css',
  '/css/shadows.css',
  '/css/mobile-swipe.css',
  '/css/fonts.css',
  
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
  '/favicon.ico'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(err => {
        console.error('[Service Worker] Cache addAll failed:', err);
        return Promise.resolve();
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
          if (key !== STATIC_CACHE && key.startsWith(CACHE_PREFIX)) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension:')) {
    return;
  }

  // For all requests, try cache first, then network
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
            caches.open(STATIC_CACHE).then(cache => {
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