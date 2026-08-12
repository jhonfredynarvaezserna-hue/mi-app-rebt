const CACHE_NAME = 'sg-sm-v2';
const assets = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Instalar el Service Worker guardando recurso por recurso para evitar bloqueos por 404
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of assets) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`No se pudo cachear ${asset}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activar y eliminar cachés antiguas (v1)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estrategia inteligente de red/caché
self.addEventListener('fetch', e => {
  // Ignorar peticiones a las APIs del backend
  if (e.request.url.includes(':5000') || e.request.url.includes('/api/')) {
    return;
  }

  // Network First para la navegación (index.html)
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache First para recursos estáticos con fallback a red
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});