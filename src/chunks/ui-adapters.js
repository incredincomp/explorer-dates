/**
 * UI Adapters Chunk - Theme and Accessibility Managers
 * 
 * This chunk is conditionally loaded only when autoThemeAdaptation or accessibilityMode
 * settings are enabled, reducing bundle size for scenarios where these features aren't needed.
 * 
 * @file ui-adapters.js
 */

const vscode = require('vscode');
const { getLogger } = require('../utils/logger');
const logger = getLogger();

// Lazy load managers only when this chunk is loaded
let ThemeIntegrationManager = null;
let AccessibilityManager = null;

/**
 * Initialize and get theme integration manager
 * @returns {import('../themeIntegration').ThemeIntegrationManager|null}
 */
function getThemeManager() {
    if (!ThemeIntegrationManager) {
        try {
            const { ThemeIntegrationManager: Manager } = require('../themeIntegration');
            ThemeIntegrationManager = Manager;
        } catch (error) {
            logger.warn('Failed to load ThemeIntegrationManager', error);
            return null;
        }
    }
    return new ThemeIntegrationManager();
}

/**
 * Initialize and get accessibility manager
 * @returns {import('../accessibility').AccessibilityManager|null}
 */
function getAccessibilityManager() {
    if (!AccessibilityManager) {
        try {
            const { AccessibilityManager: Manager } = require('../accessibility');
            AccessibilityManager = Manager;
        } catch (error) {
            logger.warn('Failed to load AccessibilityManager', error);
            return null;
        }
    }
    return new AccessibilityManager();
}

/**
 * Create UI adapters based on current configuration
 * @returns {Promise<{themeManager: any, accessibilityManager: any}>}
 */
async function createUIAdapters() {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const autoThemeAdaptation = config.get('autoThemeAdaptation', true);
    const accessibilityMode = config.get('accessibilityMode', false);
    
    const adapters = {
        themeManager: null,
        accessibilityManager: null
    };
    
    // Only create managers if their respective features are enabled
    if (autoThemeAdaptation) {
        try {
            adapters.themeManager = getThemeManager();
        } catch (error) {
            logger.warn('Failed to create theme manager', error);
        }
    }
    
    if (accessibilityMode) {
        try {
            adapters.accessibilityManager = getAccessibilityManager();
        } catch (error) {
            logger.warn('Failed to create accessibility manager', error);
        }
    }
    
    return adapters;
}

/**
 * Check if UI adapters should be loaded based on current settings
 * @returns {boolean}
 */
function shouldLoadUIAdapters() {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const autoThemeAdaptation = config.get('autoThemeAdaptation', true);
    const accessibilityMode = config.get('accessibilityMode', false);
    
    return autoThemeAdaptation || accessibilityMode;
}

module.exports = {
    createUIAdapters,
    shouldLoadUIAdapters,
    getThemeManager,
    getAccessibilityManager
};
