/**
 * Onboarding chunk - lazy loaded module
 * Now includes lazy loading of webview assets
 */

let OnboardingManager = null;
let _createOnboardingManager = null;
const { getLogger } = require('../utils/logger');
const logger = getLogger();
const vscode = require('vscode');

class FallbackOnboardingManager {
    constructor(context) {
        this._context = context;
    }

    async showQuickSetupWizard() {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesSetup',
            'Explorer Dates Quick Setup',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        panel.webview.html = `<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>The onboarding UI could not be fully loaded in this session.</p>
                <p>Please open settings to configure Explorer Dates manually.</p>
            </body>
            </html>`;
    }

    async showFeatureTour() {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesFeatureTour',
            'Explorer Dates Feature Tour',
            vscode.ViewColumn.One,
            { enableScripts: false, retainContextWhenHidden: false }
        );
        panel.webview.html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates Feature Tour</h1><p>Feature tour is unavailable in this session.</p></body></html>`;
    }

    async showWhatsNew(version = '') {
        const panel = vscode.window.createWebviewPanel(
            'explorerDatesWhatsNew',
            `Explorer Dates ${version ? `v${version}` : ''} - What's New`,
            vscode.ViewColumn.One,
            { enableScripts: false, retainContextWhenHidden: false }
        );
        panel.webview.html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${version}</h1><p>What's new content is unavailable in this session.</p></body></html>`;
    }

    async showWelcomeMessage() {
        await vscode.window.showInformationMessage('Explorer Dates onboarding is unavailable. Open settings to configure.', 'Open Settings')
            .then((choice) => {
                if (choice === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates');
                }
            });
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
