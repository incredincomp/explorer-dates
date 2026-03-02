// Decoration pool & flyweight helpers extracted to a lazy chunk
function _getFlyweightValueImpl(cache, order, limit, key, factory, statsTracker) {
    if (!key) return factory();
    try {
        if (cache.has(key)) { statsTracker && (statsTracker.hits++, statsTracker.reuses++); return cache.get(key); }
        statsTracker && statsTracker.misses++;
        const value = factory();
        cache.set(key, value);
        order.push(key);
        if (order.length > limit) {
            const evict = order.shift(); if (evict) cache.delete(evict);
        }
        return value;
    } catch {
        try { return factory(); } catch { return null; }
    }
}

function acquireDecorationFromPoolImpl({ badge, tooltip, color }, createFileDecoration) {
    // createFileDecoration is a small wrapper that returns new vscode.FileDecoration(badge)
    try {
        if (!badge) return createFileDecoration('??');
        const key = `${badge}::${tooltip || ''}::${color || ''}`;
        // Note: provider passes its own cache and stats in calling context
        // The implementation here is intentionally minimal and assumes caller manages caches
        return createFileDecoration(badge, tooltip, color, key);
    } catch {
        return createFileDecoration(badge || '??');
    }
}

function _trimFlyweightCacheToLimitImpl(cache, order, maxSize) {
    try {
        if (!maxSize || cache.size <= maxSize) return;
        const toRemove = cache.size - maxSize;
        for (let i = 0; i < toRemove; i++) {
            const k = order.shift(); if (k) cache.delete(k);
        }
    } catch {
        // ignore
    }
}

function clearDecorationPoolImpl(provider, reason = 'unspecified') {
    try {
        if (provider._decorationPool?.size) { provider._decorationPool.clear(); provider._decorationPoolOrder.length = 0; }
        provider._logger?.debug?.(`🧽 Cleared decoration pool (${reason})`);
    } catch (e) {
        provider._logger?.debug?.('clearDecorationPoolImpl failed', e);
    }
}

module.exports = {
    _getFlyweightValueImpl,
    acquireDecorationFromPoolImpl,
    _trimFlyweightCacheToLimitImpl,
    clearDecorationPoolImpl
};