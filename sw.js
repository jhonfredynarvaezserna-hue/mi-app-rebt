// J.F Clima & Electricidad - Service Worker
// Sube este número cada vez que cambies la app para forzar la actualización
const CACHE_NAME = 'jf-clima-v3';
const ASSETS = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Guarda cada archivo por separado: si falta uno (ej. logo) no se rompe todo
      Promise.all(ASSETS.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET y solo de nuestra web; la IA (/api/) siempre por red
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // RED PRIMERO: siempre intenta la versión nueva; sin internet usa la guardada
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((res) => res || caches.match('./index.html')))
  );
});