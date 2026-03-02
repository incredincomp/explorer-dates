/**
 * Workspace Trust Guards
 * Utilities for enforcing workspace trust requirements in commands
 */
const vscode = require('vscode');
const { getLocalization } = require('./localization');

const l10n = getLocalization();

/**
 * Checks if the current workspace is trusted
 * @returns {boolean} True if workspace is trusted or trust API is unavailable (legacy VS Code)
 */
function isWorkspaceTrusted() {
    // VS Code API may not have isTrusted in older versions
    if (typeof vscode.workspace.isTrusted === 'undefined') {
        return true; // Assume trusted if API not available (graceful fallback)
    }
    return vscode.workspace.isTrusted === true;
}

/**
 * Guards a write/modify operation by checking workspace trust
 * Throws an error with user-friendly message if workspace is not trusted
 * @param {string} operationName - Name of the operation being guarded (for error messages)
 * @throws {Error} If workspace is not trusted
 */
function requireWorkspaceTrust(operationName = 'operation') {
    if (!isWorkspaceTrusted()) {
        const errorMessage = l10n.getString(
            'operationRequiresTrust',
            operationName
        ) || `This operation requires a trusted workspace. Please trust this workspace to use ${operationName}.`;
        
        vscode.window.showErrorMessage(errorMessage);
        throw new Error(`Workspace trust required for ${operationName}`);
    }
}

/**
 * Async wrapper for trust-guarded operations
 * Returns null if workspace is not trusted, otherwise executes the operation
 * @param {Function} operation - Async function to execute if workspace is trusted
 * @param {string} operationName - Name of the operation (for error messages)
 * @returns {Promise<any|null>} Result of operation or null if trust check failed
 */
async function withTrustGuard(operation, operationName = 'operation') {
    try {
        requireWorkspaceTrust(operationName);
        return await operation();
    } catch {
        // Error already shown to user via requireWorkspaceTrust
        return null;
    }
}

module.exports = {
    isWorkspaceTrusted,
    requireWorkspaceTrust,
    withTrustGuard
};
