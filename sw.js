// IU Portal Service Worker — Auto caches for offline use
const CACHE = 'iu-portal-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for API calls, cache first for assets
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(function(){return new Response('{"success":false,"error":"Offline"}',{headers:{'Content-Type':'application/json'}});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        if(res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request, clone);});
        }
        return res;
      }).catch(function(){return cached||new Response('Offline',{status:503});});
    })
  );
});
