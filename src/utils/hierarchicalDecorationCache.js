const { normalizePath } = require('./pathUtils');

const ROOT_CACHE_BUCKET = '__root__';

class HierarchicalDecorationCache {
    constructor() {
        this._buckets = new Map();
        this._keyToBucket = new Map();
        this._entryCount = 0;
    }

    get size() {
        return this._entryCount;
    }

    get bucketCount() {
        return this._buckets.size;
    }

    clear() {
        this._buckets.clear();
        this._keyToBucket.clear();
        this._entryCount = 0;
    }

    get(cacheKey) {
        if (!cacheKey) {
            return undefined;
        }
        const bucketKey = this._keyToBucket.get(cacheKey);
        if (!bucketKey) {
            return undefined;
        }
        const bucket = this._buckets.get(bucketKey);
        if (!bucket) {
            this._keyToBucket.delete(cacheKey);
            return undefined;
        }
        bucket.lastAccess = Date.now();
        return bucket.entries.get(cacheKey);
    }

    set(cacheKey, entry, options = {}) {
        if (!cacheKey) {
            return;
        }
        const folderKey = options.folderKey || this._deriveFolderKey(cacheKey);
        const bucket = this._getOrCreateBucket(folderKey);
        const hasExisting = bucket.entries.has(cacheKey);
        bucket.entries.set(cacheKey, entry);
        bucket.lastAccess = Date.now();
        if (!hasExisting) {
            this._entryCount++;
        }
        this._keyToBucket.set(cacheKey, folderKey);
    }

    delete(cacheKey) {
        if (!cacheKey) {
            return false;
        }
        const bucketKey = this._keyToBucket.get(cacheKey);
        if (!bucketKey) {
            return false;
        }
        const bucket = this._buckets.get(bucketKey);
        if (!bucket) {
            this._keyToBucket.delete(cacheKey);
            return false;
        }
        const existed = bucket.entries.delete(cacheKey);
        if (existed) {
            this._entryCount = Math.max(0, this._entryCount - 1);
            if (bucket.entries.size === 0) {
                this._buckets.delete(bucketKey);
            }
        }
        this._keyToBucket.delete(cacheKey);
        return existed;
    }

    *entries() {
        for (const bucket of this._buckets.values()) {
            yield* bucket.entries.entries();
        }
    }

    *keys() {
        for (const bucket of this._buckets.values()) {
            yield* bucket.entries.keys();
        }
    }

    *values() {
        for (const bucket of this._buckets.values()) {
            yield* bucket.entries.values();
        }
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    enforceLimit(maxSize = 0, logger) {
        if (!maxSize || this._entryCount <= maxSize) {
            return 0;
        }

        const targetRemovals = Math.max(Math.floor(maxSize * 0.2), this._entryCount - maxSize, 1);
        let removed = 0;
        const buckets = Array.from(this._buckets.entries()).map(([folderKey, bucket]) => ({ folderKey, bucket }));
        buckets.sort((a, b) => (a.bucket.lastAccess || 0) - (b.bucket.lastAccess || 0));

        for (const { folderKey, bucket } of buckets) {
            if (removed >= targetRemovals) {
                break;
            }

            if (!bucket.entries.size) {
                this._buckets.delete(folderKey);
                continue;
            }

            const bucketSize = bucket.entries.size;
            const remainingTarget = targetRemovals - removed;

            if (bucketSize <= remainingTarget) {
                removed += this._evictBucket(folderKey, bucket);
                continue;
            }

            const bucketEntries = Array.from(bucket.entries.entries());
            bucketEntries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
            const bucketRemovals = Math.min(remainingTarget, Math.max(1, Math.ceil(bucketSize * 0.5)));

            for (let i = 0; i < bucketRemovals && i < bucketEntries.length; i++) {
                const [key] = bucketEntries[i];
                bucket.entries.delete(key);
                this._keyToBucket.delete(key);
                removed++;
                this._entryCount = Math.max(0, this._entryCount - 1);
            }

            if (!bucket.entries.size) {
                this._buckets.delete(folderKey);
            } else {
                bucket.lastAccess = Date.now();
            }
        }

        if (removed > 0 && logger) {
            logger.debug(`Hierarchical cache eviction removed ${removed} entries (${this._entryCount} remaining)`);
        }

        return removed;
    }

    _getOrCreateBucket(folderKey) {
        if (!this._buckets.has(folderKey)) {
            this._buckets.set(folderKey, {
                entries: new Map(),
                lastAccess: Date.now()
            });
        }
        return this._buckets.get(folderKey);
    }

    _evictBucket(folderKey, bucket) {
        if (!bucket) {
            return 0;
        }
        const removed = bucket.entries.size;
        for (const key of bucket.entries.keys()) {
            this._keyToBucket.delete(key);
        }
        this._buckets.delete(folderKey);
        this._entryCount = Math.max(0, this._entryCount - removed);
        return removed;
    }

    _deriveFolderKey(input) {
        if (!input || typeof input !== 'string') {
            return ROOT_CACHE_BUCKET;
        }
        const normalized = normalizePath(input);
        if (!normalized) {
            return ROOT_CACHE_BUCKET;
        }
        const separatorIndex = normalized.lastIndexOf('/');
        if (separatorIndex === -1) {
            return ROOT_CACHE_BUCKET;
        }
        const folder = normalized.slice(0, separatorIndex);
        return folder || ROOT_CACHE_BUCKET;
    }
}

module.exports = { HierarchicalDecorationCache };
