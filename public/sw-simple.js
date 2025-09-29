// Simple service worker for PWA functionality
const CACHE_NAME = 'tugasin-pwa-v1.0.0';
const APP_SHELL = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL.filter(url => url)); // Filter out any undefined URLs
    }).catch(error => {
      console.error('[SW] Failed to cache app shell:', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
    ])
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and external requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache successful responses
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache same-origin requests
          if (url.origin === location.origin) {
            cache.put(request, responseToCache);
          }
        });
        
        return response;
      }).catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline');
        }
        
        // For other requests, return a basic offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        payload: { version: '1.0.0' }
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service worker loaded successfully');