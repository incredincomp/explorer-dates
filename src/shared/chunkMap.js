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
    workspaceIntelligence: 'src/chunks/workspaceIntelligence',
    incrementalWorkers: 'src/chunks/incrementalWorkers',
    uiAdapters: 'src/chunks/ui-adapters',
    gitInsights: 'src/chunks/gitInsights-chunk',
    smartWatcherFallback: 'src/chunks/smartWatcherFallback-chunk'
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