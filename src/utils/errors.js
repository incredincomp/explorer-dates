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

module.exports = {
    ExtensionError,
    ERROR_CODES,
    isPermissionError
};
