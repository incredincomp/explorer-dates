function setupPeriodicRefresh(provider) {
    try {
        const vscode = (() => { try { return require('vscode'); } catch { return null; } })();
        const config = vscode ? vscode.workspace.getConfiguration('explorerDates') : { get: () => 60000 };
        const configuredInterval = config.get('badgeRefreshInterval', 60000);
        const interval = provider._refreshIntervalOverride || configuredInterval;
        provider._refreshInterval = interval;

        provider._logger?.info?.(`Setting up periodic refresh with interval: ${provider._refreshInterval}ms`);

        if (provider._refreshTimer) {
            clearInterval(provider._refreshTimer);
            provider._refreshTimer = null;
        }
        if (provider._incrementalRefreshTimers && provider._incrementalRefreshTimers.size) {
            for (const timer of provider._incrementalRefreshTimers) clearTimeout(timer);
            provider._incrementalRefreshTimers.clear();
        }

        if (!config.get('showDateDecorations', true)) {
            provider._logger?.info?.('Decorations disabled, skipping periodic refresh setup');
            return;
        }

        provider._refreshTimer = setInterval(() => {
            if (provider._incrementalRefreshInProgress) {
                provider._logger?.debug?.('Periodic refresh skipped - incremental refresh already running');
                return;
            }
            provider._logger?.debug?.('Periodic refresh triggered - scheduling incremental refresh');
            scheduleIncrementalRefresh(provider, 'periodic');
        }, provider._refreshInterval);

        provider._logger?.info?.('Periodic refresh timer started');
    } catch (error) {
        provider._logger?.debug?.('Failed to setup periodic refresh', error);
    }
}

function cancelIncrementalRefreshTimers(provider) {
    if (!provider._incrementalRefreshTimers || provider._incrementalRefreshTimers.size === 0) return;
    for (const timer of provider._incrementalRefreshTimers) {
        clearTimeout(timer);
    }
    provider._incrementalRefreshTimers.clear();
    provider._incrementalRefreshInProgress = false;
}

function scheduleIncrementalRefresh(provider, reason = 'manual') {
    try {
        // Defensive: ignore scheduling after provider is disposed
        if (provider._isDisposed) {
            provider._logger?.debug?.(`scheduleIncrementalRefresh called after dispose - ignoring (${reason})`);
            return;
        }

        if (provider._scheduledRefreshPending) {
            provider._logger?.debug?.(`Incremental refresh (${reason}) skipped - refresh already pending`);
            return;
        }

        if (provider._incrementalRefreshInProgress) {
            provider._logger?.debug?.(`Incremental refresh (${reason}) already in progress, cancelling pending timers and rescheduling`);
            cancelIncrementalRefreshTimers(provider);
        }

        // Defensive: ensure memory cache exists and is iterable before continuing
        if (!provider._decorationCache || typeof provider._decorationCache.entries !== 'function') {
            provider._logger?.debug?.('scheduleIncrementalRefresh: no memory cache available, firing global refresh');
            try { provider._onDidChangeFileDecorations.fire(undefined); } catch { /* ignore */ }
            provider._incrementalRefreshInProgress = false;
            provider._scheduledRefreshPending = false;
            return;
        }

        const entries = Array.from(provider._decorationCache.entries());
        if (entries.length === 0) {
            provider._logger?.debug?.(`No cached decorations to refresh for ${reason}, falling back to global refresh`);
            provider._onDidChangeFileDecorations.fire(undefined);
            return;
        }

        const targets = entries
            .map(([cacheKey, entry]) => {
                const uri = entry?.uri ? entry.uri : (cacheKey ? require('vscode').Uri.file(cacheKey) : null);
                return uri ? { cacheKey, uri } : null;
            })
            .filter(Boolean);

        if (targets.length === 0) {
            provider._logger?.debug?.(`Failed to resolve URIs for ${reason} incremental refresh, firing global refresh`);
            provider._onDidChangeFileDecorations.fire(undefined);
            return;
        }

        const chunkSize = 40;
        const totalChunks = Math.ceil(targets.length / chunkSize);
        const targetDuration = Math.min(4000, Math.max(750, Math.floor(provider._refreshInterval * 0.25)));
        const spacing = totalChunks > 1 ? Math.max(25, Math.floor(targetDuration / totalChunks)) : 0;

        provider._incrementalRefreshInProgress = true;
        provider._scheduledRefreshPending = true;
        provider._logger?.debug?.(`Incremental refresh (${reason}) scheduled for ${targets.length} items in ${totalChunks} batches (spacing: ${spacing}ms)`);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const chunk = targets.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
            const delay = chunkIndex === 0 ? 0 : spacing * chunkIndex;

            const timer = setTimeout(() => {
                try {
                    // Abort if provider was disposed after this timer was scheduled
                    if (provider._isDisposed) {
                        provider._incrementalRefreshTimers.delete(timer);
                        if (!provider._incrementalRefreshTimers.size) {
                            provider._incrementalRefreshInProgress = false;
                            provider._scheduledRefreshPending = false;
                        }
                        return;
                    }

                    chunk.forEach(({ cacheKey, uri }) => {
                        markCacheEntryForRefresh(provider, cacheKey);
                        provider._onDidChangeFileDecorations.fire(uri);
                    });
                } finally {
                    provider._incrementalRefreshTimers.delete(timer);
                    if (provider._incrementalRefreshTimers.size === 0) {
                        provider._incrementalRefreshInProgress = false;
                        provider._scheduledRefreshPending = false;
                        provider._logger?.debug?.(`Incremental refresh (${reason}) completed`);
                    }
                }
            }, delay);

            provider._incrementalRefreshTimers.add(timer);
        }
    } catch (error) {
        provider._logger?.debug?.('Failed to schedule incremental refresh', error);
    }
}

function markCacheEntryForRefresh(provider, cacheKey) {
    if (!cacheKey) return;
    // Defensive: ensure memory cache exists and supports get
    if (!provider._decorationCache || typeof provider._decorationCache.get !== 'function') {
        provider._logger?.debug?.('markCacheEntryForRefresh: no memory cache available, skipping');
    } else {
        const entry = provider._decorationCache.get(cacheKey);
        if (entry) {
            const ageMs = Date.now() - entry.timestamp;
            const isStale = ageMs > (provider._cacheTimeout * 0.75);
            if (isStale) {
                entry.forceRefresh = true;
                provider._logger?.debug?.(`Marked stale entry for refresh: ${cacheKey} (age: ${Math.round(ageMs / 1000)}s)`);
            } else {
                provider._logger?.debug?.(`Skipped refresh for fresh entry: ${cacheKey} (age: ${Math.round(ageMs / 1000)}s)`);
            }
        }
    }

    if (provider._advancedCache) {
        try {
            const escapedKey = cacheKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            provider._advancedCache.invalidateByPattern(escapedKey);
        } catch (error) {
            provider._logger?.debug?.(`Could not invalidate advanced cache for ${cacheKey}: ${error.message}`);
        }
    }
}

module.exports = { setupPeriodicRefresh, cancelIncrementalRefreshTimers, scheduleIncrementalRefresh, markCacheEntryForRefresh };