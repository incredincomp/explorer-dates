// Heavy preset definitions moved to a lazy chunk to avoid duplicating large static data
const PRESET_DEFINITIONS = {
    'minimal': {
        id: 'minimal',
        name: 'Minimal',
        description: 'Core decorations only, smallest bundle (~99KB)',
        targetBundleSize: 99,
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
        targetBundleSize: 99 + 34 + 14 + 28 + 23,
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': false,
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.performanceMode': false,
            'explorerDates.smartFileWatching': true,
            'explorerDates.dateDecorationFormat': 'smart',
            'explorerDates.colorScheme': 'recency',
            'explorerDates.badgePriority': 'time'
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
        targetBundleSize: 99 + 34 + 23 + 14 + 28 + 19,
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
            'explorerDates.colorScheme': 'file-type',
            'explorerDates.dateDecorationFormat': 'smart',
            'explorerDates.badgePriority': 'time'
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
        targetBundleSize: Object.values({onboarding:34,analysisCommands:23,exportReporting:17,extensionApi:15,workspaceTemplates:14,advancedCache:28,workspaceIntelligence:31,incrementalWorkers:19}).reduce((s,v)=>s+v,99),
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
            'explorerDates.smartExclusions': true,
            'explorerDates.dateDecorationFormat': 'smart',
            'explorerDates.colorScheme': 'recency',
            'explorerDates.badgePriority': 'time'
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
        targetBundleSize: 99 + 34 + 23 + 17 + 31 + 28,
        settings: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': false,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': true,
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.dateDecorationFormat': 'iso-detailed',
            'explorerDates.colorScheme': 'recency',
            'explorerDates.badgePriority': 'time'
        },
        targetScenarios: [
            'Jupyter notebooks',
            'Python data analysis',
            'Research workflows'
        ]
    }
};

module.exports = { PRESET_DEFINITIONS };
