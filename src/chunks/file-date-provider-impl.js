/* eslint-disable no-unused-vars */
const vscode = require('vscode');
const { fileSystem } = require('../filesystem/FileSystemAdapter');
const { formatFileSize } = require('../utils/formatters');
const { getSettingsCoordinator } = require('../utils/settingsCoordinator');
const { SecurityValidator, SecureFileOperations, detectSecurityEnvironment } = require('../utils/securityUtils');
const {
    DEFAULT_CACHE_TIMEOUT,
    DEFAULT_MAX_CACHE_SIZE,
    GLOBAL_STATE_KEYS,
    DEFAULT_DECORATION_POOL_SIZE,
    DEFAULT_FLYWEIGHT_CACHE_SIZE,
    WORKSPACE_SCALE_EXTREME_THRESHOLD
} = require('../constants');
const { isWebEnvironment } = require('../utils/env');
const {
    isWebDiagnosticsEnabled,
    diagLogOnce,
    recordProviderEvent,
    recordDecorationCall,
    recordRefreshCall
} = require('../utils/webDiagnostics');
const {
    resolveFreshness,
    compareFreshness
} = require('../utils/freshnessResolver');
const env = (typeof process !== 'undefined' && process.env) ? process.env : {};

// Local defaults that are present in the main provider module —
// re-declare here so the implementation chunk is self-contained.
const VIEWPORT_DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_VIEWPORT_HISTORY_LIMIT = Number(env.EXPLORER_DATES_VIEWPORT_HISTORY_LIMIT || 400);
const DEFAULT_SECURITY_MAX_WARNINGS = Number(env.EXPLORER_DATES_SECURITY_MAX_WARNINGS_PER_FILE ?? 1);
// Recognized feature level profiles (keeps parity with the proxy and decorations-advanced)
const FEATURE_LEVELS = ['full', 'enhanced', 'standard', 'minimal'];

// Local fallback priority map for smart-watcher heuristics (keeps parity with main provider)
const SMART_WATCHER_PRIORITY = new Map([[ 'src', 100 ], [ 'lib', 65 ], [ 'test', 30 ]]);

function getAdaptiveColorsFallback() {
    try {
        const kind = vscode?.window?.activeColorTheme?.kind;
        const isHighContrast = kind === vscode.ColorThemeKind.HighContrast;
        const isLight = kind === vscode.ColorThemeKind.Light;

        if (isHighContrast) {
            return {
                veryRecent: new vscode.ThemeColor('list.highlightForeground'),
                recent: new vscode.ThemeColor('list.warningForeground'),
                old: new vscode.ThemeColor('list.errorForeground'),
                javascript: new vscode.ThemeColor('list.highlightForeground'),
                css: new vscode.ThemeColor('list.warningForeground'),
                html: new vscode.ThemeColor('list.errorForeground'),
                json: new vscode.ThemeColor('list.highlightForeground'),
                markdown: new vscode.ThemeColor('list.warningForeground'),
                python: new vscode.ThemeColor('list.errorForeground'),
                subtle: new vscode.ThemeColor('list.highlightForeground'),
                muted: new vscode.ThemeColor('list.inactiveSelectionForeground'),
                emphasis: new vscode.ThemeColor('list.focusHighlightForeground')
            };
        }

        if (isLight) {
            return {
                veryRecent: new vscode.ThemeColor('list.highlightForeground'),
                recent: new vscode.ThemeColor('list.warningForeground'),
                old: new vscode.ThemeColor('list.errorForeground'),
                javascript: new vscode.ThemeColor('symbolIcon.functionForeground'),
                css: new vscode.ThemeColor('symbolIcon.colorForeground'),
                html: new vscode.ThemeColor('symbolIcon.snippetForeground'),
                json: new vscode.ThemeColor('symbolIcon.stringForeground'),
                markdown: new vscode.ThemeColor('symbolIcon.textForeground'),
                python: new vscode.ThemeColor('symbolIcon.classForeground'),
                subtle: new vscode.ThemeColor('list.inactiveSelectionForeground'),
                muted: new vscode.ThemeColor('list.deemphasizedForeground'),
                emphasis: new vscode.ThemeColor('list.highlightForeground')
            };
        }

        return {
            veryRecent: new vscode.ThemeColor('list.highlightForeground'),
            recent: new vscode.ThemeColor('charts.yellow'),
            old: new vscode.ThemeColor('charts.red'),
            javascript: new vscode.ThemeColor('symbolIcon.functionForeground'),
            css: new vscode.ThemeColor('charts.purple'),
            html: new vscode.ThemeColor('charts.orange'),
            json: new vscode.ThemeColor('symbolIcon.stringForeground'),
            markdown: new vscode.ThemeColor('charts.yellow'),
            python: new vscode.ThemeColor('symbolIcon.classForeground'),
            subtle: new vscode.ThemeColor('list.inactiveSelectionForeground'),
            muted: new vscode.ThemeColor('list.deemphasizedForeground'),
            emphasis: new vscode.ThemeColor('list.highlightForeground')
        };
    } catch {
        return null;
    }
}

function getFileTypeColorFallback(filePath, colors) {
    if (!colors || !filePath) return null;
    const ext = getExtension(filePath);
    if (['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(ext)) return colors.javascript;
    if (['.css', '.scss', '.sass', '.less', '.stylus'].includes(ext)) return colors.css;
    if (['.html', '.htm', '.xml', '.svg'].includes(ext)) return colors.html;
    if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return colors.json;
    if (['.md', '.markdown', '.txt', '.rst'].includes(ext)) return colors.markdown;
    if (['.py', '.pyx', '.pyi'].includes(ext)) return colors.python;
    return null;
}

let getFileName = (p) => {
    try {
        const s = String(p || '');
        const normalized = s.replace(/\\/g, '/');
        const idx = normalized.lastIndexOf('/');
        return idx === -1 ? normalized : normalized.substring(idx + 1);
    } catch { return 'unknown'; }
};
let getExtension = (p) => {
    try { const name = String(p || ''); const dotIndex = name.lastIndexOf('.'); return dotIndex <= 0 ? '' : name.substring(dotIndex).toLowerCase(); } catch { return ''; }
};
let buildCacheKey = (p) => String(p || '').toLowerCase().replace(/\\/g, '/');
let normalizePath = (input) => String(input || '').replace(/\\/g, '/');
let getUriPath = (target = '') => {
    if (!target) return '';
    if (typeof target === 'string') return target;
    if (typeof target.fsPath === 'string' && target.fsPath.length > 0) return target.fsPath;
    if (typeof target.path === 'string' && target.path.length > 0) return target.path;
    if (typeof target.toString === 'function') { try { return target.toString(true); } catch { return target.toString(); } }
    return String(target);
};

let describeFile = (input = '') => {
    try {
        const pathValue = typeof input === 'string' ? input : getUriPath(input);
        const normalized = normalizePath(pathValue);
        return getFileName(normalized) || normalized || 'unknown';
    } catch { return 'unknown'; }
};

class LazyHierarchicalDecorationCache {
    constructor() {
        this._proxy = null;
        this._fallback = new Map();
        (async () => {
            try {
                const chunk = await import('./decoration-cache-chunk.js');
                if (chunk && typeof chunk.createLazyHierarchicalDecorationCache === 'function') {
                    const real = chunk.createLazyHierarchicalDecorationCache();
                    for (const [k, v] of this._fallback.entries()) real.set(k, v);
                    this._proxy = real;
                    this._fallback = null;
                }
            } catch {}
        })();
    }
    get size() { return this._proxy ? this._proxy.size : this._fallback.size; }
    get bucketCount() { return this._proxy ? this._proxy.bucketCount : 0; }
    clear() { if (this._proxy) return this._proxy.clear(); this._fallback.clear(); }
    get(key) { return this._proxy ? this._proxy.get(key) : this._fallback.get(key); }
    set(key, value, options = {}) { if (this._proxy) return this._proxy.set(key, value, options); this._fallback.set(key, value); }
    delete(key) { if (this._proxy) return this._proxy.delete(key); return this._fallback.delete(key); }
    *entries() { if (this._proxy) { yield* this._proxy.entries(); return; } yield* this._fallback.entries(); }
    *keys() { if (this._proxy) { yield* this._proxy.keys(); return; } yield* this._fallback.keys(); }
    *values() { if (this._proxy) { yield* this._proxy.values(); return; } yield* this._fallback.values(); }
    [Symbol.iterator]() { return this.entries(); }
    enforceLimit(maxSize = 0) { if (this._proxy) return this._proxy.enforceLimit(maxSize); if (!maxSize || this._fallback.size <= maxSize) return 0; let removed = 0; const keys = Array.from(this._fallback.keys()); const toRemove = keys.slice(0, Math.max(1, Math.ceil(this._fallback.size - maxSize))); for (const k of toRemove) { this._fallback.delete(k); removed++; } return removed; }
}

const isWebBuild = env.VSCODE_WEB === 'true';

class FileDateDecorationProviderImpl {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        this._decorationCache = new LazyHierarchicalDecorationCache();
        this._fileLocks = new Map();
        this._operationQueue = new Map();
        this._globalConcurrencyQueue = [];
        this._maxConcurrentOperationsBase = 20;
        this._maxConcurrentOperations = this._maxConcurrentOperationsBase;
        this._activeOperations = 0;
        this._disposed = false;
        this._disposedNoticeLogged = false;
        this._decorationPool = new Map();
        this._decorationPoolOrder = [];
        this._decorationPoolStats = { hits: 0, misses: 0, allocations: 0, reuses: 0 };
        this._maxDecorationPoolSize = DEFAULT_DECORATION_POOL_SIZE;
        this._badgeFlyweightCache = new Map();
        this._badgeFlyweightOrder = [];
        this._badgeFlyweightLimit = DEFAULT_FLYWEIGHT_CACHE_SIZE;
        this._badgeFlyweightStats = { hits: 0, misses: 0, allocations: 0, reuses: 0 };
        this._readableDateFlyweightCache = new Map();
        this._readableDateFlyweightOrder = [];
        this._readableDateFlyweightLimit = DEFAULT_FLYWEIGHT_CACHE_SIZE;
        this._readableFlyweightStats = { hits: 0, misses: 0, allocations: 0, reuses: 0 };
        this._enableDecorationPool = env.EXPLORER_DATES_ENABLE_DECORATION_POOL !== '0';
        this._enableFlyweights = env.EXPLORER_DATES_ENABLE_FLYWEIGHTS !== '0';
        this._lightweightMode = env.EXPLORER_DATES_LIGHTWEIGHT_MODE === '1';
        // Performance mode flag (defaults to false in this minimal implementation)
        this._performanceMode = false;
        // Align initial performanceMode with workspace configuration when available
        try {
            const cfg = (vscode.workspace.getConfiguration)('explorerDates');
            this._performanceMode = !!cfg.get('performanceMode', this._performanceMode);
        } catch (e) { /* ignore config read errors */ }
        this._memorySheddingEnabled = env.EXPLORER_DATES_MEMORY_SHEDDING === '1';
        this._memorySheddingThresholdMB = Number(env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB || 3);
        this._memorySheddingActive = false;
        this._memoryBaselineMB = this._memorySheddingEnabled ? this._safeHeapUsedMB() : 0;
        this._memoryShedCacheLimit = Number(env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT || 1000);
        this._memoryShedRefreshIntervalMs = Number(env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS || 60000);
        this._refreshIntervalOverride = null;
        // Periodic refresh / incremental refresh bookkeeping
        this._refreshInterval = null;
        this._refreshTimer = null;                 // explicitly null when no timer is running
        this._incrementalRefreshTimers = new Set();
        this._incrementalRefreshInProgress = false;
        this._scheduledRefreshPending = false;

        this._forceCacheBypass = env.EXPLORER_DATES_FORCE_CACHE_BYPASS === '1';
        this._lightweightPurgeInterval = Number(env.EXPLORER_DATES_LIGHTWEIGHT_PURGE_INTERVAL || 400);
        this._isWeb = isWebBuild || isWebEnvironment();
        if (isWebDiagnosticsEnabled()) {
            diagLogOnce('provider-impl-constructed', 'info', 'Provider implementation constructed', { isWeb: this._isWeb });
            recordProviderEvent('created', { source: 'impl', isWeb: this._isWeb });
        }
        this._baselineDesktopCacheTimeout = DEFAULT_CACHE_TIMEOUT * 4;
        this._maxDesktopCacheTimeout = this._baselineDesktopCacheTimeout;
        this._lastCacheTimeoutBoostLookups = 0;
        this._maxCacheSize = DEFAULT_MAX_CACHE_SIZE;
        // Cache timeout (ms) — prefer configured value, fallback to DEFAULT_CACHE_TIMEOUT
        try { const cfg = vscode.workspace.getConfiguration('explorerDates'); this._cacheTimeout = Number(cfg.get('cacheTimeout', DEFAULT_CACHE_TIMEOUT)); } catch { this._cacheTimeout = DEFAULT_CACHE_TIMEOUT; }

        // Max cache size may be configured via workspace settings; respect it at startup
        try { const cfg2 = vscode.workspace.getConfiguration('explorerDates'); this._maxCacheSize = Number(cfg2.get('maxCacheSize', DEFAULT_MAX_CACHE_SIZE)) || DEFAULT_MAX_CACHE_SIZE; } catch { this._maxCacheSize = DEFAULT_MAX_CACHE_SIZE; }
        this._fileSystem = fileSystem;
        this._gitAvailable = !this._isWeb;
        this._gitWarningShown = false;
        this._gitInsightsManager = null;
        this._gitInsightsLoading = null;
        this._gitRecencyCache = new Map();
        this._gitRecencyCacheTtlMs = 60000;
        this._gitRecencyCacheMax = 1000;
        this._freshnessCache = new Map();
        this._freshnessCacheTtlMs = Number(env.EXPLORER_DATES_FRESHNESS_CACHE_TTL_MS || 60000);
        this._freshnessCacheMax = Number(env.EXPLORER_DATES_FRESHNESS_CACHE_MAX || 2000);

        try { this._instanceId = Math.random().toString(36).slice(2, 8); this._logger.debug(`FileDateDecorationProvider created (id=${this._instanceId})`); } catch {}
        this._exportReportingManager = null;
        this._exportReportingLoading = null;
        this._workspaceTemplatesManager = null;
        this._workspaceTemplatesLoading = null;
        const settingsCoordinator = getSettingsCoordinator();
        const configTelemetry = settingsCoordinator?.getValue && settingsCoordinator.getValue('enableTelemetry');
        this._allocationTelemetryEnabled = env.NODE_ENV === 'development' || env.EXPLORER_DATES_TELEMETRY === '1' || configTelemetry === true;
        this._telemetryReportInterval = Number(env.EXPLORER_DATES_TELEMETRY_INTERVAL_MS || 60000);
        this._telemetryReportTimer = null;
        this._cacheNamespace = null;
        this._cacheKeyStats = new Map();
        this._viewportVisibleFiles = new Set();
        this._viewportRecentFiles = new Map();
        this._viewportHistoryLimit = DEFAULT_VIEWPORT_HISTORY_LIMIT;
        this._viewportWindowMs = 5 * 60 * 1000;
        this._lastViewportCleanup = Date.now();
        this._viewportDisposables = [];
        this._viewportManager = null;
        this._viewportManagerLoading = null;

        // Seed visible viewport files from VS Code's visibleTextEditors if present
        // (fallback for test harnesses that don't load the viewport chunk).
        try {
            const editors = Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : [];
            for (const ed of editors) {
                const p = (ed?.document?.uri?.fsPath || ed?.document?.uri?.path || '');
                if (p) this._viewportVisibleFiles.add(String(p).replace(/\\/g, '/'));
            }
            const active = vscode.window?.activeTextEditor?.document?.uri;
            if (active) {
                const ap = (active.fsPath || active.path || '');
                if (ap) this._viewportVisibleFiles.add(String(ap).replace(/\\/g, '/'));
            }
        } catch (e) { /* best-effort */ }
        this._featureLevel = 'full';
        this._featureProfile = null;
        this._logger = (require('../utils/logger').getLogger)();
        this._l10n = { getString: (k) => k, formatDate: (d) => (d instanceof Date ? d.toString() : String(d)), getCurrentLocale: () => 'en', dispose: () => {} };
        // Basic runtime metrics used by telemetry and diagnostics
        this._metrics = {
            totalDecorations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            fileStatTimeMs: 0,
            fileStatCalls: 0,
            gitBlameTimeMs: 0,
            gitBlameCalls: 0,
            viewportPriorityDecorations: 0,
            viewportBackgroundDecorations: 0
        };

        (async () => {
            try {
                const mod = await import('./provider-init-chunk.js');
                if (mod && typeof mod.hydrateProviderOptionalSystems === 'function') {
                    await mod.hydrateProviderOptionalSystems(this);
                }
            } catch (e) { this._logger.debug('Failed to run provider initialization chunk', e); }
        })();

        this._workspaceIntelligence = null;
        this._batchProcessor = null;
        this._batchProcessorModule = null;
        this._progressiveLoadingJobs = new Set();
        this._progressiveLoadingEnabled = false;
        this._decorationsAdvancedChunk = null;
        this._decorationsAdvancedChunkPromise = null;
        this._advancedCache = null;
        this._configurationWatcher = null;
        this._fileWatchers = new Set();
        this._fileWatcher = undefined;
        this._dynamicWatchers = new Map();
        this._watcherDisposables = [];
        this._watcherCleanupTimer = null;
        this._smartWatcherEnabled = true;
        this._enableWatcherFallbacks = 'auto';
        this._smartWatcherFallbackManager = null;
        this._smartWatcherSetupPromise = null;
        this._activeWatcherStrategy = 'none';
        this._watcherEventDebounce = new Map();
        this._gitHeadWatcherInitialized = false;
        this._gitHeadWatchDisposables = [];
        this._workspaceFileCount = null;
        this._workspaceScale = 'unknown';
        this._logWatcherEvents = env.EXPLORER_DATES_LOG_WATCHERS === '1';
        this._securityEnvironment = detectSecurityEnvironment();
        this._securityEnforceWorkspaceBoundaries = true;
        this._securityAllowedExtraPaths = [];
        this._securityAllowTestPaths = true;
        this._securityRelaxedForTests = false;
        this._securityLoggedTestRelaxation = false;
        this._securityWarningLog = new Map();
        this._securityLogThrottleMs = Number(env.EXPLORER_DATES_SECURITY_WARNING_THROTTLE_MS || 5000);
        this._securityMaxWarningsPerFile = Number.isFinite(DEFAULT_SECURITY_MAX_WARNINGS) ? Math.max(0, DEFAULT_SECURITY_MAX_WARNINGS) : 1;
        this._workspaceFolderListener = typeof vscode.workspace.onDidChangeWorkspaceFolders === 'function' ? vscode.workspace.onDidChangeWorkspaceFolders((event) => this._handleWorkspaceFoldersChanged(event)) : null;
        this._workspaceFolderChangeTimer = null;
        this._workspaceSizeCheckPromise = null;
        this._workspaceScanPromise = null;
        this._workspaceScanWatchdogTimer = null;
        this._workspaceScanTimedOut = false;
        this._watcherSetupToken = 0;
        this._isDisposed = false;

        // Accessibility manager (may be provided by UI adapters chunk) — initialize
        // explicitly to `null` so tests can assert a defined value when disabled.
        this._accessibility = null;

        // Initialize UI-related contexts from configuration so `when`-clauses in
        // package.json evaluate correctly during startup (tests rely on this).
        try {
            const config = (vscode.workspace.getConfiguration)('explorerDates');
            const enableContextMenu = !!config.get('enableContextMenu', true);
            const showStatusBar = !!config.get('showStatusBar', false);
            const showWelcomeOnStartup = !!config.get('showWelcomeOnStartup', true);
            const enableExtensionApi = !!config.get('enableExtensionApi', true);

            // setContext may be async; we don't await it here but allow errors to be logged
            try { vscode.commands.executeCommand('setContext', 'explorerDates.enableContextMenu', enableContextMenu).catch(() => {}); } catch (e) {}
            try { vscode.commands.executeCommand('setContext', 'explorerDates.showStatusBar', showStatusBar).catch(() => {}); } catch (e) {}
            try { vscode.commands.executeCommand('setContext', 'explorerDates.showWelcomeOnStartup', showWelcomeOnStartup).catch(() => {}); } catch (e) {}
            try { vscode.commands.executeCommand('setContext', 'explorerDates.enableExtensionApi', enableExtensionApi).catch(() => {}); } catch (e) {}
        } catch (e) {
            this._logger?.debug && this._logger.debug('Failed to initialize UI contexts', e);
        }

        // Register configuration watcher to respond to runtime setting changes (performanceMode, refresh interval, etc.)
        try {
            if (typeof vscode.workspace.onDidChangeConfiguration === 'function') {
                this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
                    try {
                        if (!event || typeof event.affectsConfiguration !== 'function') return;
                        if (!event.affectsConfiguration('explorerDates')) return;
                        const cfg = vscode.workspace.getConfiguration('explorerDates');
                        const newPerf = !!cfg.get('performanceMode', false);

                        // Apply synchronously so tests and callers observe immediate state change
                        try {
                            const prev = this._performanceMode;
                            this._performanceMode = newPerf;
                            if (newPerf) {
                                this._disposeFileWatchers?.({ permanent: true });
                                if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; }
                            } else if (!newPerf && prev) {
                                this._setupFileWatcher?.('runtime-config-change');
                                if (!this._refreshTimer) this._setupPeriodicRefresh?.();
                            }
                        } catch (err) { this._logger?.debug?.('sync performance-mode toggle failed', err); }

                        // Also attempt to delegate to the advanced chunk asynchronously (best-effort)
                        (async () => {
                            try {
                                const adv = await this._getDecorationsAdvancedChunk();
                                if (adv && typeof adv.togglePerformanceMode === 'function') {
                                    await adv.togglePerformanceMode(this, newPerf, { reason: 'runtime-config-change', refresh: true });
                                }
                            } catch (err) { this._logger?.debug?.('delegated togglePerformanceMode failed', err); }
                        })();

                        // Update UI-related `setContext` values when relevant explorerDates keys change
                        try {
                            const uiKeys = [
                                'explorerDates.enableContextMenu',
                                'explorerDates.showStatusBar',
                                'explorerDates.showWelcomeOnStartup',
                                'explorerDates.enableExtensionApi'
                            ];
                            const shouldUpdateContext = uiKeys.some(k => event.affectsConfiguration && event.affectsConfiguration(k));
                            if (shouldUpdateContext) {
                                try {
                                    const cfg = vscode.workspace.getConfiguration('explorerDates');
                                    const enableContextMenu = !!cfg.get('enableContextMenu', true);
                                    const showStatusBar = !!cfg.get('showStatusBar', false);
                                    const showWelcomeOnStartup = !!cfg.get('showWelcomeOnStartup', true);
                                    const enableExtensionApi = !!cfg.get('enableExtensionApi', true);

                                    try { vscode.commands.executeCommand('setContext', 'explorerDates.enableContextMenu', enableContextMenu).catch(() => {}); } catch (e) {}
                                    try { vscode.commands.executeCommand('setContext', 'explorerDates.showStatusBar', showStatusBar).catch(() => {}); } catch (e) {}
                                    try { vscode.commands.executeCommand('setContext', 'explorerDates.showWelcomeOnStartup', showWelcomeOnStartup).catch(() => {}); } catch (e) {}
                                    try { vscode.commands.executeCommand('setContext', 'explorerDates.enableExtensionApi', enableExtensionApi).catch(() => {}); } catch (e) {}
                                } catch (err) {
                                    this._logger?.debug && this._logger.debug('Failed to update UI contexts on config change', err);
                                }
                            }
                        } catch (err) {
                            this._logger?.debug && this._logger.debug('Failed to evaluate UI-context update condition', err);
                        }

                        // Update other runtime configuration values (cache size/timeout, etc.)
                        try {
                            const cfgRuntime = vscode.workspace.getConfiguration('explorerDates');
                            if (event.affectsConfiguration && event.affectsConfiguration('explorerDates.cacheTimeout')) {
                                try { this._cacheTimeout = Number(cfgRuntime.get('cacheTimeout', DEFAULT_CACHE_TIMEOUT)); } catch (e) { /* ignore */ }
                            }
                            if (event.affectsConfiguration && event.affectsConfiguration('explorerDates.maxCacheSize')) {
                                try { this._maxCacheSize = Number(cfgRuntime.get('maxCacheSize', DEFAULT_MAX_CACHE_SIZE)) || DEFAULT_MAX_CACHE_SIZE; } catch (e) { /* ignore */ }
                            }
                        } catch (err) {
                            this._logger?.debug && this._logger.debug('Failed to refresh runtime config values from settings', err);
                        }

                        // Handle workspace exclusion profile changes by delegating to workspace intelligence (best-effort)
                        (async () => {
                            try {
                                if (event.affectsConfiguration && event.affectsConfiguration('explorerDates.workspaceExclusionProfiles')) {
                                    if (this._workspaceIntelligence?.smartExclusion?.cleanupAllWorkspaceProfiles) {
                                        await this._workspaceIntelligence.smartExclusion.cleanupAllWorkspaceProfiles();
                                    }
                                }

                                // Persist pending onboarding intent when showWelcomeOnStartup toggles
                                if (event.affectsConfiguration && event.affectsConfiguration('explorerDates.showWelcomeOnStartup')) {
                                    try {
                                        const showWelcome = !!(vscode.workspace.getConfiguration('explorerDates').get('showWelcomeOnStartup', true));
                                        if (this._extensionContext && this._extensionContext.globalState && typeof this._extensionContext.globalState.update === 'function') {
                                            await this._extensionContext.globalState.update('explorerDates.pendingWelcome', showWelcome);
                                        }
                                    } catch (err) {
                                        this._logger?.debug && this._logger.debug('Failed to persist pending welcome flag', err);
                                    }
                                }
                            } catch (err) {
                                this._logger?.debug && this._logger.debug('Failed to run workspace exclusion cleanup after config change', err);
                            }
                        })();
                    } catch (err) { this._logger?.debug?.('configuration change handler failed', err); }
                });
            }
        } catch (err) {
            this._logger?.debug?.('Failed to register configuration watcher', err);
        }

        // Initialize file watcher and periodic refresh synchronously when not in performance mode
        try {
            if (!this._performanceMode) {
                this._setupFileWatcher?.('initial');
                this._setupPeriodicRefresh?.();
            } else {
                this._fileWatcher = undefined;
                this._refreshTimer = null;
            }
        } catch (e) {
            this._logger?.debug?.('initial watcher/refresh setup failed', e);
        }

        // Register Git HEAD watchers for cache invalidation (best-effort)
        try { this._registerGitHeadWatcher?.(); } catch (e) { /* ignore */ }
    }

    // Ensure a watcher manager exists (synchronous-friendly)
    _ensureWatcherManager() {
        if (this._watcherManager) return this._watcherManager;
        try {
            const wmModule = require('./watcher-manager-chunk');
            if (wmModule && typeof wmModule.createWatcherManager === 'function') {
                this._watcherManager = wmModule.createWatcherManager(this);
            }
        } catch (e) {
            this._logger?.debug?.('Failed to create watcher manager', e);
        }
        return this._watcherManager;
    }

    // Handle workspace folder add/remove events. Primary behaviour is delegated
    // to the WatcherManager (if present). A minimal, self-contained fallback is
    // provided so tests and runtime callers never observe an undefined handler.
    _handleWorkspaceFoldersChanged(event) {
        try {
            const wm = this._ensureWatcherManager();
            if (wm && typeof wm.handleWorkspaceFoldersChanged === 'function') {
                // let the WatcherManager take care of the heavy lifting
                wm.handleWorkspaceFoldersChanged(event);
                return;
            }

            const addedUris = (event?.added || []).map(f => f.uri).filter(Boolean);
            const removedUris = (event?.removed || []).map(f => f.uri).filter(Boolean);
            if (addedUris.length === 0 && removedUris.length === 0) return;

            if (this._workspaceFolderChangeTimer) {
                clearTimeout(this._workspaceFolderChangeTimer);
            }

            this._workspaceFolderChangeTimer = setTimeout(() => {
                this._workspaceFolderChangeTimer = null;
                (async () => {
                    try {
                        this._logger?.info && this._logger.info('Workspace folders changed (provider fallback)', { added: addedUris.length, removed: removedUris.length });
                        await this.checkWorkspaceSize();
                        try { this.clearAllCaches(); } catch { /* ignore */ }
                        try { this.refreshAll(); } catch { /* ignore */ }
                        if (this._performanceMode) return;
                        this._setupFileWatcher?.('workspace-change');
                        // best-effort progressive loading reconfiguration
                        try { if (typeof this._applyProgressiveLoadingSetting === 'function') await this._applyProgressiveLoadingSetting(); } catch (err) { this._logger?.debug && this._logger.debug('Failed to reconfigure progressive loading after workspace change', err); }
                        if (this._workspaceIntelligence && typeof this._workspaceIntelligence.onWorkspaceFoldersChanged === 'function') {
                            const added = (vscode.workspace.workspaceFolders || []).map((folder) => ({ uri: folder.uri }));
                            await this._workspaceIntelligence.onWorkspaceFoldersChanged({ added, removed: removedUris.map(uri => ({ uri })) });
                        }
                    } catch (err) {
                        this._logger?.debug && this._logger.debug('Workspace folder change handling failed', err);
                    }
                })();
            }, 250);
        } catch (err) {
            this._logger?.debug && this._logger.debug('provider._handleWorkspaceFoldersChanged failed', err);
        }
    }

    _normalizeWatcherExtensions(raw = []) {
        try {
            if (!Array.isArray(raw)) return [];
            const seen = new Set();
            return raw
                .map(x => String(x || '').replace(/^\./, '').toLowerCase().trim())
                .filter(s => !!s)
                .filter(s => !seen.has(s) ? (seen.add(s), true) : false);
        } catch (e) { return []; }
    }

    _computeSmartWatcherMaxPatterns(raw) {
        try {
            let v = Number(raw || 0);
            if (!Number.isFinite(v) || v <= 0) v = 20;
            const envMax = Number(env.EXPLORER_DATES_MAX_SMART_WATCHER_PATTERNS || 200);
            const max = Math.max(1, Math.min(Math.floor(v), Math.max(1, envMax)));
            return max;
        } catch (e) { return 20; }
    }

    // Build smart watcher targets (tests and WatcherManager expect this to exist)
    async _buildSmartWatcherTargets(workspaceFolders, options = {}) {
        try {
            // Prefer delegating to the helper chunk when available
            try {
                const helper = require('./decoration-provider-impl-chunk');
                if (helper && typeof helper._buildSmartWatcherTargets === 'function') {
                    return await helper._buildSmartWatcherTargets(this, workspaceFolders, options);
                }
            } catch (e) { /* fall through to lightweight fallback */ }

            // Minimal fallback: return a small set of root-level patterns so WatcherManager can proceed
            const targets = [];
            const totalBudget = Math.max(1, (options && options.maxPatterns) || 1);
            let remainingBudget = totalBudget;
            let remainingFolders = Array.isArray(workspaceFolders) ? workspaceFolders.length : 0;

            for (const folder of (workspaceFolders || [])) {
                if (remainingBudget <= 0) break;
                const folderBudget = Math.max(1, Math.floor(remainingBudget / Math.max(1, remainingFolders)));

                // Root-level watcher for important file types
                const rootPattern = new vscode.RelativePattern(folder, '*.{md,mdx,json,jsonc,yml,yaml,ts,tsx,js,jsx}');
                targets.push({ pattern: rootPattern, label: `root:${folder.name}` });
                remainingBudget -= 1;
                if (remainingBudget <= 0) break;

                // Use directory listing (when available) to prioritize common source folders
                try {
                    const entries = typeof this._fileSystem?.readdir === 'function'
                        ? await this._fileSystem.readdir(folder.uri || folder.fsPath || folder)
                        : [];

                    const dirNames = (Array.isArray(entries) ? entries : [])
                        .filter((e) => e && (typeof e.isDirectory === 'function' ? e.isDirectory() : true))
                        .map((e) => (typeof e === 'string' ? e : (e.name || '')))
                        .filter(Boolean)
                        .filter((n) => !['node_modules', '.git', 'dist', 'build', 'out'].includes(n));

                    // Sort by priority (src, lib, test first)
                    dirNames.sort((a, b) => (SMART_WATCHER_PRIORITY.get(b) || 0) - (SMART_WATCHER_PRIORITY.get(a) || 0));

                    for (const dirName of dirNames) {
                        if (remainingBudget <= 0) break;
                        const subPattern = new vscode.RelativePattern(folder, `${dirName}/**/*.{md,mdx,json,jsonc,yml,yaml,ts,tsx,js,jsx}`);
                        targets.push({ pattern: subPattern, label: `sub:${folder.name}/${dirName}` });
                        remainingBudget -= 1;
                    }
                } catch (e) {
                    // ignore readdir failures and continue with root-level pattern only
                }

                remainingFolders -= 1;
            }

            return targets.slice(0, totalBudget);
        } catch (err) {
            return [];
        }
    }

    // Safe event registration helper (used by watcher/dynamic support)
    _registerEvent(target, eventName, handler) {
        try {
            if (!target || typeof eventName !== 'string' || typeof handler !== 'function') return null;
            const fn = target[eventName];
            if (typeof fn === 'function') {
                try { return fn.call(target, handler); } catch (e) { return null; }
            }
            return null;
        } catch (e) { return null; }
    }

    // Expose indexer limit so other chunks can query it (fallback for tests)
    _getIndexerMaxFiles() {
        try {
            return Math.max(100, Number(env.EXPLORER_DATES_INDEXER_MAX_FILES || 2000));
        } catch (e) { return 2000; }
    }

    // Public-facing helper used by decorations-advanced and tests
    _setupFileWatcher(reason = 'initial') {
        try {
            if (this._performanceMode || this._isDisposed) return;
            // ensure a quick synchronous sentinel so callers/tests observe a truthy watcher immediately
            if (!this._fileWatcher) this._fileWatcher = { pending: true };
            const wm = this._ensureWatcherManager();
            if (wm && typeof wm.setupFileWatcher === 'function') {
                try { wm.setupFileWatcher(reason); return; } catch (e) { this._logger?.debug?.('WatcherManager.setupFileWatcher failed', e); }
            }
            // Fallback: delegate to decorations-advanced chunk (async)
            (async () => {
                try {
                    const adv = await this._getDecorationsAdvancedChunk();
                    if (adv && typeof adv.setupFileWatcher === 'function') {
                        await adv.setupFileWatcher(this, reason);
                    }
                } catch (err) {
                    this._logger?.debug?.('Fallback setupFileWatcher failed', err);
                }
            })();
        } catch (err) {
            this._logger?.debug?.('provider._setupFileWatcher failed', err);
        }
    }

    // Public shim so tests and external callers can explicitly initialize the
    // smart-watcher subsystem on-demand. Delegates to the WatcherManager when
    // available and accepts either (reason, requestId) or (requestId, reason).
    async _initializeSmartWatchers(arg1, arg2) {
        try {
            let reason = 'manual';
            let requestId = (typeof arg1 === 'number') ? arg1 : (typeof arg2 === 'number' ? arg2 : ++this._watcherSetupToken);
            if (typeof arg1 === 'string') reason = arg1;

            const wm = this._ensureWatcherManager();
            if (wm && typeof wm._initializeSmartWatchers === 'function') {
                return await wm._initializeSmartWatchers(requestId, reason);
            }

            // Best-effort fallback: trigger the provider-level setup and return immediately
            this._setupFileWatcher(reason);
            return;
        } catch (err) {
            this._logger?.debug && this._logger.debug('provider._initializeSmartWatchers failed', err);
        }
    }

    _disposeFileWatchers(options = {}) {
        try {
            const permanent = options && options.permanent === true;
            if (this._watcherManager && typeof this._watcherManager.disposeFileWatchers === 'function') {
                try { this._watcherManager.disposeFileWatchers({ permanent }); } catch (e) { this._logger?.debug?.('watcherManager.disposeFileWatchers failed', e); }
                // mirror manager state on provider so callers/tests observe expected value
                this._fileWatcher = permanent ? null : undefined;
            } else {
                if (this._fileWatchers && typeof this._fileWatchers.forEach === 'function') {
                    this._fileWatchers.forEach((w) => { try { w && typeof w.dispose === 'function' && w.dispose(); } catch (e) {} });
                    this._fileWatchers.clear();
                }
                this._fileWatcher = permanent ? null : undefined;
            }
            // clear debounce timers
            if (this._watcherEventDebounce && this._watcherEventDebounce.size) {
                for (const entry of this._watcherEventDebounce.values()) clearTimeout(entry.timer);
                this._watcherEventDebounce.clear();
            }
        } catch (err) {
            this._logger?.debug?.('provider._disposeFileWatchers failed', err);
        }
    }

    _setupPeriodicRefresh() {
        try {
            // Prefer decorated implementation when available
            const adv = (() => {
                try { return require('./decorations-advanced'); } catch { return null; }
            })();
            if (adv && typeof adv.setupPeriodicRefresh === 'function') {
                try { adv.setupPeriodicRefresh(this); return; } catch (e) { this._logger?.debug?.('adv.setupPeriodicRefresh failed', e); }
            }

            // Prefer lighter refresh implementation from the dedicated chunk when available
            try {
                const refreshChunk = require('./decoration-refresh-chunk');
                if (refreshChunk && typeof refreshChunk.setupPeriodicRefresh === 'function') {
                    refreshChunk.setupPeriodicRefresh(this);
                    return;
                }
            } catch (e) {
                /* fall through to minimal fallback below */
            }

            // Minimal fallback: set a timer if decorations are enabled
            const cfg = vscode.workspace.getConfiguration('explorerDates');
            const configuredInterval = cfg.get('badgeRefreshInterval', 60000);
            const interval = this._refreshIntervalOverride || configuredInterval;
            this._refreshInterval = interval;
            if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; }
            if (!cfg.get('showDateDecorations', true)) return;
            this._refreshTimer = setInterval(() => {
                try {
                    // Minimal fallback behaviour: trigger a global refresh event
                    try { this._onDidChangeFileDecorations.fire(undefined); } catch (e) { /* ignore */ }
                } catch (e) { /* ignore */ }
            }, this._refreshInterval);
        } catch (err) {
            this._logger?.debug?.('provider._setupPeriodicRefresh failed', err);
        }
    }

    // Initialize optional/advanced systems by delegating to the decorations-advanced chunk
    async initializeAdvancedSystems(context) {
        try {
            const featureFlags = require('../featureFlags');
            const adv = await featureFlags.decorationsAdvanced();
            if (adv && typeof adv.initializeAdvancedSystems === 'function') {
                return adv.initializeAdvancedSystems(this, context);
            }
            this._logger.info && this._logger.info('Advanced systems chunk unavailable - skipping advanced initialization');
        } catch (e) {
            this._logger.error && this._logger.error('Failed to initialize advanced systems', e);
        }
    }

    // Compute or delegate workspace size checks used by performance heuristics
    async checkWorkspaceSize() {
        try {
            const featureFlags = require('../featureFlags');
            const adv = await featureFlags.decorationsAdvanced();
            if (adv && typeof adv.performWorkspaceSizeCheck === 'function') {
                return adv.performWorkspaceSizeCheck(this);
            }
        } catch (e) {
            this._logger.debug && this._logger.debug('Delegated checkWorkspaceSize failed', e);
        }

        // Minimal fallback: try to use vscode.workspace.findFiles (fast and sufficient for tests)
        try {
            const vscode = require('vscode');
            const files = await (vscode.workspace.findFiles ? vscode.workspace.findFiles('**/*', null, 100) : []);
            const count = Array.isArray(files) ? files.length : 0;
            this._workspaceFileCount = count;
            // Use centralized thresholds from constants so behavior is consistent
            // across chunks and test helpers.
            const { WORKSPACE_SCALE_LARGE_THRESHOLD, WORKSPACE_SCALE_EXTREME_THRESHOLD } = require('../constants');
            this._workspaceScale = count >= WORKSPACE_SCALE_EXTREME_THRESHOLD ? 'extreme' :
                                   count >= WORKSPACE_SCALE_LARGE_THRESHOLD ? 'large' :
                                   'normal';
            // Ensure feature-level is recalibrated when using the fallback scanner
            try { this._applyFeatureLevel(this._determineFeatureLevel(), 'workspace-scale-change-fallback'); } catch (e) { /* best-effort */ }
            return;
        } catch (e) {
            this._logger.debug && this._logger.debug('performWorkspaceSizeCheck fallback failed', e);
        }
    }

    // Core decoration entrypoint used by tests and the extension host
    async provideFileDecoration(uri, token) {
        // Ensure security/configuration is up-to-date for each request so tests and
        // runtime callers observe the most recent configuration values.
        try { await this._ensureSecurityConfig && this._ensureSecurityConfig(); } catch (e) { /* ignore */ }
        recordDecorationCall();

        try {
            if (this.U && typeof this.U.provideDecoration === 'function') {
                try {
                    const result = await this.U.provideDecoration(uri, token);
                    if (result == null) return result;
                    if (typeof result !== 'object') return undefined;
                    if ('badge' in result || 'tooltip' in result || 'color' in result) return result;
                    return undefined;
                } catch (innerErr) {
                    this._logger?.debug && this._logger.debug('Decoration helper threw', innerErr);
                    return undefined;
                }
            }
        } catch (err) {
            this._logger?.debug('Decoration provider helper failed', err);
        }

        // Lazy-load the decoration helper chunk if available
        try {
            if (!this._decorationHelperLoading) {
                this._decorationHelperLoading = Promise.resolve()
                    .then(() => require('./decoration-provide-chunk'))
                    .then((mod) => {
                        this.U = mod.createDecorationProviderHelpers ? mod.createDecorationProviderHelpers(this) : mod;
                    })
                    .finally(() => {
                        this._decorationHelperLoading = null;
                    });
            }
            if (this._decorationHelperLoading) await this._decorationHelperLoading;
            if (this.U && typeof this.U.provideDecoration === 'function') {
                try {
                    const result = await this.U.provideDecoration(uri, token);
                    if (result == null) return result;
                    if (typeof result !== 'object') return undefined;
                    if ('badge' in result || 'tooltip' in result || 'color' in result) return result;
                    return undefined;
                } catch (innerErr) {
                    this._logger?.debug && this._logger.debug('Decoration helper threw', innerErr);
                    return undefined;
                }
            }
        } catch (err) {
            this._logger?.debug('Failed to load decoration provider chunk', err);
        }

        // No decoration available
        return undefined;
    }

    // Lightweight internal helpers required by chunks/tests (minimal, behavior-preserving fallbacks)
    _validateWorkspaceUri(uri, reason = '') {
        try {
            if (!uri) return { isValid: false };
            const p = String(uri.fsPath || uri.path || '');
            if (!p) return { isValid: false };
            if (p.indexOf('\x00') !== -1) return { isValid: false };
            return { isValid: true };
        } catch (e) {
            return { isValid: false };
        }
    }

    async _isExcludedSimple(uri) {
        try {
            const p = String(uri.fsPath || uri.path || '');
            if (!p) return false;
            const normalized = p.replace(/\\/g, '/');
            const exclusions = ['node_modules', '/.git/', '/dist/'];
            return exclusions.some((ex) => normalized.includes(ex));
        } catch (e) {
            return false;
        }
    }

    async _withFileLock(filePath, fn) {
        // Minimal lock: call immediately
        try {
            return await fn();
        } catch (e) {
            throw e;
        }
    }

    _getCacheKey(uri) {
        try {
            const p = String(uri.fsPath || uri.path || '');
            return p.replace(/\\/g, '/');
        } catch (e) {
            return String(uri || '');
        }
    }

    // Read and apply relevant security configuration from workspace settings.
    _ensureSecurityConfig() {
        try {
            const config = (require('vscode').workspace.getConfiguration)('explorerDates');
            const allowTestPaths = config.get('security.allowTestPaths', true);
            const allowedExtraPaths = Array.isArray(config.get('security.allowedExtraPaths', [])) ? config.get('security.allowedExtraPaths', []) : [];
            const enableBoundaryEnforcement = config.get('security.enableBoundaryEnforcement');
            const enforceWorkspaceBoundaries = config.get('security.enforceWorkspaceBoundaries');

            this._securityAllowTestPaths = allowTestPaths !== false;

            const pathModule = (() => {
                try { return require('path'); } catch { return null; }
            })();

            const normalized = (allowedExtraPaths || []).filter(Boolean).map((p) => {
                try { return pathModule ? pathModule.normalize(String(p)) : String(p); } catch { return String(p); }
            });

            this._securityAllowedExtraPaths = normalized;

            if (typeof enableBoundaryEnforcement === 'boolean') this._securityEnforceWorkspaceBoundaries = enableBoundaryEnforcement;
            else if (typeof enforceWorkspaceBoundaries === 'boolean') this._securityEnforceWorkspaceBoundaries = enforceWorkspaceBoundaries;
            // otherwise leave default
        } catch (e) {
            this._logger?.debug && this._logger.debug('Failed to ensure security configuration', e);
        }
    }

    async _getCachedDecoration(cacheKey, fileLabel) {
        try {
            if (this._forceCacheBypass) {
                this._logger?.debug?.(`Cache bypass enabled - recalculating decoration for: ${fileLabel}`);
                return null;
            }

            if (this._advancedCache) {
                try {
                    const cached = await this._advancedCache.get(cacheKey);
                    if (cached) {
                        this._metrics.cacheHits++;
                        this._logger?.debug?.(`Advanced cache hit for: ${fileLabel}`);
                        return cached;
                    }
                } catch (error) {
                    this._logger?.debug?.(`Advanced cache error: ${error.message}`);
                }
            }

            if (!this._decorationCache || typeof this._decorationCache.get !== 'function') return null;

            const memoryEntry = this._decorationCache.get(cacheKey);
            if (memoryEntry) {
                if (memoryEntry.forceRefresh) {
                    try { this._decorationCache.delete(cacheKey); } catch { /* ignore */ }
                    this._logger?.debug?.(`Memory cache bypassed (forced refresh) for: ${fileLabel}`);
                } else if ((Date.now() - memoryEntry.timestamp) < this._cacheTimeout) {
                    this._metrics.cacheHits++;
                    this._logger?.debug?.(`Memory cache hit for: ${fileLabel}`);
                    return memoryEntry.decoration;
                }
            }

            return null;
        } catch (error) {
            this._logger?.debug?.('getCachedDecoration failed', error);
            return null;
        }
    }

    _createMinimalDecoration(uri, now = Date.now()) {
        try {
            const vscode = require('vscode');
            return new vscode.FileDecoration('??', 'Freshness: unknown (backpressure)');
        } catch (e) {
            return { badge: '??', tooltip: 'Freshness: unknown (backpressure)' };
        }
    }

    // Determine effective feature level based on configuration and workspace scale.
    // Mirrors logic used by decorations-advanced so callers (and tests) can rely
    // on provider._determineFeatureLevel() synchronously.
    _determineFeatureLevel(config) {
        try {
            // Performance mode forces minimal feature-level behavior
            if (this._performanceMode || this._lightweightMode) return 'minimal';

            const cfg = config || (require('vscode').workspace.getConfiguration)('explorerDates');
            try {
                const value = String(cfg.get('featureLevel', 'auto') || 'auto').toLowerCase();
                if (FEATURE_LEVELS.includes(value)) return value;
            } catch (e) {
                // fallthrough to workspace-scale-based default
            }

            // Default mapping based on workspace scale
            switch (this._workspaceScale) {
                case 'extreme':
                case 'large':
                    return 'standard';
                default:
                    return 'full';
            }
        } catch (e) {
            return 'full';
        }
    }

    // Apply a feature-level profile to the provider. Returns true when the
    // applied profile changed the active level (useful for callers/tests).
    _applyFeatureLevel(nextLevel, reason = 'unspecified') {
        try {
            if (!nextLevel) return false;
            if (!FEATURE_LEVELS.includes(nextLevel)) nextLevel = 'full';

            const levelChanged = this._featureLevel !== nextLevel || !this._featureProfile;
            this._featureLevel = nextLevel;

            // Build a conservative feature profile (fallback when decorationsAdvanced
            // chunk isn't available). This mirrors the profiles in decorations-advanced.
            const _build = (level) => {
                switch (level) {
                    case 'enhanced':
                        return { level, enableGit: true, enableProgressiveAnalysis: true, applyBackgroundLimits: false, backgroundTooltipMode: 'rich', viewportWindowMs: 60000, enableColors: true };
                    case 'standard':
                        return { level, enableGit: true, enableProgressiveAnalysis: false, applyBackgroundLimits: true, backgroundTooltipMode: 'summary', viewportWindowMs: 480000, enableColors: true };
                    case 'minimal':
                        return { level, enableGit: false, enableProgressiveAnalysis: false, applyBackgroundLimits: true, backgroundTooltipMode: 'summary', viewportWindowMs: 120000, enableColors: false };
                    default:
                        return { level: 'full', enableGit: true, enableProgressiveAnalysis: false, applyBackgroundLimits: false, backgroundTooltipMode: 'rich', viewportWindowMs: VIEWPORT_DEFAULT_WINDOW_MS, enableColors: true };
                }
            };

            const profile = levelChanged ? _build(nextLevel) : (this._featureProfile || _build(nextLevel));
            this._featureProfile = profile;
            this._viewportWindowMs = profile.viewportWindowMs;

            if (levelChanged) {
                this._logger?.info?.(`Feature level set to "${nextLevel}" (${reason})`, { viewportWindowMs: this._viewportWindowMs, applyBackgroundLimits: profile.applyBackgroundLimits, backgroundTooltipMode: profile.backgroundTooltipMode });
            }

            // If performance mode is active, skip applying side-effects but still
            // keep the profile in-place so callers can inspect it.
            if (this._performanceMode) {
                this._logger?.info && this._logger.info('Performance mode active - skipping feature profile application');
                return levelChanged;
            }

            // Apply background-limits related side-effects (noop in minimal provider)
            try { if (profile.applyBackgroundLimits && typeof this._applyBackgroundLimits === 'function') this._applyBackgroundLimits(reason); } catch (e) { /* ignore */ }

            return levelChanged;
        } catch (e) {
            this._logger?.debug && this._logger.debug('Failed to apply feature level', e);
            return false;
        }
    }

    _isViewportPriority(uri) {
        try {
            const path = normalizePath(getUriPath(uri) || '');
            return this._viewportVisibleFiles.has(path) || this._viewportRecentFiles.has(path);
        } catch (e) {
            return false;
        }
    }

    _recordViewportActivity(uri, { reason = 'unknown', visible = false } = {}) {
        try {
            const path = normalizePath(getUriPath(uri) || '');
            const now = Date.now();
            if (visible) {
                this._viewportVisibleFiles.add(path);
            } else {
                // add to recent history with timestamp
                this._viewportRecentFiles.set(path, now);
                // enforce history limit
                while (this._viewportRecentFiles.size > (Number(this._viewportHistoryLimit) || 400)) {
                    const oldest = this._viewportRecentFiles.keys().next().value;
                    if (!oldest) break;
                    this._viewportRecentFiles.delete(oldest);
                }
            }
            // update metrics counters
            if (visible) this._metrics.viewportPriorityDecorations = (this._metrics.viewportPriorityDecorations || 0) + 1;
            else this._metrics.viewportBackgroundDecorations = (this._metrics.viewportBackgroundDecorations || 0) + 1;
        } catch (e) {
            // ignore
        }
    }

    _checkMemoryPressure() {
        // no-op fallback
        return false;
    }

    _isFileNotFoundError(err) {
        return !!(err && (err.code === 'ENOENT' || /not found/i.test(err.message || '')));
    }

    async _getDecorationsAdvancedChunk() {
        try {
            // Cache the loaded chunk to avoid repeated expensive lookups
            if (this._decorationsAdvancedChunk) return this._decorationsAdvancedChunk;
            if (this._decorationsAdvancedChunkPromise) return await this._decorationsAdvancedChunkPromise;

            this._decorationsAdvancedChunkPromise = (async () => {
                try {
                    const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
                    const featureFlagsGlobal = getFeatureFlagsGlobal();
                    const chunk = featureFlagsGlobal ? await featureFlagsGlobal.decorationsAdvanced() : null;
                    this._decorationsAdvancedChunk = chunk || null;
                    return this._decorationsAdvancedChunk;
                } catch (error) {
                    this._logger?.debug && this._logger.debug('Failed to load decorationsAdvanced chunk', error);
                    this._decorationsAdvancedChunk = null;
                    return null;
                } finally {
                    this._decorationsAdvancedChunkPromise = null;
                }
            })();

            return await this._decorationsAdvancedChunkPromise;
        } catch (error) {
            try { this._logger?.debug && this._logger.debug('provider._getDecorationsAdvancedChunk failed', error); } catch {}
            return null;
        }
    }

    _formatDateBadge(date, format, diffMs) {
        try {
            const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
            if (days <= 0) return '•';
            if (days < 10) return String(days);
            return '•';
        } catch (e) {
            return '•';
        }
    }

    _formatFileSize(bytes, format = 'auto') {
        try {
            return formatFileSize(bytes, format);
        } catch (e) {
            return `${bytes} bytes`;
        }
    }

    _getColorByScheme(date, scheme, filePath) {
        try {
            if (!scheme || scheme === 'none') return undefined;
            const builtinDebugColors = (() => {
                if (!this._isWeb) return false;
                try {
                    const cfg = vscode.workspace.getConfiguration('explorerDates');
                    return !!cfg.get('webDiagnosticsBuiltinColors', false);
                } catch {
                    return false;
                }
            })();
            const ageMs = Date.now() - (date instanceof Date ? date.getTime() : new Date(date).getTime());
            if (builtinDebugColors) {
                const recent = new vscode.ThemeColor('list.warningForeground');
                const mid = new vscode.ThemeColor('list.deemphasizedForeground');
                const old = new vscode.ThemeColor('list.errorForeground');
                if (isWebDiagnosticsEnabled()) {
                    diagLogOnce('web-builtin-color-fallback', 'info', 'Web builtin color fallback enabled');
                }
                if (scheme === 'file-type') return recent;
                if (scheme === 'subtle') return mid;
                if (ageMs < 36e5) return recent;
                if (ageMs < 864e5) return mid;
                return old;
            }
            // custom scheme -> expose theme color ids so tests and UI can map to workbench colors
            if (scheme === 'custom') {
                if (ageMs < 36e5) return new vscode.ThemeColor('explorerDates.customColor.veryRecent');
                if (ageMs < 864e5) return new vscode.ThemeColor('explorerDates.customColor.recent');
                return new vscode.ThemeColor('explorerDates.customColor.old');
            }
            // recency/adaptive/vibrant/subtle fallback (minimal)
            if (scheme === 'recency') {
                // Use built-in VS Code theme colors for recency in web mode
                // These have better default rendering than custom color tokens
                if (ageMs < 36e5) return new vscode.ThemeColor('list.highlightForeground');  // Very recent: highlight
                if (ageMs < 864e5) return new vscode.ThemeColor('charts.yellow');            // Recent: yellow
                return new vscode.ThemeColor('charts.red');                                   // Old: red
            }
            const colors = getAdaptiveColorsFallback();
            if (scheme === 'file-type' || scheme === 'adaptive') {
                const fileTypeColor = getFileTypeColorFallback(filePath, colors);
                if (fileTypeColor) return fileTypeColor;
                if (scheme === 'adaptive' && colors) {
                    if (ageMs < 36e5) return colors.veryRecent;
                    if (ageMs < 864e5) return colors.recent;
                    return colors.old;
                }
            }
            if (scheme === 'subtle' && colors) {
                if (ageMs < 36e5) return colors.subtle;
                if (ageMs < 6048e5) return colors.muted;
                return colors.emphasis;
            }
            if (scheme === 'vibrant' && colors) {
                if (ageMs < 36e5) return colors.veryRecent;
                if (ageMs < 864e5) return colors.recent;
                return colors.old;
            }
            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    _shouldUseGitRecency(uri) {
        try {
            const scheme = uri?.scheme || 'file';
            return this._isWeb || scheme !== 'file';
        } catch {
            return this._isWeb;
        }
    }

    _getGitCacheKey(uri) {
        try {
            if (uri?.toString) return uri.toString(true);
        } catch { /* ignore */ }
        try {
            const scheme = uri?.scheme || 'file';
            const p = uri?.path || uri?.fsPath || '';
            return `${scheme}://${p}`;
        } catch {
            return String(uri || '');
        }
    }

    _getFreshnessCacheKey(uri, sourceHint) {
        try {
            const scheme = uri?.scheme || 'file';
            const pathValue = getUriPath(uri) || '';
            const normalized = normalizePath(pathValue);
            return `${scheme}::${normalized}::${sourceHint || 'auto'}`;
        } catch {
            return String(uri || 'unknown');
        }
    }

    _getCachedFreshness(cacheKey) {
        try {
            const entry = this._freshnessCache.get(cacheKey);
            if (!entry) return null;
            if (entry.expiresAt && entry.expiresAt < Date.now()) {
                this._freshnessCache.delete(cacheKey);
                return null;
            }
            return entry.freshness || null;
        } catch {
            return null;
        }
    }

    _storeFreshnessCache(cacheKey, freshness) {
        try {
            if (!freshness) return;
            if (this._freshnessCache.size >= this._freshnessCacheMax) {
                const oldest = this._freshnessCache.keys().next().value;
                if (oldest) this._freshnessCache.delete(oldest);
            }
            const existing = this._freshnessCache.get(cacheKey);
            if (existing && existing.freshness) {
                const cmp = compareFreshness(existing.freshness, freshness);
                if (cmp > 0) return;
            }
            this._freshnessCache.set(cacheKey, {
                freshness,
                expiresAt: Date.now() + this._freshnessCacheTtlMs
            });
        } catch {
            // ignore cache errors
        }
    }

    _normalizeGitPath(value = '') {
        try {
            let raw = String(value || '');
            raw = raw.replace(/\\/g, '/');
            raw = raw.replace(/\/{2,}/g, '/');
            raw = raw.replace(/^\/+/, '');
            try { raw = decodeURIComponent(raw); } catch { /* ignore */ }
            return raw;
        } catch {
            return '';
        }
    }

    _rememberGitRecency(cacheKey, entry) {
        try {
            if (this._gitRecencyCache.size >= this._gitRecencyCacheMax) {
                const oldestKey = this._gitRecencyCache.keys().next().value;
                if (oldestKey) this._gitRecencyCache.delete(oldestKey);
            }
            this._gitRecencyCache.set(cacheKey, entry);
        } catch { /* ignore */ }
    }

    async _getGitRecencyTimestamp(uri) {
        const cacheKey = this._getGitCacheKey(uri);
        const now = Date.now();
        const cached = this._gitRecencyCache.get(cacheKey);
        if (cached && cached.expiresAt && cached.expiresAt > now) {
            return cached;
        }

        const result = {
            timestampMs: null,
            available: false,
            error: null,
            expiresAt: now + this._gitRecencyCacheTtlMs,
            repoMatched: null,
            pathAttempted: null
        };

        try {
            // Check for Git extension - it may be available in web mode (vscode.dev)
            const extension = vscode?.extensions?.getExtension ? vscode.extensions.getExtension('vscode.git') : null;
            if (!extension) {
                // Log once in web mode to help debugging
                if (this._isWeb) {
                    diagLogOnce('git-extension-unavailable-web', 'info', 'Git extension not available in web mode - timestamps will use fs.stat fallback');
                }
                result.error = 'git-extension-missing';
                this._rememberGitRecency(cacheKey, result);
                return result;
            }
            if (!extension.isActive && typeof extension.activate === 'function') {
                try { await extension.activate(); } catch { /* ignore activation errors */ }
            }
            const api = extension.exports?.getAPI?.(1);
            if (!api) {
                result.error = 'git-api-unavailable';
                this._rememberGitRecency(cacheKey, result);
                return result;
            }
            result.available = true;
            let repo = typeof api.getRepository === 'function' ? api.getRepository(uri) : null;
            const uriPathRaw = uri?.path || uri?.fsPath || '';
            const uriPath = this._normalizeGitPath(uriPathRaw);
            if (!repo && Array.isArray(api.repositories)) {
                repo = api.repositories.find((r) => {
                    const rootPathRaw = r?.rootUri?.path || r?.rootUri?.fsPath || '';
                    const rootPath = this._normalizeGitPath(rootPathRaw);
                    return rootPath && uriPath && uriPath.startsWith(rootPath);
                }) || null;
            }
            if (!repo || typeof repo.log !== 'function') {
                result.error = 'git-repo-unavailable';
                result.repoMatched = false;
                result.expiresAt = now + Math.min(this._gitRecencyCacheTtlMs, 5000);
                this._rememberGitRecency(cacheKey, result);
                return result;
            }
            result.repoMatched = true;
            const rootPath = this._normalizeGitPath(repo?.rootUri?.path || repo?.rootUri?.fsPath || '');
            const relativePath = rootPath && uriPath.startsWith(rootPath)
                ? uriPath.slice(rootPath.length).replace(/^\/+/, '')
                : uriPath;
            result.pathAttempted = relativePath || uriPath || '';
            const logEntries = await repo.log({ maxEntries: 1, path: result.pathAttempted });
            const entry = Array.isArray(logEntries) ? logEntries[0] : null;
            const commitDate = entry?.commitDate || entry?.authorDate || entry?.date || entry?.committerDate;
            const ts = commitDate ? new Date(commitDate).getTime() : null;
            result.author = entry?.authorName || entry?.author?.name || entry?.author || null;
            result.message = entry?.message || entry?.subject || null;
            if (Number.isFinite(ts)) {
                result.timestampMs = ts;
            } else {
                result.error = 'git-log-empty';
                result.expiresAt = now + Math.min(this._gitRecencyCacheTtlMs, 5000);
            }
        } catch (error) {
            result.error = error?.message ? `git-error:${error.message}` : 'git-error';
            result.expiresAt = now + Math.min(this._gitRecencyCacheTtlMs, 5000);
        }

        this._rememberGitRecency(cacheKey, result);
        return result;
    }

    async _resolveTimestampForUri(uri, stat) {
        const rawFallback = stat?.mtime ? (stat.mtime instanceof Date ? stat.mtime : new Date(stat.mtime)) : null;
        const fallbackMs = rawFallback && typeof rawFallback.getTime === 'function' ? rawFallback.getTime() : NaN;
        const fallback = Number.isFinite(fallbackMs) ? rawFallback : null;
        const scheme = uri?.scheme || 'file';
        if (!this._shouldUseGitRecency(uri)) {
            return {
                timestamp: fallback,
                source: fallback ? 'fs-stat' : 'none',
                gitAvailable: false,
                gitError: null,
                repoMatched: null,
                pathAttempted: null
            };
        }
        let gitResult;
        try {
            gitResult = await this._getGitRecencyTimestamp(uri);
        } catch (error) {
            gitResult = {
                timestampMs: null,
                available: false,
                error: error?.message ? `git-error:${error.message}` : 'git-error',
                repoMatched: null,
                pathAttempted: null
            };
        }
        if (gitResult?.timestampMs) {
            return {
                timestamp: new Date(gitResult.timestampMs),
                source: 'git',
                gitAvailable: gitResult.available,
                gitError: gitResult.error,
                repoMatched: gitResult.repoMatched,
                pathAttempted: gitResult.pathAttempted
            };
        }
        let source = fallback ? 'fs-stat' : 'none';
        if (fallback && scheme !== 'file') {
            const ageMs = Date.now() - fallback.getTime();
            // Detect suspect timestamps in web mode (vscode-vfs may return workspace open time)
            if (ageMs >= 0 && ageMs <= 60000) {
                source = 'fs-stat-suspect';
            } else if (this._isWeb && ageMs > 60000) {
                // In web mode, fs.stat timestamps may all be identical (workspace clone time)
                // Log once to help users understand why times might be inaccurate
                diagLogOnce('web-fs-stat-limitation', 'info', 'Web mode timestamps may reflect workspace open time, not actual file modification time. Git extension would provide accurate timestamps if available.');
            }
        }
        if (this._isWeb && scheme !== 'file' && (gitResult?.error || !(gitResult?.available))) {
            // Web/virtual scheme with no git support: avoid using potentially synthetic timestamps.
            return {
                timestamp: null,
                source: 'web-unknown',
                gitAvailable: false,
                gitError: gitResult?.error || null,
                repoMatched: gitResult?.repoMatched ?? null,
                pathAttempted: gitResult?.pathAttempted || null
            };
        }
        return {
            timestamp: fallback,
            source,
            gitAvailable: gitResult?.available || false,
            gitError: gitResult?.error || null,
            repoMatched: gitResult?.repoMatched ?? null,
            pathAttempted: gitResult?.pathAttempted || null
        };
    }

    async _resolveFreshnessForUri(uri, stat, options = {}) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const workspaceKind = options.workspaceKind || (this._isWeb ? 'web' : 'desktop');
        const sourcePolicy = config.get('freshnessSourcePolicy', 'auto');
        const cacheKey = this._getFreshnessCacheKey(uri, sourcePolicy);
        const cached = this._getCachedFreshness(cacheKey);
        if (cached) return cached;
        const freshness = await resolveFreshness({
            uri,
            stat,
            provider: this,
            config,
            workspaceKind
        });
        this._storeFreshnessCache(cacheKey, freshness);
        return freshness;
    }

    async _buildTooltipContent(opts = {}) {
        try {
            const d = opts.stat?.mtime || opts.stat?.birthtime || new Date();
            return `Modified: ${(d instanceof Date ? d : new Date(d)).toISOString()}`;
        } catch (e) {
            return '';
        }
    }

    clearAllCaches() {
        try {
            try { if (this._decorationCache && typeof this._decorationCache.clear === 'function') this._decorationCache.clear(); } catch {}
            try { if (this._decorationPool && typeof this._decorationPool.clear === 'function') this._decorationPool.clear(); } catch {}
            try { if (this._decorationPoolOrder) this._decorationPoolOrder.length = 0; } catch {}
            try { if (this._badgeFlyweightCache && typeof this._badgeFlyweightCache.clear === 'function') this._badgeFlyweightCache.clear(); } catch {}
            try { if (this._badgeFlyweightOrder) this._badgeFlyweightOrder.length = 0; } catch {}
            try { if (this._readableDateFlyweightCache && typeof this._readableDateFlyweightCache.clear === 'function') this._readableDateFlyweightCache.clear(); } catch {}
            try { if (this._readableDateFlyweightOrder) this._readableDateFlyweightOrder.length = 0; } catch {}
            try { if (this._advancedCache && typeof this._advancedCache.clear === 'function') this._advancedCache.clear(); } catch {}
            try { if (this._gitRecencyCache && typeof this._gitRecencyCache.clear === 'function') this._gitRecencyCache.clear(); } catch {}
            try { if (this._freshnessCache && typeof this._freshnessCache.clear === 'function') this._freshnessCache.clear(); } catch {}
        } catch (error) {
            this._logger?.debug && this._logger.debug('clearAllCaches failed', error);
        }
    }

    _clearFreshnessCacheForUri(uri) {
        try {
            if (!this._freshnessCache || this._freshnessCache.size === 0) return;
            const scheme = uri?.scheme || 'file';
            const pathValue = getUriPath(uri) || '';
            const normalized = normalizePath(pathValue);
            const prefix = `${scheme}::${normalized}::`;
            for (const key of this._freshnessCache.keys()) {
                if (typeof key === 'string' && key.startsWith(prefix)) {
                    this._freshnessCache.delete(key);
                }
            }
        } catch {
            // ignore cache errors
        }
    }

    _handleGitHeadChange(meta = {}) {
        try { this.clearAllCaches(); } catch { /* ignore */ }
        try { this.refreshAll(); } catch { /* ignore */ }
        try {
            if (meta?.head && this._logger?.info) {
                this._logger.info('Git HEAD change detected; caches refreshed', { head: meta.head });
            }
        } catch { /* ignore */ }
    }

    _registerGitHeadWatcher() {
        if (this._gitHeadWatcherInitialized) return;
        this._gitHeadWatcherInitialized = true;
        (async () => {
            try {
                const extension = vscode?.extensions?.getExtension ? vscode.extensions.getExtension('vscode.git') : null;
                if (!extension) return;
                if (!extension.isActive && typeof extension.activate === 'function') {
                    try { await extension.activate(); } catch { /* ignore */ }
                }
                const api = extension.exports?.getAPI?.(1);
                if (!api) return;

                const registerRepo = (repo) => {
                    try {
                        if (!repo || !repo.state || typeof repo.state.onDidChange !== 'function') return;
                        let lastHead = repo.state.HEAD?.commit || repo.state.HEAD?.name || null;
                        const disposable = repo.state.onDidChange(() => {
                            const nextHead = repo.state.HEAD?.commit || repo.state.HEAD?.name || null;
                            if (nextHead !== lastHead) {
                                lastHead = nextHead;
                                this._handleGitHeadChange({ repo, head: nextHead });
                            }
                        });
                        if (disposable) this._gitHeadWatchDisposables.push(disposable);
                    } catch { /* ignore */ }
                };

                if (Array.isArray(api.repositories)) {
                    api.repositories.forEach((repo) => registerRepo(repo));
                }
                if (typeof api.onDidOpenRepository === 'function') {
                    const disposable = api.onDidOpenRepository((repo) => registerRepo(repo));
                    if (disposable) this._gitHeadWatchDisposables.push(disposable);
                }
            } catch (err) {
                this._logger?.debug?.('Failed to register git HEAD watcher', err);
            }
        })();
    }

    refreshAll() {
        try {
            this._onDidChangeFileDecorations.fire(undefined);
            recordRefreshCall();
        } catch (error) {
            this._logger?.debug && this._logger.debug('refreshAll failed', error);
        }
    }

    applyPreviewSettings(settings) {
        try {
            if (settings && typeof settings === 'object') {
                this._previewSettings = settings;
                this._logger?.info && this._logger.info('Preview settings applied', settings);
            } else {
                this._previewSettings = null;
                this._logger?.info && this._logger.info('Preview settings cleared');
            }
            try { this.clearAllCaches(); } catch { /* ignore */ }
            this.refreshAll();
        } catch (error) {
            this._logger?.debug && this._logger.debug('applyPreviewSettings failed', error);
        }
    }

    refreshDecoration(uri) {
        try {
            try { this._clearFreshnessCacheForUri(uri); } catch { /* ignore */ }
            this._onDidChangeFileDecorations.fire(uri);
        } catch (error) {
            this._logger?.debug && this._logger.debug('refreshDecoration failed', error);
        }
    }

    clearDecoration(uri) {
        try {
            try { this._clearFreshnessCacheForUri(uri); } catch { /* ignore */ }
            const target = uri ? (typeof uri === 'string' ? uri : getUriPath(uri)) : '';
            const cacheKey = this._getCacheKey ? this._getCacheKey(uri) : buildCacheKey(target);
            try { if (this._decorationCache && typeof this._decorationCache.delete === 'function') this._decorationCache.delete(cacheKey); } catch { /* ignore */ }
            try { if (this._advancedCache && typeof this._advancedCache.delete === 'function') this._advancedCache.delete(cacheKey); } catch { /* ignore */ }
            try { this._onDidChangeFileDecorations.fire(uri); } catch { /* ignore */ }
        } catch (error) {
            this._logger?.debug && this._logger.debug('clearDecoration failed', error);
        }
    }

    _acquireDecorationFromPool({ badge, tooltip, color }) {
        try {
            const vscode = require('vscode');
            const deco = new vscode.FileDecoration(String(badge || ''), tooltip || undefined, color || undefined);
            // Some mocks / runtimes ignore constructor args — ensure color is always present on the instance
            try { if (color) deco.color = color; } catch (e) { /* ignore */ }
            return deco;
        } catch (e) {
            return { badge, tooltip, color };
        }
    }

    _storeDecorationInCache(cacheKey, decoration, fileLabel, uri, freshness) {
        try {
            if (this._forceCacheBypass) return;

            if (!this._decorationCache || typeof this._decorationCache.set !== 'function' || typeof this._decorationCache.size !== 'number') {
                try { this._decorationCache = new LazyHierarchicalDecorationCache(); } catch { /* ignore */ }
            }
            if (!this._decorationCache || typeof this._decorationCache.set !== 'function') return;

            if (typeof this._decorationCache.size === 'number' && this._decorationCache.size > this._maxCacheSize) {
                try { this._decorationCache.enforceLimit(this._maxCacheSize); } catch { /* ignore */ }
            }

            const cacheEntry = { decoration, timestamp: Date.now() };
            if (freshness) cacheEntry.freshness = freshness;
            if (uri) cacheEntry.uri = uri;
            try { this._decorationCache.set(cacheKey, cacheEntry); } catch { /* ignore */ }

            try { if (typeof this._monitorCachePressure === 'function') this._monitorCachePressure(); } catch (e) { this._logger?.debug?.('monitorCachePressure from store failed', e); }

            if (this._advancedCache) {
                try {
                    this._advancedCache.set(cacheKey, decoration, { ttl: this._cacheTimeout });
                    this._logger?.debug?.(`Stored in advanced cache: ${fileLabel}`);
                } catch (error) {
                    this._logger?.debug?.(`Failed to store in advanced cache: ${error.message}`);
                }
            }

            try {
                if (typeof this._maybeExtendCacheTimeout === 'function') this._maybeExtendCacheTimeout();
            } catch (err) {
                this._logger?.debug?.('maybeExtendCacheTimeout from store failed', err);
            }
        } catch (error) {
            this._logger?.debug?.('storeDecorationInCache failed', error);
        }
    }

    getMetrics() {
        const allocationTelemetry = {
            decorationPool: { allocations: 0, reuses: 0, reusePercent: '0%' },
            badgeFlyweight: { allocations: 0, reuses: 0, reusePercent: '0%' },
            readableFlyweight: { allocations: 0, reuses: 0, reusePercent: '0%' }
        };
        const cacheHits = this._metrics?.cacheHits || 0;
        const cacheMisses = this._metrics?.cacheMisses || 0;
        const cacheHitRate = cacheHits + cacheMisses > 0 ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2) + '%' : '0.00%';
        return {
            totalDecorations: this._metrics?.totalDecorations || 0,
            cacheSize: (this._decorationPool && this._decorationPool.size) || 0,
            cacheHits,
            cacheMisses,
            cacheHitRate,
            workspaceScale: this._workspaceScale || 'unknown',
            allocationTelemetry,
            performanceTiming: {
                avgGitBlameMs: this._metrics?.gitBlameCalls ? (this._metrics.gitBlameTimeMs / this._metrics.gitBlameCalls).toFixed(1) : '0.0',
                avgFileStatMs: this._metrics?.fileStatCalls ? (this._metrics.fileStatTimeMs / this._metrics.fileStatCalls).toFixed(1) : '0.0',
                gitBlameCalls: this._metrics?.gitBlameCalls || 0,
                fileStatCalls: this._metrics?.fileStatCalls || 0
            },
            cacheDebugging: { cacheNamespace: this._cacheNamespace }
        };
    }

    // Testing / diagnostics helpers
    forceRefreshAllDecorations() {
        try {
            this._logger?.info && this._logger.info('\u{1F504} Force refreshing ALL decorations...');
            try { if (this._decorationCache && typeof this._decorationCache.clear === 'function') this._decorationCache.clear(); } catch {}
            try { if (this._decorationPool && typeof this._decorationPool.clear === 'function') this._decorationPool.clear(); } catch {}
            try { if (this._advancedCache && typeof this._advancedCache.clear === 'function') this._advancedCache.clear(); } catch {}
            try { this._onDidChangeFileDecorations.fire(undefined); } catch (e) { /* ignore */ }
            this._logger?.info && this._logger.info('\u{1F504} Triggered global decoration refresh');
        } catch (error) {
            this._logger?.debug && this._logger.debug('forceRefreshAllDecorations failed', error);
        }
    }

    startProviderCallMonitoring() {
        try {
            // No-op if provider already disposed
            if (this._isDisposed) {
                this._logger?.debug && this._logger.debug('startProviderCallMonitoring called after dispose - no-op');
                return;
            }

            // Idempotent: if already wrapped, just reset counters (avoid double-wrapping)
            if (this._providerMonitoringWrapped) {
                this.Vt = 0;
                this.Re = new Set();
                this._logger?.info && this._logger.info('\u{1F4CA} Provider call monitoring restarted (counters reset)');
                return;
            }

            this._providerMonitoringWrapped = true;
            this.Vt = 0;
            this.Re = new Set();

            const original = this.provideFileDecoration.bind(this);
            this._providerMonitoringOriginal = original;

            this.provideFileDecoration = async (uri, token) => {
                try {
                    this.Vt = (this.Vt || 0) + 1;
                    const p = getUriPath(uri) || (uri && typeof uri.toString === 'function' ? uri.toString(true) : 'unknown');
                    this.Re.add(normalizePath(p));
                    this._logger?.info && this._logger.info(`\u{1F50D} Provider called ${this.Vt} times for: ${describeFile(uri || p)}`);
                } catch (e) { /* ignore monitoring errors */ }
                return original(uri, token);
            };
            this._logger?.info && this._logger.info('\u{1F4CA} Started provider call monitoring');
        } catch (error) {
            this._logger?.debug && this._logger.debug('startProviderCallMonitoring failed', error);
        }
    }

    getProviderCallStats() {
        try {
            return {
                totalCalls: this.Vt || 0,
                uniqueFiles: this.Re ? this.Re.size : 0,
                calledFiles: this.Re ? Array.from(this.Re) : []
            };
        } catch (e) {
            return { totalCalls: 0, uniqueFiles: 0, calledFiles: [] };
        }
    }

    // NOTE: many instance methods intentionally omitted in this chunk file to keep the PR focused. The real project keeps full impl here.

    async dispose() {
        if (this._isDisposed) return;
        this._isDisposed = true;
        this._disposed = true;
        try { if (this._telemetryReportTimer) { clearTimeout(this._telemetryReportTimer); this._telemetryReportTimer = null; } } catch {}
        try { if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; } } catch {}
        // Cancel any pending incremental refresh timers so they don't queue FS operations after dispose
        try {
            if (this._incrementalRefreshTimers && this._incrementalRefreshTimers.size) {
                for (const t of this._incrementalRefreshTimers) clearTimeout(t);
                this._incrementalRefreshTimers.clear();
            }
            this._incrementalRefreshInProgress = false;
            this._scheduledRefreshPending = false;
        } catch (e) { /* ignore */ }
        try { if (this._watcherCleanupTimer) { clearTimeout(this._watcherCleanupTimer); this._watcherCleanupTimer = null; } } catch {}
        try { if (this._workspaceFolderChangeTimer) { clearTimeout(this._workspaceFolderChangeTimer); this._workspaceFolderChangeTimer = null; } } catch {}

        // Ensure watcher manager and any watcher timers are fully torn down to avoid leaking event-loop handles
        try {
            try { this._disposeFileWatchers({ permanent: true }); } catch (e) { /* ignore */ }
            if (this._watcherManager && typeof this._watcherManager.disposeFileWatchers === 'function') {
                try { this._watcherManager.disposeFileWatchers({ permanent: true }); } catch (e) { /* ignore */ }
            }
            this._watcherManager = null;
        } catch (e) { /* ignore */ }
        try { if (this._workspaceScanWatchdogTimer) { clearTimeout(this._workspaceScanWatchdogTimer); this._workspaceScanWatchdogTimer = null; } } catch {}

        // Dispose event emitters and disposables
        try { if (this._onDidChangeFileDecorations && typeof this._onDidChangeFileDecorations.dispose === 'function') this._onDidChangeFileDecorations.dispose(); } catch (e) { /* ignore */ }
        try { if (Array.isArray(this._watcherDisposables)) { for (const d of this._watcherDisposables) { try { d.dispose && d.dispose(); } catch {} } this._watcherDisposables.length = 0; } } catch {}
        try { if (Array.isArray(this._gitHeadWatchDisposables)) { for (const d of this._gitHeadWatchDisposables) { try { d.dispose && d.dispose(); } catch {} } this._gitHeadWatchDisposables.length = 0; } } catch {}
        try { if (Array.isArray(this._viewportDisposables)) { for (const d of this._viewportDisposables) { try { d.dispose && d.dispose(); } catch {} } this._viewportDisposables.length = 0; } } catch {}

        // Dispose known managers if present
        const maybeDispose = async (obj) => { try { if (obj && typeof obj.dispose === 'function') await obj.dispose(); } catch (e) { /* ignore */ } };
        await maybeDispose(this._advancedCache);
        await maybeDispose(this._batchProcessor);
        await maybeDispose(this._viewportManager);
        await maybeDispose(this._gitInsightsManager);
        await maybeDispose(this._workspaceIntelligence);
        await maybeDispose(this._smartWatcherFallbackManager);
        await maybeDispose(this._exportReportingManager);
        await maybeDispose(this._workspaceTemplatesManager);

        // Dispose file watchers
        try {
            if (this._fileWatchers && typeof this._fileWatchers.forEach === 'function') {
                this._fileWatchers.forEach((w) => { try { w && typeof w.dispose === 'function' && w.dispose(); } catch (e) {} });
                this._fileWatchers.clear();
            }
            if (this._fileWatcher && typeof this._fileWatcher.dispose === 'function') { try { this._fileWatcher.dispose(); } catch (e) {} this._fileWatcher = undefined; }
            if (this._dynamicWatchers && typeof this._dynamicWatchers.forEach === 'function') { this._dynamicWatchers.forEach((v) => { try { v?.watcher?.dispose && v.watcher.dispose(); } catch (e) {} }); this._dynamicWatchers.clear(); }
        } catch (e) { /* ignore */ }

        // Clear caches and queues
        try { if (this._decorationCache && typeof this._decorationCache.clear === 'function') this._decorationCache.clear(); } catch (e) {}
        try { if (this._decorationPool && typeof this._decorationPool.clear === 'function') this._decorationPool.clear(); } catch (e) {}
        try { if (this._badgeFlyweightCache && typeof this._badgeFlyweightCache.clear === 'function') this._badgeFlyweightCache.clear(); } catch (e) {}
        try { if (this._readableDateFlyweightCache && typeof this._readableDateFlyweightCache.clear === 'function') this._readableDateFlyweightCache.clear(); } catch (e) {}
        try { this._operationQueue && this._operationQueue.clear && this._operationQueue.clear(); } catch (e) {}
        try { this._globalConcurrencyQueue && this._globalConcurrencyQueue.length && (this._globalConcurrencyQueue.length = 0); } catch (e) {}

        // Null out heavy references
        try { this._advancedCache = null; this._batchProcessor = null; this._viewportManager = null; this._gitInsightsManager = null; this._workspaceIntelligence = null; } catch (e) {}

        // Detach workspace listeners
        try { if (this._workspaceFolderListener && typeof this._workspaceFolderListener.dispose === 'function') { this._workspaceFolderListener.dispose(); this._workspaceFolderListener = null; } } catch (e) {}
        try { if (this._configurationWatcher && typeof this._configurationWatcher.dispose === 'function') { this._configurationWatcher.dispose(); this._configurationWatcher = null; } } catch (e) {}

        // Restore any monitoring wrapper previously applied so callers don't retain wrapped functions
        try {
            if (this._providerMonitoringOriginal && typeof this._providerMonitoringOriginal === 'function') {
                try { this.provideFileDecoration = this._providerMonitoringOriginal; } catch (e) { /* ignore */ }
                this._providerMonitoringOriginal = null;
                this._providerMonitoringWrapped = false;
                this.Vt = 0;
                this.Re = new Set();
            }
        } catch (e) { /* ignore */ }

        // Clear cached references to optional advanced chunks to avoid retaining heavy modules after dispose
        try { this._decorationsAdvancedChunk = null; this._decorationsAdvancedChunkPromise = null; } catch (e) { /* ignore */ }

        this._logger?.info && this._logger.info('FileDateDecorationProvider disposed');
    }
}


// Export the chunk's full provider implementation (alias for compatibility)
module.exports = { FileDateDecorationProviderImpl: FileDateDecorationProviderImpl, FileDateDecorationProvider: FileDateDecorationProviderImpl };
