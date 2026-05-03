const CACHE_NAME = 'kinnect-v1';

// Install — cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch — network-first strategy (always try live data, fall back to cache)
self.addEventListener('fetch', (event) => {
  // Skip non-GET and WebSocket requests
  if (event.request.method !== 'GET' || event.request.url.includes('/ws/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request);
      })
  );
});
