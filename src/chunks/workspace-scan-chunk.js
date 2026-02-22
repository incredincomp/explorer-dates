const WORKSPACE_SCAN_TIMEOUT_MS = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_TIMEOUT_MS || 5000);
const WORKSPACE_SCAN_MAX_RESULTS = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULT || 10000);
const WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT || 1000000);
const WORKSPACE_SCALE_LARGE_THRESHOLD = Number(process.env.EXPLORER_DATES_WORKSPACE_SCALE_LARGE_THRESHOLD || 100000);
const WORKSPACE_SCALE_EXTREME_THRESHOLD = Number(process.env.EXPLORER_DATES_WORKSPACE_SCALE_EXTREME_THRESHOLD || 200000);

function _safeRequireVscode() {
    try { return require('vscode'); } catch { return null; }
}

async function findWorkspaceFilesWithTimeout(provider, maxResults) {
    const timeout = Number.isFinite(WORKSPACE_SCAN_TIMEOUT_MS) ? WORKSPACE_SCAN_TIMEOUT_MS : 0;
    const vscode = _safeRequireVscode();
    const scanPromise = vscode ? vscode.workspace.findFiles('**/*', null, maxResults) : Promise.resolve([]);

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
        provider._logger?.warn?.('Workspace scan failed, assuming large workspace', { error: error?.message || String(error) });
        return null;
    }
}

function startWorkspaceScanWatchdog(provider) {
    if (provider._workspaceScanTimedOut) return Promise.resolve();

    const configuredMs = Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS);
    const baseTimeout = Number.isFinite(WORKSPACE_SCAN_TIMEOUT_MS) && WORKSPACE_SCAN_TIMEOUT_MS > 0 ? WORKSPACE_SCAN_TIMEOUT_MS : 5000;
    const derivedMs = Number.isFinite(configuredMs) ? configuredMs : Math.min(20000, Math.max(3000, baseTimeout + 2000));

    if (!Number.isFinite(derivedMs) || derivedMs <= 0) return null;

    if (provider._workspaceScanWatchdogTimer) {
        clearTimeout(provider._workspaceScanWatchdogTimer);
    }

    return new Promise((resolve) => {
        provider._workspaceScanWatchdogTimer = setTimeout(() => {
            provider._workspaceScanWatchdogTimer = null;
            provider._workspaceScanTimedOut = true;
            provider._workspaceFileCount = WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT;
            provider._workspaceScale = 'extreme';
            try {
                const vscode = _safeRequireVscode();
                const config = vscode ? vscode.workspace.getConfiguration('explorerDates') : null;
                provider._applyFeatureLevel(provider._determineFeatureLevel(config), 'workspace-scale-watchdog');
            } catch {
                provider._applyFeatureLevel(provider._determineFeatureLevel(), 'workspace-scale-watchdog');
            }
            provider._logger?.warn?.(`Workspace size check exceeded ${derivedMs}ms; forcing extreme scale fallback`);
            resolve();
        }, derivedMs);
    });
}

function clearWorkspaceScanWatchdog(provider) {
    if (provider._workspaceScanWatchdogTimer) {
        clearTimeout(provider._workspaceScanWatchdogTimer);
        provider._workspaceScanWatchdogTimer = null;
    }
}

async function performWorkspaceSizeCheck(provider) {
    const vscode = _safeRequireVscode();
    const config = vscode ? vscode.workspace.getConfiguration('explorerDates') : null;
    const forceEnable = config ? config.get('forceEnableForLargeWorkspaces', false) : false;
    const performanceMode = config ? config.get('performanceMode', false) : false;
    const suppressPrompt = forceEnable || performanceMode;

    const workspaceFolders = vscode ? vscode.workspace.workspaceFolders : null;
    if (!workspaceFolders || workspaceFolders.length === 0) return;

    provider._logger?.info?.('Checking workspace size for large workspace detection...');
    const files = await findWorkspaceFilesWithTimeout(provider, WORKSPACE_SCAN_MAX_RESULTS);
    const timedOut = !Array.isArray(files);
    const fileCount = timedOut ? WORKSPACE_SCAN_TIMEOUT_FALLBACK_COUNT : files.length;

    if (timedOut) {
        const timeoutMsg = WORKSPACE_SCAN_TIMEOUT_MS ? `${WORKSPACE_SCAN_TIMEOUT_MS}ms` : 'the configured timeout';
        provider._logger?.warn?.(`Workspace scan exceeded ${timeoutMsg}; defaulting to extreme scale`);
    } else {
        const thresholdLabel = `${WORKSPACE_SCALE_LARGE_THRESHOLD}+`;
        provider._logger?.info?.(`Workspace contains ${fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD ? thresholdLabel : fileCount} files`);
    }

    const previousScale = provider._workspaceScale;
    provider._workspaceFileCount = fileCount;
    provider._workspaceScale = fileCount >= WORKSPACE_SCALE_EXTREME_THRESHOLD ? 'extreme' : fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD ? 'large' : 'normal';

    try {
        const primaryWorkspace = workspaceFolders[0]?.uri;
        const wd = require('../utils/workspaceDetection');
        if (wd && typeof wd.setCachedWorkspaceMetrics === 'function') wd.setCachedWorkspaceMetrics(primaryWorkspace, fileCount);
    } catch (cacheError) { provider._logger?.debug?.('Unable to cache workspace file count', cacheError); }

    if (previousScale !== provider._workspaceScale && provider._smartWatcherEnabled && !provider._performanceMode) {
        provider._logger?.info?.(`Workspace scale changed ${previousScale} -> ${provider._workspaceScale}; recalibrating watchers`);
        provider._setupFileWatcher('workspace-scale-update');
    }

    if (provider._batchProcessor && typeof provider._batchProcessor.setWorkspaceScale === 'function') {
        provider._batchProcessor.setWorkspaceScale(provider._workspaceScale || 'normal');
    }

    provider._applyFeatureLevel(provider._determineFeatureLevel(config), 'workspace-scale-change');

    if (suppressPrompt) provider._logger?.debug?.('Large workspace prompt suppressed (force/performance mode), but scaling adjustments applied');
}

module.exports = {
    findWorkspaceFilesWithTimeout,
    startWorkspaceScanWatchdog,
    clearWorkspaceScanWatchdog,
    performWorkspaceSizeCheck
};