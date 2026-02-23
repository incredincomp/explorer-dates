/**
 * Built-in preset configurations optimized for different workspace types
 * These are immutable definitions used by the runtime configuration system
 */

// Chunk size mappings for bundle calculations (in KB)
const CHUNK_SIZES = {
    onboarding: 34,
    analysisCommands: 23,
    exportReporting: 17,
    extensionApi: 15,
    workspaceTemplates: 14,
    advancedCache: 28,
    workspaceIntelligence: 31,
    incrementalWorkers: 19
};

const BASE_BUNDLE_SIZE = 99; // Core extension bundle size in KB

// Lazy-load PRESET_DEFINITIONS from a chunk to avoid duplicating large static data across many chunks
function _getPresetDefinitionsSync() {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/preset-definitions-chunk');
            if (chunk && chunk.PRESET_DEFINITIONS) return chunk.PRESET_DEFINITIONS;
        }
    } catch {
        // if chunk not available (dev/test), fall back to a compact inlined subset
    }

    // Compact fallback definitions (keeps behavior but small footprint)
    const FALLBACK_PRESET = {
        minimal: {
            id: 'minimal',
            name: 'Minimal',
            description: 'Lean setup that prioritizes responsiveness in large repos.',
            targetScenarios: ['Large repos', 'Low resources', 'Minimal UI'],
            settings: { 'explorerDates.performanceMode': true, 'explorerDates.showDateDecorations': true }
        },
        balanced: {
            id: 'balanced',
            name: 'Balanced',
            description: 'Default feature mix for most workspaces.',
            targetScenarios: ['General development', 'Mixed workloads'],
            settings: {
                'explorerDates.enableOnboardingSystem': true,
                'explorerDates.enableAnalysisCommands': true,
                'explorerDates.performanceMode': false,
                'explorerDates.dateDecorationFormat': 'smart',
                'explorerDates.colorScheme': 'recency',
                'explorerDates.badgePriority': 'time'
            }
        },
        'web-development': {
            id: 'web-development',
            name: 'Web Development',
            description: 'Optimized for frontend and full-stack web projects.',
            targetScenarios: ['Web apps', 'Frontend teams'],
            settings: {
                'explorerDates.enableOnboardingSystem': true,
                'explorerDates.dateDecorationFormat': 'smart',
                'explorerDates.colorScheme': 'file-type',
                'explorerDates.badgePriority': 'time'
            }
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'Full feature set with reporting and integrations enabled.',
            targetScenarios: ['Large teams', 'Governed environments'],
            settings: {
                'explorerDates.enableExportReporting': true,
                'explorerDates.enableExtensionApi': true,
                'explorerDates.dateDecorationFormat': 'smart',
                'explorerDates.colorScheme': 'recency',
                'explorerDates.badgePriority': 'time'
            }
        },
        'data-science': {
            id: 'data-science',
            name: 'Data Science',
            description: 'Insight-focused profile for data-heavy projects.',
            targetScenarios: ['Data analysis', 'Research workflows'],
            settings: {
                'explorerDates.enableWorkspaceIntelligence': true,
                'explorerDates.dateDecorationFormat': 'iso-detailed',
                'explorerDates.colorScheme': 'recency',
                'explorerDates.badgePriority': 'time'
            }
        }
    };

    return FALLBACK_PRESET;
}

const PRESET_DEFINITIONS = _getPresetDefinitionsSync();

/**
 * Settings that require extension restart when changed
 */
const RESTART_REQUIRED_SETTINGS = new Set([
    'enableOnboardingSystem',
    'enableAnalysisCommands', 
    'enableExportReporting',
    'enableExtensionApi',
    'enableWorkspaceTemplates',
    'enableAdvancedCache',
    'enableWorkspaceIntelligence',
    'enableIncrementalWorkers',
    'performanceMode',
    'smartFileWatching'
]);

/**
 * Calculates bundle size for a given configuration
 */
function calculateBundleSize(settings) {
    let totalSize = BASE_BUNDLE_SIZE;
    
    // Add chunk sizes for enabled features
    if (settings['explorerDates.enableOnboardingSystem']) totalSize += CHUNK_SIZES.onboarding;
    if (settings['explorerDates.enableAnalysisCommands']) totalSize += CHUNK_SIZES.analysisCommands;
    if (settings['explorerDates.enableExportReporting']) totalSize += CHUNK_SIZES.exportReporting;
    if (settings['explorerDates.enableExtensionApi']) totalSize += CHUNK_SIZES.extensionApi;
    if (settings['explorerDates.enableWorkspaceTemplates']) totalSize += CHUNK_SIZES.workspaceTemplates;
    if (settings['explorerDates.enableAdvancedCache']) totalSize += CHUNK_SIZES.advancedCache;
    if (settings['explorerDates.enableWorkspaceIntelligence']) totalSize += CHUNK_SIZES.workspaceIntelligence;
    if (settings['explorerDates.enableIncrementalWorkers']) totalSize += CHUNK_SIZES.incrementalWorkers;
    
    return totalSize;
}

/**
 * Gets the default preset recommendation based on profile
 */
function getDefaultPresetForProfile(profile) {
    // Try to use the possibly-lazy definitions, otherwise fall back to compact definitions
    const defs = PRESET_DEFINITIONS;
    switch (profile) {
        case 'minimal':
        case 'extreme':
            return defs.minimal || defs['minimal'];
        case 'balanced':
            return defs.balanced || defs['balanced'];
        case 'web-development':
            return defs['web-development'] || defs['web-development'];
        case 'data-science':
            return defs['data-science'] || defs['data-science'];
        case 'enterprise':
            return defs.enterprise || defs['enterprise'];
        default:
            return defs.balanced || defs['balanced'];
    }
}

module.exports = {
    PRESET_DEFINITIONS,
    CHUNK_SIZES,
    BASE_BUNDLE_SIZE,
    RESTART_REQUIRED_SETTINGS,
    calculateBundleSize,
    getDefaultPresetForProfile
};
