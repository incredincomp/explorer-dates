/**
 * Settings Migration and Validation System
 * Handles automatic migration of deprecated settings and configuration validation
 */
const vscode = require('vscode');
const { getLogger } = require('./logger');
const { getSettingsCoordinator } = require('./settingsCoordinator');
const { SettingsOrganizer } = require('./settingsOrganizer');

class SettingsMigrationManager {
    constructor() {
        this._logger = getLogger();
        this._migratedSettings = new Set();
        this._settings = getSettingsCoordinator();
        this._organizer = null;
        this._organizerContext = null;
    }

    /**
     * Perform all necessary settings migrations
     * @param {vscode.ExtensionContext} context 
     */
    async migrateAllSettings(context) {
        const migrations = [
            () => this.migrateReportingSettings(),
            () => this.migrateCustomColorSettings(),
            () => this.validateFeatureFlags(),
            () => this.cleanupDeprecatedSettings(),
            () => this.trackMigrationMetrics(context)
        ];

        const results = [];
        for (const migration of migrations) {
            try {
                const result = await migration();
                if (result) results.push(result);
            } catch (error) {
                this._logger.error('Settings migration failed:', error);
            }
        }

        if (results.length > 0) {
            this._logger.info('Settings migration completed', { migratedSettings: results });
            this._showMigrationNotification(results);
        }

        return results;
    }

    /**
     * Migrate enableReporting to enableExportReporting
     */
    async migrateReportingSettings() {
        const legacy = this._settings.inspect('enableReporting');
        const current = this._settings.inspect('enableExportReporting');

        // Check if legacy setting exists and new setting doesn't have a user-defined value
        if (legacy?.globalValue !== undefined && current?.globalValue === undefined) {
            try {
                await this._settings.updateSetting('enableExportReporting', legacy.globalValue, {
                    scope: 'user',
                    reason: 'migrate-enableReporting-global'
                });
                this._migratedSettings.add('enableReporting→enableExportReporting (Global)');
                this._logger.info('Migrated global enableReporting to enableExportReporting', { 
                    oldValue: legacy.globalValue 
                });
            } catch (error) {
                this._logger.error('Failed to migrate global enableReporting setting', error);
            }
        }

        // Also handle workspace-level settings
        if (legacy?.workspaceValue !== undefined && current?.workspaceValue === undefined) {
            try {
                await this._settings.updateSetting('enableExportReporting', legacy.workspaceValue, {
                    scope: 'workspace',
                    reason: 'migrate-enableReporting-workspace'
                });
                this._migratedSettings.add('enableReporting→enableExportReporting (Workspace)');
                this._logger.info('Migrated workspace enableReporting to enableExportReporting', { 
                    oldValue: legacy.workspaceValue 
                });
            } catch (error) {
                this._logger.error('Failed to migrate workspace enableReporting setting', error);
            }
        }

        if (legacy?.workspaceFolderValue !== undefined && current?.workspaceFolderValue === undefined) {
            try {
                await this._settings.updateSetting('enableExportReporting', legacy.workspaceFolderValue, {
                    scope: 'workspaceFolder',
                    reason: 'migrate-enableReporting-folder'
                });
                this._migratedSettings.add('enableReporting→enableExportReporting (WorkspaceFolder)');
                this._logger.info('Migrated workspace folder enableReporting to enableExportReporting', {
                    oldValue: legacy.workspaceFolderValue
                });
            } catch (error) {
                this._logger.error('Failed to migrate workspace folder enableReporting setting', error);
            }
        }

        return (
            this._migratedSettings.has('enableReporting→enableExportReporting (Global)') || 
            this._migratedSettings.has('enableReporting→enableExportReporting (Workspace)') ||
            this._migratedSettings.has('enableReporting→enableExportReporting (WorkspaceFolder)')
        );
    }

    /**
     * Migrate deprecated customColors setting to workbench.colorCustomizations
     */
    async migrateCustomColorSettings() {
        const explorerConfig = vscode.workspace.getConfiguration('explorerDates');
        const legacyColors = explorerConfig.get('customColors');
        
        if (!legacyColors || typeof legacyColors !== 'object') {
            return false;
        }

        // Check if workbench colors are already configured
        const colorCustomizations = this._settings.getValue('workbench.colorCustomizations') || {};
        
        const hasExplorerColors = colorCustomizations['explorerDates.customColor.veryRecent'] !== undefined ||
                                 colorCustomizations['explorerDates.customColor.recent'] !== undefined ||
                                 colorCustomizations['explorerDates.customColor.old'] !== undefined;

        if (hasExplorerColors) {
            // Already migrated or user has custom setup
            return false;
        }

        // Migrate to new format
        const newColors = {
            ...colorCustomizations,
            'explorerDates.customColor.veryRecent': legacyColors.veryRecent || '#00ff00',
            'explorerDates.customColor.recent': legacyColors.recent || '#ffff00',
            'explorerDates.customColor.old': legacyColors.old || '#ff0000'
        };

        try {
            await this._settings.updateSetting('workbench.colorCustomizations', newColors, {
                scope: 'user',
                reason: 'migrate-customColors'
            });
            this._migratedSettings.add('customColors→workbench.colorCustomizations');
            this._logger.info('Migrated custom colors to workbench.colorCustomizations', { 
                oldColors: legacyColors,
                newColors: newColors 
            });
            return true;
        } catch (error) {
            this._logger.error('Failed to migrate custom colors', error);
            return false;
        }
    }

    /**
     * Validate and potentially fix feature flag settings
     */
    async validateFeatureFlags() {
        const flagsToValidate = {
            enableOnboardingSystem: { default: true, type: 'boolean' },
            enableExportReporting: { default: true, type: 'boolean' },
            enableAnalysisCommands: { default: true, type: 'boolean' },
            enableAdvancedCache: { default: true, type: 'boolean' },
            enableWorkspaceIntelligence: { default: true, type: 'boolean' },
            enableWorkspaceTemplates: { default: true, type: 'boolean' },
            enableExtensionApi: { default: true, type: 'boolean' },
            enableProgressiveAnalysis: { default: null, type: 'boolean', allowNull: true }
        };

        let hasIssues = false;
        const fixes = [];
        const untouchedDefaults = [];

        for (const [flag, spec] of Object.entries(flagsToValidate)) {
            const inspected = this._settings.inspect(flag);
            const currentValue = this._settings.getValue(flag);
            
            // Check if setting exists at user or workspace level
            const hasUserValue = inspected?.globalValue !== undefined;
            const hasWorkspaceValue = inspected?.workspaceValue !== undefined;
            
            if (!hasUserValue && !hasWorkspaceValue) {
                // Setting doesn't exist - rely on VS Code defaults to avoid cluttering settings.json
                untouchedDefaults.push(flag);
            } else if (currentValue !== undefined) {
                // Setting exists - validate type
                const isValidType = spec.allowNull && currentValue === null 
                    ? true 
                    : typeof currentValue === spec.type;
                
                if (!isValidType) {
                    // Type mismatch - fix it
                    try {
                        await this._settings.updateSetting(flag, spec.default, {
                            scope: 'user',
                            reason: `feature-flag-validation:${flag}`
                        });
                        fixes.push(`${flag}: corrected type mismatch`);
                        hasIssues = true;
                    } catch (error) {
                        this._logger.error(`Failed to fix feature flag ${flag}`, error);
                    }
                }
            }
        }

        if (hasIssues) {
            this._migratedSettings.add('featureFlags→validated');
            this._logger.info('Validated feature flags', { fixes });
        } else if (untouchedDefaults.length > 0) {
            this._logger.info('Feature flags relying on defaults (no migration needed)', { flags: untouchedDefaults });
        }

        return hasIssues;
    }

    /**
     * Clean up deprecated settings (with user consent)
     */
    async cleanupDeprecatedSettings() {
        const deprecatedSettings = [
            'customColors',  // Replaced by workbench.colorCustomizations
            'enableReporting'  // Replaced by enableExportReporting
        ];

        const foundDeprecated = [];
        for (const setting of deprecatedSettings) {
            const value = this._settings.inspect(setting);
            if (
                value?.globalValue !== undefined ||
                value?.workspaceValue !== undefined ||
                value?.workspaceFolderValue !== undefined
            ) {
                foundDeprecated.push(setting);
            }
        }

        if (foundDeprecated.length === 0) {
            return false;
        }

        // Ask user for permission to clean up
        const action = await vscode.window.showInformationMessage(
            `Explorer Dates found ${foundDeprecated.length} deprecated setting(s). Would you like to remove them?`,
            { modal: false },
            'Clean Up Now',
            'Keep Old Settings',
            'Ask Later'
        );

        if (action === 'Clean Up Now') {
            for (const setting of foundDeprecated) {
                try {
                    // Remove from both global and workspace
                    await this._settings.clearSetting(setting, { scope: 'user', reason: 'cleanup-deprecated' });
                    await this._settings.clearSetting(setting, { scope: 'workspace', reason: 'cleanup-deprecated' });
                    await this._settings.clearSetting(setting, { scope: 'workspaceFolder', reason: 'cleanup-deprecated' });
                    this._logger.info(`Removed deprecated setting: ${setting}`);
                } catch (error) {
                    this._logger.error(`Failed to remove deprecated setting ${setting}`, error);
                }
            }
            this._migratedSettings.add('deprecatedSettings→removed');
            return true;
        }

        return false;
    }

    /**
     * Track migration metrics for telemetry/debugging
     */
    async trackMigrationMetrics(context) {
        if (this._migratedSettings.size === 0) {
            return false;
        }

        // Store migration info in extension context
        const migrationHistory = context.globalState.get('explorerDates.migrationHistory', []);
        const migrationRecord = {
            timestamp: new Date().toISOString(),
            extensionVersion: context.extension.packageJSON.version,
            migratedSettings: Array.from(this._migratedSettings)
        };
        
        migrationHistory.push(migrationRecord);
        
        // Keep only last 5 migration records
        if (migrationHistory.length > 5) {
            migrationHistory.splice(0, migrationHistory.length - 5);
        }

        await context.globalState.update('explorerDates.migrationHistory', migrationHistory);
        
        this._logger.info('Recorded migration metrics', migrationRecord);
        return true;
    }

    /**
     * Automatically tidy Explorer Dates settings when we detect drift.
     */
    async autoOrganizeSettingsIfNeeded(context, options = {}) {
        const organizer = this._getSettingsOrganizer(context);
        if (!organizer) {
            return null;
        }

        try {
            const plan = await organizer.getOrganizationPlan();
            if (!plan?.needsWork) {
                this._logger.debug('Auto organization skipped - no Explorer Dates settings to tidy.');
                return null;
            }

            const summary = await organizer.organize({ plan });
            if (summary?.changed) {
                if (!options.silent) {
                    const details = [];
                    if (summary.movedToWorkspace.length) {
                        details.push(`${summary.movedToWorkspace.length} moved to workspace`);
                    }
                    if (summary.reorderedWorkspace) {
                        details.push('workspace keys sorted');
                    }
                    if (summary.sortedFiles.length) {
                        details.push(`${summary.sortedFiles.length} file(s) tidied`);
                    }
                    const detailText = details.length ? ` (${details.join(' • ')})` : '';
                    vscode.window.showInformationMessage(`Explorer Dates cleaned up project settings${detailText}.`);
                }

                this._logger.info('Explorer Dates settings auto-organized', {
                    trigger: options.trigger || 'unknown',
                    summary
                });
            }

            return summary;
        } catch (error) {
            this._logger.warn('Automatic Explorer Dates settings organization failed', error);
            return null;
        }
    }

    _getSettingsOrganizer(context) {
        if (!context) {
            this._logger.debug('Settings organizer unavailable - missing extension context.');
            return null;
        }

        if (!this._organizer || this._organizerContext !== context) {
            this._organizer = new SettingsOrganizer(context);
            this._organizerContext = context;
        }

        return this._organizer;
    }

    /**
     * Show user-friendly migration notification
     */
    async _showMigrationNotification(migratedSettings) {
        const settingsCount = migratedSettings.length;
        const message = `Explorer Dates updated ${settingsCount} setting(s) for compatibility. Your configuration has been preserved.`;
        
        const action = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            'View Changes',
            'Open Settings'
        );

        switch (action) {
            case 'View Changes':
                await this._showMigrationDetails();
                break;
            case 'Open Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                break;
        }
    }

    /**
     * Show detailed migration information
     */
    async _showMigrationDetails() {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesMigration',
            'Explorer Dates - Settings Migration',
            vscode.ViewColumn.One,
            { enableScripts: false }
        );

        const settingsHtml = Array.from(this._migratedSettings).map(setting => 
            `<li><code>${setting}</code></li>`
        ).join('');

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Settings Migration</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                    h1 { color: #007ACC; }
                    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
                    ul { line-height: 1.6; }
                    .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>🔧 Settings Migration Completed</h1>
                
                <div class="info">
                    <strong>Good news!</strong> Explorer Dates automatically updated your settings to use the latest configuration options. Your preferences have been preserved.
                </div>

                <h2>Changes Made:</h2>
                <ul>
                    ${settingsHtml}
                </ul>

                <h2>What This Means:</h2>
                <ul>
                    <li><strong>enableReporting → enableExportReporting:</strong> Consolidated naming for consistency</li>
                    <li><strong>customColors → workbench.colorCustomizations:</strong> Uses VS Code's standard color system</li>
                    <li><strong>Feature flags validated:</strong> Ensures proper types and values</li>
                    <li><strong>Deprecated settings cleaned:</strong> Removes unused configuration</li>
                </ul>

                <h2>Next Steps:</h2>
                <ul>
                    <li>Your extension will continue working as before</li>
                    <li>Check VS Code Settings if you want to customize further</li>
                    <li>Run "Explorer Dates: Validate Configuration" anytime to check for issues</li>
                </ul>
            </body>
            </html>
        `;
    }

    /**
     * Validate current configuration for issues
     */
    async validateConfiguration() {
        const issues = [];
        const config = vscode.workspace.getConfiguration('explorerDates');

        // Check for common configuration issues
        const validations = [
            {
                setting: 'dateDecorationFormat',
                validate: (value) => ['smart', 'relative-short', 'relative-long', 'absolute-short', 'absolute-long'].includes(value),
                message: 'Invalid date decoration format'
            },
            {
                setting: 'colorScheme', 
                validate: (value) => ['none', 'recency', 'file-type', 'subtle', 'vibrant', 'custom'].includes(value),
                message: 'Invalid color scheme'
            },
            {
                setting: 'badgePriority',
                validate: (value) => ['time', 'author', 'size'].includes(value),
                message: 'Invalid badge priority'
            },
            {
                setting: 'maxCacheSize',
                validate: (value) => typeof value === 'number' && value >= 100 && value <= 50000,
                message: 'Cache size must be between 100 and 50,000'
            },
            {
                setting: 'cacheTimeout',
                validate: (value) => typeof value === 'number' && value >= 5000 && value <= 300000,
                message: 'Cache timeout must be between 5,000 and 300,000 milliseconds'
            }
        ];

        for (const validation of validations) {
            const value = config.get(validation.setting);
            if (value !== undefined && !validation.validate(value)) {
                issues.push({
                    setting: validation.setting,
                    value,
                    message: validation.message
                });
            }
        }

        return issues;
    }

    /**
     * Get migration history for diagnostics
     */
    getMigrationHistory(context) {
        return context.globalState.get('explorerDates.migrationHistory', []);
    }
}

module.exports = { SettingsMigrationManager };
