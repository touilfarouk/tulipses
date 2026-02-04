// Service Worker for Moneyballs PWA
const CACHE_NAME = 'moneyballs-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/js/store.js',
  '/src/layouts/MainLayout.js',
  '/src/pages/PageEntries.js',
  '/src/pages/PageSettings.js',
  '/src/router/index.js',
  '/src/router/routes.js',
  '/css/transitions.css',
  '/css/shadows.css',
  '/css/mobile-swipe.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/vue-router@4.2.4/dist/vue-router.global.prod.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.umd.prod.js',
  'https://cdn.jsdelivr.net/npm/quasar@2.12.0/dist/quasar.prod.css',
  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons|Material+Icons+Outlined'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return cached version if available
          console.log('Service Worker: Network failed, serving from cache');
          return caches.match(event.request);
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync operations
  console.log('Service Worker: Background sync completed');
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore this new world',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Moneyballs', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
