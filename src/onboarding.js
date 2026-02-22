const vscode = require('vscode');
let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};
const { getLocalization } = require('./utils/localization');
const { getSettingsCoordinator } = require('./utils/settingsCoordinator');

/**
 * Onboarding Manager for first-time users and feature discovery
 */
class OnboardingManager {
    constructor(context) {
        this._context = context;
        this._logger = getLogger();
        this._l10n = getLocalization();
        this._settings = getSettingsCoordinator();
        
        // Track onboarding state
        this._hasShownWelcome = context.globalState.get('explorerDates.hasShownWelcome', false);
        this._hasCompletedSetup = context.globalState.get('explorerDates.hasCompletedSetup', false);
        this._onboardingVersion = context.globalState.get('explorerDates.onboardingVersion', '0.0.0');
        
        this._logger.info('OnboardingManager initialized', {
            hasShownWelcome: this._hasShownWelcome,
            hasCompletedSetup: this._hasCompletedSetup,
            onboardingVersion: this._onboardingVersion
        });
    }

    /**
     * Check if onboarding should run
     */
    async shouldShowOnboarding() {
        const extensionVersion = this._context.extension.packageJSON.version;
        
        // Show onboarding for first-time users or major version updates
        return !this._hasShownWelcome || 
               !this._hasCompletedSetup || 
               this._shouldShowVersionUpdate(extensionVersion);
    }

    /**
     * Check if version update warrants showing new features
     */
    _shouldShowVersionUpdate(currentVersion) {
        if (this._onboardingVersion === '0.0.0') return true;
        
        const [currentMajor] = currentVersion.split('.').map(Number);
        const [savedMajor] = this._onboardingVersion.split('.').map(Number);
        
        // Only show for major version updates to reduce notification fatigue
        // Minor updates get gentler notifications
        return currentMajor > savedMajor;
    }

    /**
     * Check if this is a minor update that deserves a gentle notification
     */
    _isMinorUpdate(currentVersion) {
        if (this._onboardingVersion === '0.0.0') return false;
        
        const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
        const [savedMajor, savedMinor] = this._onboardingVersion.split('.').map(Number);
        
        return currentMajor === savedMajor && currentMinor > savedMinor;
    }

    /**
     * Show welcome message and start onboarding flow
     */
    async showWelcomeMessage() {
        try {
            const extensionVersion = this._context.extension.packageJSON.version;
            const isUpdate = this._hasShownWelcome;
            const isMinorUpdate = this._isMinorUpdate(extensionVersion);
            
            // For minor updates, show a gentle status bar notification instead
            if (isMinorUpdate) {
                return this._showGentleUpdateNotification(extensionVersion);
            }
            
            // Check if settings migration occurred
            const migrationHistory = this._context.globalState.get('explorerDates.migrationHistory', []);
            const recentMigration = migrationHistory.find(record => 
                record.extensionVersion === extensionVersion && record.migratedSettings.length > 0
            );
            
            let message = isUpdate ?
                `Explorer Dates has been updated to v${extensionVersion} with new features and improvements!` :
                'See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!';
            
            // Add migration notice if applicable
            if (recentMigration) {
                message += `\n\n✅ Your settings have been automatically migrated to maintain compatibility.`;
            }
            
            // Reduce options for existing users to prevent overwhelm
            const actions = isUpdate ? 
                ['📖 What\'s New', '⚙️ Settings', 'Dismiss'] :
                ['🚀 Quick Setup', '📖 Feature Tour', '⚙️ Settings', 'Maybe Later'];
            
            // Add migration history option if there have been migrations
            if (migrationHistory.length > 0 && isUpdate) {
                actions.splice(-1, 0, '📜 Migration History');
            }
            
            const action = await vscode.window.showInformationMessage(
                message,
                { modal: false },
                ...actions
            );

            // Track that we've shown the welcome
            await this._context.globalState.update('explorerDates.hasShownWelcome', true);
            await this._context.globalState.update('explorerDates.onboardingVersion', extensionVersion);

            switch (action) {
                case '🚀 Quick Setup':
                    await this.showQuickSetupWizard();
                    break;
                case '📖 Feature Tour':
                    await this.showFeatureTour();
                    break;
                case '📖 What\'s New':
                    await this.showWhatsNew(extensionVersion);
                    break;
                case '📜 Migration History':
                    await vscode.commands.executeCommand('explorerDates.showMigrationHistory');
                    break;
                case '⚙️ Settings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                    break;
                    
                case 'previewConfiguration':
                    await vscode.commands.executeCommand('explorerDates.previewConfiguration', message.settings);
                    break;
                    
                case 'clearPreview':
                    await vscode.commands.executeCommand('explorerDates.clearPreview');
                    break;
            }

            this._logger.info('Welcome message shown', { action, isUpdate, isMinorUpdate });
            
        } catch (error) {
            this._logger.error('Failed to show welcome message', error);
        }
    }

    /**
     * Show gentle update notification in status bar for minor updates
     */
    async _showGentleUpdateNotification(version) {
        // Show a brief status bar message instead of intrusive popup
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = `$(check) Explorer Dates updated to v${version}`;
        statusBarItem.tooltip = 'Click to see what\'s new in Explorer Dates';
        statusBarItem.command = 'explorerDates.showWhatsNew';
        statusBarItem.show();
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            statusBarItem.dispose();
        }, 10000);
        
        // Update version tracking
        await this._context.globalState.update('explorerDates.onboardingVersion', version);
        
        this._logger.info('Showed gentle update notification', { version });
    }

    /**
     * Show quick setup wizard for common configurations
     */
    async showQuickSetupWizard() {
        try {
            const panel = vscode.window.createWebviewPanel(
                'explorerDatesSetup',
                'Explorer Dates Quick Setup',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Lazy load webview assets
            const html = await this._generateSetupWizardHTML();
            panel.webview.html = html;
            
            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async (message) => {
                await this._handleSetupWizardMessage(message, panel);
            });

            this._logger.info('Quick setup wizard opened');
            
        } catch (error) {
            this._logger.error('Failed to show setup wizard', error);
        }
    }

    /**
     * Handle messages from setup wizard webview
     */
    async _handleSetupWizardMessage(message, panel) {
        try {
            switch (message.command) {
                case 'applyConfiguration':
                    await this._applyQuickConfiguration(message.configuration);
                    await this._context.globalState.update('explorerDates.hasCompletedSetup', true);
                    vscode.window.showInformationMessage('✅ Explorer Dates configured successfully!');
                    panel.dispose();
                    break;
                    
                case 'previewConfiguration':
                    // Handle preview by calling the preview command
                    if (message.settings) {
                        await vscode.commands.executeCommand('explorerDates.previewConfiguration', message.settings);
                        this._logger.info('Configuration preview applied via webview', message.settings);
                    }
                    break;
                    
                case 'clearPreview':
                    // Handle clear preview by calling the clear preview command
                    await vscode.commands.executeCommand('explorerDates.clearPreview');
                    this._logger.info('Configuration preview cleared via webview');
                    break;
                    
                case 'skipSetup':
                    await this._context.globalState.update('explorerDates.hasCompletedSetup', true);
                    panel.dispose();
                    break;
                    
                case 'openSettings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                    panel.dispose();
                    break;
            }
            
        } catch (error) {
            this._logger.error('Failed to handle setup wizard message', error);
        }
    }

    /**
     * Apply quick configuration based on user selections
     */
    async _applyQuickConfiguration(configuration) {
        // Apply selected configuration
        if (configuration.preset) {
            const presets = await this._getConfigurationPresets();
            const preset = presets[configuration.preset];
            
            if (preset) {
                this._logger.info(`Applying preset: ${configuration.preset}`, preset.settings);
                await this._settings.applySettings(preset.settings, {
                    scope: 'user',
                    reason: `onboarding-preset:${configuration.preset}`
                });
                
                this._logger.info(`Applied preset: ${configuration.preset}`, preset.settings);
                
                // Show confirmation to user
                vscode.window.showInformationMessage(`Applied "${preset.name}" configuration. Changes should be visible immediately!`);
            }
        }
        
        // Apply individual settings
        if (configuration.individual) {
            await this._settings.applySettings(configuration.individual, {
                scope: 'user',
                reason: 'onboarding-individual'
            });
            this._logger.info('Applied individual settings', configuration.individual);
        }

        // Force refresh of decorations to show changes immediately
        try {
            await vscode.commands.executeCommand('explorerDates.refreshDateDecorations');
            this._logger.info('Decorations refreshed after configuration change');
        } catch (error) {
            this._logger.warn('Failed to refresh decorations after configuration change', error);
        }
    }

    /**
     * Get configuration presets for different use cases
     */
    async _getConfigurationPresets() {
        // Attempt to load presets from chunked assets to keep onboarding light
        try {
            const { loadOnboardingAssets } = require('./chunks/onboarding-chunk');
            const assets = await loadOnboardingAssets();
            if (assets && typeof assets.getPresets === 'function') {
                return assets.getPresets();
            }
        } catch (error) {
            this._logger.debug('Onboarding presets assets not available, using inline defaults', error);
        }

        // Minimal defaults (kept intentionally small)
        return {
            minimal: {
                name: 'Minimal',
                description: 'Clean and simple - just show modification times in short format',
                settings: {
                    dateDecorationFormat: 'relative-short',
                    colorScheme: 'none',
                    highContrastMode: false,
                    showFileSize: false,
                    showGitInfo: 'none',
                    badgePriority: 'time',
                    fadeOldFiles: false,
                    enableContextMenu: false,
                    showStatusBar: false
                }
            },
            developer: {
                name: 'Developer',
                description: 'Perfect for development - includes Git info, file sizes, and color coding',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'recency',
                    showFileSize: true,
                    showGitInfo: 'author',
                    badgePriority: 'time',
                    fadeOldFiles: true,
                    enableContextMenu: true,
                    showStatusBar: true
                }
            },
            accessible: {
                name: 'Accessible',
                description: 'High contrast and screen reader friendly with detailed tooltips',
                settings: {
                    dateDecorationFormat: 'relative-short',
                    colorScheme: 'none',
                    highContrastMode: true,
                    accessibilityMode: true,
                    showFileSize: false,
                    showGitInfo: 'none',
                    badgePriority: 'time',
                    fadeOldFiles: false,
                    enableContextMenu: true,
                    keyboardNavigation: true
                }
            }
        };
    }

    /**
     * Show interactive feature tour
     */
    async showFeatureTour() {
        try {
            const panel = vscode.window.createWebviewPanel(
                'explorerDatesFeatureTour',
                'Explorer Dates Feature Tour',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Lazy load webview assets
            const html = await this._generateFeatureTourHTML();
            panel.webview.html = html;
            
            // Handle tour navigation
            panel.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'openSettings') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', message.setting || 'explorerDates');
                } else if (message.command === 'runCommand') {
                    await vscode.commands.executeCommand(message.commandId);
                }
            });

            this._logger.info('Feature tour opened');
            
        } catch (error) {
            this._logger.error('Failed to show feature tour', error);
        }
    }

    /**
     * Generate HTML for setup wizard with lazy-loaded assets
     */
    async _generateSetupWizardHTML() {
        const allPresets = await this._getConfigurationPresets();
        
        // Simplified preset selection - only show 3 core options to reduce overwhelm
        const simplifiedPresets = {
            minimal: allPresets.minimal,
            developer: allPresets.developer,
            accessible: allPresets.accessible
        };
        
        // Try to load assets from chunk first
        try {
            const { loadOnboardingAssets } = require('./chunks/onboarding-chunk');
            const assets = await loadOnboardingAssets();
            
            if (assets) {
                this._logger.debug('Using chunked onboarding assets for setup wizard');
                return await assets.getSetupWizardHTML(simplifiedPresets);
            }
        } catch (error) {
            this._logger.warn('Failed to load chunked assets, using inline fallback', error);
        }
        
        // Fallback: minimal stub served when chunked assets aren't available
        return `<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>Full UI is loaded on demand; reopen the wizard to load full assets.</p>
            </body>
            </html>`;
    }

    /**
     * Generate HTML for feature tour with lazy-loaded assets
     */
    async _generateFeatureTourHTML() {
        // Try to load assets from chunk first
        try {
            const { loadOnboardingAssets } = require('./chunks/onboarding-chunk');
            const assets = await loadOnboardingAssets();
            
            if (assets) {
                this._logger.debug('Using chunked onboarding assets for feature tour');
                return await assets.getFeatureTourHTML();
            }
        } catch (error) {
            this._logger.warn('Failed to load chunked assets for feature tour, using inline fallback', error);
        }
        
        // Minimal feature tour fallback to save bundle size
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates - Feature Tour</h1><p>Full tour loads on demand.</p></body></html>`;
    }

    /**
     * Show tips and tricks for power users
     */
    async showTipsAndTricks() {
        let tips = null;
        try {
            const { loadOnboardingAssets } = require('./chunks/onboarding-chunk');
            const assets = await loadOnboardingAssets();
            if (assets && typeof assets.getTips === 'function') {
                tips = assets.getTips();
            }
        } catch (error) {
            this._logger.debug('Tips assets unavailable, using inline minimal tips', error);
        }

        if (!tips) {
            tips = [
                { icon: '⌨️', title: 'Keyboard Shortcuts', description: 'Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off.' },
                { icon: '🎯', title: 'Smart Exclusions', description: 'The extension automatically detects and suggests excluding build folders for better performance.' }
            ];
        }

        const selectedTip = tips[Math.floor(Math.random() * tips.length)];
        
        const message = `💡 **Tip**: ${selectedTip.title}\n${selectedTip.description}`;
        
        const action = await vscode.window.showInformationMessage(
            message,
            'Show More Tips',
            'Got it!'
        );

        if (action === 'Show More Tips') {
            await this.showFeatureTour();
        }
    }

    /**
     * Show focused "What's New" for existing users
     */
    async showWhatsNew(version) {
        try {
            const panel = vscode.window.createWebviewPanel(
                'explorerDatesWhatsNew',
                `Explorer Dates v${version} - What's New`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: false
                }
            );

            // Lazy load webview assets
            const html = await this._generateWhatsNewHTML(version);
            panel.webview.html = html;
            
            // Handle interactions
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'openSettings':
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                        panel.dispose();
                        break;
                    case 'tryFeature':
                        // Demo a specific new feature
                        if (message.feature === 'badgePriority') {
                            await this._settings.updateSetting('badgePriority', 'author', {
                                scope: 'user',
                                reason: 'whats-new-demo'
                            });
                            vscode.window.showInformationMessage('Badge priority set to author! You should see author initials on files now.');
                        }
                        break;
                    case 'dismiss':
                        panel.dispose();
                        break;
                }
            });

        } catch (error) {
            this._logger.error('Failed to show what\'s new', error);
        }
    }

    /**
     * Generate HTML for What's New panel with lazy-loaded assets
     */
    async _generateWhatsNewHTML(version) {
        // Try to load assets from chunk first
        try {
            const { loadOnboardingAssets } = require('./chunks/onboarding-chunk');
            const assets = await loadOnboardingAssets();
            
            if (assets) {
                this._logger.debug('Using chunked onboarding assets for what\'s new');
                return await assets.getWhatsNewHTML(version);
            }
        } catch (error) {
            this._logger.warn('Failed to load chunked assets for what\'s new, using inline fallback', error);
        }
        
        // Fallback to inline template for compatibility
        return this._generateWhatsNewHTMLInline(version);
    }

    /**
     * Generate HTML for What's New panel (inline fallback)
     */
    _generateWhatsNewHTMLInline(version) {
        // Minimal fallback to keep bundle small; detailed content loads from chunked assets
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${version}</h1><p>Full content loads on demand.</p></body></html>`;
    }
}

module.exports = { OnboardingManager };
