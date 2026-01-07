const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { generateWorkspaceKey, detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('./utils/workspaceDetection');
const { PRESET_DEFINITIONS, calculateBundleSize, getDefaultPresetForProfile, RESTART_REQUIRED_SETTINGS } = require('./presetDefinitions');
const { getSettingsCoordinator } = require('./utils/settingsCoordinator');
const { WORKSPACE_SCALE_LARGE_THRESHOLD, WORKSPACE_SCALE_EXTREME_THRESHOLD } = require('./constants');

const logger = getLogger();

/**
 * Manages runtime chunk configuration with auto-suggestions and restart coordination
 */
class RuntimeConfigManager {
    constructor(context) {
        this._context = context;
        this._globalState = context.globalState;
        this._configWatcher = null;
        this._restartDebounceTimer = null;
        this._pendingRestartKey = 'explorerDates.pendingRestart';
        this._suggestionHistoryKey = 'explorerDates.suggestionHistory';
        this._presetBackupKey = 'explorerDates.presetBackup';
        this._lastPresetKey = 'explorerDates.lastPreset';
        this._settings = getSettingsCoordinator();
        
        this._setupConfigurationWatcher();
        logger.info('Runtime configuration manager initialized');
    }
    
    /**
     * Gets current runtime state for the workspace
     */
    async getCurrentRuntimeState() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const currentSettings = this._extractSettings(config);
        const currentBundleSize = this._calculateCurrentBundleSize(null, currentSettings);
        
        const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        return {
            currentSettings,
            currentBundleSize,
            analysis,
            availablePresets: Object.keys(PRESET_DEFINITIONS),
            pendingRestart: this._globalState.get(this._pendingRestartKey, []),
            timestamp: Date.now()
        };
    }
    
    /**
     * Auto-suggestion with workspace-specific cadence tracking
     * Suggests once per workspace unless heuristics change drastically
     */
    async checkAutoSuggestion() {
        try {
            const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (!workspaceUri) return;
            
            const currentProfile = await detectWorkspaceProfile(workspaceUri);
            const workspaceKey = generateWorkspaceKey(workspaceUri, currentProfile);
            
            const suggestionHistory = this._globalState.get(this._suggestionHistoryKey, {});
            const lastSuggestion = suggestionHistory[workspaceKey];
            
            // Check if suggestion needed based on profile change or first time
            const shouldSuggest = !lastSuggestion || 
                lastSuggestion.profileDetected !== currentProfile ||
                await this._hasHeuristicsChanged(lastSuggestion);
            
            if (shouldSuggest) {
                const suggested = await this._showAutoSuggestion(currentProfile);
                if (suggested) {
                    // Update suggestion history
                    const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
                    suggestionHistory[workspaceKey] = {
                        profileDetected: currentProfile,
                        suggestedAt: Date.now(),
                        fileCountAtSuggestion: analysis?.fileCount || 0,
                        accepted: suggested.accepted,
                        presetId: suggested.preset
                    };
                    await this._globalState.update(this._suggestionHistoryKey, suggestionHistory);
                    logger.info('Auto-suggestion updated:', suggestionHistory[workspaceKey]);
                }
            }
        } catch (error) {
            logger.error('Auto-suggestion check failed:', error);
        }
    }
    
    /**
     * Shows auto-suggestion dialog with preset recommendations
     */
    async _showAutoSuggestion(detectedProfile) {
        const currentSettings = this._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        const recommendedPreset = getDefaultPresetForProfile(detectedProfile);
        const currentBundleSize = this._calculateCurrentBundleSize(null, currentSettings);
        const recommendedBundleSize = recommendedPreset
            ? this._calculateCurrentBundleSize(recommendedPreset.settings, currentSettings)
            : currentBundleSize;
        const savings = currentBundleSize - recommendedBundleSize;
        
        if (savings <= 10) {
            // Don't suggest if savings are minimal
            return { accepted: false, preset: detectedProfile, reason: 'minimal savings' };
        }
        
        const message = `Explorer Dates detected a ${detectedProfile} workspace. ` +
            `Would you like to apply ${recommendedPreset.name} settings? This could save ~${savings}KB.`;
        
        const action = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            'Apply Settings',
            'Show Details',
            'Not Now'
        );
        
        switch (action) {
            case 'Apply Settings':
                await this._applyPreset(recommendedPreset.id, recommendedPreset);
                return { accepted: true, preset: detectedProfile };
            case 'Show Details':
                await this.showPresetComparison(currentSettings, recommendedPreset);
                return { accepted: false, preset: detectedProfile };
            default:
                return { accepted: false, preset: detectedProfile };
        }
    }
    
    /**
     * Applies a preset configuration
     */
    async _applyPreset(presetId, presetDefinition = null) {
        const preset = presetDefinition || PRESET_DEFINITIONS[presetId];
        if (!preset) {
            throw new Error(`Unknown preset: ${presetId}`);
        }
        
        const currentSettings = this._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        await this._savePresetBackup(presetId, currentSettings);
        
        let applied;
        try {
            applied = await this._settings.applySettings(preset.settings, {
                scope: 'workspace',
                reason: `apply-preset:${presetId}`
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply "${preset.name}" preset: ${error.message}`);
            logger.error(`Preset application failed for ${presetId}:`, error);
            throw error;
        }
        const changedSettings = applied
            .filter(result => result.updated)
            .map(result => result.key.replace('explorerDates.', ''));
        
        if (changedSettings.length > 0) {
            this._queueRestartPrompt(changedSettings);
            logger.info(`Applied ${preset.name} preset`, { changedSettings });
        }
        
        return {
            applied: changedSettings.length,
            preset,
            requiresRestart: changedSettings.some(key => RESTART_REQUIRED_SETTINGS.has(key)),
            estimatedBundleSize: this._calculateCurrentBundleSize()
        };
    }

    /**
     * Restores the previously applied preset from backup
     */
    async restorePreviousPreset(options = {}) {
        const backup = this._globalState.get(this._presetBackupKey, null);
        if (!backup?.settings) {
            if (!options.silent) {
                vscode.window.showInformationMessage('No previous preset available to restore.');
            }
            return { restored: false, reason: 'no-backup' };
        }

        let applied;
        try {
            applied = await this._settings.applySettings(backup.settings, {
                scope: 'workspace',
                reason: 'restore-previous-preset'
            });
        } catch (error) {
            if (!options.silent) {
                vscode.window.showErrorMessage(`Failed to restore previous preset: ${error.message}`);
            }
            logger.error('Preset rollback failed:', error);
            throw error;
        }

        const changedSettings = applied
            .filter(result => result.updated)
            .map(result => result.key.replace('explorerDates.', ''));

        await this._globalState.update(this._pendingRestartKey, []);
        await this._globalState.update(this._presetBackupKey, null);
        await this._globalState.update(this._lastPresetKey, backup.previousPreset || null);

        if (!options.silent) {
            vscode.window.showInformationMessage('Previous preset restored.');
        }

        return {
            restored: true,
            changedSettings,
            restoredPreset: backup.previousPreset || 'unknown'
        };
    }
    
    /**
     * Shows preset comparison with QuickPick interface
     */
    async showPresetComparison(currentSettings, recommendedPreset) {
        const baseSettings = currentSettings || this._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        const currentSize = this._calculateCurrentBundleSize(null, baseSettings);
        const recommendedSize = recommendedPreset
            ? this._calculateCurrentBundleSize(recommendedPreset.settings, baseSettings)
            : currentSize;
        const savings = currentSize - recommendedSize;
        
        const presetItems = [
            {
                label: `📦 Current Configuration`,
                description: `Bundle: ${currentSize}KB total`,
                detail: this._formatConfigDetails(baseSettings),
                action: 'current'
            },
            recommendedPreset ? {
                label: `⚡ Recommended: ${recommendedPreset.name}`,
                description: `Bundle: ${recommendedSize}KB total (saves ${Math.max(0, savings)}KB)`,
                detail: this._formatConfigDetails(recommendedPreset.settings),
                action: 'apply',
                preset: recommendedPreset
            } : null,
            {
                label: `🔧 Browse All Presets...`,
                description: `Choose from ${Object.keys(PRESET_DEFINITIONS).length} available presets`,
                detail: 'Minimal, Balanced, Web Development, Enterprise, Data Science',
                action: 'browse'
            }
        ].filter(Boolean);
        
        const selected = await vscode.window.showQuickPick(presetItems, {
            placeHolder: 'Choose configuration approach',
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (!selected) return;
        
        switch (selected.action) {
            case 'apply':
                if (selected.preset) {
                    await this._applyPreset(selected.preset.id, selected.preset);
                }
                break;
            case 'browse':
                await this.showAllPresets();
                break;
        }
    }
    
    /**
     * Shows all available presets
     */
    async showAllPresets() {
        const baseSettings = this._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        const currentSize = this._calculateCurrentBundleSize(null, baseSettings);
        
        const presetItems = Object.values(PRESET_DEFINITIONS).map(preset => {
            const presetSize = this._calculateCurrentBundleSize(preset.settings, baseSettings);
            const savings = currentSize - presetSize;
            const savingsText = savings > 0 ? `saves ${savings}KB` : savings < 0 ? `adds ${Math.abs(savings)}KB` : 'same size';
            
            return {
                label: `${preset.name}`,
                description: `${presetSize}KB (${savingsText})`,
                detail: `${preset.description} - ${preset.targetScenarios.join(', ')}`,
                preset
            };
        });
        
        const selected = await vscode.window.showQuickPick(presetItems, {
            placeHolder: 'Select a preset configuration',
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (selected?.preset) {
            const confirmed = await vscode.window.showInformationMessage(
                `Apply "${selected.preset.name}" preset?\n${selected.preset.description}`,
                { modal: false },
                'Apply',
                'Cancel'
            );
            
            if (confirmed === 'Apply') {
                await this._applyPreset(selected.preset.id, selected.preset);
            }
        }
    }
    
    /**
     * Sets up configuration watching for restart detection
     */
    _setupConfigurationWatcher() {
        this._configWatcher = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('explorerDates')) {
                this._handleConfigurationChange(event);
            }
        });
    }
    
    /**
     * Handles configuration changes and queues restart prompts
     */
    async _handleConfigurationChange(changeEvent) {
        const changedRestartSettings = Array.from(RESTART_REQUIRED_SETTINGS)
            .filter(setting => changeEvent.affectsConfiguration(`explorerDates.${setting}`));
            
        if (changedRestartSettings.length > 0) {
            this._queueRestartPrompt(changedRestartSettings);
        }
    }
    
    /**
     * Queues restart prompt with debouncing to batch multiple changes
     */
    _queueRestartPrompt(settingKeys) {
        // Add to pending restart list
        const pending = this._globalState.get(this._pendingRestartKey, []);
        const newPending = [...new Set([...pending, ...settingKeys])];
        this._globalState.update(this._pendingRestartKey, newPending);
        
        // Debounce restart prompt (2-second delay to batch multiple changes)
        if (this._restartDebounceTimer) {
            clearTimeout(this._restartDebounceTimer);
        }
        
        this._restartDebounceTimer = setTimeout(async () => {
            await this._showBatchedRestartPrompt();
            this._restartDebounceTimer = null;
        }, 2000);
    }
    
    /**
     * Shows consolidated restart prompt for all pending chunk changes
     */
    async _showBatchedRestartPrompt() {
        const pendingChunks = this._globalState.get(this._pendingRestartKey, []);
        if (pendingChunks.length === 0) return;
        
        const chunkNames = pendingChunks.map(chunk => this._formatChunkName(chunk)).join(', ');
        const settingsText = pendingChunks.length === 1 
            ? `"${chunkNames}"`
            : `${pendingChunks.length} settings (${chunkNames})`;
            
        const message = `${settingsText} changed. Reload to apply chunk optimizations?`;
        
        const action = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            'Reload Now',
            'Reload Later'
        );
        
        if (action === 'Reload Now') {
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
        
        // Clear pending restarts regardless of action
        await this._globalState.update(this._pendingRestartKey, []);
    }
    
    /**
     * Helper methods
     */
    async _savePresetBackup(appliedPresetId, previousSettings = {}) {
        if (!this._globalState || typeof this._globalState.update !== 'function') {
            return;
        }
        const previousPreset = this._globalState.get(this._lastPresetKey, null);
        const previousBackup = this._globalState.get(this._presetBackupKey, null);
        const previousTimestampValue = previousBackup?.timestamp ? Date.parse(previousBackup.timestamp) : null;
        const nextTimestampValue = Number.isFinite(previousTimestampValue)
            ? Math.max(Date.now(), previousTimestampValue + 1)
            : Date.now();
        const payload = {
            timestamp: new Date(nextTimestampValue).toISOString(),
            appliedPreset: appliedPresetId,
            previousPreset: previousPreset || 'unknown',
            settings: { ...previousSettings }
        };
        await this._globalState.update(this._presetBackupKey, payload);
        await this._globalState.update(this._lastPresetKey, appliedPresetId);
    }
    
    _calculateCurrentBundleSize(overrides = null, baseSettings = null) {
        const sourceSettings = baseSettings
            ? { ...baseSettings }
            : this._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        
        if (overrides && typeof overrides === 'object') {
            Object.assign(sourceSettings, overrides);
        }
        
        return calculateBundleSize(sourceSettings);
    }
    
    _extractSettings(config) {
        // Define proper defaults for each setting to match package.json
        const settingDefaults = {
            enableOnboardingSystem: true,
            enableAnalysisCommands: true,
            enableExportReporting: true,
            enableExtensionApi: true,
            enableWorkspaceTemplates: true,
            enableAdvancedCache: true,
            enableWorkspaceIntelligence: true,
            enableIncrementalWorkers: false  // This defaults to false in package.json
        };
        
        const settings = {};
        for (const [key, defaultValue] of Object.entries(settingDefaults)) {
            settings[`explorerDates.${key}`] = config.get(key, defaultValue);
        }
        
        return settings;
    }
    
    _formatConfigDetails(settings) {
        const enabled = Object.entries(settings)
            .filter(([key, value]) => value === true && key.includes('enable'))
            .map(([key]) => key.replace('explorerDates.enable', '').replace('System', ''))
            .slice(0, 3);
        
        const more = Math.max(0, Object.keys(settings).length - 3);
        const suffix = more > 0 ? ` +${more} more` : '';
        
        return `Features: ${enabled.join(', ')}${suffix}`;
    }
    
    _formatChunkName(settingKey) {
        return settingKey.replace('enable', '').replace(/([A-Z])/g, ' $1').trim();
    }
    
    async _hasHeuristicsChanged(lastSuggestion) {
        if (!lastSuggestion) return true;
        
        try {
            const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
            const currentAnalysis = await analyzeWorkspaceEnvironment(workspaceUri);
            if (!currentAnalysis) return false;
            
            const lastFileCount = lastSuggestion.fileCountAtSuggestion || 0;
            const currentFileCount = currentAnalysis.fileCount;
            
            // Trigger re-suggestion if file count crosses major thresholds
            const lastTier = this._getFileCountTier(lastFileCount);
            const currentTier = this._getFileCountTier(currentFileCount);
            
            return lastTier !== currentTier;
        } catch (error) {
            logger.debug('Heuristics change check failed:', error);
            return false;
        }
    }
    
    _getFileCountTier(fileCount) {
        if (fileCount >= WORKSPACE_SCALE_EXTREME_THRESHOLD) return 'extreme';
        if (fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD) return 'large';
        if (fileCount >= 1000) return 'medium';
        return 'small';
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this._configWatcher) {
            this._configWatcher.dispose();
        }
        if (this._restartDebounceTimer) {
            clearTimeout(this._restartDebounceTimer);
        }
    }
}

module.exports = { RuntimeConfigManager };
