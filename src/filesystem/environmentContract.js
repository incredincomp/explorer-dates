const FORCE_WORKSPACE_FS_ENV = 'EXPLORER_DATES_FORCE_VSCODE_FS';

function envFlag(name, env = process.env) {
    return String(env?.[name] || '') === '1';
}

function getUriParts(target) {
    const uri = target && typeof target === 'object' ? target : null;
    const scheme = String(uri?.scheme || (typeof target === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(target) ? target.split(':', 1)[0] : 'file')).toLowerCase();
    const authority = String(uri?.authority || '');
    const value = uri?.path || uri?.fsPath || (typeof target === 'string' ? target.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '') : '');
    return { scheme, authority, path: String(value || '') };
}

function getEnvironmentContract({ uri, isWeb = false, remoteName = '', forceWorkspaceFs = envFlag(FORCE_WORKSPACE_FS_ENV) } = {}) {
    const parts = getUriParts(uri);
    const isVirtual = parts.scheme !== 'file';
    const browser = Boolean(isWeb);
    const remote = Boolean(remoteName);
    const useWorkspaceFs = Boolean(forceWorkspaceFs || browser || remote || isVirtual);
    return {
        scheme: parts.scheme,
        authority: parts.authority,
        isFileScheme: !isVirtual,
        isVirtual,
        isBrowser: browser,
        isRemote: remote,
        forceWorkspaceFs: Boolean(forceWorkspaceFs),
        filesystem: useWorkspaceFs ? 'workspace.fs' : 'node.fs',
        provider: isVirtual ? (parts.scheme === 'github' || parts.scheme === 'vscode-vfs' ? 'github' : 'virtual') : 'filesystem'
    };
}

function isCaseSensitive({ uri, platform = process.platform, caseSensitive } = {}) {
    if (typeof caseSensitive === 'boolean') return caseSensitive;
    const scheme = getUriParts(uri).scheme;
    if (scheme !== 'file') return true;
    return platform !== 'win32';
}

function resourceIdentity(uri, options = {}) {
    const parts = getUriParts(uri);
    const normalizedPath = parts.path.replace(/\\/g, '/').replace(/\/+/g, '/');
    const identity = `${parts.scheme}://${parts.authority}${normalizedPath}`;
    return isCaseSensitive({ uri, ...options }) ? identity : identity.toLowerCase();
}

function normalizeTimestamp(value) {
    if (value instanceof Date) {
        const ms = value.getTime();
        return Number.isFinite(ms) ? ms : null;
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim()) {
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? ms : null;
    }
    return null;
}

function normalizeStat(stat) {
    if (!stat || typeof stat !== 'object') return null;
    const mtimeMs = normalizeTimestamp(stat.mtime);
    const ctimeMs = normalizeTimestamp(stat.ctime);
    return { ...stat, mtimeMs, ctimeMs };
}

module.exports = {
    FORCE_WORKSPACE_FS_ENV,
    envFlag,
    getUriParts,
    getEnvironmentContract,
    isCaseSensitive,
    resourceIdentity,
    normalizeTimestamp,
    normalizeStat
};
