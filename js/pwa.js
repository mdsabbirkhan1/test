// PWA Management and Service Worker Communication
class PWAManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdatePrompt();
        this.initializeCache();
    }
    
    // Service Worker Setup
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        this.handleServiceWorkerUpdate(registration);
                    });
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }
    
    // Handle Service Worker Updates
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
            }
        });
    }
    
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>A new version is available!</span>
                <button onclick="window.location.reload()" class="btn-update">Update Now</button>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-dismiss">&times;</button>
            </div>
        `;
        
        // Add styles
        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            z-index: 999;
            animation: slideDown 0.3s ease-out;
        `;
        
        document.body.appendChild(updateBanner);
    }
    
    // Install Prompt Management
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.deferredPrompt = deferredPrompt;
        });
        
        // iOS Safari install prompt
        if (this.isIOS() && !this.isInStandaloneMode()) {
            this.showIOSInstallPrompt();
        }
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    }
    
    showIOSInstallPrompt() {
        const iosPrompt = document.createElement('div');
        iosPrompt.className = 'ios-install-prompt';
        iosPrompt.innerHTML = `
            <div class="ios-prompt-content">
                <div class="ios-prompt-header">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>Install ToolHub</h3>
                    <button onclick="this.closest('.ios-install-prompt').remove()" class="btn-close">&times;</button>
                </div>
                <div class="ios-prompt-body">
                    <p>Install this app on your home screen for quick and easy access when you're on the go.</p>
                    <div class="ios-steps">
                        <div class="ios-step">
                            <i class="fas fa-share"></i>
                            <span>Tap the share button</span>
                        </div>
                        <div class="ios-step">
                            <i class="fas fa-plus-square"></i>
                            <span>Add to Home Screen</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(iosPrompt);
        
        // Auto dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(iosPrompt)) {
                iosPrompt.remove();
            }
        }, 10000);
    }
    
    // Update Prompt
    setupUpdatePrompt() {
        // Listen for app updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }
    
    // Cache Management
    initializeCache() {
        // Pre-cache critical resources
        this.preCacheResources();
        
        // Setup cache management
        this.setupCacheManagement();
    }
    
    preCacheResources() {
        const criticalResources = [
            '/',
            '/styles.css',
            '/js/app.js',
            '/js/tools-data.js',
            '/js/pwa.js',
            '/manifest.json'
        ];
        
        if ('caches' in window) {
            caches.open('toolhub-v1').then(cache => {
                cache.addAll(criticalResources);
            });
        }
    }
    
    setupCacheManagement() {
        // Clear old caches
        this.clearOldCaches();
        
        // Setup cache size limits
        this.setupCacheLimits();
    }
    
    clearOldCaches() {
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== 'toolhub-v1') {
                            return caches.delete(cacheName);
                        }
                    })
                );
            });
        }
    }
    
    setupCacheLimits() {
        // Implement cache size management
        const maxCacheSize = 50 * 1024 * 1024; // 50MB
        
        if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 0;
                
                console.log(`Storage used: ${(usage / 1024 / 1024).toFixed(2)} MB`);
                console.log(`Storage quota: ${(quota / 1024 / 1024).toFixed(2)} MB`);
                
                if (usage > maxCacheSize) {
                    this.clearOldCaches();
                }
            });
        }
    }
    
    // Offline Detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showConnectionStatus('online');
        });
        
        window.addEventListener('offline', () => {
            this.showConnectionStatus('offline');
        });
    }
    
    showConnectionStatus(status) {
        const statusBanner = document.createElement('div');
        statusBanner.className = `connection-status ${status}`;
        statusBanner.innerHTML = `
            <div class="status-content">
                <i class="fas fa-${status === 'online' ? 'wifi' : 'wifi-slash'}"></i>
                <span>You are ${status}</span>
            </div>
        `;
        
        document.body.appendChild(statusBanner);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            statusBanner.remove();
        }, 3000);
    }
    
    // Background Sync
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('background-sync');
            });
        }
    }
    
    // Push Notifications
    setupPushNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            // Request permission
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.subscribeToNotifications();
                    }
                });
            }
        }
    }
    
    subscribeToNotifications() {
        navigator.serviceWorker.ready.then(registration => {
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
        }).then(subscription => {
            console.log('Push subscription:', subscription);
            // Send subscription to server
        });
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

// Add PWA specific styles
const pwaStyles = `
.update-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    z-index: 999;
    animation: slideDown 0.3s ease-out;
}

.update-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

.update-content i {
    font-size: 1.125rem;
    animation: spin 2s linear infinite;
}

.btn-update {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s ease-in-out;
}

.btn-update:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.ios-install-prompt {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--bg-card);
    border-top: 1px solid var(--border-light);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
}

.ios-prompt-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.ios-prompt-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.ios-prompt-header h3 {
    flex: 1;
    margin: 0;
    color: var(--text-primary);
}

.ios-prompt-header i {
    color: var(--primary-color);
    font-size: 1.5rem;
}

.btn-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.5rem;
    padding: 0.25rem;
}

.ios-steps {
    display: flex;
    gap: 2rem;
    justify-content: center;
    margin-top: 1rem;
}

.ios-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    flex: 1;
}

.ios-step i {
    color: var(--primary-color);
    font-size: 2rem;
}

.connection-status {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    color: white;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
}

.connection-status.online {
    background-color: var(--accent-color);
}

.connection-status.offline {
    background-color: var(--danger-color);
}

.status-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
    .ios-steps {
        flex-direction: column;
        gap: 1rem;
    }
    
    .ios-step {
        flex-direction: row;
        text-align: left;
    }
    
    .connection-status {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
    }
}
`;

// Inject PWA styles
const styleSheet = document.createElement('style');
styleSheet.textContent = pwaStyles;
document.head.appendChild(styleSheet);