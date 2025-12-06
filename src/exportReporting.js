const vscode = require('vscode');
const { getLogger } = require('./logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { getExtension, normalizePath } = require('./utils/pathUtils');

const logger = getLogger();
const isWeb = process.env.VSCODE_WEB === 'true';

/**
 * Export & Reporting Manager
 * Handles file modification reports, time tracking integration, and project analytics
 */
class ExportReportingManager {
    constructor() {
        this.fileActivityCache = new Map();
        this.allowedFormats = ['json', 'csv', 'html', 'markdown'];
        this.activityTrackingDays = 30;
        this.activityCutoffMs = null;
        this.timeTrackingIntegration = 'none';
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
        } catch (error) {
            logger.error('Failed to load reporting configuration', error);
        }
    }

    _setupConfigurationWatcher() {
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('explorerDates.reportFormats') ||
                event.affectsConfiguration('explorerDates.activityTrackingDays') ||
                event.affectsConfiguration('explorerDates.timeTrackingIntegration')) {
                this._loadConfiguration();
                logger.info('Reporting configuration updated', {
                    allowedFormats: this.allowedFormats,
                    activityTrackingDays: this.activityTrackingDays,
                    timeTrackingIntegration: this.timeTrackingIntegration
                });
            }
        });
    }

    async initialize() {
        try {
            this.startFileWatcher();
            logger.info('Export & Reporting Manager initialized');
        } catch (error) {
            logger.error('Failed to initialize Export & Reporting Manager:', error);
        }
    }

    startFileWatcher() {
        // Watch for file changes to track activity
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        watcher.onDidChange((uri) => {
            this.recordFileActivity(uri, 'modified');
        });
        
        watcher.onDidCreate((uri) => {
            this.recordFileActivity(uri, 'created');
        });
        
        watcher.onDidDelete((uri) => {
            this.recordFileActivity(uri, 'deleted');
        });
    }

    recordFileActivity(uri, action) {
        try {
            const filePath = uri.fsPath || uri.path;
            const timestamp = new Date();
            
            if (!this.fileActivityCache.has(filePath)) {
                this.fileActivityCache.set(filePath, []);
            }
            
            this.fileActivityCache.get(filePath).push({
                action: action,
                timestamp: timestamp,
                path: filePath
            });
            
            this._enforceActivityRetention(filePath);
            
        } catch (error) {
            logger.error('Failed to record file activity:', error);
        }
    }

    _enforceActivityRetention(filePath) {
        const activities = this.fileActivityCache.get(filePath);
        if (!activities || activities.length === 0) {
            return;
        }

        if (this.activityCutoffMs) {
            const cutoff = new Date(Date.now() - this.activityCutoffMs);
            while (activities.length && activities[0].timestamp < cutoff) {
                activities.shift();
            }
        }

        if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
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
            const activities = this.fileActivityCache.get(cacheKey) || [];
            
            // Filter activities by time range
            const filteredActivities = this.filterActivitiesByTimeRange(activities, timeRange);
            
            return {
                path: relativePath,
                fullPath: cacheKey,
                size: stat.size,
                created: new Date(stat.ctime),
                modified: new Date(stat.mtime),
                type: this.getFileType(relativePath),
                extension: getExtension(relativePath),
                activities: filteredActivities,
                activityCount: filteredActivities.length,
                lastActivity: filteredActivities.length > 0
                    ? filteredActivities[filteredActivities.length - 1].timestamp
                    : new Date(stat.mtime)
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
        
        for (const [filePath, activities] of this.fileActivityCache) {
            if (filePath.startsWith(folderPath)) {
                const deleteActivities = activities.filter(a => a.action === 'deleted');
                const filteredDeletes = this.filterActivitiesByTimeRange(deleteActivities, timeRange);
                
                if (filteredDeletes.length > 0) {
                    deletedFiles.push({
                        path: vscode.workspace.asRelativePath(filePath),
                        fullPath: filePath,
                        size: 0,
                        created: null,
                        modified: null,
                        type: 'deleted',
                        extension: getExtension(filePath),
                        activities: filteredDeletes,
                        activityCount: filteredDeletes.length,
                        lastActivity: filteredDeletes[filteredDeletes.length - 1].timestamp
                    });
                }
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
            oldestFiles: []
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
}

module.exports = { ExportReportingManager };
