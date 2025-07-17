// Search System
class SearchSystem {
    constructor() {
        this.searchInput = null;
        this.searchOverlay = null;
        this.searchResults = null;
        this.currentQuery = '';
        this.searchTimeout = null;
        this.searchHistory = [];
        this.init();
    }

    init() {
        this.setupElements();
        this.bindEvents();
        this.loadSearchHistory();
    }

    setupElements() {
        this.searchInput = Utils.$('#searchInput');
        this.searchOverlay = Utils.$('#searchOverlay');
        this.searchResults = Utils.$('#searchResults');
    }

    bindEvents() {
        // Search button clicks
        const searchButtons = Utils.$$('#searchBtn, #openSearch');
        searchButtons.forEach(btn => {
            btn.addEventListener('click', () => this.openSearch());
        });

        // Close search
        const closeSearch = Utils.$('#closeSearch');
        if (closeSearch) {
            closeSearch.addEventListener('click', () => this.closeSearch());
        }

        // Search overlay click to close
        if (this.searchOverlay) {
            this.searchOverlay.addEventListener('click', (e) => {
                if (e.target === this.searchOverlay) {
                    this.closeSearch();
                }
            });
        }

        // Search input events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            this.searchInput.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });

            this.searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });
        }

        // Escape key to close search
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSearchOpen()) {
                this.closeSearch();
            }
        });
    }

    openSearch() {
        if (this.searchOverlay) {
            Utils.show(this.searchOverlay, 'flex');
            if (this.searchInput) {
                this.searchInput.focus();
                this.showSearchSuggestions();
            }
        }
    }

    closeSearch() {
        if (this.searchOverlay) {
            Utils.hide(this.searchOverlay);
            this.clearSearchResults();
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            this.currentQuery = '';
        }
    }

    isSearchOpen() {
        return this.searchOverlay && !this.searchOverlay.classList.contains('hidden');
    }

    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            if (this.currentQuery.length === 0) {
                this.showSearchSuggestions();
            } else if (this.currentQuery.length >= 2) {
                this.performSearch(this.currentQuery);
            } else {
                this.clearSearchResults();
            }
        }, 300);
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && this.currentQuery.length >= 2) {
            e.preventDefault();
            this.performSearch(this.currentQuery);
            this.addToSearchHistory(this.currentQuery);
        }
    }

    async performSearch(query) {
        try {
            Utils.showLoading(this.searchResults, 'Searching...');
            
            const results = await this.searchTools(query);
            this.displaySearchResults(results, query);
            
            Utils.hideLoading(this.searchResults);
        } catch (error) {
            console.error('Search error:', error);
            Utils.hideLoading(this.searchResults);
            this.displaySearchError('An error occurred while searching');
        }
    }

    async searchTools(query) {
        const tools = await window.toolsManager.getAllTools();
        const categories = await window.categoriesManager.getAllCategories();
        
        const lowerQuery = query.toLowerCase();
        const results = {
            tools: [],
            categories: [],
            exactMatches: [],
            fuzzyMatches: []
        };

        // Search in tools
        tools.forEach(tool => {
            const score = this.calculateSearchScore(tool, lowerQuery);
            if (score > 0) {
                const result = { ...tool, searchScore: score };
                
                if (score >= 0.8) {
                    results.exactMatches.push(result);
                } else {
                    results.fuzzyMatches.push(result);
                }
                
                results.tools.push(result);
            }
        });

        // Search in categories
        categories.forEach(category => {
            const score = this.calculateCategorySearchScore(category, lowerQuery);
            if (score > 0) {
                results.categories.push({ ...category, searchScore: score });
            }
        });

        // Sort results by score
        results.tools.sort((a, b) => b.searchScore - a.searchScore);
        results.categories.sort((a, b) => b.searchScore - a.searchScore);
        results.exactMatches.sort((a, b) => b.searchScore - a.searchScore);
        results.fuzzyMatches.sort((a, b) => b.searchScore - a.searchScore);

        return results;
    }

    calculateSearchScore(tool, query) {
        let score = 0;
        const name = tool.name.toLowerCase();
        const description = tool.description.toLowerCase();
        const category = tool.category.toLowerCase();
        const features = (tool.features || []).join(' ').toLowerCase();

        // Exact name match (highest score)
        if (name === query) {
            score += 1.0;
        } else if (name.includes(query)) {
            score += 0.8;
        } else if (name.startsWith(query)) {
            score += 0.7;
        }

        // Description match
        if (description.includes(query)) {
            score += 0.5;
        }

        // Category match
        if (category.includes(query)) {
            score += 0.6;
        }

        // Features match
        if (features.includes(query)) {
            score += 0.4;
        }

        // Fuzzy matching for typos
        if (score === 0) {
            const fuzzyScore = this.fuzzyMatch(name, query);
            if (fuzzyScore > 0.7) {
                score += fuzzyScore * 0.3;
            }
        }

        // Boost popular tools
        const usage = storage.getToolUsage(tool.id);
        if (usage > 0) {
            score += Math.min(usage * 0.01, 0.2);
        }

        return score;
    }

    calculateCategorySearchScore(category, query) {
        let score = 0;
        const name = category.name.toLowerCase();
        const description = (category.description || '').toLowerCase();

        if (name === query) {
            score += 1.0;
        } else if (name.includes(query)) {
            score += 0.8;
        } else if (description.includes(query)) {
            score += 0.5;
        }

        return score;
    }

    fuzzyMatch(text, pattern) {
        const textLen = text.length;
        const patternLen = pattern.length;
        
        if (patternLen === 0) return 0;
        if (patternLen > textLen) return 0;

        let matches = 0;
        let textIndex = 0;

        for (let patternIndex = 0; patternIndex < patternLen; patternIndex++) {
            const char = pattern[patternIndex];
            
            while (textIndex < textLen) {
                if (text[textIndex] === char) {
                    matches++;
                    textIndex++;
                    break;
                }
                textIndex++;
            }
        }

        return matches / patternLen;
    }

    displaySearchResults(results, query) {
        if (!this.searchResults) return;

        const totalResults = results.tools.length + results.categories.length;
        
        if (totalResults === 0) {
            this.displayNoResults(query);
            return;
        }

        let html = `
            <div class="search-header-info">
                <h3>Search Results for "${Utils.escapeHtml(query)}"</h3>
                <p>${totalResults} result${totalResults !== 1 ? 's' : ''} found</p>
            </div>
        `;

        // Exact matches
        if (results.exactMatches.length > 0) {
            html += '<div class="search-section">';
            html += '<h4><i class="fas fa-bullseye"></i> Exact Matches</h4>';
            html += '<div class="search-tools-grid">';
            results.exactMatches.slice(0, 6).forEach(tool => {
                html += this.createToolSearchResult(tool, query);
            });
            html += '</div></div>';
        }

        // Categories
        if (results.categories.length > 0) {
            html += '<div class="search-section">';
            html += '<h4><i class="fas fa-folder"></i> Categories</h4>';
            html += '<div class="search-categories-grid">';
            results.categories.slice(0, 4).forEach(category => {
                html += this.createCategorySearchResult(category, query);
            });
            html += '</div></div>';
        }

        // Other tools
        const otherTools = results.fuzzyMatches.slice(0, 12);
        if (otherTools.length > 0) {
            html += '<div class="search-section">';
            html += '<h4><i class="fas fa-tools"></i> Other Tools</h4>';
            html += '<div class="search-tools-grid">';
            otherTools.forEach(tool => {
                html += this.createToolSearchResult(tool, query);
            });
            html += '</div></div>';
        }

        this.searchResults.innerHTML = html;
        this.bindSearchResultEvents();
    }

    createToolSearchResult(tool, query) {
        const highlightedName = this.highlightQuery(tool.name, query);
        const highlightedDescription = this.highlightQuery(
            Utils.truncate(tool.description, 80), 
            query
        );

        return `
            <div class="search-result-tool" data-tool-id="${tool.id}">
                <div class="tool-icon-search">
                    <i class="${tool.icon}"></i>
                </div>
                <div class="tool-info-search">
                    <h5>${highlightedName}</h5>
                    <p>${highlightedDescription}</p>
                    <div class="tool-meta">
                        <span class="tool-category">${tool.category}</span>
                        ${tool.rating ? `<span class="tool-rating">
                            <i class="fas fa-star"></i> ${tool.rating}
                        </span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    createCategorySearchResult(category, query) {
        const highlightedName = this.highlightQuery(category.name, query);
        const toolCount = category.toolCount || 0;

        return `
            <div class="search-result-category" data-category="${category.id}">
                <div class="category-icon-search">
                    <i class="${category.icon}"></i>
                </div>
                <div class="category-info-search">
                    <h5>${highlightedName}</h5>
                    <p>${toolCount} tool${toolCount !== 1 ? 's' : ''}</p>
                </div>
            </div>
        `;
    }

    highlightQuery(text, query) {
        if (!query || query.length < 2) return Utils.escapeHtml(text);
        
        const escapedText = Utils.escapeHtml(text);
        const escapedQuery = Utils.escapeHtml(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        return escapedText.replace(regex, '<mark>$1</mark>');
    }

    displayNoResults(query) {
        const suggestions = this.getSearchSuggestions(query);
        
        let html = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No results found for "${Utils.escapeHtml(query)}"</h3>
                <p>Try adjusting your search or browse our categories</p>
        `;

        if (suggestions.length > 0) {
            html += '<div class="search-suggestions">';
            html += '<h4>Did you mean?</h4>';
            html += '<div class="suggestion-tags">';
            suggestions.forEach(suggestion => {
                html += `<button class="suggestion-tag" data-suggestion="${Utils.escapeHtml(suggestion)}">${Utils.escapeHtml(suggestion)}</button>`;
            });
            html += '</div></div>';
        }

        html += '</div>';
        this.searchResults.innerHTML = html;
        this.bindSearchResultEvents();
    }

    getSearchSuggestions(query) {
        // Simple suggestions based on common tool categories and names
        const commonTerms = [
            'calculator', 'converter', 'generator', 'editor', 'viewer',
            'validator', 'formatter', 'compressor', 'analyzer', 'designer',
            'developer', 'productivity', 'utility', 'color', 'image',
            'text', 'code', 'json', 'css', 'html', 'javascript', 'api'
        ];

        return commonTerms
            .filter(term => {
                const distance = this.levenshteinDistance(query.toLowerCase(), term);
                return distance <= 2 && term !== query.toLowerCase();
            })
            .slice(0, 5);
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    showSearchSuggestions() {
        if (!this.searchResults) return;

        const history = this.getRecentSearchHistory();
        const popularTools = storage.getMostUsedTools(6);

        let html = '<div class="search-suggestions-home">';

        if (history.length > 0) {
            html += '<div class="suggestion-section">';
            html += '<h4><i class="fas fa-history"></i> Recent Searches</h4>';
            html += '<div class="suggestion-tags">';
            history.forEach(query => {
                html += `<button class="suggestion-tag" data-suggestion="${Utils.escapeHtml(query)}">${Utils.escapeHtml(query)}</button>`;
            });
            html += '</div></div>';
        }

        if (popularTools.length > 0) {
            html += '<div class="suggestion-section">';
            html += '<h4><i class="fas fa-fire"></i> Popular Tools</h4>';
            html += '<div class="popular-tools-quick">';
            
            for (const toolUsage of popularTools) {
                const tool = window.toolsManager.getToolById(toolUsage.toolId);
                if (tool) {
                    html += `
                        <div class="popular-tool-quick" data-tool-id="${tool.id}">
                            <i class="${tool.icon}"></i>
                            <span>${tool.name}</span>
                        </div>
                    `;
                }
            }
            html += '</div></div>';
        }

        html += '</div>';
        this.searchResults.innerHTML = html;
        this.bindSearchResultEvents();
    }

    bindSearchResultEvents() {
        // Tool clicks
        const toolResults = Utils.$$('.search-result-tool, .popular-tool-quick', this.searchResults);
        toolResults.forEach(result => {
            result.addEventListener('click', () => {
                const toolId = result.dataset.toolId;
                if (toolId) {
                    this.handleToolClick(toolId);
                }
            });
        });

        // Category clicks
        const categoryResults = Utils.$$('.search-result-category', this.searchResults);
        categoryResults.forEach(result => {
            result.addEventListener('click', () => {
                const categoryId = result.dataset.category;
                if (categoryId) {
                    this.handleCategoryClick(categoryId);
                }
            });
        });

        // Suggestion clicks
        const suggestions = Utils.$$('.suggestion-tag', this.searchResults);
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const query = suggestion.dataset.suggestion;
                if (query) {
                    this.searchInput.value = query;
                    this.performSearch(query);
                }
            });
        });
    }

    handleToolClick(toolId) {
        storage.trackToolUsage(toolId);
        
        if (this.currentQuery) {
            this.addToSearchHistory(this.currentQuery);
        }

        // Open tool in new tab
        const tool = window.toolsManager.getToolById(toolId);
        if (tool && tool.link) {
            window.open(tool.link, '_blank');
        }

        this.closeSearch();
        Utils.showSuccess(`Opened ${tool ? tool.name : 'tool'}`);
    }

    handleCategoryClick(categoryId) {
        if (this.currentQuery) {
            this.addToSearchHistory(this.currentQuery);
        }

        // Navigate to tools page with category filter
        window.app.navigateToTools(categoryId);
        this.closeSearch();
    }

    addToSearchHistory(query) {
        storage.addSearchHistory(query);
        this.loadSearchHistory();
    }

    loadSearchHistory() {
        this.searchHistory = storage.getSearchHistory(10);
    }

    getRecentSearchHistory() {
        return this.searchHistory.slice(0, 5);
    }

    clearSearchResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
    }

    displaySearchError(message) {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Search Error</h3>
                    <p>${Utils.escapeHtml(message)}</p>
                    <button class="retry-search">Try Again</button>
                </div>
            `;

            const retryBtn = this.searchResults.querySelector('.retry-search');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    if (this.currentQuery) {
                        this.performSearch(this.currentQuery);
                    }
                });
            }
        }
    }

    // Public API
    search(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
        }
        this.currentQuery = query;
        this.openSearch();
        this.performSearch(query);
    }

    clearHistory() {
        storage.clearSearchHistory();
        this.loadSearchHistory();
    }
}

// Initialize search system
document.addEventListener('DOMContentLoaded', () => {
    window.searchSystem = new SearchSystem();
});

// Add search styles
const searchStyles = `
    .search-header-info {
        padding: 1rem 0;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 1rem;
    }

    .search-header-info h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .search-header-info p {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .search-section {
        margin-bottom: 2rem;
    }

    .search-section h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary);
    }

    .search-tools-grid {
        display: grid;
        gap: 0.75rem;
    }

    .search-result-tool {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .search-result-tool:hover {
        background: var(--bg-tertiary);
        transform: translateY(-2px);
    }

    .tool-icon-search {
        width: 40px;
        height: 40px;
        background: var(--primary-color);
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .tool-info-search h5 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .tool-info-search p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .tool-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.75rem;
    }

    .tool-category {
        background: var(--bg-primary);
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        color: var(--text-muted);
    }

    .tool-rating {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .search-categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .search-result-category {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .search-result-category:hover {
        background: var(--bg-tertiary);
        transform: translateY(-2px);
    }

    .category-icon-search {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .no-results {
        text-align: center;
        padding: 2rem;
    }

    .no-results-icon {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }

    .search-suggestions {
        margin-top: 2rem;
    }

    .suggestion-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .suggestion-tag {
        padding: 0.5rem 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .suggestion-tag:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .search-suggestions-home {
        padding: 1rem 0;
    }

    .suggestion-section {
        margin-bottom: 2rem;
    }

    .popular-tools-quick {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
    }

    .popular-tool-quick {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .popular-tool-quick:hover {
        background: var(--primary-color);
        color: white;
    }

    .popular-tool-quick i {
        font-size: 1rem;
        color: var(--primary-color);
    }

    .popular-tool-quick:hover i {
        color: white;
    }

    .search-error {
        text-align: center;
        padding: 2rem;
    }

    .error-icon {
        font-size: 3rem;
        color: #ef4444;
        margin-bottom: 1rem;
    }

    .retry-search {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .retry-search:hover {
        background: var(--primary-hover);
    }

    mark {
        background: var(--primary-color);
        color: white;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
    }
`;

// Inject search styles
const styleSheet = document.createElement('style');
styleSheet.textContent = searchStyles;
document.head.appendChild(styleSheet);