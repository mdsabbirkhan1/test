// Storage Management System
class StorageManager {
    constructor() {
        this.storageKey = 'toolsHub';
        this.init();
    }

    init() {
        // Initialize storage if not exists
        if (!localStorage.getItem(this.storageKey)) {
            const defaultData = {
                version: '1.0.0',
                settings: {
                    theme: 'auto', // 'light', 'dark', 'auto'
                    view: 'grid', // 'grid', 'list'
                    language: 'en',
                    cookieConsent: false,
                    pwaInstalled: false,
                    firstVisit: true
                },
                userData: {
                    favoriteTools: [],
                    recentTools: [],
                    toolUsage: {}, // { toolId: count }
                    customCategories: [],
                    searchHistory: []
                },
                cache: {
                    lastUpdated: Date.now(),
                    tools: [],
                    categories: []
                }
            };
            this.setData(defaultData);
        }
    }

    // Get all data
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    // Set all data
    setData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // Get specific section
    getSection(section) {
        const data = this.getData();
        return data ? data[section] : null;
    }

    // Update specific section
    updateSection(section, newData) {
        const data = this.getData();
        if (data) {
            data[section] = { ...data[section], ...newData };
            return this.setData(data);
        }
        return false;
    }

    // Settings management
    getSetting(key) {
        const settings = this.getSection('settings');
        return settings ? settings[key] : null;
    }

    setSetting(key, value) {
        const settings = this.getSection('settings') || {};
        settings[key] = value;
        return this.updateSection('settings', settings);
    }

    // User data management
    getUserData(key) {
        const userData = this.getSection('userData');
        return userData ? userData[key] : null;
    }

    setUserData(key, value) {
        const userData = this.getSection('userData') || {};
        userData[key] = value;
        return this.updateSection('userData', userData);
    }

    // Tool usage tracking
    trackToolUsage(toolId) {
        const usage = this.getUserData('toolUsage') || {};
        usage[toolId] = (usage[toolId] || 0) + 1;
        this.setUserData('toolUsage', usage);

        // Update recent tools
        this.addRecentTool(toolId);
    }

    getToolUsage(toolId) {
        const usage = this.getUserData('toolUsage') || {};
        return usage[toolId] || 0;
    }

    getMostUsedTools(limit = 10) {
        const usage = this.getUserData('toolUsage') || {};
        return Object.entries(usage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([toolId, count]) => ({ toolId, count }));
    }

    // Favorite tools management
    addFavoriteTool(toolId) {
        const favorites = this.getUserData('favoriteTools') || [];
        if (!favorites.includes(toolId)) {
            favorites.push(toolId);
            this.setUserData('favoriteTools', favorites);
        }
    }

    removeFavoriteTool(toolId) {
        const favorites = this.getUserData('favoriteTools') || [];
        const index = favorites.indexOf(toolId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setUserData('favoriteTools', favorites);
        }
    }

    isFavoriteTool(toolId) {
        const favorites = this.getUserData('favoriteTools') || [];
        return favorites.includes(toolId);
    }

    getFavoriteTools() {
        return this.getUserData('favoriteTools') || [];
    }

    // Recent tools management
    addRecentTool(toolId) {
        const recent = this.getUserData('recentTools') || [];
        
        // Remove if already exists
        const index = recent.indexOf(toolId);
        if (index > -1) {
            recent.splice(index, 1);
        }

        // Add to beginning
        recent.unshift(toolId);

        // Keep only last 20
        if (recent.length > 20) {
            recent.splice(20);
        }

        this.setUserData('recentTools', recent);
    }

    getRecentTools(limit = 10) {
        const recent = this.getUserData('recentTools') || [];
        return recent.slice(0, limit);
    }

    // Search history management
    addSearchHistory(query) {
        if (!query || query.trim().length < 2) return;
        
        const history = this.getUserData('searchHistory') || [];
        const trimmedQuery = query.trim().toLowerCase();
        
        // Remove if already exists
        const index = history.indexOf(trimmedQuery);
        if (index > -1) {
            history.splice(index, 1);
        }

        // Add to beginning
        history.unshift(trimmedQuery);

        // Keep only last 50
        if (history.length > 50) {
            history.splice(50);
        }

        this.setUserData('searchHistory', history);
    }

    getSearchHistory(limit = 10) {
        const history = this.getUserData('searchHistory') || [];
        return history.slice(0, limit);
    }

    clearSearchHistory() {
        this.setUserData('searchHistory', []);
    }

    // Cache management
    getCachedData(key) {
        const cache = this.getSection('cache');
        return cache ? cache[key] : null;
    }

    setCachedData(key, value) {
        const cache = this.getSection('cache') || {};
        cache[key] = value;
        cache.lastUpdated = Date.now();
        return this.updateSection('cache', cache);
    }

    isCacheValid(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const cache = this.getSection('cache');
        if (!cache || !cache.lastUpdated) return false;
        
        const age = Date.now() - cache.lastUpdated;
        return age < maxAge;
    }

    clearCache() {
        const cache = {
            lastUpdated: Date.now(),
            tools: [],
            categories: []
        };
        return this.updateSection('cache', cache);
    }

    // Export/Import data
    exportData() {
        const data = this.getData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: data.version
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tools-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate import data
                    if (!importData.version || !importData.settings) {
                        throw new Error('Invalid backup file format');
                    }

                    // Merge with current data
                    const currentData = this.getData();
                    const mergedData = {
                        ...currentData,
                        ...importData,
                        version: currentData.version, // Keep current version
                        cache: currentData.cache // Keep current cache
                    };

                    if (this.setData(mergedData)) {
                        resolve(true);
                    } else {
                        reject(new Error('Failed to save imported data'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Reset all data
    resetData() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }

    // Get storage usage info
    getStorageInfo() {
        try {
            const data = JSON.stringify(this.getData());
            const sizeInBytes = new Blob([data]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return {
                sizeInBytes,
                sizeInKB,
                totalItems: Object.keys(this.getData()).length,
                toolUsageCount: Object.keys(this.getUserData('toolUsage') || {}).length,
                favoriteCount: (this.getUserData('favoriteTools') || []).length,
                recentCount: (this.getUserData('recentTools') || []).length,
                searchHistoryCount: (this.getUserData('searchHistory') || []).length
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    // Privacy and GDPR compliance
    clearPersonalData() {
        const data = this.getData();
        if (data) {
            data.userData = {
                favoriteTools: [],
                recentTools: [],
                toolUsage: {},
                customCategories: [],
                searchHistory: []
            };
            this.setData(data);
        }
    }

    // Event system for storage changes
    addEventListener(event, callback) {
        window.addEventListener(`storage-${event}`, callback);
    }

    removeEventListener(event, callback) {
        window.removeEventListener(`storage-${event}`, callback);
    }

    dispatchEvent(event, data) {
        const customEvent = new CustomEvent(`storage-${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }
}

// Initialize storage manager
const storage = new StorageManager();

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === storage.storageKey) {
        storage.dispatchEvent('change', {
            key: e.key,
            oldValue: e.oldValue,
            newValue: e.newValue
        });
    }
});

// Export for use in other modules
window.storage = storage;