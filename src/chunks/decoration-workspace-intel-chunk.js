const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
const featureFlags = getFeatureFlagsGlobal();

async function initializeWorkspaceIntelligence(provider, context) {
    try {
        const workspaceIntelligenceModule = await featureFlags.workspaceIntelligence();
        if (workspaceIntelligenceModule) {
            try {
                let WorkspaceIntelligenceManager = workspaceIntelligenceModule.WorkspaceIntelligenceManager || workspaceIntelligenceModule.default?.WorkspaceIntelligenceManager || workspaceIntelligenceModule;
                if (typeof WorkspaceIntelligenceManager === 'function') {
                    provider['_workspaceIntelligence'] = new WorkspaceIntelligenceManager(provider['_fileSystem']);
                    await provider['_workspaceIntelligence'].initialize({
                        batchProcessor: provider['_batchProcessor'],
                        extensionContext: context,
                        enableProgressiveAnalysis: provider['_shouldEnableProgressiveAnalysis']?.()
                    });

                    const workspaceFolders = require('vscode').workspace.workspaceFolders;
                    if (workspaceFolders?.length) {
                        await provider['_workspaceIntelligence'].analyzeWorkspace(workspaceFolders, {
                            maxFiles: provider['_getIndexerMaxFiles']()
                        });
                    }

                    await provider['_workspaceIntelligence'].cleanupWorkspaceProfiles();

                    provider['_logger']?.info?.('Workspace intelligence initialized');
                    return provider['_workspaceIntelligence'];
                } else {
                    provider['_logger']?.warn?.('WorkspaceIntelligenceManager not found in chunk, disabling workspace intelligence');
                    provider['_workspaceIntelligence'] = null;
                    return null;
                }
            } catch (error) {
                provider['_logger']?.warn?.('Failed to initialize workspace intelligence:', error.message);
                provider['_workspaceIntelligence'] = null;
                return null;
            }
        }
        provider['_logger']?.info?.('Workspace intelligence disabled by feature flag');
        provider['_workspaceIntelligence'] = null;
        return null;
    } catch (error) {
        provider['_logger']?.error?.('initializeWorkspaceIntelligence failed', error);
        provider['_workspaceIntelligence'] = null;
        return null;
    }
}

module.exports = { initializeWorkspaceIntelligence };
