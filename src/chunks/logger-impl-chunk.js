const vscode = require('vscode');

const isWebRuntime = process.env.VSCODE_WEB === 'true';
const inspectValue = (() => {
    if (!isWebRuntime) {
        return eval('require')('util').inspect;
    }
    return (value) => {
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value, null, 2); } catch { return '<<unable to serialize log arg>>'; }
    };
})();

const DEFAULT_LOG_PROFILE = 'default';
const SUPPORTED_PROFILES = new Set(['default', 'stress', 'soak']);
const LOG_LEVEL_ORDER = ['debug', 'info', 'warn', 'error'];
const DEFAULT_CONSOLE_LEVEL = 'warn';
const TEST_CONSOLE_LEVEL = (process.env.NODE_ENV === 'test' || process.env.EXPLORER_DATES_TEST_MODE === '1')
    ? 'warn'
    : null;

const GLOBAL_LOGGER_KEY = '__explorerDatesLogger';

class Logger {
    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Explorer Dates');
        this._isEnabled = false;
        this._configurationWatcher = null;
        this._muteOutputChannel = (process.env.NODE_ENV === 'test' || process.env.EXPLORER_DATES_TEST_MODE === '1') === true;
        this._logProfile = (process.env.EXPLORER_DATES_LOG_PROFILE || DEFAULT_LOG_PROFILE).toLowerCase();
        if (!SUPPORTED_PROFILES.has(this._logProfile)) this._logProfile = DEFAULT_LOG_PROFILE;
        this._throttleState = new Map();
        this._consoleLevel = DEFAULT_CONSOLE_LEVEL;
        this._updateConfig();
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration && (e.affectsConfiguration('explorerDates.enableLogging') || e.affectsConfiguration('explorerDates.consoleLogLevel'))) {
                this._updateConfig();
            }
        });
    }

    _updateConfig() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        this._isEnabled = config.get('enableLogging', false);
        const envConsoleLevel = (process.env.EXPLORER_DATES_LOG_LEVEL || '').toLowerCase();
        const configuredConsoleLevel = (config.get('consoleLogLevel', DEFAULT_CONSOLE_LEVEL) || '').toLowerCase();
        const chosenLevel = TEST_CONSOLE_LEVEL || envConsoleLevel || configuredConsoleLevel || DEFAULT_CONSOLE_LEVEL;
        this._consoleLevel = LOG_LEVEL_ORDER.includes(chosenLevel) ? chosenLevel : DEFAULT_CONSOLE_LEVEL;
        if (TEST_CONSOLE_LEVEL) this._isEnabled = false;
    }

    setLogProfile(profileName = DEFAULT_LOG_PROFILE) {
        const normalized = (profileName || DEFAULT_LOG_PROFILE).toLowerCase();
        this._logProfile = SUPPORTED_PROFILES.has(normalized) ? normalized : DEFAULT_LOG_PROFILE;
        this.resetThrottle();
    }

    resetThrottle(key) {
        if (key) { this._throttleState.delete(key); return; }
        this._throttleState.clear();
    }

    debug(message, ...args) { if (!this._isEnabled) return; this._logInternal('debug', null, message, args); }
    info(message, ...args) { this._logInternal('info', null, message, args); }
    infoWithOptions(options, message, ...args) { this._logInternal('info', options || null, message, args); }
    warn(message, ...args) { this._logInternal('warn', null, message, args); }

    error(message, error, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [ERROR] ${message}`;
        if (!this._muteOutputChannel) {
            this._outputChannel.appendLine(formattedMessage);
            if (error instanceof Error) {
                this._outputChannel.appendLine(`Error: ${error.message}`);
                if (error.stack) this._outputChannel.appendLine(`Stack: ${error.stack}`);
            } else if (error) {
                this._outputChannel.appendLine(this._serializeArg(error));
            }
        }
        const evaluatedArgs = this._evaluateArgs(args);
        if (evaluatedArgs.length > 0 && !this._muteOutputChannel) evaluatedArgs.forEach((arg) => this._outputChannel.appendLine(this._serializeArg(arg)));
        const consoleArgs = [];
        if (error !== undefined && error !== null) consoleArgs.push(error);
        if (evaluatedArgs.length > 0) consoleArgs.push(...evaluatedArgs);
        this._mirrorToConsole('error', formattedMessage, consoleArgs);
    }

    show() { this._outputChannel.show(); }
    clear() { this._outputChannel.clear(); }

    dispose() {
        try { this._outputChannel.dispose(); } catch {}
        if (this._configurationWatcher) { try { this._configurationWatcher.dispose(); } catch {} this._configurationWatcher = null; }
        if (typeof global !== 'undefined' && global[GLOBAL_LOGGER_KEY] === this) global[GLOBAL_LOGGER_KEY] = null;
        if (typeof globalThis !== 'undefined' && globalThis[GLOBAL_LOGGER_KEY] === this) globalThis[GLOBAL_LOGGER_KEY] = null;
    }

    _logInternal(level, options, message, args) {
        if (level === 'debug' && !this._isEnabled) return;
        if (this._shouldThrottle(level, options)) return;
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (!this._muteOutputChannel) this._outputChannel.appendLine(formattedMessage);
        const evaluatedArgs = this._evaluateArgs(args);
        if (evaluatedArgs.length > 0 && !this._muteOutputChannel) evaluatedArgs.forEach((arg) => this._outputChannel.appendLine(this._serializeArg(arg)));
        this._mirrorToConsole(level, formattedMessage, evaluatedArgs);
    }

    _evaluateArgs(args) {
        if (!args || args.length === 0) return [];
        return args.map((arg) => {
            if (typeof arg !== 'function') return arg;
            try { return arg(); } catch (error) { return `<<log arg threw: ${error.message}>>`; }
        });
    }

    _serializeArg(arg) {
        try {
            if (typeof arg === 'string') return arg;
            if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
            return inspectValue(arg);
        } catch (error) { return `<<failed to serialize log arg: ${error.message}>>`; }
    }

    _shouldThrottle(level, options) {
        if (level !== 'info') return false;
        if (!options || !options.throttleKey) return false;
        const requestedProfile = (options.profile || 'stress').toLowerCase();
        if (!this._isProfileActive(requestedProfile)) return false;
        const limit = Number(options.throttleLimit) || 50;
        const key = options.throttleKey;
        const state = this._throttleState.get(key) || { count: 0, suppressed: 0, noticeLogged: false };
        if (state.count < limit) { state.count += 1; this._throttleState.set(key, state); return false; }
        state.suppressed += 1;
        if (!state.noticeLogged) {
            state.noticeLogged = true;
            const notice = `[${new Date().toISOString()}] [INFO] ⏸️ Suppressing further logs for "${key}" after ${limit} entries (profile=${this._logProfile})`;
            this._outputChannel.appendLine(notice);
            this._mirrorToConsole('info', notice);
        }
        this._throttleState.set(key, state);
        return true;
    }

    _isProfileActive(requestedProfile) {
        const activeProfile = this._logProfile || DEFAULT_LOG_PROFILE;
        if (requestedProfile === 'default') return activeProfile === DEFAULT_LOG_PROFILE;
        return activeProfile === requestedProfile;
    }

    _shouldMirrorToConsole(level) {
        const configuredIndex = LOG_LEVEL_ORDER.indexOf(this._consoleLevel);
        const messageIndex = LOG_LEVEL_ORDER.indexOf(level);
        if (configuredIndex === -1 || messageIndex === -1) return false;
        return messageIndex >= configuredIndex;
    }

    _mirrorToConsole(level, message, args = []) {
        if (!this._shouldMirrorToConsole(level)) return;
        const method = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
        method.call(console, message, ...args);
    }
}

function getOrCreateLogger() {
    if (typeof global !== 'undefined') {
        if (!global[GLOBAL_LOGGER_KEY]) global[GLOBAL_LOGGER_KEY] = new Logger();
        return global[GLOBAL_LOGGER_KEY];
    }
    if (typeof globalThis !== 'undefined') {
        if (!globalThis[GLOBAL_LOGGER_KEY]) globalThis[GLOBAL_LOGGER_KEY] = new Logger();
        if (globalThis.window) globalThis.window[GLOBAL_LOGGER_KEY] = globalThis[GLOBAL_LOGGER_KEY];
        return globalThis[GLOBAL_LOGGER_KEY];
    }
    return new Logger();
}

module.exports = { Logger, getOrCreateLogger };
