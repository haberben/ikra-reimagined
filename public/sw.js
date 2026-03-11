const CACHE_NAME = 'ikra-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API domains that should use network-first strategy
const API_DOMAINS = [
  'api.aladhan.com',
  'mp3quran.net',
  'alquran.cloud',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Install: cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for APIs, cache-first for static assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip OAuth routes
  if (url.pathname.startsWith('/~oauth')) return;

  // Network-first for API calls
  const isApi = API_DOMAINS.some((d) => url.hostname.includes(d));
  if (isApi) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cache successful responses for same-origin
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Fallback for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push Notification handler
self.addEventListener('push', (e) => {
  let data = { title: 'İKRA', body: 'Yeni bildirim', icon: '/icons/icon-192.png' };

  if (e.data) {
    try {
      data = { ...data, ...e.data.json() };
    } catch {
      data.body = e.data.text();
    }
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'ikra-notification',
      data: data.data || {},
      actions: data.actions || [],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window or open new
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});

// Background Sync handler
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-prayer-times') {
    e.waitUntil(syncPrayerTimes());
  }
  if (e.tag === 'sync-favorites') {
    e.waitUntil(syncFavorites());
  }
});

async function syncPrayerTimes() {
  try {
    const city = 'İstanbul'; // Default fallback
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`
    );
    const data = await res.json();
    if (data.code === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        new Request('ikra-prayer-times-cache'),
        new Response(JSON.stringify(data.data.timings))
      );
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}

async function syncFavorites() {
  // Placeholder for syncing offline favorites
  console.log('Syncing favorites in background...');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'update-prayer-times') {
    e.waitUntil(syncPrayerTimes());
  }
});
