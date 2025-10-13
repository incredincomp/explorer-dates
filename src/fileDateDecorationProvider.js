const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { getLogger } = require('./logger');
const { getLocalization } = require('./localization');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Provides file decorations showing last modified dates in the Explorer
 */
class FileDateDecorationProvider {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        
        // Cache to avoid repeated file system calls
        this._decorationCache = new Map();
        this._cacheTimeout = 30000; // 30 seconds
        this._maxCacheSize = 10000; // Maximum cache entries
        
        // Get logger and localization instances
        this._logger = getLogger();
        this._l10n = getLocalization();
        
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
                    e.affectsConfiguration('explorerDates.highContrastMode')) {
                    this.refreshAll();
                }
            }
        });
    }

    /**
     * Refresh decoration for a specific file
     */
    refreshDecoration(uri) {
        // Clear from cache to force refresh
        this._decorationCache.delete(uri.fsPath);
        this._onDidChangeFileDecorations.fire(uri);
    }

    /**
     * Clear decoration for a deleted file
     */
    clearDecoration(uri) {
        this._decorationCache.delete(uri.fsPath);
        this._onDidChangeFileDecorations.fire(uri);
    }

    /**
     * Refresh all decorations
     */
    refreshAll() {
        this._decorationCache.clear();
        this._onDidChangeFileDecorations.fire(undefined);
        this._logger.debug('All decorations refreshed');
    }

    /**
     * Check if a file path should be excluded from decorations
     */
    _isExcluded(uri) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const excludedFolders = config.get('excludedFolders', []);
        const excludedPatterns = config.get('excludedPatterns', []);
        
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        
        // Check excluded folders
        for (const folder of excludedFolders) {
            if (filePath.includes(path.sep + folder + path.sep) || 
                filePath.endsWith(path.sep + folder) ||
                filePath.includes(path.sep + folder)) {
                this._logger.debug(`File excluded by folder rule: ${filePath}`);
                return true;
            }
        }
        
        // Check excluded patterns using minimatch-style matching
        for (const pattern of excludedPatterns) {
            // Simple pattern matching (could be enhanced with minimatch library)
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
     * Format date badge - intuitive time-based indicators
     */
    _formatDateBadge(date, format = 'short', timestampFormat = 'relative') {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        // If absolute timestamp format is requested
        if (timestampFormat === 'absolute') {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
            });
        }

        // Relative timestamp format
        const isLongFormat = format === 'long';

        // Very recent files (under 1 hour)
        if (diffMins < 1) return this._l10n.getString('now');
        if (diffMins < 60) return `${diffMins}${this._l10n.getString('minutes')}`;
        
        // Today and yesterday (under 48 hours)
        if (diffHours < 24) return `${diffHours}${this._l10n.getString('hours')}`;
        if (diffHours < 48) return `1${this._l10n.getString('days')}`;
        
        // This week (2-6 days)
        if (diffDays < 7) return `${diffDays}${this._l10n.getString('days')}`;
        
        // This month (1-4 weeks)
        if (diffWeeks < 4) {
            return diffWeeks === 1 ? `1${this._l10n.getString('weeks')}` : `${diffWeeks}${this._l10n.getString('weeks')}`;
        if (diffMins < 1) return 'now';
        if (diffMins < 60) {
            if (isLongFormat) {
                return diffMins === 1 ? '1 min' : `${diffMins} mins`;
            }
            return `${diffMins}m`;
        }
        
        // Today and yesterday (under 48 hours)
        if (diffHours < 24) {
            if (isLongFormat) {
                return diffHours === 1 ? '1 hr' : `${diffHours} hrs`;
            }
            return `${diffHours}h`;
        }
        if (diffHours < 48) {
            return isLongFormat ? '1 day' : '1d';
        }
        
        // This week (2-6 days)
        if (diffDays < 7) {
            if (isLongFormat) {
                return `${diffDays} days`;
            }
            return `${diffDays}d`;
        }
        
        // This month (1-4 weeks)
        if (diffWeeks < 4) {
            if (isLongFormat) {
                return diffWeeks === 1 ? '1 week' : `${diffWeeks} weeks`;
            }
            return diffWeeks === 1 ? '1w' : `${diffWeeks}w`;
        }
        
        // This year (1-11 months)
        if (date.getFullYear() === now.getFullYear()) {
            return diffMonths === 1 ? `1${this._l10n.getString('months')}` : `${diffMonths}${this._l10n.getString('months')}`;
            if (isLongFormat) {
                return diffMonths === 1 ? '1 month' : `${diffMonths} months`;
            }
            return diffMonths === 1 ? '1mo' : `${diffMonths}mo`;
        }
        
        // Previous years
        const yearDiff = now.getFullYear() - date.getFullYear();
        return yearDiff === 1 ? `1${this._l10n.getString('years')}` : `${yearDiff}${this._l10n.getString('years')}`;
        if (isLongFormat) {
            return yearDiff === 1 ? '1 year' : `${yearDiff} years`;
        }
        return yearDiff === 1 ? '1y' : `${yearDiff}y`;
    }

    /**
     * Get color based on file recency
     */
    _getColorByRecency(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        // Green: Modified within 1 hour
        if (diffHours < 1) {
            return new vscode.ThemeColor('charts.green');
        }
        
        // Yellow: Modified within 1 day
        if (diffHours < 24) {
            return new vscode.ThemeColor('charts.yellow');
        }
        
        // Red: Modified more than 1 day ago
        return new vscode.ThemeColor('charts.red');
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
     * Get file decoration with caching
     */
    async provideFileDecoration(uri, token) {
        try {
            // Check if decorations are enabled
            const config = vscode.workspace.getConfiguration('explorerDates');
            if (!config.get('showDateDecorations', true)) {
                return undefined;
            }

            // Check if it's a file we should decorate
            if (uri.scheme !== 'file') {
                return undefined;
            }

            const filePath = uri.fsPath;
            
            // Check if file is excluded
            if (this._isExcluded(uri)) {
                return undefined;
            }
            
            // Check cache first
            const cached = this._decorationCache.get(filePath);
            if (cached && (Date.now() - cached.timestamp) < this._cacheTimeout) {
                this._metrics.cacheHits++;
                this._logger.debug(`Cache hit for: ${filePath}`);
                return cached.decoration;
            }

            this._metrics.cacheMisses++;

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
            const badge = this._formatDateBadge(mtime);
            const readableModified = this._formatDateReadable(mtime);
            const readableCreated = this._formatDateReadable(ctime);
            
            // Get Git blame information (async, with fallback)
            const gitBlame = await this._getGitBlameInfo(filePath);
            
            // Build detailed tooltip
            let tooltip = `📝 Last Modified: ${readableModified}\n`;
            tooltip += `   ${this._formatFullDate(mtime)}\n\n`;
            tooltip += `📅 Created: ${readableCreated}\n`;
            tooltip += `   ${this._formatFullDate(ctime)}`;
            
            if (gitBlame) {
                tooltip += `\n\n👤 Last Modified By: ${gitBlame.authorName}`;
                if (gitBlame.authorEmail) {
                    tooltip += ` (${gitBlame.authorEmail})`;
                }
                if (gitBlame.authorDate) {
                    tooltip += `\n   ${gitBlame.authorDate}`;
                }
            }
            
            // Get configuration settings
            const timeBadgeFormat = config.get('timeBadgeFormat', 'short');
            const timestampFormat = config.get('timestampFormat', 'relative');
            const enableColorCoding = config.get('enableColorCoding', false);
            
            const badge = this._formatDateBadge(mtime, timeBadgeFormat, timestampFormat);
            const readableDate = this._formatDateReadable(mtime);
            
            // Check high contrast mode
            const highContrastMode = config.get('highContrastMode', false);
            // Determine color if color-coding is enabled
            const color = enableColorCoding ? this._getColorByRecency(mtime) : undefined;
            
            // Create decoration with styling
            const decoration = new vscode.FileDecoration(
                badge,
                `${this._l10n.getString('lastModified')}: ${readableDate} (${mtime.toLocaleString()})`
                tooltip
                // No color specified - let VS Code use default subtle styling
                `Last modified: ${readableDate} (${mtime.toLocaleString()})`,
                color
            );
            
            // Apply high contrast styling if enabled
            if (highContrastMode) {
                // Use a more visible color for high contrast
                decoration.color = new vscode.ThemeColor('editorWarning.foreground');
            }
            
            // Explicitly prevent propagation to avoid interfering with Git status
            decoration.propagate = false;

            // Manage cache size before adding new entry
            this._manageCacheSize();

            // Cache the result
            this._decorationCache.set(filePath, {
                decoration,
                timestamp: Date.now()
            });

            this._metrics.totalDecorations++;
            this._logger.debug(`Decoration created for: ${filePath} (badge: ${badge})`);

            return decoration;

        } catch (error) {
            this._metrics.errors++;
            this._logger.error(this._l10n.getString('errorAccessingFile'), error, { uri: uri.fsPath });
            // Silently fail for files that can't be accessed
            return undefined;
        }
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this._metrics,
            cacheSize: this._decorationCache.size,
            cacheHitRate: this._metrics.cacheHits + this._metrics.cacheMisses > 0
                ? (this._metrics.cacheHits / (this._metrics.cacheHits + this._metrics.cacheMisses) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this._logger.info('Disposing FileDateDecorationProvider', this.getMetrics());
        this._decorationCache.clear();
        this._onDidChangeFileDecorations.dispose();
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
    }
}

module.exports = { FileDateDecorationProvider };