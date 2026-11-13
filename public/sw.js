// JournalStream Service Worker for Progressive Web App (PWA)
const CACHE_NAME = 'journal-stream-pwa-v25';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Never intercept dev server internals, HMR, modules, or vite
  if (
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/src/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.includes('node_modules') || 
    url.pathname.includes('vite') || 
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // Network-First for HTML document navigation to always deliver the latest live code
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache and fetch update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    }).catch(() => fetch(event.request))
  );
});

// ============================================================================
// Web Push API & Device Notifications Handling
// Memungkinkan notifikasi muncul di HP maupun laptop meskipun halaman tidak aktif
// ============================================================================

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'ASCEND Journal', body: event.data.text() };
    }
  }

  const title = data.title || 'ASCEND Reminder';
  const options = {
    body: data.body || 'Pengingat agenda & jurnal harian Anda.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'ascend-push-alert',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Aksi ketika pengguna mengetuk/mengklik notifikasi pada sistem OS / tray HP & Laptop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Menerima pesan internal dari client app untuk memicu notifikasi sistem
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_DEVICE_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: options?.tag || 'ascend-device-notification',
      renotify: true,
      data: {
        url: options?.url || '/',
        timestamp: Date.now()
      },
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || 'ASCEND Journal', notificationOptions)
    );
  }
});
