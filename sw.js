const CACHE_NAME = 'coach-basket-v3';
const ASSETS = [
  './index.html',
  './impostazioni.html',
  './cerca.html',
  './dettaglio.html',
  './style.css',
  './timer.js',
  './settings.js',
  './search.js',
  './detail.js',
  './orologio.js',
  './playlist_esercizi.js',
  './aggiungi_esercizio.js',
  './manifest.json',
  './exercise-list.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});