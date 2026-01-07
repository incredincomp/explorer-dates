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

const PRESET_DEFINITIONS = {
    'minimal': {
        id: 'minimal',
        name: 'Minimal',
        description: 'Core decorations only, smallest bundle (~99KB)',
        targetBundleSize: BASE_BUNDLE_SIZE,
        settings: {
            'explorerDates.enableOnboardingSystem': false,
            'explorerDates.enableAnalysisCommands': false,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': false,
            'explorerDates.enableAdvancedCache': false,
            'explorerDates.enableWorkspaceIntelligence': false,
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.performanceMode': true,
            'explorerDates.showDateDecorations': true,
            'explorerDates.dateDecorationFormat': 'relative-short'
        },
        targetScenarios: [
            'Resource-constrained environments',
            'Basic file dates only',
            'Large remote workspaces'
        ]
    },
    
    'balanced': {
        id: 'balanced',
        name: 'Balanced',
        description: 'Essential features with optimization (~200KB)',
        targetBundleSize: BASE_BUNDLE_SIZE + CHUNK_SIZES.onboarding + CHUNK_SIZES.workspaceTemplates + CHUNK_SIZES.advancedCache + CHUNK_SIZES.analysisCommands,
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': false,
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.performanceMode': true,
            'explorerDates.smartFileWatching': true
        },
        targetScenarios: [
            'Most development workflows',
            'Remote environments',
            'Medium to large workspaces'
        ]
    },
    
    'web-development': {
        id: 'web-development',
        name: 'Web Development',
        description: 'Optimized for web projects (~240KB)',
        targetBundleSize: BASE_BUNDLE_SIZE + CHUNK_SIZES.onboarding + CHUNK_SIZES.analysisCommands + CHUNK_SIZES.workspaceTemplates + CHUNK_SIZES.advancedCache + CHUNK_SIZES.incrementalWorkers,
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': false,
            'explorerDates.enableIncrementalWorkers': true,
            'explorerDates.showGitInfo': 'author',
            'explorerDates.colorScheme': 'file-type'
        },
        targetScenarios: [
            'JavaScript/TypeScript projects',
            'Node.js development',
            'Frontend frameworks'
        ]
    },
    
    'enterprise': {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full feature set with reporting and API (~380KB)',
        targetBundleSize: Object.values(CHUNK_SIZES).reduce((sum, size) => sum + size, BASE_BUNDLE_SIZE),
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': true,
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': true,
            'explorerDates.enableIncrementalWorkers': true,
            'explorerDates.persistentCache': true,
            'explorerDates.smartExclusions': true
        },
        targetScenarios: [
            'Team lead workflows',
            'Analytics and reporting needs',
            'API integration requirements',
            'Full workspace intelligence'
        ]
    },
    
    'data-science': {
        id: 'data-science',
        name: 'Data Science',
        description: 'Optimized for data workflows (~280KB)',
        targetBundleSize: BASE_BUNDLE_SIZE + CHUNK_SIZES.onboarding + CHUNK_SIZES.analysisCommands + CHUNK_SIZES.exportReporting + CHUNK_SIZES.workspaceIntelligence + CHUNK_SIZES.advancedCache,
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': false,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': true,
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.dateDecorationFormat': 'iso-detailed'
        },
        targetScenarios: [
            'Jupyter notebooks',
            'Python data analysis',
            'Research workflows'
        ]
    }
};

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
    switch (profile) {
        case 'minimal':
        case 'extreme':
            return PRESET_DEFINITIONS.minimal;
        case 'balanced':
            return PRESET_DEFINITIONS.balanced;
        case 'web-development':
            return PRESET_DEFINITIONS['web-development'];
        case 'data-science':
            return PRESET_DEFINITIONS['data-science'];
        case 'enterprise':
            return PRESET_DEFINITIONS.enterprise;
        default:
            return PRESET_DEFINITIONS.balanced;
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
