const CACHE_NAME = 'filtrador-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './xlsx.full.min.js',
  './js/app.js',
  './js/modules/utils.js',
  './js/modules/db.js',
  './js/modules/historial.js',
  './js/modules/carpetas.js',
  './js/modules/filtros.js',
  './js/modules/tabla.js',
  './js/modules/sesion.js',
  './js/modules/excel.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
