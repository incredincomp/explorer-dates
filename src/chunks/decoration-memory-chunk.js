const proc = (typeof process !== 'undefined') ? process : null;

function maybeShedWorkload(provider) {
    try {
        if (!provider._memorySheddingEnabled || provider._memorySheddingActive) return;
        const current = (() => { try { return proc?.memoryUsage ? proc.memoryUsage().heapUsed / 1024 / 1024 : 0; } catch { return 0; } })();
        if (!current) return;

        if (!provider._memoryBaselineMB) {
            provider._memoryBaselineMB = current;
            provider._consecutiveSoftHeapBreaches = 0;
            provider._softHeapAlertLogged = false;
            return;
        }
        const delta = current - provider._memoryBaselineMB;

        if (delta >= provider._softHeapAlertThresholdMB) {
            provider._consecutiveSoftHeapBreaches++;
            if (provider._consecutiveSoftHeapBreaches >= 2 && !provider._softHeapAlertLogged) {
                provider._softHeapAlertLogged = true;
                provider._logger?.warn?.('Memory pressure warning (soft threshold exceeded twice)', {
                    deltaMB: Number(delta.toFixed(2)),
                    baselineMB: provider._memoryBaselineMB,
                    heapMB: current,
                    rssMB: (() => { try { return proc?.memoryUsage ? proc.memoryUsage().rss / 1024 / 1024 : 0; } catch { return 0; } })(),
                    cacheSize: provider._decorationCache.size,
                    cacheLimit: provider._maxCacheSize
                });
            }
        } else if (provider._consecutiveSoftHeapBreaches > 0) {
            provider._consecutiveSoftHeapBreaches = 0;
            if (delta < provider._softHeapAlertThresholdMB * 0.5) provider._softHeapAlertLogged = false;
        }

        if (delta >= provider._memorySheddingThresholdMB) {
            provider._memorySheddingActive = true;
            provider._maxCacheSize = Math.min(provider._maxCacheSize, provider._memoryShedCacheLimit);
            provider._refreshIntervalOverride = Math.max(
                provider._refreshIntervalOverride || provider._refreshInterval || provider._memoryShedRefreshIntervalMs,
                provider._memoryShedRefreshIntervalMs
            );
            const rssMB = (() => { try { return proc?.memoryUsage ? proc.memoryUsage().rss / 1024 / 1024 : 0; } catch { return 0; } })();
            const event = {
                timestamp: new Date().toISOString(),
                deltaMB: Number(delta.toFixed(2)),
                baselineMB: provider._memoryBaselineMB,
                heapMB: current,
                rssMB,
                cacheSize: provider._decorationCache.size,
                maxCacheSize: provider._maxCacheSize,
                watcherStrategy: provider._activeWatcherStrategy,
                staticWatchers: provider._fileWatchers.size,
                dynamicWatchers: provider._dynamicWatchers.size
            };
            provider._memorySheddingEvents.push(event);
            if (provider._memorySheddingEvents.length > 10) provider._memorySheddingEvents.shift();
            provider._logger?.warn?.(`Memory shedding activated (delta ${delta.toFixed(2)} MB >= ${provider._memorySheddingThresholdMB} MB); cache size capped at ${provider._maxCacheSize} and refresh interval stretched to ${provider._refreshIntervalOverride}ms`, event);
            provider._setupPeriodicRefresh?.();
            provider._softHeapAlertLogged = false;
            provider._consecutiveSoftHeapBreaches = 0;
        }
    } catch (error) {
        provider._logger?.debug?.('maybeShedWorkload failed', error);
    }
}

function monitorCachePressure(provider) {
    try {
        if (!provider._maxCacheSize || provider._maxCacheSize <= 0) return;
        const ratio = provider._decorationCache.size / provider._maxCacheSize;
        if (ratio >= provider._cachePressureThreshold) {
            if (!provider._cachePressureLogged) {
                provider._cachePressureLogged = true;
                provider._logger?.infoWithOptions?.(
                    { throttleKey: 'cache-pressure', intervalMs: 60000 },
                    `Decoration cache usage is at ${(ratio * 100).toFixed(1)}% of capacity`,
                    { cacheSize: provider._decorationCache.size, maxCacheSize: provider._maxCacheSize }
                );
            }
        } else if (ratio < provider._cachePressureThreshold * 0.5) {
            provider._cachePressureLogged = false;
        }
    } catch (error) {
        provider._logger?.debug?.('monitorCachePressure failed', error);
    }
}

function purgeLightweightCaches(provider, reason = 'lightweight') {
    try {
        if (!provider._lightweightMode) return;
        if (provider._decorationCache.size > 0) provider._decorationCache.clear();
        try { if (typeof provider._purgeDecorationPool === 'function') provider._purgeDecorationPool(reason); } catch { /* ignore */ }
        if (provider._badgeFlyweightCache.size > 0) { provider._badgeFlyweightCache.clear(); provider._badgeFlyweightOrder.length = 0; }
        if (provider._readableDateFlyweightCache.size > 0) { provider._readableDateFlyweightCache.clear(); provider._readableDateFlyweightOrder.length = 0; }
        provider._logger?.debug?.(`🧽 Purged lightweight caches (${reason})`);
    } catch (error) {
        provider._logger?.debug?.('purgeLightweightCaches failed', error);
    }
}

module.exports = { maybeShedWorkload, monitorCachePressure, purgeLightweightCaches };
