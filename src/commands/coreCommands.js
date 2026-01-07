const vscode = require('vscode');
const { fileSystem } = require('../filesystem/FileSystemAdapter');
const { getFileName, getRelativePath, getUriPath, normalizePath } = require('../utils/pathUtils');
const { ensureDate } = require('../utils/dateHelpers');
const { getSettingsCoordinator } = require('../utils/settingsCoordinator');
const { SecureFileOperations, SecurityValidator, detectSecurityEnvironment } = require('../utils/securityUtils');

const isWeb = process.env.VSCODE_WEB === 'true';
let childProcess = null;
function loadChildProcess() {
    if (!childProcess && !isWeb) {
        childProcess = eval('require')('child_process');
    }
    return childProcess;
}

const SECURITY_WARNING_THROTTLE_MS_DEFAULT = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_THROTTLE_MS || 5000);
const SECURITY_WARNING_THROTTLE_LIMIT = Number(process.env.EXPLORER_DATES_SECURITY_WARNING_CACHE || 500);
const SECURITY_MAX_WARNINGS_DEFAULT = Number(process.env.EXPLORER_DATES_SECURITY_MAX_WARNINGS_PER_FILE ?? 1);
const settingsCoordinator = getSettingsCoordinator();
const securityEnvironment = detectSecurityEnvironment();
const securityWarningLog = new Map();

function dedupePaths(paths = []) {
    const unique = new Set();
    const result = [];
    for (const entry of paths) {
        if (!entry || unique.has(entry)) {
            continue;
        }
        unique.add(entry);
        result.push(entry);
    }
    return result;
}

function getExplicitBooleanSetting(config, key) {
    if (!config || typeof config.inspect !== 'function') {
        return undefined;
    }
    try {
        const inspected = config.inspect(key);
        if (!inspected) {
            return undefined;
        }
        const scopes = [
            inspected.workspaceFolderValue,
            inspected.workspaceValue,
            inspected.globalValue
        ];
        for (const value of scopes) {
            if (typeof value === 'boolean') {
                return value;
            }
        }
    } catch {
        // ignore
    }
    return undefined;
}

function normalizeSecurityPaths(candidatePaths = []) {
    const list = Array.isArray(candidatePaths)
        ? candidatePaths
        : (candidatePaths ? [candidatePaths] : []);
    const normalized = [];
    for (const entry of list) {
        if (!entry || typeof entry !== 'string') {
            continue;
        }
        const cleaned = entry.trim().replace(/^['"]|['"]$/g, '');
        if (!cleaned) {
            continue;
        }
        const normalizedPath = normalizePath(cleaned);
        if (normalizedPath) {
            normalized.push(normalizedPath);
        }
    }
    return normalized;
}

function parseEnvSecurityPaths() {
    const envValue = process.env.EXPLORER_DATES_SECURITY_EXTRA_PATHS;
    if (!envValue || typeof envValue !== 'string') {
        return [];
    }
    const delimiter = process.platform === 'win32' ? ';' : ':';
    return envValue
        .split(delimiter)
        .map((value) => value.trim())
        .filter(Boolean);
}

function isTestLikeEnvironment() {
    return securityEnvironment === 'test' ||
        process.env.EXPLORER_DATES_TEST_MODE === '1' ||
        process.env.NODE_ENV === 'test' ||
        process.env.VSCODE_TEST === '1';
}

function getSecurityValidationContext() {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const allowTestPaths = config.get('security.allowTestPaths', true);
    const extraPathsSetting = config.get('security.allowedExtraPaths', []);

    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    const workspaceRoots = workspaceFolders
        .map((folder) => {
            try {
                return normalizePath(getUriPath(folder.uri));
            } catch {
                return null;
            }
        })
        .filter(Boolean);

    const normalizedExtras = normalizeSecurityPaths(extraPathsSetting);
    const envExtras = normalizeSecurityPaths(parseEnvSecurityPaths());
    const combinedAllowed = dedupePaths([
        ...workspaceRoots,
        ...normalizedExtras,
        ...envExtras
    ]);

    const explicitBoundary = getExplicitBooleanSetting(config, 'security.enableBoundaryEnforcement');
    const legacyBoundary = getExplicitBooleanSetting(config, 'security.enforceWorkspaceBoundaries');
    let enforceBoundaries;
    if (typeof explicitBoundary === 'boolean') {
        enforceBoundaries = explicitBoundary;
    } else if (typeof legacyBoundary === 'boolean') {
        enforceBoundaries = legacyBoundary;
    } else {
        enforceBoundaries = securityEnvironment === 'production';
    }

    const relaxedForTests = allowTestPaths && isTestLikeEnvironment();
    const shouldEnforce = enforceBoundaries && !relaxedForTests && combinedAllowed.length > 0;

    const throttleMsSetting = config.get('security.logThrottleWindowMs');
    const maxWarningsSetting = config.get('security.maxWarningsPerFile');
    const throttleMs = Number.isFinite(throttleMsSetting)
        ? Math.max(0, throttleMsSetting)
        : (Number.isFinite(SECURITY_WARNING_THROTTLE_MS_DEFAULT) ? Math.max(0, SECURITY_WARNING_THROTTLE_MS_DEFAULT) : 5000);
    const maxWarnings = Number.isFinite(maxWarningsSetting) && maxWarningsSetting >= 0
        ? maxWarningsSetting
        : (Number.isFinite(SECURITY_MAX_WARNINGS_DEFAULT) && SECURITY_MAX_WARNINGS_DEFAULT >= 0 ? SECURITY_MAX_WARNINGS_DEFAULT : 1);

    return {
        allowedPaths: shouldEnforce ? combinedAllowed : [],
        enforceBoundaries: shouldEnforce,
        throttleMs,
        maxWarningsPerFile: maxWarnings
    };
}

function shouldThrottleSecurityWarning(key, throttleMs, maxWarningsPerFile) {
    if (!key) {
        return false;
    }
    const now = Date.now();
    const entry = securityWarningLog.get(key) || { lastTimestamp: 0, count: 0 };
    if (typeof maxWarningsPerFile === 'number' &&
        maxWarningsPerFile >= 0 &&
        entry.count >= maxWarningsPerFile) {
        return true;
    }
    if (typeof throttleMs === 'number' &&
        throttleMs > 0 &&
        now - entry.lastTimestamp < throttleMs) {
        return true;
    }
    entry.lastTimestamp = now;
    entry.count = (entry.count || 0) + 1;
    securityWarningLog.set(key, entry);
    if (securityWarningLog.size > SECURITY_WARNING_THROTTLE_LIMIT) {
        const keys = Array.from(securityWarningLog.keys());
        const trimCount = Math.ceil(keys.length * 0.25);
        for (let i = 0; i < trimCount; i++) {
            securityWarningLog.delete(keys[i]);
        }
    }
    return false;
}

function getSanitizedPathForLog(target) {
    let rawPath = '';
    if (typeof target === 'string') {
        rawPath = target;
    } else if (target) {
        rawPath = target.fsPath || target.path || '';
        if (!rawPath && typeof target.toString === 'function') {
            try {
                rawPath = target.toString(true);
            } catch {
                rawPath = target.toString();
            }
        }
    }
    const sanitized = SecurityValidator.sanitizePath(rawPath || '', { preserveExtension: true });
    return sanitized || 'unknown';
}

function ensureSecureUri(targetUri, logger, reason) {
    if (!targetUri) {
        return null;
    }
    const securityContext = getSecurityValidationContext();
    const validation = SecureFileOperations.validateFileUri(targetUri, securityContext.allowedPaths);
    const sanitizedPath = getSanitizedPathForLog(targetUri);
    if (!validation.isValid) {
        const warningKey = `${reason}:${sanitizedPath}`;
        if (!shouldThrottleSecurityWarning(warningKey, securityContext.throttleMs, securityContext.maxWarningsPerFile)) {
            const logLevel = securityEnvironment === 'production' ? 'warn' :
                (securityEnvironment === 'development' ? 'info' : 'debug');
            const logFn = typeof logger[logLevel] === 'function'
                ? logger[logLevel].bind(logger)
                : logger.warn.bind(logger);
            logFn(`Blocked ${reason} due to insecure path`, {
                path: sanitizedPath,
                issue: validation.issue,
                environment: securityEnvironment,
                enforceBoundaries: securityContext.enforceBoundaries
            });
        }
        if (securityEnvironment === 'production') {
            vscode.window.showWarningMessage('Explorer Dates blocked this file because its path failed security checks.');
        }
        return null;
    }
    if (validation.warnings?.length) {
        const warningKey = `warning:${reason}:${sanitizedPath}:${validation.warnings.join('|')}`;
        if (!shouldThrottleSecurityWarning(warningKey, securityContext.throttleMs, securityContext.maxWarningsPerFile)) {
            const logLevel = securityEnvironment === 'production' ? 'warn' :
                (securityEnvironment === 'development' ? 'info' : 'debug');
            const logFn = typeof logger[logLevel] === 'function'
                ? logger[logLevel].bind(logger)
                : logger.warn.bind(logger);
            logFn(`Security warnings for ${reason}`, {
                path: sanitizedPath,
                warnings: validation.warnings,
                environment: securityEnvironment,
                enforceBoundaries: securityContext.enforceBoundaries
            });
        }
    }
    return targetUri;
}

function registerCoreCommands({ context, fileDateProvider, logger, l10n }) {
    const subscriptions = [];

    subscriptions.push(vscode.commands.registerCommand('explorerDates.refreshDateDecorations', () => {
        try {
            if (fileDateProvider) {
                fileDateProvider.clearAllCaches();
                fileDateProvider.refreshAll();
                const message = l10n?.getString('refreshSuccess') || 'Date decorations refreshed - all caches cleared';
                vscode.window.showInformationMessage(message);
                logger.info('Date decorations refreshed manually with cache clear');
            }
        } catch (error) {
            logger.error('Failed to refresh decorations', error);
            vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.previewConfiguration', (settings) => {
        try {
            if (fileDateProvider) {
                fileDateProvider.applyPreviewSettings(settings);
                logger.info('Configuration preview applied', settings);
            }
        } catch (error) {
            logger.error('Failed to apply configuration preview', error);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.clearPreview', () => {
        try {
            if (fileDateProvider) {
                fileDateProvider.applyPreviewSettings(null);
                logger.info('Configuration preview cleared');
            }
        } catch (error) {
            logger.error('Failed to clear configuration preview', error);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showMetrics', async () => {
        try {
            if (fileDateProvider) {
                const metrics = fileDateProvider.getMetrics();
                let message = `Explorer Dates Metrics:\n` +
                    `Total Decorations: ${metrics.totalDecorations}\n` +
                    `Cache Size: ${metrics.cacheSize}\n` +
                    `Cache Hits: ${metrics.cacheHits}\n` +
                    `Cache Misses: ${metrics.cacheMisses}\n` +
                    `Cache Hit Rate: ${metrics.cacheHitRate}\n` +
                    `Errors: ${metrics.errors}`;

                if (metrics.advancedCache) {
                    message += `\n\nAdvanced Cache:\n` +
                        `Memory Items: ${metrics.advancedCache.memoryItems}\n` +
                        `Memory Usage: ${(metrics.advancedCache.memoryUsage / 1024 / 1024).toFixed(2)} MB\n` +
                        `Memory Hit Rate: ${metrics.advancedCache.memoryHitRate}\n` +
                        `Disk Hit Rate: ${metrics.advancedCache.diskHitRate}\n` +
                        `Evictions: ${metrics.advancedCache.evictions}`;
                }

                if (metrics.batchProcessor) {
                    message += `\n\nBatch Processor:\n` +
                        `Queue Length: ${metrics.batchProcessor.queueLength}\n` +
                        `Is Processing: ${metrics.batchProcessor.isProcessing}\n` +
                        `Average Batch Time: ${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms`;
                }

                const choice = await vscode.window.showInformationMessage(
                    message, 
                    { modal: true },
                    'View Rich Analytics'
                );

                if (choice === 'View Rich Analytics') {
                    // Lazy load the rich analytics view
                    await vscode.commands.executeCommand('explorerDates.showPerformanceAnalytics');
                }

                logger.info('Metrics displayed', metrics);
            }
        } catch (error) {
            logger.error('Failed to show metrics', error);
            vscode.window.showErrorMessage(`Failed to show metrics: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.openLogs', () => {
        try {
            logger.show();
        } catch (error) {
            logger.error('Failed to open logs', error);
            vscode.window.showErrorMessage(`Failed to open logs: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showCurrentConfig', () => {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const settings = {
                highContrastMode: config.get('highContrastMode'),
                badgePriority: config.get('badgePriority'),
                colorScheme: config.get('colorScheme'),
                accessibilityMode: config.get('accessibilityMode'),
                dateDecorationFormat: config.get('dateDecorationFormat'),
                showGitInfo: config.get('showGitInfo'),
                showFileSize: config.get('showFileSize')
            };

            const message = `Current Explorer Dates Configuration:\n\n${Object.entries(settings)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}`;

            vscode.window.showInformationMessage(message, { modal: true });
            logger.info('Current configuration displayed', settings);
        } catch (error) {
            logger.error('Failed to show configuration', error);
        }
    }));

    // Reset to defaults command is now handled by migrationCommands.js which provides comprehensive reset functionality

    subscriptions.push(vscode.commands.registerCommand('explorerDates.toggleDecorations', async () => {
        try {
            const currentValue = settingsCoordinator.getValue('showDateDecorations');
            await settingsCoordinator.updateSetting('showDateDecorations', !currentValue, {
                scope: 'user',
                reason: 'toggle-decorations'
            });
            const message = !currentValue
                ? l10n?.getString('decorationsEnabled') || 'Date decorations enabled'
                : l10n?.getString('decorationsDisabled') || 'Date decorations disabled';
            vscode.window.showInformationMessage(message);
            logger.info(`Date decorations toggled to: ${!currentValue}`);
        } catch (error) {
            logger.error('Failed to toggle decorations', error);
            vscode.window.showErrorMessage(`Failed to toggle decorations: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.copyFileDate', async (uri) => {
        try {
            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const secureUri = ensureSecureUri(targetUri, logger, 'copyFileDate');
            if (!secureUri) {
                return;
            }
            targetUri = secureUri;

            const stat = await fileSystem.stat(targetUri);
            const dateString = ensureDate(stat.mtime).toLocaleString();

            await vscode.env.clipboard.writeText(dateString);
            vscode.window.showInformationMessage(`Copied to clipboard: ${dateString}`);
            logger.info(`File date copied for: ${getSanitizedPathForLog(targetUri)}`);
        } catch (error) {
            logger.error('Failed to copy file date', error);
            vscode.window.showErrorMessage(`Failed to copy file date: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFileDetails', async (uri) => {
        try {
            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const secureUri = ensureSecureUri(targetUri, logger, 'showFileDetails');
            if (!secureUri) {
                return;
            }
            targetUri = secureUri;

            const stat = await fileSystem.stat(targetUri);
            const fileName = getFileName(targetUri.fsPath || targetUri.path);
            const fileSize = fileDateProvider?._formatFileSize(stat.size, 'auto') || `${stat.size} bytes`;
            const modified = ensureDate(stat.mtime).toLocaleString();
            const created = ensureDate(stat.birthtime || stat.mtime).toLocaleString();

            const details = `File: ${fileName}\n` +
                `Size: ${fileSize}\n` +
                `Modified: ${modified}\n` +
                `Created: ${created}\n` +
                `Path: ${targetUri.fsPath || targetUri.path}`;

            vscode.window.showInformationMessage(details, { modal: true });
            logger.info(`File details shown for: ${getSanitizedPathForLog(targetUri)}`);
        } catch (error) {
            logger.error('Failed to show file details', error);
            vscode.window.showErrorMessage(`Failed to show file details: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.toggleFadeOldFiles', async () => {
        try {
            const currentValue = settingsCoordinator.getValue('fadeOldFiles') ?? false;
            await settingsCoordinator.updateSetting('fadeOldFiles', !currentValue, {
                scope: 'user',
                reason: 'toggle-fade'
            });
            const message = !currentValue ? 'Fade old files enabled' : 'Fade old files disabled';
            vscode.window.showInformationMessage(message);
            logger.info(`Fade old files toggled to: ${!currentValue}`);
        } catch (error) {
            logger.error('Failed to toggle fade old files', error);
            vscode.window.showErrorMessage(`Failed to toggle fade old files: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFileHistory', async (uri) => {
        try {
            if (isWeb) {
                vscode.window.showInformationMessage('Git history is unavailable on VS Code for Web.');
                return;
            }

            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const secureUri = ensureSecureUri(targetUri, logger, 'showFileHistory');
            if (!secureUri) {
                return;
            }
            targetUri = secureUri;

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('File is not in a workspace');
                return;
            }

            const relativePath = getRelativePath(workspaceFolder.uri.fsPath || workspaceFolder.uri.path, targetUri.fsPath || targetUri.path);
            const sanitizedRelativePath = SecurityValidator.sanitizePath(relativePath, { preserveExtension: true }) || relativePath;
            const command = `git log --oneline -10 -- "${sanitizedRelativePath}"`;
            const cp = loadChildProcess();

            cp.exec(command, { cwd: workspaceFolder.uri.fsPath, timeout: 3000 }, (error, stdout) => {
                if (error) {
                    if (error.message.includes('not a git repository')) {
                        vscode.window.showWarningMessage('This file is not in a Git repository');
                    } else {
                        vscode.window.showErrorMessage(`Git error: ${error.message}`);
                    }
                    return;
                }

                if (!stdout.trim()) {
                    vscode.window.showInformationMessage('No Git history found for this file');
                    return;
                }

                const history = stdout.trim();
                const fileName = getFileName(targetUri.fsPath || targetUri.path);
                vscode.window.showInformationMessage(
                    `Recent commits for ${fileName}:\n\n${history}`,
                    { modal: true }
                );
            });

            logger.info(`File history requested for: ${getSanitizedPathForLog(targetUri)}`);
        } catch (error) {
            logger.error('Failed to show file history', error);
            vscode.window.showErrorMessage(`Failed to show file history: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.compareWithPrevious', async (uri) => {
        try {
            if (isWeb) {
                vscode.window.showInformationMessage('Git comparisons are unavailable on VS Code for Web.');
                return;
            }

            let targetUri = uri;
            if (!targetUri && vscode.window.activeTextEditor) {
                targetUri = vscode.window.activeTextEditor.document.uri;
            }
            if (!targetUri) {
                vscode.window.showWarningMessage('No file selected');
                return;
            }

            const secureUri = ensureSecureUri(targetUri, logger, 'compareWithPrevious');
            if (!secureUri) {
                return;
            }
            targetUri = secureUri;

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('File is not in a workspace');
                return;
            }

            await vscode.commands.executeCommand('git.openChange', targetUri);
            logger.info(`Git diff opened for: ${getSanitizedPathForLog(targetUri)}`);
        } catch (error) {
            logger.error('Failed to compare with previous version', error);
            vscode.window.showErrorMessage(`Failed to compare with previous version: ${error.message}`);
        }
    }));

    // Note: explorerDates.applyCustomColors command is now handled by migrationCommands.js
    // with enhanced functionality including interactive setup options

    subscriptions.forEach(disposable => context.subscriptions.push(disposable));
}

module.exports = {
    registerCoreCommands
};
