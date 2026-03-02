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
const { getLocalization } = require('./utils/localization');
const l10n = getLocalization();
const logger = getLogger();

async function showTeamConflictWarning(manager, conflicts) {
    const conflictCount = conflicts.length;
    const message = l10n.getString('teamConflictsFound', conflictCount);

    const action = await vscode.window.showWarningMessage(
        message,
        l10n.getString('showDetails'),
        l10n.getString('useTeamConfig'),
        l10n.getString('keepMySettings')
    );

    switch (action) {
        case 'Show Details':
            return showConflictDetails(manager, conflicts);
        case 'Use Team Config':
            return applyTeamConfiguration(manager);
        case 'Keep My Settings':
            return documentUserOverrides(manager, conflicts);
    }
}

async function showConflictDetails(manager, conflicts) {
    try {
        const items = conflicts.map(c => ({
            label: `${c.key}`,
            description: `${c.impact} | ${c.chunkEffect || 'no chunk effect'}`,
            detail: `Team: ${JSON.stringify(c.teamValue)}\nYou: ${JSON.stringify(c.userValue)}`
        }));

        const choice = await vscode.window.showQuickPick(items, { placeHolder: l10n.getString('reviewConflictsPlaceholder') });
        return { chosen: !!choice, choice };
    } catch (error) {
        logger.error('Failed to show conflict details', error);
        throw error;
    }
}

async function applyTeamConfiguration(manager) {
    try {
        const teamConfig = manager._lastTeamConfig;
        if (!teamConfig) return { applied: 0 };

        const profileId = manager._resolveActiveProfileId(teamConfig);
        const profile = teamConfig.profiles?.[profileId];
        if (!profile || !profile.settings) return { applied: 0 };

        const keys = Object.keys(profile.settings || {});
        for (const key of keys) {
            const value = profile.settings[key];
            try {
                await manager._applySingleSetting(key, value);
            } catch (err) {
                logger.warn('Failed to apply team setting during applyTeamConfiguration:', err);
            }
        }

        vscode.window.showInformationMessage(l10n.getString('appliedFromTeamProfile', keys.length, profileId || 'unknown'));
        return { applied: keys.length };
    } catch (error) {
        logger.error('applyTeamConfiguration failed:', error);
        throw error;
    }
}

async function documentUserOverrides(manager, conflicts) {
    // Reuse existing implementation inside manager where it relies on FS utils
    // Delegate to manager._documentUserOverrides if present for consistency
    if (typeof manager._documentUserOverrides === 'function') {
        return manager._documentUserOverrides(conflicts);
    }
    // Fallback behavior
    vscode.window.showInformationMessage(l10n.getString('documentedOverrides'));
    return { documented: true };
}

module.exports = {
    showTeamConflictWarning,
    showConflictDetails,
    applyTeamConfiguration,
    documentUserOverrides
};