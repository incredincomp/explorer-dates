const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { getLocalization } = require('./utils/localization');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
// Theme and accessibility managers loaded conditionally via ui-adapters chunk
const { formatFileSize, trimBadge } = require('./utils/formatters');
const { getFileName, getExtension, getCacheKey: buildCacheKey, normalizePath, getUriPath } = require('./utils/pathUtils');
const {
    DEFAULT_CACHE_TIMEOUT,
    DEFAULT_MAX_CACHE_SIZE,
    MONTH_ABBREVIATIONS,
    GLOBAL_STATE_KEYS,
    DEFAULT_DECORATION_POOL_SIZE,
    DEFAULT_FLYWEIGHT_CACHE_SIZE,
    WORKSPACE_SCALE_LARGE_THRESHOLD,
    WORKSPACE_SCALE_EXTREME_THRESHOLD,
    WORKSPACE_SCAN_MAX_RESULTS
} = require('./constants');
const { isWebEnvironment } = require('./utils/env');
const { ensureDate } = require('./utils/dateHelpers');
const { SecurityValidator, SecureFileOperations, detectSecurityEnvironment } = require('./utils/securityUtils');
const { setCachedWorkspaceMetrics } = require('./utils/workspaceDetection');
const DISABLE_GIT_FEATURES = process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES === '1';

// Conditional path import for Node.js environments
let nodePath = null;
try {
    if (!isWebEnvironment()) {
        nodePath = require('path');
    }
} catch {
    nodePath = null;
}

// Browser-compatible path utilities
const pathCompat = {
    basename: (filePath) => {
        if (nodePath) {
            return nodePath.basename(filePath);
        }
        // Browser fallback
        const normalized = filePath.replace(/\\/g, '/');
        const lastSlash = normalized.lastIndexOf('/');
        return lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);
    },
    dirname: (filePath) => {
        if (nodePath) {
            return nodePath.dirname(filePath);
        }
        // Browser fallback
        const normalized = filePath.replace(/\\/g, '/');
        const lastSlash = normalized.lastIndexOf('/');
        return lastSlash === -1 ? '.' : normalized.substring(0, lastSlash);
    }
};
const CONFIG_DEFAULT_CACHE_TIMEOUT = 30000;
const CACHE_NAMESPACE_SEPARATOR = '::';

const DEFAULT_DYNAMIC_WATCHER_LIMIT = Number(process.env.EXPLORER_DATES_MAX_DYNAMIC_WATCHERS || 200);
const DEFAULT_WATCHER_INACTIVITY_MS = Number(process.env.EXPLORER_DATES_WATCHER_TTL_MS || 10 * 60 * 1000);
const DEFAULT_SMART_WATCHER_EXTENSIONS = [
    'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts', 'vue',
    'py', 'go', 'rb', 'rs', 'java', 'kt', 'swift', 'cs', 'cpp', 'c',
    'php', 'scala', 'sql', 'md', 'mdx', 'json', 'jsonc', 'yml', 'yaml',
    'toml', 'ini', 'txt', 'html', 'css', 'scss'
];
const SMART_WATCHER_PRIORITY = new Map([
    ['src', 100],
    ['app', 95],
    ['apps', 95],
    ['packages', 90],
    ['services', 85],
    ['service', 80],
    ['client', 75],
    ['clients', 70],
    ['server', 70],
    ['servers', 65],
    ['lib', 65],
    ['libs', 60],
    ['api', 60],
    ['apis', 60],
    ['components', 55],
    ['modules', 55],
    ['feature', 50],
    ['features', 50],
    ['extensions', 45],
    ['scripts', 45],
    ['tools', 45],
    ['examples', 40],
    ['docs', 35],
    ['config', 35],
    ['test', 30],
    ['tests', 30],
    ['spec', 30],
    ['specs', 30],
    ['demo', 25],
    ['demos', 25]
]);

const WORKSPACE_SCAN_TIMEOUT_MS = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_TIMEOUT || 7000);
const WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT = WORKSPACE_SCALE_EXTREME_THRESHOLD;
const ROOT_CACHE_BUCKET = '__root__';
const VIEWPORT_DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const VIEWPORT_STANDARD_WINDOW_MS = 10 * 60 * 1000;
const VIEWPORT_MINIMAL_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_VIEWPORT_HISTORY_LIMIT = Number(process.env.EXPLORER_DATES_VIEWPORT_HISTORY_LIMIT || 400);
const FEATURE_LEVELS = ['full', 'enhanced', 'standard', 'minimal'];
const DEFAULT_INDEXER_MAX_FILES = Math.max(100, Number(process.env.EXPLORER_DATES_INDEXER_MAX_FILES || 2000));
const SECURITY_EXTRA_PATHS_ENV = 'EXPLORER_DATES_SECURITY_EXTRA_PATHS';
const DEFAULT_SECURITY_THROTTLE_MS = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_THROTTLE_MS || 5000);
const SECURITY_WARNING_CACHE_LIMIT = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_CACHE || 500);
const DEFAULT_SECURITY_MAX_WARNINGS = Number(process.env.EXPLORER_DATES_SECURITY_MAX_WARNINGS_PER_FILE ?? 1);

const describeFile = (input = '') => {
    const pathValue = typeof input === 'string' ? input : getUriPath(input);
    const normalized = normalizePath(pathValue);
    return getFileName(normalized) || normalized || 'unknown';
};

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

const isWebBuild = process.env.VSCODE_WEB === 'true';

/**
 * Provides file decorations showing last modified dates in the Explorer
 */
class FileDateDecorationProvider {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        
        // Enhanced cache to avoid repeated file system calls
        this._decorationCache = new HierarchicalDecorationCache();
        
        // Concurrency control for thread safety
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
        this._enableDecorationPool = process.env.EXPLORER_DATES_ENABLE_DECORATION_POOL !== '0';
        this._enableFlyweights = process.env.EXPLORER_DATES_ENABLE_FLYWEIGHTS !== '0';
        this._lightweightMode = process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE === '1';
        this._memorySheddingEnabled = process.env.EXPLORER_DATES_MEMORY_SHEDDING === '1';
        this._memorySheddingThresholdMB = Number(process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB || 3);
        this._memorySheddingActive = false;
        this._memoryBaselineMB = this._memorySheddingEnabled ? this._safeHeapUsedMB() : 0;
        this._memoryShedCacheLimit = Number(process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT || 1000);
        this._memoryShedRefreshIntervalMs = Number(process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS || 60000);
        this._refreshIntervalOverride = null;
        this._forceCacheBypass = process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS === '1';
        this._lightweightPurgeInterval = Number(process.env.EXPLORER_DATES_LIGHTWEIGHT_PURGE_INTERVAL || 400);
        this._isWeb = isWebBuild || isWebEnvironment();
        this._baselineDesktopCacheTimeout = DEFAULT_CACHE_TIMEOUT * 4; // 8 minutes baseline
        this._maxDesktopCacheTimeout = this._baselineDesktopCacheTimeout; // Keep at 8 minutes max, don't extend to 16
        this._lastCacheTimeoutBoostLookups = 0;
        this._maxCacheSize = DEFAULT_MAX_CACHE_SIZE;
        this._fileSystem = fileSystem;
        this._gitAvailable = !this._isWeb; // Will be checked when git insights loads
        this._gitWarningShown = false;
        this._gitInsightsManager = null; // Lazy loaded when git features needed
        this._gitInsightsLoading = null; // Promise for loading git insights
        
        // Allocation telemetry for dev builds
        this._allocationTelemetryEnabled = process.env.NODE_ENV === 'development' || process.env.EXPLORER_DATES_TELEMETRY === '1';
        this._telemetryReportInterval = Number(process.env.EXPLORER_DATES_TELEMETRY_INTERVAL_MS || 60000); // 1 minute default
        this._telemetryReportTimer = null;
        
        // Cache performance tracking
        this._cacheNamespace = null;
        this._cacheKeyStats = new Map(); // Track cache key usage patterns
        this._viewportVisibleFiles = new Set();
        this._viewportRecentFiles = new Map();
        this._viewportHistoryLimit = DEFAULT_VIEWPORT_HISTORY_LIMIT;
        this._viewportWindowMs = VIEWPORT_DEFAULT_WINDOW_MS;
        this._lastViewportCleanup = Date.now();
        this._viewportDisposables = [];
        this._featureLevel = 'full';
        this._featureProfile = null;
        
        // Get logger and localization instances
        this._logger = getLogger();
        this._l10n = getLocalization();
        
        // Initialize performance systems
        this._workspaceIntelligence = null;
        this._batchProcessor = null; // Lazy loaded based on progressiveLoading setting
        this._batchProcessorModule = null; // Cache for the loaded module
        this._progressiveLoadingJobs = new Set();
        this._progressiveLoadingEnabled = false;
        this._decorationsAdvancedChunk = null; // Lazy-loaded optional systems
        this._decorationsAdvancedChunkPromise = null;
        this._advancedCache = null; // Will be initialized with context
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
        this._workspaceFileCount = null;
        this._workspaceScale = 'unknown';
        this._logWatcherEvents = process.env.EXPLORER_DATES_LOG_WATCHERS === '1';
        this._securityEnvironment = detectSecurityEnvironment();
        this._securityEnforceWorkspaceBoundaries = true;
        this._securityAllowedExtraPaths = [];
        this._securityAllowTestPaths = true;
        this._securityRelaxedForTests = false;
        this._securityLoggedTestRelaxation = false;
        this._securityWarningLog = new Map();
        this._securityLogThrottleMs = DEFAULT_SECURITY_THROTTLE_MS;
        this._securityMaxWarningsPerFile = Number.isFinite(DEFAULT_SECURITY_MAX_WARNINGS)
            ? Math.max(0, DEFAULT_SECURITY_MAX_WARNINGS)
            : 1;
        this._workspaceFolderListener = typeof vscode.workspace.onDidChangeWorkspaceFolders === 'function'
            ? vscode.workspace.onDidChangeWorkspaceFolders((event) => this._handleWorkspaceFoldersChanged(event))
            : null;
        this._workspaceFolderChangeTimer = null;
        this._workspaceSizeCheckPromise = null;
        this._workspaceScanPromise = null;
        this._workspaceScanWatchdogTimer = null;
        this._workspaceScanTimedOut = false;
        this._watcherSetupToken = 0;
        this._isDisposed = false;
        
        // Initialize UX enhancement systems (conditionally loaded)
        this._themeIntegration = null;
        this._accessibility = null;
        this._uiAdaptersLoaded = false;
        this._stressLogOptions = {
            profile: 'stress',
            throttleKey: 'decorations:request',
            throttleLimit: Number(process.env.EXPLORER_DATES_LOG_INFO_LIMIT || 50)
        };
        
        // Performance metrics
        this._metrics = {
            totalDecorations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            cacheEvictions: 0,
            errors: 0,
            gitBlameTimeMs: 0,
            gitBlameCalls: 0,
            fileStatTimeMs: 0,
            fileStatCalls: 0,
            viewportPriorityDecorations: 0,
            viewportBackgroundDecorations: 0
        };

        // Periodic refresh timer for time-based badges
        this._refreshTimer = null;
        this._refreshInterval = 60000; // 1 minute default
        this._incrementalRefreshTimers = new Set();
        this._incrementalRefreshInProgress = false;
        this._scheduledRefreshPending = false; // Debounce rapid refresh requests
        
        // Check if performance mode is enabled
        const config = vscode.workspace.getConfiguration('explorerDates');
        const configuredTimeout = config.get('cacheTimeout', CONFIG_DEFAULT_CACHE_TIMEOUT);
        this._hasCustomCacheTimeout = this._detectCacheTimeoutOverride(config, configuredTimeout);
        this._cacheTimeout = this._resolveCacheTimeout(configuredTimeout);
        this._performanceModeExplicit = config.get('performanceMode', false);
        this._performanceModeAuto = false;
        this._performanceMode = this._performanceModeExplicit;
        this._updateCacheNamespace(config);
        this._updateSecurityBoundarySettings(config);
        this._applyReuseCapacitySettings(config);
        if (this._lightweightMode) {
            this._performanceMode = true;
            this._enableDecorationPool = false;
            this._enableFlyweights = false;
            this._cacheTimeout = Math.min(this._cacheTimeout, 5000);
            this._maxCacheSize = Math.min(this._maxCacheSize, 64);
            this._logger.info('Lightweight mode: decoration pooling and flyweight caches disabled; cache timeout capped at 5s');
        }
        
        // Watch for file changes to update decorations (disabled in performance mode)
        if (!this._performanceMode) {
            this._setupFileWatcher();
        }
        
        // Listen for configuration changes
        this._setupConfigurationWatcher();
        
        // Start periodic refresh for time-based badges (disabled in performance mode)
        if (!this._performanceMode) {
            this._setupPeriodicRefresh();
        }

        this._applyFeatureLevel(this._determineFeatureLevel(config), 'initialization');
        this._setupViewportAwareness();
        
        this._logger.info(`FileDateDecorationProvider initialized (performanceMode: ${this._performanceMode})`);
        if (this._forceCacheBypass) {
            this._logger.warn('Force cache bypass mode enabled - decoration caches will be skipped');
        }
        if (!this._enableDecorationPool) {
            this._logger.warn('Decoration pool disabled via EXPLORER_DATES_ENABLE_DECORATION_POOL=0');
        }
        if (!this._enableFlyweights) {
            this._logger.warn('Flyweight caches disabled via EXPLORER_DATES_ENABLE_FLYWEIGHTS=0');
        }
        if (this._lightweightMode) {
            this._logger.warn('Lightweight mode enabled via EXPLORER_DATES_LIGHTWEIGHT_MODE=1 (performanceMode forced on)');
        }
        if (this._memorySheddingEnabled) {
            this._logger.warn(`Memory shedding enabled (threshold ${this._memorySheddingThresholdMB} MB); will stretch refresh interval and shrink cache if exceeded.`);
        }

        // Memory diagnostics + cache pressure monitors
        this._memorySheddingEvents = [];
        // Diagnostic soaks often bypass caches; raise the soft threshold slightly to avoid noise while keeping the hard limit intact.
        this._softHeapAlertThresholdMB = Number(process.env.EXPLORER_DATES_SOFT_HEAP_ALERT_MB || 2);
        this._consecutiveSoftHeapBreaches = 0;
        this._softHeapAlertLogged = false;
        this._cachePressureThreshold = Number(process.env.EXPLORER_DATES_CACHE_PRESSURE_RATIO || 0.7);
        this._cachePressureLogged = false;

        // Preview settings for onboarding
        this._previewSettings = null;
        this._extensionContext = null;
        
        // Initialize UI adapters based on current configuration
        this._initializeUIAdapters();
    }

    /**
     * Initialize UI adapters (theme and accessibility managers) conditionally
     * @private
     */
    async _initializeUIAdapters() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const autoThemeAdaptation = config.get('autoThemeAdaptation', true);
        const accessibilityMode = config.get('accessibilityMode', false);
        
        // Only load UI adapters if at least one feature is enabled
        if (autoThemeAdaptation || accessibilityMode) {
            try {
                const uiAdapters = await this._loadUIAdaptersChunk();
                if (uiAdapters) {
                    this._themeIntegration = autoThemeAdaptation ? uiAdapters.themeManager : null;
                    this._accessibility = accessibilityMode ? uiAdapters.accessibilityManager : null;
                    this._uiAdaptersLoaded = true;
                    
                    this._logger.debug(`🔌 UI adapters loaded: theme=${!!this._themeIntegration}, accessibility=${!!this._accessibility}`);
                }
            } catch (error) {
                this._logger.error('Failed to load UI adapters chunk:', error);
                // Graceful fallback - continue without UI adapters
                this._themeIntegration = null;
                this._accessibility = null;
                this._uiAdaptersLoaded = false;
            }
        } else {
            this._logger.debug('🔌 UI adapters not loaded (features disabled)');
        }
    }

    /**
     * Dynamically load UI adapters chunk
     * @private
     * @returns {Promise<any|null>}
     */
    async _loadUIAdaptersChunk() {
        try {
            const featureFlags = require('./featureFlags');
            const module = await featureFlags.uiAdapters();
            if (!module) {
                return null;
            }
            if (typeof module.createUIAdapters === 'function') {
                return await module.createUIAdapters();
            }
            return module;
        } catch (error) {
            this._logger.warn('UI adapters chunk not available:', error.message);
            return null;
        }
    }

    /**
     * Dynamically load git insights chunk when git features are needed
     * @private
     * @returns {Promise<Object|null>}
     */
    async _loadGitInsightsChunk() {
        if (DISABLE_GIT_FEATURES) {
            this._gitAvailable = false;
            return null;
        }

        // Return existing loading promise if already in progress
        if (this._gitInsightsLoading) {
            return this._gitInsightsLoading;
        }
        
        // Return existing manager if already loaded
        if (this._gitInsightsManager) {
            return this._gitInsightsManager;
        }

        this._gitInsightsLoading = (async () => {
            try {
                const featureFlags = require('./featureFlags');
                const gitInsightsChunk = await featureFlags.gitInsights();
                if (!gitInsightsChunk) {
                    throw new Error('Git insights chunk failed to load');
                }
                
                let getGitInsightsManagerFn = null;
                
                if (typeof gitInsightsChunk === 'function') {
                    getGitInsightsManagerFn = gitInsightsChunk;
                } else if (gitInsightsChunk && typeof gitInsightsChunk.getGitInsightsManager === 'function') {
                    getGitInsightsManagerFn = gitInsightsChunk.getGitInsightsManager;
                } else if (gitInsightsChunk && typeof gitInsightsChunk.default === 'function') {
                    getGitInsightsManagerFn = gitInsightsChunk.default;
                }

                if (typeof getGitInsightsManagerFn !== 'function') {
                    throw new Error('Git insights chunk missing getGitInsightsManager export');
                }

                this._gitInsightsManager = getGitInsightsManagerFn();
                if (!this._gitInsightsManager || typeof this._gitInsightsManager.initialize !== 'function') {
                    throw new Error('Git insights manager factory returned invalid instance');
                }
                
                // Initialize with current settings
                const config = vscode.workspace.getConfiguration('explorerDates');
                await this._gitInsightsManager.initialize({
                    enableWorker: config.get('enableWorkerThreads', true),
                    enableWasm: config.get('enableWasmDigest', true)
                });
                
                // Update git availability based on manager check
                this._gitAvailable = await this._gitInsightsManager.isGitAvailable();
                
                this._logger.debug('🔧 Git insights manager loaded and initialized');
                return this._gitInsightsManager;
            } catch (error) {
                this._logger.error('Failed to load git insights:', error);
                this._gitInsightsManager = null;
                this._gitAvailable = false;
                return null;
            } finally {
                this._gitInsightsLoading = null;
            }
        })();
        
        return this._gitInsightsLoading;
    }

    /**
     * Reload UI adapters when configuration changes
     * @private
     */
    async _reloadUIAdapters() {
        // Dispose existing managers
        if (this._themeIntegration && typeof this._themeIntegration.dispose === 'function') {
            this._themeIntegration.dispose();
        }
        if (this._accessibility && typeof this._accessibility.dispose === 'function') {
            this._accessibility.dispose();
        }
        
        // Reset state
        this._themeIntegration = null;
        this._accessibility = null;
        this._uiAdaptersLoaded = false;
        
        // Reinitialize with current configuration
        await this._initializeUIAdapters();
    }

    /**
     * Apply transient preview settings (do not persist to user settings)
     * @param {Object|null} settings
     */
    applyPreviewSettings(settings) {
        const wasInPreviewMode = !!this._previewSettings;
        
        if (settings && typeof settings === 'object') {
            this._previewSettings = Object.assign({}, settings);
            this._logger.info('🔄 Applied preview settings', this._previewSettings);
        } else {
            this._previewSettings = null;
            this._logger.info('🔄 Cleared preview settings');
        }

        // Always clear caches when entering or exiting preview mode
        const memorySize = this._decorationCache.size;
        this._decorationCache.clear();
        this._clearDecorationPool('preview-mode-change');
        this._logger.info(`🗑️ Cleared memory cache (${memorySize} items) for preview mode change`);
        
        if (this._advancedCache) {
            try {
                if (typeof this._advancedCache.clear === 'function') {
                    this._advancedCache.clear();
                    this._logger.info('🗑️ Cleared advanced cache for preview mode change');
                } else {
                    this._logger.warn('⚠️ Advanced cache does not support clear operation');
                }
            } catch (error) {
                this._logger.warn('⚠️ Failed to clear advanced cache:', error.message);
            }
        }

        // Log the mode transition
        if (this._previewSettings && !wasInPreviewMode) {
            this._logger.info('🎭 Entered preview mode - caching disabled');
        } else if (!this._previewSettings && wasInPreviewMode) {
            this._logger.info('🎭 Exited preview mode - caching re-enabled');
        }

        // Trigger an immediate refresh so the changes are visible
        this._onDidChangeFileDecorations.fire(undefined);
        this._logger.info('🔄 Fired decoration refresh event for preview change');
    }

    /**
     * Test decoration provider functionality
     */
    async testDecorationProvider() {
        this._logger.info('🧪 Testing decoration provider functionality...');
        
        // Test with a simple known file
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this._logger.error('❌ No workspace folders available for testing');
            return;
        }
        
        const testFile = vscode.Uri.joinPath(workspaceFolders[0].uri, 'package.json');
        try {
            const decoration = await this.provideFileDecoration(testFile);
            this._logger.info('🧪 Test decoration result:', {
                file: 'package.json',
                success: !!decoration,
                badge: decoration?.badge,
                hasTooltip: !!decoration?.tooltip,
                hasColor: !!decoration?.color
            });
            
            // Force a refresh to see if that helps
            this._onDidChangeFileDecorations.fire(testFile);
            this._logger.info('🔄 Fired decoration change event for test file');
            
        } catch (error) {
            this._logger.error('❌ Test decoration failed:', error);
        }
    }

    /**
     * Force refresh all decorations - triggers VS Code to re-request them
     */
    forceRefreshAllDecorations() {
        this._logger.info('🔄 Force refreshing ALL decorations...');
        this._cancelIncrementalRefreshTimers();
        
        // Clear all caches first
        this._decorationCache.clear();
        this._clearDecorationPool('force-refresh');
        if (this._advancedCache) {
            this._advancedCache.clear();
        }
        
        // Fire change event with undefined to refresh all decorations
        this._onDidChangeFileDecorations.fire(undefined);
        
        this._logger.info('🔄 Triggered global decoration refresh');
    }

    /**
     * Debug method to check if VS Code is calling our provider
     */
    startProviderCallMonitoring() {
        this._providerCallCount = 0;
        this._providerCallFiles = new Set();
        
        // Hook into the provide method to count calls
        const originalProvide = this.provideFileDecoration.bind(this);
        this.provideFileDecoration = async (uri, token) => {
            this._providerCallCount++;
            const trackedPath = getUriPath(uri) || uri?.toString(true) || 'unknown';
            this._providerCallFiles.add(normalizePath(trackedPath));
            this._logger.info(`🔍 Provider called ${this._providerCallCount} times for: ${describeFile(uri || trackedPath)}`);
            return await originalProvide(uri, token);
        };
        
        this._logger.info('📊 Started provider call monitoring');
    }

    /**
     * Get provider call statistics
     */
    getProviderCallStats() {
        return {
            totalCalls: this._providerCallCount || 0,
            uniqueFiles: this._providerCallFiles ? this._providerCallFiles.size : 0,
            calledFiles: this._providerCallFiles ? Array.from(this._providerCallFiles) : []
        };
    }

    /**
     * Check workspace size and adjust internal scaling (no auto prompts)
     */
    async checkWorkspaceSize() {
        if (this._workspaceSizeCheckPromise) {
            return this._workspaceSizeCheckPromise;
        }
        if (!this._workspaceScanPromise) {
            this._workspaceScanTimedOut = false;
            const scanPromise = this._performWorkspaceSizeCheck()
                .then((result) => {
                    if (this._workspaceScanTimedOut) {
                        this._workspaceScanTimedOut = false;
                        this._logger.info('Workspace size scan completed after watchdog fallback; applied actual workspace metrics', {
                            workspaceFileCount: this._workspaceFileCount,
                            workspaceScale: this._workspaceScale
                        });
                    }
                    return result;
                })
                .catch((error) => {
                    this._logger.debug('Workspace size check failed (non-critical):', error);
                });
            this._workspaceScanPromise = scanPromise.finally(() => {
                this._workspaceScanPromise = null;
            });
        }

        const watchdogPromise = this._startWorkspaceScanWatchdog();
        const racePromises = watchdogPromise
            ? [this._workspaceScanPromise, watchdogPromise]
            : [this._workspaceScanPromise];

        this._workspaceSizeCheckPromise = Promise.race(racePromises).finally(() => {
            this._clearWorkspaceScanWatchdog();
            this._workspaceSizeCheckPromise = null;
        });

        return this._workspaceSizeCheckPromise;
    }

    async _findWorkspaceFilesWithTimeout(maxResults) {
        const timeout = Number.isFinite(WORKSPACE_SCAN_TIMEOUT_MS) ? WORKSPACE_SCAN_TIMEOUT_MS : 0;
        const scanPromise = vscode.workspace.findFiles('**/*', null, maxResults);

        if (!timeout || timeout <= 0) {
            return scanPromise;
        }

        try {
            return await new Promise((resolve, reject) => {
                let timeoutHandle = null;
                const complete = (result, isError = false) => {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                        timeoutHandle = null;
                    }
                    if (isError) {
                        reject(result);
                    } else {
                        resolve(result);
                    }
                };

                timeoutHandle = setTimeout(() => complete(null), timeout);
                scanPromise.then(
                    (result) => complete(result),
                    (error) => complete(error, true)
                );
            });
        } catch (error) {
            this._logger.warn('Workspace scan failed, assuming large workspace', { error: error.message });
            return null;
        }
    }

    _startWorkspaceScanWatchdog() {
        if (this._workspaceScanTimedOut) {
            return Promise.resolve();
        }

        const configuredMs = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS);
        const baseTimeout = Number.isFinite(WORKSPACE_SCAN_TIMEOUT_MS) && WORKSPACE_SCAN_TIMEOUT_MS > 0
            ? WORKSPACE_SCAN_TIMEOUT_MS
            : 5000;
        const derivedMs = Number.isFinite(configuredMs)
            ? configuredMs
            : Math.min(20000, Math.max(3000, baseTimeout + 2000));

        if (!Number.isFinite(derivedMs) || derivedMs <= 0) {
            return null;
        }

        if (this._workspaceScanWatchdogTimer) {
            clearTimeout(this._workspaceScanWatchdogTimer);
        }

        return new Promise((resolve) => {
            this._workspaceScanWatchdogTimer = setTimeout(() => {
                this._workspaceScanWatchdogTimer = null;
                this._workspaceScanTimedOut = true;
                this._workspaceFileCount = WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT;
                this._workspaceScale = 'extreme';
                try {
                    const config = vscode.workspace.getConfiguration('explorerDates');
                    this._applyFeatureLevel(this._determineFeatureLevel(config), 'workspace-scale-watchdog');
                } catch {
                    this._applyFeatureLevel(this._determineFeatureLevel(), 'workspace-scale-watchdog');
                }
                this._logger.warn(`Workspace size check exceeded ${derivedMs}ms; forcing extreme scale fallback`);
                resolve();
            }, derivedMs);
        });
    }

    _clearWorkspaceScanWatchdog() {
        if (this._workspaceScanWatchdogTimer) {
            clearTimeout(this._workspaceScanWatchdogTimer);
            this._workspaceScanWatchdogTimer = null;
        }
    }

    async _performWorkspaceSizeCheck() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const forceEnable = config.get('forceEnableForLargeWorkspaces', false);
        const performanceMode = config.get('performanceMode', false);
        const suppressPrompt = forceEnable || performanceMode;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        this._logger.info('Checking workspace size for large workspace detection...');

        const files = await this._findWorkspaceFilesWithTimeout(WORKSPACE_SCAN_MAX_RESULTS);
        const timedOut = !Array.isArray(files);
        const fileCount = timedOut ? WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT : files.length;

        if (timedOut) {
            const timeoutMsg = WORKSPACE_SCAN_TIMEOUT_MS
                ? `${WORKSPACE_SCAN_TIMEOUT_MS}ms`
                : 'the configured timeout';
            this._logger.warn(`Workspace scan exceeded ${timeoutMsg}; defaulting to extreme scale`);
        } else {
            const thresholdLabel = `${WORKSPACE_SCALE_LARGE_THRESHOLD}+`;
            this._logger.info(`Workspace contains ${fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD ? thresholdLabel : fileCount} files`);
        }

        const previousScale = this._workspaceScale;
        this._workspaceFileCount = fileCount;
        this._workspaceScale = fileCount >= WORKSPACE_SCALE_EXTREME_THRESHOLD
            ? 'extreme'
            : fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD
                ? 'large'
                : 'normal';

        try {
            const primaryWorkspace = workspaceFolders[0]?.uri;
            setCachedWorkspaceMetrics(primaryWorkspace, fileCount);
        } catch (cacheError) {
            this._logger.debug('Unable to cache workspace file count', cacheError);
        }

        if (previousScale !== this._workspaceScale && this._smartWatcherEnabled && !this._performanceMode) {
            this._logger.info(`Workspace scale changed ${previousScale} -> ${this._workspaceScale}; recalibrating watchers`);
            this._setupFileWatcher('workspace-scale-update');
        }

        if (this._batchProcessor && typeof this._batchProcessor.setWorkspaceScale === 'function') {
            this._batchProcessor.setWorkspaceScale(this._workspaceScale || 'normal');
        }

        this._applyFeatureLevel(this._determineFeatureLevel(config), 'workspace-scale-change');

        if (suppressPrompt) {
            this._logger.debug('Large workspace prompt suppressed (force/performance mode), but scaling adjustments applied');
        }
    }

    _getIndexerMaxFiles() {
        const baseLimit = DEFAULT_INDEXER_MAX_FILES;
        if (this._workspaceScale === 'extreme') {
            return Math.min(600, baseLimit);
        }
        if (this._workspaceScale === 'large') {
            return Math.min(1200, baseLimit);
        }
        return baseLimit;
    }

    /**
     * Determine if progressive analysis should be enabled based on workspace characteristics
     */
    _shouldEnableProgressiveAnalysis() {
        // Enable progressive analysis for larger workspaces or when explicitly requested
        const config = vscode.workspace.getConfiguration('explorerDates');
        const explicitSetting = config.get('enableProgressiveAnalysis');
        
        // Only treat true/false as explicit overrides, fall back to workspace size for null/undefined
        if (explicitSetting === true || explicitSetting === false) {
            return explicitSetting;
        }
        
        // Auto-enable for large/extreme workspaces where WASM performance benefits are most noticeable
        return this._workspaceScale === 'large' || this._workspaceScale === 'extreme';
    }

    /**
     * Set up file system watcher to refresh decorations when files change
     */
    _setupFileWatcher(reason = 'initial') {
        if (this._performanceMode || this._isDisposed) {
            const skipReason = this._isDisposed ? 'provider disposed' : 'performance mode enabled';
            this._logger.debug(`Skipping file watcher setup (${reason}) - ${skipReason}`);
            return;
        }

        if (!this._fileWatcher) {
            this._fileWatcher = { pending: true };
        }

        const requestId = ++this._watcherSetupToken;

        const configure = async () => {
            if (this._smartWatcherSetupPromise) {
                try {
                    await this._smartWatcherSetupPromise;
                } catch (error) {
                    this._logger.debug('Previous watcher setup promise rejected', error);
                }
            }

            const promise = this._initializeSmartWatchers(reason, requestId);
            this._smartWatcherSetupPromise = promise;
            try {
                await promise;
            } finally {
                if (this._smartWatcherSetupPromise === promise) {
                    this._smartWatcherSetupPromise = null;
                }
            }
        };

        configure().catch((error) => {
            this._logger.error('Failed to configure file watchers', error);
        });
    }

    async _initializeSmartWatchers(reason, requestId) {
        if (this._shouldAbortWatcherSetup(requestId)) {
            return;
        }

        this._disposeFileWatchers({ permanent: false });
        if (this._shouldAbortWatcherSetup(requestId)) {
            this._cleanupAbortedWatcherSetup('post-dispose');
            return;
        }

        this._fileWatcher = { pending: true };

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this._logger.debug('No workspace folders detected; skipping watcher setup');
            this._activeWatcherStrategy = 'none';
            return;
        }

        if (isWebEnvironment()) {
            this._logger.info('File watchers are unavailable in web environments; skipping watcher setup');
            this._activeWatcherStrategy = 'none';
            return;
        }

        const config = vscode.workspace.getConfiguration('explorerDates');
        const envDisabled = process.env.EXPLORER_DATES_DISABLE_SMART_WATCHERS === '1';
        this._smartWatcherEnabled = !envDisabled && config.get('smartFileWatching', true);
        this._enableWatcherFallbacks = this._smartWatcherEnabled && config.get('enableSmartWatcherFallbacks', 'auto');
        const rawMaxPatterns = config.get('smartWatcherMaxPatterns', 20);
        const normalizedExtensions = this._normalizeWatcherExtensions(
            config.get('smartWatcherExtensions', DEFAULT_SMART_WATCHER_EXTENSIONS)
        );
        const maxPatterns = this._computeSmartWatcherMaxPatterns(rawMaxPatterns);
        this._smartWatcherConfig = {
            maxPatterns,
            extensions: normalizedExtensions
        };

        if (this._shouldAbortWatcherSetup(requestId)) {
            this._cleanupAbortedWatcherSetup('post-config');
            return;
        }

        if (!this._smartWatcherEnabled) {
            this._logger.info('Smart file watching disabled; falling back to global watcher');
            await this._createGlobalWatcher('disabled');
            return;
        }

        let targets = [];
        try {
            targets = await this._buildSmartWatcherTargets(workspaceFolders, this._smartWatcherConfig);
        } catch (error) {
            this._logger.error('Smart watcher analysis failed, falling back to global watcher', error);
            await this._createGlobalWatcher('analysis-failed');
            return;
        }

        if (this._shouldAbortWatcherSetup(requestId)) {
            this._cleanupAbortedWatcherSetup('post-analysis');
            return;
        }

        if (!targets || targets.length === 0) {
            this._logger.warn('Smart watcher analysis yielded no targets; falling back to global watcher');
            await this._createGlobalWatcher('no-targets');
            return;
        }

        for (const target of targets) {
            try {
                const watcher = await this._createWatcherWithFallback(target.pattern, target.label);
                if (watcher) {
                    this._registerWatcherHandlers(watcher, target.label);
                    this._fileWatchers.add(watcher);
                }
            } catch (error) {
                this._logger.debug(`Failed to create watcher for pattern ${target.label}`, error);
            }
        }

        if (this._fileWatchers.size === 0) {
            this._logger.warn('Smart watcher setup produced zero watchers; using global fallback');
            await this._createGlobalWatcher('no-watchers-created');
            return;
        }

        if (this._shouldAbortWatcherSetup(requestId)) {
            this._cleanupAbortedWatcherSetup('post-creation');
            return;
        }

        this._fileWatcher = this._fileWatchers.values().next().value || undefined;
        this._activeWatcherStrategy = 'smart';
        this._logger.info(`Smart file watching enabled (${this._fileWatchers.size} base watcher${this._fileWatchers.size === 1 ? '' : 's'})`, {
            reason,
            patterns: targets.map((t) => t.label)
        });

        this._ensureDynamicWatcherSupport();
    }

    _shouldAbortWatcherSetup(requestId) {
        if (this._isDisposed || this._performanceMode) {
            return true;
        }
        if (typeof requestId === 'number' && requestId !== this._watcherSetupToken) {
            return true;
        }
        return false;
    }

    _cleanupAbortedWatcherSetup(stage = 'unknown') {
        const permanentAbort = this._performanceMode || this._isDisposed;
        this._disposeFileWatchers({ permanent: permanentAbort });
        this._logger.debug(`Watcher setup aborted (${stage})`, {
            permanentAbort,
            disposed: this._isDisposed,
            performanceMode: this._performanceMode
        });
    }

    async _getDecorationsAdvancedChunk() {
        if (this._decorationsAdvancedChunkPromise) {
            return this._decorationsAdvancedChunkPromise;
        }

        this._decorationsAdvancedChunkPromise = (async () => {
            try {
                const featureFlags = require('./featureFlags');
                const chunk = await featureFlags.decorationsAdvanced();
                this._decorationsAdvancedChunk = chunk || null;
                return this._decorationsAdvancedChunk;
            } catch (error) {
                this._logger.debug('Failed to load decorationsAdvanced chunk', error);
                this._decorationsAdvancedChunk = null;
                return null;
            }
        })();

        return this._decorationsAdvancedChunkPromise;
    }

    async _createWatcherWithFallback(pattern, label = 'unknown') {
        try {
            const chunk = await this._getDecorationsAdvancedChunk();
            if (chunk?.createWatcherWithFallback) {
                return await chunk.createWatcherWithFallback(this, pattern, label);
            }
        } catch (error) {
            this._logger.debug(`Advanced watcher chunk failed for ${label}`, error);
        }

        const shouldUseFallbackWatcher = () => {
            if (this._enableWatcherFallbacks === false) {
                return false;
            }
            if (this._enableWatcherFallbacks === 'auto' || this._enableWatcherFallbacks === true) {
                const platform = process.platform;
                const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;
                const isRemote = vscode.env.remoteName;
                const isDocker = process.env.DOCKER_CONTAINER;
                return isWSL || isRemote || isDocker || platform === 'android';
            }
            return false;
        };

        // Fallback to native watcher if chunk unavailable
        try {
            const nativeWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            this._logger.debug(`Native watcher created for ${label}`);
            return nativeWatcher;
        } catch (nativeError) {
            this._logger.debug(`Native watcher failed for ${label}:`, nativeError);
            if (!shouldUseFallbackWatcher()) {
                return null;
            }
            return this._createFallbackWatcher(pattern, label);
        }
    }

    async _createFallbackWatcher(pattern, label) {
        try {
            const chunk = await this._getDecorationsAdvancedChunk();
            if (chunk?.createFallbackWatcher) {
                return await chunk.createFallbackWatcher(this, pattern, label);
            }
        } catch (error) {
            this._logger.warn(`Fallback watcher creation failed for ${label}:`, error);
        }
        try {
            if (!this._smartWatcherFallbackManager) {
                const { loadFeatureModule } = require('./featureFlags');
                const SmartWatcherFallbackModule = await loadFeatureModule('smartWatcherFallback');
                if (SmartWatcherFallbackModule) {
                    const { SmartWatcherFallbackManager } = SmartWatcherFallbackModule;
                    this._smartWatcherFallbackManager = new SmartWatcherFallbackManager({ logger: this._logger });
                    await this._smartWatcherFallbackManager.initialize();
                }
            }

            if (this._smartWatcherFallbackManager) {
                const fallback = await this._smartWatcherFallbackManager.getFallback();
                const watcher = await fallback.createWatcherWithFallback(pattern);
                this._logger.debug(`Fallback watcher created for ${label}`);
                return watcher;
            }
        } catch (fallbackError) {
            this._logger.warn(`Fallback watcher creation failed for ${label}:`, fallbackError);
        }
        return null;
    }

    async _createGlobalWatcher(reason = 'global-default') {
        this._teardownDynamicWatcherSupport();
        const watcher = await this._createWatcherWithFallback('**/*', `global:${reason}`);
        if (watcher) {
            this._registerWatcherHandlers(watcher, `global:${reason}`);
            this._fileWatchers.add(watcher);
            this._fileWatcher = watcher;
            this._activeWatcherStrategy = 'global';
            this._logger.info(`Global watcher activated (${reason})`);
        } else {
            this._logger.error(`Failed to create global watcher (${reason})`);
        }
    }

    _registerWatcherHandlers(watcher, label = 'unknown') {
        if (!watcher) {
            return;
        }

        watcher.onDidChange((uri) => this._handleWatcherEvent(uri, 'change', label));
        watcher.onDidCreate((uri) => this._handleWatcherEvent(uri, 'create', label));
        watcher.onDidDelete((uri) => this._handleWatcherEvent(uri, 'delete', label));
    }

    _handleWatcherEvent(uri, eventType, source = 'unknown') {
        if (!uri || uri.scheme !== 'file') {
            return;
        }

        const validation = this._validateWorkspaceUri(uri, `watcher:${eventType}`);
        if (!validation?.isValid) {
            return;
        }

        const throttleMs = this._getWatcherThrottleInterval();
        if (throttleMs <= 0) {
            this._dispatchWatcherEvent(uri, eventType, source);
            return;
        }

        const key = `${uri.toString()}:${eventType}`;
        const existing = this._watcherEventDebounce.get(key);
        if (existing) {
            clearTimeout(existing.timer);
        }

        const timer = setTimeout(() => {
            this._watcherEventDebounce.delete(key);
            this._dispatchWatcherEvent(uri, eventType, source);
        }, throttleMs);

        this._watcherEventDebounce.set(key, { timer, source });
    }

    _dispatchWatcherEvent(uri, eventType, source) {
        if (eventType === 'delete') {
            this.clearDecoration(uri);
        } else {
            this.refreshDecoration(uri);
        }

        if (this._workspaceIntelligence?.incrementalIndexer) {
            this._workspaceIntelligence.incrementalIndexer.queueDelta(uri, eventType);
        }

        if (this._logWatcherEvents) {
            this._logger.debug(`Watcher event processed (${eventType}) for ${describeFile(uri)} via ${source}`);
        }
    }

    _getWatcherThrottleInterval() {
        if (this._performanceMode) {
            return 0;
        }

        switch (this._workspaceScale) {
            case 'extreme':
                return 600;
            case 'large':
                return 250;
            default:
                return 100;
        }
    }

    _handleWorkspaceFoldersChanged(event) {
        const addedUris = (event?.added || []).map((folder) => folder.uri).filter(Boolean);
        const removedUris = (event?.removed || []).map((folder) => folder.uri).filter(Boolean);
        if (addedUris.length === 0 && removedUris.length === 0) {
            return;
        }

        const run = async () => {
            this._logger.info('Workspace folders changed', {
                added: addedUris.length,
                removed: removedUris.length
            });

            await this.checkWorkspaceSize();

            if (this._performanceMode) {
                return;
            }

            this._setupFileWatcher('workspace-change');

            await this._applyProgressiveLoadingSetting().catch((error) => {
                this._logger.debug('Failed to reconfigure progressive loading after workspace change', error);
            });

            if (this._workspaceIntelligence) {
                const added = (vscode.workspace.workspaceFolders || []).map((folder) => ({ uri: folder.uri }));
                await this._workspaceIntelligence.onWorkspaceFoldersChanged({
                    added,
                    removed: removedUris.map(uri => ({ uri }))
                });
            }
        };

        if (this._workspaceFolderChangeTimer) {
            clearTimeout(this._workspaceFolderChangeTimer);
        }
        this._workspaceFolderChangeTimer = setTimeout(() => {
            this._workspaceFolderChangeTimer = null;
            run().catch((error) => this._logger.debug('Workspace folder change handling failed', error));
        }, 250);
    }

    _disposeFileWatchers(options = {}) {
        const permanent = options.permanent === true;
        if (this._fileWatchers?.size) {
            for (const watcher of this._fileWatchers) {
                try {
                    watcher.dispose();
                } catch (error) {
                    this._logger.debug('Failed to dispose file watcher', error);
                }
            }
            this._fileWatchers.clear();
        }
        this._fileWatcher = permanent ? null : undefined;
        this._teardownDynamicWatcherSupport();
        this._pruneInactiveDynamicWatchers(true);
        this._clearWatcherDebounce();
        this._activeWatcherStrategy = 'none';
    }

    _clearWatcherDebounce() {
        if (!this._watcherEventDebounce?.size) {
            return;
        }

        for (const entry of this._watcherEventDebounce.values()) {
            clearTimeout(entry.timer);
        }
        this._watcherEventDebounce.clear();
    }

    _ensureDynamicWatcherSupport() {
        if (!this._smartWatcherEnabled) {
            return;
        }

        if (this._watcherDisposables.length > 0) {
            return;
        }

        const registerWindowListener = (eventName, handler) => {
            const disposable = this._registerEvent(vscode.window, eventName, handler);
            if (disposable) {
                this._watcherDisposables.push(disposable);
            }
        };

        const registerWorkspaceListener = (eventName, handler) => {
            const disposable = this._registerEvent(vscode.workspace, eventName, handler);
            if (disposable) {
                this._watcherDisposables.push(disposable);
            }
        };

        registerWindowListener('onDidChangeVisibleTextEditors', (editors) => {
            (editors || []).forEach((editor) => this._ensureWatcherForUri(editor?.document?.uri, 'visible-editor'));
        });

        registerWindowListener('onDidChangeActiveTextEditor', (editor) => {
            this._ensureWatcherForUri(editor?.document?.uri, 'active-editor');
        });

        registerWorkspaceListener('onDidOpenTextDocument', (document) => {
            this._ensureWatcherForUri(document?.uri, 'open-document');
        });

        registerWorkspaceListener('onDidSaveTextDocument', (document) => {
            this._ensureWatcherForUri(document?.uri, 'save-document');
        });

        this._seedDynamicWatchersFromVisibleEditors();
        this._ensureWatcherCleanupTimer();
    }

    _teardownDynamicWatcherSupport() {
        if (this._watcherDisposables?.length) {
            for (const disposable of this._watcherDisposables) {
                try {
                    disposable.dispose();
                } catch (error) {
                    this._logger.debug('Failed to dispose watcher listener', error);
                }
            }
            this._watcherDisposables = [];
        }
        this._stopWatcherCleanupTimer();
    }

    _disposeSmartWatcherFallbackManager() {
        if (this._smartWatcherFallbackManager) {
            try {
                this._smartWatcherFallbackManager.dispose();
            } catch (error) {
                this._logger.debug('Error disposing smart watcher fallback manager:', error);
            }
            this._smartWatcherFallbackManager = null;
        }
    }

    _seedDynamicWatchersFromVisibleEditors() {
        const editors = Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : [];
        editors.forEach((editor) => this._ensureWatcherForUri(editor?.document?.uri, 'visible-seed'));
    }

    _ensureWatcherCleanupTimer() {
        if (this._watcherCleanupTimer) {
            return;
        }
        this._watcherCleanupTimer = setInterval(() => this._pruneInactiveDynamicWatchers(), DEFAULT_WATCHER_INACTIVITY_MS);
    }

    _stopWatcherCleanupTimer() {
        if (this._watcherCleanupTimer) {
            clearInterval(this._watcherCleanupTimer);
            this._watcherCleanupTimer = null;
        }
    }

    _pruneInactiveDynamicWatchers(force = false) {
        if (!this._dynamicWatchers?.size) {
            return;
        }
        const expiry = Date.now() - DEFAULT_WATCHER_INACTIVITY_MS;
        for (const [dir, meta] of this._dynamicWatchers.entries()) {
            if (force || meta.lastUsed < expiry) {
                try {
                    meta.watcher.dispose();
                } catch (error) {
                    this._logger.debug(`Failed to dispose dynamic watcher for ${dir}`, error);
                }
                this._dynamicWatchers.delete(dir);
            }
        }
        if (!this._dynamicWatchers.size) {
            this._stopWatcherCleanupTimer();
        }
    }

    _ensureWatcherForUri(uri, source = 'editor') {
        if (!this._smartWatcherEnabled || !uri || uri.scheme !== 'file') {
            return;
        }

        if (!nodePath) {
            return;
        }

        const dirPath = pathCompat.dirname(uri.fsPath || '');
        if (!dirPath) {
            return;
        }

        const normalized = normalizePath(dirPath);
        const existing = this._dynamicWatchers.get(normalized);
        if (existing) {
            existing.lastUsed = Date.now();
            return;
        }

        if (this._dynamicWatchers.size >= DEFAULT_DYNAMIC_WATCHER_LIMIT) {
            this._evictOldestDynamicWatcher();
        }

        try {
            const pattern = new vscode.RelativePattern(normalized, '**/*');
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            const watcherLabel = pathCompat.basename(normalized) || 'root';
            this._registerWatcherHandlers(watcher, `dynamic:${source}:${watcherLabel}`);
            this._dynamicWatchers.set(normalized, {
                watcher,
                lastUsed: Date.now(),
                source
            });
        } catch (error) {
            this._logger.debug(`Failed to create dynamic watcher for ${normalized}`, error);
        }
    }

    _evictOldestDynamicWatcher() {
        let oldestKey = null;
        let oldestValue = Number.POSITIVE_INFINITY;
        for (const [dir, meta] of this._dynamicWatchers.entries()) {
            if (meta.lastUsed < oldestValue) {
                oldestValue = meta.lastUsed;
                oldestKey = dir;
            }
        }

        if (oldestKey) {
            const meta = this._dynamicWatchers.get(oldestKey);
            try {
                meta?.watcher?.dispose();
            } catch (error) {
                this._logger.debug(`Failed to evict watcher for ${oldestKey}`, error);
            }
            this._dynamicWatchers.delete(oldestKey);
        }
    }

    _setupViewportAwareness() {
        if (this._viewportDisposables.length > 0) {
            return;
        }

        const registerWindowListener = (eventName, handler) => {
            const disposable = this._registerEvent(vscode.window, eventName, handler);
            if (disposable) {
                this._viewportDisposables.push(disposable);
            }
        };

        const registerWorkspaceListener = (eventName, handler) => {
            const disposable = this._registerEvent(vscode.workspace, eventName, handler);
            if (disposable) {
                this._viewportDisposables.push(disposable);
            }
        };

        registerWindowListener('onDidChangeVisibleTextEditors', (editors) => {
            this._updateVisibleViewportFiles(editors);
        });

        registerWindowListener('onDidChangeActiveTextEditor', (editor) => {
            this._recordViewportActivity(editor?.document?.uri, { reason: 'active-editor' });
        });

        registerWorkspaceListener('onDidOpenTextDocument', (document) => {
            this._recordViewportActivity(document?.uri, { reason: 'open-document' });
        });

        registerWorkspaceListener('onDidSaveTextDocument', (document) => {
            this._recordViewportActivity(document?.uri, { reason: 'save-document' });
        });

        this._updateVisibleViewportFiles(Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : []);
        if (vscode.window?.activeTextEditor?.document?.uri) {
            this._recordViewportActivity(vscode.window.activeTextEditor.document.uri, { reason: 'initial-active' });
        }
    }

    _teardownViewportAwareness() {
        if (!this._viewportDisposables?.length) {
            return;
        }
        for (const disposable of this._viewportDisposables) {
            try {
                disposable.dispose();
            } catch (error) {
                this._logger.debug('Failed to dispose viewport listener', error);
            }
        }
        this._viewportDisposables = [];
        this._viewportVisibleFiles.clear();
        this._viewportRecentFiles.clear();
    }

    _updateVisibleViewportFiles(editors) {
        this._viewportVisibleFiles.clear();
        if (!Array.isArray(editors)) {
            return;
        }

        const now = Date.now();
        for (const editor of editors) {
            const uri = editor?.document?.uri;
            if (!uri || uri.scheme !== 'file') {
                continue;
            }
            const normalizedPath = normalizePath(getUriPath(uri));
            if (!normalizedPath) {
                continue;
            }
            this._viewportVisibleFiles.add(normalizedPath);
            this._viewportRecentFiles.set(normalizedPath, now);
        }
        this._trimViewportHistory();
    }

    _recordViewportActivity(uri, options = {}) {
        if (!uri || uri.scheme !== 'file') {
            return;
        }
        const normalizedPath = normalizePath(getUriPath(uri));
        if (!normalizedPath) {
            return;
        }

        const timestamp = Date.now();
        this._viewportRecentFiles.set(normalizedPath, timestamp);
        if (options.visible) {
            this._viewportVisibleFiles.add(normalizedPath);
        }

        if (this._viewportRecentFiles.size > this._viewportHistoryLimit) {
            this._trimViewportHistory(true);
        } else if ((timestamp - this._lastViewportCleanup) > this._viewportWindowMs) {
            this._trimViewportHistory();
        }
    }

    _trimViewportHistory(force = false) {
        const now = Date.now();
        const cutoff = now - (this._viewportWindowMs * 2);
        for (const [key, ts] of this._viewportRecentFiles.entries()) {
            if (force || ts < cutoff || (this._viewportRecentFiles.size > this._viewportHistoryLimit && ts < now)) {
                this._viewportRecentFiles.delete(key);
            }
        }
        this._lastViewportCleanup = now;
    }

    _isViewportPriority(uri) {
        if (!uri || uri.scheme !== 'file') {
            return true;
        }
        if (this._performanceMode || this._featureLevel === 'full') {
            return true;
        }
        const normalizedPath = normalizePath(getUriPath(uri));
        if (!normalizedPath) {
            return true;
        }
        if (this._viewportVisibleFiles.has(normalizedPath)) {
            return true;
        }
        const lastSeen = this._viewportRecentFiles.get(normalizedPath);
        if (!lastSeen) {
            return false;
        }
        return (Date.now() - lastSeen) <= this._viewportWindowMs;
    }

    async _buildSmartWatcherTargets(workspaceFolders, options) {
        const targets = [];
        const config = vscode.workspace.getConfiguration('explorerDates');
        const baseExcludedSet = this._buildBaseWatcherExclusions(config);

        for (const folder of workspaceFolders) {
            if (targets.length >= options.maxPatterns) {
                break;
            }

            const folderExcludedSet = await this._getWatcherExcludedSetForFolder(folder, baseExcludedSet);

            // Root-level watcher for important files (counts as one pattern)
            const rootPattern = new vscode.RelativePattern(folder, '*.{md,mdx,json,jsonc,yml,yaml,ts,tsx,js,jsx}');
            targets.push({
                pattern: rootPattern,
                label: `root:${folder.name}`
            });

            if (targets.length >= options.maxPatterns) {
                break;
            }

            const remaining = options.maxPatterns - targets.length;
            const folderTargets = await this._collectFolderWatcherPatterns(folder, {
                excludedSet: folderExcludedSet,
                extensions: options.extensions,
                limit: remaining
            });

            targets.push(...folderTargets);
        }

        return targets.slice(0, options.maxPatterns);
    }

    _buildBaseWatcherExclusions(config) {
        const excludedSet = new Set();
        const excludedConfig = config.get('excludedFolders', []);
        for (const folder of excludedConfig) {
            this._addExclusionValueToSet(excludedSet, folder);
        }

        const hardExclusions = [
            'node_modules',
            '.git',
            '.hg',
            '.svn',
            'dist',
            'build',
            'out',
            '.vscode',
            '.idea',
            '.cache',
            '.parcel-cache',
            '.yarn',
            '.pnpm-store',
            'tmp',
            'temp',
            'coverage',
            '.next',
            'logs',
            'old-builds'
        ];
        hardExclusions.forEach((entry) => this._addExclusionValueToSet(excludedSet, entry));
        return excludedSet;
    }

    async _getWatcherExcludedSetForFolder(folder, baseExcludedSet) {
        const merged = new Set(baseExcludedSet);
        if (!folder || !this._workspaceIntelligence?.smartExclusion) {
            return merged;
        }

        try {
            const combined = await this._workspaceIntelligence.smartExclusion.getCombinedExclusions(folder.uri);
            const smartFolders = combined?.folders || [];
            const smartPatterns = combined?.patterns || [];

            for (const folderPattern of smartFolders) {
                this._addExclusionValueToSet(merged, folderPattern, { onlyRootSegment: true });
            }
            for (const pattern of smartPatterns) {
                this._addExclusionValueToSet(merged, pattern, { onlyRootSegment: true });
            }

            if ((smartFolders.length || smartPatterns.length) && this._logger && merged.size > baseExcludedSet.size) {
                this._logger.debug('Merged smart exclusion hints for watcher setup', {
                    workspace: folder.name,
                    totalExclusions: merged.size
                });
            }
        } catch (error) {
            this._logger.debug('Failed to merge smart exclusion data for watcher setup', error);
        }

        return merged;
    }

    _addExclusionValueToSet(targetSet, value, options = {}) {
        if (!value) {
            return;
        }
        const { onlyRootSegment = false } = options;
        const asString = typeof value === 'string'
            ? value
            : (typeof value?.toString === 'function' ? value.toString() : '');
        if (!asString || typeof asString !== 'string') {
            return;
        }
        const normalized = asString.trim();
        if (!normalized) {
            return;
        }

        const sanitized = normalized
            .replace(/\\/g, '/')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '');
        const segments = sanitized
            .split('/')
            .map((segment) => segment.trim())
            .filter(Boolean);

        if (!segments.length) {
            if (normalized.includes('*') || normalized.includes('?')) {
                return;
            }
            targetSet.add(normalized.toLowerCase());
            return;
        }

        if (onlyRootSegment) {
            targetSet.add(segments[0].toLowerCase());
            return;
        }

        for (const segment of segments) {
            targetSet.add(segment.toLowerCase());
        }
    }

    _dedupeSecurityPaths(paths = []) {
        if (!Array.isArray(paths)) {
            return [];
        }
        const unique = new Set();
        const result = [];
        for (const entry of paths) {
            if (!entry || unique.has(entry)) {
                continue;
            }
            unique.add(entry);
            result.push(entry);
        }
        return result;
    }

    _normalizeSecurityPathList(candidatePaths = []) {
        const list = Array.isArray(candidatePaths)
            ? candidatePaths
            : (candidatePaths ? [candidatePaths] : []);
        const normalized = [];
        for (const entry of list) {
            if (!entry || typeof entry !== 'string') {
                continue;
            }
            const cleaned = entry.trim().replace(/^['"]|['"]$/g, '');
            if (!cleaned) {
                continue;
            }
            const normalizedPath = normalizePath(cleaned);
            if (normalizedPath) {
                normalized.push(normalizedPath);
            } else {
                this._logger.debug(`Ignored invalid security path entry: ${entry}`);
            }
        }
        return normalized;
    }

    _getExplicitBooleanSetting(config, key) {
        if (!config || typeof config.inspect !== 'function') {
            return undefined;
        }
        try {
            const inspected = config.inspect(key);
            if (!inspected || typeof inspected !== 'object') {
                return undefined;
            }
            const scopes = [
                inspected.workspaceFolderValue,
                inspected.workspaceValue,
                inspected.globalValue
            ];
            for (const value of scopes) {
                if (typeof value === 'boolean') {
                    return value;
                }
            }
            return undefined;
        } catch {
            return undefined;
        }
    }

    _parseEnvExtraSecurityPaths() {
        const envValue = process.env[SECURITY_EXTRA_PATHS_ENV];
        if (!envValue || typeof envValue !== 'string') {
            return [];
        }
        const delimiter = (nodePath && nodePath.delimiter) || (process.platform === 'win32' ? ';' : ':');
        return envValue
            .split(delimiter)
            .map((value) => value.trim())
            .filter(Boolean);
    }

    _isTestLikeEnvironment() {
        return process.env.EXPLORER_DATES_TEST_MODE === '1' ||
            process.env.NODE_ENV === 'test' ||
            process.env.VSCODE_TEST === '1';
    }

    _updateSecurityBoundarySettings(config) {
        const explorerConfig = config || vscode.workspace.getConfiguration('explorerDates');
        const allowTestPaths = explorerConfig.get('security.allowTestPaths', true);
        const extraPathsSetting = explorerConfig.get('security.allowedExtraPaths', []);
        this._securityEnvironment = detectSecurityEnvironment();
        const explicitBoundary = this._getExplicitBooleanSetting(explorerConfig, 'security.enableBoundaryEnforcement');
        const legacyBoundary = this._getExplicitBooleanSetting(explorerConfig, 'security.enforceWorkspaceBoundaries');
        let enforceBoundaries;
        if (typeof explicitBoundary === 'boolean') {
            enforceBoundaries = explicitBoundary;
        } else if (typeof legacyBoundary === 'boolean') {
            enforceBoundaries = legacyBoundary;
        } else {
            enforceBoundaries = this._securityEnvironment === 'production';
        }
        const normalizedExtras = this._normalizeSecurityPathList(extraPathsSetting);
        const envExtras = this._normalizeSecurityPathList(this._parseEnvExtraSecurityPaths());
        this._securityAllowedExtraPaths = this._dedupeSecurityPaths([
            ...normalizedExtras,
            ...envExtras
        ]);
        this._securityEnforceWorkspaceBoundaries = enforceBoundaries !== false;
        this._securityAllowTestPaths = allowTestPaths !== false;
        this._securityRelaxedForTests = this._securityAllowTestPaths &&
            (this._securityEnvironment === 'test' || this._isTestLikeEnvironment());
        if (this._securityRelaxedForTests && !this._securityLoggedTestRelaxation) {
            this._logger.warn('Security workspace boundary enforcement relaxed (test environment detected)');
            this._securityLoggedTestRelaxation = true;
        }
        const throttleMsSetting = explorerConfig.get('security.logThrottleWindowMs');
        const maxWarningsSetting = explorerConfig.get('security.maxWarningsPerFile');
        const resolvedThrottle = Number.isFinite(throttleMsSetting)
            ? Math.max(0, throttleMsSetting)
            : (Number.isFinite(DEFAULT_SECURITY_THROTTLE_MS) ? Math.max(0, DEFAULT_SECURITY_THROTTLE_MS) : 5000);
        this._securityLogThrottleMs = resolvedThrottle;
        const fallbackMaxWarnings = Number.isFinite(DEFAULT_SECURITY_MAX_WARNINGS) && DEFAULT_SECURITY_MAX_WARNINGS >= 0
            ? DEFAULT_SECURITY_MAX_WARNINGS
            : 1;
        if (Number.isFinite(maxWarningsSetting) && maxWarningsSetting >= 0) {
            this._securityMaxWarningsPerFile = maxWarningsSetting;
        } else {
            this._securityMaxWarningsPerFile = fallbackMaxWarnings;
        }
    }

    _getWorkspaceRootPaths() {
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        const roots = [];
        const unique = new Set();
        const addPath = (value) => {
            if (!value) {
                return;
            }
            const normalized = normalizePath(value);
            if (!normalized || unique.has(normalized)) {
                return;
            }
            unique.add(normalized);
            roots.push(normalized);
        };

        workspaceFolders.forEach((folder) => {
            try {
                addPath(getUriPath(folder.uri));
            } catch {
                // ignore folder we cannot resolve
            }
        });

        if (Array.isArray(this._securityAllowedExtraPaths)) {
            this._securityAllowedExtraPaths.forEach((extraPath) => addPath(extraPath));
        }

        return roots;
    }

    _shouldThrottleSecurityWarning(key) {
        if (!key) {
            return false;
        }
        const now = Date.now();
        const entry = this._securityWarningLog.get(key) || { lastTimestamp: 0, count: 0 };
        if (typeof this._securityMaxWarningsPerFile === 'number' &&
            this._securityMaxWarningsPerFile >= 0 &&
            entry.count >= this._securityMaxWarningsPerFile) {
            return true;
        }
        if (typeof this._securityLogThrottleMs === 'number' &&
            this._securityLogThrottleMs > 0 &&
            now - entry.lastTimestamp < this._securityLogThrottleMs) {
            return true;
        }
        entry.lastTimestamp = now;
        entry.count = (entry.count || 0) + 1;
        this._securityWarningLog.set(key, entry);
        if (this._securityWarningLog.size > SECURITY_WARNING_CACHE_LIMIT) {
            const keys = Array.from(this._securityWarningLog.keys());
            const trimCount = Math.ceil(keys.length * 0.25);
            for (let i = 0; i < trimCount; i++) {
                this._securityWarningLog.delete(keys[i]);
            }
        }
        return false;
    }

    _logSecurityWarning(reason, sanitizedPath, details = {}, options = {}) {
        const key = `${reason}:${sanitizedPath}`;
        if (this._shouldThrottleSecurityWarning(key)) {
            return;
        }
        const env = this._securityEnvironment || 'production';
        const logLevel = env === 'production'
            ? (options.level || 'warn')
            : (env === 'development' ? 'info' : 'debug');
        const logFn = typeof this._logger[logLevel] === 'function'
            ? this._logger[logLevel].bind(this._logger)
            : this._logger.warn.bind(this._logger);
        logFn(`${reason}: ${sanitizedPath}`, {
            environment: env,
            ...details
        });
    }

    _sanitizePathForLog(target) {
        let rawPath = '';
        if (typeof target === 'string') {
            rawPath = target;
        } else if (target) {
            rawPath = target.fsPath || target.path || '';
            if (!rawPath && typeof target.toString === 'function') {
                try {
                    rawPath = target.toString(true);
                } catch {
                    rawPath = target.toString();
                }
            }
        }
        const sanitized = SecurityValidator.sanitizePath(rawPath || '', { preserveExtension: true });
        return sanitized || 'unknown';
    }

    _validateWorkspaceUri(uri, reason = 'operation') {
        if (!uri) {
            return { isValid: false, issue: 'Missing URI' };
        }

        const allowedWorkspaces = this._getWorkspaceRootPaths();
        const shouldEnforceBoundaries =
            this._securityEnforceWorkspaceBoundaries &&
            !this._securityRelaxedForTests &&
            allowedWorkspaces.length > 0;

        const validation = SecureFileOperations.validateFileUri(
            uri,
            shouldEnforceBoundaries ? allowedWorkspaces : []
        );
        const sanitizedPath = this._sanitizePathForLog(uri);

        if (!validation.isValid) {
            this._logSecurityWarning(
                `Security validation blocked ${reason}`,
                sanitizedPath,
                {
                    issue: validation.issue,
                    enforceBoundaries: shouldEnforceBoundaries
                }
            );
        } else if (validation.warnings?.length) {
            this._logSecurityWarning(
                `Security warnings for ${reason}`,
                sanitizedPath,
                {
                    warnings: validation.warnings,
                    enforceBoundaries: shouldEnforceBoundaries
                },
                { level: 'info' }
            );
        }

        return validation;
    }

    async _collectFolderWatcherPatterns(folder, options) {
        if (options.limit <= 0) {
            return [];
        }

        let entries = [];
        try {
            entries = await this._fileSystem.readdir(folder.uri, { withFileTypes: true });
        } catch (error) {
            this._logger.debug(`Failed to read workspace folder ${folder.name}`, error);
            return [];
        }

        const candidates = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }
            const lower = entry.name.toLowerCase();
            if (this._shouldSkipDirectory(lower, options.excludedSet)) {
                continue;
            }
            const score = SMART_WATCHER_PRIORITY.get(lower) || (lower.startsWith('.') ? 1 : 10);
            candidates.push({
                name: entry.name,
                score
            });
        }

        candidates.sort((a, b) => b.score - a.score);
        const selected = candidates.slice(0, options.limit);
        return selected.map((dir) => ({
            pattern: new vscode.RelativePattern(folder, this._buildDirectoryPattern(dir.name, options.extensions)),
            label: `dir:${folder.name}/${dir.name}`
        }));
    }

    _shouldSkipDirectory(name, excludedSet) {
        if (!name) {
            return true;
        }
        if (excludedSet.has(name)) {
            return true;
        }
        if (name.startsWith('.')) {
            return true;
        }
        return false;
    }

    _buildDirectoryPattern(folderName, extensions) {
        if (!extensions || extensions.length === 0) {
            return `${folderName}/**/*`;
        }
        if (extensions.length === 1) {
            return `${folderName}/**/*.${extensions[0]}`;
        }
        return `${folderName}/**/*.{${extensions.join(',')}}`;
    }

    _normalizeWatcherExtensions(rawExtensions) {
        const source = Array.isArray(rawExtensions) && rawExtensions.length > 0
            ? rawExtensions
            : DEFAULT_SMART_WATCHER_EXTENSIONS;

        return Array.from(new Set(
            source
                .map((ext) => (ext || '').toString().trim().replace(/^\./, '').toLowerCase())
                .filter(Boolean)
        ));
    }

    _computeSmartWatcherMaxPatterns(rawMaxPatterns) {
        const bounded = Math.max(1, Math.min(rawMaxPatterns, DEFAULT_DYNAMIC_WATCHER_LIMIT));
        const clamp = this._getWatcherPatternClamp();
        return clamp ? Math.min(bounded, clamp) : bounded;
    }

    _getWatcherPatternClamp() {
        switch (this._workspaceScale) {
            case 'extreme':
                return 8;
            case 'large':
                return 14;
            default:
                return null;
        }
    }

    /**
     * Set up periodic refresh to keep time-based badges current
     */
    _setupPeriodicRefresh() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const configuredInterval = config.get('badgeRefreshInterval', 60000); // Default 1 minute
        const interval = this._refreshIntervalOverride || configuredInterval;
        this._refreshInterval = interval;
        
        this._logger.info(`Setting up periodic refresh with interval: ${this._refreshInterval}ms`);
        
        // Clear any existing timer
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
        }
        this._cancelIncrementalRefreshTimers();
        
        // Only set up periodic refresh if decorations are enabled
        if (!config.get('showDateDecorations', true)) {
            this._logger.info('Decorations disabled, skipping periodic refresh setup');
            return;
        }
        
        // Set up periodic refresh timer
        this._refreshTimer = setInterval(() => {
            if (this._incrementalRefreshInProgress) {
                this._logger.debug('Periodic refresh skipped - incremental refresh already running');
                return;
            }
            this._logger.debug('Periodic refresh triggered - scheduling incremental refresh');
            this._scheduleIncrementalRefresh('periodic');
        }, this._refreshInterval);
        
        this._logger.info('Periodic refresh timer started');
    }

    _resolveUriFromCacheEntry(cacheKey, entry) {
        if (entry?.uri) {
            return entry.uri;
        }
        if (!cacheKey) {
            return null;
        }
        try {
            return vscode.Uri.file(cacheKey);
        } catch (error) {
            this._logger.debug(`Failed to rebuild URI from cache key: ${cacheKey}`, error);
            return null;
        }
    }

    _cancelIncrementalRefreshTimers() {
        if (this._incrementalRefreshTimers?.size) {
            for (const timer of this._incrementalRefreshTimers) {
                clearTimeout(timer);
            }
            this._incrementalRefreshTimers.clear();
        }
        this._incrementalRefreshInProgress = false;
    }

    _scheduleIncrementalRefresh(reason = 'manual') {
        // If a refresh is already pending, skip duplicate requests
        // This prevents memory churn from rapid successive refresh calls
        if (this._scheduledRefreshPending) {
            this._logger.debug(`Incremental refresh (${reason}) skipped - refresh already pending`);
            return;
        }

        if (this._incrementalRefreshInProgress) {
            this._logger.debug(`Incremental refresh (${reason}) already in progress, cancelling pending timers and rescheduling`);
            // Cancel any pending timers from previous schedule to prevent accumulation
            this._cancelIncrementalRefreshTimers();
        }

        const entries = Array.from(this._decorationCache.entries());
        if (entries.length === 0) {
            this._logger.debug(`No cached decorations to refresh for ${reason}, falling back to global refresh`);
            this._onDidChangeFileDecorations.fire(undefined);
            return;
        }

        const targets = entries
            .map(([cacheKey, entry]) => {
                const uri = this._resolveUriFromCacheEntry(cacheKey, entry);
                return uri ? { cacheKey, uri } : null;
            })
            .filter(Boolean);

        if (targets.length === 0) {
            this._logger.debug(`Failed to resolve URIs for ${reason} incremental refresh, firing global refresh`);
            this._onDidChangeFileDecorations.fire(undefined);
            return;
        }

        const chunkSize = 40;
        const totalChunks = Math.ceil(targets.length / chunkSize);
        const targetDuration = Math.min(4000, Math.max(750, Math.floor(this._refreshInterval * 0.25)));
        const spacing = totalChunks > 1 ? Math.max(25, Math.floor(targetDuration / totalChunks)) : 0;

        this._incrementalRefreshInProgress = true;
        this._scheduledRefreshPending = true;
        this._logger.debug(`Incremental refresh (${reason}) scheduled for ${targets.length} items in ${totalChunks} batches (spacing: ${spacing}ms)`);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const chunk = targets.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
            const delay = chunkIndex === 0 ? 0 : spacing * chunkIndex;

            const timer = setTimeout(() => {
                try {
                    chunk.forEach(({ cacheKey, uri }) => {
                        this._markCacheEntryForRefresh(cacheKey);
                        this._onDidChangeFileDecorations.fire(uri);
                    });
                } finally {
                    this._incrementalRefreshTimers.delete(timer);
                    if (this._incrementalRefreshTimers.size === 0) {
                        this._incrementalRefreshInProgress = false;
                        this._scheduledRefreshPending = false;
                        this._logger.debug(`Incremental refresh (${reason}) completed`);
                    }
                }
            }, delay);

            this._incrementalRefreshTimers.add(timer);
        }
    }

    _markCacheEntryForRefresh(cacheKey) {
        if (!cacheKey) {
            return;
        }

        const entry = this._decorationCache.get(cacheKey);
        if (entry) {
            // Only force refresh if entry is actually stale (more than 75% through TTL)
            const ageMs = Date.now() - entry.timestamp;
            const isStale = ageMs > (this._cacheTimeout * 0.75);
            
            if (isStale) {
                entry.forceRefresh = true;
                this._logger.debug(`Marked stale entry for refresh: ${cacheKey} (age: ${Math.round(ageMs / 1000)}s)`);
            } else {
                this._logger.debug(`Skipped refresh for fresh entry: ${cacheKey} (age: ${Math.round(ageMs / 1000)}s, threshold: ${Math.round(this._cacheTimeout * 0.75 / 1000)}s)`);
            }
        }

        if (this._advancedCache) {
            try {
                const escapedKey = cacheKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                this._advancedCache.invalidateByPattern(escapedKey);
            } catch (error) {
                this._logger.debug(`Could not invalidate advanced cache for ${cacheKey}: ${error.message}`);
            }
        }
    }

    /**
     * Set up configuration watcher to update settings
     */
    _setupConfigurationWatcher() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('explorerDates')) {
                this._logger.debug('Configuration changed, updating settings');
                
                // Update cache settings, maintaining desktop vs web differentiation
                const config = vscode.workspace.getConfiguration('explorerDates');
                const configuredTimeout = config.get('cacheTimeout', CONFIG_DEFAULT_CACHE_TIMEOUT);
                this._hasCustomCacheTimeout = this._detectCacheTimeoutOverride(config, configuredTimeout);
                this._cacheTimeout = this._resolveCacheTimeout(configuredTimeout);
                this._maxCacheSize = config.get('maxCacheSize', 10000);
                const namespaceChanged = this._updateCacheNamespace(config);
                
                // Handle performance mode changes
                if (e.affectsConfiguration('explorerDates.performanceMode')) {
                    const newPerformanceMode = config.get('performanceMode', false);
                    if (newPerformanceMode !== this._performanceModeExplicit) {
                        this._performanceModeExplicit = newPerformanceMode;
                        await this._togglePerformanceMode(this._computeEffectivePerformanceMode(), {
                            reason: 'configuration-change'
                        });
                        this._applyFeatureLevel(this._determineFeatureLevel(config), 'performance-mode-change');
                    }
                }
                if (e.affectsConfiguration('explorerDates.featureLevel')) {
                    this._applyFeatureLevel(this._determineFeatureLevel(config), 'configuration-change');
                }
                
                // Update refresh interval and restart timer if changed
                if (e.affectsConfiguration('explorerDates.badgeRefreshInterval')) {
                    this._refreshInterval = config.get('badgeRefreshInterval', 60000);
                    this._logger.info(`Badge refresh interval updated to: ${this._refreshInterval}ms`);
                    if (!this._performanceMode) {
                        this._setupPeriodicRefresh();
                    }
                }
                
                const decorationSettingsChanged =
                    e.affectsConfiguration('explorerDates.showDateDecorations') ||
                    e.affectsConfiguration('explorerDates.dateDecorationFormat') ||
                    e.affectsConfiguration('explorerDates.excludedFolders') ||
                    e.affectsConfiguration('explorerDates.excludedPatterns') ||
                    e.affectsConfiguration('explorerDates.highContrastMode') ||
                    e.affectsConfiguration('explorerDates.fadeOldFiles') ||
                    e.affectsConfiguration('explorerDates.fadeThreshold') ||
                    e.affectsConfiguration('explorerDates.colorScheme') ||
                    e.affectsConfiguration('explorerDates.showGitInfo') ||
                    e.affectsConfiguration('explorerDates.customColors') ||
                    e.affectsConfiguration('explorerDates.showFileSize') ||
                    e.affectsConfiguration('explorerDates.fileSizeFormat') ||
                    e.affectsConfiguration('explorerDates.featureLevel');

                const securitySettingsChanged =
                    e.affectsConfiguration('explorerDates.security.enforceWorkspaceBoundaries') ||
                    e.affectsConfiguration('explorerDates.security.allowedExtraPaths') ||
                    e.affectsConfiguration('explorerDates.security.allowTestPaths');

                if (securitySettingsChanged) {
                    this._updateSecurityBoundarySettings(config);
                }

                if (
                    e.affectsConfiguration('explorerDates.decorationPoolSize') ||
                    e.affectsConfiguration('explorerDates.flyweightCacheSize')
                ) {
                    this._applyReuseCapacitySettings(config);
                }

                if (decorationSettingsChanged || namespaceChanged) {
                    this.refreshAll({
                        preservePersistentCache: true,
                        reason: decorationSettingsChanged ? 'configuration-change' : 'namespace-change'
                    });
                }
                const smartWatcherSettingsChanged =
                    e.affectsConfiguration('explorerDates.smartFileWatching') ||
                    e.affectsConfiguration('explorerDates.smartWatcherMaxPatterns') ||
                    e.affectsConfiguration('explorerDates.smartWatcherExtensions') ||
                    e.affectsConfiguration('explorerDates.excludedFolders') ||
                    e.affectsConfiguration('explorerDates.smartExclusions');
                if (!this._performanceMode && smartWatcherSettingsChanged) {
                    this._setupFileWatcher('configuration-change');
                }
                if (e.affectsConfiguration('explorerDates.progressiveLoading')) {
                    this._applyProgressiveLoadingSetting().catch((error) => {
                        this._logger.error('Failed to reconfigure progressive loading', error);
                    });
                }
                
                // Handle UI adapters configuration changes
                if (e.affectsConfiguration('explorerDates.autoThemeAdaptation') || 
                    e.affectsConfiguration('explorerDates.accessibilityMode')) {
                    this._logger.debug('UI adapters configuration changed, reloading...');
                    await this._reloadUIAdapters();
                }
                
                // Restart periodic refresh if decorations setting changed
                if (e.affectsConfiguration('explorerDates.showDateDecorations') && !this._performanceMode) {
                    this._setupPeriodicRefresh();
                }
            }
        });
    }

    _detectCacheTimeoutOverride(config, configuredTimeout) {
        if (typeof configuredTimeout === 'number' && configuredTimeout !== CONFIG_DEFAULT_CACHE_TIMEOUT) {
            return true;
        }

        if (!config || typeof config.inspect !== 'function') {
            return false;
        }

        try {
            const inspected = config.inspect('cacheTimeout');
            if (!inspected) {
                return false;
            }

            // Real VS Code inspect returns direct object with value properties
            if (typeof inspected === 'object' && (
                typeof inspected.globalValue === 'number' ||
                typeof inspected.workspaceValue === 'number' ||
                typeof inspected.workspaceFolderValue === 'number'
            )) {
                return true;
            }

            // Mock VS Code inspect may return map of keys
            if (inspected.cacheTimeout && typeof inspected.cacheTimeout === 'object') {
                const entry = inspected.cacheTimeout;
                const hasValue = typeof entry.globalValue === 'number' ||
                    typeof entry.workspaceValue === 'number' ||
                    typeof entry.workspaceFolderValue === 'number';

                if (hasValue) {
                    const value = entry.globalValue ?? entry.workspaceValue ?? entry.workspaceFolderValue;
                    return typeof value === 'number' && value !== CONFIG_DEFAULT_CACHE_TIMEOUT;
                }
            }
        } catch {
            return false;
        }

        return false;
    }

    _resolveCacheTimeout(configuredTimeout) {
        if (this._isWeb) {
            return configuredTimeout;
        }

        if (this._hasCustomCacheTimeout) {
            return configuredTimeout;
        }

        return Math.max(this._baselineDesktopCacheTimeout, configuredTimeout || this._baselineDesktopCacheTimeout);
    }

    /**
     * Dynamically load BatchProcessor module if needed
     */
    async _loadBatchProcessorIfNeeded() {
        const chunk = await this._getDecorationsAdvancedChunk();
        if (chunk?.loadBatchProcessorIfNeeded) {
            return chunk.loadBatchProcessorIfNeeded(this);
        }
        return null;
    }

    async _applyProgressiveLoadingSetting() {
        const chunk = await this._getDecorationsAdvancedChunk();
        if (chunk?.applyProgressiveLoadingSetting) {
            return chunk.applyProgressiveLoadingSetting(this);
        }
        // Fallback: disable progressive loading when chunk missing
        this._progressiveLoadingEnabled = false;
        this._cancelProgressiveWarmupJobs();
    }

    _cancelProgressiveWarmupJobs() {
        if (this._decorationsAdvancedChunk?.cancelProgressiveWarmupJobs) {
            this._decorationsAdvancedChunk.cancelProgressiveWarmupJobs(this);
            return;
        }
        if (this._batchProcessor) {
            for (const jobId of this._progressiveLoadingJobs) {
                this._batchProcessor.cancelBatch(jobId);
            }
        }
        this._progressiveLoadingJobs.clear();
    }

    /**
     * Refresh decoration for a specific file
     */
    refreshDecoration(uri) {
        if (!uri) {
            return;
        }
        const validation = this._validateWorkspaceUri(uri, 'refreshDecoration');
        if (!validation?.isValid) {
            return;
        }

        // Clear from both caches to force refresh
        const cacheKey = this._getCacheKey(uri);
        this._decorationCache.delete(cacheKey);
        if (this._advancedCache) {
            // Advanced cache doesn't have a delete method, use invalidateByPattern instead
            try {
                this._advancedCache.invalidateByPattern(cacheKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            } catch (error) {
                this._logger.debug(`Could not invalidate advanced cache for ${describeFile(uri)}: ${error.message}`);
            }
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`🔄 Refreshed decoration cache for: ${describeFile(uri)}`);
    }

    /**
     * Clear decoration for a deleted file
     */
    clearDecoration(uri) {
        if (!uri) {
            return;
        }
        const validation = this._validateWorkspaceUri(uri, 'clearDecoration');
        if (!validation?.isValid) {
            return;
        }

        const cacheKey = this._getCacheKey(uri);
        this._decorationCache.delete(cacheKey);
        if (this._advancedCache) {
            // Advanced cache doesn't have a delete method, so we'll let it expire naturally
            this._logger.debug(`Advanced cache entry will expire naturally: ${describeFile(uri)}`);
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`🗑️ Cleared decoration cache for: ${describeFile(uri)}`);
    }

    /**
     * Clear all caches (memory and advanced cache)
     */
    clearAllCaches() {
        this._cancelIncrementalRefreshTimers();
        // Clear memory cache
        const memorySize = this._decorationCache.size;
        this._decorationCache.clear();
        this._clearDecorationPool('clearAllCaches');
        this._logger.info(`Cleared memory cache (was ${memorySize} items)`);
        
        // Clear advanced cache if available
        if (this._advancedCache) {
            this._advancedCache.clear();
            this._logger.info('Cleared advanced cache');
        }
        
        // Reset metrics
        this._metrics.cacheHits = 0;
        this._metrics.cacheMisses = 0;
        
        this._logger.info('All caches cleared successfully');
    }

    /**
     * Refresh all decorations
     */
    refreshAll(options = {}) {
        const {
            preservePersistentCache = false,
            reason = 'manual-refresh'
        } = options;
        this._cancelIncrementalRefreshTimers();
        this._decorationCache.clear();
        this._clearDecorationPool('refreshAll');
        if (this._gitInsightsManager) {
            this._gitInsightsManager.clearCache();
        }
        // Clear advanced cache if available
        if (this._advancedCache) {
            if (preservePersistentCache && typeof this._advancedCache.resetRuntimeOnly === 'function') {
                this._advancedCache.resetRuntimeOnly();
            } else {
                this._advancedCache.clear();
            }
        }
        this._onDidChangeFileDecorations.fire(undefined);
        const persistenceNote = preservePersistentCache ? ' (persistent cache preserved)' : '';
        this._logger.info(`All decorations refreshed (${reason})${persistenceNote}`);
    }

    /**
     * Simplified exclusion check - bypasses smart exclusion system
     * Made public for diagnostics
     */
    async _isExcludedSimple(uri) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const filePath = getUriPath(uri);
        if (!filePath) {
            return false;
        }
        const normalizedPath = normalizePath(filePath);
        const fileName = getFileName(normalizedPath);
        const fileExt = getExtension(filePath);
        
        // Check if this file type should always be shown (helpful for JPGs, PNGs, etc.)
        const forceShowTypes = config.get('forceShowForFileTypes', []);
        if (forceShowTypes.length > 0 && forceShowTypes.includes(fileExt)) {
            this._logger.debug(`File type ${fileExt} is forced to show: ${filePath}`);
            return false; // Don't exclude
        }
        
        // Enable troubleshooting mode for extra logging
        const troubleshootingMode = config.get('enableTroubleShootingMode', false);
        if (troubleshootingMode) {
            this._logger.info(`🔍 Checking exclusion for: ${fileName} (ext: ${fileExt})`);
        }
        
        // Basic exclusion patterns only
        const excludedFolders = config.get('excludedFolders', ['node_modules', '.git', 'dist', 'build', 'out', '.vscode-test']);
        const excludedPatterns = config.get('excludedPatterns', ['**/*.tmp', '**/*.log', '**/.git/**', '**/node_modules/**']);
        
        // Check excluded folders (simplified)
        for (const folder of excludedFolders) {
            const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
            if (normalizedPath.includes(`/${normalizedFolder}/`) || normalizedPath.endsWith(`/${normalizedFolder}`)) {
                if (troubleshootingMode) {
                    this._logger.info(`❌ File excluded by folder: ${filePath} (${folder})`);
                } else {
                    this._logger.debug(`File excluded by folder: ${filePath} (${folder})`);
                }
                return true;
            }
        }
        
        // Check excluded patterns (simplified)
        for (const pattern of excludedPatterns) {
            if (pattern.includes('node_modules') && normalizedPath.includes('/node_modules/')) {
                return true;
            }
            if (pattern.includes('.git/**') && normalizedPath.includes('/.git/')) {
                return true;
            }
            if (pattern.includes('*.tmp') && fileName.endsWith('.tmp')) {
                return true;
            }
            if (pattern.includes('*.log') && fileName.endsWith('.log')) {
                return true;
            }
        }
        
        if (troubleshootingMode) {
            this._logger.info(`✅ File NOT excluded: ${fileName} (ext: ${fileExt})`);
        }
        
        return false;
    }

    /**
     * Check if a file path should be excluded from decorations (complex version)
     */
    async _isExcluded(uri) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const filePath = getUriPath(uri);
        if (!filePath) {
            return false;
        }
        const normalizedPath = normalizePath(filePath);
        const fileName = getFileName(normalizedPath);
        
        // Get combined exclusions (global + workspace + smart)
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            const combined = this._workspaceIntelligence?.smartExclusion 
                ? await this._workspaceIntelligence.smartExclusion.getCombinedExclusions(workspaceFolder.uri)
                : null;
            
            // Check excluded folders (must be actual directory paths, not just substrings)
            for (const folder of combined.folders) {
                // More precise folder matching - ensure we're matching actual directory boundaries
                const folderPattern = new RegExp(`(^|/)${folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`);
                if (folderPattern.test(normalizedPath)) {
                    this._logger.debug(`File excluded by folder rule: ${filePath} (folder: ${folder})`);
                    return true;
                }
            }
            
            // Check excluded patterns
            for (const pattern of combined.patterns) {
                const regexPattern = pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/\\\\]*')
                    .replace(/\?/g, '.');
                const regex = new RegExp(regexPattern);
                
                if (regex.test(normalizedPath) || regex.test(fileName)) {
                    this._logger.debug(`File excluded by pattern: ${filePath} (pattern: ${pattern})`);
                    return true;
                }
            }
        } else {
            // Fallback to basic exclusions if no workspace
            const excludedFolders = config.get('excludedFolders', []);
            const excludedPatterns = config.get('excludedPatterns', []);
            
            for (const folder of excludedFolders) {
                // More precise folder matching - ensure we're matching actual directory boundaries
                const folderPattern = new RegExp(`(^|/)${folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`);
                if (folderPattern.test(normalizedPath)) {
                    return true;
                }
            }
            
            for (const pattern of excludedPatterns) {
                const regexPattern = pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/\\\\]*')
                    .replace(/\?/g, '.');
                const regex = new RegExp(regexPattern);
                
                if (regex.test(normalizedPath) || regex.test(fileName)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Manage cache size to prevent memory issues
     */
    _manageCacheSize() {
        if (this._decorationCache.size <= this._maxCacheSize) {
            return;
        }

        const removed = this._decorationCache.enforceLimit(this._maxCacheSize, this._logger);
        if (removed > 0) {
            this._metrics.cacheEvictions += removed;
        }
    }

    _maybeExtendCacheTimeout() {
        if (this._isWeb || this._hasCustomCacheTimeout) {
            return;
        }

        const totalLookups = this._metrics.cacheHits + this._metrics.cacheMisses;
        if (totalLookups < 200) {
            return;
        }

        const hitRate = this._metrics.cacheHits / totalLookups;
        
        // Only extend to 8 minutes maximum if sustained high hit rate is confirmed
        // This prevents unbounded timeout extension during usage transitions
        if (hitRate < 0.90 || this._cacheTimeout >= this._maxDesktopCacheTimeout) {
            return;
        }

        if (totalLookups <= this._lastCacheTimeoutBoostLookups) {
            return;
        }

        // Require sustained hit rate (100+ lookups) before extending
        const lookupsSinceLastBoost = totalLookups - this._lastCacheTimeoutBoostLookups;
        if (lookupsSinceLastBoost < 100) {
            return;
        }

        const previousTimeout = this._cacheTimeout;
        this._cacheTimeout = Math.min(this._cacheTimeout + DEFAULT_CACHE_TIMEOUT, this._maxDesktopCacheTimeout);
        this._lastCacheTimeoutBoostLookups = totalLookups;

        this._logger.info('⚙️ Cache timeout extended (max 8min)', {
            previousTimeout,
            newTimeout: this._cacheTimeout,
            hitRate: Number(hitRate.toFixed(2)),
            totalLookups
        });
    }

    async _getCachedDecoration(cacheKey, fileLabel) {
        if (this._forceCacheBypass) {
            this._logger.debug(`⚠️ Cache bypass enabled - recalculating decoration for: ${fileLabel}`);
            return null;
        }

        if (this._advancedCache) {
            try {
                const cached = await this._advancedCache.get(cacheKey);
                if (cached) {
                    this._metrics.cacheHits++;
                    this._logger.debug(`🧠 Advanced cache hit for: ${fileLabel}`);
                    return cached;
                }
            } catch (error) {
                this._logger.debug(`Advanced cache error: ${error.message}`);
            }
        }

        const memoryEntry = this._decorationCache.get(cacheKey);
        if (memoryEntry) {
            if (memoryEntry.forceRefresh) {
                this._decorationCache.delete(cacheKey);
                this._logger.debug(`🚫 Memory cache bypassed (forced refresh) for: ${fileLabel}`);
            } else if ((Date.now() - memoryEntry.timestamp) < this._cacheTimeout) {
                this._metrics.cacheHits++;
                this._logger.debug(`💾 Memory cache hit for: ${fileLabel}`);
                return memoryEntry.decoration;
            }
        }

        return null;
    }

    async _storeDecorationInCache(cacheKey, decoration, fileLabel, resourceUri) {
        if (this._forceCacheBypass) {
            return;
        }

        this._manageCacheSize();
        const cacheEntry = {
            decoration,
            timestamp: Date.now()
        };
        if (resourceUri) {
            cacheEntry.uri = resourceUri;
        }
        this._decorationCache.set(cacheKey, cacheEntry);
        this._monitorCachePressure();

        if (this._advancedCache) {
            try {
                await this._advancedCache.set(cacheKey, decoration, { ttl: this._cacheTimeout });
                this._logger.debug(`🧠 Stored in advanced cache: ${fileLabel}`);
            } catch (error) {
                this._logger.debug(`Failed to store in advanced cache: ${error.message}`);
            }
        }

        this._maybeExtendCacheTimeout();
    }

    _getFlyweightValue(cache, order, limit, key, factory, statsTracker) {
        if (!this._enableFlyweights) {
            if (statsTracker) {
                statsTracker.misses++;
                statsTracker.allocations++;
            }
            return factory();
        }

        if (!key) {
            if (statsTracker) {
                statsTracker.misses++;
                statsTracker.allocations++;
            }
            return factory();
        }

        if (cache.has(key)) {
            if (statsTracker) {
                statsTracker.hits++;
                statsTracker.reuses++;
            }
            return cache.get(key);
        }

        if (statsTracker) {
            statsTracker.misses++;
            statsTracker.allocations++;
        }

        const value = factory();
        cache.set(key, value);
        order.push(key);

        if (order.length > limit) {
            const oldestKey = order.shift();
            if (oldestKey) {
                cache.delete(oldestKey);
            }
        }

        return value;
    }

    _safeHeapUsedMB() {
        try {
            const heapUsed = process?.memoryUsage ? process.memoryUsage().heapUsed : 0;
            return Number((heapUsed / 1024 / 1024).toFixed(2));
        } catch {
            return 0;
        }
    }

    _safeRssMB() {
        try {
            const rss = process?.memoryUsage ? process.memoryUsage().rss : 0;
            return Number((rss / 1024 / 1024).toFixed(2));
        } catch {
            return 0;
        }
    }

    _maybeShedWorkload() {
        if (!this._memorySheddingEnabled || this._memorySheddingActive) {
            return;
        }
        const current = this._safeHeapUsedMB();
        if (!current) {
            return;
        }
        if (!this._memoryBaselineMB) {
            this._memoryBaselineMB = current;
            this._consecutiveSoftHeapBreaches = 0;
            this._softHeapAlertLogged = false;
            return;
        }
        const delta = current - this._memoryBaselineMB;

        if (delta >= this._softHeapAlertThresholdMB) {
            this._consecutiveSoftHeapBreaches++;
            if (this._consecutiveSoftHeapBreaches >= 2 && !this._softHeapAlertLogged) {
                this._softHeapAlertLogged = true;
                this._logger.warn('Memory pressure warning (soft threshold exceeded twice)', {
                    deltaMB: Number(delta.toFixed(2)),
                    baselineMB: this._memoryBaselineMB,
                    heapMB: current,
                    rssMB: this._safeRssMB(),
                    cacheSize: this._decorationCache.size,
                    cacheLimit: this._maxCacheSize
                });
            }
        } else if (this._consecutiveSoftHeapBreaches > 0) {
            this._consecutiveSoftHeapBreaches = 0;
            if (delta < this._softHeapAlertThresholdMB * 0.5) {
                this._softHeapAlertLogged = false;
            }
        }

        if (delta >= this._memorySheddingThresholdMB) {
            this._memorySheddingActive = true;
            this._maxCacheSize = Math.min(this._maxCacheSize, this._memoryShedCacheLimit);
            this._refreshIntervalOverride = Math.max(
                this._refreshIntervalOverride || this._refreshInterval || this._memoryShedRefreshIntervalMs,
                this._memoryShedRefreshIntervalMs
            );
            const rssMB = this._safeRssMB();
            const event = {
                timestamp: new Date().toISOString(),
                deltaMB: Number(delta.toFixed(2)),
                baselineMB: this._memoryBaselineMB,
                heapMB: current,
                rssMB,
                cacheSize: this._decorationCache.size,
                maxCacheSize: this._maxCacheSize,
                watcherStrategy: this._activeWatcherStrategy,
                staticWatchers: this._fileWatchers.size,
                dynamicWatchers: this._dynamicWatchers.size
            };
            this._memorySheddingEvents.push(event);
            if (this._memorySheddingEvents.length > 10) {
                this._memorySheddingEvents.shift();
            }
            this._logger.warn(`Memory shedding activated (delta ${delta.toFixed(2)} MB >= ${this._memorySheddingThresholdMB} MB); cache size capped at ${this._maxCacheSize} and refresh interval stretched to ${this._refreshIntervalOverride}ms`, event);
            this._setupPeriodicRefresh();
            this._softHeapAlertLogged = false;
            this._consecutiveSoftHeapBreaches = 0;
        }
    }

    _monitorCachePressure() {
        if (!this._maxCacheSize || this._maxCacheSize <= 0) {
            return;
        }
        const ratio = this._decorationCache.size / this._maxCacheSize;
        if (ratio >= this._cachePressureThreshold) {
            if (!this._cachePressureLogged) {
                this._cachePressureLogged = true;
                this._logger.infoWithOptions(
                    { throttleKey: 'cache-pressure', intervalMs: 60000 },
                    `Decoration cache usage is at ${(ratio * 100).toFixed(1)}% of capacity`,
                    {
                        cacheSize: this._decorationCache.size,
                        maxCacheSize: this._maxCacheSize
                    }
                );
            }
        } else if (ratio < this._cachePressureThreshold * 0.5) {
            this._cachePressureLogged = false;
        }
    }

    _acquireDecorationFromPool({ badge, tooltip, color }) {
        if (!this._enableDecorationPool) {
            this._decorationPoolStats.misses++;
            this._decorationPoolStats.allocations++;
            const decoration = new vscode.FileDecoration(badge || '??');
            if (tooltip) decoration.tooltip = tooltip;
            if (color) decoration.color = color;
            decoration.propagate = false;
            return decoration;
        }

        if (!badge) {
            this._decorationPoolStats.allocations++;
            return new vscode.FileDecoration('??');
        }

        const key = this._buildDecorationPoolKey(badge, tooltip, color);
        if (key && this._decorationPool.has(key)) {
            this._decorationPoolStats.hits++;
            this._decorationPoolStats.reuses++;
            return this._decorationPool.get(key);
        }

        const decoration = new vscode.FileDecoration(badge);
        if (tooltip) {
            decoration.tooltip = tooltip;
        }
        if (color) {
            decoration.color = color;
        }
        decoration.propagate = false;
        this._decorationPoolStats.allocations++;

        if (key) {
            this._decorationPool.set(key, decoration);
            this._decorationPoolOrder.push(key);
            if (this._decorationPoolOrder.length > this._maxDecorationPoolSize) {
                const oldestKey = this._decorationPoolOrder.shift();
                if (oldestKey && oldestKey !== key) {
                    this._decorationPool.delete(oldestKey);
                }
            }
        }
        this._decorationPoolStats.misses++;

        return decoration;
    }

    _buildDecorationPoolKey(badge, tooltip, color) {
        const normalizedBadge = badge || '';
        const normalizedTooltip = tooltip || '';
        const colorKey = this._getColorIdentifier(color);
        return `${normalizedBadge}::${colorKey}::${normalizedTooltip}`;
    }

    _getColorIdentifier(color) {
        if (!color) {
            return 'none';
        }
        if (typeof color === 'string') {
            return color;
        }
        if (color.id) {
            return color.id;
        }
        try {
            return JSON.stringify(color);
        } catch {
            return String(color);
        }
    }

    _clearDecorationPool(reason = 'unspecified') {
        if (this._decorationPool.size === 0) {
            return;
        }
        this._decorationPool.clear();
        this._decorationPoolOrder.length = 0;
        this._logger.debug(`🧼 Cleared decoration pool (${reason})`);
    }

    _applyReuseCapacitySettings(config) {
        const poolSetting = config?.get ? config.get('decorationPoolSize') : undefined;
        const flyweightSetting = config?.get ? config.get('flyweightCacheSize') : undefined;
        const nextPoolSize = this._coerceCapacitySetting(
            poolSetting,
            DEFAULT_DECORATION_POOL_SIZE,
            128,
            8192
        );
        const nextFlyweightSize = this._coerceCapacitySetting(
            flyweightSetting,
            DEFAULT_FLYWEIGHT_CACHE_SIZE,
            512,
            16384
        );

        const poolChanged = nextPoolSize !== this._maxDecorationPoolSize;
        const flyweightChanged = nextFlyweightSize !== this._badgeFlyweightLimit ||
            nextFlyweightSize !== this._readableDateFlyweightLimit;

        if (poolChanged) {
            this._maxDecorationPoolSize = nextPoolSize;
            this._trimDecorationPoolToLimit();
            this._logger.info(`Decoration pool capacity set to ${nextPoolSize}`);
        }

        if (flyweightChanged) {
            this._badgeFlyweightLimit = nextFlyweightSize;
            this._readableDateFlyweightLimit = nextFlyweightSize;
            this._trimFlyweightCacheToLimit(this._badgeFlyweightCache, this._badgeFlyweightOrder, nextFlyweightSize, 'badge');
            this._trimFlyweightCacheToLimit(this._readableDateFlyweightCache, this._readableDateFlyweightOrder, nextFlyweightSize, 'readable');
            this._logger.info(`Flyweight cache capacity set to ${nextFlyweightSize}`);
        }

        return { poolChanged, flyweightChanged };
    }

    _coerceCapacitySetting(value, fallback, min, max) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return Math.min(Math.max(fallback, min), max);
        }
        const normalized = Math.floor(value);
        if (normalized < min) {
            return min;
        }
        if (normalized > max) {
            return max;
        }
        return normalized;
    }

    _trimDecorationPoolToLimit() {
        if (this._decorationPoolOrder.length <= this._maxDecorationPoolSize) {
            return;
        }
        while (this._decorationPoolOrder.length > this._maxDecorationPoolSize) {
            const oldestKey = this._decorationPoolOrder.shift();
            if (oldestKey) {
                this._decorationPool.delete(oldestKey);
            }
        }
        this._logger.debug(`Trimmed decoration pool to ${this._maxDecorationPoolSize} entries`);
    }

    _trimFlyweightCacheToLimit(cache, order, limit, label) {
        if (!cache || !order) {
            return;
        }
        if (order.length <= limit) {
            return;
        }
        while (order.length > limit) {
            const oldestKey = order.shift();
            if (oldestKey) {
                cache.delete(oldestKey);
            }
        }
        this._logger.debug(`Trimmed ${label} flyweight cache to ${limit} entries`);
    }

    _purgeLightweightCaches(reason = 'lightweight') {
        if (!this._lightweightMode) {
            return;
        }
        if (this._decorationCache.size > 0) {
            this._decorationCache.clear();
        }
        this._clearDecorationPool(reason);
        if (this._badgeFlyweightCache.size > 0) {
            this._badgeFlyweightCache.clear();
            this._badgeFlyweightOrder.length = 0;
        }
        if (this._readableDateFlyweightCache.size > 0) {
            this._readableDateFlyweightCache.clear();
            this._readableDateFlyweightOrder.length = 0;
        }
        this._logger.debug(`🧽 Purged lightweight caches (${reason})`);
    }

    _maybePurgeLightweightCaches() {
        if (!this._lightweightMode) {
            return;
        }
        if (this._lightweightPurgeInterval <= 0) {
            this._purgeLightweightCaches('lightweight-interval-disabled');
            return;
        }
        const total = this._metrics?.totalDecorations || 0;
        if (total > 0 && total % this._lightweightPurgeInterval === 0) {
            this._purgeLightweightCaches('lightweight-interval');
        }
    }

    _buildBadgeDescriptor({ formatType, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, date }) {
        const build = (value, keySuffix = null) => ({
            value,
            key: keySuffix ? `badge:${formatType || 'default'}:${keySuffix}` : null
        });

        switch (formatType) {
            case 'relative-short':
            case 'relative-long':
                if (diffMinutes < 1) return build('●●', 'just');
                if (diffMinutes < 60) return build(`${Math.min(diffMinutes, 99)}m`, `m:${Math.min(diffMinutes, 99)}`);
                if (diffHours < 24) return build(`${Math.min(diffHours, 23)}h`, `h:${Math.min(diffHours, 23)}`);
                if (diffDays < 7) return build(`${diffDays}d`, `d:${diffDays}`);
                if (diffWeeks < 4) return build(`${diffWeeks}w`, `w:${diffWeeks}`);
                if (diffMonths < 12) return build(`${diffMonths}M`, `M:${diffMonths}`);
                return build('1y', 'y:1');

            case 'absolute-short':
            case 'absolute-long': {
                const day = date.getDate();
                const badge = `${MONTH_ABBREVIATIONS[date.getMonth()]}${day < 10 ? '0' + day : day}`;
                const keyParts = [date.getMonth(), day];
                if (formatType === 'absolute-long') {
                    keyParts.push(date.getFullYear());
                }
                return build(badge, `abs:${keyParts.join('-')}`);
            }

            case 'technical':
                if (diffMinutes < 60) return build(`${diffMinutes}m`, `tech:m:${diffMinutes}`);
                if (diffHours < 24) return build(`${diffHours}h`, `tech:h:${diffHours}`);
                return build(`${diffDays}d`, `tech:d:${diffDays}`);

            case 'minimal':
                if (diffHours < 1) return build('••', 'min:now');
                if (diffHours < 24) return build('○○', 'min:hours');
                return build('──', 'min:days');

            default: {
                if (diffMinutes < 60) return build(`${diffMinutes}m`, `smart:m:${diffMinutes}`);
                if (diffHours < 24) return build(`${diffHours}h`, `smart:h:${diffHours}`);
                return build(`${diffDays}d`, `smart:d:${diffDays}`);
            }
        }
    }

    /**
     * Format date badge - VS Code compliant 2-character indicators
     * Based on user experience that VS Code supports at least 2 characters
     */
    _formatDateBadge(date, formatType, precalcDiffMs = null) {
        const now = new Date();
        const diffMs = precalcDiffMs !== null ? precalcDiffMs : (now.getTime() - date.getTime());
        
        if (diffMs < 0) {
            this._logger.debug(`File has future modification time (diffMs: ${diffMs}), treating as just modified`);
            return '●●';
        }
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        const descriptor = this._buildBadgeDescriptor({
            formatType,
            diffMinutes,
            diffHours,
            diffDays,
            diffWeeks,
            diffMonths,
            date
        });

        return this._getFlyweightValue(
            this._badgeFlyweightCache,
            this._badgeFlyweightOrder,
            this._badgeFlyweightLimit,
            descriptor.key,
            () => descriptor.value,
            this._badgeFlyweightStats
        );
    }

    /**
     * Format file size for display
     */
    _formatFileSize(bytes, format = 'auto') {
        return formatFileSize(bytes, format);
    }

    _buildReadableDescriptor(date, now, diffMins, diffHours, diffDays) {
        const sameDay = date.toDateString() === now.toDateString();
        if (diffMins < 1) {
            return {
                key: 'readable:just',
                factory: () => this._l10n.getString('justNow')
            };
        }
        if (diffMins < 60) {
            return {
                key: `readable:minutes:${diffMins}`,
                factory: () => this._l10n.getString('minutesAgo', diffMins)
            };
        }
        if (diffHours < 24 && sameDay) {
            return {
                key: `readable:hours:${diffHours}`,
                factory: () => this._l10n.getString('hoursAgo', diffHours)
            };
        }
        if (diffDays < 7) {
            if (diffDays === 1) {
                return {
                    key: 'readable:yesterday',
                    factory: () => this._l10n.getString('yesterday')
                };
            }
            return {
                key: `readable:days:${diffDays}`,
                factory: () => this._l10n.getString('daysAgo', diffDays)
            };
        }
        return null;
    }

    /**
     * Get color based on color scheme setting
     */
    _getColorByScheme(date, colorScheme, filePath = '') {
        if (colorScheme === 'none') {
            return undefined;
        }
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        switch (colorScheme) {
            case 'recency':
                // Green: Modified within 1 hour
                if (diffHours < 1) return new vscode.ThemeColor('charts.green');
                // Yellow: Modified within 1 day
                if (diffHours < 24) return new vscode.ThemeColor('charts.yellow');
                // Red: Modified more than 1 day ago
                return new vscode.ThemeColor('charts.red');
            
            case 'file-type': {
                // Color by file extension
                const ext = getExtension(filePath);
                if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) return new vscode.ThemeColor('charts.blue');
                if (['.css', '.scss', '.less'].includes(ext)) return new vscode.ThemeColor('charts.purple');
                if (['.html', '.htm', '.xml'].includes(ext)) return new vscode.ThemeColor('charts.orange');
                if (['.json', '.yaml', '.yml'].includes(ext)) return new vscode.ThemeColor('charts.green');
                if (['.md', '.txt', '.log'].includes(ext)) return new vscode.ThemeColor('charts.yellow');
                if (['.py', '.rb', '.php'].includes(ext)) return new vscode.ThemeColor('charts.red');
                return new vscode.ThemeColor('editorForeground');
            }
            
            case 'subtle':
                // Subtle variations using text colors
                if (diffHours < 1) return new vscode.ThemeColor('editorInfo.foreground');
                if (diffDays < 7) return new vscode.ThemeColor('editorWarning.foreground');
                return new vscode.ThemeColor('editorError.foreground');
            
            case 'vibrant':
                // More vibrant colors
                if (diffHours < 1) return new vscode.ThemeColor('terminal.ansiGreen');
                if (diffHours < 24) return new vscode.ThemeColor('terminal.ansiYellow');
                if (diffDays < 7) return new vscode.ThemeColor('terminal.ansiMagenta');
                return new vscode.ThemeColor('terminal.ansiRed');
            
            case 'custom': {
                // Use custom color IDs registered in package.json
                // Users customize these colors via workbench.colorCustomizations
                // Example: "explorerDates.customColor.veryRecent": "#FF6095"
                if (diffHours < 1) {
                    return new vscode.ThemeColor('explorerDates.customColor.veryRecent');
                }
                if (diffHours < 24) {
                    return new vscode.ThemeColor('explorerDates.customColor.recent');
                }
                return new vscode.ThemeColor('explorerDates.customColor.old');
            }
            
            default:
                return undefined;
        }
    }

    _generateBadgeDetails({ filePath, stat, diffMs, dateFormat, badgePriority, showFileSize, fileSizeFormat, gitBlame, showGitInfo }) {
        const badge = this._formatDateBadge(stat.mtime, dateFormat, diffMs);
        const readableModified = this._formatDateReadable(stat.mtime);
        const readableCreated = this._formatDateReadable(stat.birthtime);
        let displayBadge = badge;

        this._logger.debug(`🏷️ Badge generation for ${describeFile(filePath)}: badgePriority=${badgePriority}, showGitInfo=${showGitInfo}, hasGitBlame=${!!gitBlame}, authorName=${gitBlame?.authorName}, previewMode=${!!this._previewSettings}`);

        if (badgePriority === 'author' && gitBlame?.authorName) {
            const initials = this._getInitials(gitBlame.authorName);
            if (initials) {
                displayBadge = initials;
                this._logger.debug(`🏷️ Using author initials badge: "${initials}" (from ${gitBlame.authorName})`);
            }
        } else if (badgePriority === 'size' && showFileSize) {
            const compact = this._formatCompactSize(stat.size);
            if (compact) {
                displayBadge = compact;
                this._logger.debug(`🏷️ Using size badge: "${compact}"`);
            }
        } else {
            this._logger.debug(`🏷️ Using time badge: "${badge}" (badgePriority=${badgePriority})`);
        }

        return {
            badge,
            displayBadge,
            readableModified,
            readableCreated,
            fileSizeLabel: showFileSize ? this._formatFileSize(stat.size, fileSizeFormat) : null
        };
    }

    async _buildTooltipContent({ filePath, resourceUri, stat, badgeDetails, gitBlame, shouldUseAccessibleTooltips, fileSizeFormat, isCodeFile }) {
        const fileDisplayName = describeFile(filePath);
        const fileExt = getExtension(filePath);

        if (shouldUseAccessibleTooltips) {
            const accessibleTooltip = this._accessibility?.getAccessibleTooltip?.(filePath, stat.mtime, stat.birthtime, stat.size, gitBlame);
            if (accessibleTooltip) {
                this._logger.info(`🔍 Using accessible tooltip (${accessibleTooltip.length} chars): "${accessibleTooltip.substring(0, 50)}..."`);
                return accessibleTooltip;
            }
            this._logger.info('🔍 Accessible tooltip generation failed, using rich tooltip');
        }

        let tooltip = `📄 File: ${fileDisplayName}\n`;
        tooltip += `📝 Last Modified: ${badgeDetails.readableModified}\n`;
        tooltip += `   ${this._formatFullDate(stat.mtime)}\n\n`;
        tooltip += `📅 Created: ${badgeDetails.readableCreated}\n`;
        tooltip += `   ${this._formatFullDate(stat.birthtime)}\n\n`;

        const sizeLabel = badgeDetails.fileSizeLabel || this._formatFileSize(stat.size, fileSizeFormat || 'auto');
        tooltip += `📊 Size: ${sizeLabel} (${stat.size.toLocaleString()} bytes)\n`;

        if (fileExt) {
            tooltip += `🏷️ Type: ${fileExt.toUpperCase()} file\n`;
        }

        if (isCodeFile) {
            try {
                const contentSource = resourceUri || filePath;
                const content = await this._fileSystem.readFile(contentSource, 'utf8');
                const lineCount = content.split('\n').length;
                tooltip += `📏 Lines: ${lineCount.toLocaleString()}\n`;
            } catch {
                // Silently skip line count if file can't be read
            }
        }

        tooltip += `📂 Path: ${filePath}`;

        if (gitBlame) {
            tooltip += `\n\n👤 Last Modified By: ${gitBlame.authorName}`;
            if (gitBlame.authorEmail) {
                tooltip += ` (${gitBlame.authorEmail})`;
            }
            if (gitBlame.authorDate) {
                tooltip += `\n   ${gitBlame.authorDate}`;
            }
        }

        return tooltip;
    }

    _buildSummaryTooltip({ filePath, stat, badgeDetails }) {
        const parts = [];
        if (badgeDetails?.readableModified) {
            parts.push(`Modified ${badgeDetails.readableModified}`);
        }
        const sizeLabel = badgeDetails?.fileSizeLabel || (stat?.size ? this._formatFileSize(stat.size, 'auto') : null);
        if (sizeLabel) {
            parts.push(sizeLabel);
        }
        return `${describeFile(filePath)} — ${parts.filter(Boolean).join(' • ') || this._formatFullDate(stat?.mtime || new Date())}`;
    }

    /**
     * Format readable date for tooltip
     */
    _formatDateReadable(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const descriptor = this._buildReadableDescriptor(date, now, diffMins, diffHours, diffDays);

        if (descriptor) {
            return this._getFlyweightValue(
                this._readableDateFlyweightCache,
                this._readableDateFlyweightOrder,
                this._readableDateFlyweightLimit,
                descriptor.key,
                descriptor.factory,
                this._readableFlyweightStats
            );
        }

        if (date.getFullYear() === now.getFullYear()) {
            return this._l10n.formatDate(date, { month: 'short', day: 'numeric' });
        }

        return this._l10n.formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Get Git blame information for a file
     */
    async _getGitBlameInfo(filePath, statMtimeMs = null) {
        if (DISABLE_GIT_FEATURES) {
            return null;
        }

        // Load git insights manager when git features are needed
        const gitManager = await this._loadGitInsightsChunk();
        if (!gitManager || typeof gitManager.getGitBlameInfo !== 'function') {
            return null;
        }
        
        try {
            return await gitManager.getGitBlameInfo(filePath, statMtimeMs);
        } catch (error) {
            this._logger.warn('Git blame lookup failed', {
                filePath,
                message: error?.message || String(error)
            });
            return null;
        }
    }

    /**
     * Get initials (up to 2 characters) from a full name
     */
    _getInitials(fullName) {
        // Use git insights manager for initials generation if available
        if (this._gitInsightsManager) {
            return this._gitInsightsManager.getInitials(fullName);
        }
        
        // Fallback implementation
        if (!fullName || typeof fullName !== 'string') return null;
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return null;
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + (parts[1][0] || '')).substring(0, 2).toUpperCase();
    }

    /**
     * Format a very compact size string (max 2 characters) for badges.
     * Strategy: prefer `<digit><unit>` where possible (e.g. '5K', '2M'),
     * fall back to two-digit number when needed (e.g. '12').
     */
    _formatCompactSize(bytes) {
        if (typeof bytes !== 'number' || isNaN(bytes)) return null;
        const units = ['B', 'K', 'M', 'G', 'T'];
        let i = 0;
        let val = bytes;
        while (val >= 1024 && i < units.length - 1) {
            val = val / 1024;
            i++;
        }
        const rounded = Math.round(val);
        const unit = units[i];

        if (rounded <= 9) {
            return `${rounded}${unit}`; // fits 2 chars
        }

        // If rounded is two digits, prefer showing digits (lose unit)
        const s = String(rounded);
        if (s.length >= 2) return s.slice(0, 2);

        return s;
    }

    /**
     * Format full date with timezone
     */
    _formatFullDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        };
        return date.toLocaleString('en-US', options);
    }

    /**
     * Normalize cache key to handle different URI representations
     */
    _getCacheKey(uri) {
        const rawKey = buildCacheKey(getUriPath(uri));
        if (!this._cacheNamespace) {
            return rawKey;
        }
        return `${this._cacheNamespace}${CACHE_NAMESPACE_SEPARATOR}${rawKey}`;
    }

    _stripNamespaceFromCacheKey(key) {
        if (!key || typeof key !== 'string') {
            return key;
        }
        const separatorIndex = key.indexOf(CACHE_NAMESPACE_SEPARATOR);
        if (separatorIndex === -1) {
            return key;
        }
        return key.slice(separatorIndex + CACHE_NAMESPACE_SEPARATOR.length);
    }

    _stableHash(payload) {
        const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    _buildCacheNamespace(config) {
        try {
            const resolvedConfig = config || vscode.workspace.getConfiguration('explorerDates');
            const settings = {
                dateDecorationFormat: resolvedConfig.get('dateDecorationFormat', 'smart'),
                showGitInfo: resolvedConfig.get('showGitInfo', true),
                showFileSize: resolvedConfig.get('showFileSize', false),
                fileSizeFormat: resolvedConfig.get('fileSizeFormat', 'auto'),
                colorScheme: resolvedConfig.get('colorScheme', 'recency'),
                highContrastMode: resolvedConfig.get('highContrastMode', false),
                fadeOldFiles: resolvedConfig.get('fadeOldFiles', false),
                fadeThreshold: resolvedConfig.get('fadeThreshold', 72),
                badgePriority: resolvedConfig.get('badgePriority', 'time'),
                showDateDecorations: resolvedConfig.get('showDateDecorations', true),
                excludedFolders: (resolvedConfig.get('excludedFolders', []) || []).join('|'),
                excludedPatterns: (resolvedConfig.get('excludedPatterns', []) || []).join('|'),
                customColors: JSON.stringify(resolvedConfig.get('customColors', {})),
                metadataVersion: 2
            };
            return `ns-${this._stableHash(settings).slice(0, 8)}`;
        } catch (error) {
            this._logger.debug(`Failed to build cache namespace: ${error.message}`);
            return 'ns-default';
        }
    }

    _updateCacheNamespace(config) {
        const nextNamespace = this._buildCacheNamespace(config);
        if (nextNamespace && nextNamespace !== this._cacheNamespace) {
            const previous = this._cacheNamespace;
            this._cacheNamespace = nextNamespace;
            this._logger.info(`Cache namespace updated (${previous || 'unset'} → ${nextNamespace})`);
            return true;
        }
        return false;
    }

    /**
     * Determine if an error represents a missing file/directory
     */
    _isFileNotFoundError(error) {
        if (!error) {
            return false;
        }
        if (error.code === 'ENOENT') {
            return true;
        }
        return typeof error.message === 'string' && error.message.includes('ENOENT');
    }

    /**
     * Acquire a global concurrency slot; callers must invoke the returned release function.
     */
    async _acquireGlobalSlot() {
        if (this._activeOperations < this._maxConcurrentOperations) {
            this._activeOperations++;
            return () => this._releaseGlobalSlot();
        }

        return new Promise((resolve) => {
            this._globalConcurrencyQueue.push(() => {
                this._activeOperations++;
                resolve(() => this._releaseGlobalSlot());
            });
        });
    }

    _releaseGlobalSlot() {
        this._activeOperations = Math.max(0, this._activeOperations - 1);

        while (this._globalConcurrencyQueue.length > 0 && this._activeOperations < this._maxConcurrentOperations) {
            const next = this._globalConcurrencyQueue.shift();
            next();
        }
    }

    _getScaleConcurrencyLimit() {
        if (this._lightweightMode || this._performanceModeAuto || this._workspaceScale === 'extreme' || this._performanceMode) {
            return Math.min(this._maxConcurrentOperationsBase, 10);
        }
        if (this._workspaceScale === 'large') {
            return Math.min(this._maxConcurrentOperationsBase, 14);
        }
        return this._maxConcurrentOperationsBase;
    }

    /**
     * Thread-safe wrapper for file operations
     * @param {string} filePath - The file path to lock
     * @param {Function} operation - The operation to perform
     * @returns {Promise<any>}
     */
    async _withFileLock(filePath, operation) {
        // Get or create lock for this file
        if (!this._fileLocks.has(filePath)) {
            this._fileLocks.set(filePath, Promise.resolve());
        }

        const currentLock = this._fileLocks.get(filePath);
        const newLock = currentLock.then(async () => {
            const release = await this._acquireGlobalSlot();
            try {
                return await operation();
            } finally {
                release();
            }
        });

        this._fileLocks.set(filePath, newLock);
        return newLock;
    }

    /**
     * Checks for memory pressure and performs cleanup if needed
     */
    _checkMemoryPressure() {
        const now = Date.now();
        if (!this._lastMemoryCheck) this._lastMemoryCheck = now;
        if (now - this._lastMemoryCheck < 30000) return; // 30 seconds
        
        this._lastMemoryCheck = now;
        const cacheSize = this._decorationCache.size || 0;
        const maxSize = 10000; // Use reasonable default
        const pressure = cacheSize / maxSize;
        
        if (pressure > 0.8) {
            this._logger.warn('🧠 Memory pressure detected, performing cleanup', {
                cacheSize,
                maxSize,
                pressure: (pressure * 100).toFixed(1) + '%'
            });
            
            // Clear cache during high pressure
            this._decorationCache.clear();
            
            // Reduce concurrent operations temporarily
            this._maxConcurrentOperations = Math.max(5, this._maxConcurrentOperations * 0.5);
            
            setTimeout(() => {
                this._maxConcurrentOperations = this._getScaleConcurrencyLimit();
                this._logger.info('🔄 Restored scale-aware concurrency limits');
            }, 60000);
        }
    }

    /**
     * Creates a minimal decoration for high-load scenarios
     */
    _createMinimalDecoration(uri, startTime) {
        const processingTime = Date.now() - startTime;
        const decoration = {
            badge: '⚡',
            tooltip: `High load mode - ${pathCompat.basename(uri.fsPath)}`,
            color: new vscode.ThemeColor('charts.yellow')
        };
        
        this._logger.info('⚡ Created minimal decoration for high load', {
            file: pathCompat.basename(uri.fsPath),
            processingTimeMs: processingTime
        });
        
        return decoration;
    }

    /**
     * Get file decoration with enhanced caching
     */
    async provideFileDecoration(uri, token) {
        // Early disposal check
        if (this._disposed) {
            if (!this._disposedNoticeLogged) {
                const disposeLogOptions = {
                    throttleKey: 'provider:disposed',
                    throttleLimit: 1,
                    profile: 'default'
                };
                if (typeof this._logger.infoWithOptions === 'function') {
                    this._logger.infoWithOptions(disposeLogOptions, '🚫 Provider disposed, rejecting operation');
                } else {
                    this._logger.info('🚫 Provider disposed, rejecting operation');
                }
                this._disposedNoticeLogged = true;
            }
            return undefined;
        }

        const startTime = Date.now();

        if (!uri) {
            this._logger.error('❌ Invalid URI provided to provideFileDecoration:', uri);
            return undefined;
        }

        const filePath = uri.fsPath;
        
        if (!filePath) {
            return undefined;
        }

        // Early performance mode check - skip all decorations when enabled with invalid type
        const config = vscode.workspace.getConfiguration('explorerDates');
        const perfModeValue = config.get('performanceMode', false);
        if (perfModeValue && typeof perfModeValue !== 'boolean') {
            return null;
        }

        // Validate file path doesn't contain null characters
        if (filePath && filePath.includes('\x00')) {
            this._logger.warn('🚫 Skipping file with null character in path:', filePath);
            return null;
        }

        const resolvedFilePath = getUriPath(uri);
        if (!resolvedFilePath) {
            this._logger.error('❌ Could not resolve path for URI in provideFileDecoration:', uri);
            return undefined;
        }

        const fileLabel = describeFile(resolvedFilePath);
        const normalizedFilePath = normalizePath(resolvedFilePath);
        const scheme = uri.scheme || 'file';

        if (scheme !== 'file') {
            this._logger.debug(`⏭️ Skipping decoration for ${fileLabel} (unsupported scheme: ${scheme})`);
            return undefined;
        }

        const securityValidation = this._validateWorkspaceUri(uri, 'provideFileDecoration');
        if (!securityValidation?.isValid) {
            return undefined;
        }

        if (await this._isExcludedSimple(uri)) {
            if (!this._performanceMode) {
                this._logger.debug(`❌ File excluded: ${fileLabel}`);
            }
            return undefined;
        }

        // Use file locking for thread safety
        return this._withFileLock(filePath, async () => {
            try {
                // Only log call context in debug mode to reduce log noise
                this._logger.debug(`📊 Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);
                
                // Early cancellation check
                if (token?.isCancellationRequested || this._disposed) {
                    this._logger.debug('🚫 Operation cancelled early');
                    return undefined;
                }

                // Reduce verbose logging in performance mode
                if (!this._performanceMode) {
                    this._logger.debug(`🔍 VSCODE REQUESTED DECORATION: ${fileLabel} (${filePath})`);
                    // Only log call context details at debug level to reduce noise
                    this._logger.debug(`📊 Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);
                }

                const config = vscode.workspace.getConfiguration('explorerDates');
                const _get = (key, def) => {
                    if (this._previewSettings && Object.prototype.hasOwnProperty.call(this._previewSettings, key)) {
                        const previewValue = this._previewSettings[key];
                        this._logger.debug(`🎭 Using preview value for ${key}: ${previewValue} (config has: ${config.get(key, def)})`);
                        return previewValue;
                    }
                    return config.get(key, def);
                };

                if (this._previewSettings) {
                    this._logger.infoWithOptions(this._stressLogOptions, `🎭 Processing ${fileLabel} in PREVIEW MODE with settings:`, () => this._previewSettings);
                }

                if (!_get('showDateDecorations', true)) {
                    if (!this._performanceMode) {
                        this._logger.debug(`❌ RETURNED UNDEFINED: Decorations disabled globally for ${fileLabel}`);
                    }
                    return undefined;
                }

                this._logger.debug(`🔍 Processing file: ${fileLabel}`);

                const isViewportPriority = this._isViewportPriority(uri);
                this._recordViewportActivity(uri, {
                    reason: 'decoration-request',
                    visible: normalizedFilePath ? this._viewportVisibleFiles.has(normalizedFilePath) : false
                });
                if (isViewportPriority) {
                    this._metrics.viewportPriorityDecorations++;
                } else {
                    this._metrics.viewportBackgroundDecorations++;
                }

                const featureProfile = this._featureProfile || this._buildFeatureProfile(this._featureLevel);

                const cacheKey = this._getCacheKey(uri);
                if (!this._previewSettings) {
                    const cachedDecoration = await this._getCachedDecoration(cacheKey, fileLabel);
                    if (cachedDecoration) {
                        return cachedDecoration;
                    }
                } else {
                    this._logger.debug(`🔄 Skipping cache due to active preview settings for: ${fileLabel}`);
                }

                // Performance mode check - only downgrade when we're both saturated and queueing work
                const queuedCount = this._globalConcurrencyQueue.length;
                const isBacklogged = queuedCount >= this._maxConcurrentOperations; // only treat as backlog when queue rivals capacity
                const isAtCapacity = this._activeOperations > this._maxConcurrentOperations * 0.8;
                if (isAtCapacity && isBacklogged) {
                    this._logger.warn('⚡ High load detected, switching to fast mode', {
                        activeOps: this._activeOperations,
                        threshold: this._maxConcurrentOperations * 0.8,
                        queued: queuedCount
                    });
                    return this._createMinimalDecoration(uri, startTime);
                }

                // Check for memory pressure periodically
                this._checkMemoryPressure();

                this._metrics.cacheMisses++;
                this._logger.debug(`❌ Cache miss for: ${fileLabel} (key: ${cacheKey.substring(0, 50)}...)`);

                if (token?.isCancellationRequested) {
                    this._logger.debug(`Decoration cancelled for: ${filePath}`);
                    return undefined;
                }

                let stat = null;
                if (!isViewportPriority && this._workspaceIntelligence?.incrementalIndexer) {
                    const indexed = this._workspaceIntelligence.incrementalIndexer.getIndexedStat(filePath);
                    if (indexed) {
                        stat = indexed;
                        this._logger.debug(`Indexed stat hit for ${fileLabel}`);
                    }
                }

                const fileStatStartTime = Date.now();
                if (!stat) {
                    try {
                        stat = await this._fileSystem.stat(uri);
                    } catch (statError) {
                        this._metrics.fileStatTimeMs += Date.now() - fileStatStartTime;
                        this._metrics.fileStatCalls++;

                        if (this._isFileNotFoundError(statError)) {
                            this._logger.debug(`⏭️ Skipping decoration for ${fileLabel}: file not found (${statError.message || statError})`);
                            return undefined;
                        }

                        throw statError;
                    }
                    if (this._workspaceIntelligence?.incrementalIndexer) {
                        this._workspaceIntelligence.incrementalIndexer.primeFromStat(uri, stat);
                    }
                }
                this._metrics.fileStatTimeMs += Date.now() - fileStatStartTime;
                this._metrics.fileStatCalls++;
                
                const isRegularFile = typeof stat.isFile === 'function' ? stat.isFile() : true;
                if (!isRegularFile) {
                    return undefined;
                }

                const modifiedAt = ensureDate(stat.mtime);
                const createdAt = ensureDate(stat.birthtime || stat.ctime || stat.mtime);
                const normalizedStat = {
                    mtime: modifiedAt,
                    birthtime: createdAt,
                    size: stat.size
                };
                const diffMs = Date.now() - modifiedAt.getTime();
    
                const dateFormat = _get('dateDecorationFormat', 'smart');
                let colorScheme = this._performanceMode ? 'none' : _get('colorScheme', 'none');
                const highContrastMode = _get('highContrastMode', false);
                let showFileSize = this._performanceMode ? false : _get('showFileSize', false);
                const fileSizeFormat = _get('fileSizeFormat', 'auto');
                let accessibilityMode = _get('accessibilityMode', false);
                const fadeOldFiles = this._performanceMode ? false : _get('fadeOldFiles', false);
                const fadeThreshold = _get('fadeThreshold', 30);
                let rawShowGitInfo = this._performanceMode ? 'none' : _get('showGitInfo', 'none');
                let badgePriority = this._performanceMode ? 'time' : _get('badgePriority', 'time');
    
                if (!featureProfile.enableColors) {
                    colorScheme = 'none';
                }
                if (!featureProfile.enableFileSize) {
                    showFileSize = false;
                }
                if (!featureProfile.enableAccessibility) {
                    accessibilityMode = false;
                }
                if (!featureProfile.enableGit) {
                    rawShowGitInfo = 'none';
                }
    
                if (this._lightweightMode) {
                    colorScheme = 'none';
                    showFileSize = false;
                    accessibilityMode = false;
                    rawShowGitInfo = 'none';
                    badgePriority = 'time';
                }
    
                const applyBackgroundPolicy = !isViewportPriority && featureProfile.applyBackgroundLimits;
                if (applyBackgroundPolicy) {
                    colorScheme = 'none';
                    showFileSize = false;
                    rawShowGitInfo = 'none';
                    if (badgePriority !== 'time') {
                        badgePriority = 'time';
                    }
                }
    
                const gitFeaturesRequested = (rawShowGitInfo !== 'none') || (badgePriority === 'author');
                const gitFeaturesEnabled = gitFeaturesRequested &&
                    this._gitAvailable &&
                    !this._performanceMode &&
                    featureProfile.enableGit;
                const showGitInfo = gitFeaturesEnabled ? rawShowGitInfo : 'none';
                if (badgePriority === 'author' && !gitFeaturesEnabled) {
                    badgePriority = 'time';
                }
    
                const gitBlame = gitFeaturesEnabled ? await this._getGitBlameInfo(filePath, modifiedAt.getTime()) : null;
    
                const badgeDetails = this._generateBadgeDetails({
                    filePath,
                    stat: normalizedStat,
                    diffMs,
                    dateFormat,
                    badgePriority,
                    showFileSize,
                    fileSizeFormat,
                    gitBlame,
                    showGitInfo
                });
    
                const fileExt = getExtension(filePath);
                const isCodeFile = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.php', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.kt', '.swift'].includes(fileExt);
                const shouldUseAccessibleTooltips = accessibilityMode && this._accessibility?.shouldEnhanceAccessibility();
                const tooltipPreference = isViewportPriority
                    ? (featureProfile.enableRichTooltips ? 'rich' : 'summary')
                    : (featureProfile.backgroundTooltipMode || 'off');
                this._logger.debug(`🔍 Tooltip generation for ${fileLabel}: accessibilityMode=${accessibilityMode}, shouldUseAccessible=${shouldUseAccessibleTooltips}, preference=${tooltipPreference}, previewMode=${!!this._previewSettings}`);
    
                let tooltip;
                if (tooltipPreference === 'rich') {
                    tooltip = await this._buildTooltipContent({
                        filePath,
                        resourceUri: uri,
                        stat: normalizedStat,
                        badgeDetails,
                        gitBlame: showGitInfo === 'none' ? null : gitBlame,
                        shouldUseAccessibleTooltips,
                        fileSizeFormat,
                        isCodeFile
                    });
                } else if (tooltipPreference === 'summary') {
                    tooltip = this._buildSummaryTooltip({
                        filePath,
                        stat: normalizedStat,
                        badgeDetails
                    });
                } else {
                    tooltip = undefined;
                }
    
                let color = undefined;
                if (colorScheme !== 'none') {
                    color = this._themeIntegration
                        ? this._themeIntegration.applyThemeAwareColorScheme?.(colorScheme, filePath, diffMs)
                        : this._getColorByScheme(modifiedAt, colorScheme, filePath);
                }
                this._logger.debug(`🎨 Color scheme setting: ${colorScheme}, using color: ${color ? 'yes' : 'no'}`);
    
                let finalBadge = trimBadge(badgeDetails.displayBadge) || trimBadge(badgeDetails.badge) || '??';
                if (this._accessibility?.shouldEnhanceAccessibility?.()) {
                    finalBadge = this._accessibility.getAccessibleBadge?.(finalBadge) || finalBadge;
                }
    
                let decoration;
                let decorationColor = color;
                if (decorationColor) {
                    decorationColor = this._enhanceColorForSelection(decorationColor);
                    this._logger.debug(`🎨 Added enhanced color: ${decorationColor.id || decorationColor} (original: ${color?.id || color})`);
                }
    
                if (fadeOldFiles) {
                    const daysSinceModified = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    if (daysSinceModified > fadeThreshold) {
                        decorationColor = new vscode.ThemeColor('editorGutter.commentRangeForeground');
                    }
                }
    
                if (highContrastMode) {
                    decorationColor = new vscode.ThemeColor('editorWarning.foreground');
                    this._logger.info(`🔆 Applied high contrast color (overriding colorScheme=${colorScheme})`);
                }
    
                const safeTooltip = tooltip && tooltip.length < 500 ? tooltip : undefined;
    
                try {
                    decoration = this._acquireDecorationFromPool({
                        badge: finalBadge,
                        tooltip: safeTooltip,
                        color: decorationColor
                    });
                    if (safeTooltip) {
                        this._logger.debug(`📝 Added tooltip (${safeTooltip.length} chars)`);
                    }
                } catch (decorationError) {
                    this._logger.error('❌ Failed to create decoration:', decorationError);
                    decoration = new vscode.FileDecoration('!!');
                    decoration.propagate = false;
                }
    
                this._logger.debug(`🎨 Color/contrast check for ${fileLabel}: colorScheme=${colorScheme}, highContrastMode=${highContrastMode}, hasColor=${!!decorationColor}, previewMode=${!!this._previewSettings}`);
    
                if (!this._previewSettings) {
                    await this._storeDecorationInCache(cacheKey, decoration, fileLabel, uri);
                } else {
                    this._logger.debug(`🔄 Skipping cache storage due to preview mode for: ${fileLabel}`);
                }
    
                this._metrics.totalDecorations++;
                this._maybeShedWorkload();
                this._maybePurgeLightweightCaches();
    
                if (!decoration?.badge) {
                    this._logger.error(`❌ Decoration badge is invalid for: ${fileLabel}`);
                    return undefined;
                }
    
                const processingTime = Date.now() - startTime;
                if (!this._performanceMode) {
                    this._logger.infoWithOptions(this._stressLogOptions, `✅ Decoration created for: ${fileLabel} (badge: ${decoration.badge || 'undefined'}) - Cache key: ${cacheKey.substring(0, 30)}...`);
                    this._logger.infoWithOptions(
                        this._stressLogOptions,
                        '🎯 RETURNING DECORATION TO VSCODE:',
                        () => ({
                            file: fileLabel,
                            badge: decoration.badge,
                            hasTooltip: !!decoration.tooltip,
                            hasColor: !!decoration.color,
                            colorType: decoration.color?.constructor?.name,
                            processingTimeMs: processingTime,
                            decorationType: decoration.constructor.name
                        })
                    );
                }
    
                return decoration;
        } catch (error) {
            this._metrics.errors++;
            const processingTime = startTime ? Date.now() - startTime : 0;
            const safeFileName = describeFile(uri);
            const safeUri = getUriPath(uri) || 'unknown-uri';
            const errorMessage = (error && typeof error.message === 'string') ? error.message : 'Unknown error';
            const errorStack = (error && typeof error.stack === 'string') ? error.stack : 'No stack available';
            const errorType = error?.constructor?.name || 'UnknownError';

            this._logger.error(`❌ DECORATION ERROR for ${safeFileName}:`, {
                error: errorMessage,
                stack: errorStack.split('\n')[0] || errorStack,
                processingTimeMs: processingTime,
                uri: safeUri
            });

            this._logger.error(`❌ CRITICAL ERROR DETAILS for ${safeFileName}: ${errorMessage}`);
            this._logger.error(`❌ Error type: ${errorType}`);
            this._logger.error(`❌ Full stack: ${errorStack}`);

            this._logger.info(`❌ RETURNED UNDEFINED: Error occurred for ${safeFileName}`);
            return undefined;
        }
        }).catch(error => {
            // Handle locking/concurrency errors
            this._logger.error('🔒 File locking error', { filePath, error: error.message });
            return undefined;
        });
    }

    _determineFeatureLevel(config) {
        if (this._performanceMode || this._lightweightMode) {
            return 'minimal';
        }

        let resolved = 'auto';
        try {
            const targetConfig = config || vscode.workspace.getConfiguration('explorerDates');
            resolved = (targetConfig.get('featureLevel', 'auto') || 'auto').toLowerCase();
        } catch {
            resolved = 'auto';
        }

        if (FEATURE_LEVELS.includes(resolved)) {
            return resolved;
        }

        switch (this._workspaceScale) {
            case 'extreme':
                return 'standard';
            case 'large':
                return 'standard';
            default:
                return 'full';
        }
    }

    _applyFeatureLevel(nextLevel, reason = 'unspecified') {
        if (!nextLevel) {
            return false;
        }
        if (!FEATURE_LEVELS.includes(nextLevel)) {
            nextLevel = 'full';
        }

        const levelChanged = this._featureLevel !== nextLevel || !this._featureProfile;
        this._featureLevel = nextLevel;
        const profile = levelChanged ? this._buildFeatureProfile(nextLevel) : this._featureProfile || this._buildFeatureProfile(nextLevel);
        this._featureProfile = profile;
        this._viewportWindowMs = profile.viewportWindowMs;

        if (levelChanged) {
            this._logger.info(`Feature level set to "${nextLevel}" (${reason})`, {
                viewportWindowMs: this._viewportWindowMs,
                applyBackgroundLimits: profile.applyBackgroundLimits,
                backgroundTooltipMode: profile.backgroundTooltipMode
            });
        }

        this._applyPerformanceProfile(profile, reason);
        return levelChanged;
    }

    _buildFeatureProfile(level = 'full') {
        const normalized = FEATURE_LEVELS.includes(level) ? level : 'full';
        switch (normalized) {
            case 'enhanced':
                return {
                    level: normalized,
                    enableGit: true,
                    enableColors: true,
                    enableFileSize: true,
                    enableAccessibility: true,
                    enableRichTooltips: true,
                    applyBackgroundLimits: true,
                    backgroundTooltipMode: 'summary',
                    viewportWindowMs: VIEWPORT_STANDARD_WINDOW_MS
                };
            case 'standard':
                return {
                    level: normalized,
                    enableGit: false,
                    enableColors: true,
                    enableFileSize: false,
                    enableAccessibility: true,
                    enableRichTooltips: true,
                    applyBackgroundLimits: true,
                    backgroundTooltipMode: 'summary',
                    viewportWindowMs: VIEWPORT_MINIMAL_WINDOW_MS
                };
            case 'minimal':
                return {
                    level: normalized,
                    enableGit: false,
                    enableColors: false,
                    enableFileSize: false,
                    enableAccessibility: false,
                    enableRichTooltips: false,
                    applyBackgroundLimits: true,
                    backgroundTooltipMode: 'off',
                    viewportWindowMs: VIEWPORT_MINIMAL_WINDOW_MS
                };
            case 'full':
            default:
                return {
                    level: 'full',
                    enableGit: true,
                    enableColors: true,
                    enableFileSize: true,
                    enableAccessibility: true,
                    enableRichTooltips: true,
                    applyBackgroundLimits: false,
                    backgroundTooltipMode: 'rich',
                    viewportWindowMs: VIEWPORT_DEFAULT_WINDOW_MS
                };
        }
    }

    _computeEffectivePerformanceMode() {
        return this._performanceModeExplicit || this._lightweightMode || this._performanceModeAuto;
    }

    _getRefreshIntervalForScale() {
        if (this._workspaceScale === 'extreme') {
            return null; // performance mode will disable periodic refresh entirely
        }
        if (this._workspaceScale === 'large') {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const configuredInterval = config.get('badgeRefreshInterval', 60000);
            return Math.max(configuredInterval, 90000);
        }
        return null;
    }

    _applyConcurrencyLimit(reason = 'unspecified') {
        const target = this._getScaleConcurrencyLimit();
        if (target === this._maxConcurrentOperations) {
            return;
        }
        const previous = this._maxConcurrentOperations;
        this._maxConcurrentOperations = target;
        this._logger.info(`Adjusted concurrency cap ${previous} -> ${target} (${reason})`, {
            workspaceScale: this._workspaceScale,
            performanceMode: this._performanceMode
        });
    }

    async _togglePerformanceMode(enabled, { reason = 'unspecified', refresh = true } = {}) {
        if (enabled === this._performanceMode) {
            return;
        }

        this._performanceMode = enabled;
        this._logger.info(`Performance mode ${enabled ? 'enabled' : 'disabled'} (${reason})`);

        if (enabled) {
            this._disposeFileWatchers({ permanent: true });
            this._logger.info('File watchers disabled for performance mode');

            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
                this._refreshTimer = null;
                this._logger.info('Periodic refresh disabled for performance mode');
            }
        } else {
            this._setupFileWatcher('performance-mode-toggle');
            this._logger.info('File watchers enabled (performance mode off)');

            if (!this._refreshTimer) {
                this._setupPeriodicRefresh();
                this._logger.info('Periodic refresh enabled (performance mode off)');
            }
        }

        if (refresh) {
            this.refreshAll({ reason: 'performance-mode-change' });
        }

        if (enabled) {
            if (this._workspaceIntelligence?.dispose) {
                this._workspaceIntelligence.dispose();
                this._workspaceIntelligence = null;
            }
        } else if (!this._workspaceIntelligence) {
            try {
                const featureFlags = require('./featureFlags');
                const WorkspaceIntelligenceModule = await featureFlags.workspaceIntelligence();
                if (WorkspaceIntelligenceModule) {
                    const { WorkspaceIntelligenceManager } = WorkspaceIntelligenceModule;
                    this._workspaceIntelligence = new WorkspaceIntelligenceManager(this._fileSystem);
                    await this._workspaceIntelligence.initialize({
                        batchProcessor: this._batchProcessor,
                        enableProgressiveAnalysis: this._shouldEnableProgressiveAnalysis()
                    });

                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders?.length) {
                        await this._workspaceIntelligence.analyzeWorkspace(workspaceFolders, {
                            maxFiles: this._getIndexerMaxFiles()
                        });
                    }
                }
            } catch (error) {
                this._logger.debug('Workspace intelligence reinitialization failed after performance mode toggle', error);
            }
        }
    }

    _applyPerformanceProfile(profile, reason = 'unspecified') {
        const featureLevel = profile?.level || this._featureLevel;

        // Enable automatic performance mode for extreme workspaces, but keep explicit user intent intact
        this._performanceModeAuto = this._workspaceScale === 'extreme';
        const desiredPerformanceMode = this._computeEffectivePerformanceMode();

        if (desiredPerformanceMode !== this._performanceMode) {
            this._logger.debug('Auto performance mode update', {
                reason,
                featureLevel,
                workspaceScale: this._workspaceScale,
                desiredPerformanceMode
            });
            // Fire and forget to avoid blocking feature profile application
            this._togglePerformanceMode(desiredPerformanceMode, { reason: `${reason}-auto`, refresh: true })
                .catch((error) => this._logger.debug('Failed to toggle performance mode automatically', error));
        }

        this._applyConcurrencyLimit(reason);

        // Stretch periodic refresh cadence for large workspaces when not in performance mode
        if (!this._performanceMode) {
            const targetRefresh = this._getRefreshIntervalForScale();
            const needsUpdate = targetRefresh !== null && targetRefresh !== this._refreshIntervalOverride;
            const shouldClearOverride = targetRefresh === null && this._refreshIntervalOverride !== null;

            if (needsUpdate) {
                this._refreshIntervalOverride = targetRefresh;
                this._setupPeriodicRefresh();
            } else if (shouldClearOverride) {
                this._refreshIntervalOverride = null;
                this._setupPeriodicRefresh();
            }
        }
    }

    /**
     * Get enhanced performance metrics with cache debugging
     */
    getMetrics() {
        const computeReusePercent = (stats) => {
            if (!stats) {
                return 0;
            }
            const total = (stats.reuses || 0) + (stats.allocations || 0);
            if (!total) {
                return 0;
            }
            return Number(((stats.reuses || 0) / total * 100).toFixed(2));
        };

        const baseMetrics = {
            ...this._metrics,
            cacheSize: this._decorationCache.size,
            cacheBuckets: this._decorationCache.bucketCount,
            cacheHitRate: this._metrics.cacheHits + this._metrics.cacheMisses > 0
                ? ((this._metrics.cacheHits / (this._metrics.cacheHits + this._metrics.cacheMisses)) * 100).toFixed(2) + '%'
                : '0.00%',
            forceCacheBypass: this._forceCacheBypass,
            decorationPoolEnabled: this._enableDecorationPool,
            flyweightsEnabled: this._enableFlyweights,
            lightweightMode: this._lightweightMode,
            memorySheddingEnabled: this._memorySheddingEnabled,
            memorySheddingActive: this._memorySheddingActive,
            watcherStrategy: this._activeWatcherStrategy,
            staticWatchers: this._fileWatchers.size,
            dynamicWatchers: this._dynamicWatchers.size,
            workspaceScale: this._workspaceScale,
            workspaceFileCount: this._workspaceFileCount,
            featureLevel: this._featureLevel,
            featureProfile: this._featureProfile,
            viewportWindowMs: this._viewportWindowMs,
            viewportVisibleFiles: this._viewportVisibleFiles.size,
            viewportHistorySize: this._viewportRecentFiles.size,
            softHeapAlertThresholdMB: this._softHeapAlertThresholdMB
        };
        baseMetrics.decorationPool = {
            size: this._decorationPool.size,
            hits: this._decorationPoolStats.hits,
            misses: this._decorationPoolStats.misses,
            allocations: this._decorationPoolStats.allocations,
            reuses: this._decorationPoolStats.reuses,
            reusePercent: computeReusePercent(this._decorationPoolStats)
        };
        baseMetrics.badgeFlyweight = {
            ...this._badgeFlyweightStats,
            cacheSize: this._badgeFlyweightCache.size,
            reusePercent: computeReusePercent(this._badgeFlyweightStats)
        };
        baseMetrics.readableFlyweight = {
            ...this._readableFlyweightStats,
            cacheSize: this._readableDateFlyweightCache.size,
            reusePercent: computeReusePercent(this._readableFlyweightStats)
        };
        baseMetrics.allocationTelemetry = {
            decorationPool: {
                allocations: this._decorationPoolStats.allocations,
                reuses: this._decorationPoolStats.reuses,
                reusePercent: computeReusePercent(this._decorationPoolStats)
            },
            badgeFlyweight: {
                allocations: this._badgeFlyweightStats.allocations,
                reuses: this._badgeFlyweightStats.reuses,
                reusePercent: computeReusePercent(this._badgeFlyweightStats)
            },
            readableFlyweight: {
                allocations: this._readableFlyweightStats.allocations,
                reuses: this._readableFlyweightStats.reuses,
                reusePercent: computeReusePercent(this._readableFlyweightStats)
            }
        };
        
        // Include advanced system metrics if available
        if (this._advancedCache) {
            baseMetrics.advancedCache = this._advancedCache.getStats();
        }
        if (this._batchProcessor?.getMetrics) {
            baseMetrics.batchProcessor = this._batchProcessor.getMetrics();
        }
        if (this._workspaceIntelligence?.getMetrics) {
            const workspaceMetrics = this._workspaceIntelligence.getMetrics() || {};
            if (workspaceMetrics.incrementalIndexer) {
                baseMetrics.incrementalIndexer = workspaceMetrics.incrementalIndexer;
            }
            if (workspaceMetrics.smartExclusion) {
                baseMetrics.smartExclusion = workspaceMetrics.smartExclusion;
            }
        }
        
        // Add cache debugging info
        const sampleCacheKeys = Array.from(this._decorationCache.keys())
            .slice(0, 5)
            .map((key) => this._stripNamespaceFromCacheKey(key));
        const cacheUsageRatio = this._maxCacheSize > 0
            ? Number((this._decorationCache.size / this._maxCacheSize).toFixed(3))
            : 0;
        baseMetrics.cacheDebugging = {
            memoryCacheKeys: sampleCacheKeys,
            cacheTimeout: this._cacheTimeout,
            maxCacheSize: this._maxCacheSize,
            cacheBuckets: this._decorationCache.bucketCount,
            keyStatsSize: this._cacheKeyStats ? this._cacheKeyStats.size : 0,
            cacheNamespace: this._cacheNamespace,
            cacheUsageRatio
        };
        baseMetrics.cachePressure = {
            warned: this._cachePressureLogged,
            thresholdRatio: this._cachePressureThreshold,
            usageRatio: cacheUsageRatio
        };
        baseMetrics.memoryShedding = {
            thresholdMB: this._memorySheddingThresholdMB,
            softThresholdMB: this._softHeapAlertThresholdMB,
            active: this._memorySheddingActive,
            events: this._memorySheddingEvents.slice(-5)
        };
        
        // Add performance timing metrics
        baseMetrics.performanceTiming = {
            avgGitBlameMs: this._metrics.gitBlameCalls > 0 ? 
                (this._metrics.gitBlameTimeMs / this._metrics.gitBlameCalls).toFixed(1) : '0.0',
            avgFileStatMs: this._metrics.fileStatCalls > 0 ? 
                (this._metrics.fileStatTimeMs / this._metrics.fileStatCalls).toFixed(1) : '0.0',
            totalGitBlameTimeMs: this._metrics.gitBlameTimeMs,
            totalFileStatTimeMs: this._metrics.fileStatTimeMs,
            gitBlameCalls: this._metrics.gitBlameCalls,
            fileStatCalls: this._metrics.fileStatCalls
        };
        
        return baseMetrics;
    }

    /**
     * Initialize context-dependent systems
     */
    async initializeAdvancedSystems(context) {
        // Optional advanced systems: only initialize when the chunk is available
        try {
            const chunk = await this._getDecorationsAdvancedChunk();
            if (chunk?.initializeAdvancedSystems) {
                return chunk.initializeAdvancedSystems(this, context);
            }
            this._logger.info('Advanced systems chunk unavailable - skipping advanced initialization');
        } catch (error) {
            this._logger.error('Failed to initialize advanced systems', error);
        }
    }

    async _maybeWarnAboutGitLimitations() {
        if (this._gitWarningShown) {
            return;
        }

        this._gitWarningShown = true;

        try {
            const storage = this._extensionContext?.globalState;
            const storageKey = GLOBAL_STATE_KEYS.WEB_GIT_NOTICE;
            const alreadyShown = storage?.get(storageKey, false);
            if (alreadyShown) {
                return;
            }

            if (storage?.update) {
                try {
                    await storage.update(storageKey, true);
                } catch (storageError) {
                    this._logger.debug('Failed to persist Git limitation notice flag', storageError);
                }
            }

            // Fire-and-forget so we do not block activation waiting on user interaction
            Promise.resolve().then(() => {
                vscode.window.showInformationMessage(
                    'Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.'
                );
            });
        } catch (error) {
            this._logger.debug('Failed to display Git limitation notice', error);
        }
    }

    /**
     * Enhance color for better visibility against selection backgrounds
     */
    _enhanceColorForSelection(color) {
        // Map problematic colors to selection-safe alternatives
        const colorEnhancementMap = {
            // Chart colors that may not work well with selections
            'charts.yellow': 'list.warningForeground',
            'charts.red': 'list.errorForeground', 
            'charts.green': 'list.highlightForeground',
            'charts.blue': 'symbolIcon.functionForeground',
            'charts.purple': 'symbolIcon.classForeground',
            'charts.orange': 'list.warningForeground',
            
            // Terminal colors that may have poor selection contrast
            'terminal.ansiYellow': 'list.warningForeground',
            'terminal.ansiGreen': 'list.highlightForeground',
            'terminal.ansiRed': 'list.errorForeground',
            'terminal.ansiBlue': 'symbolIcon.functionForeground',
            'terminal.ansiMagenta': 'symbolIcon.classForeground',
            'terminal.ansiCyan': 'symbolIcon.stringForeground',
            
            // Editor colors that may not work in lists
            'editorGutter.commentRangeForeground': 'list.deemphasizedForeground',
            'editorWarning.foreground': 'list.warningForeground',
            'editorError.foreground': 'list.errorForeground',
            'editorInfo.foreground': 'list.highlightForeground'
        };
        
        // Check if this color needs enhancement
        const colorId = color.id || color;
        const enhancedColorId = colorEnhancementMap[colorId];
        
        if (enhancedColorId) {
            this._logger.debug(`🔧 Enhanced color ${colorId} → ${enhancedColorId} for better selection visibility`);
            return new vscode.ThemeColor(enhancedColorId);
        }
        
        // If no enhancement needed, return original color
        return color;
    }

    _registerEvent(target, eventName, handler) {
        if (!target || typeof target[eventName] !== 'function') {
            this._logger.debug(`Event API unavailable: ${eventName}`);
            return null;
        }
        try {
            return target[eventName](handler);
        } catch (error) {
            this._logger.debug(`Failed to register listener (${eventName})`, error);
            return null;
        }
    }

    /**
     * Dispose of resources
     */
    async dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._disposed = true; // Add new disposal flag
        this._watcherSetupToken++;

        this._logger.info('Disposing FileDateDecorationProvider', this.getMetrics());
        
        // Cancel all pending operations and clear locks
        this._fileLocks.clear();
        this._operationQueue.clear();
        this._activeOperations = 0;
        
        // Clear periodic refresh timer
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
            this._logger.info('Cleared periodic refresh timer');
        }
        this._cancelIncrementalRefreshTimers();
        
        // Dispose advanced systems
        if (this._advancedCache?.dispose) {
            await this._advancedCache.dispose();
        }
        this._cancelProgressiveWarmupJobs();
        if (this._batchProcessor?.dispose) {
            this._batchProcessor.dispose();
        }
        if (this._accessibility && typeof this._accessibility.dispose === 'function') {
            this._accessibility.dispose();
        }
        if (this._workspaceIntelligence?.dispose) {
            this._workspaceIntelligence.dispose();
        }
        
        // Dispose basic systems
        this._teardownViewportAwareness();
        this._decorationCache.clear();
        this._clearDecorationPool('dispose');
        if (this._gitInsightsManager) {
            this._gitInsightsManager.dispose();
            this._gitInsightsManager = null;
        }
        this._onDidChangeFileDecorations.dispose();
        if (this._workspaceFolderListener) {
            this._workspaceFolderListener.dispose();
            this._workspaceFolderListener = null;
        }
        if (this._workspaceFolderChangeTimer) {
            clearTimeout(this._workspaceFolderChangeTimer);
            this._workspaceFolderChangeTimer = null;
        }
        if (this._telemetryReportTimer) {
            clearTimeout(this._telemetryReportTimer);
            this._telemetryReportTimer = null;
        }
        this._disposeFileWatchers({ permanent: true });
        this._teardownDynamicWatcherSupport();
        this._disposeSmartWatcherFallbackManager();
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
    }
}

module.exports = { FileDateDecorationProvider };
