const vscode = require('vscode');
const { getLogger } = require('./logger');
const { getLocalization } = require('./localization');

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
        
        const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
        const [savedMajor, savedMinor] = this._onboardingVersion.split('.').map(Number);
        
        // Show for major version updates or significant minor updates
        return currentMajor > savedMajor || 
               (currentMajor === savedMajor && currentMinor > savedMinor);
    }

    /**
     * Show welcome message and start onboarding flow
     */
    async showWelcomeMessage() {
        try {
            const extensionVersion = this._context.extension.packageJSON.version;
            const isUpdate = this._hasShownWelcome;
            
            const message = isUpdate ?
                `Explorer Dates has been updated to v${extensionVersion} with new features and improvements!` :
                'See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!';
            
            const action = await vscode.window.showInformationMessage(
                message,
                { modal: false },
                '🚀 Quick Setup',
                '📖 Feature Tour',
                '⚙️ Settings',
                'Maybe Later'
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
                case '⚙️ Settings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                    break;
            }

            this._logger.info('Welcome message shown', { action, isUpdate });
            
        } catch (error) {
            this._logger.error('Failed to show welcome message', error);
        }
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

            panel.webview.html = this._generateSetupWizardHTML();
            
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
                for (const [key, value] of Object.entries(preset.settings)) {
                    await config.update(key, value, vscode.ConfigurationTarget.Global);
                }
                this._logger.info(`Applied preset: ${configuration.preset}`, preset.settings);
            }
        }
        
        // Apply individual settings
        if (configuration.individual) {
            for (const [key, value] of Object.entries(configuration.individual)) {
                await config.update(key, value, vscode.ConfigurationTarget.Global);
            }
            this._logger.info('Applied individual settings', configuration.individual);
        }
    }

    /**
     * Get configuration presets for different use cases
     */
    _getConfigurationPresets() {
        return {
            minimal: {
                name: 'Minimal',
                description: 'Clean and simple - just show modification times',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'none',
                    showFileSize: false,
                    showGitInfo: 'none',
                    fadeOldFiles: false
                }
            },
            developer: {
                name: 'Developer',
                description: 'Perfect for development - includes Git info and file sizes',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'recency',
                    showFileSize: true,
                    showGitInfo: 'author',
                    fadeOldFiles: true,
                    fadeThreshold: 30,
                    enableContextMenu: true,
                    showStatusBar: true
                }
            },
            powerUser: {
                name: 'Power User',
                description: 'All features enabled - maximum information',
                settings: {
                    dateDecorationFormat: 'smart',
                    colorScheme: 'file-type',
                    showFileSize: true,
                    fileSizeFormat: 'auto',
                    showGitInfo: 'both',
                    fadeOldFiles: true,
                    fadeThreshold: 14,
                    enableContextMenu: true,
                    showStatusBar: true,
                    smartExclusions: true,
                    progressiveLoading: true,
                    persistentCache: true
                }
            },
            accessible: {
                name: 'Accessible',
                description: 'High contrast and screen reader friendly',
                settings: {
                    dateDecorationFormat: 'relative-long',
                    colorScheme: 'none',
                    highContrastMode: true,
                    showFileSize: false,
                    showGitInfo: 'none',
                    fadeOldFiles: false
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

            panel.webview.html = this._generateFeatureTourHTML();
            
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
     * Generate HTML for setup wizard
     */
    _generateSetupWizardHTML() {
        const presets = this._getConfigurationPresets();
        const presetOptions = Object.entries(presets).map(([key, preset]) => `
            <div class="preset-option" data-preset="${key}">
                <h3>${preset.name}</h3>
                <p>${preset.description}</p>
                <div class="preset-settings">
                    ${Object.entries(preset.settings).map(([setting, value]) => 
                        `<span class="setting-tag">${setting}: ${value}</span>`
                    ).join('')}
                </div>
            </div>
        `).join('');

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

                    function applyConfiguration() {
                        if (selectedPreset) {
                            vscode.postMessage({
                                command: 'applyConfiguration',
                                configuration: { preset: selectedPreset }
                            });
                        } else {
                            alert('Please select a configuration preset first.');
                        }
                    }

                    function openSettings() {
                        vscode.postMessage({ command: 'openSettings' });
                    }

                    function skipSetup() {
                        vscode.postMessage({ command: 'skipSetup' });
                    }
                </script>
            </body>
            </html>
        `;
    }

    /**
     * Generate HTML for feature tour
     */
    _generateFeatureTourHTML() {
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
}

module.exports = { OnboardingManager };