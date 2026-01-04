const vscode = require('vscode');
const { fileSystem } = require('../filesystem/FileSystemAdapter');
const { getFileName, getRelativePath } = require('../utils/pathUtils');
const { ensureDate } = require('../utils/dateHelpers');

const isWeb = process.env.VSCODE_WEB === 'true';
let childProcess = null;
function loadChildProcess() {
    if (!childProcess && !isWeb) {
        childProcess = eval('require')('child_process');
    }
    return childProcess;
}

function registerCoreCommands({ context, fileDateProvider, logger, l10n }) {
    const subscriptions = [];

    subscriptions.push(vscode.commands.registerCommand('explorerDates.refreshDateDecorations', () => {
        try {
            if (fileDateProvider) {
                fileDateProvider.clearAllCaches();
                fileDateProvider.refreshAll();
                const message = l10n?.getString('refreshSuccess') || 'Date decorations refreshed - all caches cleared';
                vscode.window.showInformationMessage(message);
                logger.info('Date decorations refreshed manually with cache clear');
            }
        } catch (error) {
            logger.error('Failed to refresh decorations', error);
            vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.previewConfiguration', (settings) => {
        try {
            if (fileDateProvider) {
                fileDateProvider.applyPreviewSettings(settings);
                logger.info('Configuration preview applied', settings);
            }
        } catch (error) {
            logger.error('Failed to apply configuration preview', error);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.clearPreview', () => {
        try {
            if (fileDateProvider) {
                fileDateProvider.applyPreviewSettings(null);
                logger.info('Configuration preview cleared');
            }
        } catch (error) {
            logger.error('Failed to clear configuration preview', error);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showMetrics', async () => {
        try {
            if (fileDateProvider) {
                const metrics = fileDateProvider.getMetrics();
                let message = `Explorer Dates Metrics:\n` +
                    `Total Decorations: ${metrics.totalDecorations}\n` +
                    `Cache Size: ${metrics.cacheSize}\n` +
                    `Cache Hits: ${metrics.cacheHits}\n` +
                    `Cache Misses: ${metrics.cacheMisses}\n` +
                    `Cache Hit Rate: ${metrics.cacheHitRate}\n` +
                    `Errors: ${metrics.errors}`;

                if (metrics.advancedCache) {
                    message += `\n\nAdvanced Cache:\n` +
                        `Memory Items: ${metrics.advancedCache.memoryItems}\n` +
                        `Memory Usage: ${(metrics.advancedCache.memoryUsage / 1024 / 1024).toFixed(2)} MB\n` +
                        `Memory Hit Rate: ${metrics.advancedCache.memoryHitRate}\n` +
                        `Disk Hit Rate: ${metrics.advancedCache.diskHitRate}\n` +
                        `Evictions: ${metrics.advancedCache.evictions}`;
                }

                if (metrics.batchProcessor) {
                    message += `\n\nBatch Processor:\n` +
                        `Queue Length: ${metrics.batchProcessor.queueLength}\n` +
                        `Is Processing: ${metrics.batchProcessor.isProcessing}\n` +
                        `Average Batch Time: ${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms`;
                }

                const choice = await vscode.window.showInformationMessage(
                    message, 
                    { modal: true },
                    'View Rich Analytics'
                );

                if (choice === 'View Rich Analytics') {
                    // Lazy load the rich analytics view
                    await vscode.commands.executeCommand('explorerDates.showPerformanceAnalytics');
                }

                logger.info('Metrics displayed', metrics);
            }
        } catch (error) {
            logger.error('Failed to show metrics', error);
            vscode.window.showErrorMessage(`Failed to show metrics: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.openLogs', () => {
        try {
            logger.show();
        } catch (error) {
            logger.error('Failed to open logs', error);
            vscode.window.showErrorMessage(`Failed to open logs: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showCurrentConfig', () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const settings = {
                highContrastMode: config.get('highContrastMode'),
                badgePriority: config.get('badgePriority'),
                colorScheme: config.get('colorScheme'),
                accessibilityMode: config.get('accessibilityMode'),
                dateDecorationFormat: config.get('dateDecorationFormat'),
                showGitInfo: config.get('showGitInfo'),
                showFileSize: config.get('showFileSize')
            };

            const message = `Current Explorer Dates Configuration:\n\n${Object.entries(settings)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}`;

            vscode.window.showInformationMessage(message, { modal: true });
            logger.info('Current configuration displayed', settings);
        } catch (error) {
            logger.error('Failed to show configuration', error);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.resetToDefaults', async () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            await config.update('highContrastMode', false, vscode.ConfigurationTarget.Global);
            await config.update('badgePriority', 'time', vscode.ConfigurationTarget.Global);
            await config.update('accessibilityMode', false, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately.');
            logger.info('Reset problematic settings to defaults');

            if (fileDateProvider) {
                fileDateProvider.clearAllCaches();
                fileDateProvider.refreshAll();
            }
        } catch (error) {
            logger.error('Failed to reset settings', error);
            vscode.window.showErrorMessage(`Failed to reset settings: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.toggleDecorations', () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const currentValue = config.get('showDateDecorations', true);
            config.update('showDateDecorations', !currentValue, vscode.ConfigurationTarget.Global);
            const message = !currentValue
                ? l10n?.getString('decorationsEnabled') || 'Date decorations enabled'
                : l10n?.getString('decorationsDisabled') || 'Date decorations disabled';
            vscode.window.showInformationMessage(message);
            logger.info(`Date decorations toggled to: ${!currentValue}`);
        } catch (error) {
            logger.error('Failed to toggle decorations', error);
            vscode.window.showErrorMessage(`Failed to toggle decorations: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.copyFileDate', async (uri) => {
        try {
            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const stat = await fileSystem.stat(targetUri);
            const dateString = ensureDate(stat.mtime).toLocaleString();

            await vscode.env.clipboard.writeText(dateString);
            vscode.window.showInformationMessage(`Copied to clipboard: ${dateString}`);
            logger.info(`File date copied for: ${targetUri.fsPath || targetUri.path}`);
        } catch (error) {
            logger.error('Failed to copy file date', error);
            vscode.window.showErrorMessage(`Failed to copy file date: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFileDetails', async (uri) => {
        try {
            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const stat = await fileSystem.stat(targetUri);
            const fileName = getFileName(targetUri.fsPath || targetUri.path);
            const fileSize = fileDateProvider?._formatFileSize(stat.size, 'auto') || `${stat.size} bytes`;
            const modified = ensureDate(stat.mtime).toLocaleString();
            const created = ensureDate(stat.birthtime || stat.mtime).toLocaleString();

            const details = `File: ${fileName}\n` +
                `Size: ${fileSize}\n` +
                `Modified: ${modified}\n` +
                `Created: ${created}\n` +
                `Path: ${targetUri.fsPath || targetUri.path}`;

            vscode.window.showInformationMessage(details, { modal: true });
            logger.info(`File details shown for: ${targetUri.fsPath || targetUri.path}`);
        } catch (error) {
            logger.error('Failed to show file details', error);
            vscode.window.showErrorMessage(`Failed to show file details: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.toggleFadeOldFiles', () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const currentValue = config.get('fadeOldFiles', false);
            config.update('fadeOldFiles', !currentValue, vscode.ConfigurationTarget.Global);
            const message = !currentValue ? 'Fade old files enabled' : 'Fade old files disabled';
            vscode.window.showInformationMessage(message);
            logger.info(`Fade old files toggled to: ${!currentValue}`);
        } catch (error) {
            logger.error('Failed to toggle fade old files', error);
            vscode.window.showErrorMessage(`Failed to toggle fade old files: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFileHistory', async (uri) => {
        try {
            if (isWeb) {
                vscode.window.showInformationMessage('Git history is unavailable on VS Code for Web.');
                return;
            }

            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('File is not in a workspace');
                return;
            }

            const relativePath = getRelativePath(workspaceFolder.uri.fsPath || workspaceFolder.uri.path, targetUri.fsPath || targetUri.path);
            const command = `git log --oneline -10 -- "${relativePath}"`;
            const cp = loadChildProcess();

            cp.exec(command, { cwd: workspaceFolder.uri.fsPath, timeout: 3000 }, (error, stdout) => {
                if (error) {
                    if (error.message.includes('not a git repository')) {
                        vscode.window.showWarningMessage('This file is not in a Git repository');
                    } else {
                        vscode.window.showErrorMessage(`Git error: ${error.message}`);
                    }
                    return;
                }

                if (!stdout.trim()) {
                    vscode.window.showInformationMessage('No Git history found for this file');
                    return;
                }

                const history = stdout.trim();
                const fileName = getFileName(targetUri.fsPath || targetUri.path);
                vscode.window.showInformationMessage(
                    `Recent commits for ${fileName}:\n\n${history}`,
                    { modal: true }
                );
            });

            logger.info(`File history requested for: ${targetUri.fsPath || targetUri.path}`);
        } catch (error) {
            logger.error('Failed to show file history', error);
            vscode.window.showErrorMessage(`Failed to show file history: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.compareWithPrevious', async (uri) => {
        try {
            if (isWeb) {
                vscode.window.showInformationMessage('Git comparisons are unavailable on VS Code for Web.');
                return;
            }

            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('File is not in a workspace');
                return;
            }

            await vscode.commands.executeCommand('git.openChange', targetUri);
            logger.info(`Git diff opened for: ${targetUri.fsPath || targetUri.path}`);
        } catch (error) {
            logger.error('Failed to compare with previous version', error);
            vscode.window.showErrorMessage(`Failed to compare with previous version: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.applyCustomColors', async () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const customColors = config.get('customColors', {
                veryRecent: '#00ff00',
                recent: '#ffff00',
                old: '#ff0000'
            });

            const message = `To use custom colors with Explorer Dates, add the following to your settings.json:\n\n` +
                `"workbench.colorCustomizations": {\n` +
                `  "explorerDates.customColor.veryRecent": "${customColors.veryRecent}",\n` +
                `  "explorerDates.customColor.recent": "${customColors.recent}",\n` +
                `  "explorerDates.customColor.old": "${customColors.old}"\n` +
                `}\n\n` +
                `Also set: "explorerDates.colorScheme": "custom"`;

            const choice = await vscode.window.showInformationMessage(
                'Custom colors configuration',
                { modal: true, detail: message },
                'Copy to Clipboard',
                'Open Settings'
            );

            if (choice === 'Copy to Clipboard') {
                const configText = `"workbench.colorCustomizations": {\n` +
                    `  "explorerDates.customColor.veryRecent": "${customColors.veryRecent}",\n` +
                    `  "explorerDates.customColor.recent": "${customColors.recent}",\n` +
                    `  "explorerDates.customColor.old": "${customColors.old}"\n` +
                    `}`;
                await vscode.env.clipboard.writeText(configText);
                vscode.window.showInformationMessage('Custom color configuration copied to clipboard');
            } else if (choice === 'Open Settings') {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'workbench.colorCustomizations');
            }

            logger.info('Custom colors help displayed');
        } catch (error) {
            logger.error('Failed to apply custom colors', error);
            vscode.window.showErrorMessage(`Failed to apply custom colors: ${error.message}`);
        }
    }));

    subscriptions.forEach(disposable => context.subscriptions.push(disposable));
}

module.exports = {
    registerCoreCommands
};
