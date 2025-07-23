const CACHE_NAME = 'prayer-times-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle background sync for prayer notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'prayer-notification') {
    event.waitUntil(showPrayerNotification());
  }
});

function showPrayerNotification() {
  return self.registration.showNotification('🕌 Prayer Time', {
    body: 'It\'s time for prayer (Salah)',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'prayer-time',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  });
}