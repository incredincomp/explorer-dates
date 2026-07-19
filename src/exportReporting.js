const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
let getExtension = (filePath) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { const chunk = dynamicRequire('./chunks/path-utils-chunk'); if (chunk && typeof chunk.getExtension === 'function') { getExtension = chunk.getExtension; return getExtension(filePath); } } } catch { /* ignore */ } try { const name = String(filePath || ''); const dotIndex = name.lastIndexOf('.'); return dotIndex <= 0 ? '' : name.substring(dotIndex).toLowerCase(); } catch { return ''; } };
let normalizePath = (input) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { const chunk = dynamicRequire('./chunks/path-utils-chunk'); if (chunk && typeof chunk.normalizePath === 'function') { normalizePath = chunk.normalizePath; return normalizePath(input); } } } catch { /* ignore */ } return String(input || '').replace(/\\/g, '/'); };
// Prefer shared utils chunk when available
let ensureDate;
try {
    const shared = require('./chunks/utils-shared-chunk');
    if (shared) ensureDate = shared.ensureDate;
} catch { /* ignore */ }
if (!ensureDate) { const dateHelpers = require('./utils/dateHelpers'); ensureDate = dateHelpers.ensureDate; }
const { getLocalization } = require('./utils/localization');
const { formatFileSize } = require('./utils/formatters');
const {
    REPORT_SCHEMA_VERSION, DEFAULT_EXCLUDED_SEGMENTS, normalizePath: normalizeReportPath,
    normalizeTimeRange, rangeStart, normalizeStat, createInclusionPolicy,
    inRange, sortFiles, createSummary, validDate
} = require('./reporting/reportContract');
const l10n = getLocalization();

const logger = getLogger();
const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const isWeb = env.VSCODE_WEB === 'true';
const DEFAULT_EXCLUDED_FOLDERS = DEFAULT_EXCLUDED_SEGMENTS;
const DEFAULT_EXCLUDED_PATTERNS = ['**/*.tmp', '**/*.log'];
const DEFAULT_MAX_TRACKED_FILES = 3000;
const MAX_TRACK_HISTORY_PER_FILE = 100;
const MAX_TRACKED_FILES_LIMIT = 20000;

/**
 * Export & Reporting Manager
 * Handles file modification reports, time tracking integration, and project analytics
 */
class ExportReportingManager {
    constructor() {
        this.fileActivityCache = new Map();
        this._trackedFileOrder = new Map();
        this.allowedFormats = ['json', 'html'];
        this.activityTrackingDays = 30;
        this.activityCutoffMs = null;
        this.timeTrackingIntegration = 'none';
        this.maxTrackedActivityFiles = DEFAULT_MAX_TRACKED_FILES;
        this.excludedFolders = [...DEFAULT_EXCLUDED_FOLDERS];
        this.excludedPatterns = [...DEFAULT_EXCLUDED_PATTERNS];
        this._excludedRegexes = [];
        this._configurationWatcher = null;
        this._fileWatcher = null;
        this._fileWatcherSubscriptions = [];
        this._userActivityDisposables = [];
        this._recentUserInteraction = new Map();
        this._userInteractionTtlMs = Number(env.EXPLORER_DATES_USER_ACTIVITY_TTL_MS || 5 * 60 * 1000);
        this._activitySourceStats = {
            user: 0,
            watcher: 0
        };
        this._lightweightMode = env.EXPLORER_DATES_LIGHTWEIGHT_MODE === '1';
        this._trackingDisabled = false;
        this._reportInProgress = null;
        this._reportPolicy = createInclusionPolicy();
        this._loadConfiguration();
        this._setupConfigurationWatcher();
        this.initialize();
    }

    _loadConfiguration() {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const configuredFormats = config.get('reportFormats', ['json', 'html']);
            const supported = new Set(['json', 'csv', 'html', 'markdown']);
            this.allowedFormats = Array.from(new Set((Array.isArray(configuredFormats) ? configuredFormats : [])
                .map(format => String(format).toLowerCase()).filter(format => supported.has(format))));
            if (this.allowedFormats.length === 0) this.allowedFormats = ['json'];
            const days = config.get('activityTrackingDays', 30);
            this.activityTrackingDays = Math.max(1, Math.min(365, days));
            this.activityCutoffMs = this.activityTrackingDays * 24 * 60 * 60 * 1000;
            this.timeTrackingIntegration = config.get('timeTrackingIntegration', 'none');
            this.maxTrackedActivityFiles = this._resolveTrackedFileLimit(
                config.get('maxTrackedActivityFiles', DEFAULT_MAX_TRACKED_FILES)
            );
            this.excludedFolders = config.get('excludedFolders', DEFAULT_EXCLUDED_FOLDERS) || DEFAULT_EXCLUDED_FOLDERS;
            this.excludedPatterns = config.get('excludedPatterns', DEFAULT_EXCLUDED_PATTERNS) || DEFAULT_EXCLUDED_PATTERNS;
            this._excludedRegexes = this.excludedPatterns
                .map((pattern) => this._createPatternRegex(pattern))
                .filter(Boolean);
            const workspaceExclusions = vscode.workspace.getConfiguration('files').get('exclude', {}) || {};
            const enabledWorkspaceExclusions = Object.keys(workspaceExclusions).filter(key => workspaceExclusions[key] !== false);
            this._reportPolicy = createInclusionPolicy({
                excludedSegments: this.excludedFolders,
                excludedPatterns: [...this.excludedPatterns, ...enabledWorkspaceExclusions]
            });
        } catch (error) {
            logger.error('Failed to load reporting configuration', error);
        }
    }

    _setupConfigurationWatcher() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('explorerDates.reportFormats') ||
                event.affectsConfiguration('explorerDates.activityTrackingDays') ||
                event.affectsConfiguration('explorerDates.timeTrackingIntegration') ||
                event.affectsConfiguration('explorerDates.maxTrackedActivityFiles') ||
                event.affectsConfiguration('explorerDates.excludedFolders') ||
                event.affectsConfiguration('explorerDates.excludedPatterns') ||
                event.affectsConfiguration('explorerDates.performanceMode')) {
                this._loadConfiguration();
                this._applyTrackingConfiguration();
                logger.info('Reporting configuration updated', {
                    allowedFormats: this.allowedFormats,
                    activityTrackingDays: this.activityTrackingDays,
                    timeTrackingIntegration: this.timeTrackingIntegration,
                    maxTrackedActivityFiles: this.maxTrackedActivityFiles
                });
            }
        });
    }

    async initialize() {
        try {
            if (this._isTrackingSuppressed()) {
                this._trackingDisabled = true;
                this._disposeUserActivityListeners();
                this._stopFileWatcher();
                logger.info('Export & Reporting Manager initialized (activity tracking suppressed by performance/lightweight mode)');
                return;
            }
            this._trackingDisabled = false;
            this._registerUserActivityListeners();
            this._applyTrackingConfiguration();
            logger.info('Export & Reporting Manager initialized');
        } catch (error) {
            logger.error('Failed to initialize Export & Reporting Manager:', error);
        }
    }

    startFileWatcher() {
        if (this._fileWatcher || this.maxTrackedActivityFiles === 0 || isWeb) {
            if (this.maxTrackedActivityFiles === 0) {
                logger.info('File activity tracking disabled (maxTrackedActivityFiles=0)');
            }
            if (isWeb) {
                logger.info('Skipping file activity watcher in web environment');
            }
            return;
        }
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this._fileWatcher = watcher;
        
        this._fileWatcherSubscriptions = [
            watcher.onDidChange((uri) => this.recordFileActivity(uri, 'modified', { source: 'watcher' })),
            watcher.onDidCreate((uri) => this.recordFileActivity(uri, 'created', { source: 'watcher' })),
            watcher.onDidDelete((uri) => this.recordFileActivity(uri, 'deleted', { source: 'watcher' }))
        ];
    }

    _stopFileWatcher() {
        if (this._fileWatcherSubscriptions.length) {
            for (const disposable of this._fileWatcherSubscriptions) {
                try {
                    disposable.dispose();
                } catch {
                    // ignore
                }
            }
            this._fileWatcherSubscriptions = [];
        }
        if (this._fileWatcher) {
            try {
                this._fileWatcher.dispose();
            } catch {
                // ignore
            }
            this._fileWatcher = null;
        }
    }

    _applyTrackingConfiguration() {
        const trackingSuppressed = this._isTrackingSuppressed();
        if (trackingSuppressed || this.maxTrackedActivityFiles <= 0 || isWeb) {
            this._trackingDisabled = trackingSuppressed || this.maxTrackedActivityFiles <= 0 || isWeb;
            this._stopFileWatcher();
            this._disposeUserActivityListeners();
            this.fileActivityCache.clear();
            this._trackedFileOrder.clear();
            return;
        }
        if (this._trackingDisabled) {
            this._trackingDisabled = false;
            this._registerUserActivityListeners();
        }
        this._registerUserActivityListeners();
        this.startFileWatcher();
        this._enforceTrackedFileLimit();
    }

    recordFileActivity(uri, action, options = {}) {
        try {
            const source = options.source || 'system';
            if (this.maxTrackedActivityFiles === 0) {
                return;
            }
            const filePath = uri?.fsPath || uri?.path;
            if (!filePath) {
                return;
            }
            const normalizedPath = this._normalizeKey(filePath);
            if (!normalizedPath || !this._shouldTrackFile(normalizedPath)) {
                return;
            }
            // Note: Removed overly restrictive watcher event filtering to capture background changes
            // This allows git pulls, build output, and teammate edits to be recorded in workspace analytics
            let entry = this.fileActivityCache.get(normalizedPath);
            if (!entry) {
                entry = { path: filePath, activities: [] };
                this.fileActivityCache.set(normalizedPath, entry);
            } else {
                entry.path = filePath;
            }
            const timestamp = new Date();
            entry.activities.push({
                action,
                timestamp,
                path: filePath,
                source
            });
            if (source === 'user') {
                this._markRecentUserInteraction(normalizedPath, timestamp.getTime());
            }
            if (this._activitySourceStats[source] === undefined) {
                this._activitySourceStats[source] = 0;
            }
            this._activitySourceStats[source]++;
            this._enforceActivityRetention(normalizedPath, entry);
            this._touchTrackedFileEntry(normalizedPath, timestamp.getTime());
        } catch (error) {
            logger.error('Failed to record file activity:', error);
        }
    }

    _enforceActivityRetention(normalizedPath, entry) {
        const activities = entry?.activities;
        if (!activities || activities.length === 0) {
            return;
        }

        if (this.activityCutoffMs) {
            const cutoff = Date.now() - this.activityCutoffMs;
            while (activities.length && activities[0].timestamp.getTime() < cutoff) {
                activities.shift();
            }
        }

        if (activities.length > MAX_TRACK_HISTORY_PER_FILE) {
            activities.splice(0, activities.length - MAX_TRACK_HISTORY_PER_FILE);
        }

        if (activities.length === 0) {
            this.fileActivityCache.delete(normalizedPath);
            this._trackedFileOrder.delete(normalizedPath);
        }
    }

    async generateFileModificationReport(options = {}) {
        if (this._reportInProgress) {
            vscode.window.showInformationMessage('Explorer Dates is already generating a report. Please wait for it to finish.');
            return null;
        }
        const run = this._generateFileModificationReport(options);
        this._reportInProgress = run;
        try {
            return await run;
        } finally {
            if (this._reportInProgress === run) this._reportInProgress = null;
        }
    }

    async _generateFileModificationReport(options = {}) {
        try {
            const {
                format = 'json',
                timeRange = 'all',
                includeDeleted = false,
                outputPath = null,
                progress = null,
                cancellationToken = null
            } = options;
            const canonicalTimeRange = normalizeTimeRange(timeRange);

            if (!this.allowedFormats.includes(format)) {
                const warning = l10n.getString('reportFormatDisabled', format, this.allowedFormats.join(', '));
                vscode.window.showWarningMessage(warning);
                logger.warn(warning);
                return null;
            }

            const report = await this.collectFileData(canonicalTimeRange, includeDeleted, { progress, cancellationToken });
            const formattedReport = await this.formatReport(report, format);
            
            if (outputPath) {
                await this.saveReport(formattedReport, outputPath, { cancellationToken });
                const savedPath = outputPath instanceof vscode.Uri ? (outputPath.fsPath || outputPath.path) : outputPath;
                const action = await vscode.window.showInformationMessage(`Report saved to ${savedPath}`, 'Open Report', 'Reveal in File Explorer');
                if (action === 'Open Report') await vscode.commands.executeCommand('vscode.open', outputPath instanceof vscode.Uri ? outputPath : vscode.Uri.file(outputPath));
                if (action === 'Reveal in File Explorer') await vscode.commands.executeCommand('revealFileInOS', outputPath instanceof vscode.Uri ? outputPath : vscode.Uri.file(outputPath));
            }
            
            return formattedReport;
        } catch (error) {
            logger.error('Failed to generate file modification report:', error);
            if (error?.code === 'REPORT_CANCELLED') return null;
            vscode.window.showErrorMessage(`Failed to generate report${options.outputPath ? ` for ${options.outputPath}` : ''}: ${error?.message || 'unknown error'}`);
            return null;
        }
    }

    async collectFileData(timeRange, includeDeleted, options = {}) {
        const files = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            return { schemaVersion: REPORT_SCHEMA_VERSION, files: [], summary: createSummary([]), timeRange: normalizeTimeRange(timeRange) };
        }
        this._reportProgress(options.progress, 'Preparing workspace roots', 0);
        const gitEvidence = await this.collectGitEvidence(workspaceFolders, timeRange, options);
        for (const folder of workspaceFolders) {
            const folderFiles = await this.scanWorkspaceFolder(folder.uri, timeRange, includeDeleted, {
                ...options, gitEvidence, workspaceName: folder.name
            });
            files.push(...folderFiles);
        }

        const summary = createSummary(files);
        summary.integrationTarget = this.timeTrackingIntegration;
        summary.activityTrackingDays = this.activityTrackingDays;
        
        return {
            schemaVersion: REPORT_SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            workspace: workspaceFolders.map(f => f.uri.fsPath),
            workspaceName: workspaceFolders.map(f => f.name).join(', '),
            timeRange: normalizeTimeRange(timeRange),
            files: sortFiles(files),
            summary: summary
        };
    }

    async scanWorkspaceFolder(folderUri, timeRange, includeDeleted, options = {}) {
        const files = [];
        try {
            this._throwIfCancelled(options.cancellationToken);
            this._reportProgress(options.progress, 'Scanning files');
            const entries = await vscode.workspace.fs.readDirectory(folderUri);
            
            for (const [name, type] of entries) {
                const fileUri = vscode.Uri.joinPath(folderUri, name);
                const relativePath = vscode.workspace.asRelativePath(fileUri);
                
                // Check exclusion patterns
                if (this._reportPolicy.isExcluded(relativePath)) {
                    continue;
                }
                
                if (type === vscode.FileType.File) {
                    const fileData = await this.getFileData(fileUri, timeRange, options);
                    if (fileData) {
                        files.push(fileData);
                    }
                } else if (type === vscode.FileType.Directory) {
                    const subFiles = await this.scanWorkspaceFolder(fileUri, timeRange, includeDeleted, options);
                    files.push(...subFiles);
                }
            }
            
            // Add deleted files if requested
            if (includeDeleted && folderUri.fsPath) {
                const deletedFiles = this.getDeletedFiles(folderUri.fsPath, timeRange);
                files.push(...deletedFiles);
            }
            
        } catch (error) {
            logger.error(`Failed to scan folder ${folderUri.fsPath || folderUri.path}:`, error);
        }
        
        return files;
    }

    async getFileData(uri, timeRange, options = {}) {
        try {
            this._throwIfCancelled(options.cancellationToken);
            const stat = await vscode.workspace.fs.stat(uri);
            const relativePath = vscode.workspace.asRelativePath(uri);
            const cacheKey = uri.fsPath || uri.path;
            const normalizedKey = this._normalizeKey(cacheKey);
            const entry = this.fileActivityCache.get(normalizedKey);
            const now = Date.now();
            const normalizedStat = normalizeStat(stat);
            const activities = (entry?.activities || []).filter(activity => inRange(activity.timestamp, timeRange, now));
            const evidence = [];
            const seen = new Set();
            const addEvidence = (item) => {
                const date = validDate(item.timestamp);
                if (!date) return;
                // One timestamp/action is one known event even when the same
                // change arrived through mtime, watcher, user, and Git paths.
                const key = `${date.toISOString()}|${item.action || 'modified'}`;
                if (seen.has(key)) return;
                seen.add(key); evidence.push({ ...item, timestamp: date });
            };
            for (const activity of activities) addEvidence(activity);
            if (inRange(normalizedStat.modified, timeRange, now)) addEvidence({
                action: 'modified', source: 'filesystem', timestamp: normalizedStat.modified
            });
            for (const git of options.gitEvidence?.get(normalizedKey) || []) {
                if (inRange(git.timestamp, timeRange, now)) addEvidence(git);
            }
            if (normalizeTimeRange(timeRange) !== 'all' && evidence.length === 0) return null;
            evidence.sort((a, b) => a.timestamp - b.timestamp);
            const lastActivity = evidence.length ? evidence[evidence.length - 1].timestamp : normalizedStat.modified;
            
            return {
                path: relativePath,
                fullPath: entry?.path || cacheKey,
                size: normalizedStat.size,
                created: normalizedStat.created,
                modified: normalizedStat.modified,
                type: this.getFileType(relativePath),
                extension: getExtension(relativePath),
                activities: evidence,
                evidence,
                activityCount: evidence.length,
                activityUnavailable: false,
                lastActivity
            };
        } catch (error) {
            logger.error(`Failed to get file data for ${uri.fsPath || uri.path}:`, error);
            return null;
        }
    }

    _throwIfCancelled(token) {
        if (token?.isCancellationRequested) {
            const error = new Error('Report generation was cancelled.');
            error.code = 'REPORT_CANCELLED';
            throw error;
        }
    }

    _reportProgress(progress, message, increment) {
        if (typeof progress === 'function') progress(message, increment);
    }

    async collectGitEvidence(workspaceFolders, timeRange, options = {}) {
        const result = new Map();
        if (isWeb) return result;
        let execFile;
        try { execFile = require('child_process').execFile; } catch { return result; }
        const seenRoots = new Set();
        for (const folder of workspaceFolders) {
            this._throwIfCancelled(options.cancellationToken);
            const root = folder.uri.fsPath;
            if (!root) continue;
            const gitRoot = await new Promise(resolve => execFile('git', ['-C', root, 'rev-parse', '--show-toplevel'], { timeout: 3000 }, (error, stdout) => resolve(error ? null : stdout.trim())));
            if (!gitRoot || seenRoots.has(gitRoot)) continue;
            seenRoots.add(gitRoot);
            this._reportProgress(options.progress, 'Collecting Git activity');
            const since = rangeStart(timeRange);
            const args = ['-C', gitRoot, 'log', '--all', '--name-only', '--format=%ct'];
            if (since !== null) args.push(`--since=${new Date(since).toISOString()}`);
            const output = await new Promise(resolve => execFile('git', args, { timeout: 10000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => resolve(error ? '' : stdout)));
            let timestamp = null;
            for (const line of String(output).split(/\r?\n/)) {
                if (/^\d+$/.test(line.trim())) { timestamp = new Date(Number(line.trim()) * 1000); continue; }
                const relative = normalizeReportPath(line.trim());
                if (!relative || !timestamp) continue;
                const absolute = normalizeReportPath(require('path').join(gitRoot, relative));
                const key = this._normalizeKey(absolute);
                if (!result.has(key)) result.set(key, []);
                result.get(key).push({ action: 'modified', source: 'git', timestamp });
            }
        }
        return result;
    }

    filterActivitiesByTimeRange(activities, timeRange) {
        let filtered = activities;
        if (timeRange !== 'all') {
            const now = new Date();
            let cutoff;
            
            switch (timeRange) {
                case '24h':
                    cutoff = new Date(now - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoff = null;
            }
            
            if (cutoff) {
                filtered = filtered.filter(activity => activity.timestamp >= cutoff);
            }
        }

        if (this.activityCutoffMs) {
            const retentionCutoff = new Date(Date.now() - this.activityCutoffMs);
            filtered = filtered.filter(activity => activity.timestamp >= retentionCutoff);
        }

        return filtered;
    }

    getDeletedFiles(folderPath, timeRange) {
        if (!folderPath) {
            return [];
        }

        const deletedFiles = [];
        
        const normalizedFolder = folderPath ? this._normalizeKey(folderPath) : '';
        for (const [normalizedPath, entry] of this.fileActivityCache.entries()) {
            if (!entry?.activities || entry.activities.length === 0) {
                continue;
            }
            if (normalizedFolder && !normalizedPath.startsWith(normalizedFolder)) {
                continue;
            }
            const deleteActivities = entry.activities.filter(a => a.action === 'deleted');
            const filteredDeletes = this.filterActivitiesByTimeRange(deleteActivities, timeRange);
            
            if (filteredDeletes.length > 0) {
                deletedFiles.push({
                    path: vscode.workspace.asRelativePath(entry.path || normalizedPath),
                    fullPath: entry.path || normalizedPath,
                    size: 0,
                    created: null,
                    modified: null,
                    type: 'deleted',
                    extension: getExtension(entry.path || normalizedPath),
                    activities: filteredDeletes,
                    activityCount: filteredDeletes.length,
                    lastActivity: filteredDeletes[filteredDeletes.length - 1].timestamp
                });
            }
        }
        
        return deletedFiles;
    }

    createSummary(files) {
        return createSummary(files);
    }

    async formatReport(report, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.formatAsCSV(report);
            case 'html':
                return this.formatAsHTML(report);
            case 'markdown':
                return this.formatAsMarkdown(report);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    formatAsCSV(report) {
        const quote = value => {
            let text = value === null || value === undefined ? '' : String(value);
            if (/^[=+\-@]/.test(text)) text = `'${text}`;
            return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        };
        const lines = ['Path,Size,Created,Modified,Type,Extension,ActivityCount,ActivitySources,LastActivity'];
        for (const file of report.files) lines.push([
            file.path, file.size, validDate(file.created)?.toISOString(), validDate(file.modified)?.toISOString(),
            file.type, file.extension, file.activityCount, (file.evidence || []).map(e => e.source).join('|'), validDate(file.lastActivity)?.toISOString()
        ].map(quote).join(','));
        return lines.join('\n');
    }

    formatAsHTML(report) {
        const escape = value => String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const date = value => validDate(value)?.toLocaleString() || 'Unavailable';
        const rows = report.files.map(file => `<tr><td>${escape(file.path)}</td><td>${escape(this.formatFileSize(file.size || 0))}</td><td>${escape(date(file.modified))}</td><td>${escape(file.type)}</td><td>${escape(file.activityCount)}</td><td>${escape((file.evidence || []).map(e => e.source).join(', ') || 'Unavailable')}</td></tr>`).join('');
        const active = report.summary.mostActiveFiles.length ? report.summary.mostActiveFiles.map(file => `<tr><td>${escape(file.path)}</td><td>${escape(file.activityCount)}</td><td>${escape(date(file.lastActivity))}</td></tr>`).join('') : '<tr><td colspan="3">No known activity evidence in this range.</td></tr>';
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark light"><title>Explorer Dates File Report</title>
    <style>
        :root { color-scheme: dark; --bg:#10141b; --panel:#18212d; --text:#e7edf5; --muted:#a8b4c3; --line:#334255; --accent:#61dafb; }
        * { box-sizing:border-box; } body { margin:0; padding:2rem; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,sans-serif; }
        header { display:flex; gap:1rem; align-items:center; } .mark { width:42px;height:42px;object-fit:contain; } h1 { margin:.2rem 0; } .muted { color:var(--muted); }
        .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.8rem; margin:1.5rem 0; } .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:1rem; } .card strong { display:block; font-size:1.4rem; color:var(--accent); }
        section { margin:1.5rem 0; } .table-wrap { overflow-x:auto; } table { border-collapse:collapse; width:100%; min-width:680px; } th,td { border:1px solid var(--line); padding:.55rem .7rem; text-align:left; vertical-align:top; } th { background:var(--panel); } details { background:var(--panel); border:1px solid var(--line); padding:.8rem; border-radius:8px; }
        @media print { :root { color-scheme:light; --bg:#fff;--panel:#f3f4f6;--text:#111;--muted:#555;--line:#bbb;--accent:#064e70; } body { padding:1rem; } }
    </style>
</head>
<body>
    <header><img class="mark" src="data:image/png;base64,${this._embeddedLogo()}" alt="Explorer Dates"><div><h1>Explorer Dates File Report</h1><div class="muted">Schema ${escape(report.schemaVersion)} · Generated ${escape(date(report.generatedAt))}</div></div></header>
    <p class="muted">Workspace: ${escape(report.workspaceName || report.workspace?.join(', '))} · Selected range: ${escape(report.timeRange)}</p>
    <div class="cards"><div class="card"><strong>${escape(report.summary.totalFiles)}</strong>Included files</div><div class="card"><strong>${escape(this.formatFileSize(report.summary.totalSize))}</strong>Total size</div><div class="card"><strong>${escape(report.summary.mostActiveFiles.length)}</strong>Known active files</div><div class="card"><strong>${escape(Object.values(report.summary.activitySourceBreakdown || {}).reduce((a,b)=>a+b,0))}</strong>Evidence events</div></div>
    <section><h2>Most Active Files</h2><div class="table-wrap"><table><tr><th>Path</th><th>Activity count</th><th>Last activity</th></tr>${active}</table></div></section>
    <details><summary>All Files (${escape(report.files.length)})</summary><div class="table-wrap"><table><tr><th>Path</th><th>Size</th><th>Modified</th><th>Type</th><th>Activity count</th><th>Sources</th></tr>${rows}</table></div></details>
</body>
</html>`;
    }

    formatAsMarkdown(report) {
        const cell = value => String(value === null || value === undefined ? '' : value).replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|');
        return `# Explorer Dates File Report

**Schema:** ${cell(report.schemaVersion)}<br>
**Generated:** ${cell(validDate(report.generatedAt)?.toISOString())}<br>
**Workspace:** ${cell(report.workspaceName || report.workspace?.join(', '))}<br>
**Time Range:** ${cell(report.timeRange)}

## Summary

- **Total Files:** ${report.summary.totalFiles}
- **Total Size:** ${this.formatFileSize(report.summary.totalSize)}

## File Types

| Type | Count |
|------|-------|
${Object.entries(report.summary.fileTypes).map(([type, count]) => `| ${cell(type)} | ${count} |`)
    .join('\n')}

## Most Active Files

| Path | Activity Count | Last Activity |
|------|----------------|---------------|
${report.summary.mostActiveFiles.map(file => `| ${cell(file.path)} | ${file.activityCount} | ${cell(validDate(file.lastActivity)?.toISOString())} |`)
    .join('\n')}

## Recently Modified Files

| Path | Modified | Size |
|------|----------|------|
${report.summary.recentlyModified.map(file => `| ${cell(file.path)} | ${cell(validDate(file.modified)?.toISOString())} | ${this.formatFileSize(file.size)} |`)
    .join('\n')}

## All Files

| Path | Size | Modified | Type | Activities |
|------|------|----------|------|------------|
${report.files.map(file => `| ${cell(file.path)} | ${this.formatFileSize(file.size || 0)} | ${cell(validDate(file.modified)?.toISOString() || 'Unavailable')} | ${cell(file.type)} | ${file.activityCount} |`)
    .join('\n')}
`;
    }

    async saveReport(content, outputPath, options = {}) {
        try {
            if (isWeb) {
                const encoded = encodeURIComponent(content);
                await vscode.env.openExternal(vscode.Uri.parse(`data:text/plain;charset=utf-8,${encoded}`));
                vscode.window.showInformationMessage(l10n.getString('reportDownloadTriggered'));
                return;
            }

            const target = outputPath instanceof vscode.Uri ? outputPath : vscode.Uri.file(outputPath);
            this._throwIfCancelled(options.cancellationToken);
            const targetPath = target.fsPath || target.path;
            const temporary = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
            await fileSystem.writeFile(temporary, content, 'utf8');
            this._throwIfCancelled(options.cancellationToken);
            await fileSystem.rename(temporary, target, { overwrite: true });
            const verified = await fileSystem.stat(target);
            if (!Number.isFinite(Number(verified.size)) || Number(verified.size) <= 0) {
                throw new Error('The saved report is empty or could not be verified.');
            }
            logger.info(`Report saved to ${target.fsPath || target.path}`);
        } catch (error) {
            logger.error('Failed to save report:', error);
            throw error;
        }
    }

    async exportToTimeTrackingTools(options = {}) {
        try {
            const { tool = 'generic', timeRange = '7d' } = options;
            const report = await this.collectFileData(timeRange, false);
            
            const timeTrackingData = this.formatForTimeTracking(report, tool);
            
            return timeTrackingData;
        } catch (error) {
            logger.error('Failed to export to time tracking tools:', error);
            return null;
        }
    }

    formatForTimeTracking(report, tool) {
        const sessions = [];
        
        // Convert file activities to time tracking sessions
        report.files.forEach(file => {
            file.activities.forEach(activity => {
                sessions.push({
                    file: file.path,
                    action: activity.action,
                    timestamp: activity.timestamp,
                    duration: this.estimateSessionDuration(activity),
                    project: this.extractProjectName(file.path)
                });
            });
        });
        
        switch (tool) {
            case 'toggl':
                return this.formatForToggl(sessions);
            case 'clockify':
                return this.formatForClockify(sessions);
            case 'generic':
            default:
                return sessions;
        }
    }

    formatForToggl(sessions) {
        return sessions.map(session => ({
            description: `${session.action}: ${session.file}`,
            start: session.timestamp.toISOString(),
            duration: session.duration * 60, // Toggl expects seconds
            project: session.project,
            tags: [session.action, this.getFileType(session.file)]
        }));
    }

    formatForClockify(sessions) {
        return sessions.map(session => ({
            description: `${session.action}: ${session.file}`,
            start: session.timestamp.toISOString(),
            end: new Date(session.timestamp.getTime() + session.duration * 60 * 1000).toISOString(),
            project: session.project,
            tags: [session.action, this.getFileType(session.file)]
        }));
    }

    estimateSessionDuration(activity) {
        // Simple heuristic: different actions have different estimated durations
        switch (activity.action) {
            case 'created': return 15; // 15 minutes for file creation
            case 'modified': return 5;  // 5 minutes for modification
            case 'deleted': return 1;   // 1 minute for deletion
            default: return 5;
        }
    }

    extractProjectName(filePath) {
        const parts = normalizePath(filePath).split('/');
        return parts[0] || 'Unknown Project';
    }

    getFileType(filePath) {
        const ext = getExtension(filePath);
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.html': 'html',
            '.css': 'css',
            '.md': 'markdown',
            '.json': 'json',
            '.xml': 'xml',
            '.txt': 'text'
        };
        return typeMap[ext] || 'other';
    }

    isExcluded(filePath, excludePatterns) {
        return this._reportPolicy.isExcluded(filePath) || (excludePatterns || []).some(pattern => {
            const regex = this._createPatternRegex(pattern);
            return regex ? regex.test(normalizeReportPath(filePath)) : false;
        });
    }

    formatFileSize(bytes) {
        const formatted = formatFileSize(bytes, 'auto');
        return formatted.startsWith('~') ? formatted.slice(1) : formatted;
    }

    _embeddedLogo() {
        try {
            const fs = require('fs');
            const path = require('path');
            const candidates = [
                path.join(__dirname, '..', 'icons', 'explorer-dates.png'),
                path.join(__dirname, '..', '..', 'icons', 'explorer-dates.png')
            ];
            const logoPath = candidates.find(candidate => fs.existsSync(candidate));
            return logoPath ? fs.readFileSync(logoPath).toString('base64') : '';
        } catch {
            return '';
        }
    }

    async showReportDialog() {
        if (this._reportInProgress) {
            vscode.window.showInformationMessage('Explorer Dates is already generating a report. Please wait for it to finish.');
            return null;
        }
        const dialogRun = this._showReportDialog();
        this._reportInProgress = dialogRun;
        try {
            return await dialogRun;
        } finally {
            if (this._reportInProgress === dialogRun) this._reportInProgress = null;
        }
    }

    async _showReportDialog() {
        try {
            const options = {
                '📊 Generate Full Report': 'full',
                '📅 Last 24 Hours': '24h',
                '📅 Last 7 Days': '7d',
                '📅 Last 30 Days': '30d',
                '📅 Last 90 Days': '90d'
            };

            const selected = await vscode.window.showQuickPick(
                Object.keys(options),
                { placeHolder: l10n.getString('selectReportTimeRangePlaceholder') }
            );

            if (!selected) return;

            const timeRange = options[selected];
            
            const formatOptions = this.allowedFormats.map(value => value.toUpperCase() === 'MARKDOWN' ? 'Markdown' : value.toUpperCase());
            const format = await vscode.window.showQuickPick(
                formatOptions,
                { placeHolder: l10n.getString('selectReportFormatPlaceholder') }
            );

            if (!format) return;

            const result = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`explorer-dates-report-${new Date().toISOString().replace(/[:.]/g, '-')}.${format.toLowerCase()}`),
                filters: {
                    [format]: [format.toLowerCase()]
                }
            });

            if (!result) return;

            const run = async progress => this._generateFileModificationReport({ format: format.toLowerCase(), timeRange, outputPath: result, progress: progress.report ? (message, increment) => progress.report({ message, increment }) : null, cancellationToken: progress.token });
            return await vscode.window.withProgress({ location: vscode.ProgressLocation?.Notification || 15, title: 'Generating Explorer Dates report', cancellable: true }, run);

        } catch (error) {
            logger.error('Failed to show report dialog:', error);
            vscode.window.showErrorMessage('Failed to generate report');
        }
    }

    dispose() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        this._stopFileWatcher();
        this._disposeUserActivityListeners();
        this.fileActivityCache.clear();
        this._trackedFileOrder.clear();
        this._recentUserInteraction.clear();
        this._activitySourceStats = { user: 0, watcher: 0 };
        logger.info('Export & Reporting Manager disposed');
    }

    _normalizeKey(filePath = '') {
        const normalized = normalizePath(filePath || '').trim();
        return normalized ? normalized.toLowerCase() : '';
    }

    _shouldTrackFile(normalizedPath) {
        if (!normalizedPath) {
            return false;
        }
        for (const folder of this.excludedFolders) {
            if (!folder) {
                continue;
            }
            const trimmed = folder.replace(/^\/+|\/+$/g, '').toLowerCase();
            if (!trimmed) {
                continue;
            }
            const needle = `/${trimmed}`;
            if (normalizedPath.includes(`${needle}/`) || normalizedPath.endsWith(needle)) {
                return false;
            }
        }
        return !this._excludedRegexes.some((regex) => regex.test(normalizedPath));
    }

    _createPatternRegex(pattern) {
        if (!pattern || typeof pattern !== 'string') {
            return null;
        }
        const escaped = pattern
            .replace(/([.+^${}()|[\]\\])/g, '\\$1')
            .replace(/\\\*\\\*/g, '.*')
            .replace(/\\\*/g, '[^/]*')
            .replace(/\\\?/g, '.');
        try {
            return new RegExp(escaped, 'i');
        } catch {
            return null;
        }
    }

    _touchTrackedFileEntry(normalizedPath, timestampMs) {
        if (!normalizedPath) {
            return;
        }
        if (this._trackedFileOrder.has(normalizedPath)) {
            this._trackedFileOrder.delete(normalizedPath);
        }
        this._trackedFileOrder.set(normalizedPath, timestampMs);
        this._enforceTrackedFileLimit();
    }

    _enforceTrackedFileLimit() {
        if (this.maxTrackedActivityFiles <= 0) {
            this.fileActivityCache.clear();
            this._trackedFileOrder.clear();
            return;
        }
        while (this._trackedFileOrder.size > this.maxTrackedActivityFiles) {
            const oldestEntry = this._trackedFileOrder.keys().next();
            if (oldestEntry.done) {
                break;
            }
            const oldestKey = oldestEntry.value;
            this._trackedFileOrder.delete(oldestKey);
            this.fileActivityCache.delete(oldestKey);
        }
    }

    _resolveTrackedFileLimit(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return DEFAULT_MAX_TRACKED_FILES;
        }
        if (numeric <= 0) {
            return 0;
        }
        return Math.min(Math.max(Math.floor(numeric), 500), MAX_TRACKED_FILES_LIMIT);
    }

    _isTrackingSuppressed() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const performanceMode = config.get('performanceMode', false);
        return performanceMode || this._lightweightMode;
    }

    _registerUserActivityListeners() {
        if (this._userActivityDisposables.length > 0) {
            return;
        }
        const workspace = vscode.workspace || {};
        const register = (fn, handler) => {
            if (typeof fn !== 'function') {
                return null;
            }
            return fn.call(workspace, handler);
        };
        const disposables = [];
        const saveDisposable = register(workspace.onDidSaveTextDocument, (document) => {
            this.recordFileActivity(document.uri, 'modified', { source: 'user' });
        });
        if (saveDisposable) {
            disposables.push(saveDisposable);
        }
        const changeDisposable = register(workspace.onDidChangeTextDocument, (event) => {
            const doc = event?.document;
            if (!doc) {
                return;
            }
            const normalized = this._normalizeKey(doc.uri.fsPath || doc.uri.path || '');
            if (normalized) {
                this._markRecentUserInteraction(normalized, Date.now());
            }
        });
        if (changeDisposable) {
            disposables.push(changeDisposable);
        }
        const createDisposable = register(workspace.onDidCreateFiles, (event) => {
            event?.files?.forEach((uri) => this.recordFileActivity(uri, 'created', { source: 'user' }));
        });
        if (createDisposable) {
            disposables.push(createDisposable);
        }
        const deleteDisposable = register(workspace.onDidDeleteFiles, (event) => {
            event?.files?.forEach((uri) => this.recordFileActivity(uri, 'deleted', { source: 'user' }));
        });
        if (deleteDisposable) {
            disposables.push(deleteDisposable);
        }
        const renameDisposable = register(workspace.onDidRenameFiles, (event) => {
            event?.files?.forEach((entry) => {
                this.recordFileActivity(entry.oldUri, 'deleted', { source: 'user' });
                this.recordFileActivity(entry.newUri, 'created', { source: 'user' });
            });
        });
        if (renameDisposable) {
            disposables.push(renameDisposable);
        }
        if (disposables.length > 0) {
            this._userActivityDisposables = disposables;
        }
    }

    _disposeUserActivityListeners() {
        if (!this._userActivityDisposables.length) {
            return;
        }
        for (const disposable of this._userActivityDisposables) {
            try {
                disposable.dispose();
            } catch {
                // ignore
            }
        }
        this._userActivityDisposables = [];
        this._recentUserInteraction.clear();
    }

    _markRecentUserInteraction(normalizedPath, timestampMs) {
        if (!normalizedPath) {
            return;
        }
        this._cleanupRecentUserInteractions();
        this._recentUserInteraction.set(normalizedPath, timestampMs || Date.now());
    }

    _cleanupRecentUserInteractions() {
        if (!this._recentUserInteraction.size) {
            return;
        }
        const now = Date.now();
        for (const [key, ts] of this._recentUserInteraction.entries()) {
            if (now - ts > this._userInteractionTtlMs) {
                this._recentUserInteraction.delete(key);
            }
        }
    }

    _shouldRecordWatcherEvent(normalizedPath) {
        this._cleanupRecentUserInteractions();
        if (this._recentUserInteraction.has(normalizedPath)) {
            return true;
        }
        const textDocuments = Array.isArray(vscode.workspace?.textDocuments) ? vscode.workspace.textDocuments : [];
        const openDoc = textDocuments.find((doc) => {
            const docPath = doc?.uri ? this._normalizeKey(doc.uri.fsPath || doc.uri.path) : '';
            return docPath === normalizedPath;
        });
        return Boolean(openDoc);
    }
}

module.exports = { ExportReportingManager };
