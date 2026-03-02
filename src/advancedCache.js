const vscode = require('vscode');
let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};
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
        this._strictPersistedValidation = false; // When true, reject malformed persisted snapshots

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
            persistentSaves: 0,
            persistentRejected: 0 // entries rejected due to strict validation or top-level corruption
        };
        
        // Cache cleanup intervals
        this._cleanupInterval = null;
        this._saveInterval = null;
        this._memoryDirty = false;
        this._skipNextPersistentSave = false;
        
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
        this._strictPersistedValidation = config.get('strictPersistentCacheValidation', false);
        this._ensureConfigurationWatcher();
    }

    _ensureConfigurationWatcher() {
        if (this._configurationWatcher) {
            return;
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.persistentCache') ||
                e.affectsConfiguration('explorerDates.maxMemoryUsage') ||
                e.affectsConfiguration('explorerDates.strictPersistentCacheValidation')) {
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

    async _normalizePersistedMetadata(metadata) {
        // Quick null guard
        if (!metadata) return null;

        // Non-object tolerant fallback
        if (typeof metadata !== 'object') {
            if (this._strictPersistedValidation) return null;
            return {
                timestamp: Date.now(),
                lastAccess: Date.now(),
                ttl: DEFAULT_PERSISTENT_CACHE_TTL,
                size: undefined,
                tags: undefined,
                version: 1
            };
        }

        // If strict mode enabled, delegate to a lazily-loaded strict validator to keep this chunk small
        if (this._strictPersistedValidation) {
            try {
                const mod = await import('./advancedCacheStrictValidation.js');
                return mod.normalizePersistedMetadataStrict(metadata, this._maxMemoryUsage, this._metrics, this._logger);
            } catch (e) {
                this._logger.warn('Failed to load strict persistent validation module, falling back to tolerant parsing', e);
                // fall through to tolerant parsing
            }
        }

        // Tolerant parsing (lightweight)
        const toNumber = (v) => {
            if (typeof v === 'number' && Number.isFinite(v)) return v;
            if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
            return NaN;
        };

        const rawTs = metadata.timestamp ?? metadata.ts;
        const rawLa = metadata.lastAccess ?? metadata.la;
        const rawTtl = metadata.ttl ?? metadata.tt;
        const rawSz = metadata.size ?? metadata.sz;

        const ts = toNumber(rawTs);
        const la = toNumber(rawLa);
        const ttl = toNumber(rawTtl);
        const sz = toNumber(rawSz);

        const tagsRaw = metadata.tags ?? metadata.tg;

        return {
            timestamp: Number.isFinite(ts) ? ts : Date.now(),
            lastAccess: Number.isFinite(la) ? la : Date.now(),
            ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_PERSISTENT_CACHE_TTL,
            size: Number.isFinite(sz) ? sz : undefined,
            tags: Array.isArray(tagsRaw) ? tagsRaw : undefined,
            version: metadata.version ?? metadata.v ?? 1
        };
    }

    async _hydratePersistedEntry(snapshot) {
        if (!snapshot) {
            return null;
        }
        const metadata = await this._normalizePersistedMetadata(snapshot.metadata || snapshot.meta);
        if (!metadata) {
            // If strict validation enabled, count rejection
            if (this._strictPersistedValidation) {
                this._metrics.persistentRejected++;
            }
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
                // If the persistent entry is larger than the current memory budget, avoid adding it to memory
                // but return its value so callers can use it without causing a large memory allocation in the cache.
                if (typeof persistentEntry.size === 'number' && persistentEntry.size > this._maxMemoryUsage) {
                    // If the entry is only slightly oversized (small multiplier over budget), return value but do not load into memory.
                    // If it's extremely oversized (very large compared to budget), skip returning to avoid heavy memory usage in callers.
                    const oversizedBy = persistentEntry.size / Math.max(this._maxMemoryUsage, 1);
                    if (oversizedBy > 4) {
                        this._logger.debug(`Persistent entry ${key} is extremely oversized (size ${persistentEntry.size}) exceeding maxMemoryUsage ${this._maxMemoryUsage}; skipping return`);
                        this._metrics.persistentRejected++;
                        this._metrics.diskMisses++;
                        return null;
                    }
                    this._logger.debug(`Persistent entry ${key} is oversized (size ${persistentEntry.size}) exceeding maxMemoryUsage ${this._maxMemoryUsage}; returning value without loading into memory`);
                    // Count as a disk hit since we successfully returned the persisted value
                    this._metrics.diskHits++;
                    return persistentEntry.value;
                }

                this._addToMemory(key, persistentEntry, { skipDirtyFlag: true });
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
    _addToMemory(key, entry, options = {}) {
        const { skipDirtyFlag = false } = options;
        // If the single entry is larger than the overall budget, log a warning and attempt eviction as before
        if (typeof entry.size === 'number' && entry.size > this._maxMemoryUsage) {
            this._logger.warn(`Entry ${key} size ${entry.size} exceeds maxMemoryUsage ${this._maxMemoryUsage}; attempting eviction to make room`);
        }
        if (this._currentMemoryUsage + (entry.size || 0) > this._maxMemoryUsage) {
            this._evictOldestItems(entry.size);
        }
        
        if (this._memoryCache.has(key)) {
            this._removeFromMemory(key);
        }
        
        this._memoryCache.set(key, entry);
        this._currentMemoryUsage += entry.size;
        if (!skipDirtyFlag) {
            this._memoryDirty = true;
            this._skipNextPersistentSave = false;
        }
        
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
        this._memoryDirty = true;
        this._skipNextPersistentSave = false;
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

            // Validate top-level structure
            if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
                this._metrics.persistentRejected++;
                this._logger.warn('Persistent cache snapshot invalid (expected object) - ignoring');
                return;
            }

            let loadedCount = 0;
            let skippedCount = 0;

            for (const [key, item] of Object.entries(cache)) {
                const entry = await this._hydratePersistedEntry(item);
                if (entry && this._isValid(entry)) {
                    // Debug: report size and decision for diagnostic purposes
                    this._logger.debug(`Loading persisted entry key=${key} size=${entry.size} maxMemoryUsage=${this._maxMemoryUsage}`);

                    // If entry size is larger than maximum memory budget, skip adding to memory
                    if (typeof entry.size === 'number' && entry.size > this._maxMemoryUsage) {
                        this._logger.debug(`Skipping loading entry ${key} into memory: size (${entry.size}) exceeds maxMemoryUsage`);
                        skippedCount++;
                        continue;
                    }

                    // If strict mode is enabled and entry size is missing, reject
                    if (this._strictPersistedValidation && (typeof entry.size !== 'number' || !Number.isFinite(entry.size))) {
                        this._metrics.persistentRejected++;
                        skippedCount++;
                        continue;
                    }

                    this._addToMemory(key, entry, { skipDirtyFlag: true });
                    loadedCount++;
                    continue;
                }
                skippedCount++;
            }
            this._memoryDirty = false;

            this._metrics.persistentLoads++;
            this._logger.info(`Loaded persistent cache: ${loadedCount} items (${skippedCount} expired/invalid)`);
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

        if (this._skipNextPersistentSave) {
            this._logger.debug('Skipping persistent cache save (runtime reset requested)');
            this._skipNextPersistentSave = false;
            return;
        }

        if (!this._memoryDirty) {
            this._logger.debug('Persistent cache unchanged - skipping save');
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
            this._memoryDirty = false;
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
        const entry = await this._hydratePersistedEntry(item);
        if (entry && this._isValid(entry)) {
            // Return hydrated entry to caller; caller may decide to load it into memory or
            // return its value directly if it's larger than the current memory budget.
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
        this._memoryDirty = true;
        
        this._logger.info('Cache cleared');
    }

    /**
     * Clear runtime cache but preserve persistent snapshot
     */
    resetRuntimeOnly() {
        this._memoryCache.clear();
        this._currentMemoryUsage = 0;
        this._memoryDirty = false;
        this._skipNextPersistentSave = true;
        this._logger.info('Runtime cache cleared (persistent snapshot preserved)');
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
