/* «Мой сад» — service worker. Собран автоматически, руками не править.
   Стратегия: сначала сеть (свежая версия важнее скорости), кэш — запасной аэродром.
   Так обновления прилетают сразу, а без интернета приложение всё равно открывается. */
const CACHE = "moy-sad-17.07-15:07";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                                  // запросы к ИИ и синхронизации — мимо
  if (new URL(req.url).origin !== self.location.origin) return;      // воркер и погода — только сеть

  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 504, statusText: "нет сети" });
        });
      })
  );
});
