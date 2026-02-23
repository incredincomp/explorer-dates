const vscode = require('vscode');
const { getLogger } = require('../utils/logger');
const {
    recordCommandRegistration,
    recordCommandInvocation,
    recordCommandResult
} = require('../utils/webDiagnostics');

const logger = getLogger();

/**
 * Registers runtime chunk management commands lazily to avoid pulling heavy
 * runtime managers into this chunk at module-load time. Managers are
 * dynamically imported on-demand when commands are invoked.
 */
function registerRuntimeCommands(context) {
    // Lazy instances
    let runtimeManager = null;
    let teamPersistenceManager = null;
    let managersInitializing = null;

    // Lightweight proxies returned immediately so extension activation doesn't
    // depend on heavy modules to load synchronously
    const runtimeManagerProxy = {
        dispose: () => {
            if (runtimeManager && typeof runtimeManager.dispose === 'function') {
                try { runtimeManager.dispose(); } catch (e) { logger.warn('Error during runtimeManager.dispose proxy', e); }
            }
        }
    };

    const teamPersistenceManagerProxy = {
        dispose: () => {
            if (teamPersistenceManager && typeof teamPersistenceManager.dispose === 'function') {
                try { teamPersistenceManager.dispose(); } catch (e) { logger.warn('Error during teamPersistenceManager.dispose proxy', e); }
            }
        }
    };

    function loadTeamPersistenceModule() {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire !== 'function') {
            return null;
        }
        const candidates = [
            '../chunks/teamPersistence',
            '../chunks/team-persistence-chunk'
        ];
        for (const candidate of candidates) {
            try {
                const mod = dynamicRequire(candidate);
                if (mod) return mod.default || mod;
            } catch {
                // try next candidate
            }
        }
        return null;
    }

    async function ensureManagers() {
        if (managersInitializing) return managersInitializing;
        managersInitializing = (async () => {
            if (!runtimeManager) {
                const heavy = await import('../chunks/runtime-management-heavy.js');
                runtimeManager = new heavy.RuntimeConfigManager(context);
            }
            if (!teamPersistenceManager) {
                const persistence = loadTeamPersistenceModule();
                if (persistence?.createTeamPersistenceManager) {
                    teamPersistenceManager = persistence.createTeamPersistenceManager(context);
                } else if (persistence?.TeamConfigPersistenceManager) {
                    teamPersistenceManager = new persistence.TeamConfigPersistenceManager(context);
                } else {
                    const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
                    if (typeof dynamicRequire === 'function') {
                        const mod = dynamicRequire('../teamConfigPersistence.proxy');
                        teamPersistenceManager = new mod.TeamConfigPersistenceManager(context);
                    }
                }
            }
        })();
        return managersInitializing;
    }

    const registerCommand = (commandId, handler) => {
        recordCommandRegistration(commandId);
        return vscode.commands.registerCommand(commandId, async (...args) => {
            recordCommandInvocation(commandId);
            try {
                const result = await handler(...args);
                recordCommandResult(commandId, true);
                return result;
            } catch (error) {
                recordCommandResult(commandId, false, error);
                throw error;
            }
        });
    };

    const commands = [
        // Apply preset configuration
        registerCommand('explorerDates.applyPreset', async () => {
            try {
                await ensureManagers();
                await runtimeManager.showAllPresets();
            } catch (error) {
                logger.error('Apply preset command failed:', error);
                vscode.window.showErrorMessage(`Failed to apply preset: ${error.message}`);
            }
        }),

        // Restore previous preset from backup
        registerCommand('explorerDates.restorePreviousPreset', async () => {
            try {
                await ensureManagers();
                const result = await runtimeManager.restorePreviousPreset();
                if (!result.restored) {
                    logger.info('No preset backup available to restore');
                }
            } catch (error) {
                logger.error('Restore previous preset command failed:', error);
                vscode.window.showErrorMessage(`Failed to restore previous preset: ${error.message}`);
            }
        }),
        
        // Show runtime configuration optimizer
        registerCommand('explorerDates.configureRuntime', async () => {
            try {
                await ensureManagers();
                const state = await runtimeManager.getCurrentRuntimeState();
                await runtimeManager.showPresetComparison(state.currentSettings);
            } catch (error) {
                logger.error('Configure runtime command failed:', error);
                vscode.window.showErrorMessage(`Failed to show runtime configuration: ${error.message}`);
            }
        }),
        
        // Suggest optimal preset for current workspace
        registerCommand('explorerDates.suggestOptimalPreset', async () => {
            try {
                await ensureManagers();
                await runtimeManager.checkAutoSuggestion();
            } catch (error) {
                logger.error('Suggest optimal preset command failed:', error);
                vscode.window.showErrorMessage(`Failed to suggest preset: ${error.message}`);
            }
        }),
        
        // Show current chunk status
        registerCommand('explorerDates.showChunkStatus', async () => {
            try {
                await ensureManagers();
                const state = await runtimeManager.getCurrentRuntimeState();
                await showChunkStatusQuickPick(state);
            } catch (error) {
                // Fallback: runtime manager chunks may be unavailable in lightweight
                // test or runtime environments — show chunk status using config only.
                logger.warn('Show chunk status: runtime managers unavailable, using fallback state', error);
                try {
                    const cfg = vscode.workspace.getConfiguration('explorerDates');
                    // Compute an approximate bundle size: base (99KB) + sum of enabled chunk sizes
                    const chunkSizes = [34,23,17,15,14,28,31,19];
                    const chunkKeys = ['enableOnboardingSystem','enableAnalysisCommands','enableExportReporting','enableExtensionApi','enableWorkspaceTemplates','enableAdvancedCache','enableWorkspaceIntelligence','enableIncrementalWorkers'];
                    const enabledSum = chunkKeys.reduce((acc, k, i) => acc + (cfg.get(k, true) ? chunkSizes[i] : 0), 0);
                    const fallbackState = { currentBundleSize: 99 + enabledSum };
                    await showChunkStatusQuickPick(fallbackState);
                } catch (fallbackErr) {
                    logger.error('Show chunk status fallback failed:', fallbackErr);
                    vscode.window.showErrorMessage(`Failed to show chunk status: ${fallbackErr.message}`);
                }
            }
        }),
        
        // Optimize bundle size
        registerCommand('explorerDates.optimizeBundle', async () => {
            try {
                await ensureManagers();
                const state = await runtimeManager.getCurrentRuntimeState();
                
                if (state.analysis) {
                    const recommendedProfile = await determineOptimalProfile(state.analysis);
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
        registerCommand('explorerDates.validateTeamConfig', async () => {
            try {
                await ensureManagers();
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
    
    return { runtimeManager: runtimeManagerProxy, teamPersistenceManager: teamPersistenceManagerProxy };
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
async function determineOptimalProfile(analysis) {
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
    
    // Dynamically import preset definitions to avoid bundling them with runtime commands
    const pd = await import('../presetDefinitions.js');
    const PRESET_DEFINITIONS = pd.PRESET_DEFINITIONS;
    return PRESET_DEFINITIONS[presetId] || PRESET_DEFINITIONS.balanced;
}

module.exports = { registerRuntimeCommands };
