// Minimal logger chunk to be required by consumers to reduce duplication
let _instance = null;
function createLogger() {
    if (_instance) return _instance;
    const impl = {
        debug: (...args) => { if (typeof console.debug === 'function') console.debug(...args); else console.log(...args); },
        info: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    };
    _instance = impl;
    return _instance;
}
function getLogger() { return createLogger(); }
class Logger {
    constructor() { this._impl = createLogger(); }
    debug(...args) { this._impl.debug(...args); }
    info(...args) { this._impl.info(...args); }
    warn(...args) { this._impl.warn(...args); }
    error(...args) { this._impl.error(...args); }
}
module.exports = { getLogger, Logger };
