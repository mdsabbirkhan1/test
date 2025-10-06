// ===== Constants =====
const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
const CACHE_KEY = 'gamesCache';
const CACHE_TIMESTAMP_KEY = 'gamesCacheTimestamp';
const RECENTLY_PLAYED_KEY = 'recentlyPlayed';
const THEME_KEY = 'theme';

// ===== State =====
let allGames = [];
let offlineGames = [];
let filteredGames = [];
let currentCategory = 'all';
let isOffline = false;

// ===== DOM Elements =====
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const categoriesContainer = document.getElementById('categoriesContainer');
const gamesGrid = document.getElementById('gamesGrid');
const recentlyPlayedSection = document.getElementById('recentlyPlayedSection');
const recentlyPlayedGrid = document.getElementById('recentlyPlayedGrid');
const mainSectionTitle = document.getElementById('mainSectionTitle');
const noResults = document.getElementById('noResults');
const gameModal = document.getElementById('gameModal');
const gameModalTitle = document.getElementById('gameModalTitle');
const gameIframe = document.getElementById('gameIframe');
const closeGameModal = document.getElementById('closeGameModal');
const offlineIndicator = document.getElementById('offlineIndicator');

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEventListeners();
    checkCacheValidity();
    loadGames();
    displayRecentlyPlayed();
    checkOnlineStatus();
});

// ===== Theme Management =====
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

// ===== Event Listeners =====
function initEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        searchClear.style.display = query ? 'flex' : 'none';
        filterGames(query, currentCategory);
    });
    
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        filterGames('', currentCategory);
    });
    
    closeGameModal.addEventListener('click', closeGame);
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameModal.classList.contains('active')) {
            closeGame();
        }
    });
    
    // Prevent modal close when clicking inside iframe
    gameModal.addEventListener('click', (e) => {
        if (e.target === gameModal) {
            closeGame();
        }
    });
}

// ===== Cache Management =====
function checkCacheValidity() {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age > CACHE_DURATION) {
            // Cache is older than 10 days, clear it
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            console.log('Cache cleared due to expiration');
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

// ===== Load Games =====
async function loadGames() {
    try {
        // Try to load from cache first
        const cachedGames = getFromCache();
        
        if (cachedGames && !navigator.onLine) {
            // Use cached data when offline
            allGames = cachedGames;
            processGames();
            return;
        }
        
        // Fetch fresh data
        const response = await fetch('gamedata.json');
        if (!response.ok) throw new Error('Failed to fetch games');
        
        const data = await response.json();
        allGames = Array.isArray(data) ? data : data.games || [];
        
        // Save to cache
        saveToCache(allGames);
        processGames();
        
    } catch (error) {
        console.error('Error loading games:', error);
        
        // Try to use cached data
        const cachedGames = getFromCache();
        if (cachedGames) {
            allGames = cachedGames;
            processGames();
        } else {
            showError('Failed to load games. Please refresh the page.');
        }
    }
    
    // Load offline games
    loadOfflineGames();
}

async function loadOfflineGames() {
    try {
        const response = await fetch('offlinegameadd.json');
        if (!response.ok) throw new Error('Failed to fetch offline games');
        
        const data = await response.json();
        offlineGames = Array.isArray(data) ? data : data.games || [];
    } catch (error) {
        console.error('Error loading offline games:', error);
    }
}

function processGames() {
    filteredGames = [...allGames];
    generateCategories();
    displayGames();
}

// ===== Categories =====
function generateCategories() {
    const categories = new Set();
    allGames.forEach(game => {
        if (game.category) {
            categories.add(game.category.toLowerCase());
        }
    });
    
    // Clear existing categories (except "All Games")
    const allGamesBtn = categoriesContainer.querySelector('[data-category="all"]');
    categoriesContainer.innerHTML = '';
    categoriesContainer.appendChild(allGamesBtn);
    
    // Add category buttons
    Array.from(categories).sort().forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', category);
        btn.textContent = category;
        btn.addEventListener('click', () => selectCategory(category));
        categoriesContainer.appendChild(btn);
    });
}

function selectCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    // Update title
    if (category === 'all') {
        mainSectionTitle.textContent = 'All Games';
    } else {
        mainSectionTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    // Filter games
    const query = searchInput.value.trim();
    filterGames(query, category);
}

// ===== Filter & Search =====
function filterGames(query, category) {
    let games = [...allGames];
    
    // Filter by category
    if (category !== 'all') {
        games = games.filter(game => 
            game.category && game.category.toLowerCase() === category
        );
    }
    
    // Filter by search query
    if (query) {
        const lowerQuery = query.toLowerCase();
        games = games.filter(game => 
            game.name.toLowerCase().includes(lowerQuery) ||
            (game.description && game.description.toLowerCase().includes(lowerQuery)) ||
            (game.category && game.category.toLowerCase().includes(lowerQuery))
        );
    }
    
    filteredGames = games;
    displayGames();
}

// ===== Display Games =====
function displayGames() {
    gamesGrid.innerHTML = '';
    
    if (filteredGames.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    filteredGames.forEach((game, index) => {
        const card = createGameCard(game, index);
        gamesGrid.appendChild(card);
    });
}

function createGameCard(game, index) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const isOfflineAvailable = offlineGames.some(og => og.id === game.id);
    
    card.innerHTML = `
        <img 
            src="${game.icon || 'https://via.placeholder.com/300x200?text=Game'}" 
            alt="${game.name}"
            class="game-card-image"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/300x200?text=Game'"
        >
        <div class="game-card-content">
            <h3 class="game-card-title">${game.name}</h3>
            <p class="game-card-description">${game.description || 'Click to play this awesome game!'}</p>
            <div class="game-card-footer">
                <span class="game-card-category">${game.category || 'game'}</span>
                <span class="game-card-play">
                    Play ▶
                    ${isOfflineAvailable ? '<span style="margin-left: 0.5rem;">📱</span>' : ''}
                </span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openGame(game));
    
    return card;
}

// ===== Recently Played =====
function displayRecentlyPlayed() {
    try {
        const recentlyPlayed = JSON.parse(localStorage.getItem(RECENTLY_PLAYED_KEY) || '[]');
        
        if (recentlyPlayed.length === 0) {
            recentlyPlayedSection.style.display = 'none';
            return;
        }
        
        recentlyPlayedSection.style.display = 'block';
        recentlyPlayedGrid.innerHTML = '';
        
        // Get the full game objects
        const recentGames = recentlyPlayed
            .map(id => allGames.find(g => g.id === id))
            .filter(g => g !== undefined)
            .slice(0, 6); // Show max 6 recent games
        
        recentGames.forEach((game, index) => {
            const card = createGameCard(game, index);
            recentlyPlayedGrid.appendChild(card);
        });
    } catch (e) {
        console.error('Error displaying recently played:', e);
    }
}

function addToRecentlyPlayed(gameId) {
    try {
        let recentlyPlayed = JSON.parse(localStorage.getItem(RECENTLY_PLAYED_KEY) || '[]');
        
        // Remove if already exists
        recentlyPlayed = recentlyPlayed.filter(id => id !== gameId);
        
        // Add to beginning
        recentlyPlayed.unshift(gameId);
        
        // Keep only last 20 games
        recentlyPlayed = recentlyPlayed.slice(0, 20);
        
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recentlyPlayed));
        
        // Refresh recently played section
        displayRecentlyPlayed();
    } catch (e) {
        console.error('Error saving recently played:', e);
    }
}

// ===== Game Modal =====
function openGame(game) {
    // Check if offline and game is not available offline
    const isOfflineAvailable = offlineGames.some(og => og.id === game.id);
    
    if (isOffline && !isOfflineAvailable) {
        alert('This game is not available offline. Please connect to the internet.');
        return;
    }
    
    gameModalTitle.textContent = game.name;
    gameIframe.src = game.url;
    gameModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add to recently played
    addToRecentlyPlayed(game.id);
}

function closeGame() {
    gameModal.classList.remove('active');
    gameIframe.src = '';
    document.body.style.overflow = 'auto';
}

// ===== Online/Offline Detection =====
function checkOnlineStatus() {
    updateOnlineStatus();
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
    isOffline = !navigator.onLine;
    
    if (isOffline) {
        offlineIndicator.style.display = 'flex';
        // Filter to show only offline games
        if (offlineGames.length > 0) {
            allGames = offlineGames;
            processGames();
        }
    } else {
        offlineIndicator.style.display = 'none';
        // Reload all games when back online
        loadGames();
    }
}

// ===== Error Handling =====
function showError(message) {
    gamesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <p style="color: var(--error); font-size: 1.2rem;">${message}</p>
        </div>
    `;
}

// ===== Utility Functions =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add debounced search
const debouncedSearch = debounce((query, category) => {
    filterGames(query, category);
}, 300);

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
            console.log('Service Worker registered:', registration);
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
}
