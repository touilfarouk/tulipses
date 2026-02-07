const VERSION = 'v1.0.4'; // Incremented version
const CACHE_PREFIX = 'moneyballs-cache';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;

// Base path for GitHub Pages
const BASE_PATH = '/vite';

// List of all files to cache
const PRECACHE_ASSETS = [
  // Core HTML
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/offline.html`,
  `${BASE_PATH}/manifest.json`,
  
  // Local JavaScript files
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/store.js`,
  `${BASE_PATH}/js/offline.js`,
  `${BASE_PATH}/js/vue.global.prod.js`,
  `${BASE_PATH}/js/vue-router.global.prod.js`,
  `${BASE_PATH}/js/quasar.umd.prod.js`,
  `${BASE_PATH}/js/axios.min.js`,
  `${BASE_PATH}/js/fr.umd.prod.js`,
  `${BASE_PATH}/js/en-US.umd.prod.js`,
  `${BASE_PATH}/js/ar.umd.prod.js`,
  `${BASE_PATH}/js/QCalendarMonth.umd.min.js`,
  `${BASE_PATH}/js/Timestamp.umd.min.js`,
  
  // Local CSS files
  `${BASE_PATH}/css/quasar.prod.css`,
  `${BASE_PATH}/css/transitions.css`,
  `${BASE_PATH}/css/shadows.css`,
  `${BASE_PATH}/css/mobile-swipe.css`,
  `${BASE_PATH}/css/fonts.css`,
  `${BASE_PATH}/css/offline.css`,
  
  // Icons and assets
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
  `${BASE_PATH}/icons/favicon.ico`,
  `${BASE_PATH}/icons/favicon-128x128.png`,
  `${BASE_PATH}/icons/favicon-96x96.png`,
  `${BASE_PATH}/icons/favicon-32x32.png`,
  `${BASE_PATH}/icons/favicon-16x16.png`,
  
  // App resources
  `${BASE_PATH}/src/layouts/MainLayout.js`,
  `${BASE_PATH}/src/pages/PageEntries.js`,
  `${BASE_PATH}/src/pages/PageSettings.js`,
  `${BASE_PATH}/src/pages/utils.js`,
  `${BASE_PATH}/src/router/index.js`,
  `${BASE_PATH}/src/router/routes.js`,
  `${BASE_PATH}/src/use/useAmountColorClass.js`,
  `${BASE_PATH}/src/use/useCurrencify.js`
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

// Function to get the correct path for cache matching
const getCachePath = (url) => {
  const path = url.pathname;
  // If the path doesn't start with BASE_PATH, add it
  if (!path.startsWith(BASE_PATH)) {
    return `${BASE_PATH}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  return path;
};

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
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip cross-origin requests that aren't from our domain
  if (!url.pathname.startsWith(BASE_PATH) && url.origin === self.location.origin) {
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
            return caches.match(`${BASE_PATH}/offline.html`);
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