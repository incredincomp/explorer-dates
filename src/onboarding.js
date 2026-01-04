const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { getLocalization } = require('./utils/localization');

/**
 * Onboarding Manager for first-time users and feature discovery
 */
class OnboardingManager {
    constructor(context) {
        this._context = context;
        this._logger = getLogger();
        this._l10n = getLocalization();
        
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
        const config = vscode.workspace.getConfiguration('explorerDates');
        
        // Apply selected configuration
        if (configuration.preset) {
            const presets = this._getConfigurationPresets();
            const preset = presets[configuration.preset];
            
            if (preset) {
                this._logger.info(`Applying preset: ${configuration.preset}`, preset.settings);
                
                for (const [key, value] of Object.entries(preset.settings)) {
                    await config.update(key, value, vscode.ConfigurationTarget.Global);
                    this._logger.debug(`Updated setting: explorerDates.${key} = ${value}`);
                }
                
                this._logger.info(`Applied preset: ${configuration.preset}`, preset.settings);
                
                // Show confirmation to user
                vscode.window.showInformationMessage(`Applied "${preset.name}" configuration. Changes should be visible immediately!`);
            }
        }
        
        // Apply individual settings
        if (configuration.individual) {
            for (const [key, value] of Object.entries(configuration.individual)) {
                await config.update(key, value, vscode.ConfigurationTarget.Global);
            }
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
    _getConfigurationPresets() {
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
                    highContrastMode: false,
                    showFileSize: true,
                    fileSizeFormat: 'auto',
                    showGitInfo: 'author',
                    badgePriority: 'time',
                    fadeOldFiles: true,
                    fadeThreshold: 30,
                    enableContextMenu: true,
                    showStatusBar: true
                }
            },
            powerUser: {
                name: 'Power User',
                description: 'Maximum information - all features enabled with vibrant colors',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'vibrant',
                    highContrastMode: false,
                    showFileSize: true,
                    fileSizeFormat: 'auto',
                    showGitInfo: 'both',
                    badgePriority: 'time',
                    fadeOldFiles: true,
                    fadeThreshold: 14,
                    enableContextMenu: true,
                    showStatusBar: true,
                    smartExclusions: true,
                    progressiveLoading: true,
                    persistentCache: true
                }
            },
            gitFocused: {
                name: 'Git-Focused',
                description: 'Show author initials as badges with full Git information in tooltips',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'file-type',
                    highContrastMode: false,
                    showFileSize: false,
                    showGitInfo: 'both',
                    badgePriority: 'author',
                    fadeOldFiles: false,
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
        const allPresets = this._getConfigurationPresets();
        
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
        
        // Fallback to inline template for compatibility
        
        const presetOptions = Object.entries(simplifiedPresets).map(([key, preset]) => `
            <div class="preset-option" data-preset="${key}" 
                 onmouseenter="previewConfiguration({preset: '${key}'})" 
                 onmouseleave="clearPreview()">
                <h3>${preset.name}</h3>
                <p>${preset.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${key}'})">👁️ Preview</button>
                    <button onclick="applyConfiguration({preset: '${key}'})">✅ Select ${preset.name}</button>
                </div>
            </div>
        `).join('');

        // Add a link to see more options for power users
        const moreOptionsLink = `
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .step {
                        margin-bottom: 30px;
                        padding: 20px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                    }
                    .preset-option {
                        border: 2px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 15px;
                        margin: 10px 0;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .preset-option:hover {
                        border-color: var(--vscode-focusBorder);
                        background: var(--vscode-list-hoverBackground);
                    }
                    .preset-option.selected {
                        border-color: var(--vscode-focusBorder);
                        background: var(--vscode-list-activeSelectionBackground);
                    }
                    .preset-actions {
                        margin-top: 10px;
                        display: flex;
                        gap: 8px;
                    }
                    .preset-actions button {
                        padding: 6px 12px;
                        border: 1px solid var(--vscode-button-border);
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .preset-actions button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .preset-settings {
                        margin-top: 10px;
                    }
                    .setting-tag {
                        display: inline-block;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 11px;
                        margin: 2px;
                    }
                    .buttons {
                        text-align: center;
                        margin-top: 30px;
                    }
                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .btn.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .btn.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    .more-options {
                        margin-top: 20px;
                        padding: 15px;
                        background: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textLink-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .more-options a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                        font-weight: bold;
                    }
                    .more-options a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚀 Welcome to Explorer Dates!</h1>
                    <p>Let's get you set up with the perfect configuration for your workflow.</p>
                </div>

                <div class="step">
                    <h2>📋 Choose Your Configuration</h2>
                    <p>Select a preset that matches your needs, or skip to configure manually:</p>
                    
                    ${presetOptions}
                    
                    ${moreOptionsLink}
                </div>

                <div class="buttons">
                    <button class="btn" onclick="applyConfiguration()">Apply Configuration</button>
                    <button class="btn secondary" onclick="openSettings()">Manual Setup</button>
                    <button class="btn secondary" onclick="skipSetup()">Skip for Now</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let selectedPreset = null;

                    // Handle preset selection
                    document.querySelectorAll('.preset-option').forEach(option => {
                        option.addEventListener('click', () => {
                            document.querySelectorAll('.preset-option').forEach(o => o.classList.remove('selected'));
                            option.classList.add('selected');
                            selectedPreset = option.dataset.preset;
                        });
                    });

                    function applyConfiguration(config) {
                        if (config) {
                            vscode.postMessage({
                                command: 'applyConfiguration',
                                configuration: config
                            });
                        } else if (selectedPreset) {
                            vscode.postMessage({
                                command: 'applyConfiguration',
                                configuration: { preset: selectedPreset }
                            });
                        } else {
                            alert('Please select a configuration preset first.');
                        }
                    }

                    function previewConfiguration(config) {
                        const presets = ${JSON.stringify(simplifiedPresets)};
                        if (config.preset && presets[config.preset]) {
                            vscode.postMessage({
                                command: 'previewConfiguration',
                                settings: presets[config.preset].settings
                            });
                        }
                    }

                    function clearPreview() {
                        vscode.postMessage({
                            command: 'clearPreview'
                        });
                    }

                    function openSettings() {
                        vscode.postMessage({ command: 'openSettings' });
                    }

                    function skipSetup() {
                        vscode.postMessage({ command: 'skipSetup' });
                    }
                    
                    function showAllPresets() {
                        applyConfiguration({preset: 'powerUser'});
                    }
                    
                    function showGitFocused() {
                        applyConfiguration({preset: 'gitFocused'});
                    }
                </script>
            </body>
            </html>
        `;
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
        
        // Fallback to inline template for compatibility
        return this._generateFeatureTourHTMLInline();
    }

    /**
     * Generate HTML for feature tour (inline fallback)
     */
    _generateFeatureTourHTMLInline() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        max-width: 900px;
                        margin: 0 auto;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                    }
                    .feature-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .feature-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 20px;
                        transition: transform 0.2s;
                    }
                    .feature-card:hover {
                        transform: translateY(-2px);
                        border-color: var(--vscode-focusBorder);
                    }
                    .feature-icon {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }
                    .feature-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .feature-description {
                        margin-bottom: 15px;
                        line-height: 1.5;
                    }
                    .feature-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-decoration: none;
                    }
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .btn.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1>🎯 Explorer Dates Features</h1>
                    <p>Discover all the powerful features available to enhance your file management experience.</p>
                </div>

                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🕐</div>
                        <div class="feature-title">Smart Time Display</div>
                        <div class="feature-description">
                            See modification times with intelligent formatting - relative for recent files, absolute for older ones.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('dateDecorationFormat')">Configure</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🎨</div>
                        <div class="feature-title">Color Schemes</div>
                        <div class="feature-description">
                            Color-code files by age, file type, or create custom color schemes for better visual organization.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('colorScheme')">Set Colors</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <div class="feature-title">File Sizes</div>
                        <div class="feature-description">
                            Display file sizes alongside modification times with smart formatting and visual distinction.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showFileSize')">Enable</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🔗</div>
                        <div class="feature-title">Git Integration</div>
                        <div class="feature-description">
                            Show Git author initials and access file history directly from the Explorer context menu.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showGitInfo')">Configure Git</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <div class="feature-title">Status Bar</div>
                        <div class="feature-description">
                            Optional status bar showing current file info with click-to-expand detailed information.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showStatusBar')">Enable</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🚀</div>
                        <div class="feature-title">Performance</div>
                        <div class="feature-description">
                            Smart exclusions, batch processing, and advanced caching for optimal performance in large projects.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="runCommand('explorerDates.showPerformanceAnalytics')">View Analytics</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <div class="feature-title">Workspace Analytics</div>
                        <div class="feature-description">
                            Analyze file activity patterns across your workspace with detailed modification statistics.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="runCommand('explorerDates.showWorkspaceActivity')">View Activity</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🎛️</div>
                        <div class="feature-title">Context Menus</div>
                        <div class="feature-description">
                            Right-click files for quick access to date copying, Git history, and file comparisons.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('enableContextMenu')">Enable</button>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn" onclick="openSetting('')">Open All Settings</button>
                    <button class="btn secondary" onclick="runCommand('explorerDates.showMetrics')">View Metrics</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function openSetting(setting) {
                        vscode.postMessage({
                            command: 'openSettings',
                            setting: setting ? 'explorerDates.' + setting : 'explorerDates'
                        });
                    }

                    function runCommand(commandId) {
                        vscode.postMessage({
                            command: 'runCommand',
                            commandId: commandId
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    /**
     * Show tips and tricks for power users
     */
    async showTipsAndTricks() {
        const tips = [
            {
                icon: '⌨️',
                title: 'Keyboard Shortcuts',
                description: 'Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off.'
            },
            {
                icon: '🎯',
                title: 'Smart Exclusions',
                description: 'The extension automatically detects and suggests excluding build folders for better performance.'
            },
            {
                icon: '📊',
                title: 'Performance Analytics',
                description: 'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'
            },
            {
                icon: '🔍',
                title: 'Context Menu',
                description: 'Right-click any file to access Git history, file details, and quick actions.'
            }
        ];

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
                            const config = vscode.workspace.getConfiguration('explorerDates');
                            await config.update('badgePriority', 'author', vscode.ConfigurationTarget.Global);
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
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                        line-height: 1.6;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    
                    .version {
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 10px;
                    }
                    
                    .subtitle {
                        color: var(--vscode-descriptionForeground);
                        font-size: 16px;
                    }
                    
                    .feature {
                        margin-bottom: 25px;
                        padding: 15px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 8px;
                        border-left: 4px solid var(--vscode-textLink-foreground);
                    }
                    
                    .feature-icon {
                        font-size: 20px;
                        margin-right: 10px;
                    }
                    
                    .feature-title {
                        font-weight: bold;
                        font-size: 18px;
                        margin-bottom: 8px;
                    }
                    
                    .feature-description {
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 10px;
                    }
                    
                    .try-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .try-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .actions {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    
                    .action-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 12px 24px;
                        margin: 0 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="version">Explorer Dates v${version}</div>
                    <div class="subtitle">New features and improvements</div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">🏷️</span>
                        Badge Priority Settings
                    </div>
                    <div class="feature-description">
                        Choose what appears in your file badges: modification time, author initials, or file size. Perfect for teams who want to see who last worked on files at a glance.
                    </div>
                    <button class="try-button" onclick="tryFeature('badgePriority')">Try Author Badges</button>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">🎭</span>
                        Live Preview in Setup
                    </div>
                    <div class="feature-description">
                        The Quick Setup wizard now shows live previews of your configuration choices, so you can see exactly how your files will look before applying settings.
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">♿</span>
                        Enhanced Accessibility
                    </div>
                    <div class="feature-description">
                        Improved screen reader support, high contrast mode, and detailed tooltips make the extension more accessible to all users.
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">📝</span>
                        Rich Tooltips
                    </div>
                    <div class="feature-description">
                        File tooltips now include comprehensive information with emojis: file details, Git history, line counts for code files, and more.
                    </div>
                </div>

                <div class="actions">
                    <button class="action-button" onclick="openSettings()">⚙️ Open Settings</button>
                    <button class="action-button" onclick="dismiss()">✅ Got it!</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function tryFeature(feature) {
                        vscode.postMessage({
                            command: 'tryFeature',
                            feature: feature
                        });
                    }

                    function openSettings() {
                        vscode.postMessage({
                            command: 'openSettings'
                        });
                    }

                    function dismiss() {
                        vscode.postMessage({
                            command: 'dismiss'
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
}

module.exports = { OnboardingManager };
