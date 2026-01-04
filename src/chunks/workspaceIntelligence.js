/**
 * Workspace Intelligence Chunk
 * Contains incremental indexing and smart exclusions functionality
 * Only loaded when workspace indexing features are enabled
 */

const { IncrementalIndexer } = require('../incrementalIndexer');
const { SmartExclusionManager } = require('../smartExclusion');
const { getLogger } = require('../utils/logger');

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

        // Initialize incremental indexer
        if (!this._incrementalIndexer) {
            this._incrementalIndexer = new IncrementalIndexer(this._fileSystem);
        }
        this._incrementalIndexer.initialize({ 
            batchProcessor,
            enableProgressiveAnalysis
        });

        // Initialize smart exclusion manager
        if (!this._smartExclusion) {
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
            if (this._incrementalIndexer) {
                await this._incrementalIndexer.startInitialIndex(workspaceFolders, {
                    maxFiles: options.maxFiles || 2000
                });
                this._logger.info('Workspace indexing started');
            }

            // Analyze smart exclusions for each workspace folder
            if (this._smartExclusion) {
                for (const folder of workspaceFolders) {
                    try {
                        await this._smartExclusion.suggestExclusions(folder.uri);
                        this._logger.info(`Smart exclusions analyzed for: ${folder.name}`);
                    } catch (error) {
                        this._logger.error(`Failed to analyze smart exclusions for ${folder.name}`, error);
                    }
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

module.exports = {
    WorkspaceIntelligenceManager,
    // Export individual components for direct access if needed
    IncrementalIndexer,
    SmartExclusionManager
};
