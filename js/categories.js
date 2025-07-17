// Categories Management System
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.init();
    }

    async init() {
        try {
            await this.loadCategories();
            this.setupEventListeners();
            this.displayCategories();
        } catch (error) {
            console.error('Failed to initialize categories manager:', error);
        }
    }

    async loadCategories() {
        // Try to load from cache first
        const cachedCategories = storage.getCachedData('categories');
        if (cachedCategories && storage.isCacheValid()) {
            this.categories = cachedCategories;
            return;
        }

        // Load from data file
        try {
            const response = await fetch('./data/categories.json');
            if (!response.ok) {
                throw new Error('Failed to fetch categories data');
            }
            
            this.categories = await response.json();
            
            // Cache the categories
            storage.setCachedData('categories', this.categories);
            
            console.log(`Loaded ${this.categories.length} categories`);
        } catch (error) {
            console.error('Error loading categories:', error);
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
        this.displayCategoriesGrid();
        this.populateCategoryFilter();
        this.displayFooterCategories();
    }

    displayCategoriesGrid() {
        const container = Utils.$('#categoriesGrid');
        if (!container) return;

        const categoriesWithCounts = this.getCategoriesWithToolCounts();
        
        let html = '';
        categoriesWithCounts.forEach((category, index) => {
            html += this.createCategoryCard(category, index);
        });

        container.innerHTML = html;
        this.animateCategoryCards();
    }

    createCategoryCard(category, index) {
        const toolCount = this.getToolCountForCategory(category.id);
        
        return `
            <div class="category-card fade-in" 
                 data-category-id="${category.id}"
                 style="animation-delay: ${index * 100}ms">
                <div class="category-icon" style="background: ${category.color}">
                    <i class="${category.icon}"></i>
                </div>
                <h3>${Utils.escapeHtml(category.name)}</h3>
                <div class="category-count">${toolCount} tool${toolCount !== 1 ? 's' : ''}</div>
                <div class="category-description">
                    ${Utils.escapeHtml(category.description)}
                </div>
            </div>
        `;
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
        if (!window.toolsManager) return 0;
        
        const tools = window.toolsManager.getToolsByCategory(categoryId);
        return tools.length;
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