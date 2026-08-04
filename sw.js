const CACHE_NAME = 'sg-sm-v1';
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
  self.skipWaiting(); // Fuerza a activar inmediatamente la nueva versión
});

// Activar y limpiar cachés antiguas
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
  self.clients.claim(); // Controla las páginas abiertas de inmediato
});

// Responder desde la caché o ir a la red
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});