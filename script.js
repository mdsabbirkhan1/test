// ===== Global Variables =====
let allGames = [];
let offlineGames = [];
let currentCategory = 'all';
let isOnline = navigator.onLine;
const CACHE_KEY = 'gaming_platform_cache';
const CACHE_TIMESTAMP_KEY = 'gaming_platform_cache_timestamp';
const RECENT_GAMES_KEY = 'gaming_platform_recent_games';
const THEME_KEY = 'gaming_platform_theme';
const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

// ===== DOM Elements =====
const searchInput = document.getElementById('search-input');
const gamesGrid = document.getElementById('games-grid');
const recentGamesGrid = document.getElementById('recent-games-grid');
const recentGamesSection = document.getElementById('recent-games-section');
const categoryScroll = document.getElementById('category-scroll');
const gamesSectionTitle = document.getElementById('games-section-title');
const noResults = document.getElementById('no-results');
const loadingSpinner = document.getElementById('loading-spinner');
const gameModal = document.getElementById('game-modal');
const gameIframe = document.getElementById('game-iframe');
const closeModalBtn = document.getElementById('close-modal-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const modalGameTitle = document.getElementById('modal-game-title');
const modalGameCategory = document.getElementById('modal-game-category');
const themeToggle = document.getElementById('theme-toggle');
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');
const connectionStatus = document.getElementById('connection-status');

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    checkCache();
    loadGames();
    initializeEventListeners();
    updateOnlineStatus();
    displayRecentGames();
});

// ===== Theme Management =====
function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// ===== Cache Management =====
function checkCache() {
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        if (cacheAge > CACHE_DURATION) {
            // Clear cache if older than 10 days
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            console.log('Cache cleared (older than 10 days)');
        }
    }
}

function saveToCache(data, key) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        if (key === CACHE_KEY) {
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        }
    } catch (e) {
        console.error('Failed to save to cache:', e);
    }
}

function getFromCache(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to get from cache:', e);
        return null;
    }
}

// ===== Online/Offline Management =====
function updateOnlineStatus() {
    isOnline = navigator.onLine;
    
    if (!isOnline) {
        connectionStatus.classList.remove('hidden');
    } else {
        connectionStatus.classList.add('hidden');
    }
    
    // Reload games when status changes
    displayGames();
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ===== Load Games =====
async function loadGames() {
    loadingSpinner.classList.remove('hidden');
    
    try {
        // Try to load from cache first
        const cachedData = getFromCache(CACHE_KEY);
        if (cachedData && cachedData.games) {
            allGames = cachedData.games;
        }
        
        // Load online games
        if (isOnline) {
            try {
                const response = await fetch('gamedata.json');
                if (response.ok) {
                    const data = await response.json();
                    allGames = data;
                    saveToCache({ games: allGames }, CACHE_KEY);
                }
            } catch (error) {
                console.error('Failed to load online games:', error);
            }
        }
        
        // Load offline games
        try {
            const offlineResponse = await fetch('offlinegameadd.json');
            if (offlineResponse.ok) {
                offlineGames = await offlineResponse.json();
            }
        } catch (error) {
            console.error('Failed to load offline games:', error);
        }
        
        generateCategories();
        displayGames();
        
    } catch (error) {
        console.error('Error loading games:', error);
        displayError();
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// ===== Generate Categories =====
function generateCategories() {
    const gamesToProcess = isOnline ? allGames : offlineGames;
    const categories = new Set();
    
    gamesToProcess.forEach(game => {
        if (game.category) {
            categories.add(game.category.toLowerCase());
        }
    });
    
    // Clear existing categories except "All Games"
    const allGamesBtn = categoryScroll.querySelector('[data-category="all"]');
    categoryScroll.innerHTML = '';
    categoryScroll.appendChild(allGamesBtn);
    
    // Add new categories
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', category);
        btn.textContent = capitalizeFirstLetter(category);
        btn.addEventListener('click', () => filterByCategory(category));
        categoryScroll.appendChild(btn);
    });
}

// ===== Display Games =====
function displayGames(searchTerm = '') {
    const gamesToDisplay = isOnline ? allGames : offlineGames;
    
    let filteredGames = gamesToDisplay.filter(game => {
        const matchesSearch = searchTerm === '' || 
            game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = currentCategory === 'all' || 
            (game.category && game.category.toLowerCase() === currentCategory);
        
        return matchesSearch && matchesCategory;
    });
    
    gamesGrid.innerHTML = '';
    
    if (filteredGames.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        filteredGames.forEach(game => {
            const gameCard = createGameCard(game);
            gamesGrid.appendChild(gameCard);
        });
        
        // Lazy load images
        lazyLoadImages();
    }
    
    updateSectionTitle();
}

// ===== Create Game Card =====
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('data-game-id', game.id);
    
    const badge = !isOnline ? '📱 Offline' : '🌐 Online';
    
    card.innerHTML = `
        <div class="game-card-image">
            <img 
                class="game-card-img lazy-load" 
                data-src="${game.icon}" 
                alt="${game.name}"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%236366f1' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='60' fill='white'%3E🎮%3C/text%3E%3C/svg%3E"
            >
            <div class="game-card-badge">${badge}</div>
        </div>
        <div class="game-card-content">
            <h3 class="game-card-title">${game.name}</h3>
            <p class="game-card-description">${game.description || 'Start playing now!'}</p>
            <div class="game-card-footer">
                <span class="game-card-category">${game.category || 'gaming'}</span>
                <button class="game-card-play">Play Now</button>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openGame(game));
    
    return card;
}

// ===== Lazy Loading Images =====
function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('.lazy-load');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.classList.remove('lazy-load');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// ===== Open Game =====
function openGame(game) {
    gameModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    modalGameTitle.textContent = game.name;
    modalGameCategory.textContent = game.category || 'gaming';
    
    // Determine game URL
    let gameUrl = game.url;
    if (!isOnline && game.offlinePath) {
        gameUrl = game.offlinePath;
    }
    
    gameIframe.src = gameUrl;
    
    // Save to recent games
    saveToRecentGames(game);
}

// ===== Close Game =====
function closeGame() {
    gameModal.classList.add('hidden');
    document.body.style.overflow = '';
    gameIframe.src = '';
}

// ===== Fullscreen =====
function toggleFullscreen() {
    const modalContent = document.querySelector('.modal-content');
    
    if (!document.fullscreenElement) {
        modalContent.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// ===== Recent Games Management =====
function saveToRecentGames(game) {
    let recentGames = getFromCache(RECENT_GAMES_KEY) || [];
    
    // Remove if already exists
    recentGames = recentGames.filter(g => g.id !== game.id);
    
    // Add to beginning
    recentGames.unshift(game);
    
    // Keep only last 12 games
    recentGames = recentGames.slice(0, 12);
    
    saveToCache(recentGames, RECENT_GAMES_KEY);
    displayRecentGames();
}

function displayRecentGames() {
    const recentGames = getFromCache(RECENT_GAMES_KEY) || [];
    
    if (recentGames.length === 0) {
        recentGamesSection.classList.add('hidden');
        return;
    }
    
    recentGamesSection.classList.remove('hidden');
    recentGamesGrid.innerHTML = '';
    
    recentGames.forEach(game => {
        const gameCard = createGameCard(game);
        recentGamesGrid.appendChild(gameCard);
    });
    
    // Lazy load images
    lazyLoadImages();
}

// ===== Category Filter =====
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    displayGames(searchInput.value);
}

function updateSectionTitle() {
    const titleIcon = gamesSectionTitle.querySelector('.title-icon');
    if (currentCategory === 'all') {
        gamesSectionTitle.innerHTML = `<span class="title-icon">🎯</span>All Games`;
    } else {
        gamesSectionTitle.innerHTML = `<span class="title-icon">🎯</span>${capitalizeFirstLetter(currentCategory)}`;
    }
}

// ===== Search =====
function handleSearch(event) {
    const searchTerm = event.target.value;
    displayGames(searchTerm);
}

// ===== Category Scroll =====
function scrollCategories(direction) {
    const scrollAmount = 200;
    if (direction === 'left') {
        categoryScroll.scrollLeft -= scrollAmount;
    } else {
        categoryScroll.scrollLeft += scrollAmount;
    }
}

// ===== Event Listeners =====
function initializeEventListeners() {
    // Search
    searchInput.addEventListener('input', handleSearch);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Modal controls
    closeModalBtn.addEventListener('click', closeGame);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Category scroll
    scrollLeftBtn.addEventListener('click', () => scrollCategories('left'));
    scrollRightBtn.addEventListener('click', () => scrollCategories('right'));
    
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !gameModal.classList.contains('hidden')) {
            closeGame();
        }
    });
    
    // Logo click - reload page
    document.querySelector('.logo').addEventListener('click', () => {
        window.location.reload();
    });
}

// ===== Display Error =====
function displayError() {
    gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">😕</div>
            <h3>Oops! Something went wrong</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Unable to load games. Please check your connection and try again.
            </p>
        </div>
    `;
}

// ===== Utility Functions =====
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful:', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}
