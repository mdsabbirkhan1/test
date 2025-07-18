// Service Worker for ToolHub PWA
const CACHE_NAME = 'toolhub-v1.0.0';
const STATIC_CACHE = 'toolhub-static-v1';
const DYNAMIC_CACHE = 'toolhub-dynamic-v1';
const API_CACHE = 'toolhub-api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/app.js',
    '/js/tools-data.js',
    '/js/pwa.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Resources to cache on demand
const DYNAMIC_ASSETS = [
    '/icons/',
    '/screenshots/',
    'https://fonts.gstatic.com/'
];

// API endpoints to cache
const API_ENDPOINTS = [
    // Add any API endpoints here
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE),
            caches.open(API_CACHE)
        ]).then(() => {
            console.log('Service Worker: Installed successfully');
            return self.skipWaiting();
        }).catch(error => {
            console.error('Service Worker: Installation failed', error);
        })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated successfully');
            return self.clients.claim();
        })
    );
});

// Fetch Event - Handle requests with caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isAPIRequest(request.url)) {
        event.respondWith(networkFirst(request, API_CACHE));
    } else if (isDynamicAsset(request.url)) {
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    } else {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
});

// Caching Strategies

// Cache First Strategy - Good for static assets
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        return getOfflinePage();
    }
}

// Network First Strategy - Good for API calls and dynamic content
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network request failed, trying cache:', error);
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return getOfflinePage();
    }
}

// Stale While Revalidate Strategy - Good for frequently updated content
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.log('Network request failed:', error);
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Helper Functions

function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.woff') ||
           url.includes('.woff2') ||
           url.includes('.ttf');
}

function isAPIRequest(url) {
    return API_ENDPOINTS.some(endpoint => url.includes(endpoint)) ||
           url.includes('/api/');
}

function isDynamicAsset(url) {
    return DYNAMIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.svg') ||
           url.includes('.webp');
}

function getOfflinePage() {
    return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ToolHub - Offline</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                .offline-container {
                    max-width: 400px;
                    padding: 2rem;
                }
                .offline-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.8;
                }
                h1 {
                    margin-bottom: 1rem;
                    font-size: 2rem;
                }
                p {
                    margin-bottom: 2rem;
                    opacity: 0.9;
                    line-height: 1.6;
                }
                .retry-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                .retry-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📱</div>
                <h1>You're Offline</h1>
                <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Try Again
                </button>
            </div>
        </body>
        </html>
    `, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}

// Background Sync
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

async function handleBackgroundSync() {
    try {
        // Sync any pending data
        console.log('Performing background sync...');
        
        // Example: Sync analytics data, user preferences, etc.
        await syncAnalyticsData();
        await syncUserPreferences();
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncAnalyticsData() {
    // Implementation for syncing analytics data
    const analyticsData = await getStoredAnalyticsData();
    if (analyticsData.length > 0) {
        // Send to analytics service
        console.log('Syncing analytics data:', analyticsData.length, 'events');
    }
}

async function syncUserPreferences() {
    // Implementation for syncing user preferences
    const preferences = await getStoredUserPreferences();
    if (preferences) {
        console.log('Syncing user preferences');
        // Send to backend if needed
    }
}

async function getStoredAnalyticsData() {
    // Mock implementation - replace with actual storage retrieval
    return [];
}

async function getStoredUserPreferences() {
    // Mock implementation - replace with actual storage retrieval
    return null;
}

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New tools available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('ToolHub', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Do nothing - notification is already closed
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic background sync triggered:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(periodicContentSync());
    }
});

async function periodicContentSync() {
    try {
        console.log('Performing periodic content sync...');
        
        // Update cached content
        const cache = await caches.open(DYNAMIC_CACHE);
        
        // Refresh frequently accessed content
        const criticalUrls = [
            '/',
            '/js/tools-data.js'
        ];
        
        await Promise.all(
            criticalUrls.map(async url => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                        console.log('Updated cache for:', url);
                    }
                } catch (error) {
                    console.error('Failed to update cache for:', url, error);
                }
            })
        );
        
        console.log('Periodic content sync completed');
    } catch (error) {
        console.error('Periodic content sync failed:', error);
    }
}

// Message Handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            cacheUrls(event.data.urls)
        );
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            clearAllCaches()
        );
    }
});

async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('Cached additional URLs:', urls);
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
}

// Error Handler
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
    event.preventDefault();
});

console.log('Service Worker: Script loaded');