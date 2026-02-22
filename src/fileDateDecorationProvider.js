/* eslint-disable no-unused-vars */
const vscode = require('vscode');
let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};
// Localization will be lazily hydrated per-instance to reduce bundle size
const { fileSystem } = require('./filesystem/FileSystemAdapter');
// Theme and accessibility managers loaded conditionally via ui-adapters chunk
const { formatFileSize } = require('./utils/formatters');
let getFileName = (p) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { let chunk = null; try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/path-utils-chunk'); } catch { /* ignore */ } if (chunk && typeof chunk.getFileName === 'function') { getFileName = chunk.getFileName; return getFileName(p); } } } catch { /* ignore */ } try { const s = String(p || ''); const normalized = s.replace(/\\/g, '/'); const idx = normalized.lastIndexOf('/'); return idx === -1 ? normalized : normalized.substring(idx + 1); } catch { return 'unknown'; } };
let getExtension = (p) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { let chunk = null; try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/path-utils-chunk'); } catch { /* ignore */ } if (chunk && typeof chunk.getExtension === 'function') { getExtension = chunk.getExtension; return getExtension(p); } } } catch { /* ignore */ } try { const name = String(p || ''); const dotIndex = name.lastIndexOf('.'); return dotIndex <= 0 ? '' : name.substring(dotIndex).toLowerCase(); } catch { return ''; } };
let buildCacheKey = (p) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { let chunk = null; try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/path-utils-chunk'); } catch { /* ignore */ } if (chunk && typeof chunk.getCacheKey === 'function') { buildCacheKey = chunk.getCacheKey; return buildCacheKey(p); } } } catch { /* ignore */ } return String(p || '').toLowerCase().replace(/\\/g, '/'); };
let normalizePath = (input) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { let chunk = null; try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/path-utils-chunk'); } catch { /* ignore */ } if (chunk && typeof chunk.normalizePath === 'function') { normalizePath = chunk.normalizePath; return normalizePath(input); } } } catch { /* ignore */ } return String(input || '').replace(/\\/g, '/'); };
let getUriPath = (target = '') => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { let chunk = null; try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ } try { if (!chunk) chunk = dynamicRequire('./chunks/path-utils-chunk'); } catch { /* ignore */ } if (chunk && typeof chunk.getUriPath === 'function') { getUriPath = chunk.getUriPath; return getUriPath(target); } } } catch { /* ignore */ } if (!target) return ''; if (typeof target === 'string') return target; if (typeof target.fsPath === 'string' && target.fsPath.length > 0) return target.fsPath; if (typeof target.path === 'string' && target.path.length > 0) return target.path; if (typeof target.toString === 'function') { try { return target.toString(true); } catch { return target.toString(); } } return String(target); };

/* `ensureDate` implementation removed from this module (unused here). Use `require('./utils/dateHelpers').ensureDate` from callers when needed. */

const {
    DEFAULT_CACHE_TIMEOUT,
    DEFAULT_MAX_CACHE_SIZE,
    GLOBAL_STATE_KEYS,
    DEFAULT_DECORATION_POOL_SIZE,
    DEFAULT_FLYWEIGHT_CACHE_SIZE,
    WORKSPACE_SCALE_EXTREME_THRESHOLD
} = require('./constants');
const { isWebEnvironment } = require('./utils/env');


const { getSettingsCoordinator } = require('./utils/settingsCoordinator');
const { SecurityValidator, SecureFileOperations, detectSecurityEnvironment } = require('./utils/securityUtils');
const DISABLE_GIT_FEATURES = process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES === '1';

// Conditional path import for Node.js environments
let nodePath = null;
try {
    if (!isWebEnvironment()) {
        nodePath = require('path');
    }
} catch {
    nodePath = null;
}

// Minimal local fallbacks for path helpers; prefer chunk-provided implementations
const pathCompat = {
    basename: (filePath) => {
        if (!filePath) return '';
        try {
            const path = require('path');
            return path.basename(filePath);
        } catch {
            const normalized = filePath.replace(/\\/g, '/');
            const lastSlash = normalized.lastIndexOf('/');
            return lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);
        }
    },
    dirname: (filePath) => {
        if (!filePath) return '.';
        try {
            const path = require('path');
            return path.dirname(filePath);
        } catch {
            const normalized = filePath.replace(/\\/g, '/');
            const lastSlash = normalized.lastIndexOf('/');
            return lastSlash === -1 ? '.' : normalized.substring(0, lastSlash);
        }
    }
};

// Attempt to eagerly replace small fallbacks with chunk-provided versions (non-blocking)
(async () => {
    try {
        const featureFlags = require('./featureFlags');
        const s = await featureFlags.decorationsStatic();
        if (s) {
            if (s.basename && s.dirname) {
                pathCompat.basename = s.basename;
                pathCompat.dirname = s.dirname;
            }
            if (s.describeFile) this._describeFile = s.describeFile; // no-op if not bound
        }
    } catch {}
})();
const CONFIG_DEFAULT_CACHE_TIMEOUT = 30000;
const CACHE_NAMESPACE_SEPARATOR = '::';

const DEFAULT_DYNAMIC_WATCHER_LIMIT = Number(process.env.EXPLORER_DATES_MAX_DYNAMIC_WATCHERS || 200);
const DEFAULT_WATCHER_INACTIVITY_MS = Number(process.env.EXPLORER_DATES_WATCHER_TTL_MS || 10 * 60 * 1000);
// Small local fallbacks — prefer loading full defaults from `decorationsAdvanced` chunk at runtime
const DEFAULT_SMART_WATCHER_EXTENSIONS = ['js','ts','json','md','py','java'];
const SMART_WATCHER_PRIORITY = new Map([[ 'src', 100 ], [ 'lib', 65 ], [ 'test', 30 ]]);

const WORKSPACE_SCAN_TIMEOUT_MS = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_TIMEOUT || 7000);
const WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT = WORKSPACE_SCALE_EXTREME_THRESHOLD;
const VIEWPORT_DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_VIEWPORT_HISTORY_LIMIT = Number(process.env.EXPLORER_DATES_VIEWPORT_HISTORY_LIMIT || 400);
const FEATURE_LEVELS = ['full', 'enhanced', 'standard', 'minimal'];
const DEFAULT_INDEXER_MAX_FILES = Math.max(100, Number(process.env.EXPLORER_DATES_INDEXER_MAX_FILES || 2000));
const SECURITY_EXTRA_PATHS_ENV = 'EXPLORER_DATES_SECURITY_EXTRA_PATHS';
const DEFAULT_SECURITY_THROTTLE_MS = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_THROTTLE_MS || 5000);
const SECURITY_WARNING_CACHE_LIMIT = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_CACHE || 500);
const DEFAULT_SECURITY_MAX_WARNINGS = Number(process.env.EXPLORER_DATES_SECURITY_MAX_WARNINGS_PER_FILE ?? 1);

// Local minimal describeFile fallback. We will delegate to decorations-static when available
let describeFile = (input = '') => {
    try {
        const pathValue = typeof input === 'string' ? input : getUriPath(input);
        const normalized = normalizePath(pathValue);
        return getFileName(normalized) || normalized || 'unknown';
    } catch {
        return 'unknown';
    }
};

// Non-blocking attempt to replace describeFile with chunk-provided impl
(async () => {
    try {
        const featureFlags = require('./featureFlags');
        const s = await featureFlags.decorationsStatic();
        if (s && typeof s.describeFile === 'function') describeFile = s.describeFile;
    } catch { /* ignore */ }
})();

// Minimal fallback wrapper for hierarchical cache; real implementation lives in `decorationsAdvanced` chunk
class LazyHierarchicalDecorationCache {
    constructor() {
        this._fallback = new Map();
    }
    get size() { return this._fallback.size; }
    get bucketCount() { return 0; }
    clear() { this._fallback.clear(); }
    get(key) { return this._fallback.get(key); }
    set(key, value) { this._fallback.set(key, value); }
    delete(key) { return this._fallback.delete(key); }
    *entries() { yield* this._fallback.entries(); }
    *keys() { yield* this._fallback.keys(); }
    *values() { yield* this._fallback.values(); }
    [Symbol.iterator]() { return this.entries(); }
    enforceLimit() { return 0; }
}

// The heavy provider implementation is moved into a runtime chunk to keep the
// main bundle small. The thin local proxy delegates to the chunk implementation
// via a dynamic require (so bundlers won't statically include the heavy code).
class FileDateDecorationProviderImpl {
    constructor(...args) {
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
            if (typeof dynamicRequire === 'function') {
                const mod = dynamicRequire('./chunks/file-date-provider-impl');
                if (mod && typeof mod.FileDateDecorationProviderImpl === 'function') {
                    return new mod.FileDateDecorationProviderImpl(...args);
                }
                if (mod && typeof mod.FileDateDecorationProvider === 'function') {
                    return new mod.FileDateDecorationProvider(...args);
                }
            }
        } catch (e) {
            // fall through to error below
        }
        throw new Error('FileDateDecorationProvider implementation is not available in this environment');
    }
}

// Minimal proxy wrapper — heavy implementation moved to `src/chunks/file-date-provider-impl.js`
class FileDateDecorationProvider {
    constructor(...args) {
        let loaderError = null;
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;

            // Primary (non-bundler) path used at runtime/tests. Prefer the
            // `-export` re-export wrapper when available so test stubs can
            // reliably override the runtime implementation.
            if (typeof dynamicRequire === 'function') {
                try {
                    let mod = null;
                    try { mod = dynamicRequire('./chunks/file-date-provider-impl-export'); } catch (__) {}
                    if (mod) {
                        // If the -export wrapper is present but doesn't export a provider,
                        // treat that as a deliberate 'exports missing provider' case and
                        // fall back to the local implementation (tests rely on this).
                        const exportedImpl = mod.FileDateDecorationProvider || mod.FileDateDecorationProviderImpl || mod.default;
                        if (typeof exportedImpl === 'function') return new exportedImpl(...args);

                        // explicit empty/partial export -> fall back to local impl
                        return new FileDateDecorationProviderImpl(...args);
                    }

                    // No -export wrapper present; try loading the impl module directly
                    mod = dynamicRequire('./chunks/file-date-provider-impl');
                    const Impl = mod && (mod.FileDateDecorationProvider || mod.FileDateDecorationProviderImpl || mod.default);
                    if (typeof Impl === 'function') return new Impl(...args);
                } catch (e) {
                    loaderError = e;
                }
            }

            // Robust fallback: resolve the chunk relative to this module and require it.
            try {
                let resolved = null;
                try { resolved = require.resolve('./chunks/file-date-provider-impl-export', { paths: [__dirname] }); } catch (__) {}
                if (!resolved) resolved = require.resolve('./chunks/file-date-provider-impl', { paths: [__dirname] });
                const mod2 = require(resolved);
                const Impl2 = mod2 && (mod2.FileDateDecorationProvider || mod2.FileDateDecorationProviderImpl || mod2.default);
                // If the resolved module is the -export wrapper and it exists but
                // does not provide a provider, prefer the local implementation.
                if (resolved && resolved.endsWith('file-date-provider-impl-export.js') && !Impl2) {
                    return new FileDateDecorationProviderImpl(...args);
                }
                if (typeof Impl2 === 'function') return new Impl2(...args);
            } catch (e) {
                loaderError = loaderError || e;
            }
        } catch (e) {
            loaderError = loaderError || e;
        }
        if (loaderError && loaderError.message) {
            const msg = `FileDateDecorationProvider implementation is unavailable: ${loaderError.message}`;
            throw new Error(msg);
        }
        throw new Error('FileDateDecorationProvider implementation is unavailable');
    }
}

module.exports = { FileDateDecorationProvider, FileDateDecorationProviderImpl };
