/**
 * Smart Watcher Fallback System
 * Provides legacy file watching compatibility for platforms that don't support native watchers
 * Only loaded when smartFileWatching is enabled and native watchers fail
 */

const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { normalizePath } = require('./utils/pathUtils');

/**
 * Fallback watcher that uses polling for platforms with unreliable file system events
 */
class LegacyFileWatcher {
    constructor(options = {}) {
        this._logger = options.logger || getLogger();
        this._pattern = options.pattern;
        this._pollingInterval = options.pollingInterval || 2000;
        this._watchedFiles = new Map();
        this._disposed = false;
        this._pollingTimer = null;
        this._changeEmitter = new vscode.EventEmitter();
        this._createEmitter = new vscode.EventEmitter();
        this._deleteEmitter = new vscode.EventEmitter();
        
        this._logger.warn('Using legacy file watcher fallback - performance may be reduced');
        this._startPolling();
    }

    get onDidChange() {
        return this._changeEmitter.event;
    }

    get onDidCreate() {
        return this._createEmitter.event;
    }

    get onDidDelete() {
        return this._deleteEmitter.event;
    }

    _startPolling() {
        if (this._disposed || this._pollingTimer) {
            return;
        }

        this._pollingTimer = setInterval(() => {
            this._pollFiles().catch(error => {
                this._logger.debug('Polling error in legacy watcher:', error);
            });
        }, this._pollingInterval);
    }

    async _pollFiles() {
        if (this._disposed) {
            return;
        }

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            
            for (const folder of workspaceFolders) {
                await this._pollWorkspaceFolder(folder);
            }
        } catch (error) {
            this._logger.debug('Error polling workspace folders:', error);
        }
    }

    async _pollWorkspaceFolder(folder) {
        try {
            const files = await vscode.workspace.findFiles(
                this._pattern || '**/*',
                '**/node_modules/**',
                1000 // Limit to prevent excessive polling
            );

            for (const file of files) {
                await this._checkFileStatus(file);
            }
        } catch (error) {
            this._logger.debug(`Error polling folder ${folder.name}:`, error);
        }
    }

    async _checkFileStatus(uri) {
        if (this._disposed) {
            return;
        }

        const filePath = uri.fsPath;
        const normalizedPath = normalizePath(filePath);
        
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            const lastModified = stat.mtime;
            const existing = this._watchedFiles.get(normalizedPath);

            if (!existing) {
                // New file detected
                this._watchedFiles.set(normalizedPath, {
                    mtime: lastModified,
                    exists: true
                });
                this._createEmitter.fire(uri);
            } else if (existing.mtime !== lastModified) {
                // File changed
                existing.mtime = lastModified;
                this._changeEmitter.fire(uri);
            }
        } catch {
            // File might have been deleted
            const existing = this._watchedFiles.get(normalizedPath);
            if (existing && existing.exists) {
                existing.exists = false;
                this._deleteEmitter.fire(uri);
                this._watchedFiles.delete(normalizedPath);
            }
        }
    }

    dispose() {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        
        if (this._pollingTimer) {
            clearInterval(this._pollingTimer);
            this._pollingTimer = null;
        }

        this._changeEmitter.dispose();
        this._createEmitter.dispose();
        this._deleteEmitter.dispose();
        
        this._watchedFiles.clear();
        this._logger.debug('Legacy file watcher disposed');
    }
}

/**
 * Smart Watcher Fallback Manager
 * Detects when native watchers fail and provides fallback mechanisms
 */
class SmartWatcherFallback {
    constructor(options = {}) {
        this._logger = options.logger || getLogger();
        this._nativeWatcherTimeout = options.nativeWatcherTimeout || 5000;
        this._legacyWatchers = new Set();
        this._disposed = false;
        this._fallbackActive = false;
    }

    /**
     * Attempts to create a native watcher, falls back to polling if it fails
     */
    async createWatcherWithFallback(pattern, options = {}) {
        if (this._disposed) {
            throw new Error('SmartWatcherFallback has been disposed');
        }

        try {
            // First try native watcher
            const nativeWatcher = await this._tryNativeWatcher(pattern, options);
            if (nativeWatcher) {
                this._logger.debug(`Native watcher created successfully for pattern: ${pattern}`);
                return nativeWatcher;
            }
        } catch (error) {
            this._logger.debug(`Native watcher failed for pattern ${pattern}:`, error);
        }

        // Fall back to legacy watcher
        return this._createLegacyWatcher(pattern, options);
    }

    async _tryNativeWatcher(pattern) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Native watcher creation timeout'));
            }, this._nativeWatcherTimeout);

            try {
                const watcher = vscode.workspace.createFileSystemWatcher(pattern);
                
                // Test if the watcher actually works by listening for events
                const testDisposable = watcher.onDidChange(() => {
                    // If we get here, the native watcher is working
                    clearTimeout(timeout);
                    testDisposable.dispose();
                    resolve(watcher);
                });

                // If no events received within a reasonable time, assume it's working
                // (we can't wait indefinitely for a file change)
                setTimeout(() => {
                    clearTimeout(timeout);
                    testDisposable.dispose();
                    resolve(watcher);
                }, 1000);

            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    _createLegacyWatcher(pattern, options) {
        if (!this._fallbackActive) {
            this._fallbackActive = true;
            this._logger.info('🔄 Smart watcher fallback activated - using legacy polling mode');
        }

        const legacyWatcher = new LegacyFileWatcher({
            pattern,
            logger: this._logger,
            pollingInterval: options.pollingInterval || 2000
        });

        this._legacyWatchers.add(legacyWatcher);
        return legacyWatcher;
    }

    /**
     * Check if the current platform requires fallback watchers
     */
    static platformRequiresFallback() {
        // Check for known problematic platforms
        const platform = process.platform;
        const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;
        const isRemote = vscode.env.remoteName;
        const isDocker = process.env.DOCKER_CONTAINER;
        
        // Add other platform-specific checks as needed
        return isWSL || isRemote || isDocker || platform === 'android';
    }

    /**
     * Test if native watchers are working correctly
     */
    static async testNativeWatcherSupport() {
        try {
            const testWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode-watcher-test-*');
            
            // Quick test - if creation succeeds, assume watchers work
            const isSupported = !!testWatcher;
            testWatcher.dispose();
            
            return isSupported;
        } catch {
            return false;
        }
    }

    dispose() {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        
        for (const watcher of this._legacyWatchers) {
            try {
                watcher.dispose();
            } catch (error) {
                this._logger.debug('Error disposing legacy watcher:', error);
            }
        }
        
        this._legacyWatchers.clear();
        
        if (this._fallbackActive) {
            this._logger.debug('Smart watcher fallback manager disposed');
        }
    }
}

module.exports = {
    SmartWatcherFallback,
    LegacyFileWatcher
};
