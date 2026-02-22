/**
 * Onboarding chunk - lazy loaded module
 * Now includes lazy loading of webview assets
 */

let OnboardingManager = null;
let _createOnboardingManager = null;
const { getLogger } = require('../utils/logger');
const logger = getLogger();

async function _ensureOnboardingLogic() {
    if (OnboardingManager && _createOnboardingManager) return;
    try {
        const chunk = await import('./onboarding-logic-chunk.js');
        OnboardingManager = chunk.OnboardingManager;
        _createOnboardingManager = chunk.createOnboardingManager;
    } catch {
        // Fallback: try dynamic import of local module (dev fallback)
        try {
            const mod = await import('../onboarding.js');
            OnboardingManager = mod.OnboardingManager;
            _createOnboardingManager = (context) => new OnboardingManager(context);
        } catch (e) {
            logger.warn('Onboarding logic unavailable', e);
            throw e;
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
