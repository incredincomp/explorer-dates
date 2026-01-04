const vscode = require('vscode');
const { getLogger } = require('../utils/logger');
const { RuntimeConfigManager } = require('../runtimeConfigManager');
const { TeamConfigPersistenceManager } = require('../teamConfigPersistence');

const logger = getLogger();

/**
 * Registers runtime chunk management commands
 */
function registerRuntimeCommands(context) {
    const runtimeManager = new RuntimeConfigManager(context);
    const teamPersistenceManager = new TeamConfigPersistenceManager(context);
    
    const commands = [
        // Apply preset configuration
        vscode.commands.registerCommand('explorerDates.applyPreset', async () => {
            try {
                await runtimeManager.showAllPresets();
            } catch (error) {
                logger.error('Apply preset command failed:', error);
                vscode.window.showErrorMessage(`Failed to apply preset: ${error.message}`);
            }
        }),
        
        // Show runtime configuration optimizer
        vscode.commands.registerCommand('explorerDates.configureRuntime', async () => {
            try {
                const state = await runtimeManager.getCurrentRuntimeState();
                await runtimeManager.showPresetComparison(state.currentSettings);
            } catch (error) {
                logger.error('Configure runtime command failed:', error);
                vscode.window.showErrorMessage(`Failed to show runtime configuration: ${error.message}`);
            }
        }),
        
        // Suggest optimal preset for current workspace
        vscode.commands.registerCommand('explorerDates.suggestOptimalPreset', async () => {
            try {
                await runtimeManager.checkAutoSuggestion();
            } catch (error) {
                logger.error('Suggest optimal preset command failed:', error);
                vscode.window.showErrorMessage(`Failed to suggest preset: ${error.message}`);
            }
        }),
        
        // Show current chunk status
        vscode.commands.registerCommand('explorerDates.showChunkStatus', async () => {
            try {
                const state = await runtimeManager.getCurrentRuntimeState();
                await showChunkStatusQuickPick(state);
            } catch (error) {
                logger.error('Show chunk status command failed:', error);
                vscode.window.showErrorMessage(`Failed to show chunk status: ${error.message}`);
            }
        }),
        
        // Optimize bundle size
        vscode.commands.registerCommand('explorerDates.optimizeBundle', async () => {
            try {
                const state = await runtimeManager.getCurrentRuntimeState();
                
                if (state.analysis) {
                    const recommendedProfile = determineOptimalProfile(state.analysis);
                    await runtimeManager.showPresetComparison(state.currentSettings, recommendedProfile);
                } else {
                    await runtimeManager.showAllPresets();
                }
            } catch (error) {
                logger.error('Optimize bundle command failed:', error);
                vscode.window.showErrorMessage(`Failed to optimize bundle: ${error.message}`);
            }
        }),
        
        // Team configuration validation
        vscode.commands.registerCommand('explorerDates.validateTeamConfig', async () => {
            try {
                const validation = await teamPersistenceManager.validateTeamConfiguration();
                
                if (validation.hasTeamConfig) {
                    const conflictText = validation.conflicts.length > 0 
                        ? `Found ${validation.conflicts.length} conflicts.`
                        : 'No conflicts detected.';
                    
                    vscode.window.showInformationMessage(
                        `Team configuration validated. ${conflictText}`
                    );
                } else {
                    vscode.window.showInformationMessage('No team configuration found in workspace.');
                }
            } catch (error) {
                logger.error('Validate team config command failed:', error);
                vscode.window.showErrorMessage(`Failed to validate team configuration: ${error.message}`);
            }
        })
    ];
    
    // Register all commands
    commands.forEach(command => context.subscriptions.push(command));
    
    logger.info('Runtime management commands registered');
    
    return { runtimeManager, teamPersistenceManager };
}

/**
 * Shows chunk status in QuickPick format
 */
async function showChunkStatusQuickPick(state) {
    const config = vscode.workspace.getConfiguration('explorerDates');
    
    const chunkInfo = [
        { name: 'Onboarding System', key: 'enableOnboardingSystem', size: 34 },
        { name: 'Analysis Commands', key: 'enableAnalysisCommands', size: 23 },
        { name: 'Export Reporting', key: 'enableExportReporting', size: 17 },
        { name: 'Extension API', key: 'enableExtensionApi', size: 15 },
        { name: 'Workspace Templates', key: 'enableWorkspaceTemplates', size: 14 },
        { name: 'Advanced Cache', key: 'enableAdvancedCache', size: 28 },
        { name: 'Workspace Intelligence', key: 'enableWorkspaceIntelligence', size: 31 },
        { name: 'Incremental Workers', key: 'enableIncrementalWorkers', size: 19 }
    ];
    
    const items = chunkInfo.map(chunk => {
        const isEnabled = config.get(chunk.key, true);
        const statusIcon = isEnabled ? '✅' : '❌';
        const statusText = isEnabled ? 'Enabled' : 'Disabled';
        
        return {
            label: `${statusIcon} ${chunk.name}`,
            description: `${chunk.size}KB | ${statusText}`,
            detail: getChunkDescription(chunk.key)
        };
    });
    
    // Add summary item
    items.unshift({
        label: '📊 Bundle Summary',
        description: `Total: ${state.currentBundleSize}KB`,
        detail: `Base bundle: 99KB + ${state.currentBundleSize - 99}KB chunks`
    });
    
    await vscode.window.showQuickPick(items, {
        placeHolder: 'Current chunk status',
        ignoreFocusOut: true
    });
}

/**
 * Gets description for a chunk
 */
function getChunkDescription(chunkKey) {
    const descriptions = {
        enableOnboardingSystem: 'Welcome messages and guided setup',
        enableAnalysisCommands: 'Advanced file analysis and metrics',
        enableExportReporting: 'CSV/JSON export and reporting features',
        enableExtensionApi: 'Public API for other extensions',
        enableWorkspaceTemplates: 'Project templates and scaffolding',
        enableAdvancedCache: 'Intelligent caching and performance',
        enableWorkspaceIntelligence: 'Smart workspace analysis and insights',
        enableIncrementalWorkers: 'Background processing and optimization'
    };
    
    return descriptions[chunkKey] || 'Explorer Dates feature chunk';
}

/**
 * Determines optimal profile based on workspace analysis
 */
function determineOptimalProfile(analysis) {
    if (!analysis) return null;
    
    const { workspaceSize, isRemoteEnvironment } = analysis;
    
    let presetId;
    if (workspaceSize === 'extreme' || (workspaceSize === 'large' && isRemoteEnvironment)) {
        presetId = 'minimal';
    } else if (workspaceSize === 'large' || isRemoteEnvironment) {
        presetId = 'balanced';
    } else {
        presetId = 'enterprise';  // Use full enterprise preset for small local workspaces
    }
    
    // Import preset definitions to return full preset object
    const { PRESET_DEFINITIONS } = require('../presetDefinitions');
    return PRESET_DEFINITIONS[presetId] || PRESET_DEFINITIONS.balanced;
}

module.exports = { registerRuntimeCommands };