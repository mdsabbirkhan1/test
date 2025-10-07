// ===== Service Worker for PWA =====

const CACHE_NAME = 'gaming-platform-v1';
const OFFLINE_CACHE = 'gaming-platform-offline-v1';

// Files to cache for offline functionality
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/pwa-install.js',
    '/manifest.json',
    '/gamedata.json',
    '/offlinegameadd.json'
];

// Offline games to cache (these will be available offline)
const OFFLINE_GAMES = [
    '/offline-games/snake/index.html',
    '/offline-games/2048/index.html',
    '/offline-games/tic-tac-toe/index.html'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache core assets
            caches.open(CACHE_NAME).then((cache) => {
                console.log('Service Worker: Caching core assets');
                return cache.addAll(CORE_ASSETS).catch(err => {
                    console.error('Failed to cache core assets:', err);
                });
            }),
            // Cache offline games
            caches.open(OFFLINE_CACHE).then((cache) => {
                console.log('Service Worker: Caching offline games');
                return cache.addAll(OFFLINE_GAMES).catch(err => {
                    console.error('Failed to cache offline games:', err);
                });
            })
        ]).then(() => {
            console.log('Service Worker: Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For game iframes and external resources, try network first
        event.respondWith(
            fetch(request).catch(() => {
                // If offline, return a custom offline page or continue
                return new Response('Offline - External resource unavailable', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
        );
        return;
    }
    
    // For same-origin requests, use cache-first strategy
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version and update cache in background
                fetchAndCache(request);
                return cachedResponse;
            }
            
            // If not in cache, fetch from network
            return fetchAndCache(request);
        }).catch(() => {
            // If both cache and network fail, return offline page
            if (request.destination === 'document') {
                return caches.match('/index.html');
            }
        })
    );
});

// Fetch and cache helper function
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response && response.status === 200) {
            const responseToCache = response.clone();
            
            // Determine which cache to use
            const cacheName = request.url.includes('/offline-games/') 
                ? OFFLINE_CACHE 
                : CACHE_NAME;
            
            caches.open(cacheName).then((cache) => {
                cache.put(request, responseToCache);
            });
        }
        
        return response;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// Message event - for manual cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                return self.clients.matchAll();
            }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'CACHE_CLEARED' });
                });
            })
        );
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
});

// Background sync for game data updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-game-data') {
        event.waitUntil(
            fetch('/gamedata.json')
                .then(response => response.json())
                .then(data => {
                    return caches.open(CACHE_NAME).then(cache => {
                        return cache.put('/gamedata.json', 
                            new Response(JSON.stringify(data), {
                                headers: { 'Content-Type': 'application/json' }
                            })
                        );
                    });
                })
                .catch(err => console.error('Background sync failed:', err))
        );
    }
});

// Push notification support (for future use)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New game available!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Play Now',
                icon: '/check-icon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Gaming Platform', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker: Loaded');
