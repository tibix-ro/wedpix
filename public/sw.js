/*
 * WedPix service worker.
 *
 * Strategy:
 *   - Navigations (SPA routes): network-first, fall back to cached shell when offline.
 *   - Same-origin static assets (Vite content-hashed JS/CSS, images, fonts):
 *     stale-while-revalidate.
 *   - API (`/api/`) and user uploads (`/uploads/`): never handled — always go to the
 *     network so auth, billing and private media are never served from cache.
 *   - Cross-origin requests (Stripe, Google Analytics, etc.): passed through untouched.
 *
 * Bump CACHE_VERSION to invalidate all caches on the next deploy.
 */
const CACHE_VERSION = 'wedpix-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/index.html';

// Minimal app shell precached on install.
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/favicon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !key.startsWith(CACHE_VERSION))
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// Allow the page to trigger an immediate activation of a waiting worker.
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET; let the browser deal with POST/PUT/etc.
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Ignore cross-origin requests (Stripe, GA, third parties).
    if (url.origin !== self.location.origin) return;

    // Never cache dynamic API responses or private uploads.
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
        return;
    }

    // Navigation requests → network-first with offline shell fallback.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then((cached) => cached || caches.match(OFFLINE_URL))
                )
        );
        return;
    }

    // Static assets → stale-while-revalidate.
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});
