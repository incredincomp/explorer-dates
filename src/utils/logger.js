// Lightweight logger facade — hydrates a full logger from `logger-impl-chunk` lazily
const GLOBAL_LOGGER_KEY = '__explorerDatesLogger';

class LoggerFacade {
    constructor() {
        this._impl = null;
    }

    _call(method, args) {
        if (this._impl && typeof this._impl[method] === 'function') {
            try { return this._impl[method](...args); } catch { /* ignore */ }
        }
        switch (method) {
            case 'debug': if (typeof console.debug === 'function') console.debug(...args); else console.log(...args); break;
            case 'info': console.log(...args); break;
            case 'warn': console.warn(...args); break;
            case 'error': console.error(...args); break;
            default: console.log(...args); break;
        }
    }

    debug(...args) { return this._call('debug', args); }
    info(...args) { return this._call('info', args); }
    warn(...args) { return this._call('warn', args); }
    error(...args) { return this._call('error', args); }

    // Activation can set the real impl
    _setImpl(impl) { this._impl = impl; }
}

function getLogger() {
    if (typeof global !== 'undefined') {
        if (!global[GLOBAL_LOGGER_KEY]) global[GLOBAL_LOGGER_KEY] = new LoggerFacade();
        return global[GLOBAL_LOGGER_KEY];
    }
    if (typeof globalThis !== 'undefined') {
        if (!globalThis[GLOBAL_LOGGER_KEY]) globalThis[GLOBAL_LOGGER_KEY] = new LoggerFacade();
        return globalThis[GLOBAL_LOGGER_KEY];
    }
    // Module-local fallback
    if (!loggerInstance) loggerInstance = new LoggerFacade();
    return loggerInstance;
}

// Export the facade type for tests/consumers that expect `Logger` constructor and getLogger function
class Logger extends LoggerFacade {}

let loggerInstance = null;

module.exports = { Logger, getLogger };
