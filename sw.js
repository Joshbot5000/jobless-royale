// Jobless Royale offline cache: the whole game is one HTML file, so caching it makes it work with no signal.
const CACHE = "jobless-royale-0eb5eea73e";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("jobless-royale-") && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const put = res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (new URL(req.url).origin === location.origin) {
    // network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req, {ignoreSearch: true}).then(m => m || caches.match("./index.html"))));
  } else {
    // fonts: cache first
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(put)));
  }
});
