/**
 * Workspace Intelligence Chunk
 * Contains incremental indexing and smart exclusions functionality
 * Only loaded when workspace indexing features are enabled
 */

// Lazy-load heavy components to reduce initial chunk size
let IncrementalIndexer = null;
let SmartExclusionManager = null;
const { getLogger } = require('../utils/logger');

const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
async function _ensureWorkspaceIntelligenceComponents() {
    // Load heavy implementation from a separate implementation chunk to reduce this chunk's size
    try {
        if (!IncrementalIndexer || !SmartExclusionManager) {
            const impl = await import('./workspace-intel-impl-chunk.js');
            IncrementalIndexer = impl.IncrementalIndexer;
            // Fetch SmartExclusion lazily from impl chunk to avoid bundling smartExclusion
            if (typeof impl.getSmartExclusionManagerConstructor === 'function') {
                const ctor = await impl.getSmartExclusionManagerConstructor();
                SmartExclusionManager = ctor || null;
            } else {
                SmartExclusionManager = impl.SmartExclusionManager || null;
            }
        }
    } catch {
        // Fallback to previous behavior if the impl chunk fails to load
        try {
            if (!IncrementalIndexer) {
                const featureFlagsGlobal = getFeatureFlagsGlobal();
                const chunk = featureFlagsGlobal ? await featureFlagsGlobal.loadFeatureModule('incrementalIndexer') : null;
                if (chunk && chunk.IncrementalIndexer) {
                    IncrementalIndexer = chunk.IncrementalIndexer;
                } else {
                    const mod = await import('../incrementalIndexer.js');
                    IncrementalIndexer = mod.IncrementalIndexer;
                }
            }
        } catch {
            // Try local fallback
            const mod = await import('../incrementalIndexer.js');
            IncrementalIndexer = mod.IncrementalIndexer;
        }

        if (!SmartExclusionManager) {
            const mod = await import('../smartExclusion.js');
            SmartExclusionManager = mod.SmartExclusionManager;
        }
    }
}

class WorkspaceIntelligenceManager {
    constructor(fileSystem) {
        this._fileSystem = fileSystem;
        this._logger = getLogger();
        this._incrementalIndexer = null;
        this._smartExclusion = null;
        this._initialized = false;
    }

    /**
     * Initialize workspace intelligence components
     */
    async initialize(options = {}) {
        if (this._initialized) {
            return;
        }

        const { batchProcessor, enableProgressiveAnalysis } = options;
        const hasProgressiveApi = !!(batchProcessor?.processDirectoryProgressively);

        // Initialize incremental indexer (lazy-loaded implementation)
        if (!this._incrementalIndexer) {
            await _ensureWorkspaceIntelligenceComponents();
            this._incrementalIndexer = new IncrementalIndexer(this._fileSystem);
        }
        await this._incrementalIndexer.initialize({ 
            batchProcessor: hasProgressiveApi ? batchProcessor : null,
            enableProgressiveAnalysis
        });

        if (batchProcessor && !hasProgressiveApi) {
            this._logger.warn('BatchProcessor missing progressive API; workspace indexing disabled');
        }

        // Initialize smart exclusion manager (lazy-loaded implementation)
        if (!this._smartExclusion) {
            await _ensureWorkspaceIntelligenceComponents();
            this._smartExclusion = new SmartExclusionManager();
        }

        this._initialized = true;
        this._logger.info('Workspace intelligence components initialized');
    }

    /**
     * Start workspace analysis for given folders
     */
    async analyzeWorkspace(workspaceFolders, options = {}) {
        if (!this._initialized || !workspaceFolders?.length) {
            return;
        }

        try {
            // Start incremental indexing
            if (this._incrementalIndexer?.startInitialIndex) {
                await this._incrementalIndexer.startInitialIndex(workspaceFolders, {
                    maxFiles: options.maxFiles || 2000
                });
                this._logger.info('Workspace indexing started');
            }

            // Analyze smart exclusions once across all workspace folders to avoid one prompt per folder
            if (this._smartExclusion) {
                try {
                    await this._smartExclusion.suggestExclusionsBulk(workspaceFolders);
                    this._logger.info('Smart exclusions analyzed for all workspace folders', {
                        workspaces: workspaceFolders.length
                    });
                } catch (error) {
                    this._logger.error('Failed to analyze smart exclusions for workspace folders', error);
                }
            }
        } catch (error) {
            this._logger.error('Failed to analyze workspace', error);
        }
    }

    /**
     * Clean up workspace profiles
     */
    async cleanupWorkspaceProfiles() {
        if (this._smartExclusion) {
            try {
                await this._smartExclusion.cleanupAllWorkspaceProfiles();
            } catch (error) {
                this._logger.warn('Failed to clean workspace exclusion profiles', error);
            }
        }
    }

    /**
     * Enable progressive analysis on the incremental indexer
     */
    async enableProgressiveAnalysis() {
        if (this._incrementalIndexer) {
            return this._incrementalIndexer.enableProgressiveAnalysis();
        }
        return null;
    }

    /**
     * Disable progressive analysis on the incremental indexer
     */
    disableProgressiveAnalysis() {
        if (this._incrementalIndexer) {
            this._incrementalIndexer.disableProgressiveAnalysis();
        }
    }

    /**
     * Get metrics from workspace intelligence components
     */
    getMetrics() {
        const metrics = {};

        if (this._incrementalIndexer?.getMetrics) {
            metrics.incrementalIndexer = this._incrementalIndexer.getMetrics();
        }

        if (this._smartExclusion?.getMetrics) {
            metrics.smartExclusion = this._smartExclusion.getMetrics();
        }

        return metrics;
    }

    /**
     * Handle workspace folder changes
     */
    async onWorkspaceFoldersChanged(event) {
        if (!this._initialized) {
            return;
        }

        if (event.added?.length) {
            await this.analyzeWorkspace(event.added);
        }

        // Handle removed folders if needed
        if (event.removed?.length && this._smartExclusion) {
            for (const folder of event.removed) {
                try {
                    await this._smartExclusion.removeWorkspaceProfile(folder.uri);
                } catch (error) {
                    this._logger.warn(`Failed to remove workspace profile for ${folder.name}`, error);
                }
            }
        }
    }

    /**
     * Check if a URI should be excluded from processing
     */
    shouldExclude(uri) {
        if (this._smartExclusion) {
            return this._smartExclusion.shouldExclude(uri);
        }
        return false;
    }

    /**
     * Get exclusion patterns for a workspace
     */
    getExclusionPatterns(workspaceUri) {
        if (this._smartExclusion) {
            return this._smartExclusion.getExclusionPatterns(workspaceUri);
        }
        return [];
    }

    /**
     * Dispose of workspace intelligence components
     */
    dispose() {
        if (this._incrementalIndexer?.dispose) {
            this._incrementalIndexer.dispose();
        }
        if (this._smartExclusion?.dispose) {
            this._smartExclusion.dispose();
        }
        this._initialized = false;
        this._logger.debug('Workspace intelligence components disposed');
    }

    // Getters for direct access to components (backward compatibility)
    get incrementalIndexer() {
        return this._incrementalIndexer;
    }

    get smartExclusion() {
        return this._smartExclusion;
    }
}

// Synchronously expose constructors for tests and dev loader. These are
// intentionally best-effort (may be null in some runtime/federation builds) —
// runtime consumers should still use WorkspaceIntelligenceManager which
// lazily resolves implementations via _ensureWorkspaceIntelligenceComponents().
let _syncIncrementalIndexer = null;
let _syncSmartExclusionManager = null;
try {
    _syncIncrementalIndexer = require('../incrementalIndexer').IncrementalIndexer;
} catch {
    _syncIncrementalIndexer = null;
}
try {
    _syncSmartExclusionManager = require('../smartExclusion').SmartExclusionManager;
} catch {
    _syncSmartExclusionManager = null;
}

module.exports = {
    WorkspaceIntelligenceManager,
    IncrementalIndexer: _syncIncrementalIndexer,
    SmartExclusionManager: _syncSmartExclusionManager
};
