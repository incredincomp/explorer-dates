let impl = null;
try {
    if (typeof require === 'function') {
        impl = require('./file-date-provider-impl');
    }
} catch { /* ignore */ }
if (!impl && typeof globalThis !== 'undefined') {
    const registry = globalThis.explorerDatesChunks || globalThis.__explorerDatesChunks || null;
    if (registry) {
        impl = registry.fileDateProviderImpl || registry['fileDateProviderImpl'] || null;
    }
}
const resolved = impl || {};
module.exports = {
    FileDateDecorationProvider: resolved.FileDateDecorationProvider,
    FileDateDecorationProviderImpl: resolved.FileDateDecorationProviderImpl || resolved.FileDateDecorationProvider
};
