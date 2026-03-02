/**
 * Module federation system for Explorer Dates
 * Splits extension into loadable chunks to reduce initial bundle size
 */

const { CHUNK_MAP, WEB_EXCLUDED_CHUNKS } = require('./shared/chunkMap');

// Configuration for module federation
const federationConfig = {
    chunks: {
        // Generate chunks from shared chunk map to ensure dev/prod parity
        ...Object.fromEntries(
            Object.entries(CHUNK_MAP).map(([chunkName, sourcePath]) => [
                chunkName,
                {
                    entry: `${sourcePath}.js`,
                    runtimeEntry: `./chunks/${chunkName}.js`,
                    includes: getChunkIncludes(chunkName),
                    external: getChunkExternal(chunkName),
                    webExclude: WEB_EXCLUDED_CHUNKS.has(chunkName),
                    ...getChunkMetadata(chunkName)
                }
            ])
        )
    }
};

/**
 * Get the includes for a specific chunk
 */
function getChunkIncludes(chunkName) {
    const includesMap = {
        onboarding: ['src/onboarding.js'],
        onboardingAssets: [],
        reporting: ['src/exportReporting.js'],
        templates: ['src/workspaceTemplates.js'],
        analysis: ['src/commands/analysisCommands.js'],
        diagnostics: ['src/utils/htmlGenerators.js', 'src/utils/templateStore.js'],
        extensionApi: ['src/extensionApi.js'],
        advancedCache: ['src/advancedCache.js'],
        batchProcessor: ['src/batchProcessor.js'],
        // decorationsAdvanced delegates provider implementation to the dedicated provider chunk
        decorationsAdvanced: [],
        workspaceIntelligence: ['src/smartExclusion.js'],
        incrementalIndexer: ['src/incrementalIndexer.js'],
        incrementalWorkers: ['src/workers/indexWorkerHost.js'],
        uiAdapters: ['src/themeIntegration.js', 'src/accessibility.js'],
        gitInsights: ['src/chunks/git-insights-chunk.js'],
        smartWatcherFallback: ['src/smartWatcherFallback.js'],
        runtimeManagement: ['src/commands/runtimeCommands.js']
    };
    return includesMap[chunkName] || [];
}

/**
 * Get the external dependencies for a specific chunk
 */
function getChunkExternal(chunkName) {
    // Treat localization as a shared dependency to avoid duplicating large
    // translation bundles across every chunk. It will be provided by the
    // core bundle (`dist/extension.js`) and referenced from chunks at runtime.
    const baseExternal = ['vscode', './core', './utils/localization', 'src/utils/localization'];
    const additionalExternal = {
        onboarding: ['./onboarding-assets'],
        analysis: ['./diagnostics', '../utils/localization'],
        runtimeManagement: ['./team-persistence-chunk', '../chunks/team-persistence-chunk']
    };
    return [...baseExternal, ...(additionalExternal[chunkName] || [])];
}

/**
 * Get additional metadata for a specific chunk
 */
function getChunkMetadata(chunkName) {
    const metadataMap = {
        onboardingAssets: {
            description: 'Webview HTML/CSS/JS assets for onboarding wizard (~23KB)',
            loadTrigger: 'webview-launch'
        },
        incrementalWorkers: {
            description: 'Lazy loaded only when progressive analysis is requested'
        },
        smartWatcherFallback: {
            description: 'Lazy loaded only when native watchers fail'
        }
    };
    return metadataMap[chunkName] || {};
}

module.exports = { federationConfig };
