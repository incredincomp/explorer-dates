/**
 * Onboarding chunk - lazy loaded module
 * Now includes lazy loading of webview assets
 */

let OnboardingManager = null;
let _createOnboardingManager = null;
const { getLogger } = require('../utils/logger');
const logger = getLogger();
const vscode = require('vscode');
const { getSettingsCoordinator } = require('../utils/settingsCoordinator');

const FALLBACK_PRESETS = {
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
    },
    powerUser: {
        name: 'Power User',
        description: 'All features enabled: Git badges, sizes, colors, and status bar details',
        hidden: true,
        settings: {
            dateDecorationFormat: 'smart',
            colorScheme: 'vibrant',
            showFileSize: true,
            showGitInfo: 'both',
            badgePriority: 'author',
            fadeOldFiles: true,
            enableContextMenu: true,
            showStatusBar: true,
            highContrastMode: false,
            accessibilityMode: false
        }
    },
    gitFocused: {
        name: 'Git-Focused',
        description: 'Prioritize Git authorship and commit details',
        hidden: true,
        settings: {
            dateDecorationFormat: 'smart',
            colorScheme: 'subtle',
            showFileSize: false,
            showGitInfo: 'both',
            badgePriority: 'author',
            fadeOldFiles: false,
            enableContextMenu: true,
            showStatusBar: true,
            highContrastMode: false,
            accessibilityMode: false
        }
    }
};

class FallbackOnboardingManager {
    constructor(context) {
        this._context = context;
        this._settings = getSettingsCoordinator();
    }

    async showQuickSetupWizard() {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesSetup',
            'Explorer Dates Quick Setup',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const presets = await this._getPresets();
        const assets = await loadOnboardingAssets();
        if (assets && typeof assets.getSetupWizardHTML === 'function') {
            panel.webview.html = await assets.getSetupWizardHTML(presets);
        } else {
            panel.webview.html = this._getMinimalSetupHtml();
        }

        panel.webview.onDidReceiveMessage(async (message) => {
            await this._handleSetupWizardMessage(message, panel);
        });
    }

    async showFeatureTour() {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesFeatureTour',
            'Explorer Dates Feature Tour',
            vscode.ViewColumn.One,
            { enableScripts: false, retainContextWhenHidden: false }
        );
        const assets = await loadOnboardingAssets();
        if (assets && typeof assets.getFeatureTourHTML === 'function') {
            panel.webview.html = await assets.getFeatureTourHTML();
        } else {
            panel.webview.html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates Feature Tour</h1><p>Feature tour is unavailable in this session.</p></body></html>`;
        }
    }

    async showWhatsNew(version = '') {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesWhatsNew',
            `Explorer Dates ${version ? `v${version}` : ''} - What's New`,
            vscode.ViewColumn.One,
            { enableScripts: false, retainContextWhenHidden: false }
        );
        const assets = await loadOnboardingAssets();
        if (assets && typeof assets.getWhatsNewHTML === 'function') {
            panel.webview.html = await assets.getWhatsNewHTML(version);
        } else {
            panel.webview.html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${version}</h1><p>What's new content is unavailable in this session.</p></body></html>`;
        }
    }

    async showWelcomeMessage() {
        await vscode.window.showInformationMessage('Explorer Dates onboarding is unavailable. Open settings to configure.', 'Open Settings')
            .then((choice) => {
                if (choice === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                }
            });
    }

    async _getPresets() {
        try {
            const assets = await loadOnboardingAssets();
            if (assets && typeof assets.getPresets === 'function') {
                return assets.getPresets();
            }
        } catch {
            // ignore
        }
        return FALLBACK_PRESETS;
    }

    _getMinimalSetupHtml() {
        return `<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>The onboarding UI could not be fully loaded in this session.</p>
                <p>Please open settings to configure Explorer Dates manually.</p>
            </body>
            </html>`;
    }

    async _handleSetupWizardMessage(message, panel) {
        try {
            switch (message.command) {
                case 'applyConfiguration':
                    await this._applyQuickConfiguration(message.configuration);
                    if (this._context?.globalState?.update) {
                        await this._context.globalState.update('explorerDates.hasCompletedSetup', true);
                    }
                    vscode.window.showInformationMessage('✅ Explorer Dates configured successfully!');
                    panel.dispose();
                    break;
                case 'previewConfiguration':
                    if (message.settings) {
                        await vscode.commands.executeCommand('explorerDates.previewConfiguration', message.settings);
                    }
                    break;
                case 'clearPreview':
                    await vscode.commands.executeCommand('explorerDates.clearPreview');
                    break;
                case 'skipSetup':
                    if (this._context?.globalState?.update) {
                        await this._context.globalState.update('explorerDates.hasCompletedSetup', true);
                    }
                    panel.dispose();
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                    panel.dispose();
                    break;
            }
        } catch (error) {
            logger.warn('Fallback onboarding message handling failed', error);
        }
    }

    async _applyQuickConfiguration(configuration = {}) {
        if (!configuration) return;
        try {
            if (configuration.preset) {
                const presets = await this._getPresets();
                const preset = presets[configuration.preset];
                if (preset?.settings) {
                    await this._settings.applySettings(preset.settings, {
                        scope: 'user',
                        reason: `onboarding-preset:${configuration.preset}`
                    });
                }
            }

            if (configuration.individual) {
                await this._settings.applySettings(configuration.individual, {
                    scope: 'user',
                    reason: 'onboarding-individual'
                });
            }

            try {
                await vscode.commands.executeCommand('explorerDates.refreshDateDecorations');
            } catch {
                // ignore
            }
        } catch (error) {
            logger.warn('Fallback onboarding apply failed', error);
        }
    }
}

async function _ensureOnboardingLogic() {
    if (OnboardingManager && _createOnboardingManager) return;
    try {
        const chunk = await import('./onboarding-logic-chunk.js');
        OnboardingManager = chunk.OnboardingManager || chunk.default?.OnboardingManager || chunk.default;
        _createOnboardingManager = chunk.createOnboardingManager;
        if (typeof _createOnboardingManager !== 'function' && typeof OnboardingManager === 'function') {
            _createOnboardingManager = (context) => new OnboardingManager(context);
        }
        if (typeof _createOnboardingManager !== 'function') {
            throw new Error('Onboarding logic loaded without a valid factory');
        }
    } catch {
        // Fallback: try dynamic import of local module (dev fallback)
        try {
            const mod = await import('../onboarding.js');
            OnboardingManager = mod.OnboardingManager || mod.default?.OnboardingManager || mod.default;
            _createOnboardingManager = mod.createOnboardingManager;
            if (typeof _createOnboardingManager !== 'function' && typeof OnboardingManager === 'function') {
                _createOnboardingManager = (context) => new OnboardingManager(context);
            }
            if (typeof _createOnboardingManager !== 'function') {
                throw new Error('Onboarding fallback loaded without a valid factory');
            }
        } catch (e) {
            logger.warn('Onboarding logic unavailable, using minimal fallback', e);
            OnboardingManager = FallbackOnboardingManager;
            _createOnboardingManager = (context) => new FallbackOnboardingManager(context);
        }
    }
}

// Lazy loader for onboarding assets
let assetsLoaded = false;
let onboardingAssets = null;

const loadOnboardingAssets = async () => {
    if (assetsLoaded && onboardingAssets) {
        return onboardingAssets;
    }
    
    try {
        // Dynamically import the assets chunk only when needed
        const assetsModule = require('./onboarding-assets-chunk');
        onboardingAssets = assetsModule.createOnboardingAssets();
        await onboardingAssets.initialize(); // Make sure to initialize
        assetsLoaded = true;
        
        logger.info('Onboarding webview assets loaded', { chunk: 'onboarding-assets', estimatedKB: 23 });
        return onboardingAssets;
        
    } catch (error) {
        logger.warn('Failed to load onboarding assets, falling back to inline templates', error);
        return null;
    }
};

module.exports = {
    OnboardingManager,
    createOnboardingManager: async (context) => {
        await _ensureOnboardingLogic();
        return _createOnboardingManager(context);
    },
    loadOnboardingAssets,
    getAssetsMemoryInfo: () => {
        if (onboardingAssets) {
            return onboardingAssets.getMemoryInfo();
        }
        return { 
            loaded: assetsLoaded,
            templatesLoaded: assetsLoaded, 
            chunkName: 'onboarding-assets',
            estimatedSize: '~23KB'
        };
    }
};
