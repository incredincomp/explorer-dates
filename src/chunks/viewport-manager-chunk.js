// Viewport manager chunk - offloads viewport tracking and related utilities from the core provider
// Exposes a factory that creates a ViewportManager instance bound to the provider

function createViewportManager(provider) {
    const vscode = require('vscode');
    // Prefer shared utils chunk when available
let normalizePath, getUriPath;
try { const shared = require('../chunks/utils-shared-chunk'); if (shared) { normalizePath = shared.normalizePath; getUriPath = shared.getUriPath; } } catch { /* ignore */ }
if (!normalizePath) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const pathUtils = dynamicRequire('../utils/pathUtils');
                normalizePath = normalizePath || pathUtils.normalizePath;
                getUriPath = getUriPath || pathUtils.getUriPath;
            } catch { /* ignore */ }
        }
    } catch { /* ignore */ }
    if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
    if (!getUriPath) getUriPath = (t='') => { if (!t) return ''; if (typeof t === 'string') return t; if (t?.fsPath) return t.fsPath; if (t?.path) return t.path; return String(t); };
} 

    class ViewportManager {
        constructor() {
            this._provider = provider;
            this._viewportVisibleFiles = new Set();
            this._viewportRecentFiles = new Map();
            this._viewportDisposables = [];
            this._viewportHistoryLimit = provider._viewportHistoryLimit || 400;
            this._viewportWindowMs = provider._viewportWindowMs || (5 * 60 * 1000);
            this._lastViewportCleanup = Date.now();
        }

        _setupViewportAwareness() {
            if (this._viewportDisposables.length > 0) return;

            const registerWindowListener = (eventName, handler) => {
                const disposable = this._registerEvent(vscode.window, eventName, handler);
                if (disposable) this._viewportDisposables.push(disposable);
            };

            const registerWorkspaceListener = (eventName, handler) => {
                const disposable = this._registerEvent(vscode.workspace, eventName, handler);
                if (disposable) this._viewportDisposables.push(disposable);
            };

            registerWindowListener('onDidChangeVisibleTextEditors', (editors) => this._updateVisibleViewportFiles(editors));
            registerWindowListener('onDidChangeActiveTextEditor', (editor) => this._recordViewportActivity(editor?.document?.uri, { reason: 'active-editor' }));
            registerWorkspaceListener('onDidOpenTextDocument', (document) => this._recordViewportActivity(document?.uri, { reason: 'open-document' }));
            registerWorkspaceListener('onDidSaveTextDocument', (document) => this._recordViewportActivity(document?.uri, { reason: 'save-document' }));

            this._updateVisibleViewportFiles(Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : []);
            if (vscode.window?.activeTextEditor?.document?.uri) {
                this._recordViewportActivity(vscode.window.activeTextEditor.document.uri, { reason: 'initial-active' });
            }
        }

        _teardownViewportAwareness() {
            if (!this._viewportDisposables?.length) return;
            for (const disposable of this._viewportDisposables) {
                try { disposable.dispose(); } catch (e) { this._provider._logger.debug('Failed to dispose viewport listener', e); }
            }
            this._viewportDisposables = [];
            this._viewportVisibleFiles.clear();
            this._viewportRecentFiles.clear();
        }

        _updateVisibleViewportFiles(editors) {
            this._viewportVisibleFiles.clear();
            if (!Array.isArray(editors)) return;
            const now = Date.now();
            for (const editor of editors) {
                const uri = editor?.document?.uri;
                if (!uri || uri.scheme !== 'file') continue;
                const normalizedPath = normalizePath(getUriPath(uri));
                if (!normalizedPath) continue;
                this._viewportVisibleFiles.add(normalizedPath);
                this._viewportRecentFiles.set(normalizedPath, now);
            }
            this._trimViewportHistory();
        }

        _recordViewportActivity(uri, options = {}) {
            if (!uri || uri.scheme !== 'file') return;
            const normalizedPath = normalizePath(getUriPath(uri));
            if (!normalizedPath) return;
            const timestamp = Date.now();
            this._viewportRecentFiles.set(normalizedPath, timestamp);
            if (options.visible) this._viewportVisibleFiles.add(normalizedPath);
            if (this._viewportRecentFiles.size > this._viewportHistoryLimit) {
                this._trimViewportHistory(true);
            } else if ((timestamp - this._lastViewportCleanup) > this._viewportWindowMs) {
                this._trimViewportHistory();
            }
        }

        _trimViewportHistory(force = false) {
            const now = Date.now();
            const cutoff = now - (this._viewportWindowMs * 2);
            for (const [key, ts] of this._viewportRecentFiles.entries()) {
                if (force || ts < cutoff || (this._viewportRecentFiles.size > this._viewportHistoryLimit && ts < now)) {
                    this._viewportRecentFiles.delete(key);
                }
            }
            this._lastViewportCleanup = now;
        }

        _isViewportPriority(uri) {
            if (!uri || uri.scheme !== 'file') return true;
            if (this._provider._performanceMode || this._provider._featureLevel === 'full') return true;
            const normalizedPath = normalizePath(getUriPath(uri));
            if (!normalizedPath) return true;
            if (this._viewportVisibleFiles.has(normalizedPath)) return true;
            const lastSeen = this._viewportRecentFiles.get(normalizedPath);
            if (!lastSeen) return false;
            return (Date.now() - lastSeen) <= this._viewportWindowMs;
        }

        _registerEvent(target, eventName, handler) {
            try {
                if (!target || typeof target[eventName] !== 'function') return null;
                const disposable = target[eventName](handler);
                return disposable;
            } catch (e) {
                this._provider._logger.debug('Failed to register viewport event', e);
                return null;
            }
        }

        dispose() {
            this._teardownViewportAwareness();
        }
    }

    return new ViewportManager();
}

module.exports = { createViewportManager };
