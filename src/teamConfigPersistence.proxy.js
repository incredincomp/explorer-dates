let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};const logger = getLogger();

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

                // Any other property is treated as an async method that forwards
                return async (...args) => {
                    const impl = await target._ensureImpl();
                    const method = impl[prop];
                    if (typeof method !== 'function') {
                        throw new Error(`TeamConfigPersistenceManager implementation missing method: ${String(prop)}`);
                    }

                    // Call the implementation method with a 'this' binding that
                    // prefers properties assigned to the proxy (target). This lets
                    // test overrides (e.g. manager._fileExists) be visible inside
                    // impl methods that reference `this._fileExists`.
                    const boundThis = Object.create(impl);
                    try {
                        for (const key of Object.getOwnPropertyNames(target)) {
                            boundThis[key] = target[key];
                        }
                    } catch {
                        // ignore copy errors
                    }

                    return method.apply(boundThis, args);
                };
            },

            // Forward property assignments on the proxy to the live implementation
            // so tests can override private helpers (e.g. `_fileExists`) after
            // `_ensureImpl()` has been called.
            set: (target, prop, value) => {
                try {
                    // diagnostic logging for proxy override propagation
                    if (typeof prop === 'string' && prop.startsWith('_')) {
                        // proxy assignment (silent) - used by tests to override impl helpers
                    }

                    target[prop] = value;

                    if (target._impl) {
                        try {
                            target._impl[prop] = value;
                            if (typeof prop === 'string' && prop.startsWith('_')) {
                                console.log('[proxy.set] mirrored to impl', prop, typeof target._impl[prop]);
                            }
                        } catch { /* ignore */ }
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
                // Try dynamic import first; fall back to require() for
                // environments where ESM import resolution may fail (tests/CI).
                let mod = null;
                try {
                    mod = await import('./teamConfigPersistence.impl.js');
                    // support both default & named CommonJS/ESM exports
                    mod = mod && mod.default ? mod.default : mod;
                } catch (importErr) {
                    try {
                        const dynamicRequire = typeof eval === 'function' ? eval('require') : require;
                        mod = dynamicRequire('./teamConfigPersistence.impl.js');
                    } catch (requireErr) {
                        importErr.message = `Failed to load teamConfigPersistence.impl (import error: ${importErr.message}; require error: ${requireErr.message})`;
                        throw importErr;
                    }
                }

                this._impl = new mod.TeamConfigPersistenceManager(this._context);
                // Attach back-reference so impl can consult proxy overrides when
                // tests set private helpers on the proxy instance.
                try {
                    Object.defineProperty(this._impl, '__proxy', {
                        value: this,
                        configurable: true,
                        enumerable: false,
                        writable: true
                    });
                } catch { /* ignore */ }

                // Mirror impl internals onto the proxy so test overrides (for
                // private helpers like `_fileExists`) affect the running impl.
                try {
                    for (const key of Object.getOwnPropertyNames(this._impl)) {
                        if (!(key in this)) {
                            this[key] = this._impl[key];
                        }
                    }
                } catch (copyErr) {
                    logger.debug('Failed to mirror impl properties to proxy target', copyErr?.message || copyErr);
                }
                return this._impl;
            })();
        }
        return this._init;
    }

    _ensureImplSync() {
        if (this._impl) return this._impl;
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : require;
            const mod = dynamicRequire('./teamConfigPersistence.impl.js');
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
