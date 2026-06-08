// IU Portal Service Worker
const CACHE = 'iu-daak-v1';
const BASE = '/daak/';
const ASSETS = [
  BASE + 'index.html',
  BASE + 'manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for Google Apps Script API calls
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(
          '{"success":false,"error":"Offline — please check your connection"}',
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }
  // Cache first for all other assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function() {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});
