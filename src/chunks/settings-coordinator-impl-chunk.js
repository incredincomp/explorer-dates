// Heavy helpers for SettingsCoordinator moved to a lazy chunk
// Exports a robust ensureMinimumVscodeShape to normalize the VS Code API surface
function createFallbackVscode() {
    const noopConfiguration = {
        get: () => undefined,
        async update() {},
        inspect: () => ({
            defaultValue: undefined,
            globalValue: undefined,
            workspaceValue: undefined,
            workspaceFolderValue: undefined
        })
    };

    return {
        workspace: {
            workspaceFolders: [],
            getConfiguration: () => noopConfiguration
        },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
    };
}

const FALLBACK_ERROR_CODES = new Set(['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND', 'WEB_NATIVE_MODULE']);

function shouldFallbackToMock(error) {
    if (!error) return true;
    if (error.code && FALLBACK_ERROR_CODES.has(error.code)) return true;
    const message = typeof error.message === 'string' ? error.message : '';
    return message.includes("Cannot find module 'vscode'");
}

function ensureMinimumVscodeShape(instance) {
    if (!instance) return createFallbackVscode();

    if (!instance.ConfigurationTarget) {
        instance.ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
    }

    if (!instance.workspace) {
        instance.workspace = {};
    }

    const originalGetConfiguration = instance.workspace.getConfiguration;
    const CONFIG_WRAP_FLAG = '__explorerDatesConfigWrapped';
    if (typeof originalGetConfiguration === 'function' && !originalGetConfiguration[CONFIG_WRAP_FLAG]) {
        const wrapped = function(...args) {
            const config = originalGetConfiguration.apply(this, args);
            if (!config || typeof config.get !== 'function') {
                return {
                    get: () => undefined,
                    async update() {},
                    inspect: () => ({ defaultValue: undefined, globalValue: undefined, workspaceValue: undefined, workspaceFolderValue: undefined })
                };
            }
            return config;
        };
        wrapped[CONFIG_WRAP_FLAG] = true;
        instance.workspace.getConfiguration = wrapped;
    } else if (typeof originalGetConfiguration !== 'function') {
        instance.workspace.getConfiguration = () => ({ get: () => undefined, async update() {}, inspect: () => ({ defaultValue: undefined, globalValue: undefined, workspaceValue: undefined, workspaceFolderValue: undefined }) });
    }

    if (!Array.isArray(instance.workspace.workspaceFolders)) {
        instance.workspace.workspaceFolders = [];
    }

    return instance;
}

// Small helper to normalise configuration objects (exported for core delegation)
function ensureConfigurationObjectImpl(config) {
    if (!config || typeof config !== 'object') {
        return {
            get: () => undefined,
            async update() {},
            inspect: () => ({ defaultValue: undefined, globalValue: undefined, workspaceValue: undefined, workspaceFolderValue: undefined })
        };
    }

    if (typeof config.get !== 'function') config.get = () => undefined;
    if (typeof config.update !== 'function') config.update = async () => {};
    if (typeof config.inspect !== 'function') config.inspect = () => ({ defaultValue: undefined, globalValue: undefined, workspaceValue: undefined, workspaceFolderValue: undefined });
    return config;
}

function resolveVscode() {
    try {
        // Prefer real VS Code API
        const real = require('vscode');
        return ensureMinimumVscodeShape(real);
    } catch (error) {
        if (shouldFallbackToMock(error)) {
            return ensureMinimumVscodeShape(createFallbackVscode());
        }
        throw error;
    }
}

async function doUpdateSettingImpl(coordinator, key, value, options = {}) {
    // Coordinator is expected to provide: _resolveKey, _getConfiguration, _resolveScope, _logger
    const _logger = coordinator && coordinator._logger;
    const resolved = coordinator._resolveKey(key, options.section);
    const config = coordinator._getConfiguration(resolved.section, options.resource);
    const target = coordinator._resolveScope(options.scope, options.resource);
    const before = config.get(resolved.key);
    const inspect = config.inspect(resolved.key);
    const scopedValue = (function _getInspectValue(inspect, target) {
        if (!inspect) return undefined;
        switch (target) {
            case (typeof coordinator === 'object' && coordinator.ConfigurationTarget ? coordinator.ConfigurationTarget.Global : 1):
                return inspect.globalValue;
            case (typeof coordinator === 'object' && coordinator.ConfigurationTarget ? coordinator.ConfigurationTarget.Workspace : 2):
                return inspect.workspaceValue;
            case (typeof coordinator === 'object' && coordinator.ConfigurationTarget ? coordinator.ConfigurationTarget.WorkspaceFolder : 3):
                return inspect.workspaceFolderValue;
            default:
                return undefined;
        }
    })(inspect, target);

    const shouldSkip = value !== undefined && (function _isEqual(a, b) {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a === 'object') {
            try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
        }
        return false;
    })(before, value);

    if (shouldSkip && !options.force && scopedValue !== undefined) {
        return { key: resolved.fullKey, updated: false, reason: 'unchanged' };
    }

    try {
        await config.update(resolved.key, value, target);
        return { key: resolved.fullKey, updated: true };
    } catch (err) {
        try { _logger && _logger.warn && _logger.warn(`Configuration update failed for ${resolved.fullKey}: ${err && err.message}`); } catch {}
        return { key: resolved.fullKey, updated: false, error: err };
    }
}

async function applySettingsImpl(coordinator, settings, options = {}) {
    // Support both array or object inputs similar to original API
    const entries = Array.isArray(settings)
        ? settings
        : Object.entries(settings).map(([settingKey, settingValue]) => ({ key: settingKey, value: settingValue }));

    const results = [];

    if (entries.length > 1) {
        const keys = Array.from(new Set(entries.map((e) => coordinator._resolveKey(e.key, options.section).fullKey)));
        const result = await coordinator._withLocks(keys, async () => {
            for (const entry of entries) {
                const mergedOptions = { ...options, ...(entry.options || {}) };
                results.push(await doUpdateSettingImpl(coordinator, entry.key, entry.value, mergedOptions));
            }
            return results;
        });

        const errors = (result || []).filter(r => r && r.error);
        if (errors.length > 0) {
            const messages = errors.map(e => `${e.key}: ${e.error && e.error.message ? e.error.message : String(e.error)}`);
            const aggregated = new Error(`Failed to apply ${errors.length} setting(s): ${messages.join('; ')}`);
            aggregated.details = errors;
            throw aggregated;
        }

        return result;
    }

    for (const entry of entries) {
        const mergedOptions = { ...options, ...(entry.options || {}) };
        results.push(await doUpdateSettingImpl(coordinator, entry.key, entry.value, mergedOptions));
    }

    const singleErrors = results.filter(r => r && r.error);
    if (singleErrors.length > 0) {
        const messages = singleErrors.map(e => `${e.key}: ${e.error && e.error.message ? e.error.message : String(e.error)}`);
        const aggregated = new Error(`Failed to apply ${singleErrors.length} setting(s): ${messages.join('; ')}`);
        aggregated.details = singleErrors;
        throw aggregated;
    }

    return results;
}

function recordLockWaitTimeImpl(coordinator, key, ms) {
    try {
        const stats = coordinator._waitStats.get(key) || { count: 0, total: 0, max: 0 };
        stats.count += 1;
        stats.total += ms;
        stats.max = Math.max(stats.max, ms);
        coordinator._waitStats.set(key, stats);

        if (ms > coordinator._lockWarnMs) {
            try {
                coordinator._logger && coordinator._logger.warn && coordinator._logger.warn(`SettingsCoordinator: lock for "${key}" waited ${ms}ms (threshold ${coordinator._lockWarnMs}ms)`);
            } catch {}
        }
    } catch {
        // swallow - stats should not affect coordinator operation
    }
}

function isEqualImpl(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object') {
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    }
    return false;
}

function getInspectValueImpl(inspect, target, coordinator) {
    if (!inspect) return undefined;
    const CT = coordinator && coordinator.ConfigurationTarget ? coordinator.ConfigurationTarget : { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
    switch (target) {
        case CT.Global: return inspect.globalValue;
        case CT.Workspace: return inspect.workspaceValue;
        case CT.WorkspaceFolder: return inspect.workspaceFolderValue;
        default: return undefined;
    }
}

function withLockImpl(coordinator, key, work) {
    // Serialize work for the same key. Ensure subsequent tasks wait even if a task rejects.
    const existing = coordinator._locks.get(key) || Promise.resolve();
    const waitStart = Date.now();
    const p = existing.then(() => {
        const waited = Date.now() - waitStart;
        try { if (coordinator && typeof coordinator._recordLockWaitTime === 'function') coordinator._recordLockWaitTime(key, waited); } catch {}
        return work();
    });
    const chain = p.catch(() => {});
    coordinator._locks.set(key, chain);
    p.finally(() => {
        if (coordinator._locks.get(key) === chain) {
            coordinator._locks.delete(key);
        }
    });
    return p;
}

function withLocksImpl(coordinator, keys, work) {
    const uniqueSorted = Array.from(new Set(keys)).sort();
    const existingChains = uniqueSorted.map(k => coordinator._locks.get(k) || Promise.resolve());
    const waitStart = Date.now();
    const waiter = Promise.all(existingChains).then(() => {
        const waited = Date.now() - waitStart;
        for (const k of uniqueSorted) {
            try { if (coordinator && typeof coordinator._recordLockWaitTime === 'function') coordinator._recordLockWaitTime(k, waited); } catch {}
        }
    });
    const p = waiter.then(() => work());
    const chain = p.catch(() => {});

    for (const k of uniqueSorted) {
        coordinator._locks.set(k, chain);
    }

    p.finally(() => {
        for (const k of uniqueSorted) {
            if (coordinator._locks.get(k) === chain) {
                coordinator._locks.delete(k);
            }
        }
    });

    return p;
}

// Full SettingsCoordinatorImpl class - heavy implementation placed in chunk to keep core minimal
class SettingsCoordinatorImpl {
    constructor(options = {}) {
        this._defaultSection = options.defaultSection || 'explorerDates';
        this._locks = new Map();
        this._waitStats = new Map();
        this._lockWarnMs = Number(process.env.EXPLORER_DATES_LOCK_WAIT_WARN_MS || 1000);
        try {
            this._logger = require('../utils/logger').getLogger();
        } catch {
            this._logger = null;
        }
    }

    _withLock(key, work) { return withLockImpl(this, key, work); }
    _withLocks(keys, work) { return withLocksImpl(this, keys, work); }

    getValue(key, options = {}) {
        const { section, resource } = options;
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).get(resolved.key);
    }

    inspect(key, options = {}) {
        const { section, resource } = options;
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).inspect(resolved.key);
    }

    async updateSetting(key, value, options = {}) {
        return this._withLock(this._resolveKey(key, options.section).fullKey, async () => {
            return await doUpdateSettingImpl(this, key, value, options);
        });
    }

    async applySettings(settings, options = {}) {
        return await applySettingsImpl(this, settings, options);
    }

    async clearSetting(key, options = {}) {
        return this.updateSetting(key, undefined, options);
    }

    _getConfiguration(section, resource) {
        const vs = resolveVscode();
        return vs.workspace.getConfiguration(section || undefined, resource);
    }

    _resolveKey(key, explicitSection) {
        const section = explicitSection || this._defaultSection;
        if (!section) return { section: undefined, key, fullKey: key };
        if (key.startsWith(`${section}.`)) {
            const relativeKey = key.slice(section.length + 1);
            return { section, key: relativeKey, fullKey: key };
        }
        if (key.includes('.')) return { section: undefined, key, fullKey: key };
        return { section, key, fullKey: `${section}.${key}` };
    }

    _resolveScope(scope, resource) {
        if (scope && scope !== 'auto') return this._mapScope(scope) || resolveVscode().ConfigurationTarget.Workspace;
        if (resource) return resolveVscode().ConfigurationTarget.WorkspaceFolder;
        if (resolveVscode().workspace.workspaceFolders && resolveVscode().workspace.workspaceFolders.length > 0) return resolveVscode().ConfigurationTarget.Workspace;
        return resolveVscode().ConfigurationTarget.Global;
    }

    _mapScope(scope) {
        switch (scope) {
            case 'user': return resolveVscode().ConfigurationTarget.Global;
            case 'workspace': return resolveVscode().ConfigurationTarget.Workspace;
            case 'workspaceFolder': return resolveVscode().ConfigurationTarget.WorkspaceFolder;
            default: return undefined;
        }
    }

    _scopeName(target) {
        switch (target) {
            case resolveVscode().ConfigurationTarget.Global: return 'user';
            case resolveVscode().ConfigurationTarget.Workspace: return 'workspace';
            case resolveVscode().ConfigurationTarget.WorkspaceFolder: return 'workspaceFolder';
            default: return 'unknown';
        }
    }

    _recordLockWaitTime(key, ms) {
        return recordLockWaitTimeImpl(this, key, ms);
    }

    getLockWaitStats() {
        const out = {};
        for (const [k, v] of this._waitStats.entries()) out[k] = { ...v };
        return out;
    }

    resetLockWaitStats() { this._waitStats.clear(); }
}

function createSettingsCoordinatorImpl(options) { return new SettingsCoordinatorImpl(options); }

module.exports = {
    createFallbackVscode,
    shouldFallbackToMock,
    ensureMinimumVscodeShape,
    ensureConfigurationObjectImpl,
    resolveVscode,
    doUpdateSettingImpl,
    applySettingsImpl,
    recordLockWaitTimeImpl,
    isEqualImpl,
    getInspectValueImpl,
    withLockImpl,
    withLocksImpl,
    SettingsCoordinatorImpl,
    createSettingsCoordinatorImpl
};