const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { getExtension, normalizePath } = require('./utils/pathUtils');
const { ensureDate } = require('./utils/dateHelpers');

const logger = getLogger();
const isWeb = process.env.VSCODE_WEB === 'true';
const DEFAULT_EXCLUDED_FOLDERS = ['node_modules', '.git', 'dist', 'build', 'out', '.vscode-test'];
const DEFAULT_EXCLUDED_PATTERNS = ['**/*.tmp', '**/*.log', '**/.git/**', '**/node_modules/**'];
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
        this.allowedFormats = ['json', 'csv', 'html', 'markdown'];
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
        this._userInteractionTtlMs = Number(process.env.EXPLORER_DATES_USER_ACTIVITY_TTL_MS || 5 * 60 * 1000);
        this._activitySourceStats = {
            user: 0,
            watcher: 0
        };
        this._lightweightMode = process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE === '1';
        this._trackingDisabled = false;
        this._loadConfiguration();
        this._setupConfigurationWatcher();
        this.initialize();
    }

    _loadConfiguration() {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const configuredFormats = config.get('reportFormats', ['json', 'html']);
            const defaults = ['json', 'csv', 'html', 'markdown'];
            this.allowedFormats = Array.from(new Set([...configuredFormats, ...defaults]));
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
        try {
            const {
                format = 'json',
                timeRange = 'all',
                includeDeleted = false,
                outputPath = null
            } = options;

            if (!this.allowedFormats.includes(format)) {
                const warning = `Report format "${format}" is disabled. Allowed formats: ${this.allowedFormats.join(', ')}`;
                vscode.window.showWarningMessage(warning);
                logger.warn(warning);
                return null;
            }

            const report = await this.collectFileData(timeRange, includeDeleted);
            const formattedReport = await this.formatReport(report, format);
            
            if (outputPath) {
                await this.saveReport(formattedReport, outputPath);
                vscode.window.showInformationMessage(`Report saved to ${outputPath}`);
            }
            
            return formattedReport;
        } catch (error) {
            logger.error('Failed to generate file modification report:', error);
            vscode.window.showErrorMessage('Failed to generate report');
            return null;
        }
    }

    async collectFileData(timeRange, includeDeleted) {
        const files = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            return { files: [], summary: this.createSummary([]) };
        }

        for (const folder of workspaceFolders) {
            const folderFiles = await this.scanWorkspaceFolder(folder.uri, timeRange, includeDeleted);
            files.push(...folderFiles);
        }

        const summary = this.createSummary(files);
        summary.integrationTarget = this.timeTrackingIntegration;
        summary.activityTrackingDays = this.activityTrackingDays;
        
        return {
            generatedAt: new Date().toISOString(),
            workspace: workspaceFolders.map(f => f.uri.fsPath),
            timeRange: timeRange,
            files: files,
            summary: summary
        };
    }

    async scanWorkspaceFolder(folderUri, timeRange, includeDeleted) {
        const files = [];
        const config = vscode.workspace.getConfiguration('explorerDates');
        const excludePatterns = config.get('excludedPatterns', []);
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);
            
            for (const [name, type] of entries) {
                const fileUri = vscode.Uri.joinPath(folderUri, name);
                const relativePath = vscode.workspace.asRelativePath(fileUri);
                
                // Check exclusion patterns
                if (this.isExcluded(relativePath, excludePatterns)) {
                    continue;
                }
                
                if (type === vscode.FileType.File) {
                    const fileData = await this.getFileData(fileUri, timeRange);
                    if (fileData) {
                        files.push(fileData);
                    }
                } else if (type === vscode.FileType.Directory) {
                    const subFiles = await this.scanWorkspaceFolder(fileUri, timeRange, includeDeleted);
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

    async getFileData(uri, timeRange) {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            const relativePath = vscode.workspace.asRelativePath(uri);
            const cacheKey = uri.fsPath || uri.path;
            const normalizedKey = this._normalizeKey(cacheKey);
            const entry = this.fileActivityCache.get(normalizedKey);
            const activities = entry?.activities || [];
            
            // Filter activities by time range
            const filteredActivities = this.filterActivitiesByTimeRange(activities, timeRange);
            
            return {
                path: relativePath,
                fullPath: entry?.path || cacheKey,
                size: stat.size,
                created: ensureDate(stat.ctime),
                modified: ensureDate(stat.mtime),
                type: this.getFileType(relativePath),
                extension: getExtension(relativePath),
                activities: filteredActivities,
                activityCount: filteredActivities.length,
                lastActivity: filteredActivities.length > 0
                    ? filteredActivities[filteredActivities.length - 1].timestamp
                    : ensureDate(stat.mtime)
            };
        } catch (error) {
            logger.error(`Failed to get file data for ${uri.fsPath || uri.path}:`, error);
            return null;
        }
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
        const summary = {
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
            fileTypes: {},
            activityByDay: {},
            mostActiveFiles: [],
            recentlyModified: [],
            largestFiles: [],
            oldestFiles: [],
            activitySourceBreakdown: {
                user: this._activitySourceStats.user || 0,
                watcher: this._activitySourceStats.watcher || 0
            }
        };

        // File types
        files.forEach(file => {
            const type = file.type || 'unknown';
            summary.fileTypes[type] = (summary.fileTypes[type] || 0) + 1;
        });

        // Activity by day (tracked window)
        const retentionWindow = new Date(Date.now() - this.activityTrackingDays * 24 * 60 * 60 * 1000);
        files.forEach(file => {
            file.activities.forEach(activity => {
                if (activity.timestamp >= retentionWindow) {
                    const day = activity.timestamp.toISOString().split('T')[0];
                    summary.activityByDay[day] = (summary.activityByDay[day] || 0) + 1;
                }
            });
        });

        // Most active files (top 10)
        summary.mostActiveFiles = files
            .sort((a, b) => b.activityCount - a.activityCount)
            .slice(0, 10)
            .map(file => ({
                path: file.path,
                activityCount: file.activityCount,
                lastActivity: file.lastActivity
            }));

        // Recently modified (top 20)
        summary.recentlyModified = files
            .filter(file => file.modified)
            .sort((a, b) => b.modified - a.modified)
            .slice(0, 20)
            .map(file => ({
                path: file.path,
                modified: file.modified,
                size: file.size
            }));

        // Largest files (top 10)
        summary.largestFiles = files
            .sort((a, b) => (b.size || 0) - (a.size || 0))
            .slice(0, 10)
            .map(file => ({
                path: file.path,
                size: file.size,
                modified: file.modified
            }));

        // Oldest files (top 10)
        summary.oldestFiles = files
            .filter(file => file.modified)
            .sort((a, b) => a.modified - b.modified)
            .slice(0, 10)
            .map(file => ({
                path: file.path,
                modified: file.modified,
                size: file.size
            }));

        return summary;
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
        const lines = [
            'Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity'
        ];
        
        report.files.forEach(file => {
            lines.push([
                file.path,
                file.size || 0,
                file.created ? file.created.toISOString() : '',
                file.modified ? file.modified.toISOString() : '',
                file.type,
                file.extension,
                file.activityCount,
                file.lastActivity ? file.lastActivity.toISOString() : ''
            ].join(','));
        });
        
        return lines.join('\n');
    }

    formatAsHTML(report) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>File Modification Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>File Modification Report</h1>
    <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Files:</strong> ${report.summary.totalFiles}</p>
        <p><strong>Total Size:</strong> ${this.formatFileSize(report.summary.totalSize)}</p>
        <p><strong>Time Range:</strong> ${report.timeRange}</p>
    </div>
    
    <h2>File Types</h2>
    <table>
        <tr><th>Type</th><th>Count</th></tr>
        ${Object.entries(report.summary.fileTypes)
            .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
            .join('')}
    </table>
    
    <h2>Most Active Files</h2>
    <table>
        <tr><th>Path</th><th>Activity Count</th><th>Last Activity</th></tr>
        ${report.summary.mostActiveFiles
            .map(file => `<tr><td>${file.path}</td><td>${file.activityCount}</td><td>${new Date(file.lastActivity).toLocaleString()}</td></tr>`)
            .join('')}
    </table>
    
    <h2>All Files</h2>
    <table>
        <tr><th>Path</th><th>Size</th><th>Modified</th><th>Type</th><th>Activity Count</th></tr>
        ${report.files
            .map(file => `<tr>
                <td>${file.path}</td>
                <td>${this.formatFileSize(file.size || 0)}</td>
                <td>${file.modified ? new Date(file.modified).toLocaleString() : 'N/A'}</td>
                <td>${file.type}</td>
                <td>${file.activityCount}</td>
            </tr>`)
            .join('')}
    </table>
</body>
</html>`;
    }

    formatAsMarkdown(report) {
        return `# File Modification Report

**Generated:** ${new Date(report.generatedAt).toLocaleString()}
**Time Range:** ${report.timeRange}

## Summary

- **Total Files:** ${report.summary.totalFiles}
- **Total Size:** ${this.formatFileSize(report.summary.totalSize)}

## File Types

| Type | Count |
|------|-------|
${Object.entries(report.summary.fileTypes)
    .map(([type, count]) => `| ${type} | ${count} |`)
    .join('\n')}

## Most Active Files

| Path | Activity Count | Last Activity |
|------|----------------|---------------|
${report.summary.mostActiveFiles
    .map(file => `| ${file.path} | ${file.activityCount} | ${new Date(file.lastActivity).toLocaleString()} |`)
    .join('\n')}

## Recently Modified Files

| Path | Modified | Size |
|------|----------|------|
${report.summary.recentlyModified
    .map(file => `| ${file.path} | ${new Date(file.modified).toLocaleString()} | ${this.formatFileSize(file.size)} |`)
    .join('\n')}

## All Files

| Path | Size | Modified | Type | Activities |
|------|------|----------|------|------------|
${report.files
    .map(file => `| ${file.path} | ${this.formatFileSize(file.size || 0)} | ${file.modified ? new Date(file.modified).toLocaleString() : 'N/A'} | ${file.type} | ${file.activityCount} |`)
    .join('\n')}
`;
    }

    async saveReport(content, outputPath) {
        try {
            if (isWeb) {
                const encoded = encodeURIComponent(content);
                await vscode.env.openExternal(vscode.Uri.parse(`data:text/plain;charset=utf-8,${encoded}`));
                vscode.window.showInformationMessage('Report download triggered in browser');
                return;
            }

            const target = outputPath instanceof vscode.Uri ? outputPath : vscode.Uri.file(outputPath);
            await fileSystem.writeFile(target, content, 'utf8');
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
        return excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    async showReportDialog() {
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
                { placeHolder: 'Select report time range' }
            );

            if (!selected) return;

            const timeRange = options[selected];
            
            const formatOptions = ['JSON', 'CSV', 'HTML', 'Markdown'];
            const format = await vscode.window.showQuickPick(
                formatOptions,
                { placeHolder: 'Select report format' }
            );

            if (!format) return;

            const result = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`file-report.${format.toLowerCase()}`),
                filters: {
                    [format]: [format.toLowerCase()]
                }
            });

            if (!result) return;

            await this.generateFileModificationReport({
                format: format.toLowerCase(),
                timeRange: timeRange,
                outputPath: result.fsPath
            });

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
