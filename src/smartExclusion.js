const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { normalizePath, getRelativePath, getFileName } = require('./utils/pathUtils');
const { getSettingsCoordinator } = require('./utils/settingsCoordinator');

/**
 * Smart Exclusion Pattern Manager
 * Automatically detects and suggests exclusion patterns for better performance
 */
class SmartExclusionManager {
    constructor() {
        this._logger = getLogger();
        this._fs = fileSystem;
        this._settings = getSettingsCoordinator();
        
        // Common build/cache folders that should be excluded
        this._commonExclusions = [
            // Node.js
            'node_modules', '.npm', '.yarn', 'coverage', 'nyc_output',
            // Build outputs
            'dist', 'build', 'out', 'target', 'bin', 'obj',
            // IDE/Editor
            '.vscode', '.idea', '.vs', '.vscode-test',
            // Version control
            '.git', '.svn', '.hg', '.bzr',
            // Package managers
            '.pnpm-store', 'bower_components', 'jspm_packages',
            // Temporary files
            'tmp', 'temp', '.tmp', '.cache', '.parcel-cache',
            // OS specific
            '.DS_Store', 'Thumbs.db', '__pycache__', '.pytest_cache',
            // Language specific
            '.tox', 'venv', '.env', '.virtualenv', 'vendor',
            // Docker
            '.docker',
            // Logs
            'logs', '*.log'
        ];
        
        // Pattern scoring for machine learning-like behavior
        this._patternScores = new Map();
        this._workspaceAnalysis = new Map();
        this._exclusionsFileName = 'explorer-dates-exclusions.json';
        this._legacyProfilesSetting = 'workspaceExclusionProfiles';
        
        this._logger.info('SmartExclusionManager initialized');
    }

    /**
     * Clean up duplicate exclusions for all workspaces
     */
    async cleanupAllWorkspaceProfiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        if (workspaceFolders.length === 0) {
            this._logger.debug('No workspace folders available for exclusion cleanup');
            return;
        }

        let migrated = 0;
        for (const folder of workspaceFolders) {
            try {
                const rootUri = folder.uri;
                const legacy = await this._migrateLegacyExclusions(folder.uri, rootUri);
                if (legacy) {
                    migrated++;
                }
            } catch (error) {
                this._logger.warn(`Failed to migrate exclusions for ${folder.name}`, error);
            }
        }

        if (migrated > 0) {
            this._logger.info('Migrated workspace exclusion profiles to workspace storage', {
                workspaces: migrated
            });
        } else {
            this._logger.debug('No legacy workspace exclusion profiles required migration');
        }
    }

    /**
     * Analyze workspace and suggest exclusions
     */
    async analyzeWorkspace(workspaceUri) {
        try {
            const workspacePath = normalizePath(workspaceUri?.fsPath || workspaceUri?.path || '');
            const analysis = {
                detectedPatterns: [],
                suggestedExclusions: [],
                projectType: 'unknown',
                riskFolders: []
            };

            // Detect project type from files
            analysis.projectType = await this._detectProjectType(workspaceUri);
            
            // Scan for common exclusion patterns
            const foundFolders = await this._scanForExclusionCandidates(workspaceUri, workspacePath);
            
            // Score and rank patterns
            const scoredPatterns = this._scorePatterns(foundFolders, analysis.projectType);
            
            analysis.detectedPatterns = foundFolders;
            analysis.suggestedExclusions = scoredPatterns
                .filter(p => p.score > 0.7)
                .map(p => p.pattern);
            analysis.riskFolders = scoredPatterns
                .filter(p => p.riskLevel === 'high')
                .map(p => p.pattern);

            this._workspaceAnalysis.set(workspacePath, analysis);
            this._logger.info(`Workspace analysis complete for ${workspacePath}`, analysis);
            
            return analysis;
        } catch (error) {
            this._logger.error('Failed to analyze workspace', error);
            return null;
        }
    }

    /**
     * Detect project type from package files and directory structure
     */
    async _detectProjectType(workspaceUri) {
        const indicators = [
            { file: 'package.json', type: 'javascript' },
            { file: 'pom.xml', type: 'java' },
            { file: 'Cargo.toml', type: 'rust' },
            { file: 'setup.py', type: 'python' },
            { file: 'requirements.txt', type: 'python' },
            { file: 'Gemfile', type: 'ruby' },
            { file: 'composer.json', type: 'php' },
            { file: 'go.mod', type: 'go' },
            { file: 'CMakeLists.txt', type: 'cpp' },
            { file: 'Dockerfile', type: 'docker' }
        ];

        if (!workspaceUri) {
            return 'unknown';
        }

        for (const indicator of indicators) {
            try {
                const target = vscode.Uri.joinPath(workspaceUri, indicator.file);
                const exists = await this._fs.exists(target);
                if (exists) {
                    return indicator.type;
                }
            } catch {
                // Ignore and continue
            }
        }

        return 'unknown';
    }

    /**
     * Scan workspace for folders that should likely be excluded
     */
    async _scanForExclusionCandidates(workspaceUri, workspacePath, maxDepth = 2) {
        const candidates = [];
        
        const scanDirectory = async (dirUri, currentDepth = 0) => {
            if (currentDepth > maxDepth) return;
            
            try {
                const entries = await this._fs.readdir(dirUri, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const fullUri = vscode.Uri.joinPath(dirUri, entry.name);
                        const fullPath = normalizePath(fullUri.fsPath || fullUri.path);
                        const relativePath = getRelativePath(workspacePath, fullPath);
                        
                        // Check if this matches our common exclusions
                        if (this._commonExclusions.includes(entry.name)) {
                            candidates.push({
                                name: entry.name,
                                path: relativePath,
                                type: 'common',
                                size: await this._getDirectorySize(fullUri)
                            });
                        }
                        
                        // Check for large directories that might be build outputs
                        const size = await this._getDirectorySize(fullUri);
                        if (size > 10 * 1024 * 1024) { // > 10MB
                            candidates.push({
                                name: entry.name,
                                path: relativePath,
                                type: 'large',
                                size: size
                            });
                        }
                        
                        // Recursively scan subdirectories
                        await scanDirectory(fullUri, currentDepth + 1);
                    }
                }
            } catch {
                // Skip directories we can't access
            }
        };
        
        await scanDirectory(workspaceUri);
        return candidates;
    }

    /**
     * Get directory size (approximate)
     */
    async _getDirectorySize(dirUri) {
        try {
            const entries = await this._fs.readdir(dirUri, { withFileTypes: true });
            let size = 0;
            let fileCount = 0;
            
            for (const entry of entries) {
                if (fileCount > 100) break; // Limit for performance
                
                if (entry.isFile()) {
                    try {
                        const fileUri = vscode.Uri.joinPath(dirUri, entry.name);
                        const stat = await this._fs.stat(fileUri);
                        size += stat.size;
                        fileCount++;
                    } catch {
                        // Skip files we can't access
                    }
                }
            }
            
            return size;
        } catch {
            return 0;
        }
    }

    /**
     * Score patterns based on project type and characteristics
     */
    _scorePatterns(candidates, projectType) {
        return candidates.map(candidate => {
            let score = 0;
            let riskLevel = 'low';
            
            // Base score for common exclusions
            if (candidate.type === 'common') {
                score += 0.8;
            }
            
            // Score based on size (larger = more likely to exclude)
            if (candidate.size > 100 * 1024 * 1024) { // > 100MB
                score += 0.9;
                riskLevel = 'high';
            } else if (candidate.size > 10 * 1024 * 1024) { // > 10MB
                score += 0.5;
                riskLevel = 'medium';
            }
            
            // Project-specific scoring
            switch (projectType) {
                case 'javascript':
                    if (['node_modules', '.npm', 'coverage', 'dist', 'build'].includes(candidate.name)) {
                        score += 0.9;
                    }
                    break;
                case 'python':
                    if (['__pycache__', '.pytest_cache', 'venv', '.env'].includes(candidate.name)) {
                        score += 0.9;
                    }
                    break;
                case 'java':
                    if (['target', 'build', '.gradle'].includes(candidate.name)) {
                        score += 0.9;
                    }
                    break;
                // Add more project types as needed
            }
            
            // Never suggest excluding source directories
            const sourcePatterns = ['src', 'lib', 'app', 'components', 'pages'];
            if (sourcePatterns.includes(candidate.name.toLowerCase())) {
                score = 0;
                riskLevel = 'none';
            }
            
            return {
                pattern: candidate.name,
                path: candidate.path,
                score: Math.min(score, 1.0),
                riskLevel,
                size: candidate.size,
                type: candidate.type
            };
        });
    }

    /**
     * Get workspace-specific exclusion profile
     */
    async getWorkspaceExclusions(workspaceUri) {
        const rootUri = this._resolveWorkspaceRoot(workspaceUri);
        if (!rootUri) {
            this._logger.debug('No workspace root for exclusions lookup');
            return [];
        }

        const fileExclusions = await this._readWorkspaceExclusionsFile(rootUri);
        if (fileExclusions) {
            return fileExclusions;
        }

        const migrated = await this._migrateLegacyExclusions(workspaceUri, rootUri);
        return migrated || [];
    }

    /**
     * Save workspace-specific exclusion profile
     */
    async saveWorkspaceExclusions(workspaceUri, exclusions) {
        const rootUri = this._resolveWorkspaceRoot(workspaceUri);
        if (!rootUri) {
            this._logger.warn('Cannot save workspace exclusions without a workspace root');
            return;
        }

        const normalized = this._dedupeList(exclusions);
        const current = await this._readWorkspaceExclusionsFile(rootUri);

        if (current && this._areListsEqual(current, normalized)) {
            this._logger.debug('Workspace exclusions already up to date', {
                workspace: this._getWorkspaceKey(workspaceUri)
            });
            return;
        }

        await this._writeWorkspaceExclusionsFile(rootUri, normalized);
        await this._removeLegacyProfile(workspaceUri);
        this._logger.info(`Saved workspace exclusions for ${this._getWorkspaceKey(workspaceUri)}`, normalized);
    }

    /**
     * Get combined exclusion patterns (global + workspace + smart)
     */
    async getCombinedExclusions(workspaceUri) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const globalFolders = config.get('excludedFolders', []);
        const globalPatterns = config.get('excludedPatterns', []);
        const smartEnabled = config.get('smartExclusions', true);
        
        let combinedFolders = [...globalFolders];
        let combinedPatterns = [...globalPatterns];
        
        // Add workspace-specific exclusions
        const workspaceExclusions = await this.getWorkspaceExclusions(workspaceUri);
        combinedFolders.push(...workspaceExclusions);
        
        // Add smart exclusions if enabled
        if (smartEnabled) {
            const analysis = await this.analyzeWorkspace(workspaceUri);
            if (analysis) {
                combinedFolders.push(...analysis.suggestedExclusions);
            }
        }
        
        // Remove duplicates
        combinedFolders = [...new Set(combinedFolders)];
        combinedPatterns = [...new Set(combinedPatterns)];
        
        return {
            folders: combinedFolders,
            patterns: combinedPatterns
        };
    }

    /**
     * Generate workspace key for storing profiles
     */
    _getWorkspaceKey(workspaceUri) {
        if (!workspaceUri) {
            return 'unknown-workspace';
        }

        const fsPath = workspaceUri.fsPath || workspaceUri.path || '';
        return getFileName(fsPath) || normalizePath(fsPath);
    }

    /**
     * Show exclusion suggestions to user
     */
    async suggestExclusions(workspaceUri) {
        const analysis = await this.analyzeWorkspace(workspaceUri);
        const suggestions = this._dedupeList(analysis?.suggestedExclusions || []);

        if (!analysis || suggestions.length === 0) {
            return;
        }

        const existing = await this.getWorkspaceExclusions(workspaceUri);
        const newExclusions = suggestions.filter(pattern => !existing.includes(pattern));

        if (newExclusions.length === 0) {
            this._logger.debug('No new smart exclusions detected', {
                workspace: this._getWorkspaceKey(workspaceUri)
            });
            return;
        }

        const updated = this._mergeExclusions(existing, newExclusions);
        await this.saveWorkspaceExclusions(workspaceUri, updated);

        const summary = newExclusions.length === 1
            ? `Explorer Dates automatically excluded "${newExclusions[0]}" to keep Explorer responsive.`
            : `Explorer Dates automatically excluded ${newExclusions.length} folders to keep Explorer responsive.`;

        const action = await vscode.window.showInformationMessage(
            `${summary} Keep these exclusions?`,
            'Keep',
            'Review',
            'Revert'
        );

        if (action === 'Revert') {
            await this.saveWorkspaceExclusions(workspaceUri, existing);
            vscode.window.showInformationMessage(
                'Smart exclusions reverted. Decorations will refresh for the restored folders.'
            );
            this._logger.info('User reverted smart exclusions', { reverted: newExclusions });
        } else if (action === 'Review') {
            this._showExclusionReviewSingle(analysis);
            this._logger.info('User reviewing smart exclusions', { pending: newExclusions });
        } else {
            this._logger.info('User kept smart exclusions', { accepted: newExclusions });
        }
    }

    /**
     * Aggregate exclusion suggestions across all workspace folders and show a single prompt.
     */
    async suggestExclusionsBulk(workspaceFolders = []) {
        if (!workspaceFolders.length) {
            return;
        }

        const summaries = [];
        const revertStack = [];
        const reviewEntries = [];
        let totalNew = 0;

        for (const folder of workspaceFolders) {
            const analysis = await this.analyzeWorkspace(folder.uri);
            const suggestions = this._dedupeList(analysis?.suggestedExclusions || []);

            if (!analysis || suggestions.length === 0) {
                continue;
            }

            const existing = await this.getWorkspaceExclusions(folder.uri);
            const newExclusions = suggestions.filter((pattern) => !existing.includes(pattern));
            if (newExclusions.length === 0) {
                this._logger.debug('No new smart exclusions detected', {
                    workspace: this._getWorkspaceKey(folder.uri)
                });
                continue;
            }

            const updated = this._mergeExclusions(existing, newExclusions);
            await this.saveWorkspaceExclusions(folder.uri, updated);

            summaries.push({ workspace: folder.name, added: newExclusions });
            revertStack.push({ uri: folder.uri, previous: existing });
            reviewEntries.push({
                workspaceKey: this._getWorkspaceKey(folder.uri),
                workspaceName: this._getWorkspaceName(folder.uri),
                workspaceUri: folder.uri,
                analysis,
                previous: existing
            });
            totalNew += newExclusions.length;
        }

        if (totalNew === 0) {
            return;
        }

        const workspaceCount = summaries.length;
        const summary = totalNew === 1
            ? `Explorer Dates automatically excluded "${summaries[0].added[0]}" to keep Explorer responsive.`
            : `Explorer Dates automatically excluded ${totalNew} folders across ${workspaceCount} workspace${workspaceCount === 1 ? '' : 's'} to keep Explorer responsive.`;

        const action = await vscode.window.showInformationMessage(
            `${summary} Keep these exclusions?`,
            'Keep',
            'Review',
            'Revert'
        );

        if (action === 'Revert') {
            for (const entry of revertStack) {
                await this.saveWorkspaceExclusions(entry.uri, entry.previous);
            }
            vscode.window.showInformationMessage(
                'Smart exclusions reverted. Decorations will refresh for the restored folders.'
            );
            this._logger.info('User reverted smart exclusions', { workspaces: workspaceCount, reverted: totalNew });
        } else if (action === 'Review' && reviewEntries.length) {
            this._showExclusionReviewBulk(reviewEntries);
            this._logger.info('User reviewing smart exclusions', { pending: totalNew, workspaces: workspaceCount });
        } else {
            this._logger.info('User kept smart exclusions', { accepted: totalNew, workspaces: workspaceCount });
        }
    }

    _getWorkspaceName(workspaceUri) {
        if (!workspaceUri) {
            return 'Workspace';
        }
        const fsPath = workspaceUri.fsPath || workspaceUri.path || '';
        const parts = fsPath.split(/[\\/]/).filter(Boolean);
        return parts[parts.length - 1] || 'Workspace';
    }

    _buildReviewEntries(workspaceFolders, reviewAnalyses, revertStack) {
        const entries = [];
        for (let i = 0; i < reviewAnalyses.length; i += 1) {
            const analysis = reviewAnalyses[i];
            const revert = revertStack[i];
            const folder = workspaceFolders[i];
            if (!analysis || !revert || !folder) {
                continue;
            }
            entries.push({
                workspaceKey: this._getWorkspaceKey(folder.uri),
                workspaceName: this._getWorkspaceName(folder.uri),
                workspaceUri: folder.uri,
                analysis,
                previous: revert.previous
            });
        }
        return entries;
    }

    _resolveWorkspaceRoot(workspaceUri) {
        if (workspaceUri) {
            return workspaceUri;
        }
        return vscode.workspace.workspaceFolders?.[0]?.uri ?? null;
    }

    _getWorkspaceSettingsDir(rootUri) {
        if (!rootUri) {
            return null;
        }
        return vscode.Uri.joinPath(rootUri, '.vscode');
    }

    _getExclusionsFileUri(rootUri) {
        const settingsDir = this._getWorkspaceSettingsDir(rootUri);
        if (!settingsDir) {
            return null;
        }
        return vscode.Uri.joinPath(settingsDir, this._exclusionsFileName);
    }

    async _readWorkspaceExclusionsFile(rootUri) {
        const fileUri = this._getExclusionsFileUri(rootUri);
        if (!fileUri) {
            return null;
        }

        try {
            const raw = await this._fs.readFile(fileUri, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return this._dedupeList(parsed);
            }
            if (Array.isArray(parsed?.exclusions)) {
                return this._dedupeList(parsed.exclusions);
            }
            return null;
        } catch (error) {
            if (error?.code === 'ENOENT' || error?.name === 'EntryNotFound' || error?.message?.includes('ENOENT')) {
                return null;
            }
            this._logger.warn('Failed to read workspace exclusions file', { error: error.message });
            return null;
        }
    }

    async _writeWorkspaceExclusionsFile(rootUri, exclusions) {
        const fileUri = this._getExclusionsFileUri(rootUri);
        if (!fileUri) {
            return;
        }

        const settingsDir = this._getWorkspaceSettingsDir(rootUri);
        if (settingsDir) {
            await this._fs.ensureDirectory(settingsDir);
        }

        const payload = {
            version: 1,
            updatedAt: new Date().toISOString(),
            exclusions
        };

        await this._fs.writeFile(fileUri, JSON.stringify(payload, null, 2));
    }

    async _migrateLegacyExclusions(workspaceUri, rootUri) {
        const workspaceKey = this._getWorkspaceKey(workspaceUri);
        const profiles = this._settings.getValue(this._legacyProfilesSetting) || {};
        const legacy = Array.isArray(profiles[workspaceKey]) ? this._dedupeList(profiles[workspaceKey]) : [];

        if (!legacy.length) {
            return null;
        }

        if (rootUri) {
            await this._writeWorkspaceExclusionsFile(rootUri, legacy);
            await this._removeLegacyProfile(workspaceUri);
            this._logger.info(`Migrated workspace exclusions for ${workspaceKey} to workspace settings file`);
            return legacy;
        }

        return legacy;
    }

    async _removeLegacyProfile(workspaceUri) {
        const workspaceKey = this._getWorkspaceKey(workspaceUri);
        const profiles = this._settings.getValue(this._legacyProfilesSetting) || {};

        if (!(workspaceKey in profiles)) {
            return;
        }

        delete profiles[workspaceKey];
        await this._settings.updateSetting(this._legacyProfilesSetting, profiles, {
            scope: 'user',
            reason: 'workspace-exclusion-migration'
        });
    }

    _dedupeList(values = []) {
        return Array.from(new Set(values.filter(Boolean)));
    }

    _mergeExclusions(current = [], additions = []) {
        return this._dedupeList([...(current || []), ...(additions || [])]);
    }

    _areListsEqual(a = [], b = []) {
        if (a.length !== b.length) {
            return false;
        }

        return a.every((value, index) => value === b[index]);
    }

    /**
     * Show detailed exclusion review
     */
    _showExclusionReviewSingle(analysis) {
        const panel = vscode.window.createWebviewPanel(
            'exclusionReview',
            'Smart Exclusion Review',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this._generateReviewHTML([{
            workspaceKey: 'single-workspace',
            workspaceName: 'Workspace',
            analysis,
            previous: []
        }]);
    }

    _showExclusionReviewBulk(reviewEntries) {
        if (!Array.isArray(reviewEntries) || reviewEntries.length === 0) {
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'exclusionReview',
            'Smart Exclusion Review',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message?.type === 'save' && message.workspaceKey && Array.isArray(message.exclusions)) {
                const entry = reviewEntries.find((e) => e.workspaceKey === message.workspaceKey);
                if (!entry?.workspaceUri) {
                    return;
                }

                const confirm = await vscode.window.showWarningMessage(
                    `Apply updated exclusions for ${entry.workspaceName}?`,
                    { modal: true },
                    'Apply',
                    'Cancel'
                );

                if (confirm !== 'Apply') {
                    panel.webview.postMessage({ type: 'saveCanceled', workspaceKey: message.workspaceKey });
                    return;
                }

                await this.saveWorkspaceExclusions(entry.workspaceUri, this._dedupeList(message.exclusions));
                this._logger.info('Updated smart exclusions from review', {
                    workspace: entry.workspaceName,
                    count: message.exclusions.length
                });
                panel.webview.postMessage({ type: 'saved', workspaceKey: message.workspaceKey });
            }
        });

        panel.webview.html = this._generateReviewHTML(reviewEntries);
    }

    _generateReviewHTML(reviewEntries) {
        const formatSize = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            const kb = bytes / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            const mb = kb / 1024;
            return `${mb.toFixed(1)} MB`;
        };

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const renderTable = (entry) => {
            const analysis = entry.analysis;
            const suggestionRows = (analysis?.detectedPatterns || []).map((pattern) => `
                <tr>
                    <td>${escapeHtml(pattern.name)}</td>
                    <td>${escapeHtml(pattern.path)}</td>
                    <td>${formatSize(pattern.size)}</td>
                    <td>${escapeHtml(pattern.type)}</td>
                    <td>
                        <input type="checkbox" data-workspace="${escapeHtml(entry.workspaceKey)}" data-name="${escapeHtml(pattern.name)}" ${analysis?.suggestedExclusions?.includes(pattern.name) ? 'checked' : ''}>
                    </td>
                </tr>
            `).join('');

            return `
                <section class="workspace">
                    <header>
                        <h2>${escapeHtml(entry.workspaceName)}</h2>
                        <div class="project-info">
                            <div><strong>Project Type:</strong> ${escapeHtml(analysis?.projectType || 'unknown')}</div>
                            <div><strong>Detected Patterns:</strong> ${analysis?.detectedPatterns?.length || 0}</div>
                            <div><strong>Suggested Exclusions:</strong> ${analysis?.suggestedExclusions?.length || 0}</div>
                        </div>
                        <button class="save" data-workspace="${escapeHtml(entry.workspaceKey)}">Save changes</button>
                        <span class="status" id="status-${escapeHtml(entry.workspaceKey)}"></span>
                    </header>
                    <table>
                        <thead>
                            <tr>
                                <th>Folder</th>
                                <th>Path</th>
                                <th>Size</th>
                                <th>Type</th>
                                <th>Exclude</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${suggestionRows}
                        </tbody>
                    </table>
                </section>
            `;
        };

        const sections = reviewEntries.map(renderTable).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Smart Exclusion Review</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; }
                    .workspace { margin-bottom: 32px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; }
                    header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
                    .project-info { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--vscode-editor-foreground); }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); }
                    th { background-color: var(--vscode-editor-background); font-weight: bold; }
                    button.save { padding: 6px 12px; }
                    .status { font-size: 12px; color: var(--vscode-descriptionForeground); }
                </style>
            </head>
            <body>
                <h1>🧠 Smart Exclusion Review</h1>
                <p>Adjust exclusion selections per workspace and click "Save changes". Each save will ask for confirmation.</p>
                ${sections}
                <script>
                    const vscode = acquireVsCodeApi();

                    function getSelections(workspaceKey) {
                        const boxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-workspace="' + workspaceKey + '"]'));
                        return boxes.filter((box) => box.checked).map((box) => box.dataset.name);
                    }

                    function setStatus(workspaceKey, text, success) {
                        const el = document.getElementById('status-' + workspaceKey);
                        if (el) {
                            el.textContent = text;
                            el.style.color = success ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-editor-foreground)';
                        }
                    }

                    document.querySelectorAll('button.save').forEach((button) => {
                        button.addEventListener('click', () => {
                            const workspaceKey = button.dataset.workspace;
                            const exclusions = getSelections(workspaceKey);
                            setStatus(workspaceKey, 'Saving...', false);
                            vscode.postMessage({ type: 'save', workspaceKey, exclusions });
                        });
                    });

                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        if (!message || !message.type) return;
                        if (message.type === 'saved') {
                            setStatus(message.workspaceKey, 'Saved', true);
                        }
                        if (message.type === 'saveCanceled') {
                            setStatus(message.workspaceKey, 'Canceled', false);
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}

module.exports = { SmartExclusionManager };
