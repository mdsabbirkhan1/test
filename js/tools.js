// Tools Management System
class ToolsManager {
    constructor() {
        this.tools = [];
        this.filteredTools = [];
        this.currentPage = 1;
        this.toolsPerPage = 12;
        this.currentCategory = '';
        this.currentSort = 'usage';
        this.currentView = 'grid';
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            await this.loadTools();
            this.setupEventListeners();
            this.initializeView();
        } catch (error) {
            console.error('Failed to initialize tools manager:', error);
            Utils.showError('Failed to load tools');
        }
    }

    async loadTools() {
        // Try to load from cache first
        const cachedTools = storage.getCachedData('tools');
        if (cachedTools && storage.isCacheValid()) {
            this.tools = cachedTools;
            return;
        }

        // Load from sample data (in real app, this would be an API call)
        try {
            const response = await fetch('./data/sample-tools.json');
            if (!response.ok) {
                throw new Error('Failed to fetch tools data');
            }
            
            this.tools = await response.json();
            
            // Cache the tools
            storage.setCachedData('tools', this.tools);
            
            console.log(`Loaded ${this.tools.length} tools`);
        } catch (error) {
            console.error('Error loading tools:', error);
            // Fallback to empty array if sample data fails
            this.tools = [];
        }
    }

    setupEventListeners() {
        // Category filter
        const categoryFilter = Utils.$('#categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.setCategory(e.target.value);
            });
        }

        // Sort filter
        const sortBy = Utils.$('#sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.setSortBy(e.target.value);
            });
        }

        // View toggles
        const gridViewBtn = Utils.$('#gridViewBtn');
        const listViewBtn = Utils.$('#listViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setView('grid');
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.setView('list');
            });
        }

        // Page navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page="tools"]') || e.target.closest('[data-page="tools"]')) {
                this.showToolsPage();
            }
        });
    }

    initializeView() {
        // Load user preferences
        this.currentView = storage.getSetting('view') || 'grid';
        this.currentSort = storage.getSetting('sortBy') || 'usage';
        
        // Update UI controls
        this.updateViewControls();
        this.updateSortControl();
        
        // Initial filter and display
        this.filterAndSort();
    }

    setCategory(categoryId) {
        this.currentCategory = categoryId;
        this.currentPage = 1;
        this.filterAndSort();
        this.updateURL();
    }

    setSortBy(sortBy) {
        this.currentSort = sortBy;
        storage.setSetting('sortBy', sortBy);
        this.filterAndSort();
    }

    setView(view) {
        this.currentView = view;
        storage.setSetting('view', view);
        this.updateViewControls();
        this.updateToolsDisplay();
    }

    updateViewControls() {
        const gridBtn = Utils.$('#gridViewBtn');
        const listBtn = Utils.$('#listViewBtn');
        
        if (gridBtn && listBtn) {
            Utils.removeClass(gridBtn, 'active');
            Utils.removeClass(listBtn, 'active');
            
            if (this.currentView === 'grid') {
                Utils.addClass(gridBtn, 'active');
            } else {
                Utils.addClass(listBtn, 'active');
            }
        }

        const toolsContainer = Utils.$('#toolsContainer');
        if (toolsContainer) {
            Utils.removeClass(toolsContainer, 'list-view');
            if (this.currentView === 'list') {
                Utils.addClass(toolsContainer, 'list-view');
            }
        }
    }

    updateSortControl() {
        const sortSelect = Utils.$('#sortBy');
        if (sortSelect) {
            sortSelect.value = this.currentSort;
        }
    }

    filterAndSort() {
        this.filteredTools = [...this.tools];

        // Filter by category
        if (this.currentCategory) {
            this.filteredTools = this.filteredTools.filter(tool => 
                tool.category === this.currentCategory
            );
        }

        // Sort tools
        this.sortTools();

        // Update display
        this.updateToolsDisplay();
        this.updateStats();
    }

    sortTools() {
        switch (this.currentSort) {
            case 'usage':
                this.filteredTools.sort((a, b) => {
                    const usageA = storage.getToolUsage(a.id);
                    const usageB = storage.getToolUsage(b.id);
                    return usageB - usageA;
                });
                break;
            
            case 'rating':
                this.filteredTools.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            
            case 'name':
                this.filteredTools.sort((a, b) => a.name.localeCompare(b.name));
                break;
            
            case 'date':
                this.filteredTools.sort((a, b) => 
                    new Date(b.dateAdded) - new Date(a.dateAdded)
                );
                break;
            
            default:
                // Default sort by usage
                this.filteredTools.sort((a, b) => {
                    const usageA = storage.getToolUsage(a.id);
                    const usageB = storage.getToolUsage(b.id);
                    return usageB - usageA;
                });
        }
    }

    updateToolsDisplay() {
        const container = Utils.$('#toolsContainer .tools-grid') || Utils.$('#toolsContainer');
        if (!container) return;

        if (this.filteredTools.length === 0) {
            this.showNoTools(container);
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.toolsPerPage;
        const endIndex = startIndex + this.toolsPerPage;
        const toolsToShow = this.filteredTools.slice(startIndex, endIndex);

        // Generate HTML
        let html = '<div class="tools-grid">';
        
        toolsToShow.forEach((tool, index) => {
            html += this.createToolCard(tool, startIndex + index);
        });
        
        html += '</div>';

        // Add pagination if needed
        if (this.filteredTools.length > this.toolsPerPage) {
            html += this.createPagination();
        }

        container.innerHTML = html;
        
        // Setup lazy loading
        this.setupToolCardEvents();
        Utils.lazyLoad('.tool-card.lazy-load');
        
        // Animate cards
        this.animateToolCards();
    }

    createToolCard(tool, index) {
        const usage = storage.getToolUsage(tool.id);
        const isFavorite = storage.isFavoriteTool(tool.id);
        const rating = tool.rating ? tool.rating.toFixed(1) : 'N/A';
        
        return `
            <div class="tool-card lazy-load fade-in" 
                 data-tool-id="${tool.id}" 
                 style="animation-delay: ${index * 50}ms">
                <div class="tool-header">
                    <div class="tool-icon-card" style="background: ${this.getCategoryColor(tool.category)}">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${Utils.escapeHtml(tool.name)}</h3>
                        <span class="tool-category">${Utils.capitalize(tool.category)}</span>
                    </div>
                    <div class="tool-actions">
                        <button class="tool-action favorite-btn ${isFavorite ? 'active' : ''}" 
                                data-tool-id="${tool.id}" 
                                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="tool-action share-btn" 
                                data-tool-id="${tool.id}" 
                                title="Share tool">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
                
                <div class="tool-description">
                    ${Utils.escapeHtml(tool.description)}
                </div>
                
                ${tool.features && tool.features.length > 0 ? `
                    <div class="tool-features">
                        ${tool.features.slice(0, 3).map(feature => 
                            `<span class="feature-tag">${Utils.escapeHtml(feature)}</span>`
                        ).join('')}
                        ${tool.features.length > 3 ? 
                            `<span class="feature-tag more">+${tool.features.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
                
                <div class="tool-footer">
                    <div class="tool-rating">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                        ${usage > 0 ? `<span class="usage-count">• Used ${usage}x</span>` : ''}
                    </div>
                    ${tool.badge ? `<span class="tool-badge">${Utils.escapeHtml(tool.badge)}</span>` : ''}
                </div>
                
                ${tool.pricing && tool.pricing !== 'Free' ? `
                    <div class="tool-pricing">
                        <i class="fas fa-tag"></i>
                        <span>${Utils.escapeHtml(tool.pricing)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getCategoryColor(categoryId) {
        const categoryColors = {
            development: '#6366f1',
            design: '#ec4899',
            productivity: '#10b981',
            utilities: '#f59e0b',
            converters: '#8b5cf6',
            generators: '#ef4444',
            analyzers: '#06b6d4',
            calculators: '#84cc16'
        };
        return categoryColors[categoryId] || '#6366f1';
    }

    createPagination() {
        const totalPages = Math.ceil(this.filteredTools.length / this.toolsPerPage);
        if (totalPages <= 1) return '';

        let html = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="pagination-btn" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += '<span class="pagination-dots">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                     data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-dots">...</span>';
            }
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        return html;
    }

    showNoTools(container) {
        container.innerHTML = `
            <div class="no-tools">
                <div class="no-tools-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No tools found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button class="btn-secondary" onclick="window.toolsManager.clearFilters()">
                    <i class="fas fa-refresh"></i>
                    Clear Filters
                </button>
            </div>
        `;
    }

    setupToolCardEvents() {
        // Tool card clicks
        const toolCards = Utils.$$('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.tool-actions')) return;
                
                const toolId = card.dataset.toolId;
                this.openTool(toolId);
            });
        });

        // Favorite buttons
        const favoriteButtons = Utils.$$('.favorite-btn');
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const toolId = btn.dataset.toolId;
                this.toggleFavorite(toolId, btn);
            });
        });

        // Share buttons
        const shareButtons = Utils.$$('.share-btn');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const toolId = btn.dataset.toolId;
                this.shareTool(toolId);
            });
        });

        // Pagination buttons
        const paginationButtons = Utils.$$('.pagination-btn');
        paginationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.goToPage(page);
            });
        });
    }

    animateToolCards() {
        const cards = Utils.$$('.tool-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                Utils.addClass(card, 'slide-up');
            }, index * 50);
        });
    }

    openTool(toolId) {
        const tool = this.getToolById(toolId);
        if (!tool) return;

        // Track usage
        storage.trackToolUsage(toolId);
        
        // Open tool link
        if (tool.link && tool.link !== '#') {
            window.open(tool.link, '_blank');
            Utils.showSuccess(`Opened ${tool.name}`);
        } else {
            Utils.showError('Tool link not available');
        }
        
        // Update display to reflect new usage
        this.updateToolsDisplay();
    }

    toggleFavorite(toolId, button) {
        const tool = this.getToolById(toolId);
        if (!tool) return;

        const isFavorite = storage.isFavoriteTool(toolId);
        
        if (isFavorite) {
            storage.removeFavoriteTool(toolId);
            Utils.removeClass(button, 'active');
            Utils.showSuccess(`Removed ${tool.name} from favorites`);
        } else {
            storage.addFavoriteTool(toolId);
            Utils.addClass(button, 'active');
            Utils.showSuccess(`Added ${tool.name} to favorites`);
        }
    }

    async shareTool(toolId) {
        const tool = this.getToolById(toolId);
        if (!tool) return;

        const shareData = {
            title: tool.name,
            text: tool.description,
            url: tool.link !== '#' ? tool.link : window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                Utils.showSuccess('Shared successfully!');
            } else {
                // Fallback to clipboard
                await Utils.copyToClipboard(shareData.url);
                Utils.showSuccess('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Utils.showError('Failed to share');
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.updateToolsDisplay();
        
        // Scroll to top of tools
        const toolsHeader = Utils.$('.tools-header');
        if (toolsHeader) {
            toolsHeader.scrollIntoView({ behavior: 'smooth' });
        }
    }

    clearFilters() {
        this.currentCategory = '';
        this.currentPage = 1;
        
        // Reset UI controls
        const categoryFilter = Utils.$('#categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = '';
        }
        
        this.filterAndSort();
        this.updateURL();
    }

    updateStats() {
        // Update tools count
        const toolsCountEl = Utils.$('#toolsCount');
        if (toolsCountEl) {
            this.animateNumber(toolsCountEl, parseInt(toolsCountEl.textContent) || 0, this.tools.length);
        }

        // Update category count if on home page
        const categoriesCountEl = Utils.$('#categoriesCount');
        if (categoriesCountEl && window.categoriesManager) {
            const categories = window.categoriesManager.getAllCategories();
            this.animateNumber(categoriesCountEl, parseInt(categoriesCountEl.textContent) || 0, categories.length);
        }
    }

    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.currentCategory) {
            params.set('category', this.currentCategory);
        }
        
        if (this.currentPage > 1) {
            params.set('page', this.currentPage);
        }
        
        const url = new URL(window.location);
        url.search = params.toString();
        window.history.replaceState({}, '', url);
    }

    showToolsPage(categoryId = null) {
        if (categoryId) {
            this.setCategory(categoryId);
        }
        
        // Navigate to tools page
        window.app?.showPage('tools');
    }

    // Public API methods
    getAllTools() {
        return this.tools;
    }

    getToolById(id) {
        return this.tools.find(tool => tool.id === id);
    }

    getToolsByCategory(categoryId) {
        return this.tools.filter(tool => tool.category === categoryId);
    }

    getPopularTools(limit = 6) {
        const mostUsed = storage.getMostUsedTools(limit);
        return mostUsed.map(usage => this.getToolById(usage.toolId)).filter(Boolean);
    }

    getFavoriteTools() {
        const favoriteIds = storage.getFavoriteTools();
        return favoriteIds.map(id => this.getToolById(id)).filter(Boolean);
    }

    searchTools(query) {
        const lowerQuery = query.toLowerCase();
        return this.tools.filter(tool => 
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery) ||
            tool.category.toLowerCase().includes(lowerQuery) ||
            (tool.features && tool.features.some(feature => 
                feature.toLowerCase().includes(lowerQuery)
            ))
        );
    }

    async refreshTools() {
        this.isLoading = true;
        
        try {
            // Clear cache and reload
            storage.clearCache();
            await this.loadTools();
            this.filterAndSort();
            Utils.showSuccess('Tools refreshed successfully!');
        } catch (error) {
            console.error('Failed to refresh tools:', error);
            Utils.showError('Failed to refresh tools');
        } finally {
            this.isLoading = false;
        }
    }
}

// Initialize tools manager
document.addEventListener('DOMContentLoaded', () => {
    window.toolsManager = new ToolsManager();
});

// Add tools-specific styles
const toolsStyles = `
    .tool-actions {
        display: flex;
        gap: 0.5rem;
    }

    .tool-action {
        background: none;
        border: none;
        padding: 0.5rem;
        border-radius: 0.375rem;
        color: var(--text-muted);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: 0.875rem;
    }

    .tool-action:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .tool-action.active {
        color: var(--primary-color);
    }

    .favorite-btn.active {
        color: #ef4444;
    }

    .tool-features {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .feature-tag {
        font-size: 0.75rem;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        white-space: nowrap;
    }

    .feature-tag.more {
        background: var(--primary-color);
        color: white;
    }

    .tool-pricing {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--accent-color);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .usage-count {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 2rem;
        padding: 1rem;
    }

    .pagination-btn {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        background: var(--bg-primary);
        color: var(--text-secondary);
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: 0.875rem;
        min-width: 40px;
    }

    .pagination-btn:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .pagination-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .pagination-dots {
        color: var(--text-muted);
        padding: 0 0.5rem;
    }

    .no-tools {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }

    .no-tools-icon {
        font-size: 4rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }

    .no-tools h3 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .no-tools p {
        margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
        .tool-features {
            gap: 0.25rem;
        }
        
        .feature-tag {
            font-size: 0.6875rem;
            padding: 0.125rem 0.375rem;
        }
        
        .pagination {
            gap: 0.25rem;
        }
        
        .pagination-btn {
            padding: 0.375rem 0.5rem;
            min-width: 32px;
            font-size: 0.75rem;
        }
    }
`;

// Inject tools styles
const toolsStyleSheet = document.createElement('style');
toolsStyleSheet.textContent = toolsStyles;
document.head.appendChild(toolsStyleSheet);