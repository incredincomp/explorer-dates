// Factory wrapper to create FileDateDecorationProvider from the provider source.
// Keeping this logic in a chunk prevents the heavy provider code from being included
// in the core activation bundle when chunks are available at runtime.

function createFileDateDecorationProvider(context) {
    // Require the provider implementation from source. When this file is loaded as a
    // runtime chunk it will pull the heavy provider implementation into the chunk
    // rather than into the core bundle.
    const { FileDateDecorationProvider } = require('../fileDateDecorationProvider');
    const provider = new FileDateDecorationProvider();
    // If provider expects context-based initialization, attempt to call initializeAdvancedSystems
    if (typeof provider.initializeAdvancedSystems === 'function') {
        // initializeAdvancedSystems may be async; start it in background
        (async () => {
            try { await provider.initializeAdvancedSystems(context); } catch (e) { provider._logger?.debug?.('provider chunk initializeAdvancedSystems failed', e); }
        })();
    }
    return provider;
}

module.exports = {
    createFileDateDecorationProvider
};