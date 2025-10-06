const vscode = require('vscode');
const fs = require('fs').promises;

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
    _formatDateBadge(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        // Very recent files (under 1 hour)
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        
        // Today and yesterday (under 48 hours)
        if (diffHours < 24) return `${diffHours}h`;
        if (diffHours < 48) return '1d';
        
        // This week (2-6 days)
        if (diffDays < 7) return `${diffDays}d`;
        
        // This month (1-4 weeks)
        if (diffWeeks < 4) {
            return diffWeeks === 1 ? '1w' : `${diffWeeks}w`;
        }
        
        // This year (1-11 months)
        if (date.getFullYear() === now.getFullYear()) {
            return diffMonths === 1 ? '1mo' : `${diffMonths}mo`;
        }
        
        // Previous years
        const yearDiff = now.getFullYear() - date.getFullYear();
        return yearDiff === 1 ? '1y' : `${yearDiff}y`;
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
            const badge = this._formatDateBadge(mtime);
            const readableDate = this._formatDateReadable(mtime);
            
            // Create decoration with subtle styling
            const decoration = new vscode.FileDecoration(
                badge,
                `Last modified: ${readableDate} (${mtime.toLocaleString()})`
                // No color specified - let VS Code use default subtle styling
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