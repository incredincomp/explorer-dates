/**
 * Onboarding chunk - lazy loaded module
 * Now includes lazy loading of webview assets
 */

const { OnboardingManager } = require('../onboarding');
const { getLogger } = require('../utils/logger');
const logger = getLogger();

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
    createOnboardingManager: (context) => new OnboardingManager(context),
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
