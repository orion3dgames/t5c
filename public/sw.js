const version = "0.3.5";

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(version));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames.map((cacheName) => {
                        if (version !== cacheName) return caches.delete(cacheName);
                    })
                )
            )
            .then(self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = event.request.url;
    if (event.request.method !== "GET" || url.indexOf("/node_modules/") !== -1 || url.endsWith("?import")) return;

    event.respondWith(
        caches.open(version).then((cache) => {
            // Go to the network first
            return fetch(event.request)
                .then((fetchedResponse) => {
                    cache.put(event.request, fetchedResponse.clone());
                    return fetchedResponse;
                })
                .catch(() => cache.match(url));
        })
    );
});
