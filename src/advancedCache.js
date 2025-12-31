const vscode = require('vscode');
const { getLogger } = require('./logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { GLOBAL_STATE_KEYS, DEFAULT_PERSISTENT_CACHE_TTL } = require('./constants');

/**
 * Advanced Caching System with persistent storage and intelligent invalidation
 */
class AdvancedCache {
    constructor(context) {
        this._logger = getLogger();
        this._context = context;
        
        // In-memory cache (key -> entry)
        this._memoryCache = new Map();
        
        // Configuration
        this._maxMemoryUsage = 50 * 1024 * 1024; // 50MB default
        this._currentMemoryUsage = 0;
        this._persistentCacheEnabled = true;

        // Persistent storage via VS Code memento for web compatibility
        this._storage = context?.globalState || null;
        this._storageKey = GLOBAL_STATE_KEYS.ADVANCED_CACHE;
        this._metadataKey = GLOBAL_STATE_KEYS.ADVANCED_CACHE_METADATA;
        this._fs = fileSystem;
        this._configurationWatcher = null;
        
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
            
            // Load persistent cache if enabled
            if (this._persistentCacheEnabled) {
                await this._loadPersistentCache();
            }
            
            // Start cleanup and save intervals
            this._startIntervals();
            
            this._logger.info('Advanced cache system initialized', {
                persistentEnabled: this._persistentCacheEnabled && !!this._storage,
                maxMemoryUsage: this._maxMemoryUsage,
                storage: this._storage ? 'globalState' : 'memory-only'
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
        this._ensureConfigurationWatcher();
    }

    _ensureConfigurationWatcher() {
        if (this._configurationWatcher) {
            return;
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.persistentCache') ||
                e.affectsConfiguration('explorerDates.maxMemoryUsage')) {
                this._loadConfiguration();
            }
        });
    }

    _createCacheEntry(value, overrides = {}) {
        const now = Date.now();
        return {
            value,
            size: overrides.size ?? this._estimateSize(value),
            ttl: overrides.ttl ?? DEFAULT_PERSISTENT_CACHE_TTL,
            tags: overrides.tags && overrides.tags.length > 0 ? [...overrides.tags] : undefined,
            version: overrides.version ?? 1,
            timestamp: overrides.timestamp ?? now,
            lastAccess: overrides.lastAccess ?? now
        };
    }

    _touchEntry(entry) {
        entry.lastAccess = Date.now();
    }

    _serializeMetadata(entry) {
        return {
            ts: entry.timestamp,
            la: entry.lastAccess,
            ttl: entry.ttl,
            sz: entry.size,
            tg: entry.tags,
            v: entry.version
        };
    }

    _normalizePersistedMetadata(metadata) {
        if (!metadata) {
            return null;
        }
        return {
            timestamp: metadata.timestamp ?? metadata.ts ?? Date.now(),
            lastAccess: metadata.lastAccess ?? metadata.la ?? Date.now(),
            ttl: metadata.ttl ?? metadata.tt ?? DEFAULT_PERSISTENT_CACHE_TTL,
            size: metadata.size ?? metadata.sz,
            tags: metadata.tags ?? metadata.tg,
            version: metadata.version ?? metadata.v ?? 1
        };
    }

    _hydratePersistedEntry(snapshot) {
        if (!snapshot) {
            return null;
        }
        const metadata = this._normalizePersistedMetadata(snapshot.metadata || snapshot.meta);
        if (!metadata) {
            return null;
        }
        return this._createCacheEntry(snapshot.data ?? snapshot.value, metadata);
    }

    _serializeEntry(entry) {
        return {
            data: entry.value,
            metadata: this._serializeMetadata(entry)
        };
    }

    /**
     * Get item from cache with intelligent fallback
     */
    async get(key) {
        const entry = this._memoryCache.get(key);

        if (entry) {
            if (this._isValid(entry)) {
                this._metrics.memoryHits++;
                this._touchEntry(entry);
                return entry.value;
            }
            this._removeFromMemory(key);
        }
        
        this._metrics.memoryMisses++;
        
        // Try persistent cache if enabled
        if (this._persistentCacheEnabled) {
            const persistentEntry = await this._getFromPersistentCache(key);
            if (persistentEntry) {
                this._addToMemory(key, persistentEntry);
                this._metrics.diskHits++;
                return persistentEntry.value;
            }
        }
        
        this._metrics.diskMisses++;
        return null;
    }

    /**
     * Set item in cache with metadata
     */
    async set(key, value, options = {}) {
        const entry = this._createCacheEntry(value, {
            ttl: options.ttl,
            tags: options.tags,
            version: options.version
        });
        
        this._addToMemory(key, entry);
        
        // Schedule persistent save if enabled
        if (this._persistentCacheEnabled) {
            this._schedulePersistentSave();
        }
    }

    /**
     * Add item to memory cache with eviction handling
     */
    _addToMemory(key, entry) {
        if (this._currentMemoryUsage + entry.size > this._maxMemoryUsage) {
            this._evictOldestItems(entry.size);
        }
        
        if (this._memoryCache.has(key)) {
            this._removeFromMemory(key);
        }
        
        this._memoryCache.set(key, entry);
        this._currentMemoryUsage += entry.size;
        
        this._logger.debug(`Added to cache: ${key} (${entry.size} bytes)`);
    }

    /**
     * Remove item from memory cache
     */
    _removeFromMemory(key) {
        const entry = this._memoryCache.get(key);
        if (!entry) {
            return;
        }
        this._memoryCache.delete(key);
        this._currentMemoryUsage -= entry.size;
    }

    /**
     * Evict oldest items to make space
     */
    _evictOldestItems(requiredSpace) {
        const entries = Array.from(this._memoryCache.entries());
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

        let freedSpace = 0;
        for (const [key, entry] of entries) {
            this._removeFromMemory(key);
            freedSpace += entry.size;
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
    _isValid(entry) {
        if (!entry) {
            return false;
        }
        const now = Date.now();
        const age = now - entry.timestamp;
        return age < entry.ttl;
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
        if (!this._storage) {
            const env = this._fs.isWeb ? 'web' : 'desktop';
            this._logger.debug(`Persistent storage unavailable in ${env} environment - running in memory-only mode`);
            return;
        }

        try {
            const cache = this._storage.get(this._storageKey, {});
            let loadedCount = 0;
            let skippedCount = 0;

            for (const [key, item] of Object.entries(cache)) {
                const entry = this._hydratePersistedEntry(item);
                if (entry && this._isValid(entry)) {
                    this._addToMemory(key, entry);
                    loadedCount++;
                    continue;
                }
                skippedCount++;
            }

            this._metrics.persistentLoads++;
            this._logger.info(`Loaded persistent cache: ${loadedCount} items (${skippedCount} expired)`);
        } catch (error) {
            this._logger.error('Failed to load persistent cache from globalState', error);
        }
    }

    /**
     * Save persistent cache to disk
     */
    async _savePersistentCache() {
        if (!this._persistentCacheEnabled || !this._storage) {
            return;
        }

        try {
            const cache = {};

            for (const [key, entry] of this._memoryCache.entries()) {
                if (this._isValid(entry)) {
                    cache[key] = this._serializeEntry(entry);
                }
            }

            await this._storage.update(this._storageKey, cache);
            this._metrics.persistentSaves++;
            this._logger.debug(`Saved persistent cache: ${Object.keys(cache).length} items`);
        } catch (error) {
            this._logger.error('Failed to save persistent cache to globalState', error);
        }
    }

    /**
     * Get item from persistent cache
     */
    async _getFromPersistentCache(key) {
        if (!this._storage) {
            return null;
        }

        const cache = this._storage.get(this._storageKey, {});
        const item = cache[key];
        const entry = this._hydratePersistedEntry(item);
        if (entry && this._isValid(entry)) {
            return entry;
        }
        return null;
    }

    /**
     * Schedule persistent cache save
     */
    _schedulePersistentSave() {
        if (!this._storage) {
            return;
        }

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
        if (this._storage && this._persistentCacheEnabled) {
            this._saveInterval = setInterval(() => {
                this._savePersistentCache();
            }, 10 * 60 * 1000);
        }
    }

    /**
     * Cleanup expired items from memory
     */
    _cleanupExpiredItems() {
        const keysToRemove = [];

        for (const [key, entry] of this._memoryCache.entries()) {
            if (!this._isValid(entry)) {
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
        
        for (const [key, entry] of this._memoryCache.entries()) {
            if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
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
        if (this._persistentCacheEnabled && this._storage) {
            await this._savePersistentCache();
        }
        
        // Clear memory
        this.clear();
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        
        this._logger.info('Advanced cache disposed', this.getStats());
    }
}

module.exports = { AdvancedCache };
