const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { getLogger } = require('./logger');

/**
 * Advanced Caching System with persistent storage and intelligent invalidation
 */
class AdvancedCache {
    constructor(context) {
        this._logger = getLogger();
        this._context = context;
        
        // In-memory cache
        this._memoryCache = new Map();
        this._cacheMetadata = new Map();
        
        // Configuration
        this._maxMemoryUsage = 50 * 1024 * 1024; // 50MB default
        this._currentMemoryUsage = 0;
        this._persistentCacheEnabled = true;
        
        // Persistent cache file paths
        this._cacheDir = path.join((context.globalStorageUri && context.globalStorageUri.fsPath) || context.globalStoragePath || '', 'cache');
        this._persistentCacheFile = path.join(this._cacheDir, 'file-decorations.json');
        this._metadataFile = path.join(this._cacheDir, 'cache-metadata.json');
        
        // Performance metrics
        this._metrics = {
            memoryHits: 0,
            memoryMisses: 0,
            diskHits: 0,
            diskMisses: 0,
            evictions: 0,
            persistentLoads: 0,
            persistentSaves: 0
        };
        
        // Cache cleanup intervals
        this._cleanupInterval = null;
        this._saveInterval = null;
        
        this._logger.info('AdvancedCache initialized');
    }

    /**
     * Initialize cache system
     */
    async initialize() {
        try {
            // Load configuration
            await this._loadConfiguration();
            
            // Ensure cache directory exists
            await this._ensureCacheDirectory();
            
            // Load persistent cache if enabled
            if (this._persistentCacheEnabled) {
                await this._loadPersistentCache();
            }
            
            // Start cleanup and save intervals
            this._startIntervals();
            
            this._logger.info('Advanced cache system initialized', {
                persistentEnabled: this._persistentCacheEnabled,
                maxMemoryUsage: this._maxMemoryUsage,
                cacheDir: this._cacheDir
            });
            
        } catch (error) {
            this._logger.error('Failed to initialize cache system', error);
        }
    }

    /**
     * Load configuration settings
     */
    async _loadConfiguration() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        this._persistentCacheEnabled = config.get('persistentCache', true);
        this._maxMemoryUsage = config.get('maxMemoryUsage', 50) * 1024 * 1024; // Convert MB to bytes
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.persistentCache') || 
                e.affectsConfiguration('explorerDates.maxMemoryUsage')) {
                this._loadConfiguration();
            }
        });
    }

    /**
     * Ensure cache directory exists
     */
    async _ensureCacheDirectory() {
        try {
            await fs.mkdir(this._cacheDir, { recursive: true });
        } catch (error) {
            this._logger.error('Failed to create cache directory', error);
        }
    }

    /**
     * Get item from cache with intelligent fallback
     */
    async get(key) {
        // Try memory cache first
        if (this._memoryCache.has(key)) {
            const item = this._memoryCache.get(key);
            const metadata = this._cacheMetadata.get(key);
            
            // Check if item is still valid
            if (this._isValid(metadata)) {
                this._metrics.memoryHits++;
                this._updateAccessTime(key);
                return item;
            } else {
                // Remove expired item
                this._removeFromMemory(key);
            }
        }
        
        this._metrics.memoryMisses++;
        
        // Try persistent cache if enabled
        if (this._persistentCacheEnabled) {
            const persistentItem = await this._getFromPersistentCache(key);
            if (persistentItem) {
                // Add back to memory cache
                this._addToMemory(key, persistentItem.data, persistentItem.metadata);
                this._metrics.diskHits++;
                return persistentItem.data;
            }
        }
        
        this._metrics.diskMisses++;
        return null;
    }

    /**
     * Set item in cache with metadata
     */
    async set(key, value, options = {}) {
        const metadata = {
            timestamp: Date.now(),
            lastAccess: Date.now(),
            size: this._estimateSize(value),
            ttl: options.ttl || (24 * 60 * 60 * 1000), // 24 hours default
            tags: options.tags || [],
            version: options.version || 1
        };
        
        // Add to memory cache
        this._addToMemory(key, value, metadata);
        
        // Schedule persistent save if enabled
        if (this._persistentCacheEnabled) {
            this._schedulePersistentSave();
        }
    }

    /**
     * Add item to memory cache with eviction handling
     */
    _addToMemory(key, value, metadata) {
        // Check if adding this item would exceed memory limit
        if (this._currentMemoryUsage + metadata.size > this._maxMemoryUsage) {
            this._evictOldestItems(metadata.size);
        }
        
        // Remove existing item if present
        if (this._memoryCache.has(key)) {
            this._removeFromMemory(key);
        }
        
        // Add new item
        this._memoryCache.set(key, value);
        this._cacheMetadata.set(key, metadata);
        this._currentMemoryUsage += metadata.size;
        
        this._logger.debug(`Added to cache: ${key} (${metadata.size} bytes)`);
    }

    /**
     * Remove item from memory cache
     */
    _removeFromMemory(key) {
        if (this._memoryCache.has(key)) {
            const metadata = this._cacheMetadata.get(key);
            this._memoryCache.delete(key);
            this._cacheMetadata.delete(key);
            
            if (metadata) {
                this._currentMemoryUsage -= metadata.size;
            }
        }
    }

    /**
     * Evict oldest items to make space
     */
    _evictOldestItems(requiredSpace) {
        const entries = Array.from(this._cacheMetadata.entries());
        
        // Sort by last access time (oldest first)
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        let freedSpace = 0;
        for (const [key, metadata] of entries) {
            this._removeFromMemory(key);
            freedSpace += metadata.size;
            this._metrics.evictions++;
            
            if (freedSpace >= requiredSpace) {
                break;
            }
        }
        
        this._logger.debug(`Evicted items to free ${freedSpace} bytes`);
    }

    /**
     * Check if cache item is still valid
     */
    _isValid(metadata) {
        if (!metadata) return false;
        
        const now = Date.now();
        const age = now - metadata.timestamp;
        
        return age < metadata.ttl;
    }

    /**
     * Update access time for cache item
     */
    _updateAccessTime(key) {
        const metadata = this._cacheMetadata.get(key);
        if (metadata) {
            metadata.lastAccess = Date.now();
        }
    }

    /**
     * Estimate memory size of object
     */
    _estimateSize(obj) {
        const type = typeof obj;
        
        switch (type) {
            case 'string':
                return obj.length * 2; // UTF-16
            case 'number':
                return 8;
            case 'boolean':
                return 4;
            case 'object':
                if (obj === null) return 4;
                return JSON.stringify(obj).length * 2;
            default:
                return 100; // Rough estimate
        }
    }

    /**
     * Load persistent cache from disk
     */
    async _loadPersistentCache() {
        try {
            const cacheData = await fs.readFile(this._persistentCacheFile, 'utf8');
            const cache = JSON.parse(cacheData);
            
            let loadedCount = 0;
            let skippedCount = 0;
            
            for (const [key, item] of Object.entries(cache)) {
                // Check if item is still valid
                if (this._isValid(item.metadata)) {
                    this._addToMemory(key, item.data, item.metadata);
                    loadedCount++;
                } else {
                    skippedCount++;
                }
            }
            
            this._metrics.persistentLoads++;
            this._logger.info(`Loaded persistent cache: ${loadedCount} items (${skippedCount} expired)`);
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                this._logger.error('Failed to load persistent cache', error);
            }
        }
    }

    /**
     * Save persistent cache to disk
     */
    async _savePersistentCache() {
        if (!this._persistentCacheEnabled) return;
        
        try {
            const cache = {};
            
            // Convert memory cache to serializable format
            for (const [key, value] of this._memoryCache.entries()) {
                const metadata = this._cacheMetadata.get(key);
                if (metadata && this._isValid(metadata)) {
                    cache[key] = { data: value, metadata };
                }
            }
            
            await fs.writeFile(this._persistentCacheFile, JSON.stringify(cache, null, 2));
            this._metrics.persistentSaves++;
            
            this._logger.debug(`Saved persistent cache: ${Object.keys(cache).length} items`);
            
        } catch (error) {
            this._logger.error('Failed to save persistent cache', error);
        }
    }

    /**
     * Get item from persistent cache
     */
    async _getFromPersistentCache(key) {
        try {
            const cacheData = await fs.readFile(this._persistentCacheFile, 'utf8');
            const cache = JSON.parse(cacheData);
            const item = cache[key];
            
            if (item && this._isValid(item.metadata)) {
                return item;
            }
        } catch (error) {
            // Silently fail for missing files
        }
        
        return null;
    }

    /**
     * Schedule persistent cache save
     */
    _schedulePersistentSave() {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        
        this._saveTimeout = setTimeout(() => {
            this._savePersistentCache();
        }, 5000); // Save after 5 seconds of inactivity
    }

    /**
     * Start cleanup and save intervals
     */
    _startIntervals() {
        // Cleanup expired items every 5 minutes
        this._cleanupInterval = setInterval(() => {
            this._cleanupExpiredItems();
        }, 5 * 60 * 1000);
        
        // Save to disk every 10 minutes
        this._saveInterval = setInterval(() => {
            this._savePersistentCache();
        }, 10 * 60 * 1000);
    }

    /**
     * Cleanup expired items from memory
     */
    _cleanupExpiredItems() {
        const keysToRemove = [];
        
        for (const [key, metadata] of this._cacheMetadata.entries()) {
            if (!this._isValid(metadata)) {
                keysToRemove.push(key);
            }
        }
        
        for (const key of keysToRemove) {
            this._removeFromMemory(key);
        }
        
        if (keysToRemove.length > 0) {
            this._logger.debug(`Cleaned up ${keysToRemove.length} expired cache items`);
        }
    }

    /**
     * Invalidate cache items by tags
     */
    invalidateByTags(tags) {
        const keysToRemove = [];
        
        for (const [key, metadata] of this._cacheMetadata.entries()) {
            if (metadata.tags && metadata.tags.some(tag => tags.includes(tag))) {
                keysToRemove.push(key);
            }
        }
        
        for (const key of keysToRemove) {
            this._removeFromMemory(key);
        }
        
        this._logger.debug(`Invalidated ${keysToRemove.length} items by tags:`, tags);
    }

    /**
     * Invalidate cache items by pattern
     */
    invalidateByPattern(pattern) {
        const keysToRemove = [];
        const regex = new RegExp(pattern);
        
        for (const key of this._memoryCache.keys()) {
            if (regex.test(key)) {
                keysToRemove.push(key);
            }
        }
        
        for (const key of keysToRemove) {
            this._removeFromMemory(key);
        }
        
        this._logger.debug(`Invalidated ${keysToRemove.length} items by pattern: ${pattern}`);
    }

    /**
     * Clear all cache
     */
    clear() {
        this._memoryCache.clear();
        this._cacheMetadata.clear();
        this._currentMemoryUsage = 0;
        
        this._logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const memoryHitRate = this._metrics.memoryHits + this._metrics.memoryMisses > 0 
            ? (this._metrics.memoryHits / (this._metrics.memoryHits + this._metrics.memoryMisses) * 100).toFixed(2)
            : '0';
            
        const diskHitRate = this._metrics.diskHits + this._metrics.diskMisses > 0
            ? (this._metrics.diskHits / (this._metrics.diskHits + this._metrics.diskMisses) * 100).toFixed(2)
            : '0';
        
        return {
            ...this._metrics,
            memoryItems: this._memoryCache.size,
            memoryUsage: this._currentMemoryUsage,
            memoryUsagePercent: ((this._currentMemoryUsage / this._maxMemoryUsage) * 100).toFixed(2),
            memoryHitRate: `${memoryHitRate}%`,
            diskHitRate: `${diskHitRate}%`,
            persistentEnabled: this._persistentCacheEnabled
        };
    }

    /**
     * Dispose cache system
     */
    async dispose() {
        // Clear intervals
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
        if (this._saveInterval) {
            clearInterval(this._saveInterval);
        }
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        
        // Save cache to disk
        if (this._persistentCacheEnabled) {
            await this._savePersistentCache();
        }
        
        // Clear memory
        this.clear();
        
        this._logger.info('Advanced cache disposed', this.getStats());
    }
}

module.exports = { AdvancedCache };