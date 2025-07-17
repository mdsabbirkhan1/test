// Categories Management System
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing CategoriesManager...');
            
            // Check dependencies
            if (!window.storage) {
                console.warn('Storage not available, waiting...');
                await this.waitForStorage();
            }
            
            await this.loadCategories();
            this.setupEventListeners();
            this.displayCategories();
            console.log('CategoriesManager initialization complete');
        } catch (error) {
            console.error('Failed to initialize categories manager:', error);
            // Use fallback initialization
            this.initializeFallback();
        }
    }

    async waitForStorage() {
        const maxWait = 5000; // 5 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;

        while (!window.storage && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }

        if (!window.storage) {
            console.error('Storage still not available after waiting');
        }
    }

    initializeFallback() {
        console.log('Initializing categories with fallback...');
        this.categories = this.getDefaultCategories();
        this.setupEventListeners();
        this.displayCategories();
    }

    async loadCategories() {
        try {
            // Try to load from cache first
            let cachedCategories = null;
            if (window.storage) {
                try {
                    cachedCategories = storage.getCachedData('categories');
                } catch (cacheError) {
                    console.warn('Error accessing cache:', cacheError);
                }
            }
            
            if (cachedCategories && cachedCategories.length > 0) {
                console.log('Loading categories from cache:', cachedCategories.length);
                this.categories = cachedCategories;
                return;
            }

            // Load from data file
            console.log('Fetching categories from server...');
            const response = await fetch('./data/categories.json');
            console.log('Categories fetch response:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const categories = await response.json();
            console.log('Raw categories data:', categories);
            
            if (!Array.isArray(categories) || categories.length === 0) {
                throw new Error('No valid categories found in response');
            }
            
            this.categories = categories;
            
            // Cache the categories
            if (window.storage) {
                try {
                    storage.setCachedData('categories', this.categories);
                } catch (cacheError) {
                    console.warn('Error caching categories:', cacheError);
                }
            }
            
            console.log(`Successfully loaded ${this.categories.length} categories`);
        } catch (error) {
            console.error('Error loading categories:', error);
            console.log('Using default categories as fallback');
            // Fallback to default categories
            this.categories = this.getDefaultCategories();
        }
    }

    getDefaultCategories() {
        return [
            {
                id: 'development',
                name: 'Development',
                icon: 'fas fa-code',
                description: 'Tools for developers and programmers',
                color: '#6366f1'
            },
            {
                id: 'design',
                name: 'Design',
                icon: 'fas fa-palette',
                description: 'Design and creative tools',
                color: '#ec4899'
            },
            {
                id: 'productivity',
                name: 'Productivity',
                icon: 'fas fa-tasks',
                description: 'Tools to boost your productivity',
                color: '#10b981'
            },
            {
                id: 'utilities',
                name: 'Utilities',
                icon: 'fas fa-wrench',
                description: 'General utility tools',
                color: '#f59e0b'
            }
        ];
    }

    setupEventListeners() {
        // Category card clicks
        document.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.category-card');
            if (categoryCard && categoryCard.dataset.categoryId) {
                this.selectCategory(categoryCard.dataset.categoryId);
            }
        });
    }

    displayCategories() {
        try {
            console.log('Displaying categories, count:', this.categories.length);
            this.displayCategoriesGrid();
            this.populateCategoryFilter();
            this.displayFooterCategories();
            console.log('Categories display completed successfully');
        } catch (error) {
            console.error('Error displaying categories:', error);
            this.showCategoriesError();
        }
    }

    displayCategoriesGrid() {
        const container = Utils.$('#categoriesGrid');
        if (!container) {
            console.error('Categories grid container not found');
            return;
        }

        console.log('Categories container found, displaying grid...');

        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="no-categories">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Categories Available</h3>
                    <p>Categories are still loading or there was an error.</p>
                </div>
            `;
            return;
        }

        try {
            const categoriesWithCounts = this.getCategoriesWithToolCounts();
            
            let html = '';
            categoriesWithCounts.forEach((category, index) => {
                html += this.createCategoryCard(category, index);
            });

            container.innerHTML = html;
            this.animateCategoryCards();
            console.log('Categories grid displayed successfully');
        } catch (error) {
            console.error('Error creating categories grid:', error);
            this.showCategoriesGridError(container);
        }
    }

    showCategoriesError() {
        const container = Utils.$('#categoriesGrid');
        if (container) {
            this.showCategoriesGridError(container);
        }
    }

    showCategoriesGridError(container) {
        container.innerHTML = `
            <div class="categories-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Categories</h3>
                <p>There was a problem loading the categories. Please try refreshing the page.</p>
                <button onclick="window.categoriesManager.refreshCategories()" class="btn-secondary">
                    <i class="fas fa-refresh"></i>
                    Retry
                </button>
            </div>
        `;
    }

    createCategoryCard(category, index) {
        try {
            const toolCount = this.getToolCountForCategory(category.id);
            const safeColor = category.color || '#6366f1';
            const safeIcon = category.icon || 'fas fa-folder';
            const safeName = Utils.escapeHtml(category.name || 'Unknown Category');
            const safeDescription = Utils.escapeHtml(category.description || 'No description available');
            
            return `
                <div class="category-card fade-in" 
                     data-category-id="${category.id}"
                     style="animation-delay: ${index * 100}ms">
                    <div class="category-icon" style="background: ${safeColor}">
                        <i class="${safeIcon}"></i>
                    </div>
                    <h3>${safeName}</h3>
                    <div class="category-count">${toolCount} tool${toolCount !== 1 ? 's' : ''}</div>
                    <div class="category-description">
                        ${safeDescription}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating category card for:', category, error);
            return `
                <div class="category-card error-card">
                    <div class="category-icon" style="background: #ef4444">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Error</h3>
                    <div class="category-description">Failed to load category</div>
                </div>
            `;
        }
    }

    populateCategoryFilter() {
        const select = Utils.$('#categoryFilter');
        if (!select) return;

        // Clear existing options except "All Categories"
        const allOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (allOption) {
            select.appendChild(allOption);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'All Categories';
            select.appendChild(option);
        }

        // Add category options
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    displayFooterCategories() {
        const container = Utils.$('#footerCategories');
        if (!container) return;

        let html = '';
        this.categories.slice(0, 6).forEach(category => {
            html += `
                <li>
                    <a href="#" data-category-id="${category.id}">
                        ${Utils.escapeHtml(category.name)}
                    </a>
                </li>
            `;
        });

        container.innerHTML = html;

        // Add click handlers for footer category links
        container.addEventListener('click', (e) => {
            if (e.target.dataset.categoryId) {
                e.preventDefault();
                this.selectCategory(e.target.dataset.categoryId);
            }
        });
    }

    getCategoriesWithToolCounts() {
        return this.categories.map(category => ({
            ...category,
            toolCount: this.getToolCountForCategory(category.id)
        }));
    }

    getToolCountForCategory(categoryId) {
        if (!window.toolsManager) {
            console.log('ToolsManager not available for category count');
            return 0;
        }
        
        try {
            const tools = window.toolsManager.getToolsByCategory(categoryId);
            return tools ? tools.length : 0;
        } catch (error) {
            console.error('Error getting tool count for category:', categoryId, error);
            return 0;
        }
    }

    animateCategoryCards() {
        const cards = Utils.$$('.category-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                Utils.addClass(card, 'slide-up');
            }, index * 100);
        });
    }

    selectCategory(categoryId) {
        // Navigate to tools page with category filter
        if (window.app) {
            window.app.navigateToTools(categoryId);
        } else {
            // Fallback if app navigation not available
            window.location.href = `?page=tools&category=${categoryId}`;
        }
    }

    // Public API methods
    getAllCategories() {
        return this.categories;
    }

    getCategoryById(id) {
        return this.categories.find(category => category.id === id);
    }

    getCategoryByName(name) {
        return this.categories.find(category => 
            category.name.toLowerCase() === name.toLowerCase()
        );
    }

    getCategoryColor(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.color : '#6366f1';
    }

    getCategoryIcon(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.icon : 'fas fa-folder';
    }

    searchCategories(query) {
        const lowerQuery = query.toLowerCase();
        return this.categories.filter(category =>
            category.name.toLowerCase().includes(lowerQuery) ||
            category.description.toLowerCase().includes(lowerQuery)
        );
    }

    async refreshCategories() {
        try {
            // Clear cache and reload
            storage.clearCache();
            await this.loadCategories();
            this.displayCategories();
            Utils.showSuccess('Categories refreshed successfully!');
        } catch (error) {
            console.error('Failed to refresh categories:', error);
            Utils.showError('Failed to refresh categories');
        }
    }
}

// Initialize categories manager
document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
});

// Add category-specific styles
const categoryStyles = `
    .category-card {
        cursor: pointer;
        transition: all var(--transition-normal);
        position: relative;
        overflow: hidden;
    }

    .category-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--primary-color);
        transform: scaleX(0);
        transition: transform var(--transition-normal);
    }

    .category-card:hover::before {
        transform: scaleX(1);
    }

    .category-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-color);
    }

    .category-card:hover .category-icon {
        transform: scale(1.1);
    }

    .category-icon {
        transition: transform var(--transition-normal);
        box-shadow: var(--shadow-md);
    }

    .category-card h3 {
        transition: color var(--transition-fast);
    }

    .category-card:hover h3 {
        color: var(--primary-color);
    }

    .category-count {
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: var(--space-sm);
    }

    @media (max-width: 768px) {
        .categories-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        
        .category-card {
            padding: var(--space-lg);
        }
        
        .category-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
        }
    }
`;

// Inject category styles
const categoryStyleSheet = document.createElement('style');
categoryStyleSheet.textContent = categoryStyles;
document.head.appendChild(categoryStyleSheet);