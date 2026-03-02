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
const { CHUNK_SIZES } = require('./presetDefinitions');
const logger = getLogger();

function _valuesEqual(a, b) {
    if (a === b) return true;
    if (typeof a === 'object' && typeof b === 'object') {
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    }
    return false;
}

async function detectConfigConflicts(manager, teamConfig) {
    const profileId = manager._resolveActiveProfileId(teamConfig);
    if (!profileId) return [];

    const profile = teamConfig.profiles?.[profileId];
    if (!profile || !profile.settings) return [];

    const config = vscode.workspace.getConfiguration();
    const conflicts = [];

    for (const [settingKey, teamValue] of Object.entries(profile.settings)) {
        const inspected = config.inspect(settingKey);
        if (!inspected) continue;

        const hasUserOverride = inspected.workspaceValue !== undefined || inspected.globalValue !== undefined;
        if (!hasUserOverride) continue;

        const userValue = inspected.workspaceValue !== undefined ? inspected.workspaceValue : inspected.globalValue;
        if (_valuesEqual(userValue, teamValue)) continue;

        const conflict = {
            key: settingKey,
            profileId,
            teamValue,
            userValue,
            source: inspected.workspaceValue !== undefined ? 'workspace' : 'global',
            impact: _calculateImpact(settingKey, teamValue, userValue),
            chunkEffect: _describeChunkEffect(settingKey, teamValue)
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

function _calculateImpact(settingKey, teamValue, userValue) {
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

    if (FEATURE_CHUNK_MAP[settingKey]) {
        return typeof teamValue === 'boolean' ? 'high' : 'medium';
    }

    if (typeof teamValue === 'boolean' && typeof userValue === 'boolean') {
        return 'medium';
    }

    return 'low';
}

function _describeChunkEffect(settingKey, teamValue) {
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

    const chunkKey = FEATURE_CHUNK_MAP[settingKey];
    if (!chunkKey) return null;
    const label = CHUNK_LABELS[chunkKey] || chunkKey;
    const size = CHUNK_SIZES[chunkKey] || 0;
    const action = teamValue ? 'enabled' : 'disabled';
    return `${label} chunk will be ${action}${size ? ` (${size}KB)` : ''}`;
}

function validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
        throw new Error('Settings must be a valid object');
    }

    const validSettingKeys = new Set(Object.keys({
        'explorerDates.enableOnboardingSystem': 1,
        'explorerDates.enableAnalysisCommands': 1,
        'explorerDates.enableExportReporting': 1,
        'explorerDates.enableExtensionApi': 1,
        'explorerDates.enableWorkspaceTemplates': 1,
        'explorerDates.enableAdvancedCache': 1,
        'explorerDates.enableWorkspaceIntelligence': 1,
        'explorerDates.enableIncrementalWorkers': 1
    }));

    const knownSettings = new Set([
        'explorerDates.dateFormat',
        'explorerDates.showFileAge',
        'explorerDates.colorizeByAge',
        'explorerDates.excludePatterns',
        'explorerDates.maxCacheSize',
        'explorerDates.refreshInterval'
    ]);

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

    for (const [key, value] of Object.entries(settings)) {
        validateSettingValue(key, value);
    }
}

function validateSettingValue(key, value) {
    const booleanSettings = new Set([
        'explorerDates.enableOnboardingSystem',
        'explorerDates.enableAnalysisCommands',
        'explorerDates.enableExportReporting',
        'explorerDates.enableExtensionApi',
        'explorerDates.enableWorkspaceTemplates',
        'explorerDates.enableAdvancedCache',
        'explorerDates.enableWorkspaceIntelligence',
        'explorerDates.enableIncrementalWorkers',
        'explorerDates.showFileAge',
        'explorerDates.colorizeByAge'
    ]);

    if (booleanSettings.has(key) && typeof value !== 'boolean') {
        throw new Error(`Setting '${key}' must be a boolean value, got ${typeof value}`);
    }

    if (key === 'explorerDates.dateFormat') {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`Setting '${key}' must be a non-empty string`);
        }
    }

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

function _convertToYamlLike(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(obj)) {
        return obj.map(v => `${pad}- ${_convertToYamlLike(v, indent + 1).trim()}`).join('\n');
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).map(([k, v]) => {
            if (typeof v === 'object') {
                return `${pad}${k}:\n${_convertToYamlLike(v, indent + 1)}`;
            }
            return `${pad}${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`;
        }).join('\n');
    }
    return `${pad}${String(obj)}`;
}

function _convertToCsv(data) {
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

function _convertFromVSCodeSettings(settings) {
    if (!settings || typeof settings !== 'object') return { version: '1.0.0', defaultProfile: 'imported', profiles: { imported: { name: 'imported', settings: {} } } };
    const filtered = {};
    for (const [k, v] of Object.entries(settings)) {
        if (typeof k === 'string' && k.startsWith('explorerDates.')) filtered[k] = v;
    }
    const profile = { name: 'imported', settings: filtered };
    return { version: '1.0.0', defaultProfile: 'imported', profiles: { imported: profile }, metadata: {} };
}

function _validateImportedData(data) {
    if (!data || typeof data !== 'object') throw new Error('Imported data must be a valid object');
    if (!data.profiles || typeof data.profiles !== 'object') throw new Error('Imported data must contain a profiles object');
    const profileCount = Object.keys(data.profiles).length;
    if (profileCount === 0) throw new Error('Imported data must contain at least one profile');
    for (const [profileId, profile] of Object.entries(data.profiles)) {
        if (!profile || typeof profile !== 'object') throw new Error(`Profile '${profileId}' is invalid`);
        if (!profile.name || typeof profile.name !== 'string') throw new Error(`Profile '${profileId}' must have a valid name`);
        if (profile.settings) {
            try { validateSettings(profile.settings); } catch (err) { throw new Error(`Profile '${profileId}' has invalid settings: ${err.message}`); }
        }
    }
}

async function importTeamConfiguration(manager, data, format = 'json', options = {}) {
    const { validate = true, merge = false } = options;
    let parsedData;

    try {
        switch (format.toLowerCase()) {
            case 'json':
                parsedData = JSON.parse(data);
                break;
            case 'vscode-settings':
                const settings = JSON.parse(data);
                parsedData = _convertFromVSCodeSettings(settings);
                break;
            default:
                throw new Error(`Unsupported import format: ${format}`);
        }
    } catch (error) {
        throw new Error(`Failed to parse ${format} data: ${error.message}`);
    }

    if (validate) {
        _validateImportedData(parsedData);
    }

    if (merge) {
        const existingProfiles = await manager.loadTeamProfiles(true) || {};
        parsedData.profiles = {
            ...existingProfiles,
            ...parsedData.profiles
        };
    }

    await manager.saveTeamProfiles(parsedData.profiles);
    logger.info('Imported team configuration', {
        format,
        profileCount: Object.keys(parsedData.profiles).length,
        merge
    });

    return parsedData;
}

async function exportTeamConfiguration(manager, format = 'json', options = {}) {
    const teamConfig = manager._lastTeamConfig;
    if (!teamConfig) {
        throw new Error('No team configuration is currently loaded');
    }

    const { includeMetadata = true, prettify = true } = options;
    let exportData = { ...teamConfig };

    if (!includeMetadata) {
        delete exportData.metadata;
        exportData.profiles = Object.fromEntries(
            Object.entries(exportData.profiles).map(([id, profile]) => {
                const p = { ...profile }; delete p.metadata; return [id, p];
            })
        );
    }

    switch (format.toLowerCase()) {
        case 'json':
            return JSON.stringify(exportData, null, prettify ? 2 : 0);
        case 'yaml':
            return _convertToYamlLike(exportData);
        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
}

async function importTeamConfiguration(manager, data, format = 'json', options = {}) {
    const { validate = true, merge = false } = options;
    let parsedData;

    try {
        switch (format.toLowerCase()) {
            case 'json':
                parsedData = JSON.parse(data);
                break;
            case 'vscode-settings':
                const settings = JSON.parse(data);
                parsedData = _convertFromVSCodeSettings(settings);
                break;
            default:
                throw new Error(`Unsupported import format: ${format}`);
        }
    } catch (error) {
        throw new Error(`Failed to parse ${format} data: ${error.message}`);
    }

    if (validate) {
        _validateImportedData(parsedData);
    }

    if (merge) {
        const existingProfiles = await manager.loadTeamProfiles(true) || {};
        parsedData.profiles = {
            ...existingProfiles,
            ...parsedData.profiles
        };
    }

    await manager.saveTeamProfiles(parsedData.profiles);
    logger.info('Imported team configuration', {
        format,
        profileCount: Object.keys(parsedData.profiles).length,
        merge
    });

    return parsedData;
}

module.exports = {
    detectConfigConflicts,
    validateSettings,
    validateSettingValue,
    _convertToYamlLike,
    _convertToCsv,
    importTeamConfiguration,
    _convertFromVSCodeSettings,
    _validateImportedData,
    exportTeamConfiguration
};