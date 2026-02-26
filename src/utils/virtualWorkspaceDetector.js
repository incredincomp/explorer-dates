/**
 * Virtual Workspace Detector
 * 
 * Detects virtual workspaces (GitHub Repositories, VS Code for Web, remote file systems)
 * For use with feature gating and graceful degradation.
 * 
 * Reference: https://code.visualstudio.com/api/extension-guides/virtual-workspaces
 */

const vscode = require('vscode');

/**
 * Detects if the current workspace uses only virtual (non-file) file systems
 * Virtual workspaces include GitHub Repositories, VS Code for Web, and custom file system providers
 * 
 * @returns {boolean} True if ALL workspace folders use virtual schemes (non-file://)
 */
function isVirtualWorkspace() {
    try {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return false;  // No folders = not a virtual workspace
        }
        // Virtual workspace: ALL folders use non-file:// schemes
        return folders.every(f => f.uri.scheme !== 'file');
    } catch {
        return false;
    }
}

/**
 * Detects if ANY workspace folder is virtual
 * Useful for detecting mixed local+virtual setups
 * 
 * @returns {boolean} True if ANY workspace folder uses a virtual scheme
 */
function hasVirtualFolders() {
    try {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return false;
        }
        return folders.some(f => f.uri.scheme !== 'file');
    } catch {
        return false;
    }
}

/**
 * Gets the primary workspace folder scheme
 * 
 * @returns {string} URI scheme of the first workspace folder, defaults to 'file'
 */
function getPrimaryWorkspaceScheme() {
    try {
        return vscode.workspace.workspaceFolders?.[0]?.uri?.scheme || 'file';
    } catch {
        return 'file';
    }
}

/**
 * Gets all unique workspace schemes in use
 * 
 * @returns {string[]} Array of unique schemes (e.g., ['file', 'vscode-vfs', 'github'])
 */
function getWorkspaceSchemes() {
    try {
        const folders = vscode.workspace.workspaceFolders || [];
        const schemes = new Set(folders.map(f => f.uri.scheme || 'file'));
        return Array.from(schemes);
    } catch {
        return ['file'];
    }
}

/**
 * Checks if a URI can be accessed with Node.js fs module
 * Only file:// URIs on local disk can be used with Node.js fs
 * 
 * @param {any} uri - VS Code Uri object or string
 * @returns {boolean} True if the URI can be used with Node.js fs module
 */
function canUseNodeFS(uri) {
    if (!uri) return false;
    try {
        if (typeof uri === 'string') {
            return uri.startsWith('file://') || !uri.includes('://');
        }
        return uri.scheme === 'file' || !uri.scheme;
    } catch {
        return false;
    }
}

/**
 * Checks if a URI is safe to access with vscode.workspace.fs
 * All URIs including virtual ones can use vscode.workspace.fs
 * 
 * @param {any} uri - VS Code Uri object or string
 * @returns {boolean} True if the URI can be accessed via vscode.workspace.fs
 */
function canUseVSCodeFS(uri) {
    return !!uri;
}

/**
 * Gets a human-readable workspace type description
 * 
 * @returns {Object} Object with type, schemes, and description
 */
function getWorkspaceTypeInfo() {
    const isVirtual = isVirtualWorkspace();
    const hasVirtual = hasVirtualFolders();
    const schemes = getWorkspaceSchemes();
    const primaryScheme = getPrimaryWorkspaceScheme();

    let type = 'local';
    let description = 'Local file system workspace';

    if (isVirtual) {
        type = 'virtual';
        if (primaryScheme === 'vscode-vfs') {
            description = 'VS Code for Web (browser-based)';
        } else if (primaryScheme === 'github') {
            description = 'GitHub Repositories (remote)';
        } else {
            description = `Virtual workspace (${primaryScheme} scheme)`;
        }
    } else if (hasVirtual) {
        type = 'mixed';
        description = 'Mixed local and virtual folders';
    }

    return {
        type,
        description,
        primaryScheme,
        schemes,
        isVirtual,
        hasVirtual
    };
}

module.exports = {
    isVirtualWorkspace,
    hasVirtualFolders,
    getPrimaryWorkspaceScheme,
    getWorkspaceSchemes,
    canUseNodeFS,
    canUseVSCodeFS,
    getWorkspaceTypeInfo
};
