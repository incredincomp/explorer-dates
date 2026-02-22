const vscode = require('vscode');
// Prefer shared utils chunk to reduce duplication
let getFileName, getExtension, normalizePath, getUriPath, ensureDate;
try {
    const shared = require('../chunks/utils-shared-chunk');
    if (shared) {
        getFileName = shared.getFileName;
        getExtension = shared.getExtension;
        normalizePath = shared.normalizePath;
        getUriPath = shared.getUriPath;
        ensureDate = shared.ensureDate;
    }
} catch { /* ignore */ }

if (!getFileName || !ensureDate) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const pathUtils = dynamicRequire('../utils/pathUtils');
                const dateHelpers = dynamicRequire('../utils/dateHelpers');
                getFileName = getFileName || pathUtils.getFileName;
                getExtension = getExtension || pathUtils.getExtension;
                normalizePath = normalizePath || pathUtils.normalizePath;
                getUriPath = getUriPath || pathUtils.getUriPath;
                ensureDate = ensureDate || dateHelpers.ensureDate;
            } catch { /* ignore */ }
        }
    } catch { /* ignore */ }

    // Minimal inline fallbacks
    if (!getFileName) getFileName = (s) => { const str = String(s||''); const idx = str.replace(/\\/g,'/').lastIndexOf('/'); return idx === -1 ? str : str.substring(idx+1); };
    if (!getExtension) getExtension = (name) => { const n = String(name||''); const i = n.lastIndexOf('.'); return i<=0? '': n.substring(i).toLowerCase(); };
    if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
    if (!getUriPath) getUriPath = (t='') => { if (!t) return ''; if (typeof t === 'string') return t; if (t?.fsPath) return t.fsPath; if (t?.path) return t.path; return String(t); };
    if (!ensureDate) ensureDate = (x) => (x instanceof Date ? x : (typeof x === 'number' ? new Date(x) : (typeof x === 'string' ? (isNaN(Date.parse(x)) ? new Date() : new Date(Date.parse(x))) : new Date())));
}

// Local fallback priority map for smart-watcher heuristics (keeps parity with main provider)
const SMART_WATCHER_PRIORITY = new Map([[ 'src', 100 ], [ 'lib', 65 ], [ 'test', 30 ]]);

async function performWorkspaceSizeCheck(provider) {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const forceEnable = config.get('forceEnableForLargeWorkspaces', false);
    const performanceMode = config.get('performanceMode', false);
    const suppressPrompt = forceEnable || performanceMode;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    provider._logger.info('Checking workspace size for large workspace detection...');

    const files = await provider._findWorkspaceFilesWithTimeout(provider._getIndexerMaxFiles());
    const timedOut = !Array.isArray(files);
    const fileCount = timedOut ? provider.WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT : files.length;

    if (timedOut) {
        const timeoutMsg = provider.WORKSPACE_SCAN_TIMEOUT_MS
            ? `${provider.WORKSPACE_SCAN_TIMEOUT_MS}ms`
            : 'the configured timeout';
        provider._logger.warn(`Workspace scan exceeded ${timeoutMsg}; defaulting to extreme scale`);
    } else {
        const thresholdLabel = `${provider.WORKSPACE_SCALE_LARGE_THRESHOLD}+`;
        provider._logger.info(`Workspace contains ${fileCount >= provider.WORKSPACE_SCALE_LARGE_THRESHOLD ? thresholdLabel : fileCount} files`);
    }

    const previousScale = provider._workspaceScale;
    provider._workspaceFileCount = fileCount;
    provider._workspaceScale = fileCount >= provider.WORKSPACE_SCALE_EXTREME_THRESHOLD
        ? 'extreme'
        : fileCount >= provider.WORKSPACE_SCALE_LARGE_THRESHOLD
            ? 'large'
            : 'normal';

    try {
        const primaryWorkspace = workspaceFolders[0]?.uri;
        require('../utils/workspaceDetection').setCachedWorkspaceMetrics(primaryWorkspace, fileCount);
    } catch (cacheError) {
        provider._logger.debug('Unable to cache workspace file count', cacheError);
    }

    if (previousScale !== provider._workspaceScale && provider._smartWatcherEnabled && !provider._performanceMode) {
        provider._logger.info(`Workspace scale changed ${previousScale} -> ${provider._workspaceScale}; recalibrating watchers`);
        provider._setupFileWatcher('workspace-scale-update');
    }

    if (provider._batchProcessor && typeof provider._batchProcessor.setWorkspaceScale === 'function') {
        provider._batchProcessor.setWorkspaceScale(provider._workspaceScale || 'normal');
    }

    provider._applyFeatureLevel(provider._determineFeatureLevel(vscode.workspace.getConfiguration('explorerDates')),'workspace-scale-change');

    if (suppressPrompt) {
        provider._logger.debug('Large workspace prompt suppressed (force/performance mode), but scaling adjustments applied');
    }
}

async function findWorkspaceFilesWithTimeout(provider, maxResults) {
    const timeout = Number.isFinite(provider.WORKSPACE_SCAN_TIMEOUT_MS) ? provider.WORKSPACE_SCAN_TIMEOUT_MS : 0;
    const scanPromise = vscode.workspace.findFiles('**/*', null, maxResults);
    if (!timeout || timeout <= 0) return scanPromise;
    try {
        return await new Promise((resolve, reject) => {
            let timeoutHandle = null;
            const complete = (result, isError = false) => {
                if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
                if (isError) reject(result); else resolve(result);
            };
            timeoutHandle = setTimeout(() => complete(null), timeout);
            scanPromise.then((result) => complete(result), (error) => complete(error, true));
        });
    } catch (error) {
        provider._logger.warn('Workspace scan failed, assuming large workspace', { error: error?.message || String(error) });
        return null;
    }
}

async function _buildSmartWatcherTargets(provider, workspaceFolders, options) {
    const targets = [];

    const totalBudget = Math.max(1, options.maxPatterns);
    let remainingBudget = totalBudget;
    let remainingFolders = workspaceFolders.length;

    for (const folder of workspaceFolders) {
        if (remainingBudget <= 0) {
            break;
        }

        const folderBudget = Math.max(1, Math.floor(remainingBudget / remainingFolders));
        // provider._getWatcherExcludedSetForFolder may be async; call it synchronously here
        // but expect the caller to await if necessary

        // Root-level watcher for important files (counts as one pattern)
            const rootPattern = new vscode.RelativePattern(folder, '*.{md,mdx,json,jsonc,yml,yaml,ts,tsx,js,jsx}');
        targets.push({ pattern: rootPattern, label: `root:${folder.name}` });
        remainingBudget -= 1;

        if (remainingBudget <= 0) {
            break;
        }

        const remainingForFolder = Math.min(Math.max(folderBudget - 1, 0), remainingBudget);
        if (remainingForFolder > 0) {
            // Attempt to enumerate top-level directories and prioritize common
            // source folders (src, lib, test). This helps the fallback behavior
            // used by tests and lightweight environments.
            try {
                const entries = typeof provider._fileSystem?.readdir === 'function'
                    ? await provider._fileSystem.readdir(folder.uri || folder.fsPath || folder)
                    : [];

                const dirNames = (Array.isArray(entries) ? entries : [])
                    .filter((e) => e && (typeof e.isDirectory === 'function' ? e.isDirectory() : true))
                    .map((e) => (typeof e === 'string' ? e : (e.name || '')))
                    .filter(Boolean)
                    .filter((n) => !['node_modules', '.git', 'dist', 'build', 'out'].includes(n));

                provider._logger?.debug && provider._logger.debug('smart-watcher: top-level dirs', { folder: folder.name, dirs: dirNames });

                dirNames.sort((a, b) => (SMART_WATCHER_PRIORITY.get(b) || 0) - (SMART_WATCHER_PRIORITY.get(a) || 0));

                const folderTargets = dirNames.slice(0, remainingForFolder).map((dir) => ({
                    pattern: new vscode.RelativePattern(folder, `${dir}/**/*.{md,mdx,json,jsonc,yml,yaml,ts,tsx,js,jsx}`),
                    label: `sub:${folder.name}/${dir}`
                }));

                const usableTargets = folderTargets.slice(0, remainingForFolder);
                targets.push(...usableTargets);
                remainingBudget -= usableTargets.length;
            } catch {
                // ignore and continue; fallback will remain conservative
            }
        }

        remainingFolders -= 1;
    }

    return targets.slice(0, totalBudget);
}

function _addExclusionValueToSet(targetSet, value, options = {}) {
    if (!value) {
        return;
    }
    const { onlyRootSegment = false } = options;
    const asString = typeof value === 'string'
        ? value
        : (typeof value?.toString === 'function' ? value.toString() : '');
    if (!asString || typeof asString !== 'string') {
        return;
    }

    const normalized = asString.trim();
    if (!normalized) {
        return;
    }

    const sanitized = normalized
        .replace(/\\/g, '/')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');
    const segments = sanitized
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);

    if (!segments.length) {
        if (normalized.includes('*') || normalized.includes('?')) {
            return;
        }
        targetSet.add(normalized.toLowerCase());
        return;
    }

    if (onlyRootSegment) {
        targetSet.add(segments[0].toLowerCase());
        return;
    }

    for (const segment of segments) {
        targetSet.add(segment.toLowerCase());
    }
}

function registerWatcherHandlers(provider, watcher, label = 'unknown') {
    if (!watcher) return;
    watcher.onDidChange((uri) => provider._handleWatcherEvent(uri, 'change', label));
    watcher.onDidCreate((uri) => provider._handleWatcherEvent(uri, 'create', label));
    watcher.onDidDelete((uri) => provider._handleWatcherEvent(uri, 'delete', label));
}

function dispatchWatcherEvent(provider, uri, eventType, source = 'unknown') {
    if (eventType === 'delete') provider.clearDecoration(uri); else provider.refreshDecoration(uri);
    if (provider._workspaceIntelligence?.incrementalIndexer) provider._workspaceIntelligence.incrementalIndexer.queueDelta(uri, eventType);
    if (provider._logWatcherEvents) provider._logger.debug(`Watcher event processed (${eventType}) for ${provider.describeFile(uri)} via ${source}`);
}

module.exports = {
    performWorkspaceSizeCheck,
    findWorkspaceFilesWithTimeout,
    _buildSmartWatcherTargets,
    _addExclusionValueToSet,
    registerWatcherHandlers,
    dispatchWatcherEvent
};
