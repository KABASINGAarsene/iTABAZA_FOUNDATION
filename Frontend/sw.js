const CACHE_NAME = "itabaza-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/Styles/land.css",
  "/Scripts/navbar.js",
  "/Scripts/footer.js",
  "/Files/favicon.ico",
  // add other key files like offline.html, images, etc.
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch cached files
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});


self.addEventListener("install", function (e) {
  console.log(" Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log(" Service Worker activated");
});

self.addEventListener("fetch", function (event) {
  if (event.request.mode === 'navigate') {
    // Let navigation requests pass through
    return;
  }
  event.respondWith(fetch(event.request).catch(() => {
    return new Response("Offline or resource not available");
  }));
});
