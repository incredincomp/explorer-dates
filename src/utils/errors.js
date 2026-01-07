/**
 * Centralized error helpers for Explorer Dates extension
 */

class ExtensionError extends Error {
    /**
     * @param {string} code - Stable error code for telemetry and diagnostics
     * @param {string} message - Human readable description
     * @param {Record<string, any>} context - Additional metadata for logging/telemetry
     */
    constructor(code, message, context = {}) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'ExtensionError';
    }
}

const ERROR_CODES = {
    FILE_PERMISSION_DENIED: 'FILE_PERMISSION_DENIED',
    WORKSPACE_TOO_LARGE: 'WORKSPACE_TOO_LARGE',
    CHUNK_LOAD_FAILED: 'CHUNK_LOAD_FAILED'
};

function isPermissionError(error) {
    if (!error) {
        return false;
    }
    const code = error.code || error?.name;
    return ['EACCES', 'EPERM', 'EROFS', 'NoPermissions'].includes(code);
}

class ChunkLoadError extends ExtensionError {
    /**
     * @param {string} chunkName
     * @param {string} reason
     * @param {{ recoverable?: boolean, context?: Record<string, any> }} options
     */
    constructor(chunkName, reason, options = {}) {
        const { recoverable = true, context = {} } = options;
        super(ERROR_CODES.CHUNK_LOAD_FAILED, `Failed to load ${chunkName}: ${reason}`, {
            chunkName,
            recoverable,
            ...context
        });
        this.name = 'ChunkLoadError';
        this.chunkName = chunkName;
        this.recoverable = recoverable;
    }
}

/**
 * Standardized handler for chunk load failures (user-facing optional)
 * @param {string} chunkName
 * @param {Error} error
 * @param {{ userFacing?: boolean }} options
 */
function handleChunkFailure(chunkName, error, options = {}) {
    const vscode = require('vscode');
    const { userFacing = true } = options;
    const recoverable = error?.recoverable ?? true;
    if (userFacing && !recoverable) {
        vscode.window.showErrorMessage(
            `Explorer Dates: ${chunkName} feature unavailable. Please reinstall or rebuild the extension.`
        );
    }
}

module.exports = {
    ExtensionError,
    ERROR_CODES,
    isPermissionError,
    ChunkLoadError,
    handleChunkFailure
};
