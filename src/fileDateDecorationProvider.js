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
        this._cacheTimeout = DEFAULT_CACHE_TIMEOUT;
        this._maxCacheSize = DEFAULT_MAX_CACHE_SIZE;
        this._fileSystem = fileSystem;
        this._isWeb = isWebBuild || isWebEnvironment();
        this._gitAvailable = !this._isWeb && !!execAsync;
        this._gitWarningShown = false;
        
        // Cache performance tracking
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
        
        // Initialize UX enhancement systems
        this._themeIntegration = new ThemeIntegrationManager();
        this._accessibility = new AccessibilityManager();
        
        // Performance metrics
        this._metrics = {
            totalDecorations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0
        };

        // Preview settings for onboarding
        this._previewSettings = null;
        this._extensionContext = null;
        
        // Watch for file changes to update decorations
        this._setupFileWatcher();
        
        // Listen for configuration changes
        this._setupConfigurationWatcher();
        
        this._logger.info('FileDateDecorationProvider initialized');
        // Preview settings (transient overrides used by onboarding quick-setup)
        this._previewSettings = null;
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
        
        // Clear all caches first
        this._decorationCache.clear();
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
     * Set up configuration watcher to update settings
     */
    _setupConfigurationWatcher() {
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates')) {
                this._logger.debug('Configuration changed, updating settings');
                
                // Update cache settings
                const config = vscode.workspace.getConfiguration('explorerDates');
                this._cacheTimeout = config.get('cacheTimeout', 30000);
                this._maxCacheSize = config.get('maxCacheSize', 10000);
                
                // Refresh all decorations if relevant settings changed
                if (e.affectsConfiguration('explorerDates.showDateDecorations') ||
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
                    e.affectsConfiguration('explorerDates.fileSizeFormat')) {
                    this.refreshAll();
                }
                if (e.affectsConfiguration('explorerDates.progressiveLoading')) {
                    this._applyProgressiveLoadingSetting().catch((error) => {
                        this._logger.error('Failed to reconfigure progressive loading', error);
                    });
                }
            }
        });
    }

    async _applyProgressiveLoadingSetting() {
        if (!this._batchProcessor) {
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
        // Clear memory cache
        const memorySize = this._decorationCache.size;
        this._decorationCache.clear();
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
    refreshAll() {
        this._decorationCache.clear();
        // Clear advanced cache if available
        if (this._advancedCache) {
            this._advancedCache.clear();
        }
        this._onDidChangeFileDecorations.fire(undefined);
        this._logger.info('All decorations refreshed with cache clear');
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

    async _getCachedDecoration(cacheKey, fileLabel) {
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
        if (memoryEntry && (Date.now() - memoryEntry.timestamp) < this._cacheTimeout) {
            this._metrics.cacheHits++;
            this._logger.debug(`💾 Memory cache hit for: ${fileLabel}`);
            return memoryEntry.decoration;
        }

        return null;
    }

    async _storeDecorationInCache(cacheKey, decoration, fileLabel) {
        this._manageCacheSize();
        this._decorationCache.set(cacheKey, {
            decoration,
            timestamp: Date.now()
        });

        if (this._advancedCache) {
            try {
                await this._advancedCache.set(cacheKey, decoration, { ttl: this._cacheTimeout });
                this._logger.debug(`🧠 Stored in advanced cache: ${fileLabel}`);
            } catch (error) {
                this._logger.debug(`Failed to store in advanced cache: ${error.message}`);
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
        
        // Handle future-dated files (negative diffMs due to clock skew, timezone issues, etc.)
        // Treat them as "just modified" to avoid displaying negative values
        if (diffMs < 0) {
            this._logger.debug(`File has future modification time (diffMs: ${diffMs}), treating as just modified`);
            return '●●';
        }
        
        // Using 2-character indicators for better readability
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        switch (formatType) {
            case 'relative-short':
            case 'relative-long':
                // 2-character time indicators
                if (diffMinutes < 1) return '●●';                    // Just modified
                if (diffMinutes < 60) return `${Math.min(diffMinutes, 99)}m`;  // 1m-59m
                if (diffHours < 24) return `${Math.min(diffHours, 23)}h`;      // 1h-23h
                if (diffDays < 7) return `${diffDays}d`;             // 1d-6d
                if (diffWeeks < 4) return `${diffWeeks}w`;           // 1w-3w
                if (diffMonths < 12) return `${diffMonths}M`;        // 1M-11M
                return '1y';                                         // 1+ year
                
            case 'absolute-short':
            case 'absolute-long': {
                const day = date.getDate();
                return `${MONTH_ABBREVIATIONS[date.getMonth()]}${day < 10 ? '0' + day : day}`;
            }
                
            case 'technical':
                // Technical format with more precision
                if (diffMinutes < 60) return `${diffMinutes}m`;
                if (diffHours < 24) return `${diffHours}h`;
                return `${diffDays}d`;
                
            case 'minimal': 
                // Minimal with basic time indicator
                if (diffHours < 1) return '••';
                if (diffHours < 24) return '○○';
                return '──';
                
            default:
                // Default to relative format
                if (diffMinutes < 60) return `${diffMinutes}m`;
                if (diffHours < 24) return `${diffHours}h`;
                return `${diffDays}d`;
        }
    }

    /**
     * Format file size for display
     */
    _formatFileSize(bytes, format = 'auto') {
        return formatFileSize(bytes, format);
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

        // Very recent files
        if (diffMins < 1) return this._l10n.getString('justNow');
        if (diffMins < 60) return this._l10n.getString('minutesAgo', diffMins);
        
        // Today
        if (diffHours < 24 && date.toDateString() === now.toDateString()) {
            return this._l10n.getString('hoursAgo', diffHours);
        }
        
        // This week
        if (diffDays < 7) {
            return diffDays === 1 ? this._l10n.getString('yesterday') : this._l10n.getString('daysAgo', diffDays);
        }
        
        // This year
        if (date.getFullYear() === now.getFullYear()) {
            return this._l10n.formatDate(date, { month: 'short', day: 'numeric' });
        }
        
        // Older
        return this._l10n.formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Get Git blame information for a file
     */
    async _getGitBlameInfo(filePath) {
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
            const { stdout } = await execAsync(
                `git log -1 --format="%an|%ae|%ad" -- "${relativePath}"`,
                { cwd: workspaceFolder.uri.fsPath, timeout: 2000 }
            );

            if (!stdout || !stdout.trim()) {
                return null;
            }

            const [authorName, authorEmail, authorDate] = stdout.trim().split('|');
            return {
                authorName: authorName || 'Unknown',
                authorEmail: authorEmail || '',
                authorDate: authorDate || ''
            };
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
        return buildCacheKey(getUriPath(uri));
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

            this._logger.info(`🔍 VSCODE REQUESTED DECORATION: ${fileLabel} (${filePath})`);
            this._logger.info(`📊 Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);

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
                this._logger.info(`🎭 Processing ${fileLabel} in PREVIEW MODE with settings:`, this._previewSettings);
            }

            if (!_get('showDateDecorations', true)) {
                this._logger.info(`❌ RETURNED UNDEFINED: Decorations disabled globally for ${fileLabel}`);
                return undefined;
            }

            if (await this._isExcludedSimple(uri)) {
                this._logger.info(`❌ File excluded: ${fileLabel}`);
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

            const stat = await this._fileSystem.stat(uri);
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
            const colorScheme = _get('colorScheme', 'none');
            const highContrastMode = _get('highContrastMode', false);
            const showFileSize = _get('showFileSize', false);
            const fileSizeFormat = _get('fileSizeFormat', 'auto');
            const accessibilityMode = _get('accessibilityMode', false);
            const fadeOldFiles = _get('fadeOldFiles', false);
            const fadeThreshold = _get('fadeThreshold', 30);
            const rawShowGitInfo = _get('showGitInfo', 'none');
            let badgePriority = _get('badgePriority', 'time');

            const gitFeaturesRequested = (rawShowGitInfo !== 'none') || (badgePriority === 'author');
            const gitFeaturesEnabled = gitFeaturesRequested && this._gitAvailable;
            const showGitInfo = gitFeaturesEnabled ? rawShowGitInfo : 'none';
            if (badgePriority === 'author' && !gitFeaturesEnabled) {
                badgePriority = 'time';
            }

            const gitBlame = gitFeaturesEnabled ? await this._getGitBlameInfo(filePath) : null;

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

            if (fadeOldFiles) {
                const daysSinceModified = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (daysSinceModified > fadeThreshold) {
                    color = new vscode.ThemeColor('editorGutter.commentRangeForeground');
                }
            }

            let finalBadge = trimBadge(badgeDetails.displayBadge) || trimBadge(badgeDetails.badge) || '??';
            if (this._accessibility?.shouldEnhanceAccessibility()) {
                finalBadge = this._accessibility.getAccessibleBadge(finalBadge);
            }

            let decoration;
            try {
                decoration = new vscode.FileDecoration(finalBadge);
                if (tooltip && tooltip.length < 500) {
                    decoration.tooltip = tooltip;
                    this._logger.debug(`📝 Added tooltip (${tooltip.length} chars)`);
                }
                if (color) {
                    const enhancedColor = this._enhanceColorForSelection(color);
                    decoration.color = enhancedColor;
                    this._logger.debug(`🎨 Added enhanced color: ${enhancedColor.id || enhancedColor} (original: ${color.id || color})`);
                }
                decoration.propagate = false;
            } catch (decorationError) {
                this._logger.error('❌ Failed to create decoration:', decorationError);
                decoration = new vscode.FileDecoration('!!');
                decoration.propagate = false;
            }

            this._logger.debug(`🎨 Color/contrast check for ${fileLabel}: colorScheme=${colorScheme}, highContrastMode=${highContrastMode}, hasColor=${!!color}, previewMode=${!!this._previewSettings}`);
            if (highContrastMode) {
                decoration.color = new vscode.ThemeColor('editorWarning.foreground');
                this._logger.info(`🔆 Applied high contrast color (overriding colorScheme=${colorScheme})`);
            }

            if (!this._previewSettings) {
                await this._storeDecorationInCache(cacheKey, decoration, fileLabel);
            } else {
                this._logger.debug(`🔄 Skipping cache storage due to preview mode for: ${fileLabel}`);
            }

            this._metrics.totalDecorations++;

            if (!decoration?.badge) {
                this._logger.error(`❌ Decoration badge is invalid for: ${fileLabel}`);
                return undefined;
            }

            const processingTime = Date.now() - startTime;
            this._logger.info(`✅ Decoration created for: ${fileLabel} (badge: ${decoration.badge || 'undefined'}) - Cache key: ${cacheKey.substring(0, 30)}...`);
            this._logger.info('🎯 RETURNING DECORATION TO VSCODE:', {
                file: fileLabel,
                badge: decoration.badge,
                hasTooltip: !!decoration.tooltip,
                hasColor: !!decoration.color,
                colorType: decoration.color?.constructor?.name,
                processingTimeMs: processingTime,
                decorationType: decoration.constructor.name
            });
            console.log(`🎯 DECORATION RETURNED: ${fileLabel} → "${decoration.badge}"`);

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
                : '0.00%'
        };
        
        // Include advanced system metrics if available
        if (this._advancedCache) {
            baseMetrics.advancedCache = this._advancedCache.getStats();
        }
        if (this._batchProcessor) {
            baseMetrics.batchProcessor = this._batchProcessor.getMetrics();
        }
        
        // Add cache debugging info
        baseMetrics.cacheDebugging = {
            memoryCacheKeys: Array.from(this._decorationCache.keys()).slice(0, 5), // First 5 keys for debugging
            cacheTimeout: this._cacheTimeout,
            maxCacheSize: this._maxCacheSize,
            keyStatsSize: this._cacheKeyStats ? this._cacheKeyStats.size : 0
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
        
        // Dispose advanced systems
        if (this._advancedCache) {
            await this._advancedCache.dispose();
        }
        this._cancelProgressiveWarmupJobs();
        if (this._batchProcessor) {
            this._batchProcessor.dispose();
        }
        
        // Dispose basic systems
        this._decorationCache.clear();
        this._onDidChangeFileDecorations.dispose();
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
    }
}

module.exports = { FileDateDecorationProvider };
