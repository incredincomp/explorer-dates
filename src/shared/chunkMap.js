/**
 * Shared chunk mapping for module federation
 * This ensures the dev loader and production federation stay in sync
 */

const CHUNK_MAP = {
    onboarding: 'src/chunks/onboarding-chunk',
    onboardingAssets: 'src/chunks/onboarding-assets-chunk',
    reporting: 'src/chunks/reporting-chunk',
    templates: 'src/chunks/templates-chunk',
    analysis: 'src/chunks/analysis-chunk',
    diagnostics: 'src/chunks/diagnostics-chunk',
    extensionApi: 'src/chunks/extension-api-chunk',
    advancedCache: 'src/chunks/advancedCache-chunk',
    batchProcessor: 'src/chunks/batchProcessor-chunk',
    decorationsAdvanced: 'src/chunks/decorations-advanced',
    decorationsStatic: 'src/chunks/decorations-static',
    workspaceIntelligence: 'src/chunks/workspaceIntelligence',

    // Newly split decoration helper chunks (keeps `decorationsAdvanced` smaller)
    decorationLogic: 'src/chunks/decoration-logic-chunk',
    decorationProvide: 'src/chunks/decoration-provide-chunk',
    decorationHelpers: 'src/chunks/decoration-helpers-chunk',
    decorationBatch: 'src/chunks/decoration-batch-chunk',
    decorationWorkspaceIntel: 'src/chunks/decoration-workspace-intel-chunk',
    decorationTelemetry: 'src/chunks/decoration-telemetry-chunk',
    decorationRefresh: 'src/chunks/decoration-refresh-chunk',
    decorationMemory: 'src/chunks/decoration-memory-chunk',
    decorationPool: 'src/chunks/decoration-pool-chunk',
    providerInit: 'src/chunks/provider-init-chunk',
    // Provider core chunk (keeps heavy provider implementation out of core bundle)
    // Shared utilities
    utilsShared: 'src/chunks/utils-shared-chunk',
    incrementalWorkers: 'src/chunks/incrementalWorkers',
    incrementalIndexer: 'src/chunks/incrementalIndexer-chunk',
    uiAdapters: 'src/chunks/ui-adapters',
    gitInsights: 'src/chunks/gitInsights-chunk',
    smartWatcherFallback: 'src/chunks/smartWatcherFallback-chunk',
    runtimeManagement: 'src/chunks/runtime-management',
    runtimeManagementHeavy: 'src/chunks/runtime-management-heavy',
    teamPersistence: 'src/chunks/team-persistence-chunk',
    teamPersistenceUI: 'src/chunks/team-persistence-ui-chunk',
    teamPersistenceLogic: 'src/chunks/team-persistence-logic-chunk',
    settingsCoordinatorImpl: 'src/chunks/settings-coordinator-impl-chunk',
    logger: 'src/chunks/logger-chunk',
    // alias for the heavier runtime logger implementation
    loggerImpl: 'src/chunks/logger-impl-chunk'
};

/**
 * Get the development source path for a chunk
 * @param {string} chunkName - Name of the chunk
 * @returns {string} - Source path for development
 */
function getChunkSourcePath(chunkName) {
    return CHUNK_MAP[chunkName] || null;
}

/**
 * Get all available chunk names
 * @returns {string[]} - Array of all chunk names
 */
function getAllChunkNames() {
    return Object.keys(CHUNK_MAP);
}

/**
 * Generate the development loader map
 * @param {Function} localRequire - The require function to use
 * @returns {Object} - Map of chunk names to loader functions
 */
function generateDevLoaderMap(localRequire) {
    const map = {};
    for (const [chunkName, sourcePath] of Object.entries(CHUNK_MAP)) {
        map[chunkName] = () => localRequire(`./${sourcePath}`);
    }
    return map;
}

module.exports = {
    CHUNK_MAP,
    getChunkSourcePath,
    getAllChunkNames,
    generateDevLoaderMap
};