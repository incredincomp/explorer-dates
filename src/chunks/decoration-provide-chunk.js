// Heavy-lifting decoration provider logic moved to a separate chunk to reduce core bundle size
// Exports a factory that returns an object with provideDecoration(provider, uri, token)

function createDecorationProviderHelpers(provider) {
    const vscode = require('vscode');
    const { diagLogOnce, diagLog, isWebDiagnosticsEnabled } = require('../utils/webDiagnostics');
    let decorationDiagCount = 0;
    const maxDecorationDiag = 20;
    // Keep in sync with package.json contributes.colors and file-date-provider-impl custom tokens.
    const CONTRIBUTED_CUSTOM_COLOR_TOKENS = new Set([
        'explorerDates.customColor.veryRecent',
        'explorerDates.customColor.recent',
        'explorerDates.customColor.old'
    ]);
    const isWebRuntime = (() => {
        try {
            return vscode?.env?.uiKind === vscode?.UIKind?.Web;
        } catch {
            return false;
        }
    })();
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
        let logged = false;
        let currentScheme = null;
        let returnValue;
        let nullReason = null;
        let exceptionName = null;
        let exceptionMessage = null;
        let timestampInfo = null;
        let timestampAttempted = false;
        let resolvedTimestampMs = null;
        let decorationKeys = null;
        let hasColor = null;
        let colorId = null;
        let badgeValue = null;
        let propagateValue = null;
        let isCanary = false;
        const shouldLog = () => isWebDiagnosticsEnabled && isWebDiagnosticsEnabled() && decorationDiagCount < maxDecorationDiag;
        const getDefaultMeta = () => {
            let config = null;
            try { config = vscode.workspace.getConfiguration('explorerDates'); } catch { config = null; }
            const fallbackScheme = config ? config.get('colorScheme', 'none') : 'none';
            const fallbackShow = config ? config.get('showDateDecorations', true) : true;
            const fallbackPerf = typeof provider._performanceMode === 'boolean'
                ? provider._performanceMode
                : (config ? config.get('performanceMode', false) : false);
            const builtinFallback = isWebRuntime && config ? !!config.get('webDiagnosticsBuiltinColors', false) : false;
            return {
                isWeb: isWebRuntime,
                isCanary: false,
                builtinColorFallbackActive: builtinFallback,
                colorScheme: fallbackScheme,
                effectiveColorScheme: fallbackScheme,
                showDateDecorations: fallbackShow,
                performanceMode: fallbackPerf,
                featureLevel: provider._featureLevel,
                previewSettings: Boolean(provider._previewSettings)
            };
        };
        const logReturnSample = (meta) => {
            if (!shouldLog() || logged) return;
            decorationDiagCount += 1;
            logged = true;
            const base = getDefaultMeta();
            const merged = { ...base, ...meta };
            if (!merged.scheme && currentScheme) {
                merged.scheme = currentScheme;
            }
            if (!merged.effectiveColorScheme) {
                merged.effectiveColorScheme = merged.colorScheme;
            }
            if (typeof merged.hasColor === 'undefined') {
                merged.hasColor = Boolean(merged.color);
            }
            if (typeof merged.badge === 'undefined') {
                merged.badge = null;
            }
            if (typeof merged.propagate === 'undefined') {
                merged.propagate = null;
            }
            if (typeof merged.decorationKeys === 'undefined') {
                merged.decorationKeys = null;
            }
            if (typeof merged.nullReason === 'undefined') {
                merged.nullReason = null;
            }
            if (typeof merged.timestampSource === 'undefined') {
                merged.timestampSource = 'not-attempted';
            }
            if (typeof merged.gitRecencyAvailable === 'undefined') {
                merged.gitRecencyAvailable = false;
            }
            if (typeof merged.gitRecencyError === 'undefined') {
                merged.gitRecencyError = null;
            }
            if (typeof merged.resolvedTimestampMs === 'undefined') {
                merged.resolvedTimestampMs = null;
            }
            if (typeof merged.gitRepoMatched === 'undefined') {
                merged.gitRepoMatched = null;
            }
            if (typeof merged.gitPathAttempted === 'undefined') {
                merged.gitPathAttempted = null;
            }
            if (!merged.themeTokenSource) {
                if (merged.isCanary) {
                    merged.themeTokenSource = 'canary';
                } else if (merged.builtinColorFallbackActive) {
                    merged.themeTokenSource = 'builtin-fallback';
                } else if (typeof merged.color === 'string' && merged.color.startsWith('explorerDates.')) {
                    merged.themeTokenSource = 'custom-token';
                } else if (merged.color) {
                    merged.themeTokenSource = 'builtin-token';
                } else {
                    merged.themeTokenSource = null;
                }
            }
            diagLog('info', 'Decoration return sample', merged);
        };

        const finalizeSample = (meta) => {
            if (!shouldLog() || logged) return;
            try {
                logReturnSample(meta);
            } catch {
                // never throw diagnostics
            }
        };

        try {
            // Mirror original provideFileDecoration logic but use provider for state
            if (provider._disposed) {
                nullReason = 'disposed';
                return undefined;
            }
            if (!uri) {
                nullReason = 'no-uri';
                return undefined;
            }
            const filePath = uri.fsPath || uri.path || '';
            currentScheme = uri.scheme || 'file';

            const config = vscode.workspace.getConfiguration('explorerDates');
            const perfModeValue = config.get('performanceMode', false);
            if (perfModeValue && typeof perfModeValue !== 'boolean') {
                nullReason = 'invalid-performanceMode';
                return null;
            }

            if (filePath && filePath.includes('\x00')) {
                nullReason = 'invalid-path';
                return null;
            }

            const resolvedFilePath = getUriPath(uri);
            if (!resolvedFilePath) {
                nullReason = 'missing-path';
                return undefined;
            }
            const fileLabel = provider._describeFile ? provider._describeFile(resolvedFilePath) : getFileName(resolvedFilePath) || resolvedFilePath;
            const normalizedFilePath = normalizePath(resolvedFilePath);
            const scheme = currentScheme || 'file';

            // If provider does not implement internal helpers (partial impl in tests), use a lightweight fallback
            if (typeof provider._validateWorkspaceUri !== 'function') {
                diagLogOnce('decorations-fallback-provider', 'warn', 'Decoration fallback active (missing provider helpers)');
                try {
                    const stat = await provider._fileSystem.stat(uri);
                    if (!stat) {
                        nullReason = 'no-stat';
                        return undefined;
                    }
                    const modifiedAt = ensureDate(stat.mtime);
                    const diffMs = Date.now() - modifiedAt.getTime();
                    const badge = diffMs < 24 * 60 * 60 * 1000 ? '•' : diffMs < 7 * 24 * 60 * 60 * 1000 ? '◦' : '·';
                    const tooltip = `Modified: ${modifiedAt.toISOString()}`;
                    const decoration = new vscode.FileDecoration(badge, tooltip);
                    returnValue = decoration;
                    badgeValue = badge;
                    hasColor = false;
                    colorId = null;
                    propagateValue = decoration?.propagate;
                    return decoration;
                } catch {
                    nullReason = 'fallback-error';
                    return undefined;
                }
            }

            const securityValidation = provider._validateWorkspaceUri(uri, 'provideFileDecoration');
            if (!securityValidation?.isValid) {
                nullReason = 'invalid-uri';
                return undefined;
            }
            if (await provider._isExcludedSimple(uri)) {
                nullReason = 'excluded';
                return undefined;
            }

            returnValue = await provider._withFileLock(filePath, async () => {
                if (token?.isCancellationRequested || provider._disposed) {
                    nullReason = token?.isCancellationRequested ? 'cancelled' : 'disposed';
                    return undefined;
                }
                const _get = (key, def) => provider._previewSettings && Object.prototype.hasOwnProperty.call(provider._previewSettings, key)
                    ? provider._previewSettings[key]
                    : vscode.workspace.getConfiguration('explorerDates').get(key, def);

                const canaryEnabled = isWebRuntime && _get('webDiagnosticsCanary', false) && isWebDiagnosticsEnabled && isWebDiagnosticsEnabled();
                if (canaryEnabled && decorationDiagCount < maxDecorationDiag) {
                    const canaryColor = new vscode.ThemeColor('list.warningForeground');
                    const canaryBadge = 'W';
                    const canaryDecoration = new vscode.FileDecoration(canaryBadge, 'Web diagnostics canary', canaryColor);
                    try { canaryDecoration.propagate = true; } catch { /* ignore */ }
                    diagLogOnce('decorations-canary-enabled', 'info', 'Web decoration canary enabled');
                    isCanary = true;
                    badgeValue = canaryBadge;
                    hasColor = true;
                    colorId = 'list.warningForeground';
                    propagateValue = canaryDecoration.propagate;
                    return canaryDecoration;
                }

                if (!_get('showDateDecorations', true)) {
                    diagLogOnce('decorations-disabled', 'info', 'Decorations disabled via settings');
                    nullReason = 'decorations-disabled';
                    return undefined;
                }

                const isViewportPriority = provider._isViewportPriority(uri);
                // Record viewport activity (the helper maintains viewport sets and
                // updates the metrics counters). Avoid double-counting here.
                provider._recordViewportActivity(uri, { reason: 'decoration-request', visible: normalizedFilePath ? provider._viewportVisibleFiles.has(normalizedFilePath) : false });

                const cacheKey = provider._getCacheKey(uri);
                if (!provider._previewSettings) {
                    const cachedDecoration = await provider._getCachedDecoration(cacheKey, fileLabel);
                    if (cachedDecoration) {
                        return cachedDecoration;
                    }
                }

                const queuedCount = provider._globalConcurrencyQueue.length;
                const isBacklogged = queuedCount >= provider._maxConcurrentOperations;
                const isAtCapacity = provider._activeOperations > provider._maxConcurrentOperations * 0.8;
                if (isAtCapacity && isBacklogged) {
                    diagLogOnce('decorations-backpressure', 'warn', 'Decoration backpressure fallback active');
                    const minimal = provider._createMinimalDecoration(uri, Date.now());
                    badgeValue = minimal?.badge || null;
                    hasColor = Boolean(minimal?.color);
                    colorId = minimal?.color && minimal?.color.id ? minimal.color.id : minimal?.color || null;
                    propagateValue = minimal?.propagate;
                    nullReason = 'backpressure';
                    return minimal;
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
                        if (provider._isFileNotFoundError(statError)) {
                            nullReason = 'stat-not-found';
                            return undefined;
                        }
                        if (scheme !== 'file') {
                            nullReason = 'stat-failed';
                            return undefined;
                        }
                        nullReason = 'stat-failed';
                        throw statError;
                    }
                    if (provider._workspaceIntelligence?.incrementalIndexer) provider._workspaceIntelligence.incrementalIndexer.primeFromStat(uri, stat);
                }
                provider._metrics.fileStatTimeMs += Date.now() - fileStatStartTime; provider._metrics.fileStatCalls++;
                const isRegularFile = typeof stat.isFile === 'function' ? stat.isFile() : true;
                if (!isRegularFile) {
                    nullReason = 'not-regular-file';
                    return undefined;
                }

                timestampAttempted = true;
                try {
                    if (typeof provider._resolveTimestampForUri === 'function') {
                        timestampInfo = await provider._resolveTimestampForUri(uri, stat);
                    }
                } catch (err) {
                    timestampInfo = {
                        source: stat?.mtime ? 'fs-stat' : 'none',
                        gitAvailable: false,
                        gitError: err?.message ? `resolver-error:${err.message}` : 'resolver-error',
                        repoMatched: null,
                        pathAttempted: null
                    };
                }
                const resolvedTimestamp = timestampInfo?.timestamp || stat.mtime;
                const modifiedAt = ensureDate(resolvedTimestamp);
                resolvedTimestampMs = modifiedAt?.getTime ? modifiedAt.getTime() : null;
                const createdAt = ensureDate(stat.birthtime || stat.ctime || stat.mtime);
                const normalizedStat = { mtime: modifiedAt, birthtime: createdAt, size: stat.size };
                const diffMs = Date.now() - modifiedAt.getTime();

                const dateFormat = _get('dateDecorationFormat', 'smart');
                const requestedColorScheme = _get('colorScheme', 'none');
                let colorScheme = requestedColorScheme;
                const perfSuppressed = provider._performanceMode && colorScheme !== 'custom';
                if (perfSuppressed) colorScheme = 'none';
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
                colorId = (color && typeof color === 'object' && 'id' in color) ? color.id : (color || null);
                hasColor = Boolean(color);
                badgeValue = String(badge || '');
                propagateValue = decoration?.propagate;
                if (typeof colorId === 'string' && colorId.startsWith('explorerDates.customColor.') && !CONTRIBUTED_CUSTOM_COLOR_TOKENS.has(colorId)) {
                    diagLogOnce(`missing-custom-color-${colorId}`, 'warn', 'Custom color token missing from contributes.colors', {
                        colorId,
                        knownTokens: Array.from(CONTRIBUTED_CUSTOM_COLOR_TOKENS)
                    });
                }
                // Use coordinator's cache API: storeDecorationInCache accepts fileLabel and optional resourceUri
                provider._storeDecorationInCache(cacheKey, decoration, fileLabel, uri);
                return decoration;
            });

            return returnValue;
        } catch (err) {
            exceptionName = err?.name || 'Error';
            exceptionMessage = err?.message || String(err);
            nullReason = nullReason || 'exception';
            return undefined;
        } finally {
            if (returnValue) {
                if (decorationKeys == null) {
                    try { decorationKeys = Object.keys(returnValue || {}); } catch { decorationKeys = null; }
                }
                if (badgeValue == null && typeof returnValue.badge !== 'undefined') {
                    badgeValue = returnValue.badge;
                }
                if (propagateValue == null && typeof returnValue.propagate !== 'undefined') {
                    propagateValue = returnValue.propagate;
                }
                if (colorId == null && typeof returnValue.color !== 'undefined') {
                    try {
                        colorId = returnValue.color && returnValue.color.id ? returnValue.color.id : returnValue.color;
                    } catch {
                        colorId = returnValue.color;
                    }
                }
                if (hasColor == null && typeof colorId !== 'undefined') {
                    hasColor = Boolean(colorId);
                }
            }
            const meta = {
                uri: uri ? getFileName(getUriPath(uri) || '') : null,
                scheme: currentScheme,
                isCanary,
                badge: badgeValue,
                hasColor,
                color: colorId,
                propagate: propagateValue,
                decorationKeys,
                nullReason: returnValue ? null : (nullReason || 'unknown'),
                timestampSource: timestampInfo?.source || (timestampAttempted ? 'none' : 'not-attempted'),
                gitRecencyAvailable: Boolean(timestampInfo?.gitAvailable),
                gitRecencyError: timestampInfo?.gitError || null,
                resolvedTimestampMs,
                gitRepoMatched: timestampInfo?.repoMatched ?? null,
                gitPathAttempted: timestampInfo?.pathAttempted || null,
                exceptionName,
                exceptionMessage
            };
            finalizeSample(meta);
        }
    }

    return { provideDecoration };
}

module.exports = { createDecorationProviderHelpers };
