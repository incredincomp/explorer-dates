const vscode = require('vscode');
const { fileSystem } = require('../filesystem/FileSystemAdapter');
const { getLogger } = require('../utils/logger');
const { getSettingsCoordinator } = require('../utils/settingsCoordinator');
const logger = getLogger();

async function readWorkspaceExclusionsFile(rootUri) {
    const fileUri = (rootUri && vscode.Uri.joinPath(rootUri, '.vscode', 'explorer-dates-exclusions.json')) || null;
    if (!fileUri) return null;
    try {
        const raw = await fileSystem.readFile(fileUri, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return Array.from(new Set(parsed.filter(Boolean)));
        if (Array.isArray(parsed?.exclusions)) return Array.from(new Set(parsed.exclusions.filter(Boolean)));
        return null;
    } catch (error) {
        if (error?.code === 'ENOENT' || error?.name === 'EntryNotFound' || (error?.message || '').includes('ENOENT')) return null;
        logger.warn('Failed to read workspace exclusions file', { error: error?.message });
        return null;
    }
}

async function writeWorkspaceExclusionsFile(rootUri, exclusions) {
    if (!rootUri) return;
    const settingsDir = vscode.Uri.joinPath(rootUri, '.vscode');
    await fileSystem.ensureDirectory(settingsDir);
    const fileUri = vscode.Uri.joinPath(settingsDir, 'explorer-dates-exclusions.json');
    const payload = { version: 1, updatedAt: new Date().toISOString(), exclusions };
    await fileSystem.writeFile(fileUri, JSON.stringify(payload, null, 2));
}

async function migrateLegacyExclusions(workspaceUri, rootUri) {
    const settings = getSettingsCoordinator();
    const workspaceKey = (workspaceUri && (workspaceUri.fsPath || workspaceUri.path)) || 'unknown-workspace';
    const profiles = settings.getValue('workspaceExclusionProfiles') || {};
    const legacy = Array.isArray(profiles[workspaceKey]) ? Array.from(new Set(profiles[workspaceKey].filter(Boolean))) : [];
    if (!legacy.length) return null;
    if (rootUri) {
        await writeWorkspaceExclusionsFile(rootUri, legacy);
        delete profiles[workspaceKey];
        await settings.updateSetting('workspaceExclusionProfiles', profiles, { scope: 'user', reason: 'workspace-exclusion-migration' });
        logger.info(`Migrated workspace exclusions for ${workspaceKey} to workspace settings file`);
        return legacy;
    }
    return legacy;
}

async function removeLegacyProfile(workspaceUri) {
    const settings = getSettingsCoordinator();
    const workspaceKey = (workspaceUri && (workspaceUri.fsPath || workspaceUri.path)) || 'unknown-workspace';
    const profiles = settings.getValue('workspaceExclusionProfiles') || {};
    if (!(workspaceKey in profiles)) return;
    delete profiles[workspaceKey];
    await settings.updateSetting('workspaceExclusionProfiles', profiles, { scope: 'user', reason: 'workspace-exclusion-migration' });
}

async function getDirectorySize(dirUri) {
    try {
        const entries = await fileSystem.readdir(dirUri, { withFileTypes: true });
        let size = 0; let count = 0;
        for (const entry of entries) {
            if (count > 100) break;
            if (entry.isFile()) {
                try { const s = await fileSystem.stat(vscode.Uri.joinPath(dirUri, entry.name)); size += s.size; } catch {}
                count++;
            }
        }
        return size;
    } catch {
        return 0;
    }
}

module.exports = {
    readWorkspaceExclusionsFile,
    writeWorkspaceExclusionsFile,
    migrateLegacyExclusions,
    removeLegacyProfile,
    getDirectorySize
};