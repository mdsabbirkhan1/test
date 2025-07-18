// Main Application Logic
class ToolsApp {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.displayedTools = [];
        this.itemsPerPage = 12;
        this.currentPage = 1;
        this.isLoading = false;
        
        // Initialize app
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserPreferences();
        this.initializeCookieConsent();
        this.initializePWAInstall();
        this.loadCategories();
        this.loadTools();
        this.updateStats();
        this.setupIntersectionObserver();
    }
    
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Search functionality
        document.getElementById('searchToggle').addEventListener('click', () => this.toggleSearch());
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());
        
        // Search overlay close
        document.getElementById('searchOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.toggleSearch();
            }
        });
        
        // Escape key to close search
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleSearch();
            }
        });
        
        // Category filters
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.handleCategoryFilter(e.target.dataset.category);
            }
        });
        
        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });
        
        // Tool clicks for usage tracking
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tool-card')) {
                const toolId = e.target.closest('.tool-card').dataset.toolId;
                this.trackToolUsage(toolId);
            }
        });
        
        // Cookie consent
        document.getElementById('acceptCookies').addEventListener('click', () => this.acceptCookies());
        document.getElementById('declineCookies').addEventListener('click', () => this.declineCookies());
        
        // PWA install
        document.getElementById('installPWA').addEventListener('click', () => this.installPWA());
        document.getElementById('dismissPWA').addEventListener('click', () => this.dismissPWABanner());
    }
    
    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update theme icon
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save preference
        this.saveToLocalStorage('theme', newTheme);
        
        // Update PWA theme color
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        themeColorMeta.content = newTheme === 'dark' ? '#1e293b' : '#3b82f6';
    }
    
    // Search Functionality
    toggleSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('searchInput');
        
        if (searchOverlay.classList.contains('hidden')) {
            searchOverlay.classList.remove('hidden');
            searchInput.focus();
        } else {
            searchOverlay.classList.add('hidden');
            this.clearSearch();
        }
    }
    
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.currentPage = 1;
        
        if (query.length > 0) {
            this.displaySearchResults();
        } else {
            document.getElementById('searchResults').innerHTML = '';
        }
        
        this.loadTools();
    }
    
    displaySearchResults() {
        const results = allTools.filter(tool => 
            tool.name.toLowerCase().includes(this.searchQuery) ||
            tool.description.toLowerCase().includes(this.searchQuery) ||
            tool.category.toLowerCase().includes(this.searchQuery) ||
            tool.features.some(feature => feature.toLowerCase().includes(this.searchQuery))
        );
        
        const searchResults = document.getElementById('searchResults');
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No tools found for "${this.searchQuery}"</p>
                </div>
            `;
            return;
        }
        
        searchResults.innerHTML = results.slice(0, 5).map(tool => `
            <div class="search-result-item" style="padding: 1rem; border-bottom: 1px solid var(--border-light); cursor: pointer;" 
                 onclick="window.open('${tool.link}', '_blank'); this.closest('.search-overlay').classList.add('hidden');">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="tool-icon" style="width: 32px; height: 32px; font-size: 1rem;">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem;">${tool.name}</h4>
                        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); opacity: 0.8;">${tool.description.slice(0, 100)}...</p>
                    </div>
                    <span class="tool-badge badge-${tool.badge}">${tool.badge}</span>
                </div>
            </div>
        `).join('');
    }
    
    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        this.searchQuery = '';
        this.loadTools();
    }
    
    // Category Management
    loadCategories() {
        const categoryFilters = document.getElementById('categoryFilters');
        
        categoryFilters.innerHTML = categories.map(category => `
            <button class="category-btn ${category.id === 'all' ? 'active' : ''}" data-category="${category.id}">
                <i class="${category.icon}"></i>
                ${category.name}
                <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; margin-left: 0.5rem;">
                    ${category.count}
                </span>
            </button>
        `).join('');
    }
    
    handleCategoryFilter(category) {
        this.currentFilter = category;
        this.currentPage = 1;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Update section title
        const selectedCategory = categories.find(cat => cat.id === category);
        document.getElementById('sectionTitle').innerHTML = `
            <i class="${selectedCategory.icon}"></i> ${selectedCategory.name}
        `;
        
        this.loadTools();
        this.saveToLocalStorage('lastCategory', category);
    }
    
    // Tools Management
    loadTools() {
        this.showLoading();
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            this.displayedTools = this.getFilteredAndSortedTools();
            this.renderTools();
            this.loadMostUsedTools();
            this.hideLoading();
        }, 300);
    }
    
    getFilteredAndSortedTools() {
        let filteredTools = allTools;
        
        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredTools = filteredTools.filter(tool => tool.category === this.currentFilter);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filteredTools = filteredTools.filter(tool => 
                tool.name.toLowerCase().includes(this.searchQuery) ||
                tool.description.toLowerCase().includes(this.searchQuery) ||
                tool.category.toLowerCase().includes(this.searchQuery) ||
                tool.features.some(feature => feature.toLowerCase().includes(this.searchQuery))
            );
        }
        
        // Apply sorting
        return this.sortTools(filteredTools);
    }
    
    sortTools(tools) {
        const sortedTools = [...tools];
        
        switch (this.currentSort) {
            case 'name':
                return sortedTools.sort((a, b) => a.name.localeCompare(b.name));
            case 'rating':
                return sortedTools.sort((a, b) => b.rating - a.rating);
            case 'dateAdded':
                return sortedTools.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            case 'usage':
                const usage = this.getFromLocalStorage('toolUsage', {});
                return sortedTools.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0));
            default:
                return sortedTools;
        }
    }
    
    renderTools() {
        const toolsGrid = document.getElementById('toolsGrid');
        const toolsToShow = this.displayedTools.slice(0, this.currentPage * this.itemsPerPage);
        
        if (toolsToShow.length === 0) {
            toolsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No tools found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }
        
        toolsGrid.innerHTML = toolsToShow.map(tool => this.createToolCard(tool)).join('');
        
        // Setup lazy loading for remaining tools
        if (toolsToShow.length < this.displayedTools.length) {
            this.setupLoadMore();
        }
    }
    
    createToolCard(tool) {
        const usage = this.getFromLocalStorage('toolUsage', {});
        const usageCount = usage[tool.id] || 0;
        const stars = this.generateStars(tool.rating);
        
        return `
            <div class="tool-card" data-tool-id="${tool.id}" tabindex="0">
                <div class="tool-header">
                    <div class="tool-icon">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div class="tool-info">
                        <h3 class="tool-name">${tool.name}</h3>
                        <span class="tool-category">${tool.category}</span>
                    </div>
                </div>
                
                <p class="tool-description">${tool.description}</p>
                
                <div class="tool-meta">
                    <div class="tool-rating">
                        <span class="rating-stars">${stars}</span>
                        <span class="rating-value">${tool.rating}</span>
                    </div>
                    <span class="tool-badge badge-${tool.badge}">${tool.badge}</span>
                </div>
                
                <div class="tool-features">
                    <div class="features-list">
                        ${tool.features.slice(0, 4).map(feature => 
                            `<span class="feature-tag">${feature}</span>`
                        ).join('')}
                        ${tool.features.length > 4 ? `<span class="feature-tag">+${tool.features.length - 4} more</span>` : ''}
                    </div>
                </div>
                
                <div class="tool-actions">
                    <a href="${tool.link}" target="_blank" class="visit-btn" onclick="event.stopPropagation();">
                        Visit Tool <i class="fas fa-external-link-alt"></i>
                    </a>
                    <div class="tool-date">
                        ${usageCount > 0 ? `Used ${usageCount} times` : this.formatDate(tool.dateAdded)}
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return [
            ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
            ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
            ...Array(emptyStars).fill('<i class="far fa-star"></i>')
        ].join('');
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    // Most Used Tools
    loadMostUsedTools() {
        const usage = this.getFromLocalStorage('toolUsage', {});
        const mostUsedIds = Object.entries(usage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([id]) => id);
        
        if (mostUsedIds.length === 0) {
            document.getElementById('mostUsedSection').classList.add('hidden');
            return;
        }
        
        const mostUsedTools = mostUsedIds
            .map(id => allTools.find(tool => tool.id === id))
            .filter(Boolean);
        
        if (mostUsedTools.length > 0) {
            document.getElementById('mostUsedSection').classList.remove('hidden');
            document.getElementById('mostUsedTools').innerHTML = 
                mostUsedTools.map(tool => this.createToolCard(tool)).join('');
        }
    }
    
    // Usage Tracking
    trackToolUsage(toolId) {
        const usage = this.getFromLocalStorage('toolUsage', {});
        usage[toolId] = (usage[toolId] || 0) + 1;
        this.saveToLocalStorage('toolUsage', usage);
        
        // Update most used tools if needed
        setTimeout(() => this.loadMostUsedTools(), 100);
    }
    
    // Sorting
    handleSort(sortType) {
        this.currentSort = sortType;
        this.currentPage = 1;
        this.loadTools();
        this.saveToLocalStorage('sortPreference', sortType);
    }
    
    // Lazy Loading
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMoreTools();
                }
            });
        }, options);
    }
    
    setupLoadMore() {
        const loadMore = document.createElement('div');
        loadMore.id = 'loadMoreTrigger';
        loadMore.style.height = '10px';
        document.getElementById('toolsGrid').appendChild(loadMore);
        
        this.observer.observe(loadMore);
    }
    
    loadMoreTools() {
        const currentCount = this.currentPage * this.itemsPerPage;
        if (currentCount >= this.displayedTools.length) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        setTimeout(() => {
            this.renderTools();
            this.isLoading = false;
        }, 500);
    }
    
    // Loading States
    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }
    
    // Stats Update
    updateStats() {
        document.getElementById('totalTools').textContent = allTools.length;
        document.getElementById('totalCategories').textContent = categories.length - 1; // Exclude "All"
    }
    
    // Local Storage Management
    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(`toolhub_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }
    
    getFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`toolhub_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    }
    
    // User Preferences
    loadUserPreferences() {
        // Load theme
        const savedTheme = this.getFromLocalStorage('theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Load last category
        const lastCategory = this.getFromLocalStorage('lastCategory', 'all');
        this.currentFilter = lastCategory;
        
        // Load sort preference
        const sortPreference = this.getFromLocalStorage('sortPreference', 'name');
        this.currentSort = sortPreference;
        document.getElementById('sortSelect').value = sortPreference;
    }
    
    // Cookie Consent
    initializeCookieConsent() {
        const cookieConsent = this.getFromLocalStorage('cookieConsent');
        if (!cookieConsent) {
            setTimeout(() => {
                document.getElementById('cookieConsent').classList.remove('hidden');
            }, 2000);
        }
    }
    
    acceptCookies() {
        this.saveToLocalStorage('cookieConsent', 'accepted');
        document.getElementById('cookieConsent').classList.add('hidden');
        
        // Initialize analytics if accepted
        this.initializeAnalytics();
    }
    
    declineCookies() {
        this.saveToLocalStorage('cookieConsent', 'declined');
        document.getElementById('cookieConsent').classList.add('hidden');
    }
    
    initializeAnalytics() {
        // Add Google Analytics or other tracking here
        console.log('Analytics initialized');
    }
    
    // PWA Install
    initializePWAInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install banner if not dismissed
            const dismissed = this.getFromLocalStorage('pwaBannerDismissed');
            if (!dismissed) {
                setTimeout(() => {
                    document.getElementById('pwaInstallBanner').classList.remove('hidden');
                }, 5000);
            }
        });
        
        this.deferredPrompt = deferredPrompt;
    }
    
    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA installed');
        }
        
        this.deferredPrompt = null;
        document.getElementById('pwaInstallBanner').classList.add('hidden');
    }
    
    dismissPWABanner() {
        document.getElementById('pwaInstallBanner').classList.add('hidden');
        this.saveToLocalStorage('pwaBannerDismissed', true);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.toolsApp = new ToolsApp();
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}