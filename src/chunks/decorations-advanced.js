let vscode = null;
try { vscode = require('vscode'); } catch { /* gracefully fallback when required in non-VS Code contexts */ }
const proc = (typeof process !== 'undefined') ? process : null;
const env = proc?.env || {};
const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
const featureFlags = getFeatureFlagsGlobal();
// Local copy so chunk can validate feature level values without referencing host globals
const FEATURE_LEVELS = ['full', 'enhanced', 'standard', 'minimal'];

if (!featureFlags) {
    throw new Error('Explorer Dates: feature flags bridge unavailable for decorationsAdvanced chunk');
}

// Resilient chunk loader - try multiple candidate module names to survive filename
// transformations that occur during packaging (e.g., camelCase vs hyphenated).
function tryLoadChunk(...names) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            for (const n of names) {
                try {
                    const mod = dynamicRequire(n);
                    if (mod) return mod;
                } catch { /* ignore */ }
            }
        }
    } catch { /* ignore */ }
    return null;
}



async function loadBatchProcessorIfNeeded(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-batch-chunk');
            if (chunk && typeof chunk.loadBatchProcessorIfNeeded === 'function') {
                return await chunk.loadBatchProcessorIfNeeded(provider);
            }
        }
    } catch (e) { provider['_logger']?.debug?.('Delegated loadBatchProcessorIfNeeded failed', e); }

    // Fallback: no batch processor available
    provider['_logger']?.debug?.('BatchProcessor not available (fallback)');
    return null;
}

// Defer heavy preloads from provider constructor into this chunk
async function deferPreloads(provider) {
    try {
        // Viewport manager
        import('./viewport-manager-chunk.js').then((mod) => {
            try { provider._viewportManager = mod.createViewportManager?.(provider) || null; } catch (e) { provider._logger?.debug?.('Failed to init viewport manager', e); }
        }).catch((e) => provider._logger?.debug?.('Failed to load viewport manager chunk', e));

        // Localization core
        import('./localization-core.js').then((mod) => {
            try {
                const real = mod.getLocalization();
                provider._l10n.getString = (...args) => real.getString(...args);
                provider._l10n.formatDate = (...args) => real.formatDate(...args);
                provider._l10n.getCurrentLocale = () => real.getCurrentLocale();
                const originalDispose = provider._l10n.dispose;
                provider._l10n.dispose = () => { try { real.dispose(); } catch {} ; originalDispose(); };
            } catch { /* ignore */ }
        }).catch(() => {});

        // Decoration logic
        import('./decoration-logic-chunk.js').then((mod) => {
            try { provider._decorationLogic = mod.createDecorationLogic?.(provider) || null; } catch (e) { provider._logger?.debug?.('Failed to initialize decoration logic chunk', e); }
        }).catch((e) => provider._logger?.debug?.('Failed to load decoration logic chunk', e));

        // Decoration provide chunk
        import('./decoration-provide-chunk.js').then((mod) => {
            try { provider._decorationProviderHelpers = mod.createDecorationProviderHelpers?.(provider) || null; } catch (e) { provider._logger?.debug?.('Failed to initialize decoration provide chunk', e); }
        }).catch((e) => provider._logger?.debug?.('Failed to load decoration provide chunk', e));

        provider._logger?.debug?.('Deferred preloads scheduled');
    } catch (err) {
        provider._logger?.debug?.('deferPreloads failed', err);
    }
}

async function getCachedDecoration(provider, cacheKey, fileLabel) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const chunk = dynamicRequire('./decoration-cache-chunk');
                if (chunk && typeof chunk.getCachedDecoration === 'function') return await chunk.getCachedDecoration(provider, cacheKey, fileLabel);
            } catch { /* ignore and fallback */ }
        }

        // Fallback to in-file logic
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

        // Defensive guard: ensure memory cache exists and is map-like before use
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
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const chunk = dynamicRequire('./decoration-cache-chunk');
                if (chunk && typeof chunk.storeDecorationInCache === 'function') return await chunk.storeDecorationInCache(provider, cacheKey, decoration, fileLabel, resourceUri);
            } catch { /* ignore and fallback */ }
        }

        if (provider._forceCacheBypass) return;

        // Ensure there is a memory cache in place and it's map-like
        if (!provider._decorationCache || typeof provider._decorationCache.set !== 'function' || typeof provider._decorationCache.size !== 'number') {
            try { provider._decorationCache = new Map(); } catch { /* ignore */ }
        }
        // If we still don't have a usable map-like cache, abort storing gracefully
        if (!provider._decorationCache || typeof provider._decorationCache.set !== 'function') {
            provider._logger?.debug?.('storeDecorationInCache: memory cache unavailable after init, aborting store');
            return;
        }

        // Manage memory cache size locally
        try {
            if (typeof provider._decorationCache.size === 'number' && provider._decorationCache.size > provider._maxCacheSize && typeof provider._decorationCache.enforceLimit === 'function') {
                provider._decorationCache.enforceLimit(provider._maxCacheSize, provider._logger);
            }
        } catch { /* ignore cache size management failures */ }

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
        } catch (e) { provider._logger?.debug?.('maybeExtendCacheTimeout from store failed', e); }
    } catch (error) {
        provider._logger?.debug?.('storeDecorationInCache failed', error);
    }
}

function cancelProgressiveWarmupJobs(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-batch-chunk');
            if (chunk && typeof chunk.cancelProgressiveWarmupJobs === 'function') return chunk.cancelProgressiveWarmupJobs(provider);
        }
    } catch (e) { provider['_logger']?.debug?.('Delegated cancelProgressiveWarmupJobs failed', e); }

    // fallback: clear known jobs set if present
    try {
        const progressiveJobs = provider['_progressiveLoadingJobs'];
        if (progressiveJobs && typeof progressiveJobs.clear === 'function') progressiveJobs.clear();
    } catch (e) { provider['_logger']?.debug?.('Fallback cancel failed', e); }
}

async function applyProgressiveLoadingSetting(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-batch-chunk');
            if (chunk && typeof chunk.applyProgressiveLoadingSetting === 'function') return chunk.applyProgressiveLoadingSetting(provider);
        }
    } catch (e) { provider['_logger']?.debug?.('Delegated applyProgressiveLoadingSetting failed', e); }

    // Fallback: minimal noop
    provider['_logger']?.debug?.('applyProgressiveLoadingSetting fallback invoked (no batch chunk)');
    return;
}

async function initializeAdvancedSystems(provider, context) {
    try {
        provider['_extensionContext'] = context;
        if (provider['_isWeb']) {
            await provider['_maybeWarnAboutGitLimitations']?.();
        }

        if (provider['_performanceMode']) {
            provider['_logger']?.info?.('Performance mode enabled - skipping advanced cache, batch processor, and progressive loading');
            return;
        }

        const advancedCacheModule = await featureFlags.advancedCache();
        if (advancedCacheModule) {
            let AdvancedCache = null;
            if (typeof advancedCacheModule === 'function') {
                if (advancedCacheModule.name === 'createAdvancedCache') {
                    provider['_advancedCache'] = advancedCacheModule(context);
                    await provider['_advancedCache'].initialize();
                    provider['_logger']?.info?.('Advanced cache initialized via factory function');
                } else {
                    try {
                        provider['_advancedCache'] = new advancedCacheModule(context);
                        await provider['_advancedCache'].initialize();
                        provider['_logger']?.info?.('Advanced cache initialized via direct constructor');
                    } catch (error) {
                        provider['_logger']?.warn?.('Failed to instantiate AdvancedCache via direct constructor, disabling advanced cache:', error.message);
                        provider['_advancedCache'] = null;
                    }
                }
            } else if (advancedCacheModule.AdvancedCache) {
                AdvancedCache = advancedCacheModule.AdvancedCache;
                provider['_advancedCache'] = new AdvancedCache(context);
                await provider['_advancedCache'].initialize();
                provider['_logger']?.info?.('Advanced cache initialized via module property');
            } else if (advancedCacheModule.createAdvancedCache) {
                provider['_advancedCache'] = advancedCacheModule.createAdvancedCache(context);
                await provider['_advancedCache'].initialize();
                provider['_logger']?.info?.('Advanced cache initialized via module factory');
            } else {
                provider['_logger']?.warn?.('AdvancedCache module format not recognized, disabling advanced cache');
                provider['_advancedCache'] = null;
            }
        } else {
            provider['_logger']?.info?.('Advanced cache disabled by feature flag');
            provider['_advancedCache'] = null;
        }

        await applyProgressiveLoadingSetting(provider);

        if (provider['_batchProcessor']) {
            provider['_batchProcessor'].initialize();
            provider['_logger']?.info?.('Batch processor initialized');
        }

        try {
                const chunk = tryLoadChunk('./decoration-workspace-intel-chunk', './decorationWorkspaceIntel', './decorationWorkspaceIntel.js', './decoration-workspace-intel-chunk.js');
                if (chunk && typeof chunk.initializeWorkspaceIntelligence === 'function') {
                    await chunk.initializeWorkspaceIntelligence(provider, context);
                } else {
                    provider['_logger']?.info?.('Workspace intelligence not initialized (no chunk)');
                }
        } catch (e) {
            provider['_logger']?.warn?.('Delegated workspace intelligence initialization failed', e?.message || String(e));
            provider['_workspaceIntelligence'] = null;
        }

        const config = vscode.workspace.getConfiguration('explorerDates');
        if (config.get('autoThemeAdaptation', true) && provider['_themeIntegration']?.autoConfigureForTheme) {
            await provider['_themeIntegration'].autoConfigureForTheme();
            provider['_logger']?.info?.('Theme integration configured');
        }

        if (provider['_accessibility']?.shouldEnhanceAccessibility?.()) {
            await provider['_accessibility'].applyAccessibilityRecommendations?.();
            provider['_logger']?.info?.('Accessibility recommendations applied');
        }

        if (provider['_allocationTelemetryEnabled']) {
            scheduleTelemetryReport(provider);
            provider['_logger']?.info?.(
                'Allocation telemetry enabled - reports every',
                provider['_telemetryReportInterval'],
                'ms'
            );
        }

        provider['_logger']?.info?.('Advanced systems initialized successfully');
    } catch (error) {
        provider['_logger']?.error?.('Failed to initialize advanced systems', error);
    }
}

function shouldUseFallbackWatcher(provider) {
    if (provider['_enableWatcherFallbacks'] === false) {
        return false;
    }
    if (provider['_enableWatcherFallbacks'] === 'auto' || provider['_enableWatcherFallbacks'] === true) {
        return isPlatformFallbackRequired();
    }
    return false;
}

function isPlatformFallbackRequired() {
    const platform = proc?.platform;
    const isWSL = env.WSL_DISTRO_NAME || env.WSLENV;
    const isRemote = vscode.env.remoteName;
    const isDocker = env.DOCKER_CONTAINER;
    return isWSL || isRemote || isDocker || platform === 'android';
}

async function createFallbackWatcher(provider, pattern, label) {
    try {
        if (!provider['_smartWatcherFallbackManager']) {
            const SmartWatcherFallbackModule = await featureFlags.loadFeatureModule('smartWatcherFallback');
            if (SmartWatcherFallbackModule) {
                const { SmartWatcherFallbackManager } = SmartWatcherFallbackModule;
                provider['_smartWatcherFallbackManager'] = new SmartWatcherFallbackManager({ logger: provider['_logger'] });
                await provider['_smartWatcherFallbackManager'].initialize();
            }
        }

        if (provider['_smartWatcherFallbackManager']) {
            const fallback = await provider['_smartWatcherFallbackManager'].getFallback();
            const watcher = await fallback.createWatcherWithFallback(pattern);
            provider['_logger']?.debug?.(`Fallback watcher created for ${label}`);
            return watcher;
        }
    } catch (error) {
        provider['_logger']?.warn?.(`Fallback watcher creation failed for ${label}:`, error);
    }
    return null;
}

async function createWatcherWithFallback(provider, pattern, label = 'unknown') {
    try {
        const nativeWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        provider['_logger']?.debug?.(`Native watcher created for ${label}`);
        return nativeWatcher;
    } catch (nativeError) {
        provider['_logger']?.debug?.(`Native watcher failed for ${label}:`, nativeError);
        if (!shouldUseFallbackWatcher(provider)) {
            throw nativeError;
        }
        return createFallbackWatcher(provider, pattern, label);
    }
}

// Ensure we can explicitly create and return a watcher manager from this advanced chunk
async function ensureWatcherManager(provider) {
    try {
        if (provider._watcherManager) return provider._watcherManager;
        // Try to load watcher manager chunk
        try {
            const m = await import('./watcher-manager-chunk.js');
            provider._watcherManager = m.createWatcherManager(provider);
            return provider._watcherManager;
        } catch (e) {
            provider._logger?.debug?.('Failed to load watcher manager chunk from advanced chunk', e);
        }
    } catch (error) {
        provider._logger?.debug?.('ensureWatcherManager failed', error);
    }
    return null;
}

async function setupFileWatcher(provider, reason = 'initial') {
    try {
        const wm = await ensureWatcherManager(provider);
        if (wm && typeof wm.setupFileWatcher === 'function') {
            return wm.setupFileWatcher(reason);
        }
    } catch (e) {
        provider._logger?.debug?.('setupFileWatcher failed in advanced chunk', e);
    }
    // Fallback: try native watcher creation but do not throw
    try {
        const watcher = createWatcherWithFallback(provider, '**/*', `global:${reason}`);
        if (watcher) {
            if (!provider._fileWatchers) provider._fileWatchers = new Set();
            provider._fileWatchers.add(watcher);
            provider._logger?.info?.('Global watcher activated (fallback)', { reason });
            return watcher;
        }
    } catch (e) {
        provider._logger?.debug?.('setupFileWatcher fallback failed', e);
    }
    return null;
}

function registerWatcherHandlers(provider, watcher, label = 'unknown') {
    try {
        const wm = provider._watcherManager || null;
        if (wm && typeof wm._registerWatcherHandlers === 'function') {
            return wm._registerWatcherHandlers(watcher, label);
        }
    } catch (e) {
        provider._logger?.debug?.('Watcher manager register watcher handlers failed (advanced)', e);
    }

    try {
        if (!watcher) return;
        watcher.onDidChange((uri) => provider._handleWatcherEvent(uri, 'change', label));
        watcher.onDidCreate((uri) => provider._handleWatcherEvent(uri, 'create', label));
        watcher.onDidDelete((uri) => provider._handleWatcherEvent(uri, 'delete', label));
    } catch (e) {
        provider._logger?.debug?.('registerWatcherHandlers fallback failed', e);
    }
}

function dispatchWatcherEvent(provider, uri, eventType, source) {
    try {
        const wm = provider._watcherManager || null;
        if (wm && typeof wm._dispatchWatcherEvent === 'function') {
            return wm._dispatchWatcherEvent(uri, eventType, source);
        }
    } catch (e) {
        provider._logger?.debug?.('Watcher manager dispatch watcher event failed (advanced)', e);
    }

    try {
        if (eventType === 'delete') provider.clearDecoration(uri); else provider.refreshDecoration(uri);
        if (provider._workspaceIntelligence?.incrementalIndexer) provider._workspaceIntelligence.incrementalIndexer.queueDelta(uri, eventType);
        if (provider._logWatcherEvents) provider._logger?.debug?.(`Watcher event processed (${eventType}) for ${provider.describeFile(uri)} via ${source}`);
    } catch (e) {
        provider._logger?.debug?.('dispatchWatcherEvent fallback failed', e);
    }
}

// Heavy decoration helpers moved here to reduce core bundle
function buildSummaryTooltip(provider, { filePath, stat, badgeDetails }) {
    try {
        const chunk = tryLoadChunk('./decoration-formatters-chunk', './decorationFormatters', './decoration-formatters-chunk.js', './decorationFormatters.js', './decoration-helpers-chunk', './decorationHelpers', './decoration-helpers', './decoration-helpers-chunk.js', './decorationHelpers.js');
        if (chunk && typeof chunk.buildSummaryTooltip === 'function') return chunk.buildSummaryTooltip(provider, { filePath, stat, badgeDetails });
    } catch (e) { provider._logger?.debug?.('Delegated buildSummaryTooltip failed', e); }

    try {
        const parts = [];
        if (badgeDetails?.readableModified) parts.push(`Modified ${badgeDetails.readableModified}`);
        const sizeLabel = badgeDetails?.fileSizeLabel || (stat?.size ? provider._formatFileSize(stat.size, 'auto') : null);
        if (sizeLabel) parts.push(sizeLabel);
        const label = typeof provider.describeFile === 'function' ? provider.describeFile(filePath) : filePath;
        return `${label} — ${parts.filter(Boolean).join(' • ') || provider._formatFullDate(stat?.mtime || new Date())}`;
    } catch (error) {
        provider._logger?.debug?.('buildSummaryTooltip failed', error);
        const label = typeof provider.describeFile === 'function' ? provider.describeFile(filePath) : filePath;
        return `${label} — ${provider._formatFullDate(stat?.mtime || new Date())}`;
    }
}

function formatDateReadable(provider, date) {
    try {
        const chunk = tryLoadChunk('./decoration-formatters-chunk', './decorationFormatters', './decoration-formatters-chunk.js', './decorationFormatters.js', './decoration-helpers-chunk', './decorationHelpers', './decoration-helpers', './decoration-helpers-chunk.js', './decorationHelpers.js');
        if (chunk && typeof chunk.formatDateReadable === 'function') return chunk.formatDateReadable(provider, date);
    } catch (e) { provider._logger?.debug?.('Delegated formatDateReadable failed', e); }

    try {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const descriptor = provider._buildReadableDescriptor(date, now, diffMins, diffHours, diffDays);
        if (descriptor) {
            return provider._getFlyweightValue(provider._readableDateFlyweightCache, provider._readableDateFlyweightOrder, provider._readableDateFlyweightLimit, descriptor.key, descriptor.factory, provider._readableFlyweightStats);
        }
        if (date.getFullYear() === now.getFullYear()) return provider._l10n.formatDate(date, { month: 'short', day: 'numeric' });
        return provider._l10n.formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
        provider._logger?.debug?.('formatDateReadable failed', error);
        return provider._l10n.formatDate(date);
    }
}

async function getGitBlameInfo(provider, filePath, statMtimeMs = null) {
    if (env.DISABLE_GIT_FEATURES === '1' || provider._disableGitFeatures) return null;
    try {
        const gitManager = await featureFlags.gitInsights();
        if (!gitManager || typeof gitManager.getGitBlameInfo !== 'function') return null;
        return await gitManager.getGitBlameInfo(filePath, statMtimeMs);
    } catch (error) {
        provider._logger?.warn?.('Git blame lookup failed', { filePath, message: error?.message || String(error) });
        return null;
    }
}

async function findWorkspaceFilesWithTimeout(provider, maxResults) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./workspace-scan-chunk');
            if (chunk && typeof chunk.findWorkspaceFilesWithTimeout === 'function') return chunk.findWorkspaceFilesWithTimeout(provider, maxResults);
        }
    } catch (e) { provider._logger?.debug?.('Delegated findWorkspaceFilesWithTimeout failed', e); }
    // Minimal fallback: attempt a simple findFiles without timeout
    try { return require('vscode').workspace.findFiles('**/*', null, maxResults); } catch (e) { provider._logger?.warn?.('Workspace scan fallback failed', e); return null; }
} 

function startWorkspaceScanWatchdog(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./workspace-scan-chunk');
            if (chunk && typeof chunk.startWorkspaceScanWatchdog === 'function') return chunk.startWorkspaceScanWatchdog(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated startWorkspaceScanWatchdog failed', e); }
    // Minimal noop fallback
    return Promise.resolve();
} 

function clearWorkspaceScanWatchdog(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./workspace-scan-chunk');
            if (chunk && typeof chunk.clearWorkspaceScanWatchdog === 'function') return chunk.clearWorkspaceScanWatchdog(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated clearWorkspaceScanWatchdog failed', e); }
    if (provider._workspaceScanWatchdogTimer) {
        clearTimeout(provider._workspaceScanWatchdogTimer);
        provider._workspaceScanWatchdogTimer = null;
    }
} 

async function performWorkspaceSizeCheck(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./workspace-scan-chunk');
            if (chunk && typeof chunk.performWorkspaceSizeCheck === 'function') return chunk.performWorkspaceSizeCheck(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated performWorkspaceSizeCheck failed', e); }
    // Minimal fallback: quick file count
    try {
        const vscode = require('vscode');
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) return;
        provider._logger?.info?.('Checking workspace size (fallback, fast)');
        const files = await (vscode.workspace.findFiles ? vscode.workspace.findFiles('**/*', null, 1000) : []);
        const fileCount = Array.isArray(files) ? files.length : 0;
        provider._workspaceFileCount = fileCount;
        provider._workspaceScale = fileCount > 100000 ? 'extreme' : (fileCount > 10000 ? 'large' : 'normal');
        provider._applyFeatureLevel(provider._determineFeatureLevel(), 'workspace-scale-change-fallback');
    } catch (e) {
        provider._logger?.debug?.('performWorkspaceSizeCheck fallback failed', e);
    }
}


function getInitials(provider, fullName) {
    try {
        const chunk = tryLoadChunk('./decoration-formatters-chunk', './decorationFormatters', './decoration-formatters-chunk.js', './decorationFormatters.js', './decoration-helpers-chunk', './decorationHelpers', './decoration-helpers', './decoration-helpers-chunk.js', './decorationHelpers.js');
        if (chunk && typeof chunk.getInitials === 'function') return chunk.getInitials(provider, fullName);
    } catch (e) { provider._logger?.debug?.('Delegated getInitials failed', e); }

    if (provider._gitInsightsManager && typeof provider._gitInsightsManager.getInitials === 'function') {
        return provider._gitInsightsManager.getInitials(fullName);
    }
    if (!fullName || typeof fullName !== 'string') return null;
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || '')).substring(0, 2).toUpperCase();
}

function formatCompactSize(provider, bytes) {
    try {
        const chunk = tryLoadChunk('./decoration-formatters-chunk', './decorationFormatters', './decoration-formatters-chunk.js', './decorationFormatters.js', './decoration-helpers-chunk', './decorationHelpers', './decoration-helpers', './decoration-helpers-chunk.js', './decorationHelpers.js');
        if (chunk && typeof chunk.formatCompactSize === 'function') return chunk.formatCompactSize(provider, bytes);
    } catch (e) { provider._logger?.debug?.('Delegated formatCompactSize failed', e); }

    try {
        if (typeof bytes !== 'number' || isNaN(bytes)) return null;
        const units = ['B', 'K', 'M', 'G', 'T'];
        let i = 0; let val = bytes;
        while (val >= 1024 && i < units.length - 1) { val = val / 1024; i++; }
        const rounded = Math.round(val); const unit = units[i];
        if (rounded <= 9) return `${rounded}${unit}`;
        const s = String(rounded); if (s.length >= 2) return s.slice(0, 2);
        return s;
    } catch (error) {
        provider._logger?.debug?.('formatCompactSize failed', error);
        return null;
    }
}

function formatFullDate(provider, date) {
    try {
        const chunk = tryLoadChunk('./decoration-formatters-chunk', './decorationFormatters', './decoration-formatters-chunk.js', './decorationFormatters.js', './decoration-helpers-chunk', './decorationHelpers', './decoration-helpers', './decoration-helpers-chunk.js', './decorationHelpers.js');
        if (chunk && typeof chunk.formatFullDate === 'function') return chunk.formatFullDate(provider, date);
    } catch (e) { provider._logger?.debug?.('Delegated formatFullDate failed', e); }

    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
        return date.toLocaleString('en-US', options);
    } catch (error) {
        provider._logger?.debug?.('formatFullDate failed', error);
        return date.toString();
    }
}

function scheduleTelemetryReport(provider) {
    try {
        const chunk = tryLoadChunk('./decoration-telemetry-chunk', './decorationTelemetry', './decorationTelemetry.js', './decoration-telemetry-chunk.js');
        if (chunk && typeof chunk.scheduleTelemetryReport === 'function') return chunk.scheduleTelemetryReport(provider);
    } catch (e) { provider._logger?.debug?.('Delegated scheduleTelemetryReport failed', e); }

    if (!provider['_allocationTelemetryEnabled'] || provider['_telemetryReportTimer']) {
        return;
    }
    provider['_telemetryReportTimer'] = setTimeout(() => {
        provider['_telemetryReportTimer'] = null;
        reportAllocationTelemetry(provider);
        scheduleTelemetryReport(provider);
    }, provider['_telemetryReportInterval']);
}

function reportAllocationTelemetry(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-telemetry-chunk');
            if (chunk && typeof chunk.reportAllocationTelemetry === 'function') return chunk.reportAllocationTelemetry(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated reportAllocationTelemetry failed', e); }

    const telemetry = provider.getMetrics().allocationTelemetry;
    const totalAllocations = telemetry.decorationPool.allocations +
        telemetry.badgeFlyweight.allocations +
        telemetry.readableFlyweight.allocations;
    const totalReuses = telemetry.decorationPool.reuses +
        telemetry.badgeFlyweight.reuses +
        telemetry.readableFlyweight.reuses;

    if (totalAllocations > 0 || totalReuses > 0) {
        provider['_logger']?.info?.('🧮 Allocation telemetry report', {
            timestamp: new Date().toISOString(),
            pool: {
                allocations: telemetry.decorationPool.allocations,
                reuses: telemetry.decorationPool.reuses,
                reuseRate: telemetry.decorationPool.reusePercent + '%'
            },
            badgeFlyweight: {
                allocations: telemetry.badgeFlyweight.allocations,
                reuses: telemetry.badgeFlyweight.reuses,
                reuseRate: telemetry.badgeFlyweight.reusePercent + '%'
            },
            readableFlyweight: {
                allocations: telemetry.readableFlyweight.allocations,
                reuses: telemetry.readableFlyweight.reuses,
                reuseRate: telemetry.readableFlyweight.reusePercent + '%'
            },
            summary: {
                totalAllocations,
                totalReuses,
                overallReuseRate: totalAllocations + totalReuses > 0
                    ? ((totalReuses / (totalAllocations + totalReuses)) * 100).toFixed(1) + '%'
                    : '0%'
            },
            decorationsProcessed: provider['_metrics'].totalDecorations,
            cacheHitRate: provider.getMetrics().cacheHitRate
        });
    }
}

// Periodic refresh & memory/cache helpers moved here to allow advanced initialization
function setupPeriodicRefresh(provider) {
    try {
        const config = vscode.workspace.getConfiguration('explorerDates');
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
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-refresh-chunk');
            if (chunk && typeof chunk.cancelIncrementalRefreshTimers === 'function') return chunk.cancelIncrementalRefreshTimers(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated cancelIncrementalRefreshTimers failed', e); }

    // Minimal fallback
    if (!provider._incrementalRefreshTimers || provider._incrementalRefreshTimers.size === 0) return;
    for (const timer of provider._incrementalRefreshTimers) clearTimeout(timer);
    provider._incrementalRefreshTimers.clear();
    provider._incrementalRefreshInProgress = false;
} 

function scheduleIncrementalRefresh(provider, reason = 'manual') {
    try {
        // Defensive guard: if there is no usable in-memory cache, bail early with a global refresh
        if (!provider._decorationCache || typeof provider._decorationCache.entries !== 'function') {
            provider._logger?.debug?.('scheduleIncrementalRefresh: missing or invalid memory cache, firing global refresh');
            try { provider._onDidChangeFileDecorations.fire(undefined); } catch { }
            return;
        }

        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-refresh-chunk');
            if (chunk && typeof chunk.scheduleIncrementalRefresh === 'function') return chunk.scheduleIncrementalRefresh(provider, reason);
        }
    } catch (e) { provider._logger?.debug?.('Delegated scheduleIncrementalRefresh failed', e); }

    // Minimal fallback: trigger a global refresh
    provider._logger?.debug?.('scheduleIncrementalRefresh fallback invoked');
    try { provider._onDidChangeFileDecorations.fire(undefined); } catch { }
    return;
} 

/* eslint-disable-next-line no-unused-vars */
function markCacheEntryForRefresh(provider, cacheKey) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-refresh-chunk');
            if (chunk && typeof chunk.markCacheEntryForRefresh === 'function') return chunk.markCacheEntryForRefresh(provider, cacheKey);
        }
    } catch (e) { provider._logger?.debug?.('Delegated markCacheEntryForRefresh failed', e); }

    // Minimal fallback
    if (!cacheKey) return;
    // Defensive: guard cache access
    if (!provider._decorationCache || typeof provider._decorationCache.get !== 'function') {
        provider._logger?.debug?.('markCacheEntryForRefresh: no memory cache available, skipping');
    } else {
        const entry = provider._decorationCache.get(cacheKey);
        if (entry) {
            const ageMs = Date.now() - entry.timestamp;
            const isStale = ageMs > (provider._cacheTimeout * 0.75);
            if (isStale) entry.forceRefresh = true;
        }
    }
    if (provider._advancedCache) {
        try { provider._advancedCache.invalidateByPattern(cacheKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); } catch (error) { provider._logger?.debug?.(`Could not invalidate advanced cache for ${cacheKey}: ${error.message}`); }
} 

function maybeShedWorkload(provider) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-memory-chunk');
            if (chunk && typeof chunk.maybeShedWorkload === 'function') return chunk.maybeShedWorkload(provider);
        }
    } catch (e) { provider._logger?.debug?.('Delegated maybeShedWorkload failed', e); }

    try {
        if (!provider._memorySheddingEnabled || provider._memorySheddingActive) {
            return;
        }
        const current = (() => {
            try { return proc?.memoryUsage ? proc.memoryUsage().heapUsed / 1024 / 1024 : 0; } catch { return 0; }
        })();
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
            if (delta < provider._softHeapAlertThresholdMB * 0.5) {
                provider._softHeapAlertLogged = false;
            }
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
            setupPeriodicRefresh(provider);
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

async function togglePerformanceMode(provider, enabled, { reason = 'unspecified', refresh = true } = {}) {
    if (enabled === provider._performanceMode) return;
    provider._performanceMode = enabled;
    provider._logger?.info?.(`Performance mode ${enabled ? 'enabled' : 'disabled'} (${reason})`);

    if (enabled) {
        provider._disposeFileWatchers?.({ permanent: true });
        provider._logger?.info?.('File watchers disabled for performance mode');
        if (provider._refreshTimer) { clearInterval(provider._refreshTimer); provider._refreshTimer = null; provider._logger?.info?.('Periodic refresh disabled for performance mode'); }
    } else {
        try { provider._setupFileWatcher?.('performance-mode-toggle'); provider._logger?.info?.('File watchers enabled (performance mode off)'); } catch {}
        if (!provider._refreshTimer) { provider._setupPeriodicRefresh?.(); provider._logger?.info?.('Periodic refresh enabled (performance mode off)'); }
    }

    if (refresh) {
        try { provider.refreshAll?.({ reason: 'performance-mode-change' }); } catch (e) { provider._logger?.debug?.('refreshAll after performance toggle failed', e); }
    }

    if (enabled) {
        if (provider._workspaceIntelligence?.dispose) { provider._workspaceIntelligence.dispose(); provider._workspaceIntelligence = null; }
    } else if (!provider._workspaceIntelligence) {
        try {
            const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
            const featureFlagsGlobal = getFeatureFlagsGlobal();
            const WorkspaceIntelligenceModule = featureFlagsGlobal ? await featureFlagsGlobal.workspaceIntelligence() : null;
            if (WorkspaceIntelligenceModule) {
                const { WorkspaceIntelligenceManager } = WorkspaceIntelligenceModule;
                provider._workspaceIntelligence = new WorkspaceIntelligenceManager(provider._fileSystem);
                await provider._workspaceIntelligence.initialize({ batchProcessor: provider._batchProcessor, enableProgressiveAnalysis: provider._shouldEnableProgressiveAnalysis?.() });
                const workspaceFolders = require('vscode').workspace.workspaceFolders;
                if (workspaceFolders?.length) {
                    await provider._workspaceIntelligence.analyzeWorkspace(workspaceFolders, { maxFiles: provider._getIndexerMaxFiles?.() });
                }
            }
        } catch (error) {
            provider._logger?.debug?.('Workspace intelligence reinitialization failed after performance mode toggle', error);
        }
    }
}

function applyPerformanceProfile(provider, profile, reason = 'unspecified') {
    try {
        const featureLevel = profile?.level || provider._featureLevel;
        provider._performanceModeAuto = false;
        const desiredPerformanceMode = computeEffectivePerformanceMode(provider);
        if (desiredPerformanceMode !== provider._performanceMode) {
            provider._logger?.debug?.('Auto performance mode update', { reason, featureLevel, workspaceScale: provider._workspaceScale, desiredPerformanceMode });
            togglePerformanceMode(provider, desiredPerformanceMode, { reason: `${reason}-auto`, refresh: true }).catch((error) => provider._logger?.debug?.('Failed to toggle performance mode automatically', error));
        }
        applyConcurrencyLimit(provider, reason);
        if (!provider._performanceMode && (provider._workspaceScale === 'large' || provider._workspaceScale === 'extreme')) {
            const adjustedProfile = { ...provider._featureProfile, applyBackgroundLimits: true, backgroundTooltipMode: provider._featureProfile?.backgroundTooltipMode === 'rich' ? 'summary' : provider._featureProfile?.backgroundTooltipMode };
            provider._featureProfile = adjustedProfile;
        }
        if (!provider._performanceMode) {
            const targetRefresh = getRefreshIntervalForScale(provider);
            const needsUpdate = targetRefresh !== null && targetRefresh !== provider._refreshIntervalOverride;
            const shouldClearOverride = targetRefresh === null && provider._refreshIntervalOverride !== null;
            if (needsUpdate) { provider._refreshIntervalOverride = targetRefresh; provider._setupPeriodicRefresh?.(); }
            else if (shouldClearOverride) { provider._refreshIntervalOverride = null; provider._setupPeriodicRefresh?.(); }
        }
    } catch (error) {
        provider._logger?.debug?.('applyPerformanceProfile failed', error);
    }
}

function getRefreshIntervalForScale(provider) {
    if (provider._workspaceScale === 'extreme') return 600000; // 10 minutes
    if (provider._workspaceScale === 'large') return 180000; // 3 minutes
    return null;
}

function getSmartWatcherDefaults() {
    try {
        const s = require('./decorations-static');
        return { DEFAULT_SMART_WATCHER_EXTENSIONS: s.DEFAULT_SMART_WATCHER_EXTENSIONS, SMART_WATCHER_PRIORITY: s.SMART_WATCHER_PRIORITY };
    } catch {
        // Fallback to compact inlined defaults
        return {
            DEFAULT_SMART_WATCHER_EXTENSIONS: ['js','ts','json','md','py','java'],
            SMART_WATCHER_PRIORITY: new Map([['src', 100], ['lib', 65], ['test', 30]])
        };
    }
}

function computeEffectivePerformanceMode(provider) {
    if (provider._performanceModeExplicit === true) return true;
    if (provider._performanceModeExplicit === false) return false;
    // Auto-enable for extreme/hard workspaces or when explicit heuristics apply
    if (provider._workspaceScale === 'extreme') return true;
    return false;
}

function applyConcurrencyLimit(provider, reason = 'unspecified') {
    const previous = provider._maxConcurrentOperations;
    const target = provider._getScaleConcurrencyLimit ? provider._getScaleConcurrencyLimit() : (provider._maxConcurrentOperationsBase || 8);
    provider._maxConcurrentOperations = Math.max(1, Math.min(target, provider._maxConcurrentOperationsBase || 8));
    provider._logger?.info?.(`Adjusted concurrency cap ${previous} -> ${provider._maxConcurrentOperations} (${reason})`, { workspaceScale: provider._workspaceScale, performanceMode: provider._performanceMode });
}

function _buildFeatureProfile(provider, level = 'full') {
    const normalized = FEATURE_LEVELS.includes(level) ? level : 'full';
    switch (normalized) {
        case 'enhanced':
            return {
                level: normalized,
                enableGit: true,
                enableProgressiveAnalysis: true,
                applyBackgroundLimits: false,
                backgroundTooltipMode: 'rich',
                viewportWindowMs: 60000
            };
        case 'standard':
            return {
                level: normalized,
                enableGit: true,
                enableProgressiveAnalysis: false,
                applyBackgroundLimits: true,
                backgroundTooltipMode: 'summary',
                viewportWindowMs: 480000
            };
        case 'minimal':
            return {
                level: normalized,
                enableGit: false,
                enableProgressiveAnalysis: false,
                applyBackgroundLimits: true,
                backgroundTooltipMode: 'summary',
                viewportWindowMs: 120000
            };
        default:
            return {
                level: normalized,
                enableGit: true,
                enableProgressiveAnalysis: false,
                applyBackgroundLimits: false,
                backgroundTooltipMode: 'rich',
                viewportWindowMs: 300000
            };
    }
}

function applyFeatureLevel(provider, nextLevel, reason = 'unspecified') {
    if (!nextLevel) return false;
    if (!FEATURE_LEVELS.includes(nextLevel)) nextLevel = 'full';
    const levelChanged = provider._featureLevel !== nextLevel || !provider._featureProfile;
    provider._featureLevel = nextLevel;
    const profile = levelChanged ? _buildFeatureProfile(provider, nextLevel) : provider._featureProfile || _buildFeatureProfile(provider, nextLevel);
    provider._featureProfile = profile;
    provider._viewportWindowMs = profile.viewportWindowMs;
    if (levelChanged) {
        provider._logger?.info?.(`Feature level set to "${nextLevel}" (${reason})`, { viewportWindowMs: provider._viewportWindowMs, applyBackgroundLimits: profile.applyBackgroundLimits, backgroundTooltipMode: profile.backgroundTooltipMode });
    }

    if (provider._performanceMode) {
        provider._logger?.info?.('Performance mode active - skipping feature profile application');
    } else {
        if (profile.applyBackgroundLimits) provider._applyConcurrencyLimit?.(reason);
        if (profile.backgroundTooltipMode) provider._logger?.info?.('Configuring background tooltip behavior as part of feature profile', { mode: profile.backgroundTooltipMode });
        if (profile.enableProgressiveAnalysis) provider._logger?.info?.('Progressive analysis enabled by feature profile');
    }

    return levelChanged;
}

function maybePurgeLightweightCaches(provider) {
    try {
        if (!provider._lightweightMode) return;
        if (provider._lightweightPurgeInterval <= 0) { purgeLightweightCaches(provider, 'lightweight-interval'); return; }
        const total = provider._metrics?.totalDecorations || 0;
        if (total > 0 && total % provider._lightweightPurgeInterval === 0) purgeLightweightCaches(provider, 'lightweight-interval');
    } catch (error) {
        provider._logger?.debug?.('maybePurgeLightweightCaches failed', error);
    }
}

// --- Decoration pool & flyweight helper delegations (moved to lazy chunk) ---
function _getFlyweightValueImpl(cache, order, limit, key, factory, statsTracker) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-pool-chunk');
            if (chunk && typeof chunk._getFlyweightValueImpl === 'function') return chunk._getFlyweightValueImpl(cache, order, limit, key, factory, statsTracker);
        }
    } catch { /* ignore and fallback */ }
    // Fallback: minimal behavior
    try { return factory(); } catch { return null; }
}

function acquireDecorationFromPoolImpl({ badge, tooltip, color }, createFileDecoration) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-pool-chunk');
            if (chunk && typeof chunk.acquireDecorationFromPoolImpl === 'function') return chunk.acquireDecorationFromPoolImpl({ badge, tooltip, color }, createFileDecoration);
        }
    } catch { /* ignore and fallback */ }

    // Fallback: very small behavior
    return createFileDecoration(badge || '??');
}

function _trimFlyweightCacheToLimitImpl(cache, order, maxSize) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-pool-chunk');
            if (chunk && typeof chunk._trimFlyweightCacheToLimitImpl === 'function') return chunk._trimFlyweightCacheToLimitImpl(cache, order, maxSize);
        }
    } catch { /* ignore and fallback */ }
    // Fallback: noop
}

function clearDecorationPoolImpl(provider, reason = 'unspecified') {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-pool-chunk');
            if (chunk && typeof chunk.clearDecorationPoolImpl === 'function') return chunk.clearDecorationPoolImpl(provider, reason);
        }
    } catch { /* ignore and fallback */ }
    try { if (provider._decorationPool?.size) { provider._decorationPool.clear(); provider._decorationPoolOrder.length = 0; } } catch { /* ignore */ }
}

function checkMemoryPressure(provider) {
    try {
        const now = Date.now();
        if (!provider._lastMemoryCheck) provider._lastMemoryCheck = now;
        if (now - provider._lastMemoryCheck < 30000) return; // 30 seconds
        provider._lastMemoryCheck = now;
        const cacheSize = provider._decorationCache.size || 0;
        const maxSize = 10000;
        const pressure = cacheSize / maxSize;
        if (pressure > 0.8) {
            provider._logger?.warn?.('🧠 Memory pressure detected, performing cleanup', { cacheSize, maxSize });
            purgeLightweightCaches(provider, 'memory-pressure');
            provider._metrics.cachePressureEvents = (provider._metrics.cachePressureEvents || 0) + 1;
        }
    } catch (error) {
        provider._logger?.debug?.('checkMemoryPressure failed', error);
    }
}

// Provide a lazily-hydrating hierarchical cache implementation that can be
// replaced at runtime by a chunk-provided implementation. Exported so chunks
// can create the same cache type when needed.
function createLazyHierarchicalDecorationCache() {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./decoration-cache-chunk');
            if (chunk && typeof chunk.createLazyHierarchicalDecorationCache === 'function') return chunk.createLazyHierarchicalDecorationCache();
        }
    } catch { /* ignore and fallback */ }

    // Fallback lightweight implementation
    class SimpleFallbackCache {
        constructor() { this._map = new Map(); }
        get size() { return this._map.size; }
        clear() { this._map.clear(); }
        get(k) { return this._map.get(k); }
        set(k, v) { this._map.set(k, v); }
        delete(k) { return this._map.delete(k); }
        *entries() { yield* this._map.entries(); }
        hydrateInBackground() { /* noop */ }
        enforceLimit() { return 0; }
    }

    return new SimpleFallbackCache();
}

module.exports = {
    applyProgressiveLoadingSetting,
    cancelProgressiveWarmupJobs,
    createFallbackWatcher,
    createWatcherWithFallback,
    initializeAdvancedSystems,
    loadBatchProcessorIfNeeded,
    reportAllocationTelemetry,
    scheduleTelemetryReport,
    // New exports
    setupPeriodicRefresh,
    scheduleIncrementalRefresh,
    cancelIncrementalRefreshTimers,
    markCacheEntryForRefresh,
    maybeShedWorkload,
    monitorCachePressure,
    purgeLightweightCaches,
    maybePurgeLightweightCaches,
    checkMemoryPressure,
    getCachedDecoration,
    storeDecorationInCache,
    // New helpers
    buildSummaryTooltip,
    formatDateReadable,
    getGitBlameInfo,
    getInitials,
    formatCompactSize,
    formatFullDate,
    // Performance & workspace helpers
    togglePerformanceMode,
    applyPerformanceProfile,
    getRefreshIntervalForScale,
    computeEffectivePerformanceMode,
    applyConcurrencyLimit,
    // Workspace scan helpers
    findWorkspaceFilesWithTimeout,
    startWorkspaceScanWatchdog,
    clearWorkspaceScanWatchdog,
    performWorkspaceSizeCheck,
    applyFeatureLevel,
    _buildFeatureProfile,
    // Smart watcher defaults & cache factory
    getSmartWatcherDefaults,
    createLazyHierarchicalDecorationCache,
    // Decoration pool & flyweight helpers
    _getFlyweightValueImpl,
    acquireDecorationFromPoolImpl,
    _trimFlyweightCacheToLimitImpl,
    clearDecorationPoolImpl,
    // Preload orchestration
    deferPreloads,
    // Watcher manager helpers
    ensureWatcherManager,
    setupFileWatcher,
    registerWatcherHandlers,
    dispatchWatcherEvent
};
}
