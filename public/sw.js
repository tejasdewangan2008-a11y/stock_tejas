// Service Worker for TejStockAI Screener PWA
const CACHE_NAME = 'tejstockai-screener-v26';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Let API and WebSocket requests pass straight through to server
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    return;
  }

  // Always fetch fresh network copies first
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .catch(() => caches.match(event.request))
  );
});

