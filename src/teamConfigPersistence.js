const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { CHUNK_SIZES } = require('./presetDefinitions');
const { getSettingsCoordinator } = require('./utils/settingsCoordinator');

const logger = getLogger();

const TEAM_CONFIG_SCHEMA_VERSION = '1.0.0';
const TEAM_CONFIG_STORAGE_KEY = 'explorerDates.teamConfig.backup';
const FEATURE_CHUNK_MAP = {
    'explorerDates.enableOnboardingSystem': 'onboarding',
    'explorerDates.enableAnalysisCommands': 'analysisCommands',
    'explorerDates.enableExportReporting': 'exportReporting',
    'explorerDates.enableExtensionApi': 'extensionApi',
    'explorerDates.enableWorkspaceTemplates': 'workspaceTemplates',
    'explorerDates.enableAdvancedCache': 'advancedCache',
    'explorerDates.enableWorkspaceIntelligence': 'workspaceIntelligence',
    'explorerDates.enableIncrementalWorkers': 'incrementalWorkers'
};

const CHUNK_LABELS = {
    onboarding: 'Onboarding System',
    analysisCommands: 'Analysis Commands',
    exportReporting: 'Export Reporting',
    extensionApi: 'Extension API',
    workspaceTemplates: 'Workspace Templates',
    advancedCache: 'Advanced Cache',
    workspaceIntelligence: 'Workspace Intelligence',
    incrementalWorkers: 'Incremental Workers'
};

/**
 * Manages team configuration sharing and conflict resolution
 * Provides comprehensive team profile management, conflict detection, and sync capabilities
 */
class TeamConfigPersistenceManager {
    constructor(context) {
        this._context = context;
        this._fs = fileSystem;
        this._teamConfigFile = '.explorer-dates-profiles.json';
        this._lastTeamConfig = null;
        this._lastTeamConfigPath = null;
        this._lastProfileId = null;
        this._ephemeralConfigs = new Map();
        this._ephemeralNoticeShown = new Set();
        this._configWatcher = null;
        this._changeTimeout = null;
        this._settings = getSettingsCoordinator();
        logger.info('Team persistence manager initialized with full functionality');
    }
    
    /**
     * Validates team preset conflicts with user overrides and surfaces warning UI
     */
    async validateTeamConfiguration() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (!workspaceRoot) {
                return { valid: true, conflicts: [], hasTeamConfig: false };
            }
            
            // Check if team configuration file exists
            const teamConfigPath = vscode.Uri.joinPath(workspaceRoot, this._teamConfigFile);
            const teamConfigExists = await this._fileExists(teamConfigPath);
            
            if (!teamConfigExists) {
                logger.debug('No team configuration file found');
                return { valid: true, conflicts: [], hasTeamConfig: false };
            }
            
            const teamConfig = await this._loadTeamConfiguration(teamConfigPath);
            if (!teamConfig) {
                return { valid: true, conflicts: [], hasTeamConfig: false };
            }
            
            const conflicts = await this._detectConfigConflicts(teamConfig);
            
            if (conflicts.length > 0) {
                await this._showTeamConflictWarning(conflicts);
            }
            
            return { 
                valid: conflicts.length === 0, 
                conflicts, 
                hasTeamConfig: true,
                teamConfig
            };
        } catch (error) {
            logger.error('Team configuration validation failed:', error);
            return { valid: true, conflicts: [], error: error.message };
        }
    }
    
    /**
     * Shows warning when team preset conflicts with user overrides
     */
    async _showTeamConflictWarning(conflicts) {
        const conflictCount = conflicts.length;
        const message = `Found ${conflictCount} conflict${conflictCount > 1 ? 's' : ''} ` +
            `between team configuration and your personal settings.`;
        
        const action = await vscode.window.showWarningMessage(
            message,
            'Show Details',
            'Use Team Config', 
            'Keep My Settings'
        );
        
        switch (action) {
            case 'Show Details':
                await this._showConflictDetails(conflicts);
                break;
            case 'Use Team Config':
                await this._applyTeamConfiguration();
                break;
            case 'Keep My Settings':
                await this._documentUserOverrides(conflicts);
                break;
        }
    }
    
    /**
     * Loads team configuration from workspace file
     */
    async _loadTeamConfiguration(teamConfigPath) {
        try {
            const key = this._getConfigKey(teamConfigPath);
            let parsed;
            
            if (this._ephemeralConfigs.has(key)) {
                parsed = this._ephemeralConfigs.get(key);
                logger.debug('Loaded team configuration from ephemeral storage');
            } else {
                let raw;
                try {
                    raw = await this._fs.readFile(teamConfigPath, 'utf8');
                } catch (error) {
                    if (error?.code === 'ENOENT') {
                        logger.debug('Team configuration file not found on disk');
                        return null;
                    }
                    throw error;
                }

                if (typeof raw === 'string' && raw.trim().startsWith('// virtual content')) {
                    logger.debug('Team configuration file placeholder detected (treated as missing)');
                    return null;
                }

                try {
                    parsed = JSON.parse(raw);
                } catch {
                    throw new Error('Team configuration file is not valid JSON.');
                }
            }
            
            const teamConfig = this._normalizeTeamConfig(parsed);
            
            if (teamConfig.version !== TEAM_CONFIG_SCHEMA_VERSION) {
                logger.warn(`Team configuration schema mismatch. Expected ${TEAM_CONFIG_SCHEMA_VERSION}, received ${teamConfig.version}`);
            }
            
            this._lastTeamConfig = teamConfig;
            this._lastTeamConfigPath = teamConfigPath;
            this._lastProfileId = this._resolveActiveProfileId(teamConfig);
            
            logger.debug('Loaded team configuration', { profileCount: Object.keys(teamConfig.profiles || {}).length });
            return teamConfig;
        } catch (error) {
            if (error?.code === 'ENOENT') {
                logger.debug('Team configuration file not found during load');
                return null;
            }
            logger.error('Failed to load team configuration:', error);
            throw error;
        }
    }
    
    /**
     * Detects conflicts between team and user configurations
     */
    async _detectConfigConflicts(teamConfig) {
        const profileId = this._resolveActiveProfileId(teamConfig);
        if (!profileId) {
            return [];
        }
        
        const profile = teamConfig.profiles?.[profileId];
        if (!profile || !profile.settings) {
            return [];
        }
        
        const config = vscode.workspace.getConfiguration();
        const conflicts = [];
        
        for (const [settingKey, teamValue] of Object.entries(profile.settings)) {
            const inspected = config.inspect(settingKey);
            if (!inspected) {
                continue;
            }
            
            const hasUserOverride = inspected.workspaceValue !== undefined || inspected.globalValue !== undefined;
            if (!hasUserOverride) {
                continue;
            }
            
            const userValue = inspected.workspaceValue !== undefined
                ? inspected.workspaceValue
                : inspected.globalValue;
            
            if (this._valuesEqual(userValue, teamValue)) {
                continue;
            }
            
            const conflict = {
                key: settingKey,
                profileId,
                teamValue,
                userValue,
                source: inspected.workspaceValue !== undefined ? 'workspace' : 'global',
                impact: this._calculateImpact(settingKey, teamValue, userValue),
                chunkEffect: this._describeChunkEffect(settingKey, teamValue)
            };
            
            conflicts.push(conflict);
        }
        
        conflicts.sort((a, b) => {
            const weight = { high: 3, medium: 2, low: 1 };
            return (weight[b.impact] || 0) - (weight[a.impact] || 0);
        });
        
        logger.debug('Detected team configuration conflicts', { conflictCount: conflicts.length });
        return conflicts;
    }
    
    /**
     * Saves team profiles to the workspace file or falls back to in-memory storage
     */
    async saveTeamProfiles(profiles) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) {
            throw new Error('No workspace folders available for team profiles');
        }
        
        const teamConfigPath = vscode.Uri.joinPath(workspaceRoot, this._teamConfigFile);
        
        const profileIds = Object.keys(profiles);
        const teamConfigData = {
            version: TEAM_CONFIG_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            defaultProfile: profileIds[0] || null,
            profiles,
            metadata: {
                extensionVersion: this._getExtensionVersion(),
                vscodeVersion: vscode.version
            }
        };
        
        try {
            await this._fs.ensureDirectory(workspaceRoot);
        } catch (error) {
            if (!this._shouldUseEphemeralStorage(error)) {
                throw error;
            }
            logger.warn('Workspace directory is not writable; continuing with ephemeral storage', { code: error.code });
            this._notifyEphemeralStorageWarning(error);
        }
        
        try {
            await this._persistTeamConfig(teamConfigPath, teamConfigData);
            this._lastTeamConfig = teamConfigData;
            this._lastTeamConfigPath = teamConfigPath;
            this._lastProfileId = this._resolveActiveProfileId(teamConfigData);
            
            logger.info('Saved team profiles', { profileCount: Object.keys(profiles).length });
            return teamConfigPath;
        } catch (error) {
            logger.error('Failed to save team profiles:', error);
            throw new Error(`Failed to save team profiles: ${error.message}`);
        }
    }
    
    /**
     * Loads team profiles from workspace file (or in-memory fallback)
     */
    async loadTeamProfiles(skipUserNotifications = false) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) return null;
        
        const teamConfigPath = vscode.Uri.joinPath(workspaceRoot, this._teamConfigFile);
        
        try {
            const config = await this._loadTeamConfiguration(teamConfigPath);
            return config?.profiles ?? null;
        } catch (error) {
            if (error.code === 'FileNotFound') {
                return null; // File doesn't exist, not an error
            }
            
            // Enhanced user notifications for different error types (only if not skipped)
            if (!skipUserNotifications) {
                if (error.message.includes('not valid JSON') || error.message.includes('JSON parsing failed')) {
                    vscode.window.showErrorMessage(
                        'Explorer Dates team configuration file appears to be corrupted. ' +
                        'Please check the .explorer-dates-profiles.json file or restore from backup.',
                        'Show File Location'
                    ).then(selection => {
                        if (selection === 'Show File Location') {
                            vscode.commands.executeCommand('revealInExplorer', teamConfigPath);
                        }
                    });
                } else if (error.code === 'TIMEOUT' || error.message.includes('timed out') || 
                           (error.name === 'NetworkError' && error.message.includes('fetch failed'))) {
                    // More specific network error detection to avoid false positives
                    vscode.window.showErrorMessage(
                        'Explorer Dates team configuration could not be loaded due to network timeout. ' +
                        'Please check your connection and try again.',
                        'Retry'
                    ).then(selection => {
                        if (selection === 'Retry') {
                            // Prevent infinite retry loops by skipping notifications on retry
                            this.loadTeamProfiles(true);
                        }
                    });
                } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                    vscode.window.showWarningMessage(
                        'Explorer Dates team configuration cannot be accessed due to file permissions. ' +
                        'Contact your administrator to enable read access to the workspace folder.'
                    );
                }
            }
            
            logger.error('Failed to load team profiles:', error);
            return null;
        }
    }
    
    /**
     * Checks if team configuration file exists
     */
    async hasTeamConfiguration() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) return false;
        
        const teamConfigPath = vscode.Uri.joinPath(workspaceRoot, this._teamConfigFile);
        
        // Check ephemeral storage first
        const key = this._getConfigKey(teamConfigPath);
        if (this._ephemeralConfigs.has(key)) {
            return true;
        }
        
        // Then check filesystem
        return await this._fileExists(teamConfigPath);
    }
    
    /**
     * Creates a new team profile with given settings
     */
    async createTeamProfile(profileId, profileData) {
        const { name, description = '', settings = {}, metadata = {} } = profileData;
        
        if (!profileId || typeof profileId !== 'string') {
            throw new Error('Profile ID must be a non-empty string');
        }
        
        if (!name || typeof name !== 'string') {
            throw new Error('Profile name must be a non-empty string');
        }
        
        this._validateSettings(settings);
        
        const existingProfiles = await this.loadTeamProfiles(true) || {};
        
        if (existingProfiles[profileId]) {
            throw new Error(`Profile with ID '${profileId}' already exists`);
        }
        
        const newProfile = {
            name,
            description,
            settings,
            metadata: {
                createdAt: new Date().toISOString(),
                createdBy: vscode.env.uriScheme === 'vscode-insiders' ? 'vscode-insiders' : 'vscode',
                extensionVersion: this._getExtensionVersion(),
                ...metadata
            }
        };
        
        const updatedProfiles = {
            ...existingProfiles,
            [profileId]: newProfile
        };
        
        await this.saveTeamProfiles(updatedProfiles);
        logger.info('Created team profile', { profileId, name });
        return newProfile;
    }
    
    /**
     * Updates an existing team profile
     */
    async updateTeamProfile(profileId, updates) {
        if (!profileId || typeof profileId !== 'string') {
            throw new Error('Profile ID must be a non-empty string');
        }
        
        const existingProfiles = await this.loadTeamProfiles(true) || {};
        
        if (!existingProfiles[profileId]) {
            throw new Error(`Profile with ID '${profileId}' does not exist`);
        }
        
        const existingProfile = existingProfiles[profileId];
        
        // Validate settings if provided
        if (updates.settings) {
            this._validateSettings(updates.settings);
        }
        
        const updatedProfile = {
            ...existingProfile,
            ...updates,
            metadata: {
                ...existingProfile.metadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString(),
                updatedBy: vscode.env.uriScheme === 'vscode-insiders' ? 'vscode-insiders' : 'vscode'
            }
        };
        
        const updatedProfiles = {
            ...existingProfiles,
            [profileId]: updatedProfile
        };
        
        await this.saveTeamProfiles(updatedProfiles);
        logger.info('Updated team profile', { profileId, changes: Object.keys(updates) });
        return updatedProfile;
    }
    
    /**
     * Deletes a team profile
     */
    async deleteTeamProfile(profileId) {
        if (!profileId || typeof profileId !== 'string') {
            throw new Error('Profile ID must be a non-empty string');
        }
        
        const existingProfiles = await this.loadTeamProfiles(true) || {};
        
        if (!existingProfiles[profileId]) {
            throw new Error(`Profile with ID '${profileId}' does not exist`);
        }
        
        const { [profileId]: deletedProfile, ...remainingProfiles } = existingProfiles;
        
        if (Object.keys(remainingProfiles).length === 0) {
            // If this was the last profile, remove the team config file entirely
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (workspaceRoot) {
                const teamConfigPath = vscode.Uri.joinPath(workspaceRoot, this._teamConfigFile);
                const key = this._getConfigKey(teamConfigPath);
                
                // Remove from ephemeral storage
                this._ephemeralConfigs.delete(key);
                
                // Try to delete from filesystem
                try {
                    await this._fs.delete(teamConfigPath);
                    logger.info('Deleted team configuration file (no profiles remaining)');
                } catch (error) {
                    logger.warn('Could not delete team configuration file', { error: error.message });
                }
            }
        } else {
            await this.saveTeamProfiles(remainingProfiles);
        }
        
        logger.info('Deleted team profile', { profileId, name: deletedProfile.name });
        return deletedProfile;
    }
    
    /**
     * Lists all team profiles with optional filtering
     */
    async listTeamProfiles(filters = {}) {
        const profiles = await this.loadTeamProfiles(true) || {};
        const profileList = Object.entries(profiles).map(([id, profile]) => ({
            id,
            ...profile
        }));
        
        // Apply filters
        let filteredProfiles = profileList;
        
        if (filters.namePattern) {
            const regex = new RegExp(filters.namePattern, 'i');
            filteredProfiles = filteredProfiles.filter(p => regex.test(p.name));
        }
        
        if (filters.hasSettings) {
            const settingKeys = Array.isArray(filters.hasSettings) ? filters.hasSettings : [filters.hasSettings];
            filteredProfiles = filteredProfiles.filter(p => 
                settingKeys.every(key => p.settings && key in p.settings)
            );
        }
        
        if (filters.createdAfter) {
            const afterDate = new Date(filters.createdAfter);
            filteredProfiles = filteredProfiles.filter(p => 
                p.metadata?.createdAt && new Date(p.metadata.createdAt) > afterDate
            );
        }
        
        // Sort by creation date (newest first) or name
        const sortBy = filters.sortBy || 'createdAt';
        filteredProfiles.sort((a, b) => {
            if (sortBy === 'createdAt') {
                const aDate = a.metadata?.createdAt ? new Date(a.metadata.createdAt) : new Date(0);
                const bDate = b.metadata?.createdAt ? new Date(b.metadata.createdAt) : new Date(0);
                return bDate.getTime() - aDate.getTime();
            } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
        
        logger.debug('Listed team profiles', { 
            total: profileList.length, 
            filtered: filteredProfiles.length,
            filters 
        });
        
        return filteredProfiles;
    }
    
    /**
     * Applies automatic conflict resolution based on strategy
     */
    async resolveConflictsAutomatically(conflicts, strategy = 'prompt') {
        if (!Array.isArray(conflicts) || conflicts.length === 0) {
            return { resolved: 0, skipped: 0, errors: [] };
        }
        
        const results = { resolved: 0, skipped: 0, errors: [] };
        
        for (const conflict of conflicts) {
            try {
                let shouldApplyTeamValue = false;
                
                switch (strategy) {
                    case 'team-wins':
                        shouldApplyTeamValue = true;
                        break;
                        
                    case 'user-wins':
                        shouldApplyTeamValue = false;
                        break;
                        
                    case 'high-impact-only':
                        shouldApplyTeamValue = conflict.impact === 'high';
                        break;
                        
                    case 'chunks-only':
                        shouldApplyTeamValue = !!conflict.chunkEffect;
                        break;
                        
                    case 'prompt':
                    default:
                        const action = await vscode.window.showQuickPick([
                            { label: 'Apply Team Value', value: true },
                            { label: 'Keep My Value', value: false },
                            { label: 'Skip This Setting', value: null }
                        ], {
                            placeHolder: `Resolve conflict for ${conflict.key}`,
                            ignoreFocusOut: true
                        });
                        
                        if (!action) {
                            results.skipped++;
                            continue;
                        }
                        
                        if (action.value === null) {
                            results.skipped++;
                            continue;
                        }
                        
                        shouldApplyTeamValue = action.value;
                        break;
                }
                
                if (shouldApplyTeamValue) {
                    await this._applySingleSetting(conflict.key, conflict.teamValue);
                    results.resolved++;
                    logger.info('Auto-resolved conflict', { 
                        key: conflict.key, 
                        strategy, 
                        action: 'applied-team-value' 
                    });
                } else if (strategy !== 'prompt') {
                    results.skipped++;
                    logger.debug('Skipped conflict resolution', { 
                        key: conflict.key, 
                        strategy, 
                        action: 'kept-user-value' 
                    });
                }
            } catch (error) {
                results.errors.push({ key: conflict.key, error: error.message });
                logger.error('Failed to resolve conflict', { 
                    key: conflict.key, 
                    error: error.message 
                });
            }
        }
        
        logger.info('Completed automatic conflict resolution', results);
        return results;
    }
    
    async _showConflictDetails(conflicts) {
        if (!conflicts || conflicts.length === 0) {
            vscode.window.showInformationMessage('No Explorer Dates conflicts to review.');
            return;
        }
        
        const quickPickItems = conflicts.map(conflict => ({
            label: conflict.key,
            description: `Team: ${this._formatValue(conflict.teamValue)} | You: ${this._formatValue(conflict.userValue)}`,
            detail: `${conflict.chunkEffect || 'UI setting change'} · Impact: ${conflict.impact}`,
            conflict
        }));
        
        const selection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Review team configuration conflicts',
            ignoreFocusOut: true
        });
        
        if (!selection) {
            return;
        }
        
        const action = await vscode.window.showInformationMessage(
            `Apply team value for "${selection.conflict.key}"?`,
            'Apply Team Value',
            'Keep My Value'
        );
        
        if (action === 'Apply Team Value') {
            await this._applySingleSetting(selection.conflict.key, selection.conflict.teamValue);
            vscode.window.showInformationMessage(`Updated ${selection.conflict.key} to match team configuration.`);
        }
    }
    
    async _applyTeamConfiguration() {
        if (!this._lastTeamConfig) {
            vscode.window.showWarningMessage('No team configuration is loaded. Validate the team config first.');
            return;
        }
        
        const profileId = this._resolveActiveProfileId(this._lastTeamConfig);
        const profile = profileId ? this._lastTeamConfig.profiles?.[profileId] : null;
        
        if (!profile || !profile.settings) {
            vscode.window.showWarningMessage('Team configuration is missing an active profile.');
            return;
        }
        
        const previousValues = {};
        const updatedKeys = [];
        
        for (const [key, value] of Object.entries(profile.settings)) {
            const inspect = this._settings.inspect(key);
            const currentValue = inspect?.workspaceValue ?? inspect?.globalValue ?? inspect?.defaultValue;
            previousValues[key] = currentValue;
            
            if (this._valuesEqual(currentValue, value)) {
                continue;
            }
            
            const result = await this._settings.updateSetting(key, value, {
                scope: 'workspace',
                reason: `team-profile:${profileId}`
            });
            if (result.updated) {
                updatedKeys.push(result.key);
            }
        }
        
        if (updatedKeys.length > 0) {
            await this._context?.workspaceState?.update(TEAM_CONFIG_STORAGE_KEY, {
                appliedAt: new Date().toISOString(),
                profileId,
                settings: previousValues
            });
            
            vscode.window.showInformationMessage(`Applied ${updatedKeys.length} Explorer Dates settings from team profile "${profile.name}".`);
        } else {
            vscode.window.showInformationMessage('Your settings already match the selected team profile.');
        }
    }
    
    async _documentUserOverrides(conflicts) {
        if (!conflicts || conflicts.length === 0) {
            vscode.window.showInformationMessage('No overrides to document.');
            return;
        }
        
        const workspaceRoot = this._getWorkspaceRoot();
        if (!workspaceRoot) {
            logger.warn('Cannot document overrides without a workspace.');
            return;
        }
        
        const overridesDir = vscode.Uri.joinPath(workspaceRoot, '.vscode');
        const overridesFile = vscode.Uri.joinPath(overridesDir, 'explorer-dates-overrides.md');
        
        await this._fs.ensureDirectory(overridesDir);
        
        let existing = '';
        if (await this._fileExists(overridesFile)) {
            existing = await this._fs.readFile(overridesFile, 'utf8');
            if (!existing.includes('# Explorer Dates Override Notes')) {
                existing = `# Explorer Dates Override Notes\n\n${existing.trimStart()}`;
            }
        } else {
            existing = '# Explorer Dates Override Notes\n\n';
        }
        
        const newEntry = this._buildOverridesEntry(conflicts);
        await this._fs.writeFile(overridesFile, `${existing}${newEntry}\n`, 'utf8');
        
        vscode.window.showInformationMessage('Documented Explorer Dates overrides in .vscode/explorer-dates-overrides.md');
    }
    
    /**
     * Utility methods
     */
    async _fileExists(uri) {
        const key = this._getConfigKey(uri);
        if (this._ephemeralConfigs.has(key)) {
            return true;
        }
        
        try {
            await this._fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }
    
    _getExtensionVersion() {
        try {
            return vscode.extensions.getExtension('your.extension-id')?.packageJSON?.version || 'unknown';
        } catch {
            return 'unknown';
        }
    }
    
    _resolveActiveProfileId(teamConfig) {
        if (!teamConfig?.profiles) {
            return null;
        }
        
        const { activeProfile, defaultProfile, profiles } = teamConfig;
        if (activeProfile && profiles[activeProfile]) {
            return activeProfile;
        }
        if (defaultProfile && profiles[defaultProfile]) {
            return defaultProfile;
        }
        return Object.keys(profiles)[0] || null;
    }
    
    _valuesEqual(a, b) {
        if (a === b) {
            return true;
        }
        
        if (typeof a === 'object' && typeof b === 'object') {
            try {
                return JSON.stringify(a) === JSON.stringify(b);
            } catch {
                return false;
            }
        }
        
        return false;
    }
    
    _formatValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch {
                return '[object]';
            }
        }
        return String(value);
    }
    
    _calculateImpact(settingKey, teamValue, userValue) {
        const chunkKey = FEATURE_CHUNK_MAP[settingKey];
        if (chunkKey) {
            return typeof teamValue === 'boolean' ? 'high' : 'medium';
        }
        
        if (typeof teamValue === 'boolean' && typeof userValue === 'boolean') {
            return 'medium';
        }
        
        return 'low';
    }
    
    _describeChunkEffect(settingKey, teamValue) {
        const chunkKey = FEATURE_CHUNK_MAP[settingKey];
        if (!chunkKey) {
            return null;
        }
        
        const label = CHUNK_LABELS[chunkKey] || chunkKey;
        const size = CHUNK_SIZES[chunkKey] || 0;
        const action = teamValue ? 'enabled' : 'disabled';
        return `${label} chunk will be ${action}${size ? ` (${size}KB)` : ''}`;
    }
    
    async _applySingleSetting(settingKey, value) {
        await this._settings.updateSetting(settingKey, value, {
            scope: 'workspace',
            reason: 'team-conflict-resolution'
        });
    }
    
    _getWorkspaceRoot() {
        return vscode.workspace.workspaceFolders?.[0]?.uri ?? null;
    }
    
    _buildOverridesEntry(conflicts) {
        const lines = [
            `## ${new Date().toISOString()}`,
            '',
            '| Setting | Team Value | Your Value | Impact | Notes |',
            '| --- | --- | --- | --- | --- |'
        ];
        
        for (const conflict of conflicts) {
            const notesParts = [];
            if (conflict.chunkEffect) {
                notesParts.push(conflict.chunkEffect);
            }
            const reason = conflict.reason || conflict.overrideReason;
            if (reason) {
                notesParts.push(`Reason: ${reason}`);
            }
            const userChoice = conflict.userChoice || conflict.choice;
            if (userChoice) {
                notesParts.push(`User choice: ${userChoice}`);
            }
            const notes = notesParts.length > 0 ? notesParts.join(' • ') : 'n/a';
            
            lines.push(`| \`${conflict.key}\` | ${this._formatValue(conflict.teamValue)} | ${this._formatValue(conflict.userValue)} | ${conflict.impact} | ${notes} |`);
        }
        
        lines.push('');
        
        for (const conflict of conflicts) {
            lines.push(`## Setting: ${conflict.key}`);
            lines.push(`- Team value: ${this._formatValue(conflict.teamValue)}`);
            lines.push(`- Your value: ${this._formatValue(conflict.userValue)}`);
            if (conflict.userChoice || conflict.choice) {
                lines.push(`- User choice: ${conflict.userChoice || conflict.choice}`);
            }
            const reason = conflict.reason || conflict.overrideReason;
            if (reason) {
                lines.push(`- Reason: ${reason}`);
            }
            if (conflict.chunkEffect) {
                lines.push(`- Chunk impact: ${conflict.chunkEffect}`);
            }
            lines.push('');
        }
        
        lines.push('');
        return lines.join('\n');
    }
    
    _normalizeTeamConfig(parsed) {
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Team configuration file is empty or invalid.');
        }
        
        const { profiles } = parsed;
        if (!profiles || typeof profiles !== 'object' || Object.keys(profiles).length === 0) {
            throw new Error('Team configuration must include at least one profile.');
        }
        
        const normalizedProfiles = {};
        for (const [profileId, profileDefinition] of Object.entries(profiles)) {
            if (!profileDefinition || typeof profileDefinition !== 'object') {
                continue;
            }
            
            const settings = typeof profileDefinition.settings === 'object'
                ? profileDefinition.settings
                : {};
            
            normalizedProfiles[profileId] = {
                id: profileId,
                name: profileDefinition.name || profileId,
                description: profileDefinition.description || '',
                priority: profileDefinition.priority || 'normal',
                chunks: Array.isArray(profileDefinition.chunks) ? profileDefinition.chunks : [],
                settings,
                metadata: profileDefinition.metadata || {}
            };
        }
        
        if (Object.keys(normalizedProfiles).length === 0) {
            throw new Error('Team configuration profiles are malformed.');
        }
        
        return {
            version: parsed.version || TEAM_CONFIG_SCHEMA_VERSION,
            defaultProfile: parsed.defaultProfile || Object.keys(normalizedProfiles)[0],
            activeProfile: parsed.activeProfile,
            profiles: normalizedProfiles,
            metadata: parsed.metadata || {},
            createdAt: parsed.createdAt || null,
            updatedAt: parsed.updatedAt || null
        };
    }
    
    /**
     * Validates settings against known configuration schema
     */
    _validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            throw new Error('Settings must be a valid object');
        }
        
        const validSettingKeys = new Set(Object.keys(FEATURE_CHUNK_MAP));
        const knownSettings = new Set([
            'explorerDates.dateFormat',
            'explorerDates.showFileAge',
            'explorerDates.colorizeByAge',
            'explorerDates.excludePatterns',
            'explorerDates.maxCacheSize',
            'explorerDates.refreshInterval'
        ]);
        
        // Combine known settings
        const allValidKeys = new Set([...validSettingKeys, ...knownSettings]);
        
        const invalidKeys = [];
        const warningKeys = [];
        
        for (const key of Object.keys(settings)) {
            if (!allValidKeys.has(key)) {
                if (key.startsWith('explorerDates.')) {
                    warningKeys.push(key);
                } else {
                    invalidKeys.push(key);
                }
            }
        }
        
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid settings detected: ${invalidKeys.join(', ')}. Settings must start with 'explorerDates.'`);
        }
        
        if (warningKeys.length > 0) {
            logger.warn('Unrecognized Explorer Dates settings in team profile', { keys: warningKeys });
        }
        
        // Validate setting values
        for (const [key, value] of Object.entries(settings)) {
            this._validateSettingValue(key, value);
        }
    }
    
    /**
     * Validates individual setting values
     */
    _validateSettingValue(key, value) {
        // Boolean settings validation
        const booleanSettings = new Set(Object.keys(FEATURE_CHUNK_MAP));
        booleanSettings.add('explorerDates.showFileAge');
        booleanSettings.add('explorerDates.colorizeByAge');
        
        if (booleanSettings.has(key) && typeof value !== 'boolean') {
            throw new Error(`Setting '${key}' must be a boolean value, got ${typeof value}`);
        }
        
        // String settings validation
        if (key === 'explorerDates.dateFormat') {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new Error(`Setting '${key}' must be a non-empty string`);
            }
        }
        
        // Array settings validation
        if (key === 'explorerDates.excludePatterns') {
            if (!Array.isArray(value)) {
                throw new Error(`Setting '${key}' must be an array of patterns`);
            }
            for (const pattern of value) {
                if (typeof pattern !== 'string') {
                    throw new Error(`Exclude pattern must be a string, got ${typeof pattern}`);
                }
            }
        }
        
        // Numeric settings validation
        const numericSettings = new Set([
            'explorerDates.maxCacheSize',
            'explorerDates.refreshInterval'
        ]);
        
        if (numericSettings.has(key)) {
            if (typeof value !== 'number' || value < 0) {
                throw new Error(`Setting '${key}' must be a non-negative number, got ${value}`);
            }
        }
    }
    
    /**
     * Exports team configuration in various formats
     */
    async exportTeamConfiguration(format = 'json', options = {}) {
        const teamConfig = this._lastTeamConfig;
        if (!teamConfig) {
            throw new Error('No team configuration is currently loaded');
        }
        
        const { includeMetadata = true, prettify = true } = options;
        
        let exportData = { ...teamConfig };
        
        if (!includeMetadata) {
            delete exportData.metadata;
            // Remove metadata from profiles too
                exportData.profiles = Object.fromEntries(
                    Object.entries(exportData.profiles).map(([id, profile]) => {
                        const profileWithoutMetadata = { ...profile };
                        delete profileWithoutMetadata.metadata;
                        return [id, profileWithoutMetadata];
                    })
                );
        }
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(exportData, null, prettify ? 2 : 0);
                
            case 'yaml':
                // Basic YAML export (would need yaml library for full implementation)
                return this._convertToYamlLike(exportData);
                
            case 'vscode-settings':
                // Export as VS Code settings format
                const settings = {};
                for (const profile of Object.values(exportData.profiles)) {
                    Object.assign(settings, profile.settings);
                }
                return JSON.stringify(settings, null, prettify ? 2 : 0);
                
            case 'csv':
                return this._convertToCsv(exportData);
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Imports team configuration from external sources
     */
    async importTeamConfiguration(data, format = 'json', options = {}) {
        const { validate = true, merge = false } = options;
        
        let parsedData;
        
        try {
            switch (format.toLowerCase()) {
                case 'json':
                    parsedData = JSON.parse(data);
                    break;
                    
                case 'vscode-settings':
                    // Import from VS Code settings JSON
                    const settings = JSON.parse(data);
                    parsedData = this._convertFromVSCodeSettings(settings);
                    break;
                    
                default:
                    throw new Error(`Unsupported import format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to parse ${format} data: ${error.message}`);
        }
        
        if (validate) {
            this._validateImportedData(parsedData);
        }
        
        if (merge) {
            const existingProfiles = await this.loadTeamProfiles(true) || {};
            parsedData.profiles = {
                ...existingProfiles,
                ...parsedData.profiles
            };
        }
        
        await this.saveTeamProfiles(parsedData.profiles);
        logger.info('Imported team configuration', { 
            format,
            profileCount: Object.keys(parsedData.profiles).length,
            merge 
        });
        
        return parsedData;
    }
    
    /**
     * Sets up file watcher for team configuration changes
     */
    startTeamConfigWatcher() {
        if (this._configWatcher) {
            this._configWatcher.dispose();
        }
        
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) {
            logger.warn('Cannot start team config watcher without workspace');
            return;
        }
        
        const pattern = new vscode.RelativePattern(workspaceRoot, this._teamConfigFile);
        
        this._configWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        this._configWatcher.onDidCreate(async (uri) => {
            logger.info('Team configuration file created, revalidating');
            await this._handleConfigChange(uri, 'created');
        });
        
        this._configWatcher.onDidChange(async (uri) => {
            logger.info('Team configuration file changed, revalidating');
            await this._handleConfigChange(uri, 'changed');
        });
        
        this._configWatcher.onDidDelete(async (uri) => {
            logger.info('Team configuration file deleted');
            await this._handleConfigChange(uri, 'deleted');
        });
        
        logger.info('Started team configuration file watcher');
    }
    
    /**
     * Stops the team configuration file watcher
     */
    stopTeamConfigWatcher() {
        if (this._configWatcher) {
            this._configWatcher.dispose();
            this._configWatcher = null;
            logger.info('Stopped team configuration file watcher');
        }
    }
    
    /**
     * Handles team configuration file changes
     */
    async _handleConfigChange(uri, changeType) {
        try {
            if (changeType === 'deleted') {
                this._lastTeamConfig = null;
                this._lastTeamConfigPath = null;
                this._lastProfileId = null;
                
                vscode.window.showInformationMessage(
                    'Explorer Dates team configuration was removed.',
                    'Understood'
                );
                return;
            }
            
            // Debounce rapid changes
            if (this._changeTimeout) {
                clearTimeout(this._changeTimeout);
            }
            
            this._changeTimeout = setTimeout(async () => {
                try {
                    const validationResult = await this.validateTeamConfiguration();
                    
                    if (validationResult.hasTeamConfig && validationResult.conflicts.length > 0) {
                        vscode.window.showInformationMessage(
                            `Explorer Dates team configuration updated with ${validationResult.conflicts.length} conflicts detected.`,
                            'Review Conflicts',
                            'Ignore'
                        ).then(action => {
                            if (action === 'Review Conflicts') {
                                this._showTeamConflictWarning(validationResult.conflicts);
                            }
                        });
                    } else if (validationResult.hasTeamConfig) {
                        vscode.window.showInformationMessage(
                            'Explorer Dates team configuration updated successfully.',
                            'Understood'
                        );
                    }
                } catch (error) {
                    logger.error('Failed to handle team config change', error);
                    vscode.window.showErrorMessage(
                        `Explorer Dates team configuration update failed: ${error.message}`
                    );
                }
            }, 1000); // 1 second debounce
        } catch (error) {
            logger.error('Error handling team config change', error);
        }
    }
    
    /**
     * Helper method to convert data to YAML-like format
     */
    _convertToYamlLike(data) {
        const lines = [];
        
        const addIndentedLines = (obj, indent = 0) => {
            const prefix = '  '.repeat(indent);
            
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) {
                    lines.push(`${prefix}${key}: null`);
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    lines.push(`${prefix}${key}:`);
                    addIndentedLines(value, indent + 1);
                } else if (Array.isArray(value)) {
                    lines.push(`${prefix}${key}:`);
                    for (const item of value) {
                        lines.push(`${prefix}  - ${JSON.stringify(item)}`);
                    }
                } else {
                    lines.push(`${prefix}${key}: ${JSON.stringify(value)}`);
                }
            }
        };
        
        addIndentedLines(data);
        return lines.join('\n');
    }
    
    /**
     * Helper method to convert data to CSV format
     */
    _convertToCsv(data) {
        const rows = [];
        rows.push('Profile ID,Profile Name,Setting Key,Setting Value,Description');
        
        for (const [profileId, profile] of Object.entries(data.profiles)) {
            const name = profile.name || profileId;
            const description = profile.description || '';
            
            if (profile.settings && Object.keys(profile.settings).length > 0) {
                for (const [key, value] of Object.entries(profile.settings)) {
                    const csvRow = [
                        profileId,
                        name,
                        key,
                        typeof value === 'string' ? value : JSON.stringify(value),
                        description
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
                    
                    rows.push(csvRow);
                }
            } else {
                // Add a row even if no settings
                const csvRow = [
                    profileId,
                    name,
                    '',
                    '',
                    description
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
                
                rows.push(csvRow);
            }
        }
        
        return rows.join('\n');
    }
    
    /**
     * Helper method to convert VS Code settings to team configuration
     */
    _convertFromVSCodeSettings(settings) {
        const explorerDatesSettings = {};
        
        for (const [key, value] of Object.entries(settings)) {
            if (key.startsWith('explorerDates.')) {
                explorerDatesSettings[key] = value;
            }
        }
        
        if (Object.keys(explorerDatesSettings).length === 0) {
            throw new Error('No Explorer Dates settings found in VS Code settings');
        }
        
        return {
            version: TEAM_CONFIG_SCHEMA_VERSION,
            defaultProfile: 'imported',
            profiles: {
                imported: {
                    name: 'Imported Configuration',
                    description: 'Configuration imported from VS Code settings',
                    settings: explorerDatesSettings,
                    metadata: {
                        importedAt: new Date().toISOString(),
                        source: 'vscode-settings'
                    }
                }
            },
            metadata: {
                importedAt: new Date().toISOString(),
                source: 'vscode-settings'
            }
        };
    }
    
    /**
     * Validates imported team configuration data
     */
    _validateImportedData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Imported data must be a valid object');
        }
        
        if (!data.profiles || typeof data.profiles !== 'object') {
            throw new Error('Imported data must contain a profiles object');
        }
        
        const profileCount = Object.keys(data.profiles).length;
        if (profileCount === 0) {
            throw new Error('Imported data must contain at least one profile');
        }
        
        // Validate each profile
        for (const [profileId, profile] of Object.entries(data.profiles)) {
            if (!profile || typeof profile !== 'object') {
                throw new Error(`Profile '${profileId}' is invalid`);
            }
            
            if (!profile.name || typeof profile.name !== 'string') {
                throw new Error(`Profile '${profileId}' must have a valid name`);
            }
            
            if (profile.settings) {
                try {
                    this._validateSettings(profile.settings);
                } catch (error) {
                    throw new Error(`Profile '${profileId}' has invalid settings: ${error.message}`);
                }
            }
        }
        
        logger.info('Validated imported team configuration', { profileCount });
    }
    
    /**
     * Clean up resources when the manager is disposed
     */
    dispose() {
        this.stopTeamConfigWatcher();
        
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
            this._changeTimeout = null;
        }
        
        this._ephemeralConfigs.clear();
        logger.info('Team persistence manager disposed');
    }
    
    _getConfigKey(uri) {
        if (!uri) return '';
        if (typeof uri === 'string') {
            return uri;
        }
        return uri.fsPath || uri.path || String(uri);
    }
    
    _shouldUseEphemeralStorage(error) {
        if (!error) return false;
        const restrictedCodes = new Set(['EACCES', 'EPERM', 'EROFS', 'ENOSPC']);
        return restrictedCodes.has(error.code);
    }

    _notifyEphemeralStorageWarning(error) {
        const code = error?.code || 'generic';
        if (this._ephemeralNoticeShown.has(code)) {
            return;
        }
        this._ephemeralNoticeShown.add(code);
        const reasonCode = error?.code;
        let detail;
        if (reasonCode === 'ENOSPC') {
            detail = 'Explorer Dates team configuration could not be saved because the disk is full.';
        } else {
            detail = 'Explorer Dates team configuration could not be saved because the workspace is read-only or permissions are restricted.';
        }
        vscode.window.showWarningMessage(
            `${detail} Changes will be kept in memory until VS Code restarts, so they may be lost.`,
            'Understood'
        );
    }
    
    async _persistTeamConfig(uri, dataObject) {
        const payload = JSON.stringify(dataObject, null, 2);
        try {
            await this._fs.writeFile(uri, payload, 'utf8');
            this._ephemeralConfigs.delete(this._getConfigKey(uri));
            this._resetEphemeralWarnings();
        } catch (error) {
            if (this._shouldUseEphemeralStorage(error)) {
                const snapshot = JSON.parse(payload);
                this._ephemeralConfigs.set(this._getConfigKey(uri), snapshot);
                logger.warn('Stored team configuration in ephemeral memory due to filesystem restriction', { code: error.code });
                this._notifyEphemeralStorageWarning(error);
                return;
            }
            
            // Enhanced user notifications for write errors
            if (error.code === 'ENOSPC') {
                vscode.window.showErrorMessage(
                    'Explorer Dates team configuration cannot be saved - disk is full. ' +
                    'Free up some space and try again.',
                    'Understood'
                );
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                vscode.window.showErrorMessage(
                    'Explorer Dates team configuration cannot be saved due to insufficient permissions. ' +
                    'Contact your administrator to enable write access.',
                    'Understood'
                );
            }
            
            throw error;
        }
    }

    _resetEphemeralWarnings() {
        if (this._ephemeralNoticeShown.size === 0) {
            return;
        }
        this._ephemeralNoticeShown.clear();
        logger.debug('Filesystem write succeeded after restriction; warning prompts reset');
    }
}

module.exports = { TeamConfigPersistenceManager };
