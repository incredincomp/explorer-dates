const vscode = require('vscode');
const { getLogger } = require('./logger');
const { getLocalization } = require('./localization');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { SmartExclusionManager } = require('./smartExclusion');
const { BatchProcessor } = require('./batchProcessor');
const { AdvancedCache } = require('./advancedCache');
const { ThemeIntegrationManager } = require('./themeIntegration');
const { AccessibilityManager } = require('./accessibility');
const { formatFileSize, trimBadge } = require('./utils/formatters');
const { getFileName, getExtension, getCacheKey: buildCacheKey, normalizePath, getRelativePath, getUriPath } = require('./utils/pathUtils');
const { DEFAULT_CACHE_TIMEOUT, DEFAULT_MAX_CACHE_SIZE, MONTH_ABBREVIATIONS, GLOBAL_STATE_KEYS } = require('./constants');
const { isWebEnvironment } = require('./utils/env');
const CONFIG_DEFAULT_CACHE_TIMEOUT = 30000;
const CACHE_NAMESPACE_SEPARATOR = '::';

const describeFile = (input = '') => {
    const pathValue = typeof input === 'string' ? input : getUriPath(input);
    const normalized = normalizePath(pathValue);
    return getFileName(normalized) || normalized || 'unknown';
};

const isWebBuild = process.env.VSCODE_WEB === 'true';
let execAsync = null;
if (!isWebBuild) {
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        execAsync = promisify(exec);
    } catch {
        execAsync = null;
    }
}

/**
 * Provides file decorations showing last modified dates in the Explorer
 */
class FileDateDecorationProvider {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        
        // Enhanced cache to avoid repeated file system calls
        this._decorationCache = new Map();
        this._decorationPool = new Map();
        this._decorationPoolOrder = [];
        this._decorationPoolStats = { hits: 0, misses: 0 };
        this._maxDecorationPoolSize = 512;
        this._badgeFlyweightCache = new Map();
        this._badgeFlyweightOrder = [];
        this._badgeFlyweightLimit = 2048;
        this._badgeFlyweightStats = { hits: 0, misses: 0 };
        this._readableDateFlyweightCache = new Map();
        this._readableDateFlyweightOrder = [];
        this._readableDateFlyweightLimit = 2048;
        this._readableFlyweightStats = { hits: 0, misses: 0 };
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
        this._gitAvailable = !this._isWeb && !!execAsync;
        this._gitWarningShown = false;
        
        // Cache performance tracking
        this._cacheNamespace = null;
        this._cacheKeyStats = new Map(); // Track cache key usage patterns
        
        // Get logger and localization instances
        this._logger = getLogger();
        this._l10n = getLocalization();
        
        // Initialize performance systems
        this._smartExclusion = new SmartExclusionManager();
        this._batchProcessor = new BatchProcessor();
        this._progressiveLoadingJobs = new Set();
        this._progressiveLoadingEnabled = false;
        this._advancedCache = null; // Will be initialized with context
        this._configurationWatcher = null;
        this._gitCache = new Map();
        this._maxGitCacheEntries = 1000;
        
        // Initialize UX enhancement systems
        this._themeIntegration = new ThemeIntegrationManager();
        this._accessibility = new AccessibilityManager();
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
            errors: 0,
            gitBlameTimeMs: 0,
            gitBlameCalls: 0,
            fileStatTimeMs: 0,
            fileStatCalls: 0
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
        this._performanceMode = config.get('performanceMode', false);
        this._updateCacheNamespace(config);
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

        // Preview settings for onboarding
        this._previewSettings = null;
        this._extensionContext = null;
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
     * Set up file system watcher to refresh decorations when files change
     */
    _setupFileWatcher() {
        // Watch for file changes in the workspace
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        watcher.onDidChange((uri) => this.refreshDecoration(uri));
        watcher.onDidCreate((uri) => this.refreshDecoration(uri));
        watcher.onDidDelete((uri) => this.clearDecoration(uri));
        
        this._fileWatcher = watcher;
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
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
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
                    if (newPerformanceMode !== this._performanceMode) {
                        this._performanceMode = newPerformanceMode;
                        this._logger.info(`Performance mode changed to: ${newPerformanceMode}`);
                        
                        // Set up or tear down file watcher based on performance mode
                        if (newPerformanceMode && this._fileWatcher) {
                            this._fileWatcher.dispose();
                            this._fileWatcher = null;
                            this._logger.info('File watcher disabled for performance mode');
                        } else if (!newPerformanceMode && !this._fileWatcher) {
                            this._setupFileWatcher();
                            this._logger.info('File watcher enabled (performance mode off)');
                        }
                        
                        // Handle periodic refresh timer
                        if (newPerformanceMode && this._refreshTimer) {
                            clearInterval(this._refreshTimer);
                            this._refreshTimer = null;
                            this._logger.info('Periodic refresh disabled for performance mode');
                        } else if (!newPerformanceMode && !this._refreshTimer) {
                            this._setupPeriodicRefresh();
                            this._logger.info('Periodic refresh enabled (performance mode off)');
                        }
                        
                        // Clear caches and refresh when switching modes
                        this.refreshAll({ reason: 'performance-mode-change' });
                    }
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
                    e.affectsConfiguration('explorerDates.fileSizeFormat');

                if (decorationSettingsChanged || namespaceChanged) {
                    this.refreshAll({
                        preservePersistentCache: true,
                        reason: decorationSettingsChanged ? 'configuration-change' : 'namespace-change'
                    });
                }
                if (e.affectsConfiguration('explorerDates.progressiveLoading')) {
                    this._applyProgressiveLoadingSetting().catch((error) => {
                        this._logger.error('Failed to reconfigure progressive loading', error);
                    });
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

    _getGitCacheKey(workspacePath, relativePath, mtimeMs) {
        const safeWorkspace = workspacePath || 'unknown-workspace';
        const safeRelative = relativePath || 'unknown-relative';
        const safeMtime = Number.isFinite(mtimeMs) ? mtimeMs : 'unknown-mtime';
        return `${safeWorkspace}::${safeRelative}::${safeMtime}`;
    }

    _getCachedGitInfo(cacheKey) {
        const cached = this._gitCache.get(cacheKey);
        if (!cached) {
            return null;
        }
        cached.lastAccess = Date.now();
        return cached.value;
    }

    _setCachedGitInfo(cacheKey, value) {
        if (this._gitCache.size >= this._maxGitCacheEntries) {
            let oldestKey = null;
            let oldestAccess = Infinity;
            for (const [key, entry] of this._gitCache.entries()) {
                if (entry.lastAccess < oldestAccess) {
                    oldestAccess = entry.lastAccess;
                    oldestKey = key;
                }
            }
            if (oldestKey) {
                this._gitCache.delete(oldestKey);
            }
        }
        this._gitCache.set(cacheKey, {
            value,
            lastAccess: Date.now()
        });
    }

    async _applyProgressiveLoadingSetting() {
        if (!this._batchProcessor) {
            return;
        }

        // Disable progressive loading in performance mode
        if (this._performanceMode) {
            this._logger.info('Progressive loading disabled due to performance mode');
            this._cancelProgressiveWarmupJobs();
            this._progressiveLoadingEnabled = false;
            return;
        }

        const config = vscode.workspace.getConfiguration('explorerDates');
        const enabled = config.get('progressiveLoading', true);
        this._progressiveLoadingEnabled = enabled;

        if (!enabled) {
            this._logger.info('Progressive loading disabled via explorerDates.progressiveLoading');
            this._cancelProgressiveWarmupJobs();
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        this._cancelProgressiveWarmupJobs();

        workspaceFolders.forEach((folder) => {
            const jobId = this._batchProcessor.processDirectoryProgressively(
                folder.uri,
                async (uri) => {
                    try {
                        await this.provideFileDecoration(uri);
                    } catch (error) {
                        this._logger.debug('Progressive warmup processor failed', error);
                    }
                },
                { background: true, priority: 'low', maxFiles: 500 }
            );
            if (jobId) {
                this._progressiveLoadingJobs.add(jobId);
            }
        });

        this._logger.info(`Progressive loading queued for ${workspaceFolders.length} workspace folder(s).`);
    }

    _cancelProgressiveWarmupJobs() {
        if (!this._progressiveLoadingJobs || this._progressiveLoadingJobs.size === 0) {
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
        this._gitCache.clear();
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
            const combined = await this._smartExclusion.getCombinedExclusions(workspaceFolder.uri);
            
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
        if (this._decorationCache.size > this._maxCacheSize) {
            this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);
            
            // Remove oldest 20% of entries
            const entriesToRemove = Math.floor(this._maxCacheSize * 0.2);
            const entries = Array.from(this._decorationCache.entries());
            
            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            // Remove oldest entries
            for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
                this._decorationCache.delete(entries[i][0]);
            }
            
            this._logger.debug(`Removed ${entriesToRemove} old cache entries`);
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
            }
            return factory();
        }

        if (!key) {
            if (statsTracker) {
                statsTracker.misses++;
            }
            return factory();
        }

        if (cache.has(key)) {
            if (statsTracker) {
                statsTracker.hits++;
            }
            return cache.get(key);
        }

        if (statsTracker) {
            statsTracker.misses++;
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
            return;
        }
        const delta = current - this._memoryBaselineMB;
        if (delta >= this._memorySheddingThresholdMB) {
            this._memorySheddingActive = true;
            this._maxCacheSize = Math.min(this._maxCacheSize, this._memoryShedCacheLimit);
            this._refreshIntervalOverride = Math.max(
                this._refreshIntervalOverride || this._refreshInterval || this._memoryShedRefreshIntervalMs,
                this._memoryShedRefreshIntervalMs
            );
            this._logger.warn(`Memory shedding activated (delta ${delta.toFixed(2)} MB >= ${this._memorySheddingThresholdMB} MB); cache size capped at ${this._maxCacheSize} and refresh interval stretched to ${this._refreshIntervalOverride}ms`);
            this._setupPeriodicRefresh();
        }
    }

    _acquireDecorationFromPool({ badge, tooltip, color }) {
        if (!this._enableDecorationPool) {
            this._decorationPoolStats.misses++;
            const decoration = new vscode.FileDecoration(badge || '??');
            if (tooltip) decoration.tooltip = tooltip;
            if (color) decoration.color = color;
            decoration.propagate = false;
            return decoration;
        }

        if (!badge) {
            return new vscode.FileDecoration('??');
        }

        const key = this._buildDecorationPoolKey(badge, tooltip, color);
        if (key && this._decorationPool.has(key)) {
            this._decorationPoolStats.hits++;
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
            const accessibleTooltip = this._accessibility.getAccessibleTooltip(filePath, stat.mtime, stat.birthtime, stat.size, gitBlame);
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
        if (!this._gitAvailable || !execAsync) {
            return null;
        }

        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                return null;
            }

            const workspacePath = workspaceFolder.uri.fsPath || workspaceFolder.uri.path;
            const relativePath = getRelativePath(workspacePath, filePath);
            const cacheKey = this._getGitCacheKey(workspacePath, relativePath, statMtimeMs);
            const cached = this._getCachedGitInfo(cacheKey);
            if (cached) {
                return cached;
            }

            const gitStartTime = Date.now();
            try {
                const { stdout } = await execAsync(
                    `git log -1 --format="%H|%an|%ae|%ad" -- "${relativePath}"`,
                    { cwd: workspaceFolder.uri.fsPath, timeout: 2000 }
                );

                if (!stdout || !stdout.trim()) {
                    return null;
                }

                const [hash, authorName, authorEmail, authorDate] = stdout.trim().split('|');
                const gitInfo = {
                    hash: hash || '',
                    authorName: authorName || 'Unknown',
                    authorEmail: authorEmail || '',
                    authorDate: authorDate || ''
                };

                this._setCachedGitInfo(cacheKey, gitInfo);
                return gitInfo;
            } finally {
                const gitDuration = Date.now() - gitStartTime;
                this._metrics.gitBlameTimeMs += gitDuration;
                this._metrics.gitBlameCalls++;
            }
        } catch {
            // Git might not be available or file not in a git repo
            return null;
        }
    }

    /**
     * Get initials (up to 2 characters) from a full name
     */
    _getInitials(fullName) {
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
     * Get file decoration with enhanced caching
     */
    async provideFileDecoration(uri, token) {
        const startTime = Date.now();

        try {
            if (!uri) {
                this._logger.error('❌ Invalid URI provided to provideFileDecoration:', uri);
                return undefined;
            }

            const filePath = getUriPath(uri);
            if (!filePath) {
                this._logger.error('❌ Could not resolve path for URI in provideFileDecoration:', uri);
                return undefined;
            }
            const fileLabel = describeFile(filePath);
            const scheme = uri.scheme || 'file';

            if (scheme !== 'file') {
                this._logger.debug(`⏭️ Skipping decoration for ${fileLabel} (unsupported scheme: ${scheme})`);
                return undefined;
            }

            // Reduce verbose logging in performance mode
            if (!this._performanceMode) {
                this._logger.debug(`🔍 VSCODE REQUESTED DECORATION: ${fileLabel} (${filePath})`);
                this._logger.infoWithOptions(this._stressLogOptions, `📊 Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);
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
                    this._logger.infoWithOptions(this._stressLogOptions, `❌ RETURNED UNDEFINED: Decorations disabled globally for ${fileLabel}`);
                }
                return undefined;
            }

            if (await this._isExcludedSimple(uri)) {
                if (!this._performanceMode) {
                    this._logger.infoWithOptions(this._stressLogOptions, `❌ File excluded: ${fileLabel}`);
                }
                return undefined;
            }

            this._logger.debug(`🔍 Processing file: ${fileLabel}`);

            const cacheKey = this._getCacheKey(uri);
            if (!this._previewSettings) {
                const cachedDecoration = await this._getCachedDecoration(cacheKey, fileLabel);
                if (cachedDecoration) {
                    return cachedDecoration;
                }
            } else {
                this._logger.debug(`🔄 Skipping cache due to active preview settings for: ${fileLabel}`);
            }

            this._metrics.cacheMisses++;
            this._logger.debug(`❌ Cache miss for: ${fileLabel} (key: ${cacheKey.substring(0, 50)}...)`);

            if (token?.isCancellationRequested) {
                this._logger.debug(`Decoration cancelled for: ${filePath}`);
                return undefined;
            }

            const fileStatStartTime = Date.now();
            let stat;
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
            this._metrics.fileStatTimeMs += Date.now() - fileStatStartTime;
            this._metrics.fileStatCalls++;
            
            const isRegularFile = typeof stat.isFile === 'function' ? stat.isFile() : true;
            if (!isRegularFile) {
                return undefined;
            }

            const modifiedAt = stat.mtime instanceof Date ? stat.mtime : new Date(stat.mtime);
            const createdAt = stat.birthtime instanceof Date ? stat.birthtime : new Date(stat.birthtime || stat.ctime || stat.mtime);
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

            if (this._lightweightMode) {
                colorScheme = 'none';
                showFileSize = false;
                accessibilityMode = false;
                rawShowGitInfo = 'none';
                badgePriority = 'time';
            }

            const gitFeaturesRequested = (rawShowGitInfo !== 'none') || (badgePriority === 'author');
            const gitFeaturesEnabled = gitFeaturesRequested && this._gitAvailable && !this._performanceMode;
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
            this._logger.debug(`🔍 Tooltip generation for ${fileLabel}: accessibilityMode=${accessibilityMode}, shouldUseAccessible=${shouldUseAccessibleTooltips}, previewMode=${!!this._previewSettings}`);

            const tooltip = await this._buildTooltipContent({
                filePath,
                resourceUri: uri,
                stat: normalizedStat,
                badgeDetails,
                gitBlame: showGitInfo === 'none' ? null : gitBlame,
                shouldUseAccessibleTooltips,
                fileSizeFormat,
                isCodeFile
            });

            let color = undefined;
            if (colorScheme !== 'none') {
                color = this._themeIntegration
                    ? this._themeIntegration.applyThemeAwareColorScheme(colorScheme, filePath, diffMs)
                    : this._getColorByScheme(modifiedAt, colorScheme, filePath);
            }
            this._logger.debug(`🎨 Color scheme setting: ${colorScheme}, using color: ${color ? 'yes' : 'no'}`);

            let finalBadge = trimBadge(badgeDetails.displayBadge) || trimBadge(badgeDetails.badge) || '??';
            if (this._accessibility?.shouldEnhanceAccessibility()) {
                finalBadge = this._accessibility.getAccessibleBadge(finalBadge);
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

            this._logger.error(`❌ DECORATION ERROR for ${safeFileName}:`, {
                error: error.message,
                stack: error.stack?.split('\n')[0],
                processingTimeMs: processingTime,
                uri: safeUri
            });

            console.error(`❌ DECORATION ERROR: ${safeFileName} → ${error.message}`);
            console.error('❌ Full error:', error);
            console.error('❌ Stack trace:', error.stack);

            this._logger.error(`❌ CRITICAL ERROR DETAILS for ${safeFileName}: ${error.message}`);
            this._logger.error(`❌ Error type: ${error.constructor.name}`);
            this._logger.error(`❌ Full stack: ${error.stack}`);

            this._logger.info(`❌ RETURNED UNDEFINED: Error occurred for ${safeFileName}`);
            return undefined;
        }
    }

    /**
     * Get enhanced performance metrics with cache debugging
     */
    getMetrics() {
        const baseMetrics = {
            ...this._metrics,
            cacheSize: this._decorationCache.size,
            cacheHitRate: this._metrics.cacheHits + this._metrics.cacheMisses > 0
                ? ((this._metrics.cacheHits / (this._metrics.cacheHits + this._metrics.cacheMisses)) * 100).toFixed(2) + '%'
                : '0.00%',
            forceCacheBypass: this._forceCacheBypass,
            decorationPoolEnabled: this._enableDecorationPool,
            flyweightsEnabled: this._enableFlyweights,
            lightweightMode: this._lightweightMode,
            memorySheddingEnabled: this._memorySheddingEnabled,
            memorySheddingActive: this._memorySheddingActive
        };
        baseMetrics.decorationPool = {
            size: this._decorationPool.size,
            hits: this._decorationPoolStats.hits,
            misses: this._decorationPoolStats.misses
        };
        baseMetrics.badgeFlyweight = { ...this._badgeFlyweightStats, cacheSize: this._badgeFlyweightCache.size };
        baseMetrics.readableFlyweight = { ...this._readableFlyweightStats, cacheSize: this._readableDateFlyweightCache.size };
        
        // Include advanced system metrics if available
        if (this._advancedCache) {
            baseMetrics.advancedCache = this._advancedCache.getStats();
        }
        if (this._batchProcessor) {
            baseMetrics.batchProcessor = this._batchProcessor.getMetrics();
        }
        
        // Add cache debugging info
        const sampleCacheKeys = Array.from(this._decorationCache.keys())
            .slice(0, 5)
            .map((key) => this._stripNamespaceFromCacheKey(key));
        baseMetrics.cacheDebugging = {
            memoryCacheKeys: sampleCacheKeys,
            cacheTimeout: this._cacheTimeout,
            maxCacheSize: this._maxCacheSize,
            keyStatsSize: this._cacheKeyStats ? this._cacheKeyStats.size : 0,
            cacheNamespace: this._cacheNamespace
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
        try {
            this._extensionContext = context;
            if (this._isWeb) {
                await this._maybeWarnAboutGitLimitations();
            }

            // Skip advanced systems in performance mode
            if (this._performanceMode) {
                this._logger.info('Performance mode enabled - skipping advanced cache, batch processor, and progressive loading');
                return;
            }

            // Initialize advanced cache
            this._advancedCache = new AdvancedCache(context);
            await this._advancedCache.initialize();
            this._logger.info('Advanced cache initialized');
            
            // Initialize batch processor
            this._batchProcessor.initialize();
            this._logger.info('Batch processor initialized');
            await this._applyProgressiveLoadingSetting();
            
            // Setup theme integration
            const config = vscode.workspace.getConfiguration('explorerDates');
            if (config.get('autoThemeAdaptation', true)) {
                await this._themeIntegration.autoConfigureForTheme();
                this._logger.info('Theme integration configured');
            }
            
            // Apply accessibility recommendations if needed
            if (this._accessibility.shouldEnhanceAccessibility()) {
                await this._accessibility.applyAccessibilityRecommendations();
                this._logger.info('Accessibility recommendations applied');
            }

            try {
                await this._smartExclusion.cleanupAllWorkspaceProfiles();
            } catch (error) {
                this._logger.warn('Failed to clean workspace exclusion profiles', error);
            }
            
            // Suggest smart exclusions for workspace
            if (vscode.workspace.workspaceFolders) {
                for (const folder of vscode.workspace.workspaceFolders) {
                    try {
                        await this._smartExclusion.suggestExclusions(folder.uri);
                        this._logger.info(`Smart exclusions analyzed for: ${folder.name}`);
                    } catch (error) {
                        this._logger.error(`Failed to analyze smart exclusions for ${folder.name}`, error);
                    }
                }
            }
            
            this._logger.info('Advanced systems initialized successfully');
        } catch (error) {
            this._logger.error('Failed to initialize advanced systems', error);
            // Don't throw - let extension continue with basic functionality
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

    /**
     * Dispose of resources
     */
    async dispose() {
        this._logger.info('Disposing FileDateDecorationProvider', this.getMetrics());
        
        // Clear periodic refresh timer
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
            this._logger.info('Cleared periodic refresh timer');
        }
        this._cancelIncrementalRefreshTimers();
        
        // Dispose advanced systems
        if (this._advancedCache) {
            await this._advancedCache.dispose();
        }
        this._cancelProgressiveWarmupJobs();
        if (this._batchProcessor) {
            this._batchProcessor.dispose();
        }
        if (this._accessibility && typeof this._accessibility.dispose === 'function') {
            this._accessibility.dispose();
        }
        
        // Dispose basic systems
        this._decorationCache.clear();
        this._clearDecorationPool('dispose');
        this._gitCache.clear();
        this._onDidChangeFileDecorations.dispose();
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
    }
}

module.exports = { FileDateDecorationProvider };
