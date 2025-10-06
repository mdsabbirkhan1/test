// ===== Service Worker Configuration =====

const CACHE_VERSION = 'gaming-portal-v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/pwa-install.js',
    '/manifest.json',
    '/gamedata.json',
    '/offlinegameadd.json'
];

// Maximum number of items in dynamic cache
const DYNAMIC_CACHE_LIMIT = 50;

// ===== Helper Functions =====

// Limit cache size
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        // Delete oldest items
        const itemsToDelete = keys.length - maxItems;
        for (let i = 0; i < itemsToDelete; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// Clean old caches
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const cachesToDelete = cacheNames.filter(cache => 
        cache !== STATIC_CACHE && 
        cache !== DYNAMIC_CACHE && 
        cache !== OFFLINE_CACHE
    );
    
    return Promise.all(
        cachesToDelete.map(cache => caches.delete(cache))
    );
}

// ===== Install Event =====
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        (async () => {
            try {
                // Cache static assets
                const staticCache = await caches.open(STATIC_CACHE);
                await staticCache.addAll(STATIC_ASSETS);
                console.log('[Service Worker] Static assets cached');
                
                // Pre-cache offline games
                const offlineCache = await caches.open(OFFLINE_CACHE);
                const offlineGamesResponse = await fetch('offlinegameadd.json');
                const offlineGames = await offlineGamesResponse.json();
                
                // Cache offline game assets
                const offlineAssets = Array.isArray(offlineGames) ? offlineGames : offlineGames.games || [];
                const offlineUrls = offlineAssets.map(game => game.url).filter(url => url);
                
                // Cache with error handling
                await Promise.allSettled(
                    offlineUrls.map(url => 
                        offlineCache.add(url).catch(err => {
                            console.warn(`[Service Worker] Failed to cache: ${url}`, err);
                        })
                    )
                );
                
                console.log('[Service Worker] Offline games cached');
                
                // Force the waiting service worker to become the active service worker
                await self.skipWaiting();
            } catch (error) {
                console.error('[Service Worker] Installation failed:', error);
            }
        })()
    );
});

// ===== Activate Event =====
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        (async () => {
            try {
                // Clean old caches
                await cleanOldCaches();
                console.log('[Service Worker] Old caches cleaned');
                
                // Take control of all pages
                await self.clients.claim();
                console.log('[Service Worker] Claimed clients');
            } catch (error) {
                console.error('[Service Worker] Activation failed:', error);
            }
        })()
    );
});

// ===== Fetch Event =====
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For game URLs, try to cache them
        if (request.mode === 'navigate' || request.destination === 'iframe') {
            event.respondWith(
                fetch(request)
                    .then(response => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(request, responseClone);
                                limitCacheSize(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return cached version if available
                        return caches.match(request);
                    })
            );
        }
        return;
    }
    
    // Handle same-origin requests
    event.respondWith(
        (async () => {
            try {
                // Try cache first for static assets
                if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                }
                
                // Try network first
                try {
                    const networkResponse = await fetch(request);
                    
                    // Cache successful responses
                    if (networkResponse.ok && request.method === 'GET') {
                        const cache = await caches.open(DYNAMIC_CACHE);
                        cache.put(request, networkResponse.clone());
                        limitCacheSize(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
                    }
                    
                    return networkResponse;
                } catch (networkError) {
                    // Network failed, try cache
                    const cachedResponse = await caches.match(request);
                    
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // If requesting a page, return offline page
                    if (request.mode === 'navigate') {
                        const offlinePage = await caches.match('/index.html');
                        if (offlinePage) {
                            return offlinePage;
                        }
                    }
                    
                    // Return a custom offline response
                    return new Response(
                        JSON.stringify({ 
                            error: 'Offline', 
                            message: 'You are currently offline. Please check your internet connection.' 
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'application/json'
                            })
                        }
                    );
                }
            } catch (error) {
                console.error('[Service Worker] Fetch error:', error);
                return new Response('Network error', { status: 500 });
            }
        })()
    );
});

// ===== Message Event =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(DYNAMIC_CACHE).then(cache => {
            urls.forEach(url => {
                cache.add(url).catch(err => {
                    console.warn(`[Service Worker] Failed to cache: ${url}`, err);
                });
            });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            console.log('[Service Worker] All caches cleared');
        });
    }
});

// ===== Sync Event (Background Sync) =====
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-games') {
        event.waitUntil(
            fetch('/gamedata.json')
                .then(response => response.json())
                .then(data => {
                    console.log('[Service Worker] Games synced');
                })
                .catch(error => {
                    console.error('[Service Worker] Sync failed:', error);
                })
        );
    }
});

// ===== Push Notification (Optional) =====
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New games available!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Play Now',
                icon: '/icon-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Gaming Portal', options)
    );
});

// ===== Notification Click =====
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Log service worker version
console.log(`[Service Worker] Version: ${CACHE_VERSION}`);
