const vscode = require('vscode');

function setupViewportAwareness(provider) {
    try {
        const registerWindowListener = (eventName, handler) => {
            const disposable = provider._registerEvent(vscode.window, eventName, handler);
            if (disposable) provider._viewportDisposables.push(disposable);
        };
        const registerWorkspaceListener = (eventName, handler) => {
            const disposable = provider._registerEvent(vscode.workspace, eventName, handler);
            if (disposable) provider._viewportDisposables.push(disposable);
        };
        registerWindowListener('onDidChangeVisibleTextEditors', (editors) => provider._updateVisibleViewportFiles(editors));
        registerWindowListener('onDidChangeActiveTextEditor', (editor) => provider._recordViewportActivity(editor?.document?.uri, { reason: 'active-editor' }));
        registerWorkspaceListener('onDidOpenTextDocument', (document) => provider._recordViewportActivity(document?.uri, { reason: 'open-document' }));
        registerWorkspaceListener('onDidSaveTextDocument', (document) => provider._recordViewportActivity(document?.uri, { reason: 'save-document' }));
        provider._updateVisibleViewportFiles(Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : []);
        if (vscode.window?.activeTextEditor?.document?.uri) {
            provider._recordViewportActivity(vscode.window.activeTextEditor.document.uri, { reason: 'initial-active' });
        }
    } catch (e) {
        provider._logger?.debug('viewport chunk setup failed', e);
    }
}

function teardownViewportAwareness(provider) {
    try {
        if (!provider._viewportDisposables?.length) return;
        for (const disposable of provider._viewportDisposables) {
            try { disposable.dispose(); } catch (error) { provider._logger?.debug('Failed to dispose viewport listener', error); }
        }
        provider._viewportDisposables = [];
        provider._viewportVisibleFiles.clear();
        provider._viewportRecentFiles.clear();
    } catch (e) {
        provider._logger?.debug('viewport chunk teardown failed', e);
    }
}

function updateVisibleViewportFiles(provider, editors) {
    try {
        const chunk = provider._decorationsStaticChunk || null;
        if (chunk && typeof chunk.getNormalizedPathsFromEditors === 'function') {
            const normalized = chunk.getNormalizedPathsFromEditors(editors);
            const now = Date.now();
            provider._viewportVisibleFiles.clear();
            for (const item of normalized) {
                provider._viewportVisibleFiles.add(item.path);
                provider._viewportRecentFiles.set(item.path, item.ts || now);
            }
            // trimming logic delegated to provider
            provider._trimViewportHistory();
            return;
        }
    } catch (e) {
        provider._logger?.debug('Delegated updateVisibleViewportFiles failed', e);
    }

    // Local fallback
    provider._viewportVisibleFiles.clear();
    if (!Array.isArray(editors)) return;
    const now = Date.now();
    for (const editor of editors) {
        const uri = editor?.document?.uri; if (!uri || uri.scheme !== 'file') continue;
        const normalizedPath = provider._normalizePath(provider._getUriPath(uri)); if (!normalizedPath) continue;
        provider._viewportVisibleFiles.add(normalizedPath);
        provider._viewportRecentFiles.set(normalizedPath, now);
    }
    provider._trimViewportHistory();
}

function recordViewportActivity(provider, uri, options = {}) {
    try {
        if (provider._viewportManager && typeof provider._viewportManager._recordViewportActivity === 'function') {
            return provider._viewportManager._recordViewportActivity(uri, options);
        }
    } catch (e) {
        provider._logger?.debug('Viewport manager record activity failed', e);
    }

    if (!uri || uri.scheme !== 'file') return;
    const normalizedPath = provider._normalizePath(provider._getUriPath(uri)); if (!normalizedPath) return;
    const timestamp = Date.now(); provider._viewportRecentFiles.set(normalizedPath, timestamp);
    if (options.visible) provider._viewportVisibleFiles.add(normalizedPath);
    if (provider._viewportRecentFiles.size > provider._viewportHistoryLimit) provider._trimViewportHistory(true);
    else if ((timestamp - provider._lastViewportCleanup) > provider._viewportWindowMs) provider._trimViewportHistory();
}

function isViewportPriority(provider, uri) {
    try {
        if (provider._viewportManager && typeof provider._viewportManager._isViewportPriority === 'function') {
            return provider._viewportManager._isViewportPriority(uri);
        }
    } catch (e) {
        provider._logger?.debug('Viewport manager isViewportPriority failed', e);
    }

    if (!uri || uri.scheme !== 'file') return true;
    if (provider._performanceMode || provider._featureLevel === 'full') return true;
    const normalizedPath = provider._normalizePath(provider._getUriPath(uri)); if (!normalizedPath) return true;
    if (provider._viewportVisibleFiles.has(normalizedPath)) return true;
    const lastSeen = provider._viewportRecentFiles.get(normalizedPath); if (!lastSeen) return false;
    return (Date.now() - lastSeen) <= provider._viewportWindowMs;
}

module.exports = {
    setupViewportAwareness,
    teardownViewportAwareness,
    updateVisibleViewportFiles,
    recordViewportActivity,
    isViewportPriority
};
