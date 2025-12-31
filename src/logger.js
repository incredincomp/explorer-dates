const vscode = require('vscode');

const isWebRuntime = process.env.VSCODE_WEB === 'true';
const inspectValue = (() => {
    if (!isWebRuntime) {
        // Use eval to avoid bundlers eagerly resolving the Node-only util module
        return eval('require')('util').inspect;
    }
    return (value) => {
        if (typeof value === 'string') {
            return value;
        }
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return '<<unable to serialize log arg>>';
        }
    };
})();

const DEFAULT_LOG_PROFILE = 'default';
const SUPPORTED_PROFILES = new Set(['default', 'stress', 'soak']);

/**
 * Logger utility for debugging and error tracking
 */
class Logger {
    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Explorer Dates');
        this._isEnabled = false;
        this._configurationWatcher = null;
        this._logProfile = (process.env.EXPLORER_DATES_LOG_PROFILE || DEFAULT_LOG_PROFILE).toLowerCase();
        if (!SUPPORTED_PROFILES.has(this._logProfile)) {
            this._logProfile = DEFAULT_LOG_PROFILE;
        }
        this._throttleState = new Map();
        this._updateConfig();
        
        // Listen for configuration changes
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.enableLogging')) {
                this._updateConfig();
            }
        });
    }

    _updateConfig() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        this._isEnabled = config.get('enableLogging', false);
    }

    setLogProfile(profileName = DEFAULT_LOG_PROFILE) {
        const normalized = (profileName || DEFAULT_LOG_PROFILE).toLowerCase();
        this._logProfile = SUPPORTED_PROFILES.has(normalized) ? normalized : DEFAULT_LOG_PROFILE;
        this.resetThrottle();
    }

    resetThrottle(key) {
        if (key) {
            this._throttleState.delete(key);
            return;
        }
        this._throttleState.clear();
    }

    /**
     * Log debug information
     */
    debug(message, ...args) {
        if (!this._isEnabled) {
            return;
        }
        this._logInternal('debug', null, message, args);
    }

    /**
     * Log informational messages
     */
    info(message, ...args) {
        this._logInternal('info', null, message, args);
    }

    /**
     * Log informational messages with advanced options (throttling, profiles, etc.)
     */
    infoWithOptions(options, message, ...args) {
        this._logInternal('info', options || null, message, args);
    }

    /**
     * Log warning messages
     */
    warn(message, ...args) {
        this._logInternal('warn', null, message, args);
    }

    /**
     * Log error messages
     */
    error(message, error, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [ERROR] ${message}`;
        this._outputChannel.appendLine(formattedMessage);

        if (error instanceof Error) {
            this._outputChannel.appendLine(`Error: ${error.message}`);
            if (error.stack) {
                this._outputChannel.appendLine(`Stack: ${error.stack}`);
            }
        } else if (error) {
            this._outputChannel.appendLine(this._serializeArg(error));
        }

        const evaluatedArgs = this._evaluateArgs(args);
        if (evaluatedArgs.length > 0) {
            evaluatedArgs.forEach((arg) => this._outputChannel.appendLine(this._serializeArg(arg)));
        }

        console.error(formattedMessage, error, ...evaluatedArgs);
    }

    /**
     * Show the output channel
     */
    show() {
        this._outputChannel.show();
    }

    /**
     * Clear the output channel
     */
    clear() {
        this._outputChannel.clear();
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this._outputChannel.dispose();
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        if (loggerInstance === this) {
            loggerInstance = null;
        }
    }

    _logInternal(level, options, message, args) {
        if (level === 'debug' && !this._isEnabled) {
            return;
        }

        if (this._shouldThrottle(level, options)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this._outputChannel.appendLine(formattedMessage);

        const evaluatedArgs = this._evaluateArgs(args);
        if (evaluatedArgs.length > 0) {
            evaluatedArgs.forEach((arg) => this._outputChannel.appendLine(this._serializeArg(arg)));
        }

        const consoleMethod = level === 'warn'
            ? console.warn
            : level === 'error'
                ? console.error
                : console.log;

        consoleMethod(formattedMessage, ...evaluatedArgs);
    }

    _evaluateArgs(args) {
        if (!args || args.length === 0) {
            return [];
        }
        return args.map((arg) => {
            if (typeof arg !== 'function') {
                return arg;
            }
            try {
                return arg();
            } catch (error) {
                return `<<log arg threw: ${error.message}>>`;
            }
        });
    }

    _serializeArg(arg) {
        try {
            if (typeof arg === 'string') {
                return arg;
            }
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return inspectValue(arg);
        } catch (error) {
            return `<<failed to serialize log arg: ${error.message}>>`;
        }
    }

    _shouldThrottle(level, options) {
        if (level !== 'info') {
            return false;
        }
        if (!options || !options.throttleKey) {
            return false;
        }

        const requestedProfile = (options.profile || 'stress').toLowerCase();
        if (!this._isProfileActive(requestedProfile)) {
            return false;
        }

        const limit = Number(options.throttleLimit) || 50;
        const key = options.throttleKey;
        const state = this._throttleState.get(key) || { count: 0, suppressed: 0, noticeLogged: false };

        if (state.count < limit) {
            state.count += 1;
            this._throttleState.set(key, state);
            return false;
        }

        state.suppressed += 1;
        if (!state.noticeLogged) {
            state.noticeLogged = true;
            const notice = `[${new Date().toISOString()}] [INFO] ⏸️ Suppressing further logs for "${key}" after ${limit} entries (profile=${this._logProfile})`;
            this._outputChannel.appendLine(notice);
            console.log(notice);
        }
        this._throttleState.set(key, state);
        return true;
    }

    _isProfileActive(requestedProfile) {
        const activeProfile = this._logProfile || DEFAULT_LOG_PROFILE;
        if (requestedProfile === 'default') {
            return activeProfile === DEFAULT_LOG_PROFILE;
        }
        return activeProfile === requestedProfile;
    }
}

// Singleton instance
let loggerInstance = null;

/**
 * Get the logger instance
 */
function getLogger() {
    if (!loggerInstance) {
        loggerInstance = new Logger();
    }
    return loggerInstance;
}

module.exports = { Logger, getLogger };
