const CACHE_NAME = 'sg-sm-v2'; // Subimos la versión para invalidar el caché viejo
const assets = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar el Service Worker y guardar en caché lo básico
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
  self.skipWaiting(); // Activa inmediatamente la versión v2
});

// Activar y eliminar la versión 'sg-sm-v1' antigua de la memoria
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
  self.clients.claim(); // Toma el control de la app abierta
});

// Estrategia inteligente de red/caché
self.addEventListener('fetch', e => {
  // Ignorar peticiones a la API del backend (puerto 5000 / chat)
  if (e.request.url.includes(':5000') || e.request.url.includes('/api/')) {
    return;
  }

  // Network First para el index.html y navegación principal (siempre intenta traer lo nuevo)
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(e.request)) // Si no hay red, carga la versión en caché
    );
    return;
  }

  // Cache First para recursos estáticos secundarios
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});