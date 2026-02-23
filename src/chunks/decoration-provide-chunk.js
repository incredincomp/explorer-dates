// Heavy-lifting decoration provider logic moved to a separate chunk to reduce core bundle size
// Exports a factory that returns an object with provideDecoration(provider, uri, token)

function createDecorationProviderHelpers(provider) {
    const vscode = require('vscode');
    const { diagLogOnce } = require('../utils/webDiagnostics');
    // Prefer new shared utils chunk to reduce duplication across chunks
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
    } catch { /* ignore - shared chunk may not exist in dev mode */ }

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
                } catch { /* ignore runtime fallback resolution errors */ }
            }
        } catch { /* ignore */ }

        // Minimal inline fallbacks
        if (!getFileName) getFileName = (s) => { const str = String(s||''); const idx = str.replace(/\\/g,'/').lastIndexOf('/'); return idx === -1 ? str : str.substring(idx+1); };
        if (!getExtension) getExtension = (name) => { const n = String(name||''); const i = n.lastIndexOf('.'); return i<=0? '': n.substring(i).toLowerCase(); };
        if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
        if (!getUriPath) getUriPath = (t='') => { if (!t) return ''; if (typeof t === 'string') return t; if (t?.fsPath) return t.fsPath; if (t?.path) return t.path; return String(t); };
        if (!ensureDate) ensureDate = (x) => (x instanceof Date ? x : (typeof x === 'number' ? new Date(x) : (typeof x === 'string' ? (isNaN(Date.parse(x)) ? new Date() : new Date(Date.parse(x))) : new Date())));
    }

    async function provideDecoration(uri, token) {
        // Mirror original provideFileDecoration logic but use provider for state
        if (provider._disposed) return undefined;
        if (!uri) return undefined;
        const filePath = uri.fsPath; if (!filePath) return undefined;

        const config = vscode.workspace.getConfiguration('explorerDates');
        const perfModeValue = config.get('performanceMode', false);
        if (perfModeValue && typeof perfModeValue !== 'boolean') return null;

        if (filePath && filePath.includes('\x00')) return null;

        const resolvedFilePath = getUriPath(uri);
        if (!resolvedFilePath) return undefined;
        const fileLabel = provider._describeFile ? provider._describeFile(resolvedFilePath) : getFileName(resolvedFilePath) || resolvedFilePath;
        const normalizedFilePath = normalizePath(resolvedFilePath);
        const scheme = uri.scheme || 'file';
        if (scheme !== 'file') return undefined;

        // If provider does not implement internal helpers (partial impl in tests), use a lightweight fallback
        if (typeof provider._validateWorkspaceUri !== 'function') {
            diagLogOnce('decorations-fallback-provider', 'warn', 'Decoration fallback active (missing provider helpers)');
            try {
                const stat = await provider._fileSystem.stat(uri);
                if (!stat) return undefined;
                const modifiedAt = ensureDate(stat.mtime);
                const diffMs = Date.now() - modifiedAt.getTime();
                const badge = diffMs < 24 * 60 * 60 * 1000 ? '•' : diffMs < 7 * 24 * 60 * 60 * 1000 ? '◦' : '·';
                const tooltip = `Modified: ${modifiedAt.toISOString()}`;
                return new vscode.FileDecoration(badge, tooltip);
            } catch {
                return undefined;
            }
        }

        const securityValidation = provider._validateWorkspaceUri(uri, 'provideFileDecoration');
        if (!securityValidation?.isValid) return undefined;
        if (await provider._isExcludedSimple(uri)) return undefined;

        return provider._withFileLock(filePath, async () => {
            if (token?.isCancellationRequested || provider._disposed) return undefined;
            const _get = (key, def) => provider._previewSettings && Object.prototype.hasOwnProperty.call(provider._previewSettings, key)
                ? provider._previewSettings[key]
                : vscode.workspace.getConfiguration('explorerDates').get(key, def);

            if (!_get('showDateDecorations', true)) {
                diagLogOnce('decorations-disabled', 'info', 'Decorations disabled via settings');
                return undefined;
            }

            const isViewportPriority = provider._isViewportPriority(uri);
            // Record viewport activity (the helper maintains viewport sets and
            // updates the metrics counters). Avoid double-counting here.
            provider._recordViewportActivity(uri, { reason: 'decoration-request', visible: normalizedFilePath ? provider._viewportVisibleFiles.has(normalizedFilePath) : false });

            const cacheKey = provider._getCacheKey(uri);
            if (!provider._previewSettings) {
                const cachedDecoration = await provider._getCachedDecoration(cacheKey, fileLabel);
                if (cachedDecoration) return cachedDecoration;
            }

            const queuedCount = provider._globalConcurrencyQueue.length;
            const isBacklogged = queuedCount >= provider._maxConcurrentOperations;
            const isAtCapacity = provider._activeOperations > provider._maxConcurrentOperations * 0.8;
            if (isAtCapacity && isBacklogged) {
                diagLogOnce('decorations-backpressure', 'warn', 'Decoration backpressure fallback active');
                return provider._createMinimalDecoration(uri, Date.now());
            }

            provider._checkMemoryPressure();
            provider._metrics.cacheMisses++;

            let stat = null;
            if (!isViewportPriority && provider._workspaceIntelligence?.incrementalIndexer) {
                const indexed = provider._workspaceIntelligence.incrementalIndexer.getIndexedStat(filePath);
                if (indexed) {
                    stat = indexed;
                }
            }

            const fileStatStartTime = Date.now();
            if (!stat) {
                try { stat = await provider._fileSystem.stat(uri); } catch (statError) {
                    provider._metrics.fileStatTimeMs += Date.now() - fileStatStartTime; provider._metrics.fileStatCalls++;
                    if (provider._isFileNotFoundError(statError)) return undefined;
                    throw statError;
                }
                if (provider._workspaceIntelligence?.incrementalIndexer) provider._workspaceIntelligence.incrementalIndexer.primeFromStat(uri, stat);
            }
            provider._metrics.fileStatTimeMs += Date.now() - fileStatStartTime; provider._metrics.fileStatCalls++;
            const isRegularFile = typeof stat.isFile === 'function' ? stat.isFile() : true;
            if (!isRegularFile) return undefined;

            const modifiedAt = ensureDate(stat.mtime);
            const createdAt = ensureDate(stat.birthtime || stat.ctime || stat.mtime);
            const normalizedStat = { mtime: modifiedAt, birthtime: createdAt, size: stat.size };
            const diffMs = Date.now() - modifiedAt.getTime();

            const dateFormat = _get('dateDecorationFormat', 'smart');
            let colorScheme = _get('colorScheme', 'none');
            if (provider._performanceMode && colorScheme !== 'custom') colorScheme = 'none';
            const fileSizeFormat = _get('fileSizeFormat', 'auto');

            const logic = provider._decorationLogic;
            const formatBadge = logic && typeof logic._formatDateBadge === 'function'
                ? logic._formatDateBadge
                : provider._formatDateBadge;
            const buildTooltip = logic && typeof logic._buildTooltipContent === 'function'
                ? logic._buildTooltipContent
                : provider._buildTooltipContent;
            const acquireDecoration = logic && typeof logic.acquireDecorationFromPool === 'function'
                ? logic.acquireDecorationFromPool
                : provider._acquireDecorationFromPool;

            const badge = formatBadge(modifiedAt, dateFormat, diffMs);
            const color = provider._getColorByScheme(modifiedAt, colorScheme, filePath);
            const tooltip = await buildTooltip({ filePath, resourceUri: uri, stat: normalizedStat, badgeDetails: {}, gitBlame: null, shouldUseAccessibleTooltips: false, fileSizeFormat, isCodeFile: false });

            const decoration = acquireDecoration({ badge, tooltip, color });
            // Use coordinator's cache API: storeDecorationInCache accepts fileLabel and optional resourceUri
            provider._storeDecorationInCache(cacheKey, decoration, fileLabel, uri);
            return decoration;
        });
    }

    return { provideDecoration };
}

module.exports = { createDecorationProviderHelpers };
