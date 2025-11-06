const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { getLogger } = require('./logger');
const { getLocalization } = require('./localization');
const { exec } = require('child_process');
const { promisify } = require('util');
const { SmartExclusionManager } = require('./smartExclusion');
const { BatchProcessor } = require('./batchProcessor');
const { AdvancedCache } = require('./advancedCache');
const { ThemeIntegrationManager } = require('./themeIntegration');
const { AccessibilityManager } = require('./accessibility');

const execAsync = promisify(exec);

/**
 * Provides file decorations showing last modified dates in the Explorer
 */
class FileDateDecorationProvider {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        
        // Enhanced cache to avoid repeated file system calls
        this._decorationCache = new Map();
        this._cacheTimeout = 120000; // 2 minutes - increased for better hit rate
        this._maxCacheSize = 10000; // Maximum cache entries
        
        // Cache performance tracking
        this._cacheKeyStats = new Map(); // Track cache key usage patterns
        
        // Get logger and localization instances
        this._logger = getLogger();
        this._l10n = getLocalization();
        
        // Initialize performance systems
        this._smartExclusion = new SmartExclusionManager();
        this._batchProcessor = new BatchProcessor();
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
        
        // Watch for file changes to update decorations
        this._setupFileWatcher();
        
        // Listen for configuration changes
        this._setupConfigurationWatcher();
        
        this._logger.info('FileDateDecorationProvider initialized');
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
            this._providerCallFiles.add(uri.fsPath);
            this._logger.info(`🔍 Provider called ${this._providerCallCount} times for: ${uri.fsPath}`);
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
                    e.affectsConfiguration('explorerDates.customColors')) {
                    this.refreshAll();
                }
            }
        });
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
                this._logger.debug(`Could not invalidate advanced cache for ${path.basename(uri.fsPath)}: ${error.message}`);
            }
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`🔄 Refreshed decoration cache for: ${path.basename(uri.fsPath)}`);
    }

    /**
     * Clear decoration for a deleted file
     */
    clearDecoration(uri) {
        const cacheKey = this._getCacheKey(uri);
        this._decorationCache.delete(cacheKey);
        if (this._advancedCache) {
            // Advanced cache doesn't have a delete method, so we'll let it expire naturally
            this._logger.debug(`Advanced cache entry will expire naturally: ${path.basename(uri.fsPath)}`);
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`🗑️ Cleared decoration cache for: ${path.basename(uri.fsPath)}`);
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
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath).toLowerCase();
        
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
            if (filePath.includes(`${path.sep}${folder}${path.sep}`) || 
                filePath.endsWith(`${path.sep}${folder}`)) {
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
            if (pattern.includes('node_modules') && filePath.includes('node_modules')) {
                return true;
            }
            if (pattern.includes('.git/**') && filePath.includes('.git' + path.sep)) {
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
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        
        // Get combined exclusions (global + workspace + smart)
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            const combined = await this._smartExclusion.getCombinedExclusions(workspaceFolder.uri);
            
            // Check excluded folders (must be actual directory paths, not just substrings)
            for (const folder of combined.folders) {
                // More precise folder matching - ensure we're matching actual directory boundaries
                const folderPattern = new RegExp(`(^|${path.sep.replace(/[\\]/g, '\\\\')})${folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(${path.sep.replace(/[\\]/g, '\\\\')}|$)`);
                if (folderPattern.test(filePath)) {
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
                
                if (regex.test(filePath) || regex.test(fileName)) {
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
                const folderPattern = new RegExp(`(^|${path.sep.replace(/[\\]/g, '\\\\')})${folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(${path.sep.replace(/[\\]/g, '\\\\')}|$)`);
                if (folderPattern.test(filePath)) {
                    return true;
                }
            }
            
            for (const pattern of excludedPatterns) {
                const regexPattern = pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/\\\\]*')
                    .replace(/\?/g, '.');
                const regex = new RegExp(regexPattern);
                
                if (regex.test(filePath) || regex.test(fileName)) {
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

    /**
     * Format date badge - VS Code compliant 2-character indicators
     * Based on user experience that VS Code supports at least 2 characters
     */
    _formatDateBadge(date, formatType, precalcDiffMs = null) {
        const now = new Date();
        const diffMs = precalcDiffMs !== null ? precalcDiffMs : (now.getTime() - date.getTime());
        
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
                // 2-character date indicators (month abbreviations)
                const monthNames = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 
                                  'Jl', 'Au', 'Se', 'Oc', 'No', 'De'];
                const day = date.getDate();
                return `${monthNames[date.getMonth()]}${day < 10 ? '0' + day : day}`;
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
        if (format === 'bytes') {
            return `~${bytes}B`;
        }
        
        const kb = bytes / 1024;
        if (format === 'kb') {
            return `~${kb.toFixed(1)}K`;
        }
        
        const mb = kb / 1024;
        if (format === 'mb') {
            return `~${mb.toFixed(1)}M`;
        }
        
        // Auto format - keep very compact with size prefix
        if (bytes < 1024) {
            return `~${bytes}B`;
        } else if (kb < 1024) {
            return `~${Math.round(kb)}K`;
        } else {
            return `~${mb.toFixed(1)}M`;
        }
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
                const ext = path.extname(filePath).toLowerCase();
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
                // Use custom colors from configuration
                const config = vscode.workspace.getConfiguration('explorerDates');
                const customColors = config.get('customColors', {
                    veryRecent: '#00ff00',
                    recent: '#ffff00',
                    old: '#ff0000'
                });
                
                // Create custom color decorations based on user's hex values
                // Note: VS Code doesn't directly support hex colors in ThemeColor,
                // but we can use the closest semantic theme colors that will adapt to themes
                if (diffHours < 1) {
                    // For veryRecent files - use success/positive color
                    return customColors.veryRecent.toLowerCase().includes('green') || customColors.veryRecent === '#00ff00' 
                        ? new vscode.ThemeColor('terminal.ansiGreen')
                        : new vscode.ThemeColor('editorInfo.foreground');
                }
                if (diffHours < 24) {
                    // For recent files - use warning/caution color  
                    return customColors.recent.toLowerCase().includes('yellow') || customColors.recent === '#ffff00'
                        ? new vscode.ThemeColor('terminal.ansiYellow')
                        : new vscode.ThemeColor('editorWarning.foreground');
                }
                // For old files - use error/danger color
                return customColors.old.toLowerCase().includes('red') || customColors.old === '#ff0000'
                    ? new vscode.ThemeColor('terminal.ansiRed') 
                    : new vscode.ThemeColor('editorError.foreground');
            }
            
            default:
                return undefined;
        }
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
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                return null;
            }

            const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
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
        } catch (error) {
            // Git might not be available or file not in a git repo
            return null;
        }
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
        // Normalize path separators and resolve to canonical form
        const normalized = path.resolve(uri.fsPath).toLowerCase();
        return normalized;
    }

    /**
     * Get file decoration with enhanced caching
     */
    async provideFileDecoration(uri, token) {
        let startTime;
        
        try {
            startTime = Date.now();
            
            // Handle edge cases for URI processing
            if (!uri || !uri.fsPath) {
                console.error('❌ Invalid URI provided to provideFileDecoration:', uri);
                return undefined;
            }
            
            // Extract filename for logging
            const fileName = require('path').basename(uri.fsPath);
            
            // CRITICAL DEBUG: Log every call to this method with context
            this._logger.info(`🔍 VSCODE REQUESTED DECORATION: ${fileName} (${uri.fsPath})`);
            this._logger.info(`📊 Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);
            
            // Check if decorations are enabled
            const config = vscode.workspace.getConfiguration('explorerDates');
            if (!config.get('showDateDecorations', true)) {
                this._logger.info(`❌ RETURNED UNDEFINED: Decorations disabled globally for ${fileName}`);
                return undefined;
            }

            // Check if it's a file we should decorate
            if (uri.scheme !== 'file') {
                this._logger.debug(`Non-file URI scheme: ${uri.scheme}`);
                return undefined;
            }

            const filePath = uri.fsPath;
            const cacheKey = this._getCacheKey(uri);
            
            // Check if file is excluded (simplified logic)
            if (await this._isExcludedSimple(uri)) {
                this._logger.info(`❌ File excluded: ${path.basename(filePath)}`);
                return undefined;
            }
            
            this._logger.debug(`🔍 Processing file: ${path.basename(filePath)}`);
            
            // Enhanced cache lookup - try advanced cache first, then memory cache
            let cached = null;
            
            // Try advanced cache if available
            if (this._advancedCache) {
                try {
                    cached = await this._advancedCache.get(cacheKey);
                    if (cached) {
                        this._metrics.cacheHits++;
                        this._logger.debug(`🧠 Advanced cache hit for: ${path.basename(filePath)}`);
                        return cached;
                    }
                } catch (error) {
                    this._logger.debug(`Advanced cache error: ${error.message}`);
                }
            }
            
            // Try memory cache with normalized key
            cached = this._decorationCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this._cacheTimeout) {
                this._metrics.cacheHits++;
                this._logger.debug(`💾 Memory cache hit for: ${path.basename(filePath)}`);
                return cached.decoration;
            }

            this._metrics.cacheMisses++;
            this._logger.debug(`❌ Cache miss for: ${path.basename(filePath)} (key: ${cacheKey.substring(0, 50)}...)`);

            // Check for cancellation
            if (token && token.isCancellationRequested) {
                this._logger.debug(`Decoration cancelled for: ${filePath}`);
                return undefined;
            }

            // Get file stats
            const stat = await fs.stat(filePath);
            
            // Only decorate files, not directories (to avoid clutter)
            if (!stat.isFile()) {
                return undefined;
            }

            const mtime = stat.mtime;
            const ctime = stat.birthtime; // Creation time
            
            // Calculate time differences for reuse
            const now = new Date();
            const diffMs = now.getTime() - mtime.getTime();
            
            // Get configuration settings
            const dateFormat = config.get('dateDecorationFormat', 'smart');
            const colorScheme = config.get('colorScheme', 'none');
            const highContrastMode = config.get('highContrastMode', false);
            const showFileSize = config.get('showFileSize', false);
            const fileSizeFormat = config.get('fileSizeFormat', 'auto');
            // Note: VS Code's FileDecorationProvider doesn't support hover events
            // Decorations are always visible when the provider returns them
            
            const badge = this._formatDateBadge(mtime, dateFormat, diffMs);
            const readableModified = this._formatDateReadable(mtime);
            const readableCreated = this._formatDateReadable(ctime);
            
            // Get Git information if enabled
            const showGitInfo = config.get('showGitInfo', 'none');
            const gitBlame = showGitInfo !== 'none' ? await this._getGitBlameInfo(filePath) : null;
            
            // Build composite badge with size and git info (keep under 2 characters for VS Code compatibility)
            let displayBadge = badge;
            
            if (showFileSize && showGitInfo === 'none') {
                // Just use the basic badge - don't add file size as it makes badges too long
                displayBadge = badge;
            } else if (showFileSize && showGitInfo !== 'none' && gitBlame && gitBlame.authorName) {
                // Priority to basic badge only - git info will be in tooltip
                displayBadge = badge;
            } else if (showGitInfo !== 'none' && gitBlame && gitBlame.authorName) {
                // Just use basic badge - git info will be in tooltip
                displayBadge = badge;
            }

            
            // Build detailed tooltip with enhanced information and accessibility support
            const fileDisplayName = path.basename(filePath);
            const fileExt = path.extname(filePath);
            const isCodeFile = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.php', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.kt', '.swift'].includes(fileExt.toLowerCase());
            
            // Check if accessibility mode is enabled for enhanced tooltips
            const accessibleTooltip = this._accessibility.getAccessibleTooltip(filePath, mtime, ctime, stat.size, gitBlame);

            let tooltip;
            if (accessibleTooltip) {
                tooltip = accessibleTooltip;
            } else {
                // Standard rich tooltip
                tooltip = `📄 File: ${fileDisplayName}\n`;
                tooltip += `📝 Last Modified: ${readableModified}\n`;
                tooltip += `   ${this._formatFullDate(mtime)}\n\n`;
                tooltip += `📅 Created: ${readableCreated}\n`;
                tooltip += `   ${this._formatFullDate(ctime)}\n\n`;
                tooltip += `📊 Size: ${this._formatFileSize(stat.size, 'auto')} (${stat.size.toLocaleString()} bytes)\n`;
                
                // Add file type information
                if (fileExt) {
                    tooltip += `🏷️ Type: ${fileExt.toUpperCase()} file\n`;
                }
                
                // Add line count for code files
                if (isCodeFile) {
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const lineCount = content.split('\n').length;
                        tooltip += `📏 Lines: ${lineCount.toLocaleString()}\n`;
                    } catch (error) {
                        // Silently skip line count if file can't be read
                    }
                }
                
                // Add full path
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
            }
            
            // Get color based on scheme and theme integration
            let color = undefined;
            if (colorScheme !== 'none') {
                if (this._themeIntegration) {
                    color = this._themeIntegration.applyThemeAwareColorScheme(colorScheme, filePath, diffMs);
                } else {
                    // Fallback to basic color scheme logic
                    color = this._getColorByScheme(mtime, colorScheme, filePath);
                }
            }
            this._logger.debug(`🎨 Color scheme setting: ${colorScheme}, using color: ${color ? 'yes' : 'no'}`);
            
            // Apply fade effect for old files if enabled
            const fadeOldFiles = config.get('fadeOldFiles', false);
            const fadeThreshold = config.get('fadeThreshold', 30);
            
            if (fadeOldFiles) {
                const daysSinceModified = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (daysSinceModified > fadeThreshold) {
                    // Override color with faded version for old files
                    color = new vscode.ThemeColor('editorGutter.commentRangeForeground');
                }
            }
            
            // Apply accessibility processing if enabled
            let finalBadge = displayBadge;
            if (this._accessibility && this._accessibility.shouldEnhanceAccessibility()) {
                finalBadge = this._accessibility.getAccessibleBadge(displayBadge);
            }

            // Ensure badge meets VS Code length requirements (max 2 characters for compatibility)
            if (finalBadge && finalBadge.length > 2) {
                finalBadge = finalBadge.substring(0, 2);
            }
            
            // Debug log the final badge value
            this._logger.info(`🏷️ Final badge for ${path.basename(filePath)}: "${finalBadge}" (type: ${typeof finalBadge})`);
            
            // Test with a very simple decoration first to see if VS Code accepts it
            let decoration;
            try {
                // Try with just badge first (most minimal decoration)
                decoration = new vscode.FileDecoration(finalBadge);
                this._logger.info(`🧪 Simple decoration test: badge="${finalBadge}"`);
                
                // If simple works, add tooltip
                if (tooltip && tooltip.length < 500) { // Limit tooltip length
                    decoration.tooltip = tooltip;
                    this._logger.debug(`📝 Added tooltip (${tooltip.length} chars)`);
                }
                
                // If tooltip works, add color
                if (color) {
                    decoration.color = color;
                    this._logger.debug(`🎨 Added color: ${color.id || color}`);
                }
                
                // Set propagate to false (don't propagate to parent folders)
                decoration.propagate = false;
                
                this._logger.info(`📝 Final decoration:`, {
                    badge: decoration.badge,
                    tooltip: decoration.tooltip ? `${decoration.tooltip.length} chars` : 'none',
                    color: decoration.color ? (decoration.color.id || 'custom') : 'none',
                    propagate: decoration.propagate
                });
                
            } catch (decorationError) {
                this._logger.error(`❌ Failed to create decoration:`, decorationError);
                // Fallback to absolute minimal decoration
                decoration = new vscode.FileDecoration('!!');
                decoration.propagate = false;
            }
            
            // Apply high contrast styling if enabled
            if (highContrastMode) {
                decoration.color = new vscode.ThemeColor('editorWarning.foreground');
                this._logger.info(`🔆 Applied high contrast color`);
            }

            // Store in both memory and advanced cache with normalized key
            this._manageCacheSize();
            const cacheEntry = {
                decoration,
                timestamp: Date.now()
            };
            
            // Store in memory cache
            this._decorationCache.set(cacheKey, cacheEntry);
            
            // Store in advanced cache if available
            if (this._advancedCache) {
                try {
                    await this._advancedCache.set(cacheKey, decoration, { ttl: this._cacheTimeout });
                    this._logger.debug(`🧠 Stored in advanced cache: ${path.basename(filePath)}`);
                } catch (error) {
                    this._logger.debug(`Failed to store in advanced cache: ${error.message}`);
                }
            }

            this._metrics.totalDecorations++;
            
            // Validate decoration before returning
            if (!decoration) {
                this._logger.error(`❌ Decoration is null for: ${path.basename(filePath)}`);
                return undefined;
            }
            
            if (!decoration.badge) {
                this._logger.error(`❌ Decoration badge is empty for: ${path.basename(filePath)}`);
                return undefined;
            }
            
            // Final validation - ensure badge is string and not too long
            if (typeof decoration.badge !== 'string' || decoration.badge.length === 0) {
                this._logger.error(`❌ Invalid badge type/length for: ${path.basename(filePath)} - Badge: ${decoration.badge}`);
                return undefined;
            }
            
            this._logger.info(`✅ Decoration created for: ${path.basename(filePath)} (badge: ${finalBadge || 'undefined'}) - Cache key: ${cacheKey.substring(0, 30)}...`);
            const processingTime = Date.now() - startTime;
            
            this._logger.info(`🎯 RETURNING DECORATION TO VSCODE:`, {
                file: fileDisplayName,
                badge: decoration.badge,
                hasTooltip: !!decoration.tooltip,
                hasColor: !!decoration.color,
                colorType: decoration.color?.constructor?.name,
                processingTimeMs: processingTime,
                decorationType: decoration.constructor.name
            });
            
            // Also log to console for immediate visibility
            console.log(`🎯 DECORATION RETURNED: ${fileDisplayName} → "${decoration.badge}"`);

            return decoration;

        } catch (error) {
            this._metrics.errors++;
            const processingTime = startTime ? Date.now() - startTime : 0;
            const safeFileName = uri?.fsPath ? require('path').basename(uri.fsPath) : 'unknown-file';
            const safeUri = uri?.fsPath || 'unknown-uri';
            
            this._logger.error(`❌ DECORATION ERROR for ${safeFileName}:`, {
                error: error.message,
                stack: error.stack?.split('\n')[0],
                processingTimeMs: processingTime,
                uri: safeUri
            });
            
            // Also log to console for immediate visibility
            console.error(`❌ DECORATION ERROR: ${safeFileName} → ${error.message}`);
            console.error(`❌ Full error:`, error);
            console.error(`❌ Stack trace:`, error.stack);
            
            // Log error to VS Code output immediately
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
            // Initialize advanced cache
            this._advancedCache = new AdvancedCache(context);
            await this._advancedCache.initialize();
            this._logger.info('Advanced cache initialized');
            
            // Initialize batch processor
            this._batchProcessor.initialize();
            this._logger.info('Batch processor initialized');
            
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

    /**
     * Dispose of resources
     */
    async dispose() {
        this._logger.info('Disposing FileDateDecorationProvider', this.getMetrics());
        
        // Dispose advanced systems
        if (this._advancedCache) {
            await this._advancedCache.dispose();
        }
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