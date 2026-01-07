const FEATURE_FLAGS_GLOBAL_KEY = '__explorerDatesFeatureFlags';

function registerFeatureFlagsGlobal(instance) {
    if (!instance) {
        return;
    }
    try {
        if (typeof globalThis !== 'undefined') {
            globalThis[FEATURE_FLAGS_GLOBAL_KEY] = instance;
        }
    } catch {
        // Ignore environments that do not expose globalThis
    }
}

function loadFeatureFlagsFallback() {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            return dynamicRequire('../featureFlags');
        }
    } catch {
        // Ignore if dynamic require is unavailable (e.g., browser runtime)
    }
    return null;
}

function getFeatureFlagsGlobal() {
    try {
        if (typeof globalThis !== 'undefined' && globalThis[FEATURE_FLAGS_GLOBAL_KEY]) {
            return globalThis[FEATURE_FLAGS_GLOBAL_KEY];
        }
    } catch {
        // Ignore access errors to globalThis
    }
    return loadFeatureFlagsFallback();
}

module.exports = {
    FEATURE_FLAGS_GLOBAL_KEY,
    registerFeatureFlagsGlobal,
    getFeatureFlagsGlobal
};
