const CACHE = "fpv-builder-v3";
const CORE = [
  "/",
  "/assets/css/app.css",
  "/assets/js/app.js",
  "/assets/js/three-preview.js",
  "/assets/js/vendor/OrbitControls.js",
  "/assets/icon.svg",
  "/manifest.webmanifest",
  "/vendor/three.module.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  const isStaticAsset = url.pathname.startsWith("/assets/")
    || url.pathname.startsWith("/vendor/")
    || url.pathname === "/manifest.webmanifest";
  if (!isStaticAsset) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        return caches.open(CACHE).then(cache => cache.put(request, copy)).then(() => response);
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
