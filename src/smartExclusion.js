const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { normalizePath, getRelativePath, getFileName } = require('./utils/pathUtils');

/**
 * Smart Exclusion Pattern Manager
 * Automatically detects and suggests exclusion patterns for better performance
 */
class SmartExclusionManager {
    constructor() {
        this._logger = getLogger();
        this._fs = fileSystem;
        
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
        
        this._logger.info('SmartExclusionManager initialized');
    }

    /**
     * Clean up duplicate exclusions for all workspaces
     */
    async cleanupAllWorkspaceProfiles() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const profiles = config.get('workspaceExclusionProfiles', {}) || {};
        let updated = false;

        for (const [workspaceKey, exclusions] of Object.entries(profiles)) {
            const list = Array.isArray(exclusions) ? exclusions : [];
            const deduped = this._dedupeList(list);

            if (!this._areListsEqual(list, deduped)) {
                profiles[workspaceKey] = deduped;
                updated = true;
                this._logger.debug(`Deduped workspace exclusions for ${workspaceKey}`, {
                    before: list.length,
                    after: deduped.length
                });
            }
        }

        if (updated) {
            await config.update('workspaceExclusionProfiles', profiles, vscode.ConfigurationTarget.Global);
            this._logger.info('Cleaned up duplicate workspace exclusions', {
                workspaceCount: Object.keys(profiles).length
            });
        } else {
            this._logger.debug('Workspace exclusion profiles already clean');
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
        const config = vscode.workspace.getConfiguration('explorerDates');
        const profiles = config.get('workspaceExclusionProfiles', {});
        const workspaceKey = this._getWorkspaceKey(workspaceUri);

        const stored = profiles[workspaceKey] || [];
        const deduped = this._dedupeList(stored);

        if (deduped.length !== stored.length) {
            profiles[workspaceKey] = deduped;
            try {
                await config.update(
                    'workspaceExclusionProfiles',
                    profiles,
                    vscode.ConfigurationTarget.Global
                );
                this._logger.info(`Cleaned duplicate exclusions for ${workspaceKey}`, {
                    before: stored.length,
                    after: deduped.length
                });
            } catch (error) {
                this._logger.warn(`Failed to persist cleaned exclusions for ${workspaceKey}`, error);
            }
        }

        return deduped;
    }

    /**
     * Save workspace-specific exclusion profile
     */
    async saveWorkspaceExclusions(workspaceUri, exclusions) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const profiles = config.get('workspaceExclusionProfiles', {});
        const workspaceKey = this._getWorkspaceKey(workspaceUri);

        const normalized = this._dedupeList(exclusions);
        const previouslySaved = Array.isArray(profiles[workspaceKey])
            ? this._areListsEqual(profiles[workspaceKey], normalized)
            : false;

        if (previouslySaved) {
            this._logger.debug(`No workspace exclusion changes for ${workspaceKey}`);
            return;
        }

        profiles[workspaceKey] = normalized;

        await config.update('workspaceExclusionProfiles', profiles, vscode.ConfigurationTarget.Global);
        this._logger.info(`Saved workspace exclusions for ${workspaceKey}`, normalized);
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
            this._showExclusionReview(analysis);
            this._logger.info('User reviewing smart exclusions', { pending: newExclusions });
        } else {
            this._logger.info('User kept smart exclusions', { accepted: newExclusions });
        }
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
    _showExclusionReview(analysis) {
        const panel = vscode.window.createWebviewPanel(
            'exclusionReview',
            'Smart Exclusion Review',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this._generateReviewHTML(analysis);
    }

    /**
     * Generate HTML for exclusion review
     */
    _generateReviewHTML(analysis) {
        const formatSize = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            const kb = bytes / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            const mb = kb / 1024;
            return `${mb.toFixed(1)} MB`;
        };

        const suggestionRows = analysis.detectedPatterns.map(pattern => `
            <tr>
                <td>${pattern.name}</td>
                <td>${pattern.path}</td>
                <td>${formatSize(pattern.size)}</td>
                <td>${pattern.type}</td>
                <td>
                    <input type="checkbox" ${analysis.suggestedExclusions.includes(pattern.name) ? 'checked' : ''}>
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Smart Exclusion Review</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
                    th { background-color: var(--vscode-editor-background); font-weight: bold; }
                    .project-info { background: var(--vscode-editor-background); padding: 15px; border-radius: 4px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>🧠 Smart Exclusion Review</h1>
                <div class="project-info">
                    <strong>Project Type:</strong> ${analysis.projectType}<br>
                    <strong>Detected Patterns:</strong> ${analysis.detectedPatterns.length}<br>
                    <strong>Suggested Exclusions:</strong> ${analysis.suggestedExclusions.length}
                </div>
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
            </body>
            </html>
        `;
    }
}

module.exports = { SmartExclusionManager };
