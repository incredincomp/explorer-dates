const vscode = require('vscode');
const { DEFAULT_DYNAMIC_WATCHER_LIMIT, DEFAULT_WATCHER_INACTIVITY_MS } = require('../constants');
const proc = (typeof process !== 'undefined') ? process : null;
const env = proc?.env || {};
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
            /* eslint-disable-next-line no-unused-vars */
            } catch (e) { /* ignore */ }
        }
    /* eslint-disable-next-line no-unused-vars */
    } catch (e) { /* ignore */ }
    if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
    if (!getUriPath) getUriPath = (t='') => { if (!t) return ''; if (typeof t === 'string') return t; if (t?.fsPath) return t.fsPath; if (t?.path) return t.path; return String(t); };
} 
const { getLogger } = require('../utils/logger');

let nodePath = null;
try { nodePath = require('path'); } catch {}

class WatcherManager {
    constructor(provider) {
        this._provider = provider;
        this._logger = provider._logger || getLogger();
        this._fileWatchers = new Set();
        this._fileWatcher = undefined;
        this._watcherDisposables = [];
        this._dynamicWatchers = new Map();
        this._watcherCleanupTimer = null;
        this._watcherEventDebounce = provider._watcherEventDebounce || new Map();
        this._smartWatcherFallbackManager = provider._smartWatcherFallbackManager || null;
        this._smartWatcherSetupPromise = null;
        this._activeWatcherStrategy = 'none';
    }

    setupFileWatcher(reason = 'initial') {
        if (this._provider._performanceMode || this._provider._isDisposed) {
            const skipReason = this._provider._isDisposed ? 'provider disposed' : 'performance mode enabled';
            this._logger.debug(`Skipping file watcher setup (${reason}) - ${skipReason}`);
            return;
        }

        if (!this._fileWatcher) {
            this._fileWatcher = { pending: true };
        }

        const requestId = ++this._provider._watcherSetupToken;

        const configure = async () => {
            if (this._smartWatcherSetupPromise) {
                try { await this._smartWatcherSetupPromise; } catch (e) { this._logger.debug('Previous watcher setup promise rejected', e); }
            }
            const promise = this._initializeSmartWatchers(requestId, reason);
            this._smartWatcherSetupPromise = promise;
            try {
                await promise;
            } finally {
                if (this._smartWatcherSetupPromise === promise) this._smartWatcherSetupPromise = null;
            }
        };

        configure().catch((error) => this._logger.error('Failed to configure file watchers', error));
    }

    async _initializeSmartWatchers(requestId, reason) {
        if (this._shouldAbortWatcherSetup(requestId)) return;
        this.disposeFileWatchers({ permanent: false });
        if (this._shouldAbortWatcherSetup(requestId)) return this._cleanupAbortedWatcherSetup('post-dispose');

        this._fileWatcher = { pending: true };
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this._logger.debug('No workspace folders detected; skipping watcher setup');
            this._activeWatcherStrategy = 'none';
            return;
        }

        if (this._provider._isWeb) {
            this._logger.info('File watchers are unavailable in web environments; skipping watcher setup');
            this._activeWatcherStrategy = 'none';
            return;
        }

        const config = vscode.workspace.getConfiguration('explorerDates');
        const envDisabled = env.EXPLORER_DATES_DISABLE_SMART_WATCHERS === '1';
        this._provider._smartWatcherEnabled = !envDisabled && config.get('smartFileWatching', true);
        this._provider._enableWatcherFallbacks = this._provider._smartWatcherEnabled && config.get('enableSmartWatcherFallbacks', 'auto');
        const rawMaxPatterns = config.get('smartWatcherMaxPatterns', 20);
        const normalizedExtensions = this._provider._normalizeWatcherExtensions(config.get('smartWatcherExtensions', []));
        const maxPatterns = this._provider._computeSmartWatcherMaxPatterns(rawMaxPatterns);
        this._provider._smartWatcherConfig = { maxPatterns, extensions: normalizedExtensions };

        if (this._shouldAbortWatcherSetup(requestId)) return this._cleanupAbortedWatcherSetup('post-config');

        if (!this._provider._smartWatcherEnabled) {
            this._logger.info('Smart file watching disabled; falling back to global watcher');
            await this._createGlobalWatcher('disabled');
            return;
        }

        let targets = [];
        try {
            if (typeof this._provider._buildSmartWatcherTargets === 'function') {
                targets = await this._provider._buildSmartWatcherTargets(workspaceFolders, this._provider._smartWatcherConfig);
            } else {
                // Defensive fallback: use helper from decoration-provider-impl-chunk when provider doesn't expose the method
                try {
                    const helper = require('./decoration-provider-impl-chunk');
                    if (helper && typeof helper._buildSmartWatcherTargets === 'function') {
                        targets = await helper._buildSmartWatcherTargets(this._provider, workspaceFolders, this._provider._smartWatcherConfig);
                    } else {
                        throw new Error('_buildSmartWatcherTargets not implemented on provider or helper');
                    }
                } catch (helperErr) {
                    throw helperErr;
                }
            }
        } catch (error) {
            this._logger.error('Smart watcher analysis failed, falling back to global watcher', error);
            await this._createGlobalWatcher('analysis-failed');
            return;
        }

        if (this._shouldAbortWatcherSetup(requestId)) return this._cleanupAbortedWatcherSetup('post-analysis');

        if (!targets || targets.length === 0) {
            this._logger.warn('Smart watcher analysis yielded no targets; falling back to global watcher');
            await this._createGlobalWatcher('no-targets');
            return;
        }

        for (const target of targets) {
            try {
                const watcher = await this._createWatcherWithFallback(target.pattern, target.label);
                if (watcher) {
                    this._registerWatcherHandlers(watcher, target.label);
                    this._fileWatchers.add(watcher);
                }
            } catch (error) {
                this._logger.debug(`Failed to create watcher for pattern ${target.label}`, error);
            }
        }

        if (this._fileWatchers.size === 0) {
            this._logger.warn('Smart watcher setup produced zero watchers; using global fallback');
            await this._createGlobalWatcher('no-watchers-created');
            return;
        }

        this._fileWatcher = this._fileWatchers.values().next().value || undefined;
        this._activeWatcherStrategy = 'smart';
        this._logger.info(`Smart file watching enabled (${this._fileWatchers.size} base watcher${this._fileWatchers.size === 1 ? '' : 's'})`, {
            reason,
            patterns: targets.map((t) => t.label)
        });

        this._ensureDynamicWatcherSupport();
    }

    _shouldAbortWatcherSetup(requestId) {
        if (this._provider._isDisposed || this._provider._performanceMode) return true;
        if (typeof requestId === 'number' && requestId !== this._provider._watcherSetupToken) return true;
        return false;
    }

    _cleanupAbortedWatcherSetup(stage = 'unknown') {
        const permanentAbort = this._provider._performanceMode || this._provider._isDisposed;
        this.disposeFileWatchers({ permanent: permanentAbort });
        this._logger.debug(`Watcher setup aborted (${stage})`, { permanentAbort, disposed: this._provider._isDisposed, performanceMode: this._provider._performanceMode });
    }

    async _getDecorationsAdvancedChunk() {
        try {
            const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
            const featureFlagsGlobal = getFeatureFlagsGlobal();
            const chunk = featureFlagsGlobal ? await featureFlagsGlobal.decorationsAdvanced() : null;
            return chunk || null;
        } catch (error) {
            this._logger.debug('Failed to load decorationsAdvanced chunk', error);
            return null;
        }
    }

    async _createWatcherWithFallback(pattern, label = 'unknown') {
        try {
            const chunk = await this._getDecorationsAdvancedChunk();
            if (chunk?.createWatcherWithFallback) return await chunk.createWatcherWithFallback(this._provider, pattern, label);
        } catch (error) {
            this._logger.debug(`Advanced watcher chunk failed for ${label}`, error);
        }

        const shouldUseFallbackWatcher = () => {
            const enable = this._provider._enableWatcherFallbacks;
            if (enable === false) return false;
            if (enable === 'auto' || enable === true) {
                const platform = proc?.platform;
                const isWSL = env.WSL_DISTRO_NAME || env.WSLENV;
                const isRemote = vscode.env.remoteName;
                const isDocker = env.DOCKER_CONTAINER;
                return isWSL || isRemote || isDocker || platform === 'android';
            }
            return false;
        };

        try {
            const nativeWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            this._logger.debug(`Native watcher created for ${label}`);
            return nativeWatcher;
        } catch (nativeError) {
            this._logger.debug(`Native watcher failed for ${label}:`, nativeError);
            if (!shouldUseFallbackWatcher()) return null;
            return this._createFallbackWatcher(pattern, label);
        }
    }

    async _createFallbackWatcher(pattern, label) {
        try {
            const chunk = await this._getDecorationsAdvancedChunk();
            if (chunk?.createFallbackWatcher) return await chunk.createFallbackWatcher(this._provider, pattern, label);
        } catch (error) {
            this._logger.warn(`Fallback watcher creation failed for ${label}:`, error);
        }

        try {
            if (!this._smartWatcherFallbackManager) {
                const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
                const featureFlagsGlobal = getFeatureFlagsGlobal();
                const SmartWatcherFallbackModule = featureFlagsGlobal ? await featureFlagsGlobal.loadFeatureModule('smartWatcherFallback') : null;
                if (SmartWatcherFallbackModule) {
                    const { SmartWatcherFallbackManager } = SmartWatcherFallbackModule;
                    this._smartWatcherFallbackManager = new SmartWatcherFallbackManager({ logger: this._logger });
                    await this._smartWatcherFallbackManager.initialize();
                }
            }

            if (this._smartWatcherFallbackManager) {
                const fallback = await this._smartWatcherFallbackManager.getFallback();
                const watcher = await fallback.createWatcherWithFallback(pattern);
                this._logger.debug(`Fallback watcher created for ${label}`);
                return watcher;
            }
        } catch (fallbackError) {
            this._logger.warn(`Fallback watcher creation failed for ${label}:`, fallbackError);
        }
        return null;
    }

    async _createGlobalWatcher(reason = 'global-default') {
        this._teardownDynamicWatcherSupport();
        const watcher = await this._createWatcherWithFallback('**/*', `global:${reason}`);
        if (watcher) {
            this._registerWatcherHandlers(watcher, `global:${reason}`);
            this._fileWatchers.add(watcher);
            this._fileWatcher = watcher;
            this._activeWatcherStrategy = 'global';
            this._logger.info(`Global watcher activated (${reason})`);
        } else {
            this._logger.error(`Failed to create global watcher (${reason})`);
        }
    }

    _registerWatcherHandlers(watcher, label = 'unknown') {
        if (!watcher) return;
        watcher.onDidChange((uri) => this._handleWatcherEvent(uri, 'change', label));
        watcher.onDidCreate((uri) => this._handleWatcherEvent(uri, 'create', label));
        watcher.onDidDelete((uri) => this._handleWatcherEvent(uri, 'delete', label));
    }

    _handleWatcherEvent(uri, eventType, source = 'unknown') {
        if (!uri || uri.scheme !== 'file') return;
        const validation = this._provider._validateWorkspaceUri(uri, `watcher:${eventType}`);
        if (!validation?.isValid) return;

        const throttleMs = this._getWatcherThrottleInterval();
        if (throttleMs <= 0) {
            this._dispatchWatcherEvent(uri, eventType, source);
            return;
        }

        const key = `${uri.toString()}:${eventType}`;
        const existing = this._watcherEventDebounce.get(key);
        if (existing) clearTimeout(existing.timer);

        const timer = setTimeout(() => {
            this._watcherEventDebounce.delete(key);
            this._dispatchWatcherEvent(uri, eventType, source);
        }, throttleMs);

        this._watcherEventDebounce.set(key, { timer, source });
    }

    _dispatchWatcherEvent(uri, eventType, source) {
        try { this._provider._clearFreshnessCacheForUri?.(uri); } catch { /* ignore */ }
        if (eventType === 'delete') {
            this._provider.clearDecoration(uri);
        } else {
            this._provider.refreshDecoration(uri);
        }

        if (this._provider._workspaceIntelligence?.incrementalIndexer) {
            this._provider._workspaceIntelligence.incrementalIndexer.queueDelta(uri, eventType);
        }

        if (this._provider._logWatcherEvents) {
            this._logger.debug(`Watcher event processed (${eventType}) for ${this._provider._describeFile(uri)} via ${source}`);
        }
    }

    _getWatcherThrottleInterval() {
        if (this._provider._performanceMode) return 0;
        switch (this._provider._workspaceScale) {
            case 'extreme': return 600;
            case 'large': return 250;
            default: return 100;
        }
    }

    handleWorkspaceFoldersChanged(event) {
        const addedUris = (event?.added || []).map((folder) => folder.uri).filter(Boolean);
        const removedUris = (event?.removed || []).map((folder) => folder.uri).filter(Boolean);
        if (addedUris.length === 0 && removedUris.length === 0) return;

        const run = async () => {
            this._logger.info('Workspace folders changed', { added: addedUris.length, removed: removedUris.length });
            await this._provider.checkWorkspaceSize();
            try { this._provider.clearAllCaches(); } catch { /* ignore */ }
            try { this._provider.refreshAll(); } catch { /* ignore */ }
            if (this._provider._performanceMode) return;
            this.setupFileWatcher('workspace-change');
            await this._provider._applyProgressiveLoadingSetting().catch((error) => this._logger.debug('Failed to reconfigure progressive loading after workspace change', error));
            if (this._provider._workspaceIntelligence) {
                const added = (vscode.workspace.workspaceFolders || []).map((folder) => ({ uri: folder.uri }));
                await this._provider._workspaceIntelligence.onWorkspaceFoldersChanged({ added, removed: removedUris.map(uri => ({ uri })) });
            }
        };

        if (this._provider._workspaceFolderChangeTimer) {
            clearTimeout(this._provider._workspaceFolderChangeTimer);
        }
        this._provider._workspaceFolderChangeTimer = setTimeout(() => { this._provider._workspaceFolderChangeTimer = null; run().catch((error) => this._logger.debug('Workspace folder change handling failed', error)); }, 250);
    }

    disposeFileWatchers(options = {}) {
        const permanent = options.permanent === true;
        if (this._fileWatchers?.size) {
            for (const watcher of this._fileWatchers) {
                try { watcher.dispose(); } catch (error) { this._logger.debug('Failed to dispose file watcher', error); }
            }
            this._fileWatchers.clear();
        }
        this._fileWatcher = permanent ? null : undefined;
        this._teardownDynamicWatcherSupport();
        this._pruneInactiveDynamicWatchers(true);
        this._clearWatcherDebounce();
        this._activeWatcherStrategy = 'none';
    }

    _clearWatcherDebounce() {
        if (!this._watcherEventDebounce?.size) return;
        for (const entry of this._watcherEventDebounce.values()) clearTimeout(entry.timer);
        this._watcherEventDebounce.clear();
    }

    _ensureDynamicWatcherSupport() {
        if (!this._provider._smartWatcherEnabled) return;
        if (this._watcherDisposables.length > 0) return;

        const registerWindowListener = (eventName, handler) => {
            const disposable = this._provider._registerEvent(vscode.window, eventName, handler);
            if (disposable) this._watcherDisposables.push(disposable);
        };
        const registerWorkspaceListener = (eventName, handler) => {
            const disposable = this._provider._registerEvent(vscode.workspace, eventName, handler);
            if (disposable) this._watcherDisposables.push(disposable);
        };

        registerWindowListener('onDidChangeVisibleTextEditors', (editors) => { (editors || []).forEach((editor) => this._ensureWatcherForUri(editor?.document?.uri, 'visible-editor')); });
        registerWindowListener('onDidChangeActiveTextEditor', (editor) => { this._ensureWatcherForUri(editor?.document?.uri, 'active-editor'); });
        registerWorkspaceListener('onDidOpenTextDocument', (document) => { this._ensureWatcherForUri(document?.uri, 'open-document'); });
        registerWorkspaceListener('onDidSaveTextDocument', (document) => { this._ensureWatcherForUri(document?.uri, 'save-document'); });

        this._seedDynamicWatchersFromVisibleEditors();
        this._ensureWatcherCleanupTimer();
    }

    _teardownDynamicWatcherSupport() {
        if (this._watcherDisposables?.length) {
            for (const disposable of this._watcherDisposables) {
                try { disposable.dispose(); } catch (error) { this._logger.debug('Failed to dispose watcher listener', error); }
            }
            this._watcherDisposables = [];
        }
        this._stopWatcherCleanupTimer();
    }

    _disposeSmartWatcherFallbackManager() {
        if (this._smartWatcherFallbackManager) {
            try { this._smartWatcherFallbackManager.dispose(); } catch (error) { this._logger.debug('Error disposing smart watcher fallback manager:', error); }
            this._smartWatcherFallbackManager = null;
        }
    }

    _seedDynamicWatchersFromVisibleEditors() {
        const editors = Array.isArray(vscode.window?.visibleTextEditors) ? vscode.window.visibleTextEditors : [];
        editors.forEach((editor) => this._ensureWatcherForUri(editor?.document?.uri, 'visible-seed'));
    }

    _ensureWatcherCleanupTimer() {
        if (this._watcherCleanupTimer) return;
        this._watcherCleanupTimer = setInterval(() => this._pruneInactiveDynamicWatchers(), DEFAULT_WATCHER_INACTIVITY_MS);
    }

    _stopWatcherCleanupTimer() {
        if (this._watcherCleanupTimer) { clearInterval(this._watcherCleanupTimer); this._watcherCleanupTimer = null; }
    }

    _pruneInactiveDynamicWatchers(force = false) {
        if (!this._dynamicWatchers?.size) return;
        const expiry = Date.now() - DEFAULT_WATCHER_INACTIVITY_MS;
        for (const [dir, meta] of this._dynamicWatchers.entries()) {
            if (force || meta.lastUsed < expiry) {
                try { meta.watcher.dispose(); } catch (error) { this._logger.debug(`Failed to dispose dynamic watcher for ${dir}`, error); }
                this._dynamicWatchers.delete(dir);
            }
        }
        if (!this._dynamicWatchers.size) this._stopWatcherCleanupTimer();
    }

    _ensureWatcherForUri(uri, source = 'editor') {
        if (!this._provider._smartWatcherEnabled || !uri || uri.scheme !== 'file') return;
        if (!nodePath) return;
        const dirPath = nodePath.dirname(uri.fsPath || '');
        if (!dirPath) return;
        const normalized = normalizePath(dirPath);
        const existing = this._dynamicWatchers.get(normalized);
        if (existing) { existing.lastUsed = Date.now(); return; }
        if (this._dynamicWatchers.size >= DEFAULT_DYNAMIC_WATCHER_LIMIT) this._evictOldestDynamicWatcher();
        try {
            const pattern = new vscode.RelativePattern(normalized, '**/*');
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            const watcherLabel = nodePath.basename(normalized) || 'root';
            this._registerWatcherHandlers(watcher, `dynamic:${source}:${watcherLabel}`);
            this._dynamicWatchers.set(normalized, { watcher, lastUsed: Date.now(), source });
        } catch (error) {
            this._logger.debug(`Failed to create dynamic watcher for ${normalized}`, error);
        }
    }

    _evictOldestDynamicWatcher() {
        let oldestKey = null; let oldestValue = Number.POSITIVE_INFINITY;
        for (const [dir, meta] of this._dynamicWatchers.entries()) {
            if (meta.lastUsed < oldestValue) { oldestValue = meta.lastUsed; oldestKey = dir; }
        }
        if (oldestKey) {
            const meta = this._dynamicWatchers.get(oldestKey);
            try { meta?.watcher?.dispose(); } catch (error) { this._logger.debug(`Failed to evict watcher for ${oldestKey}`, error); }
            this._dynamicWatchers.delete(oldestKey);
        }
    }
}

function createWatcherManager(provider) {
    return new WatcherManager(provider);
}

module.exports = { createWatcherManager };
