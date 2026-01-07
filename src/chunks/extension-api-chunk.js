/**
 * Extension API Chunk Entry Point
 * Exports the ExtensionApiManager for lazy loading
 */

const { ExtensionApiManager } = require('../extensionApi');
const { getLogger } = require('../utils/logger');
const logger = getLogger();

function createExtensionApiManager(context) {
    try {
        const manager = new ExtensionApiManager();
        if (context && context.subscriptions) {
            context.subscriptions.push(manager);
        }
        return manager;
    } catch (error) {
        logger.error('Failed to create Extension API Manager:', error);
        return null;
    }
}

module.exports = {
    ExtensionApiManager,
    createExtensionApiManager,
    default: { ExtensionApiManager, createExtensionApiManager }
};
