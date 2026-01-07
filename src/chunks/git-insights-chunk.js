/**
 * Git insights chunk - lazy loaded when git functionality is needed
 * Contains git blame parsing, cache management, and worker integration
 */

const { getLogger } = require('../utils/logger');
const { execAsync } = require('../utils/execAsync');
const { IndexWorkerHost } = require('../workers/indexWorkerHost');
const { getRelativePath } = require('../utils/pathUtils');

const DISABLE_GIT_FEATURES = process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES === '1';

class GitInsightsManager {
    constructor() {
        this._logger = getLogger();
        this._gitCache = new Map();
        this._maxGitCacheEntries = 1000;
        this._workerHost = null;
        this._initialized = false;
        
        // Performance metrics
        this._metrics = {
            gitBlameTimeMs: 0,
            gitBlameCalls: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * Initialize git insights functionality
     * @param {Object} options - Configuration options
     * @param {boolean} options.enableWorker - Whether to enable worker threads
     * @param {boolean} options.enableWasm - Whether to enable WASM digest support
     */
    async initialize(options = {}) {
        if (this._initialized) {
            return;
        }

        if (DISABLE_GIT_FEATURES) {
            this._logger.debug('🔧 Git insights disabled via EXPLORER_DATES_DISABLE_GIT_FEATURES');
            this._initialized = true;
            return;
        }

        this._logger.debug('🔧 Initializing Git Insights Manager');
        
        // Initialize worker host for digest operations if enabled
        if (options.enableWorker && options.enableWasm) {
            try {
                this._workerHost = new IndexWorkerHost({ logger: this._logger });
                if (this._workerHost.isEnabled()) {
                    this._logger.debug('🔧 Git insights worker host enabled');
                } else {
                    this._workerHost = null;
                    this._logger.debug('🔧 Git insights worker host disabled (not supported)');
                }
            } catch (error) {
                this._logger.debug('🔧 Failed to initialize git insights worker:', error.message);
                this._workerHost = null;
            }
        }

        this._initialized = true;
        this._logger.debug('🔧 Git Insights Manager initialized');
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this._workerHost) {
            try {
                this._workerHost.dispose();
            } catch (error) {
                this._logger.debug('Error disposing git insights worker:', error.message);
            }
            this._workerHost = null;
        }
        this._gitCache.clear();
        this._initialized = false;
        this._logger.debug('🔧 Git Insights Manager disposed');
    }

    /**
     * Check if git is available in the environment
     * @returns {Promise<boolean>}
     */
    async isGitAvailable() {
        if (DISABLE_GIT_FEATURES || !execAsync) {
            return false;
        }
        
        try {
            await execAsync('git --version', { timeout: 1000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get git blame information for a file
     * @param {string} filePath - Absolute path to the file
     * @param {number} [statMtimeMs] - File modification time for caching
     * @returns {Promise<Object|null>} Git blame info or null
     */
    async getGitBlameInfo(filePath, statMtimeMs = null) {
        if (DISABLE_GIT_FEATURES || !execAsync) {
            return null;
        }

        try {
            const vscode = require('vscode');
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                return null;
            }

            const workspacePath = workspaceFolder.uri.fsPath || workspaceFolder.uri.path;
            const relativePath = getRelativePath(workspacePath, filePath);
            const cacheKey = this._getGitCacheKey(workspacePath, relativePath, statMtimeMs);
            
            // Check cache first
            const cached = this._getCachedGitInfo(cacheKey);
            if (cached) {
                this._metrics.cacheHits++;
                return cached;
            }

            this._metrics.cacheMisses++;
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
        } catch (error) {
            this._logger.debug(`Git blame failed for ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Get initials (up to 2 characters) from a full name
     * @param {string} fullName - Full author name
     * @returns {string|null} Two-character initials or null
     */
    getInitials(fullName) {
        if (!fullName || typeof fullName !== 'string') return null;
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return null;
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        // Take first letter of first two words
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    /**
     * Clear git cache
     */
    clearCache() {
        this._gitCache.clear();
        this._logger.debug('🔧 Git cache cleared');
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this._metrics,
            cacheSize: this._gitCache.size,
            workerEnabled: !!(this._workerHost && this._workerHost.isEnabled && this._workerHost.isEnabled())
        };
    }

    /**
     * Run digest operation on worker if available
     * @param {Object} entry - Entry to digest
     * @returns {Promise<Object|null>} Digest result or null
     */
    async digestEntry(entry) {
        if (!this._workerHost || !this._workerHost.isEnabled()) {
            return null;
        }

        try {
            const [digest] = await this._workerHost.runTask('digest', [entry]);
            return digest;
        } catch (error) {
            this._logger.debug('Worker digest failed:', error.message);
            return null;
        }
    }

    // Private methods

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
}

// Create singleton instance
let gitInsightsManager = null;

/**
 * Get or create the GitInsightsManager instance
 * @returns {GitInsightsManager}
 */
function getGitInsightsManager() {
    if (!gitInsightsManager) {
        gitInsightsManager = new GitInsightsManager();
    }
    return gitInsightsManager;
}

module.exports = {
    GitInsightsManager,
    getGitInsightsManager
};
