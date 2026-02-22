// Minimal, hot-path-friendly SettingsCoordinator wrapper.
// Heavy implementations live in the lazy `settings-coordinator-impl-chunk` to avoid inflating core.
const { getLogger } = require('./logger');

// Very small fallback vscode shape used on the hot path
function createFallbackVscodeMinimal() {
    return {
        workspace: { workspaceFolders: [], getConfiguration: () => ({ get: () => undefined, async update() {}, inspect: () => ({ defaultValue: undefined, globalValue: undefined, workspaceValue: undefined, workspaceFolderValue: undefined }) }) },
        ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
    };
}

function resolveVscodeMinimal() {
    try { return require('vscode'); } catch { return createFallbackVscodeMinimal(); }
}

class MinimalSettingsCoordinator {
    constructor(options = {}) {
        this._defaultSection = options.defaultSection || 'explorerDates';
        this._locks = new Map();
        this._waitStats = new Map();
        this._lockWarnMs = Number(process.env.EXPLORER_DATES_LOCK_WAIT_WARN_MS || 1000);
        this._logger = getLogger();
    }

    _withLock(key, work) { const existing = this._locks.get(key) || Promise.resolve(); const p = existing.then(() => work()); const chain = p.catch(() => {}); this._locks.set(key, chain); p.finally(() => { if (this._locks.get(key) === chain) this._locks.delete(key); }); return p; }

    _getConfiguration(section, resource) { const vs = resolveVscodeMinimal(); return vs.workspace.getConfiguration(section || undefined, resource); }

    _resolveKey(key, explicitSection) { const section = explicitSection || this._defaultSection; if (!section) return { section: undefined, key, fullKey: key }; if (key.startsWith(`${section}.`)) return { section, key: key.slice(section.length + 1), fullKey: key }; if (key.includes('.')) return { section: undefined, key, fullKey: key }; return { section, key, fullKey: `${section}.${key}` }; }

    async updateSetting(key, value, options = {}) {
        return this._withLock(this._resolveKey(key, options.section).fullKey, async () => {
            const resolved = this._resolveKey(key, options.section);
            const config = this._getConfiguration(resolved.section, options.resource);
            try { const target = this._resolveScope(options.scope, options.resource); await config.update(resolved.key, value, target); return { key: resolved.fullKey, updated: true }; } catch (err) { try { this._logger.warn(`Configuration update failed for ${resolved.fullKey}: ${err && err.message}`); } catch {} return { key: resolved.fullKey, updated: false, error: err }; }
        });
    }

    async applySettings(settings, options = {}) { const entries = Array.isArray(settings) ? settings : Object.entries(settings).map(([k, v]) => ({ key: k, value: v })); const results = []; for (const entry of entries) { try { results.push(await this.updateSetting(entry.key, entry.value, options)); } catch (err) { results.push({ key: this._resolveKey(entry.key, options.section).fullKey, updated: false, error: err }); } } const errors = results.filter(r => r && r.error); if (errors.length > 0) { const messages = errors.map(e => `${e.key}: ${e.error && e.error.message ? e.error.message : String(e.error)}`); const aggregated = new Error(`Failed to apply ${errors.length} setting(s): ${messages.join('; ')}`); aggregated.details = errors; throw aggregated; } return results; }

    _resolveScope(scope, resource) { if (scope && scope !== 'auto') return this._mapScope(scope) || resolveVscodeMinimal().ConfigurationTarget.Workspace; if (resource) return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder; if (resolveVscodeMinimal().workspace.workspaceFolders && resolveVscodeMinimal().workspace.workspaceFolders.length > 0) return resolveVscodeMinimal().ConfigurationTarget.Workspace; return resolveVscodeMinimal().ConfigurationTarget.Global; }

    _mapScope(scope) { switch (scope) { case 'user': return resolveVscodeMinimal().ConfigurationTarget.Global; case 'workspace': return resolveVscodeMinimal().ConfigurationTarget.Workspace; case 'workspaceFolder': return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder; default: return undefined; } }

    // Provide a minimal, compatible subset of the heavy SettingsCoordinator API so
    // callers that expect `inspect`, `getValue`, or `clearSetting` work in the
    // fallback (web/minimal) environment.
    getValue(key, options = {}) {
        const { section, resource } = options || {};
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).get(resolved.key);
    }

    inspect(key, options = {}) {
        const { section, resource } = options || {};
        const resolved = this._resolveKey(key, section);
        return this._getConfiguration(resolved.section, resource).inspect(resolved.key);
    }

    async clearSetting(key, options = {}) {
        return this.updateSetting(key, undefined, options);
    }

    getLockWaitStats() {
        const out = {};
        for (const [k, v] of this._waitStats.entries()) out[k] = { ...v };
        return out;
    }

    resetLockWaitStats() { this._waitStats.clear(); }
}

let cachedCoordinator = null;

function getSettingsCoordinator(options) {
    if (!cachedCoordinator || (options && options.forceNew)) {
        // Prefer the heavy impl when available to avoid bundling helpers across chunks
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
            if (typeof dynamicRequire === 'function') {
                let chunk = null;
                try { chunk = dynamicRequire('../chunks/settings-coordinator-impl-chunk'); } catch { /* ignore */ }
                try { if (!chunk) chunk = dynamicRequire('../chunks/settingsCoordinator-impl-chunk'); } catch { /* ignore */ }
                if (chunk && typeof chunk.createSettingsCoordinatorImpl === 'function') {
                    cachedCoordinator = chunk.createSettingsCoordinatorImpl(options);
                    return cachedCoordinator;
                }
            }
        } catch { /* ignore */ }

        // Web runtime: try registry injected by web chunks (avoid require() which isn't available in web)
        try {
            const { WEB_CHUNK_GLOBAL_KEY, LEGACY_WEB_CHUNK_GLOBAL_KEY } = require('../constants');
            const registry = (typeof globalThis !== 'undefined')
                ? (globalThis[WEB_CHUNK_GLOBAL_KEY] || globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY] || null)
                : null;
            if (registry && registry.settingsCoordinatorImpl && typeof registry.settingsCoordinatorImpl.createSettingsCoordinatorImpl === 'function') {
                cachedCoordinator = registry.settingsCoordinatorImpl.createSettingsCoordinatorImpl(options);
                return cachedCoordinator;
            }
        } catch { /* ignore */ }

        cachedCoordinator = new MinimalSettingsCoordinator(options);
    }
    return cachedCoordinator;
}

module.exports = { getSettingsCoordinator, MinimalSettingsCoordinator };
