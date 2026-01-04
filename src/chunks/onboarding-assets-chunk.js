/**
 * Onboarding Assets Chunk - Lazy loaded webview assets
 * Contains HTML templates, CSS styles, and JS for onboarding wizard
 * Only loaded when onboarding wizard is launched
 */

const { getLogger } = require('../utils/logger');

class OnboardingAssets {
    constructor() {
        this._logger = getLogger();
        this._templates = null;
        this._initialized = false;
    }

    /**
     * Initialize templates lazily when first requested
     */
    async initialize() {
        if (this._initialized) return;
        
        try {
            this._templates = {
                setupWizardTemplate: this._generateSetupWizardTemplate(),
                featureTourTemplate: this._generateFeatureTourTemplate(),
                whatsNewTemplate: this._generateWhatsNewTemplate(),
                sharedStyles: this._generateSharedStyles(),
                sharedScripts: this._generateSharedScripts()
            };
            
            this._initialized = true;
            this._logger.debug('Onboarding assets initialized (~23KB lazy loaded)');
            
        } catch (error) {
            this._logger.error('Failed to initialize onboarding assets', error);
            throw error;
        }
    }

    /**
     * Get setup wizard HTML template
     */
    async getSetupWizardHTML(presets) {
        await this.initialize();
        return this._fillSetupTemplate(this._templates.setupWizardTemplate, presets);
    }

    /**
     * Get feature tour HTML template
     */
    async getFeatureTourHTML() {
        await this.initialize();
        return this._templates.featureTourTemplate;
    }

    /**
     * Get what's new HTML template
     */
    async getWhatsNewHTML(version) {
        await this.initialize();
        return this._fillWhatsNewTemplate(this._templates.whatsNewTemplate, version);
    }

    /**
     * Fill setup wizard template with preset data
     */
    _fillSetupTemplate(template, presets) {
        const presetOptions = Object.entries(presets).map(([key, preset]) => `
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

        const moreOptionsLink = `
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `;

        return template
            .replace('{{PRESET_OPTIONS}}', presetOptions)
            .replace('{{MORE_OPTIONS_LINK}}', moreOptionsLink)
            .replace('{{PRESETS_JSON}}', JSON.stringify(presets));
    }

    /**
     * Fill what's new template with version info
     */
    _fillWhatsNewTemplate(template, version) {
        return template.replace(/{{VERSION}}/g, version);
    }

    /**
     * Generate setup wizard template (split from main onboarding.js)
     */
    _generateSetupWizardTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    ${this._generateSharedStyles()}
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
                    <p><small><!-- Powered by lazy loaded onboarding assets chunk (~23KB) --></small></p>
                </div>

                <div class="step">
                    <h2>📋 Choose Your Configuration</h2>
                    <p>Select a preset that matches your needs, or skip to configure manually:</p>
                    
                    {{PRESET_OPTIONS}}
                    
                    {{MORE_OPTIONS_LINK}}
                </div>

                <div class="buttons">
                    <button class="btn" onclick="applyConfiguration()">Apply Configuration</button>
                    <button class="btn secondary" onclick="openSettings()">Manual Setup</button>
                    <button class="btn secondary" onclick="skipSetup()">Skip for Now</button>
                </div>

                <script>
                    ${this._generateSharedScripts()}
                    
                    // Specific setup wizard functionality
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
                        const presets = {{PRESETS_JSON}};
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
     * Generate feature tour template
     */
    _generateFeatureTourTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    ${this._generateSharedStyles()}
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
                    ${this._generateSharedScripts()}

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
     * Generate what's new template
     */
    _generateWhatsNewTemplate() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    ${this._generateSharedStyles()}
                    
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
                    <div class="version">Explorer Dates v{{VERSION}}</div>
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
                    ${this._generateSharedScripts()}

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

    /**
     * Generate shared CSS styles for all onboarding webviews
     */
    _generateSharedStyles() {
        return `
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                background: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                line-height: 1.6;
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
            .step {
                margin-bottom: 30px;
                padding: 20px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-widget-border);
                border-radius: 8px;
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
                text-decoration: none;
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
        `;
    }

    /**
     * Generate shared JavaScript for all onboarding webviews
     */
    _generateSharedScripts() {
        return `
            const vscode = acquireVsCodeApi();
        `;
    }

    /**
     * Get memory usage info for this chunk
     */
    getMemoryInfo() {
        return {
            chunkName: 'onboarding-assets',
            estimatedSize: '~23KB',
            templatesLoaded: this._initialized,
            templateCount: this._templates ? Object.keys(this._templates).length : 0,
            loaded: this._initialized // Add this for compatibility with test
        };
    }

    /**
     * Clean up resources
     */
    dispose() {
        this._templates = null;
        this._initialized = false;
        this._logger.debug('Onboarding assets disposed');
    }
}

module.exports = {
    OnboardingAssets,
    createOnboardingAssets: () => new OnboardingAssets(),
    getMemoryInfo: (() => {
        let sharedInstance = null;
        return () => {
            if (!sharedInstance) {
                sharedInstance = new OnboardingAssets();
            }
            return sharedInstance.getMemoryInfo();
        };
    })()
};
