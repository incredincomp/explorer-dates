const vscode = require('vscode');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

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
        
        // Watch for file changes to update decorations
        this._setupFileWatcher();
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
            if (isLongFormat) {
                return diffMonths === 1 ? '1 month' : `${diffMonths} months`;
            }
            return diffMonths === 1 ? '1mo' : `${diffMonths}mo`;
        }
        
        // Previous years
        const yearDiff = now.getFullYear() - date.getFullYear();
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
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        
        // Today
        if (diffHours < 24 && date.toDateString() === now.toDateString()) {
            return `${diffHours} hours ago`;
        }
        
        // This week
        if (diffDays < 7) {
            return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
        }
        
        // This year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        // Older
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            
            // Skip files that might cause conflicts (common Git/build artifacts)
            const fileName = uri.path.split('/').pop() || '';
            if (fileName.startsWith('.git') || 
                fileName.endsWith('.tmp') || 
                fileName.endsWith('.log') || 
                filePath.includes('node_modules') ||
                filePath.includes('.git/')) {
                return undefined;
            }
            
            // Check cache first
            const cached = this._decorationCache.get(filePath);
            if (cached && (Date.now() - cached.timestamp) < this._cacheTimeout) {
                return cached.decoration;
            }

            // Check for cancellation
            if (token && token.isCancellationRequested) {
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
            
            // Determine color if color-coding is enabled
            const color = enableColorCoding ? this._getColorByRecency(mtime) : undefined;
            
            // Create decoration with styling
            const decoration = new vscode.FileDecoration(
                badge,
                tooltip
                // No color specified - let VS Code use default subtle styling
                `Last modified: ${readableDate} (${mtime.toLocaleString()})`,
                color
            );
            
            // Explicitly prevent propagation to avoid interfering with Git status
            decoration.propagate = false;

            // Cache the result
            this._decorationCache.set(filePath, {
                decoration,
                timestamp: Date.now()
            });

            return decoration;

        } catch (error) {
            // Silently fail for files that can't be accessed
            return undefined;
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this._decorationCache.clear();
        this._onDidChangeFileDecorations.dispose();
    }
}

module.exports = { FileDateDecorationProvider };