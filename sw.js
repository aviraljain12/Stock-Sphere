/**
 * sw.js - Stock-Sphere Service Worker
 * Caches static assets for offline functionality
 */

const CACHE_NAME = 'stock-sphere-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './inventory.html',
  './suppliers.html',
  './reports.html',
  './login.html',
  './styles.css',
  './app.js',
  './themes.js',
  './gamification.js',
  './ai-predictions.js',
  './social.js',
  './command-palette.js',
  './toast.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets...');
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('[SW] Some assets failed to cache:', err));
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first strategy for static, network-first for others
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      }).catch(() => {
        // Return offline fallback for HTML pages
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Stock-Sphere notification',
    icon: data.icon || './favicon.ico',
    badge: './favicon.ico',
    vibrate: [100, 50, 100],
    data: { url: data.url || './' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Stock-Sphere', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || './'));
});
