/**
 * Feature flags for optional components to reduce bundle size
 */

const { getLogger } = require('./utils/logger');
const { CHUNK_SIZES } = require('./presetDefinitions');
const { getChunkSourcePath, getAllChunkNames } = require('./shared/chunkMap');
let featureLogger = null;

const DEFAULT_CHUNK_TIMEOUT_MS = Number(process.env.EXPLORER_DATES_CHUNK_TIMEOUT || 5000);
const NETWORK_ERROR_CODES = new Set(['ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ETIMEDOUT', 'EHOSTUNREACH']);
const BUILT_CHUNK_CACHE = new Map();
const CHUNK_METHOD_ALIASES = {
    reporting: 'exportReporting',
    templates: 'workspaceTemplates',
    analysis: 'analysisCommands'
};

const DEV_CHUNK_PATH_CACHE = new Map();

function getDevChunkImportPath(chunkName) {
    if (DEV_CHUNK_PATH_CACHE.has(chunkName)) {
        return DEV_CHUNK_PATH_CACHE.get(chunkName);
    }
    const sourcePath = getChunkSourcePath(chunkName);
    if (!sourcePath) {
        DEV_CHUNK_PATH_CACHE.set(chunkName, null);
        return null;
    }
    let normalized = sourcePath;
    if (normalized.startsWith('src/')) {
        normalized = normalized.slice(4);
    }
    if (!normalized.startsWith('./')) {
        normalized = `./${normalized}`;
    }
    DEV_CHUNK_PATH_CACHE.set(chunkName, normalized);
    return normalized;
}
function resolveNodeDependencies() {
    if (nativeDepsResolved) {
        return !!(nativePath && nativeFs);
    }
    nativeDepsResolved = true;
    if (!isNodeLikeRuntime()) {
        return false;
    }
    try {
        nativePath = eval('require')('path');
        nativeFs = eval('require')('fs');
    } catch {
        nativePath = null;
        nativeFs = null;
    }
    return !!(nativePath && nativeFs);
}
let nativeDepsResolved = false;
let nativePath = null;
let nativeFs = null;

function isWebRuntime() {
    try {
        if (typeof navigator !== 'undefined' && navigator?.userAgent) {
            return navigator.userAgent.includes('vscode-web') || navigator.userAgent.includes('Code - Web');
        }
        return typeof process !== 'undefined' && process?.env?.VSCODE_WEB === 'true';
    } catch {
        return false;
    }
}

function isNodeLikeRuntime() {
    return typeof process !== 'undefined' && !!(process.versions?.node) && !isWebRuntime();
}

function getChunkTimeoutMs() {
    return DEFAULT_CHUNK_TIMEOUT_MS > 0 ? DEFAULT_CHUNK_TIMEOUT_MS : 0;
}

function logFeature(level, message, details) {
    if (!featureLogger) {
        featureLogger = getLogger();
    }
    const logger = featureLogger;
    if (typeof logger[level] === 'function') {
        logger[level](message, details);
    } else {
        logger.info(message, details);
    }
}

function logFeatureDisabled(feature, chunkKey) {
    logFeature('info', 'Feature disabled via configuration', {
        feature,
        savedKB: chunkKey && CHUNK_SIZES[chunkKey] !== undefined ? CHUNK_SIZES[chunkKey] : undefined
    });
}

function isLikelyNetworkIssue(error) {
    if (!error) return false;
    if (error.code && NETWORK_ERROR_CODES.has(error.code)) {
        return true;
    }
    const message = (error.message || '').toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('timed out');
}

function runWithChunkTimeout(factory, chunkName) {
    const timeoutMs = getChunkTimeoutMs();
    const executor = () => {
        try {
            return Promise.resolve(factory());
        } catch (error) {
            return Promise.reject(error);
        }
    };
    
    if (!timeoutMs) {
        return executor();
    }
    
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            const timeoutError = new Error(`Chunk "${chunkName}" load timed out after ${timeoutMs}ms`);
            timeoutError.code = 'CHUNK_TIMEOUT';
            reject(timeoutError);
        }, timeoutMs);
        
        executor()
            .then(result => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(result);
            })
            .catch(error => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                reject(error);
            });
    });
}

function logResolverFailure(chunkName, error) {
    if (!error) return;
    const details = {
        chunkName,
        error: error.message,
        code: error.code,
        networkIssue: isLikelyNetworkIssue(error),
        timedOut: error.code === 'CHUNK_TIMEOUT'
    };
    const level = details.networkIssue || details.timedOut ? 'warn' : 'error';
    logFeature(level, 'Chunk resolver failed', details);
}

function tryLoadBuiltChunk(chunkName) {
    if (!chunkName || !resolveNodeDependencies() || typeof nativeFs?.existsSync !== 'function') {
        return null;
    }

    if (BUILT_CHUNK_CACHE.has(chunkName)) {
        return BUILT_CHUNK_CACHE.get(chunkName);
    }

    const candidates = [];
    if (typeof __dirname === 'string' && nativePath) {
        candidates.push(nativePath.join(__dirname, 'chunks', `${chunkName}.js`));
        candidates.push(nativePath.join(__dirname, '..', 'dist', 'chunks', `${chunkName}.js`));
    }

    for (const candidate of candidates) {
        try {
            if (!candidate || !nativeFs.existsSync(candidate)) {
                continue;
            }
            const chunk = require(candidate);
            const resolved = chunk?.default || chunk;
            BUILT_CHUNK_CACHE.set(chunkName, resolved || null);
            if (resolved) {
                logFeature('info', 'Loaded chunk via built artifact fallback', {
                    chunkName,
                    path: candidate
                });
            }
            return resolved;
        } catch (error) {
            logFeature('warn', 'Built chunk fallback failed', {
                chunkName,
                path: candidate,
                error: error.message
            });
        }
    }

    BUILT_CHUNK_CACHE.set(chunkName, null);
    return null;
}

function tryRequireDevChunk(chunkName) {
    if (isWebRuntime()) {
        return null;
    }
    const importPath = getDevChunkImportPath(chunkName);
    if (!importPath) {
        return null;
    }
    try {
        const module = require(importPath);
        return module?.default || module;
    } catch (error) {
        const shouldLog =
            error.code !== 'MODULE_NOT_FOUND' ||
            (typeof error.message === 'string' && !error.message.includes(importPath));
        if (shouldLog) {
            logFeature('debug', 'Dev chunk require failed', {
                chunkName,
                importPath,
                error: error.message
            });
        }
    }
    return null;
}

function tryRequireLocalBuiltChunk(chunkName) {
    if (isWebRuntime()) {
        return null;
    }
    const importPath = `./chunks/${chunkName}`;
    try {
        const module = require(importPath);
        return module?.default || module;
    } catch (error) {
        const isMissingModule = error.code === 'MODULE_NOT_FOUND';
        if (!isMissingModule) {
            logFeature('debug', 'Local chunk require failed', {
                chunkName,
                importPath,
                error: error.message
            });
        }
    }
    return null;
}

function getSavingsKey(chunkName) {
    if (chunkName in CHUNK_SIZES) {
        return chunkName;
    }
    return CHUNK_METHOD_ALIASES[chunkName] || null;
}

function announceChunkSavings(chunkName) {
    const savingsKey = getSavingsKey(chunkName);
    if (!savingsKey) {
        return;
    }
    const savedKB = CHUNK_SIZES[savingsKey];
    if (!savedKB) {
        return;
    }
    const displayName = savingsKey === chunkName || !chunkName
        ? savingsKey
        : `${savingsKey} (requested as "${chunkName}")`;
    const message = `💾 ${displayName} chunk unavailable - keeping the feature disabled is saving ~${savedKB}KB`;
    logFeature('info', 'Chunk savings applied', {
        chunkName: savingsKey,
        requestedName: chunkName,
        savedKB
    });
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log(message);
    }
}

// Get configuration for feature flags
const getFeatureConfig = () => {
    try {
        const vscode = require('vscode');
        const config = vscode.workspace.getConfiguration('explorerDates');
        return {
            enableOnboarding: config.get('enableOnboardingSystem', true),
            enableExportReporting: config.get('enableExportReporting', true), 
            enableWorkspaceTemplates: config.get('enableWorkspaceTemplates', true),
            enableAnalysisCommands: config.get('enableAnalysisCommands', true),
            enableAdvancedCache: config.get('enableAdvancedCache', true),
            enableWorkspaceIntelligence: config.get('enableWorkspaceIntelligence', true),
            enableIncrementalWorkers: config.get('enableIncrementalWorkers', false),
            enableExtensionApi: config.get('enableExtensionApi', true)
        };
    } catch {
        // Default to all features enabled if VS Code API not available
        return {
            enableOnboarding: true,
            enableExportReporting: true,
            enableWorkspaceTemplates: true, 
            enableAnalysisCommands: true,
            enableAdvancedCache: true,
            enableWorkspaceIntelligence: true,
            enableIncrementalWorkers: false,
            enableExtensionApi: true
        };
    }
};

const featureLoaders = new Map();
let chunkResolver = null;

function setFeatureChunkResolver(resolver) {
    if (resolver && typeof resolver !== 'function') {
        throw new Error('Feature chunk resolver must be a function');
    }
    chunkResolver = resolver || null;
}

function registerFeatureLoader(name, loader) {
    if (typeof loader !== 'function') {
        throw new Error(`Feature loader for "${name}" must be a function`);
    }
    featureLoaders.set(name, loader);
}

function unregisterFeatureLoader(name) {
    featureLoaders.delete(name);
}

function clearFeatureLoaders() {
    featureLoaders.clear();
}

async function loadFeatureModule(name) {
    let loader = featureLoaders.get(name);
    if (!loader && chunkResolver) {
        loader = () => chunkResolver(name);
    }
    if (!loader) {
        logFeature('warn', 'No loader registered for feature', { feature: name });
        return null;
    }
    try {
        return await runWithChunkTimeout(() => loader(), name);
    } catch (error) {
        logFeature('warn', 'Feature loader failed', {
            feature: name,
            error: error.message,
            code: error.code,
            networkIssue: isLikelyNetworkIssue(error)
        });
        announceChunkSavings(name);
        return null;
    }
}

/**
 * Register default loaders for all core modules
 * This preserves testability and CLI script functionality
 * while keeping production federation efficient
 */
function registerDefaultLoaders() {
    const chunkNames = getAllChunkNames();
    chunkNames.forEach((chunkName) => {
        if (!featureLoaders.has(chunkName)) {
            registerFeatureLoader(chunkName, createDefaultLoader(chunkName));
        }
    });
}

/**
 * Create a default loader that tries chunk resolver first, then falls back to source
 * @param {string} chunkName - The chunk name to try via resolver
 * @param {string} sourcePath - The source path to fall back to
 * @returns {Function} Async loader function
 */
function createDefaultLoader(chunkName) {
    return async () => {
        // First try the chunk resolver if available
        if (chunkResolver && typeof chunkResolver === 'function') {
            try {
                const chunk = await runWithChunkTimeout(() => chunkResolver(chunkName), chunkName);
                if (chunk) {
                    return chunk;
                }
                logFeature('info', 'Chunk resolver returned no module', { chunkName });
            } catch (error) {
                logResolverFailure(chunkName, error);
            }
        }
        
        const devChunk = tryRequireDevChunk(chunkName);
        if (devChunk) {
            return devChunk;
        }

        const bundledChunk = tryRequireLocalBuiltChunk(chunkName);
        if (bundledChunk) {
            return bundledChunk;
        }

        const builtChunk = tryLoadBuiltChunk(chunkName);
        if (builtChunk) {
            return builtChunk;
        }

        logFeature('warn', 'No built artifact available for chunk', { chunkName });
        return null;
    };
}

// Feature flag checks with conditional loading
const featureFlags = {
    async onboarding() {
        const config = getFeatureConfig();
        if (!config.enableOnboarding) {
            logFeatureDisabled('onboarding', 'onboarding');
            return null;
        }
        return loadFeatureModule('onboarding');
    },

    async exportReporting() {
        const config = getFeatureConfig();
        if (!config.enableExportReporting) {
            logFeatureDisabled('exportReporting', 'exportReporting');
            return null;
        }
        return loadFeatureModule('reporting');
    },

    async workspaceTemplates() {
        const config = getFeatureConfig();
        if (!config.enableWorkspaceTemplates) {
            logFeatureDisabled('workspaceTemplates', 'workspaceTemplates');
            return null;
        }
        return loadFeatureModule('templates');
    },

    async analysisCommands() {
        const config = getFeatureConfig();
        if (!config.enableAnalysisCommands) {
            logFeatureDisabled('analysisCommands', 'analysisCommands');
            return null;
        }
        return loadFeatureModule('analysis');
    },

    async advancedCache() {
        const config = getFeatureConfig();
        if (!config.enableAdvancedCache) {
            logFeatureDisabled('advancedCache', 'advancedCache');
            return null;
        }
        return loadFeatureModule('advancedCache');
    },

    async workspaceIntelligence() {
        const config = getFeatureConfig();
        if (!config.enableWorkspaceIntelligence) {
            logFeatureDisabled('workspaceIntelligence', 'workspaceIntelligence');
            return null;
        }
        return loadFeatureModule('workspaceIntelligence');
    },

    async incrementalWorkers() {
        const config = getFeatureConfig();
        if (!config.enableIncrementalWorkers) {
            logFeatureDisabled('incrementalWorkers', 'incrementalWorkers');
            return null;
        }
        return loadFeatureModule('incrementalWorkers');
    },

    async extensionApi() {
        const config = getFeatureConfig();
        if (!config.enableExtensionApi) {
            logFeatureDisabled('extensionApi', 'extensionApi');
            return null;
        }
        return loadFeatureModule('extensionApi');
    },

    async uiAdapters() {
        return loadFeatureModule('uiAdapters');
    },

    async batchProcessor() {
        return loadFeatureModule('batchProcessor');
    },

    async gitInsights() {
        // Git insights are loaded conditionally when git features are needed
        // No feature flag check - this is a performance optimization
        return loadFeatureModule('gitInsights');
    },

    // Check if feature is enabled without loading module
    isEnabled(featureName) {
        const config = getFeatureConfig();
        const flags = {
            onboarding: config.enableOnboarding,
            exportReporting: config.enableExportReporting,
            workspaceTemplates: config.enableWorkspaceTemplates,
            analysisCommands: config.enableAnalysisCommands,
            advancedCache: config.enableAdvancedCache,
            workspaceIntelligence: config.enableWorkspaceIntelligence,
            incrementalWorkers: config.enableIncrementalWorkers,
            extensionApi: config.enableExtensionApi
        };
        return flags[featureName] ?? true;
    },

    // Get enabled features list
    getEnabledFeatures() {
        const config = getFeatureConfig();
        const features = [];
        if (config.enableOnboarding) features.push('onboarding');
        if (config.enableExportReporting) features.push('exportReporting');
        if (config.enableWorkspaceTemplates) features.push('workspaceTemplates');
        if (config.enableAnalysisCommands) features.push('analysisCommands');
        if (config.enableAdvancedCache) features.push('advancedCache');
        if (config.enableWorkspaceIntelligence) features.push('workspaceIntelligence');
        if (config.enableIncrementalWorkers) features.push('incrementalWorkers');
        if (config.enableExtensionApi) features.push('extensionApi');
        return features;
    },

    // Calculate bundle size savings
    calculateSavings() {
        const config = getFeatureConfig();
        let savings = 0;
        if (!config.enableOnboarding) savings += 34;
        if (!config.enableExportReporting) savings += 17;
        if (!config.enableExtensionApi) savings += 15;
        if (!config.enableWorkspaceTemplates) savings += 14;
        if (!config.enableWorkspaceIntelligence) savings += 12;
        if (!config.enableAnalysisCommands) savings += 8;
        if (!config.enableAdvancedCache) savings += 5;
        return savings;
    }
};

// Provide alias methods so tests can reference chunk loader names directly
for (const [alias, target] of Object.entries(CHUNK_METHOD_ALIASES)) {
    if (!featureFlags[alias] && typeof featureFlags[target] === 'function') {
        featureFlags[alias] = (...args) => featureFlags[target](...args);
    }
}

// Standalone calculate savings function
function calculateSavings(config) {
    if (!config) config = getFeatureConfig();
    
    const baseSize = 267; // Original bundle size in KB
    let totalSavings = 0;
    
    if (!config.enableOnboarding) totalSavings += 34;
    if (!config.enableExportReporting) totalSavings += 17;
    if (!config.enableExtensionApi) totalSavings += 15;
    if (!config.enableWorkspaceTemplates) totalSavings += 14;
    if (!config.enableWorkspaceIntelligence) totalSavings += 12;
    if (!config.enableIncrementalWorkers) totalSavings += 19;
    if (!config.enableAnalysisCommands) totalSavings += 8;
    if (!config.enableAdvancedCache) totalSavings += 5;
    
    const optimizedSize = baseSize - totalSavings;
    const percentage = totalSavings > 0 ? Math.round((totalSavings / baseSize) * 100) : 0;
    
    return {
        baseSize: `${baseSize}KB`,
        totalSavings: `${totalSavings}KB`,
        optimizedSize: `${optimizedSize}KB`,
        percentage
    };
}

// Initialize default loaders for tests and CLI scripts
registerDefaultLoaders();

module.exports = { 
    ...featureFlags,
    getFeatureConfig,
    calculateSavings,
    registerFeatureLoader,
    setFeatureChunkResolver,
    unregisterFeatureLoader,
    clearFeatureLoaders,
    loadFeatureModule,
    registerDefaultLoaders
};
