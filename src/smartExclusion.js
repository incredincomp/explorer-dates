const vscode = require('vscode');
let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};
const { fileSystem } = require('./filesystem/FileSystemAdapter');
let normalizePath = (v) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { const chunk = dynamicRequire('./chunks/path-utils-chunk'); if (chunk && typeof chunk.normalizePath === 'function') { normalizePath = chunk.normalizePath; return normalizePath(v); } } } catch { /* ignore */ } return String(v || '').replace(/\\/g, '/'); };

let getFileName = (p) => { try { const dynamicRequire = typeof eval === 'function' ? eval('require') : null; if (typeof dynamicRequire === 'function') { const chunk = dynamicRequire('./chunks/path-utils-chunk'); if (chunk && typeof chunk.getFileName === 'function') { getFileName = chunk.getFileName; return getFileName(p); } } } catch { /* ignore */ } const n = String(p||'').replace(/\\/g,'/'); const idx = n.lastIndexOf('/'); return idx === -1 ? n : n.substring(idx + 1); };
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
        // Loaded lazily from JSON to keep the main chunk smaller
        this._commonExclusions = null;
        
        // Pattern scoring for machine learning-like behavior
        this._patternScores = new Map();
        this._workspaceAnalysis = new Map();
        this._exclusionsFileName = 'explorer-dates-exclusions.json';
        this._legacyProfilesSetting = 'workspaceExclusionProfiles';
        
        this._logger.info('SmartExclusionManager initialized');
        this._commonExclusionsLoaded = false;
    }

    async _ensureCommonExclusions() {
        if (this._commonExclusionsLoaded && Array.isArray(this._commonExclusions)) {
            return this._commonExclusions;
        }
        try {
            const mod = await import('./data/commonExclusions.json');
            this._commonExclusions = mod && mod.default ? mod.default : mod;
        } catch {
            // Fallback to a small set to avoid blocking functionality
            this._commonExclusions = ['node_modules', 'dist', 'build', '.git'];
        }
        this._commonExclusionsLoaded = true;
        return this._commonExclusions;
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
            // Ensure common exclusions are loaded lazily
            await this._ensureCommonExclusions();

            // Detect project type from files
            analysis.projectType = await this._detectProjectType(workspaceUri);
            
            // Scan for common exclusion patterns
// Delegate scanning to lazily-loaded scanner to keep the main chunk small
        const scanner = await import('./chunks/workspaceIntelligenceScanner.js');
        const foundFolders = await scanner.scanForExclusionCandidates(workspaceUri, workspacePath, this._fs, this._logger);

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
     * Get directory size (approximate)
     */
    async _getDirectorySize(dirUri) {
        const io = await import('./chunks/workspace-intel-io-chunk');
        return io.getDirectorySize(dirUri);
    }

    /**
     * Score patterns based on project type and characteristics
     */
    async _scorePatterns(candidates, projectType) {
        const logic = await import('./chunks/workspace-intel-logic-chunk');
        return logic.scorePatterns(candidates, projectType);
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
        
        // Add workspace-specific exclusions (fast)
        const workspaceExclusions = await this.getWorkspaceExclusions(workspaceUri);
        combinedFolders.push(...workspaceExclusions);
        
        // If smart exclusions are enabled, try to use cached analysis; if missing,
        // kick off analysis in the background but don't await it to keep hot paths fast.
        if (smartEnabled) {
            const cached = this._workspaceAnalysis.get((workspaceUri && (workspaceUri.fsPath || workspaceUri.path)) || 'unknown-workspace');
            if (cached && cached.suggestedExclusions && cached.suggestedExclusions.length) {
                combinedFolders.push(...cached.suggestedExclusions);
            } else {
                // Fire-and-forget analysis; errors are logged inside analyzeWorkspace
                this.analyzeWorkspace(workspaceUri).catch(() => {});
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
        const io = await import('./chunks/workspace-intel-io-chunk');
        return io.readWorkspaceExclusionsFile(rootUri);
    }

    async _writeWorkspaceExclusionsFile(rootUri, exclusions) {
        const io = await import('./chunks/workspace-intel-io-chunk');
        return io.writeWorkspaceExclusionsFile(rootUri, exclusions);
    }

    async _migrateLegacyExclusions(workspaceUri, rootUri) {
        const io = await import('./chunks/workspace-intel-io-chunk');
        return io.migrateLegacyExclusions(workspaceUri, rootUri);
    }

    async _removeLegacyProfile(workspaceUri) {
        const io = await import('./chunks/workspace-intel-io-chunk');
        return io.removeLegacyProfile(workspaceUri);
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
    async _showExclusionReviewSingle(analysis) {
        const logic = await import('./chunks/workspace-intel-logic-chunk');
        return logic.showExclusionReviewSingle(this, analysis);
    }

    async _showExclusionReviewBulk(reviewEntries) {
        const logic = await import('./chunks/workspace-intel-logic-chunk');
        return logic.showExclusionReviewBulk(this, reviewEntries);
    }

    _generateReviewHTML(reviewEntries) {
        // Delegate HTML generation to the workspace-intel logic chunk to avoid bundling UI templates in the core
        return import('./chunks/workspace-intel-logic-chunk').then((logic) => logic.generateReviewHTML(reviewEntries));
    }
}

module.exports = { SmartExclusionManager };
