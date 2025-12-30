const vscode = require('vscode');

/**
 * Logger utility for debugging and error tracking
 */
class Logger {
    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Explorer Dates');
        this._isEnabled = false;
        this._configurationWatcher = null;
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

    /**
     * Log debug information
     */
    debug(message, ...args) {
        if (this._isEnabled) {
            const timestamp = new Date().toISOString();
            const formattedMessage = `[${timestamp}] [DEBUG] ${message}`;
            this._outputChannel.appendLine(formattedMessage);
            if (args.length > 0) {
                this._outputChannel.appendLine(JSON.stringify(args, null, 2));
            }
            console.log(formattedMessage, ...args);
        }
    }

    /**
     * Log informational messages
     */
    info(message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [INFO] ${message}`;
        this._outputChannel.appendLine(formattedMessage);
        if (args.length > 0) {
            this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        console.log(formattedMessage, ...args);
    }

    /**
     * Log warning messages
     */
    warn(message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [WARN] ${message}`;
        this._outputChannel.appendLine(formattedMessage);
        if (args.length > 0) {
            this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        console.warn(formattedMessage, ...args);
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
        }
        
        if (args.length > 0) {
            this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        
        console.error(formattedMessage, error, ...args);
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
