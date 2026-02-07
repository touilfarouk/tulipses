const VERSION = 'v1.0.0';
const CACHE_PREFIX = 'moneyballs-cache';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${VERSION}`;

// List of files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/main.js',
  '/manifest.json',
  
  // Icons and assets
  '/icons/favicon-128x128.png',
  '/icons/favicon-96x96.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/favicon.ico',
  
  // CSS files
  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons|Material+Icons+Outlined',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  '/css/transitions.css',
  '/css/shadows.css',
  '/css/mobile-swipe.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
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
  
  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests and chrome-extension requests
  if (!requestUrl.origin.startsWith(self.location.origin) || 
      requestUrl.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests with network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful API responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ error: 'You are offline and no cached data is available' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // For all other requests, use cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // Clone the response
          const responseToCache = networkResponse.clone();
          
          // Cache the response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            // Don't cache large files or non-GET requests
            if (event.request.method === 'GET' && 
                !event.request.url.includes('sockjs-node') &&
                !event.request.url.includes('hot-update')) {
              cache.put(event.request, responseToCache);
            }
          });
          
          return networkResponse;
        })
        .catch(() => {
          // If both cache and network fail, show a fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html')
              .then((offlinePage) => {
                return offlinePage || new Response('You are offline and no offline page is available.', {
                  status: 503,
                  statusText: 'Offline',
                  headers: new Headers({ 'Content-Type': 'text/plain' })
                });
              });
          }
          
          return new Response('You are offline and no cached content is available.', {
            status: 503,
            statusText: 'Offline',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync for data');
    // Implement your background sync logic here
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const title = 'Moneyballs';
  const options = {
    body: event.data?.text() || 'New update available!',
    icon: '/icons/favicon-96x96.png',
    badge: '/icons/favicon-96x96.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  // Focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle online/offline status updates
  if (event.data && event.data.ONLINE !== undefined) {
    console.log(`[Service Worker] App is ${event.data.ONLINE ? 'online' : 'offline'}`);
  }
});