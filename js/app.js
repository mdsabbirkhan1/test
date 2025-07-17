// Main Application
class App {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        this.pwaPrompt = null;
        this.init();
    }

    async init() {
        try {
            await this.initializeApp();
            this.setupEventListeners();
            this.setupPWA();
            this.setupTheme();
            this.setupCookieConsent();
            this.handleInitialRoute();
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.hideLoadingScreen();
            Utils.showError('Failed to initialize application');
        }
    }

    async initializeApp() {
        // Wait for all managers to be ready
        const maxWait = 10000; // 10 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;

        console.log('Waiting for managers to initialize...');
        
        while ((!window.storage || !window.toolsManager || !window.categoriesManager) && waited < maxWait) {
            if (waited % 1000 === 0) { // Log every second
                console.log(`Waiting... Storage: ${!!window.storage}, Tools: ${!!window.toolsManager}, Categories: ${!!window.categoriesManager}`);
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }

        if (waited >= maxWait) {
            console.error('Timeout waiting for managers to initialize');
            console.log('Available:', {
                storage: !!window.storage,
                toolsManager: !!window.toolsManager,
                categoriesManager: !!window.categoriesManager
            });
            throw new Error('Timeout waiting for managers to initialize');
        }

        console.log('All managers ready, initializing app...');
        
        // Initialize popular tools display
        this.displayPopularTools();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                this.showPage(page);
            }
        });

        // Theme toggle
        const themeToggle = Utils.$('#themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Mobile menu toggle
        const menuToggle = Utils.$('#menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Back/forward navigation
        window.addEventListener('popstate', (e) => {
            this.handleInitialRoute();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Online/offline status
        window.addEventListener('online', () => {
            Utils.showSuccess('Back online!');
        });

        window.addEventListener('offline', () => {
            Utils.showError('You\'re offline. Some features may not work.');
        });
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.pwaPrompt = e;
            this.showInstallPrompt();
        });

        // Handle PWA install
        const installBtn = Utils.$('#installBtn');
        const dismissBtn = Utils.$('#dismissBtn');

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.installPWA();
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.dismissInstallPrompt();
            });
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            storage.setSetting('pwaInstalled', true);
        }
    }

    async registerServiceWorker() {
        try {
            // Create a simple service worker for caching
            const swCode = `
                const CACHE_NAME = 'tools-hub-v1';
                const urlsToCache = [
                    '/',
                    '/styles.css',
                    '/js/app.js',
                    '/js/storage.js',
                    '/js/utils.js',
                    '/js/search.js',
                    '/js/tools.js',
                    '/js/categories.js',
                    '/data/categories.json',
                    '/data/sample-tools.json',
                    '/manifest.json'
                ];

                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.addAll(urlsToCache))
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request)
                            .then((response) => {
                                return response || fetch(event.request);
                            })
                    );
                });
            `;

            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            const registration = await navigator.serviceWorker.register(swUrl);
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    setupTheme() {
        // Load saved theme or detect system preference
        const savedTheme = storage.getSetting('theme') || 'auto';
        this.setTheme(savedTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (storage.getSetting('theme') === 'auto') {
                this.setTheme('auto');
            }
        });
    }

    setupCookieConsent() {
        const cookieConsent = storage.getSetting('cookieConsent');
        
        if (!cookieConsent) {
            setTimeout(() => {
                this.showCookieConsent();
            }, 2000); // Show after 2 seconds
        }

        // Cookie consent buttons
        const acceptBtn = Utils.$('#acceptCookies');
        const declineBtn = Utils.$('#declineCookies');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptCookies();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineCookies();
            });
        }
    }

    handleInitialRoute() {
        const params = Utils.getQueryParams();
        const page = params.page || 'home';
        const category = params.category;

        this.showPage(page);

        if (page === 'tools' && category && window.toolsManager) {
            window.toolsManager.setCategory(category);
        }

        if (params.search === 'true' && window.searchSystem) {
            window.searchSystem.openSearch();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = Utils.$('#loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                Utils.fadeOut(loadingScreen, 300);
                setTimeout(() => {
                    loadingScreen.remove();
                }, 300);
            }, 1000); // Show loading for at least 1 second
        }
    }

    showPage(page) {
        if (this.currentPage === page) return;

        // Hide all pages
        const pages = Utils.$$('.page');
        pages.forEach(p => Utils.removeClass(p, 'active'));

        // Show target page
        const targetPage = Utils.$(`#${page}Page`);
        if (targetPage) {
            Utils.addClass(targetPage, 'active');
            this.currentPage = page;
        }

        // Update navigation
        this.updateNavigation(page);

        // Update URL
        const url = new URL(window.location);
        if (page === 'home') {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        window.history.pushState({}, '', url);

        // Page-specific actions
        this.handlePageChange(page);
    }

    updateNavigation(page) {
        const navLinks = Utils.$$('.nav-link');
        navLinks.forEach(link => {
            Utils.removeClass(link, 'active');
            if (link.dataset.page === page) {
                Utils.addClass(link, 'active');
            }
        });
    }

    handlePageChange(page) {
        switch (page) {
            case 'tools':
                if (window.toolsManager && !window.toolsManager.isInitialized) {
                    window.toolsManager.initializeView();
                }
                break;
            case 'home':
                this.displayPopularTools();
                break;
        }
    }

    displayPopularTools() {
        console.log('displayPopularTools called');
        const container = Utils.$('#popularToolsGrid');
        if (!container) {
            console.log('Popular tools container not found');
            return;
        }
        if (!window.toolsManager) {
            console.log('ToolsManager not available');
            return;
        }

        console.log('Getting popular tools...');
        const popularTools = window.toolsManager.getPopularTools(6);
        console.log('Popular tools:', popularTools);
        
        if (popularTools.length === 0) {
            // Show some random tools if no usage data
            console.log('No popular tools, getting random tools...');
            const allTools = window.toolsManager.getAllTools();
            console.log('All tools:', allTools.length);
            const randomTools = Utils.shuffle(allTools).slice(0, 6);
            console.log('Random tools:', randomTools);
            this.renderPopularTools(container, randomTools);
        } else {
            this.renderPopularTools(container, popularTools);
        }
    }

    renderPopularTools(container, tools) {
        let html = '';
        
        tools.forEach((tool, index) => {
            if (tool) {
                const usage = storage.getToolUsage(tool.id);
                const isFavorite = storage.isFavoriteTool(tool.id);
                
                html += `
                    <div class="tool-card fade-in" 
                         data-tool-id="${tool.id}"
                         style="animation-delay: ${index * 100}ms">
                        <div class="tool-header">
                            <div class="tool-icon-card">
                                <i class="${tool.icon}"></i>
                            </div>
                            <div class="tool-info">
                                <h3>${Utils.escapeHtml(tool.name)}</h3>
                                <span class="tool-category">${Utils.capitalize(tool.category)}</span>
                            </div>
                        </div>
                        
                        <div class="tool-description">
                            ${Utils.escapeHtml(Utils.truncate(tool.description, 80))}
                        </div>
                        
                        <div class="tool-footer">
                            <div class="tool-rating">
                                <i class="fas fa-star"></i>
                                <span>${tool.rating ? tool.rating.toFixed(1) : 'N/A'}</span>
                                ${usage > 0 ? `<span class="usage-count">• ${usage}x</span>` : ''}
                            </div>
                            ${tool.badge ? `<span class="tool-badge">${Utils.escapeHtml(tool.badge)}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;

        // Add click handlers
        const toolCards = container.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.dataset.toolId;
                if (toolId && window.toolsManager) {
                    window.toolsManager.openTool(toolId);
                }
            });
        });
    }

    toggleTheme() {
        const currentTheme = storage.getSetting('theme') || 'auto';
        let newTheme;

        switch (currentTheme) {
            case 'light':
                newTheme = 'dark';
                break;
            case 'dark':
                newTheme = 'auto';
                break;
            default:
                newTheme = 'light';
        }

        this.setTheme(newTheme);
    }

    setTheme(theme) {
        storage.setSetting('theme', theme);
        Utils.setTheme(theme);
    }

    toggleMobileMenu() {
        const navMenu = Utils.$('.nav-menu');
        if (navMenu) {
            Utils.toggleClass(navMenu, 'mobile-open');
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (window.searchSystem) {
                window.searchSystem.openSearch();
            }
        }

        // Ctrl/Cmd + / for help (can be implemented later)
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            // Show help modal
        }

        // Escape to close overlays
        if (e.key === 'Escape') {
            const overlays = Utils.$$('.search-overlay:not(.hidden), .install-prompt:not(.hidden)');
            overlays.forEach(overlay => Utils.hide(overlay));
        }
    }

    showInstallPrompt() {
        if (storage.getSetting('pwaInstalled') || storage.getSetting('installPromptDismissed')) {
            return;
        }

        const prompt = Utils.$('#installPrompt');
        if (prompt) {
            Utils.show(prompt, 'flex');
        }
    }

    async installPWA() {
        if (!this.pwaPrompt) return;

        try {
            const result = await this.pwaPrompt.prompt();
            
            if (result.outcome === 'accepted') {
                storage.setSetting('pwaInstalled', true);
                Utils.showSuccess('App installed successfully!');
            }
            
            this.dismissInstallPrompt();
        } catch (error) {
            console.error('PWA install failed:', error);
            Utils.showError('Failed to install app');
        }
    }

    dismissInstallPrompt() {
        const prompt = Utils.$('#installPrompt');
        if (prompt) {
            Utils.hide(prompt);
            storage.setSetting('installPromptDismissed', true);
        }
    }

    showCookieConsent() {
        const consent = Utils.$('#cookieConsent');
        if (consent) {
            Utils.show(consent, 'block');
        }
    }

    acceptCookies() {
        storage.setSetting('cookieConsent', true);
        const consent = Utils.$('#cookieConsent');
        if (consent) {
            Utils.hide(consent);
        }
        Utils.showSuccess('Cookie preferences saved');
    }

    declineCookies() {
        storage.setSetting('cookieConsent', false);
        const consent = Utils.$('#cookieConsent');
        if (consent) {
            Utils.hide(consent);
        }
        
        // Clear any existing tracking data
        storage.clearPersonalData();
        Utils.showSuccess('Cookies declined');
    }

    // Public API methods
    navigateToTools(categoryId = null) {
        this.showPage('tools');
        
        if (categoryId && window.toolsManager) {
            setTimeout(() => {
                window.toolsManager.setCategory(categoryId);
            }, 100);
        }
    }

    openSearch(query = '') {
        if (window.searchSystem) {
            if (query) {
                window.searchSystem.search(query);
            } else {
                window.searchSystem.openSearch();
            }
        }
    }

    refreshData() {
        if (window.toolsManager) {
            window.toolsManager.refreshTools();
        }
        if (window.categoriesManager) {
            window.categoriesManager.refreshCategories();
        }
    }

    exportUserData() {
        storage.exportData();
    }

    async importUserData(file) {
        try {
            await storage.importData(file);
            Utils.showSuccess('Data imported successfully!');
            
            // Refresh displays
            this.refreshData();
        } catch (error) {
            console.error('Import failed:', error);
            Utils.showError('Failed to import data');
        }
    }

    getAppInfo() {
        return {
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            features: [
                'PWA Support',
                'Dark/Light Mode',
                'Local Storage',
                'Search Functionality',
                'Usage Tracking',
                'Favorites System',
                'Responsive Design',
                'Lazy Loading'
            ],
            storage: storage.getStorageInfo()
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing app...');
    window.app = new App();
});

// Also try window.onload as a fallback
window.addEventListener('load', () => {
    if (!window.app) {
        console.log('Window loaded but no app, creating fallback...');
        window.app = new App();
    }
});

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    Utils.showError('An unexpected error occurred');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    Utils.showError('An unexpected error occurred');
});

// Expose app info for debugging
window.getAppInfo = () => {
    if (window.app) {
        return window.app.getAppInfo();
    }
    return null;
};

console.log('🛠️ Tools Hub v1.0.0 - Ready to go!');
console.log('💡 Press Ctrl+K (or Cmd+K) to search');
console.log('🎨 Toggle theme with the theme button');
console.log('📱 Install as PWA for offline access');
console.log('🔧 Run getAppInfo() for app details');