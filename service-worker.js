// Service Worker for Gaming Hub PWA
const CACHE_NAME = 'gaming-hub-v1';
const OFFLINE_CACHE = 'gaming-hub-offline-v1';

// Files to cache for offline functionality
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

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Network-first strategy for API/JSON requests
    if (request.url.includes('.json')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then((response) => {
                        // Don't cache if not a success response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        
                        // Clone and cache the response
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return offline page if available
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for caching game data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-games') {
        event.waitUntil(
            fetch('/gamedata.json')
                .then((response) => response.json())
                .then((games) => {
                    return caches.open(OFFLINE_CACHE).then((cache) => {
                        // Cache game icons
                        const iconPromises = games
                            .filter(game => game.icon && !game.icon.startsWith('data:'))
                            .map(game => {
                                return fetch(game.icon)
                                    .then(response => cache.put(game.icon, response))
                                    .catch(err => console.log('Failed to cache icon:', game.icon));
                            });
                        return Promise.all(iconPromises);
                    });
                })
                .catch((error) => {
                    console.error('Background sync failed:', error);
                })
        );
    }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(OFFLINE_CACHE).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_OLD_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName.startsWith('gaming-hub-'))
                        .map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Push notification support
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New games available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Play Now',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Gaming Hub', options)
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

// Handle periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-games') {
        event.waitUntil(
            fetch('/gamedata.json')
                .then((response) => response.json())
                .then((games) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        return cache.put('/gamedata.json', new Response(JSON.stringify(games)));
                    });
                })
                .catch((error) => {
                    console.error('Periodic sync failed:', error);
                })
        );
    }
});
