/**
 * Settings Migration Commands
 * Commands for managing settings migration, validation, and cleanup
 */
const vscode = require('vscode');

function registerMigrationCommands({ context, logger, getSettingsMigrationManager }) {
    const subscriptions = [];

    // Migrate Settings Command
    subscriptions.push(vscode.commands.registerCommand('explorerDates.migrateSettings', async () => {
        try {
            const migrationManager = await getSettingsMigrationManager();
            if (!migrationManager) {
                vscode.window.showWarningMessage('Settings migration system unavailable.');
                return;
            }

            vscode.window.showInformationMessage('Checking for settings that need migration...');
            const results = await migrationManager.migrateAllSettings(context);
            
            if (results.length === 0) {
                vscode.window.showInformationMessage('✅ All settings are up to date!');
            } else {
                vscode.window.showInformationMessage(`✅ Migrated ${results.length} setting(s) successfully.`);
            }
            
            logger.info('Manual settings migration completed', { results });
        } catch (error) {
            logger.error('Failed to run settings migration', error);
            vscode.window.showErrorMessage(`Failed to migrate settings: ${error.message}`);
        }
    }));

    // Validate Configuration Command
    subscriptions.push(vscode.commands.registerCommand('explorerDates.validateConfiguration', async () => {
        try {
            const migrationManager = await getSettingsMigrationManager();
            if (!migrationManager) {
                vscode.window.showWarningMessage('Settings validation system unavailable.');
                return;
            }

            const issues = await migrationManager.validateConfiguration();
            
            if (issues.length === 0) {
                vscode.window.showInformationMessage('✅ Configuration is valid - no issues found!');
            } else {
                const message = `Found ${issues.length} configuration issue(s). Would you like to see details?`;
                const action = await vscode.window.showWarningMessage(message, 'Show Details', 'Dismiss');
                
                if (action === 'Show Details') {
                    await _showConfigurationIssues(issues);
                }
            }
            
            logger.info('Configuration validation completed', { issuesFound: issues.length, issues });
        } catch (error) {
            logger.error('Failed to validate configuration', error);
            vscode.window.showErrorMessage(`Failed to validate configuration: ${error.message}`);
        }
    }));

    // Clean Legacy Settings Command
    subscriptions.push(vscode.commands.registerCommand('explorerDates.cleanLegacySettings', async () => {
        try {
            const migrationManager = await getSettingsMigrationManager();
            if (!migrationManager) {
                vscode.window.showWarningMessage('Settings migration system unavailable.');
                return;
            }

            const cleaned = await migrationManager.cleanupDeprecatedSettings();
            
            if (cleaned) {
                vscode.window.showInformationMessage('✅ Deprecated settings have been cleaned up!');
            } else {
                vscode.window.showInformationMessage('ℹ️ No deprecated settings found to clean up.');
            }
            
            logger.info('Legacy settings cleanup completed', { cleaned });
        } catch (error) {
            logger.error('Failed to clean legacy settings', error);
            vscode.window.showErrorMessage(`Failed to clean legacy settings: ${error.message}`);
        }
    }));

    // Show Migration History Command  
    subscriptions.push(vscode.commands.registerCommand('explorerDates.showMigrationHistory', async () => {
        try {
            const migrationManager = await getSettingsMigrationManager();
            if (!migrationManager) {
                vscode.window.showWarningMessage('Settings migration system unavailable.');
                return;
            }

            const history = migrationManager.getMigrationHistory(context);
            
            if (history.length === 0) {
                vscode.window.showInformationMessage('No migration history found.');
                return;
            }

            await _showMigrationHistory(history);
            logger.info('Displayed migration history', { historyLength: history.length });
        } catch (error) {
            logger.error('Failed to show migration history', error);
            vscode.window.showErrorMessage(`Failed to show migration history: ${error.message}`);
        }
    }));

    // Apply Custom Colors Command (enhanced)
    subscriptions.push(vscode.commands.registerCommand('explorerDates.applyCustomColors', async () => {
        try {
            const action = await vscode.window.showQuickPick([
                { label: 'Copy to Clipboard', description: 'Copy color configuration to clipboard' },
                { label: 'Open Settings', description: 'Open VS Code settings to workbench.colorCustomizations' },
                { label: 'Apply Default Colors', description: 'Apply default Explorer Dates colors' }
            ], {
                placeHolder: 'How would you like to set up custom colors?',
                ignoreFocusOut: true
            });

            if (!action) return;

            const defaultColors = {
                'explorerDates.customColor.veryRecent': '#00ff00',
                'explorerDates.customColor.recent': '#ffff00', 
                'explorerDates.customColor.old': '#ff0000'
            };

            switch (action.label) {
                case 'Copy to Clipboard':
                    const colorConfig = JSON.stringify({ 
                        'workbench.colorCustomizations': defaultColors 
                    }, null, 2);
                    await vscode.env.clipboard.writeText(colorConfig);
                    vscode.window.showInformationMessage('Color configuration copied to clipboard!');
                    break;

                case 'Open Settings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'workbench.colorCustomizations');
                    break;

                case 'Apply Default Colors':
                    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
                    const existingColors = workbenchConfig.get('colorCustomizations', {});
                    const newColors = { ...existingColors, ...defaultColors };
                    
                    await workbenchConfig.update('colorCustomizations', newColors, vscode.ConfigurationTarget.Global);
                    
                    // Also set color scheme to custom
                    const explorerConfig = vscode.workspace.getConfiguration('explorerDates');
                    await explorerConfig.update('colorScheme', 'custom', vscode.ConfigurationTarget.Global);
                    
                    vscode.window.showInformationMessage('✅ Custom colors applied successfully!');
                    break;
            }
            
            logger.info('Custom colors command executed', { action: action.label });
        } catch (error) {
            logger.error('Failed to apply custom colors', error);
            vscode.window.showErrorMessage(`Failed to apply custom colors: ${error.message}`);
        }
    }));

    // Reset to Defaults Command
    subscriptions.push(vscode.commands.registerCommand('explorerDates.resetToDefaults', async () => {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'This will reset all Explorer Dates settings to their default values. Are you sure?',
                { modal: true },
                'Reset Settings',
                'Cancel'
            );

            if (confirmation !== 'Reset Settings') {
                return;
            }

            const config = vscode.workspace.getConfiguration('explorerDates');
            const packageJson = context.extension.packageJSON;
            const configProperties = packageJson?.contributes?.configuration?.properties || {};

            let resetCount = 0;
            for (const key of Object.keys(configProperties)) {
                if (key.startsWith('explorerDates.')) {
                    const settingKey = key.replace('explorerDates.', '');
                    try {
                        await config.update(settingKey, undefined, vscode.ConfigurationTarget.Global);
                        await config.update(settingKey, undefined, vscode.ConfigurationTarget.Workspace);
                        resetCount++;
                    } catch (error) {
                        logger.warn(`Failed to reset setting ${settingKey}`, error);
                    }
                }
            }

            vscode.window.showInformationMessage(`✅ Reset ${resetCount} settings to defaults.`);
            logger.info('Settings reset to defaults', { resetCount });
        } catch (error) {
            logger.error('Failed to reset settings to defaults', error);
            vscode.window.showErrorMessage(`Failed to reset settings: ${error.message}`);
        }
    }));

    // Export Configuration Command
    subscriptions.push(vscode.commands.registerCommand('explorerDates.exportConfiguration', async () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const exportData = {};

            // Get all explorer dates settings
            const packageJson = context.extension.packageJSON;
            const configProperties = packageJson?.contributes?.configuration?.properties || {};

            for (const key of Object.keys(configProperties)) {
                if (key.startsWith('explorerDates.')) {
                    const settingKey = key.replace('explorerDates.', '');
                    const value = config.get(settingKey);
                    if (value !== undefined) {
                        exportData[key] = value;
                    }
                }
            }

            const exportJson = JSON.stringify(exportData, null, 2);
            
            const action = await vscode.window.showQuickPick([
                { label: 'Copy to Clipboard', description: 'Copy configuration to clipboard' },
                { label: 'Save to File', description: 'Save configuration to a JSON file' }
            ], {
                placeHolder: 'How would you like to export the configuration?'
            });

            if (!action) return;

            switch (action.label) {
                case 'Copy to Clipboard':
                    await vscode.env.clipboard.writeText(exportJson);
                    vscode.window.showInformationMessage('Configuration copied to clipboard!');
                    break;

                case 'Save to File':
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file('explorer-dates-config.json'),
                        filters: { 'JSON': ['json'] }
                    });
                    
                    if (uri) {
                        await vscode.workspace.fs.writeFile(uri, Buffer.from(exportJson, 'utf8'));
                        vscode.window.showInformationMessage(`Configuration saved to ${uri.fsPath}`);
                    }
                    break;
            }
            
            logger.info('Configuration exported', { action: action.label, settingsCount: Object.keys(exportData).length });
        } catch (error) {
            logger.error('Failed to export configuration', error);
            vscode.window.showErrorMessage(`Failed to export configuration: ${error.message}`);
        }
    }));

    return subscriptions;
}

/**
 * Show configuration issues in a webview
 */
async function _showConfigurationIssues(issues) {
    const panel = vscode.window.createWebviewPanel(
        'explorerDatesConfigIssues',
        'Explorer Dates - Configuration Issues',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    const issuesHtml = issues.map(issue => `
        <div class="issue">
            <h3><code>${issue.setting}</code></h3>
            <p><strong>Current value:</strong> <code>${JSON.stringify(issue.value)}</code></p>
            <p><strong>Issue:</strong> ${issue.message}</p>
        </div>
    `).join('');

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Configuration Issues</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                h1 { color: #d73a49; }
                .issue { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .issue h3 { margin-top: 0; color: #856404; }
                code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>⚠️ Configuration Issues Found</h1>
            ${issuesHtml}
            <p><strong>To fix these issues:</strong> Open VS Code Settings and update the highlighted settings with valid values.</p>
        </body>
        </html>
    `;
}

/**
 * Show migration history in a webview
 */
async function _showMigrationHistory(history) {
    const panel = vscode.window.createWebviewPanel(
        'explorerDatesMigrationHistory', 
        'Explorer Dates - Migration History',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    const historyHtml = history.slice().reverse().map((record, index) => `
        <div class="migration-record">
            <h3>Migration #${history.length - index}</h3>
            <p><strong>Date:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
            <p><strong>Extension Version:</strong> ${record.extensionVersion}</p>
            <p><strong>Settings Migrated:</strong></p>
            <ul>
                ${record.migratedSettings.map(setting => `<li><code>${setting}</code></li>`).join('')}
            </ul>
        </div>
    `).join('');

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Migration History</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                h1 { color: #007ACC; }
                .migration-record { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .migration-record h3 { margin-top: 0; color: #495057; }
                code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
                ul { line-height: 1.6; }
            </style>
        </head>
        <body>
            <h1>📜 Settings Migration History</h1>
            ${historyHtml}
        </body>
        </html>
    `;
}

module.exports = { registerMigrationCommands };
