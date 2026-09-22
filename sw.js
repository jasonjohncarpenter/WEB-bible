// Service worker for the World English Bible reader.
// Caches everything the app needs on first visit so it keeps working
// with no network connection afterward (installed to the home screen
// or just revisited in the browser).

var CACHE_NAME = "web-bible-v3";
var CORE_ASSETS = [
  "./index.html",
  "./web-bible-data.json",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Cache-first: once installed, the app never needs the network again.
// If something isn't cached yet, fall back to the network and cache it.
self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(resp){
        if (resp && resp.ok){
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return resp;
      }).catch(function(){
        // Offline and not cached (e.g. first-ever load failed mid-way) —
        // nothing more we can do for this request.
        return cached;
      });
    })
  );
});
