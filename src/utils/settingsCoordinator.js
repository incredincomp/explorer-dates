const GLOBAL_VSCODE_SYMBOL = '__explorerDatesVscode';
let cachedVscode = null;
let fallbackVscode = null;
let fallbackInUse = false;

function getGlobalVscode() {
    try {
        return globalThis[GLOBAL_VSCODE_SYMBOL];
    } catch {
        return undefined;
    }
}

function createFallbackVscode() {
    if (fallbackVscode) {
        return fallbackVscode;
    }

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

    fallbackVscode = {
        workspace: {
            workspaceFolders: [],
            getConfiguration: () => noopConfiguration
        },
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
        }
    };

    return fallbackVscode;
}

const FALLBACK_ERROR_CODES = new Set([
    'MODULE_NOT_FOUND',
    'ERR_MODULE_NOT_FOUND',
    'WEB_NATIVE_MODULE'
]);

function shouldFallbackToMock(error) {
    if (!error) {
        return true;
    }
    if (error.code && FALLBACK_ERROR_CODES.has(error.code)) {
        return true;
    }
    const message = typeof error.message === 'string' ? error.message : '';
    return message.includes("Cannot find module 'vscode'");
}

function resolveVscode() {
    const globalMock = getGlobalVscode();
    if (globalMock) {
        cachedVscode = ensureMinimumVscodeShape(globalMock);
        fallbackInUse = false;
        return cachedVscode;
    }

    if (cachedVscode && !fallbackInUse) {
        return cachedVscode;
    }

    try {
        cachedVscode = ensureMinimumVscodeShape(require('vscode'));
        fallbackInUse = false;
    } catch (error) {
        if (shouldFallbackToMock(error)) {
            cachedVscode = ensureMinimumVscodeShape(createFallbackVscode());
            fallbackInUse = true;
        } else {
            throw error;
        }
    }
    return cachedVscode;
}

const vscode = new Proxy({}, {
    get(_target, prop) {
        return resolveVscode()[prop];
    },
    set(_target, prop, value) {
        resolveVscode()[prop] = value;
        return true;
    },
    has(_target, prop) {
        return prop in resolveVscode();
    },
    ownKeys() {
        return Reflect.ownKeys(resolveVscode());
    },
    getOwnPropertyDescriptor(_target, prop) {
        const descriptor = Object.getOwnPropertyDescriptor(resolveVscode(), prop);
        if (descriptor) {
            descriptor.configurable = true;
        }
        return descriptor;
    }
});

const DEFAULT_SECTION = 'explorerDates';
const CONFIG_WRAP_FLAG = '__explorerDatesConfigWrapped';

function ensureConfigurationObject(config) {
    if (!config || typeof config !== 'object') {
        return {
            get: () => undefined,
            async update() {},
            inspect: () => ({
                defaultValue: undefined,
                globalValue: undefined,
                workspaceValue: undefined,
                workspaceFolderValue: undefined
            })
        };
    }

    if (typeof config.get !== 'function') {
        config.get = () => undefined;
    }
    if (typeof config.update !== 'function') {
        config.update = async () => {};
    }
    if (typeof config.inspect !== 'function') {
        config.inspect = () => ({
            defaultValue: undefined,
            globalValue: undefined,
            workspaceValue: undefined,
            workspaceFolderValue: undefined
        });
    }
    return config;
}

function ensureMinimumVscodeShape(instance) {
    if (!instance) {
        return createFallbackVscode();
    }

    if (!instance.ConfigurationTarget) {
        instance.ConfigurationTarget = {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
        };
    }

    if (!instance.workspace) {
        instance.workspace = {};
    }

    const originalGetConfiguration = instance.workspace.getConfiguration;
    if (typeof originalGetConfiguration === 'function' && !originalGetConfiguration[CONFIG_WRAP_FLAG]) {
        const wrapped = function(...args) {
            const config = originalGetConfiguration.apply(this, args);
            return ensureConfigurationObject(config);
        };
        wrapped[CONFIG_WRAP_FLAG] = true;
        instance.workspace.getConfiguration = wrapped;
    } else if (typeof originalGetConfiguration !== 'function') {
        instance.workspace.getConfiguration = () => ensureConfigurationObject();
    }

    if (!Array.isArray(instance.workspace.workspaceFolders)) {
        instance.workspace.workspaceFolders = [];
    }

    return instance;
}

/**
 * Centralized helper for reading/updating Explorer Dates settings across scopes.
 * Keeps scope rules consistent so automatic configuration flows don't drift.
 */
class SettingsCoordinator {
    constructor(options = {}) {
        this._defaultSection = options.defaultSection || DEFAULT_SECTION;
    }

    /**
     * Read a setting with automatic section detection.
     */
    getValue(key, options = {}) {
        const { section, resource } = options;
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).get(resolved.key);
    }

    /**
     * Inspect scoped values for a setting.
     */
    inspect(key, options = {}) {
        const { section, resource } = options;
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).inspect(resolved.key);
    }

    /**
     * Update a setting respecting scopes and avoiding duplicate writes.
     */
    async updateSetting(key, value, options = {}) {
        const { scope = 'auto', resource, section, force = false } = options;
        const resolved = this._resolveKey(key, section);
        const config = this._getConfiguration(resolved.section, resource);
        const target = this._resolveScope(scope, resource);
        const before = config.get(resolved.key);
        const inspect = config.inspect(resolved.key);
        const scopedValue = this._getInspectValue(inspect, target);

        const shouldSkip = value !== undefined && this._isEqual(before, value);
        if (shouldSkip && !force && scopedValue !== undefined) {
            return { key: resolved.fullKey, updated: false, reason: 'unchanged' };
        }

        await config.update(resolved.key, value, target);

        return { key: resolved.fullKey, updated: true };
    }

    /**
     * Apply multiple settings with shared defaults.
     */
    async applySettings(settings, options = {}) {
        const entries = Array.isArray(settings)
            ? settings
            : Object.entries(settings).map(([settingKey, settingValue]) => ({
                  key: settingKey,
                  value: settingValue
              }));

        const results = [];
        for (const entry of entries) {
            const mergedOptions = { ...options, ...(entry.options || {}) };
            results.push(await this.updateSetting(entry.key, entry.value, mergedOptions));
        }
        return results;
    }

    /**
     * Remove a setting (set to undefined) for a specific scope.
     */
    async clearSetting(key, options = {}) {
        return this.updateSetting(key, undefined, options);
    }

    _getConfiguration(section, resource) {
        return vscode.workspace.getConfiguration(section || undefined, resource);
    }

    _resolveKey(key, explicitSection) {
        const section = explicitSection || this._defaultSection;
        if (!section) {
            return { section: undefined, key, fullKey: key };
        }

        if (key.startsWith(`${section}.`)) {
            const relativeKey = key.slice(section.length + 1);
            return { section, key: relativeKey, fullKey: key };
        }

        if (key.includes('.')) {
            return { section: undefined, key, fullKey: key };
        }

        return { section, key, fullKey: `${section}.${key}` };
    }

    _resolveScope(scope, resource) {
        if (scope && scope !== 'auto') {
            return this._mapScope(scope) || vscode.ConfigurationTarget.Workspace;
        }

        if (resource) {
            return vscode.ConfigurationTarget.WorkspaceFolder;
        }

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.ConfigurationTarget.Workspace;
        }

        return vscode.ConfigurationTarget.Global;
    }

    _mapScope(scope) {
        switch (scope) {
            case 'user':
                return vscode.ConfigurationTarget.Global;
            case 'workspace':
                return vscode.ConfigurationTarget.Workspace;
            case 'workspaceFolder':
                return vscode.ConfigurationTarget.WorkspaceFolder;
            default:
                return undefined;
        }
    }

    _scopeName(target) {
        switch (target) {
            case vscode.ConfigurationTarget.Global:
                return 'user';
            case vscode.ConfigurationTarget.Workspace:
                return 'workspace';
            case vscode.ConfigurationTarget.WorkspaceFolder:
                return 'workspaceFolder';
            default:
                return 'unknown';
        }
    }

    _isEqual(a, b) {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a === 'object') {
            try {
                return JSON.stringify(a) === JSON.stringify(b);
            } catch {
                return false;
            }
        }
        return false;
    }

    _getInspectValue(inspect, target) {
        if (!inspect) return undefined;
        switch (target) {
            case vscode.ConfigurationTarget.Global:
                return inspect.globalValue;
            case vscode.ConfigurationTarget.Workspace:
                return inspect.workspaceValue;
            case vscode.ConfigurationTarget.WorkspaceFolder:
                return inspect.workspaceFolderValue;
            default:
                return undefined;
        }
    }
}

let cachedCoordinator = null;

function getSettingsCoordinator(options) {
    if (!cachedCoordinator || (options && options.forceNew)) {
        cachedCoordinator = new SettingsCoordinator(options);
    }
    return cachedCoordinator;
}

module.exports = {
    SettingsCoordinator,
    getSettingsCoordinator
};
