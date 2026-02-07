// Service Worker for Moneyballs PWA
const CACHE_PREFIX = 'moneyballs-pwa';
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const BASE_PATH = '/vite';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

// Files to cache on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/js/vue.global.prod.js`,
  `${BASE_PATH}/js/vue-router.global.prod.js`,
  `${BASE_PATH}/js/quasar.umd.prod.js`,
  `${BASE_PATH}/js/axios.min.js`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/css/quasar.prod.css`,
  `${BASE_PATH}/css/fonts.css`,
  `${BASE_PATH}/manifest.json`,
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(STATIC_ASSETS).catch(error => {
          console.error('Failed to cache some resources:', error);
          throw error;
        });
      })
      .then(() => self.skipWaiting())
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
    .then(() => self.clients.claim())
  );
});

// Fetch event - cache first, then network strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || requestUrl.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with network-first strategy
  if (requestUrl.pathname.startsWith(`${BASE_PATH}/api/`)) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Clone the response
          const responseToCache = networkResponse.clone();
          
          // Cache the API response
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({ error: 'You are offline' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
  } 
  // Handle static assets with cache-first strategy
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, always try the network first
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, responseToCache);
              });

              return response;
            })
            .catch(() => {
              // If offline and no cache, return offline page
              return caches.match(OFFLINE_URL);
            });
        }

        // For other static assets, try the network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // For assets, return a fallback if available
            if (event.request.destination === 'image') {
              return caches.match(`${BASE_PATH}/icons/fallback-image.png`);
            }
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Offline'
            });
          });
      })
    );
  }
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync started');
    event.waitUntil(syncData());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-192x192.png`,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Moneyballs', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Helper function for background sync
async function syncData() {
  // Implement your background sync logic here
  console.log('[Service Worker] Syncing data in background...');
}