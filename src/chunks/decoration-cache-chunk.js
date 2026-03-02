async function getCachedDecoration(provider, cacheKey, fileLabel) {
    try {
        if (provider._forceCacheBypass) {
            provider._logger?.debug?.(`⚠️ Cache bypass enabled - recalculating decoration for: ${fileLabel}`);
            return null;
        }

        if (provider._advancedCache) {
            try {
                const cached = await provider._advancedCache.get(cacheKey);
                if (cached) {
                    provider._metrics.cacheHits++;
                    provider._logger?.debug?.(`🧠 Advanced cache hit for: ${fileLabel}`);
                    return cached;
                }
            } catch (error) {
                provider._logger?.debug?.(`Advanced cache error: ${error.message}`);
            }
        }

        // Defensive guard: ensure in-memory cache exists and is map-like
        if (!provider._decorationCache || typeof provider._decorationCache.get !== 'function') {
            provider._logger?.debug?.('getCachedDecoration: no memory cache available, falling back');
            return null;
        }

        const memoryEntry = provider._decorationCache.get(cacheKey);
        if (memoryEntry) {
            if (memoryEntry.forceRefresh) {
                try { provider._decorationCache.delete(cacheKey); } catch { /* ignore */ }
                provider._logger?.debug?.(`🚫 Memory cache bypassed (forced refresh) for: ${fileLabel}`);
            } else if ((Date.now() - memoryEntry.timestamp) < provider._cacheTimeout) {
                provider._metrics.cacheHits++;
                provider._logger?.debug?.(`💾 Memory cache hit for: ${fileLabel}`);
                return memoryEntry.decoration;
            }
        }

        return null;
    } catch (error) {
        provider._logger?.debug?.('getCachedDecoration failed', error);
        return null;
    }
}

async function storeDecorationInCache(provider, cacheKey, decoration, fileLabel, resourceUri) {
    try {
        if (provider._forceCacheBypass) return;

        // Defensive: ensure in-memory cache exists and is map-like
        if (!provider._decorationCache || typeof provider._decorationCache.set !== 'function' || typeof provider._decorationCache.size !== 'number') {
            try { provider._decorationCache = new Map(); } catch { /* ignore */ }
        }
        if (!provider._decorationCache || typeof provider._decorationCache.set !== 'function') {
            provider._logger?.debug?.('storeDecorationInCache: memory cache unavailable after init, aborting store');
            return;
        }

        // Manage memory cache size locally
        if (typeof provider._decorationCache.size === 'number' && provider._decorationCache.size > provider._maxCacheSize) {
            try { provider._decorationCache.enforceLimit(provider._maxCacheSize, provider._logger); } catch { /* ignore */ }
        }

        const cacheEntry = { decoration, timestamp: Date.now() };
        if (resourceUri) cacheEntry.uri = resourceUri;
        try { provider._decorationCache.set(cacheKey, cacheEntry); } catch { /* ignore */ }

        // Kick off cache pressure monitor
        try { if (typeof provider._monitorCachePressure === 'function') provider._monitorCachePressure(); } catch (e) { provider._logger?.debug?.('monitorCachePressure from store failed', e); }

        if (provider._advancedCache) {
            try {
                await provider._advancedCache.set(cacheKey, decoration, { ttl: provider._cacheTimeout });
                provider._logger?.debug?.(`🧠 Stored in advanced cache: ${fileLabel}`);
            } catch (error) {
                provider._logger?.debug?.(`Failed to store in advanced cache: ${error.message}`);
            }
        }

        // Maybe extend cache timeout heuristic
        try {
            if (typeof provider._maybeExtendCacheTimeout === 'function') {
                provider._maybeExtendCacheTimeout();
            }
        } catch (err) { provider._logger?.debug?.('maybeExtendCacheTimeout from store failed', err); }
    } catch (error) {
        provider._logger?.debug?.('storeDecorationInCache failed', error);
    }
}

function createLazyHierarchicalDecorationCache() {
    class LazyHierarchicalDecorationCache {
        constructor() {
            this._proxy = null;
            this._fallback = new Map();
            this._entryCount = 0;
            this._hydrated = false;
            this.hydrateInBackground();
        }

        get size() { return this._proxy ? this._proxy.size : this._entryCount; }
        get bucketCount() { return this._proxy ? this._proxy.bucketCount : 0; }

        clear() {
            if (this._proxy) return this._proxy.clear();
            this._fallback.clear();
            this._entryCount = 0;
        }

        get(cacheKey) { if (this._proxy) return this._proxy.get(cacheKey); return this._fallback.get(cacheKey); }

        set(cacheKey, entry, options = {}) {
            if (this._proxy) return this._proxy.set(cacheKey, entry, options);
            const existed = this._fallback.has(cacheKey);
            this._fallback.set(cacheKey, entry);
            if (!existed) this._entryCount++;
        }

        delete(cacheKey) { if (this._proxy) return this._proxy.delete(cacheKey); const existed = this._fallback.delete(cacheKey); if (existed) this._entryCount = Math.max(0, this._entryCount - 1); return existed; }

        *entries() { if (this._proxy) { yield* this._proxy.entries(); return; } yield* this._fallback.entries(); }
        *keys() { if (this._proxy) { yield* this._proxy.keys(); return; } yield* this._fallback.keys(); }
        *values() { if (this._proxy) { yield* this._proxy.values(); return; } yield* this._fallback.values(); }
        [Symbol.iterator]() { return this.entries(); }

        enforceLimit(maxSize = 0, logger) {
            if (this._proxy) return this._proxy.enforceLimit(maxSize, logger);
            if (!maxSize || this._entryCount <= maxSize) return 0;
            let removed = 0;
            const keys = Array.from(this._fallback.keys());
            const toRemove = keys.slice(0, Math.max(1, Math.ceil(this._entryCount - maxSize)));
            for (const k of toRemove) { this._fallback.delete(k); removed++; this._entryCount = Math.max(0, this._entryCount - 1); }
            if (removed > 0 && logger) logger.debug(`LazyHierarchical cache eviction removed ${removed} entries`);
            return removed;
        }

        async _hydrate() {
            if (this._hydrated) return;
            this._hydrated = true;
            try {
                // Import the heavy real implementation lazily (path relative to chunks)
                const mod = await import('../utils/hierarchicalDecorationCache');
                const Real = mod.HierarchicalDecorationCache;
                this._proxy = new Real();
                for (const [k, v] of this._fallback.entries()) { this._proxy.set(k, v); }
                this._fallback = null;
            } catch {
                this._hydrated = false; // keep fallback if hydration fails
            }
        }

        hydrateInBackground() { this._hydrate().catch(() => {}); }
    }

    return new LazyHierarchicalDecorationCache();
}

module.exports = { getCachedDecoration, storeDecorationInCache, createLazyHierarchicalDecorationCache };