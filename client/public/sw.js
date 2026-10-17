const CACHE_NAME = 'vetrelief-shell-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/vetrelief.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const cachedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', cachedResponse));
      }
      return response;
    }).catch(async () => (await caches.match('/index.html')) || Response.error()));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const cachedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse));
      }
      return response;
    })));
  }
});
