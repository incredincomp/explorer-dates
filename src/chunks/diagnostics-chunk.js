/**
 * Diagnostics chunk - lazy loaded when performance metrics are requested
 * Contains HTML generators, template store, and diagnostic utilities
 */

const htmlGenerators = require('../utils/htmlGenerators');
const { templateStore, initializeTemplateStore } = require('../utils/templateStore');

// Ensure template store is initialized on first load
let isInitialized = false;

function ensureInitialized(context) {
    if (!isInitialized && context) {
        initializeTemplateStore(context);
        isInitialized = true;
    }
}

module.exports = {
    ...htmlGenerators,
    templateStore,
    initializeTemplateStore,
    ensureInitialized
};