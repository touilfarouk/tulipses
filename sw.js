// Service Worker for Tulipes PWA
console.log('[Service Worker] Script loaded');
const CACHE_PREFIX = 'Tulipes-pwa';
const CACHE_VERSION = 'v4'; // Incremented version to force update
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.js'
];
const BASE_PATH = '/vite';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

// Cache size limit in MB
const CACHE_SIZE_LIMIT = 50;

// Files to cache on install
const STATIC_ASSETS = [
  // HTML
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/offline.html`,

  // Core JS
  `${BASE_PATH}/js/vue.global.prod.js`,
  `${BASE_PATH}/js/vue-router.global.prod.js`,
  `${BASE_PATH}/js/quasar.umd.prod.js`,
  `${BASE_PATH}/js/axios.min.js`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/store.js`,

  // Component JS
  `${BASE_PATH}/src/layouts/MainLayout.js`,
  `${BASE_PATH}/src/components/AquaInput.js`,
  `${BASE_PATH}/src/pages/PageEntries.js`,
  `${BASE_PATH}/src/pages/PageSettings.js`,
  `${BASE_PATH}/src/pages/PageFormEntries.js`,

  // CSS
  `${BASE_PATH}/css/quasar.prod.css`,
  `${BASE_PATH}/css/fonts.css`,
  `${BASE_PATH}/css/shadows.css`,
  `${BASE_PATH}/css/transitions.css`,

  // Runtime SCSS
  `${BASE_PATH}/js/scss-runtime.js`,
  `${BASE_PATH}/src/css/quasar.variables.scss`,
  `${BASE_PATH}/src/css/app.scss`,

  // Fonts
  `${BASE_PATH}/css/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2`,
  `${BASE_PATH}/css/KFOmCnqEu92Fr1Mu4mxK.woff2`,

  // Manifest and icons
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
  `${BASE_PATH}/icons/favicon.ico`
];

// File types to cache dynamically
const DYNAMIC_CACHE_TYPES = [
  'script',
  'style',
  'font',
  'image',
  'manifest',
  'document'
];

// Handle messages from the page
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event fired');
  console.log('[Service Worker] Caching static assets:', STATIC_ASSETS);
  console.log('[Service Worker] Installing Service Worker...');

  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(STATIC_ASSETS.concat(CDN_ASSETS)).catch(error => {
          console.error('Failed to cache some resources:', error);
          // Don't fail the entire installation if some resources fail to cache
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired');
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

// Cache size management
async function cleanCache(cacheName, maxSize) {
  console.log(`[Service Worker] Cleaning cache: ${cacheName}`);
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    console.log(`[Service Worker] Cleaning up ${cacheName}`);
    await Promise.all(keys.slice(0, Math.floor(keys.length / 2)).map(key => cache.delete(key)));
  }
};

// Fetch event - cache first, then network strategy
self.addEventListener('fetch', (event) => {
  console.log(`[Service Worker] Fetch event: ${event.request.url}`);
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isStaticAsset = STATIC_ASSETS.some(asset =>
    requestUrl.href.endsWith(asset) ||
    (asset.endsWith('/') && requestUrl.pathname.startsWith(asset))
  );
  const isCdnAsset = CDN_ASSETS.includes(event.request.url);

  // Skip non-GET requests and non-http(s) requests
  if (event.request.method !== 'GET' ||
      !(requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (requestUrl.pathname.startsWith(`${BASE_PATH}/api/`)) {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(event.request, networkResponse.clone());
            await cleanCache(DYNAMIC_CACHE, 100); // Keep last 100 API responses
          }
          return networkResponse;
        })
        .catch(async () => {
          // If network fails, try to serve from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({
            error: 'You are offline',
            message: 'Please check your internet connection and try again.'
          }), {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
  // Handle CDN assets with cache-first strategy
  else if (isCdnAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetchAndCache(event.request, STATIC_CACHE, true))
        .catch(() => caches.match(OFFLINE_URL))
    );
  }
  // Handle static assets with cache-first strategy
  else if (isSameOrigin && isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetchAndCache(event.request))
        .catch(() => caches.match(OFFLINE_URL))
    );
  }
  // Handle other same-origin requests with network-first strategy
  else if (isSameOrigin) {
    event.respondWith(
      fetchAndCache(event.request)
        .catch(() => caches.match(event.request) || caches.match(OFFLINE_URL))
    );
  }
  // Handle cross-origin requests
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline', { status: 503 }))
    );
  }
});

// Helper function to fetch and cache responses
async function fetchAndCache(request, cacheName = DYNAMIC_CACHE, allowOpaque = false) {
  console.log(`[Service Worker] Fetching and caching: ${request.url}`);
  const response = await fetch(request);

  // Check if we received a valid response
  if (!response || response.status !== 200 || (!allowOpaque && response.type !== 'basic')) {
    return response;
  }

  // Don't cache responses with no-store header
  if (response.headers.get('cache-control')?.includes('no-store')) {
    return response;
  }

  // Clone the response
  const responseToCache = response.clone();

  // Cache the response
  const cache = await caches.open(cacheName);
  await cache.put(request, responseToCache);

  // Clean up old cache entries for dynamic cache only
  if (cacheName === DYNAMIC_CACHE) {
    await cleanCache(DYNAMIC_CACHE, 200);
  }

  return response;
}

// Log when the service worker is controlling the page
self.addEventListener('controllerchange', () => {
  console.log('[Service Worker] Controller changed, this service worker is now controlling the page');
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync started');
    event.waitUntil(syncData());
  }
});

// Helper function for background sync
async function syncData() {
  console.log('[Service Worker] Starting background sync...');

  try {
    // Example: Sync pending operations
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const syncPromises = requests
      .filter(request => request.url.includes('/api/') && request.method === 'POST')
      .map(async request => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
            console.log('[Service Worker] Synced and removed:', request.url);
          }
        } catch (error) {
          console.error('[Service Worker] Sync failed for:', request.url, error);
          throw error; // Will trigger the sync to retry
        }
      });

    await Promise.all(syncPromises);
    console.log('[Service Worker] Background sync completed');
    return self.registration.showNotification('Sync completed', {
      body: 'Your data has been synchronized',
      icon: `${BASE_PATH}/icons/icon-192x192.png`
    });
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
    throw error; // Will trigger the sync to retry
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    return;
  }

  const title = data.title || 'Tulipes';
  const options = {
    body: data.body || 'You have new updates',
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-192x192.png`,
    data: {
      url: data.url || `${BASE_PATH}/`,
      timestamp: Date.now()
    },
    vibrate: [100, 50, 100],
    requireInteraction: !!data.important,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
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
