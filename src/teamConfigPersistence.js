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
const logger = getLogger();

/**
 * Lightweight proxy wrapper for TeamConfigPersistenceManager
 * The full implementation lives in `teamConfigPersistence.impl.js` and is only
 * imported when manager methods are invoked.
 */
class TeamConfigPersistenceManager {
    constructor(context) {
        this._context = context;
        this._impl = null;
        this._init = null;

        // Return a proxy that forwards method calls to the real implementation
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'dispose') return target.dispose.bind(target);
                if (prop === '_isLazyProxy') return true;
                if (prop in target) return target[prop];

                if (typeof prop === 'string' && prop.startsWith('_')) {
                    try {
                        const impl = target._impl || target._ensureImplSync();
                        if (impl && prop in impl) {
                            return impl[prop];
                        }
                    } catch {
                        // fall through to async method wrapper
                    }
                }

                // Any other property is treated as an async method that forwards
                return async (...args) => {
                    const impl = await target._ensureImpl();
                    if (typeof impl[prop] !== 'function') {
                        throw new Error(`TeamConfigPersistenceManager implementation missing method: ${String(prop)}`);
                    }
                    return impl[prop](...args);
                };
            },
            set: (target, prop, value) => {
                try {
                    target[prop] = value;
                    if (target._impl) {
                        target._impl[prop] = value;
                    }
                } catch {
                    // ignore assignment errors in tests
                }
                return true;
            }
        });
    }

    async _ensureImpl() {
        if (this._impl) return this._impl;
        if (!this._init) {
            this._init = (async () => {
                const mod = await import('./teamConfigPersistence.impl.js');
                this._impl = new mod.TeamConfigPersistenceManager(this._context);
                try {
                    Object.defineProperty(this._impl, '__proxy', {
                        value: this,
                        configurable: true,
                        enumerable: false,
                        writable: true
                    });
                } catch { /* ignore */ }
                try {
                    for (const key of Object.getOwnPropertyNames(this)) {
                        if (!key.startsWith('_')) continue;
                        if (key === '_context' || key === '_impl' || key === '_init') continue;
                        if (typeof this[key] !== 'undefined') {
                            this._impl[key] = this[key];
                        }
                    }
                } catch { /* ignore */ }
                // Copy internal impl properties onto the proxy target so tests can
                // override private helpers (e.g. manager._fileExists) and have
                // the impl methods pick up those overrides.
                try {
                    for (const key of Object.getOwnPropertyNames(this._impl)) {
                        if (!(key in this)) {
                            this[key] = this._impl[key];
                        }
                    }
                } catch (copyErr) {
                    // Non-fatal; continue with impl even if copy fails
                    logger.debug('Failed to copy impl properties to proxy target', copyErr?.message || copyErr);
                }
                return this._impl;
            })();
        }
        return this._init;
    }

    _ensureImplSync() {
        if (this._impl) return this._impl;
        try {
            // Synchronous fallback used by tests that call validation helpers without await.
            const mod = require('./teamConfigPersistence.impl.js');
            this._impl = new mod.TeamConfigPersistenceManager(this._context);
            try {
                Object.defineProperty(this._impl, '__proxy', {
                    value: this,
                    configurable: true,
                    enumerable: false,
                    writable: true
                });
            } catch { /* ignore */ }
            try {
                for (const key of Object.getOwnPropertyNames(this)) {
                    if (!key.startsWith('_')) continue;
                    if (key === '_context' || key === '_impl' || key === '_init') continue;
                    if (typeof this[key] !== 'undefined') {
                        this._impl[key] = this[key];
                    }
                }
            } catch { /* ignore */ }
            try {
                for (const key of Object.getOwnPropertyNames(this._impl)) {
                    if (!(key in this)) {
                        this[key] = this._impl[key];
                    }
                }
            } catch (copyErr) {
                logger.debug('Failed to copy impl properties to proxy target (sync)', copyErr?.message || copyErr);
            }
            return this._impl;
        } catch (err) {
            throw err;
        }
    }

    _validateSettings(settings) {
        const impl = this._ensureImplSync();
        return impl._validateSettings(settings);
    }

    _validateSettingValue(key, value) {
        const impl = this._ensureImplSync();
        return impl._validateSettingValue(key, value);
    }

    dispose() {
        if (this._impl && typeof this._impl.dispose === 'function') {
            try { this._impl.dispose(); } catch (e) { logger.warn('Error disposing team persistence impl', e); }
        }
        this._impl = null;
        this._init = null;
    }
}

module.exports = { TeamConfigPersistenceManager };
