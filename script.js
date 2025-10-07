// ========== Configuration ==========
const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
const CACHE_KEY = 'gamesCacheData';
const CACHE_TIMESTAMP_KEY = 'gamesCacheTimestamp';
const RECENT_GAMES_KEY = 'recentlyPlayedGames';
const THEME_KEY = 'selectedTheme';

// ========== State Management ==========
let allGames = [];
let offlineGames = [];
let currentFilter = 'all';
let searchQuery = '';
let recentlyPlayed = [];
let categories = new Set(['all']);

// ========== Initialize App ==========
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    checkCacheExpiry();
    await loadGames();
    loadRecentlyPlayed();
    renderCategories();
    renderRecentGames();
    renderGames();
    attachEventListeners();
});

// ========== Theme Management ==========
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// ========== Cache Management ==========
function checkCacheExpiry() {
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cacheTimestamp) {
        const now = Date.now();
        const elapsed = now - parseInt(cacheTimestamp);
        
        if (elapsed > CACHE_DURATION) {
            console.log('Cache expired, clearing...');
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
    }
}

function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
        console.error('Failed to save to cache:', e);
    }
}

function getFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        console.error('Failed to read from cache:', e);
        return null;
    }
}

// ========== Load Games Data ==========
async function loadGames() {
    const loadingSpinner = document.getElementById('loading-spinner');
    
    try {
        // Try to load from cache first
        const cachedData = getFromCache();
        
        if (cachedData) {
            console.log('Loading from cache...');
            allGames = cachedData;
            extractCategories();
            hideLoader();
            return;
        }

        // Load from JSON files
        loadingSpinner.classList.remove('hidden');
        
        const [gamesResponse, offlineResponse] = await Promise.all([
            fetch('gamedata.json'),
            fetch('offlinegameadd.json').catch(() => ({ ok: false }))
        ]);

        if (gamesResponse.ok) {
            const gamesData = await gamesResponse.json();
            allGames = Array.isArray(gamesData) ? gamesData : [];
        }

        if (offlineResponse.ok) {
            offlineGames = await offlineResponse.json();
            offlineGames = Array.isArray(offlineGames) ? offlineGames : [];
        }

        // Merge online and offline games
        allGames = [...allGames, ...offlineGames];
        
        // Save to cache
        saveToCache(allGames);
        extractCategories();
        
    } catch (error) {
        console.error('Error loading games:', error);
        showError('Failed to load games. Please refresh the page.');
    } finally {
        hideLoader();
    }
}

function hideLoader() {
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    const noResults = document.getElementById('no-results');
    noResults.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Error</h3>
        <p>${message}</p>
    `;
    noResults.classList.remove('hidden');
}

// ========== Categories ==========
function extractCategories() {
    categories = new Set(['all']);
    allGames.forEach(game => {
        if (game.category) {
            categories.add(game.category.toLowerCase());
        }
    });
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    const categoriesArray = Array.from(categories);
    
    container.innerHTML = categoriesArray.map(cat => {
        const displayName = cat === 'all' ? 'All Games' : 
            cat.charAt(0).toUpperCase() + cat.slice(1);
        const activeClass = cat === currentFilter ? 'active' : '';
        return `<button class="category-btn ${activeClass}" data-category="${cat}">${displayName}</button>`;
    }).join('');
}

// ========== Render Games ==========
function renderGames() {
    const gamesGrid = document.getElementById('games-grid');
    const noResults = document.getElementById('no-results');
    const gamesTitle = document.getElementById('games-title');
    
    let filteredGames = allGames;
    
    // Apply category filter
    if (currentFilter !== 'all') {
        filteredGames = filteredGames.filter(game => 
            game.category && game.category.toLowerCase() === currentFilter
        );
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredGames = filteredGames.filter(game => 
            game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (game.category && game.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    
    // Update title
    const categoryName = currentFilter === 'all' ? 'All Games' : 
        currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1);
    gamesTitle.textContent = searchQuery ? 
        `Search Results: "${searchQuery}"` : categoryName;
    
    // Render games or show no results
    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = '';
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        gamesGrid.innerHTML = filteredGames.map(game => createGameCard(game)).join('');
        
        // Lazy load images
        lazyLoadImages();
    }
}

function createGameCard(game) {
    const isOffline = offlineGames.some(og => og.id === game.id);
    const badge = isOffline ? '<span class="game-card-badge">Offline</span>' : '';
    
    return `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-card-image">
                <img data-src="${game.icon || 'https://via.placeholder.com/280x180?text=Game'}" 
                     alt="${game.name}"
                     loading="lazy">
                ${badge}
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title">${game.name}</h3>
                <p class="game-card-description">${game.description || 'Play this exciting game!'}</p>
                <div class="game-card-footer">
                    <button class="game-card-play" onclick="playGame('${game.id}')">
                        Play Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========== Lazy Loading ==========
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ========== Play Game ==========
function playGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    
    if (!game) {
        alert('Game not found!');
        return;
    }
    
    // Add to recently played
    addToRecentlyPlayed(game);
    
    // Show game modal
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('game-modal-title');
    const iframe = document.getElementById('game-iframe');
    
    modalTitle.textContent = game.name;
    iframe.src = game.url;
    modal.classList.remove('hidden');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeGameModal() {
    const modal = document.getElementById('game-modal');
    const iframe = document.getElementById('game-iframe');
    
    iframe.src = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ========== Recently Played ==========
function loadRecentlyPlayed() {
    try {
        const saved = localStorage.getItem(RECENT_GAMES_KEY);
        recentlyPlayed = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load recently played:', e);
        recentlyPlayed = [];
    }
}

function addToRecentlyPlayed(game) {
    // Remove if already exists
    recentlyPlayed = recentlyPlayed.filter(g => g.id !== game.id);
    
    // Add to beginning
    recentlyPlayed.unshift({
        ...game,
        playedAt: Date.now()
    });
    
    // Keep only last 12 games
    recentlyPlayed = recentlyPlayed.slice(0, 12);
    
    // Save to localStorage
    try {
        localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(recentlyPlayed));
    } catch (e) {
        console.error('Failed to save recently played:', e);
    }
    
    // Re-render recent games
    renderRecentGames();
}

function renderRecentGames() {
    const recentSection = document.getElementById('recent-section');
    const recentGamesGrid = document.getElementById('recent-games');
    
    if (recentlyPlayed.length === 0) {
        recentSection.classList.add('hidden');
        return;
    }
    
    recentSection.classList.remove('hidden');
    recentGamesGrid.innerHTML = recentlyPlayed.map(game => createGameCard(game)).join('');
    lazyLoadImages();
}

// ========== Search & Filter ==========
function handleSearch(e) {
    searchQuery = e.target.value.trim();
    const clearBtn = document.getElementById('clear-search');
    
    if (searchQuery) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    
    renderGames();
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    
    searchInput.value = '';
    searchQuery = '';
    clearBtn.classList.add('hidden');
    renderGames();
}

function filterByCategory(category) {
    currentFilter = category;
    searchQuery = '';
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderGames();
    
    // Scroll to games section
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
}

// ========== Category Scrolling ==========
function scrollCategories(direction) {
    const container = document.getElementById('categories-container');
    const scrollAmount = 300;
    
    if (direction === 'next') {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
}

// ========== Fullscreen ==========
function toggleFullscreen() {
    const modalBody = document.querySelector('.game-modal-body');
    
    if (!document.fullscreenElement) {
        modalBody.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// ========== Event Listeners ==========
function attachEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Search
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('clear-search').addEventListener('click', clearSearch);
    
    // Categories
    document.getElementById('categories-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            filterByCategory(e.target.dataset.category);
        }
    });
    
    // Category scroll buttons
    document.getElementById('category-prev').addEventListener('click', () => scrollCategories('prev'));
    document.getElementById('category-next').addEventListener('click', () => scrollCategories('next'));
    
    // Game modal
    document.getElementById('game-back-btn').addEventListener('click', closeGameModal);
    document.getElementById('game-fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGameModal();
        }
    });
    
    // Handle offline/online status
    window.addEventListener('online', () => {
        console.log('Back online!');
    });
    
    window.addEventListener('offline', () => {
        console.log('You are offline. Only cached games available.');
    });
}

// ========== Service Worker Registration ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Make playGame function globally available
window.playGame = playGame;
