const CACHE_NAME = "conserpav-shell-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NUNCA cachear requisições para a API ou métodos que não sejam GET
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("/api/")
  ) {
    return;
  }

  // Cachear apenas estáticos do próprio domínio do app shell
  if (url.origin !== self.location.origin) {
    return;
  }

  const networkFirst = request.mode === "navigate" || /\.(js|css)$/.test(url.pathname);

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchAndCache = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      });

      if (networkFirst) {
        try {
          return await fetchAndCache;
        } catch {
          return cached || Response.error();
        }
      }

      return cached || fetchAndCache.catch(() => Response.error());
    })
  );
});
