const vscode = require('vscode');
const { getLogger } = require('./logger');

const EXPLORER_PREFIX = 'explorerDates.';

// Settings we prefer to live at the workspace scope rather than user scope.
const WORKSPACE_PREFERRED_SETTINGS = [
    'performanceMode',
    'featureLevel',
    'smartFileWatching',
    'smartWatcherMaxPatterns',
    'smartWatcherExtensions',
    'enableSmartWatcherFallbacks',
    'enableOnboardingSystem',
    'enableExportReporting',
    'enableAnalysisCommands',
    'enableAdvancedCache',
    'enableWorkspaceTemplates',
    'enableWorkspaceIntelligence',
    'enableExtensionApi',
    'enableIncrementalWorkers',
    'enableProgressiveAnalysis'
];

const OWNED_FILE_PATTERN = /^\.?explorer-dates.*\.json$/i;
const REORDER_EXCLUSIONS = new Set([
    `${EXPLORER_PREFIX}customColors`,
    `${EXPLORER_PREFIX}enableReporting`
]);

class SettingsOrganizer {
    constructor(context) {
        this._context = context;
        this._logger = getLogger();
    }

    async getOrganizationPlan() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const managedKeys = this._getAllExplorerDatesKeys();
        return this._buildPlan(config, managedKeys);
    }

    async organize(options = {}) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const managedKeys = this._getAllExplorerDatesKeys();
        const plan = options.plan || (await this._buildPlan(config, managedKeys));

        const summary = {
            changed: false,
            movedToWorkspace: [],
            reorderedWorkspace: false,
            sortedFiles: []
        };

        if (!plan.needsWork && !options.force) {
            return summary;
        }

        await this._movePreferredSettingsToWorkspace(config, summary, plan.keysToMove);
        await this._reorderWorkspaceSettings(config, plan.workspaceEntries, summary, plan.workspaceOutOfOrder);
        await this._sortExplorerFiles(summary, plan.filesToSort);

        return summary;
    }

    async _buildPlan(config, managedKeys) {
        const keysToMove = this._findWorkspacePreferredKeysToMove(config);
        const workspaceEntries = this._collectWorkspaceEntries(config, managedKeys);
        const workspaceOutOfOrder = this._hasWorkspaceOrderingIssue(workspaceEntries);
        const explorerFiles = await this._collectExplorerFiles();
        const filesToSort = await this._determineFilesNeedingSort(explorerFiles);

        return {
            keysToMove,
            workspaceEntries,
            workspaceOutOfOrder,
            filesToSort,
            needsWork:
                keysToMove.length > 0 ||
                workspaceOutOfOrder ||
                filesToSort.length > 0
        };
    }

    _findWorkspacePreferredKeysToMove(config) {
        const keysToMove = [];

        for (const key of WORKSPACE_PREFERRED_SETTINGS) {
            const inspect = config.inspect(key);
            if (!inspect) continue;

            const hasGlobal = inspect.globalValue !== undefined;
            const hasWorkspace = inspect.workspaceValue !== undefined;
            const hasFolder = inspect.workspaceFolderValue !== undefined;

            if (hasGlobal && !hasWorkspace && !hasFolder) {
                keysToMove.push(key);
            }
        }

        return keysToMove;
    }

    _collectWorkspaceEntries(config, explorerKeys) {
        const entries = [];

        for (const fullKey of explorerKeys) {
            if (this._shouldSkipReorder(fullKey)) {
                continue;
            }
            const shortKey = this._stripPrefix(fullKey);
            const inspect = config.inspect(shortKey);
            if (!inspect) continue;

            if (inspect.workspaceValue !== undefined) {
                entries.push({
                    fullKey,
                    shortKey,
                    value: inspect.workspaceValue
                });
            }
        }

        return entries;
    }

    _hasWorkspaceOrderingIssue(entries) {
        if (!entries || entries.length === 0) {
            return false;
        }
        const sorted = [...entries].sort((a, b) => a.fullKey.localeCompare(b.fullKey));
        return !entries.every((entry, index) => entry.fullKey === sorted[index].fullKey);
    }

    async _determineFilesNeedingSort(candidateFiles) {
        if (!candidateFiles || candidateFiles.length === 0) {
            return [];
        }

        const filesToSort = [];
        for (const file of candidateFiles) {
            if (await this._needsJsonSort(file)) {
                filesToSort.push(file);
            }
        }
        return filesToSort;
    }

    async _collectExplorerFiles() {
        const roots = this._getWorkspaceRootUris();
        if (!roots.length || !vscode.workspace.fs) {
            return [];
        }

        const seen = new Map();
        for (const root of roots) {
            await this._collectFromDirectory(root, seen);
            const vscodeDir = vscode.Uri.joinPath(root, '.vscode');
            await this._collectFromDirectory(vscodeDir, seen);
        }
        return Array.from(seen.values());
    }

    async _collectFromDirectory(directoryUri, seen) {
        if (!directoryUri) return;
        try {
            const entries = await vscode.workspace.fs.readDirectory(directoryUri);
            for (const [name, type] of entries) {
                if (type !== vscode.FileType.File) {
                    continue;
                }
                if (!this._isOwnedExplorerFile(name)) {
                    continue;
                }
                const fileUri = vscode.Uri.joinPath(directoryUri, name);
                const mapKey = fileUri.fsPath || fileUri.path;
                if (!seen.has(mapKey)) {
                    seen.set(mapKey, fileUri);
                }
            }
        } catch (error) {
            if (error?.code === 'FileNotFound' || error?.code === 'ENOENT') {
                return;
            }
            this._logger.warn(
                `Failed to scan Explorer Dates directory ${directoryUri.fsPath || directoryUri.path}`,
                error
            );
        }
    }

    _getWorkspaceRootUris() {
        return (vscode.workspace.workspaceFolders || [])
            .map((folder) => folder?.uri)
            .filter(Boolean);
    }

    _isOwnedExplorerFile(name = '') {
        return OWNED_FILE_PATTERN.test(name);
    }

    async _movePreferredSettingsToWorkspace(config, summary, keysToMove) {
        const targets = Array.isArray(keysToMove) ? keysToMove : WORKSPACE_PREFERRED_SETTINGS;
        if (!targets.length) {
            return;
        }

        for (const key of targets) {
            const inspect = config.inspect(key);
            if (!inspect) continue;

            const hasGlobal = inspect.globalValue !== undefined;
            const hasWorkspace = inspect.workspaceValue !== undefined;
            const hasFolder = inspect.workspaceFolderValue !== undefined;

            if (hasGlobal && !hasWorkspace && !hasFolder) {
                await config.update(key, inspect.globalValue, vscode.ConfigurationTarget.Workspace);
                await config.update(key, undefined, vscode.ConfigurationTarget.Global);
                summary.movedToWorkspace.push(`${EXPLORER_PREFIX}${key}`);
                summary.changed = true;
                this._logger.info(`Moved ${EXPLORER_PREFIX}${key} from user settings to workspace settings.`);
            }
        }
    }

    async _reorderWorkspaceSettings(config, workspaceEntries, summary, forceReorder = false) {
        const entries = Array.isArray(workspaceEntries) && workspaceEntries.length > 0
            ? workspaceEntries
            : this._collectWorkspaceEntries(config, this._getAllExplorerDatesKeys());

        if (entries.length === 0) {
            return;
        }

        const sortedEntries = [...entries].sort((a, b) => a.fullKey.localeCompare(b.fullKey));
        const alreadyOrdered = !forceReorder &&
            entries.every((entry, index) => entry.fullKey === sortedEntries[index].fullKey);

        if (alreadyOrdered) {
            return;
        }

        for (const entry of entries) {
            await config.update(entry.shortKey, undefined, vscode.ConfigurationTarget.Workspace);
        }

        for (const entry of sortedEntries) {
            await config.update(entry.shortKey, entry.value, vscode.ConfigurationTarget.Workspace);
        }

        summary.reorderedWorkspace = true;
        summary.changed = true;
        this._logger.info('Reordered Explorer Dates workspace settings alphabetically.');
    }

    async _sortExplorerFiles(summary, filesToSort) {
        const targets = Array.isArray(filesToSort) ? filesToSort : await this._determineFilesNeedingSort(await this._collectExplorerFiles());
        if (!targets.length) {
            return;
        }

        for (const file of targets) {
            const sorted = await this._sortJsonFile(file);
            if (sorted) {
                summary.sortedFiles.push(this._toDisplayPath(file));
                summary.changed = true;
            }
        }
    }

    async _sortJsonFile(fileUri) {
        try {
            const rawBytes = await vscode.workspace.fs.readFile(fileUri);
            const raw = Buffer.from(rawBytes).toString('utf8').trim();
            if (!raw) {
                return false;
            }

            const parsed = JSON.parse(raw);
            const sorted = this._sortObject(parsed);
            const serialized = JSON.stringify(sorted, null, 2);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(`${serialized}\n`, 'utf8'));
            this._logger.info(`Sorted Explorer Dates file: ${this._toDisplayPath(fileUri)}`);
            return true;
        } catch (error) {
            if (error?.code === 'FileNotFound' || error?.code === 'ENOENT') {
                return false;
            }
            this._logger.warn(
                `Failed to sort Explorer Dates file ${this._toDisplayPath(fileUri)}`,
                error
            );
            return false;
        }
    }

    async _needsJsonSort(fileUri) {
        try {
            const rawBytes = await vscode.workspace.fs.readFile(fileUri);
            const raw = Buffer.from(rawBytes).toString('utf8').trim();
            if (!raw) {
                return false;
            }
            const parsed = JSON.parse(raw);
            const current = JSON.stringify(parsed, null, 2);
            const sorted = JSON.stringify(this._sortObject(parsed), null, 2);
            return current !== sorted;
        } catch (error) {
            if (error?.code === 'FileNotFound' || error?.code === 'ENOENT') {
                return false;
            }
            this._logger.warn(
                `Failed to inspect Explorer Dates file ${this._toDisplayPath(fileUri)}`,
                error
            );
            return false;
        }
    }

    _sortObject(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this._sortObject(item));
        }

        if (value && typeof value === 'object') {
            return Object.keys(value)
                .sort((a, b) => a.localeCompare(b))
                .reduce((acc, key) => {
                    acc[key] = this._sortObject(value[key]);
                    return acc;
                }, {});
        }

        return value;
    }

    _getAllExplorerDatesKeys() {
        const properties = this._context?.extension?.packageJSON?.contributes?.configuration?.properties || {};
        return Object.keys(properties).filter((key) => key.startsWith(EXPLORER_PREFIX));
    }

    _stripPrefix(fullKey) {
        return fullKey.startsWith(EXPLORER_PREFIX)
            ? fullKey.substring(EXPLORER_PREFIX.length)
            : fullKey;
    }

    _shouldSkipReorder(fullKey) {
        return REORDER_EXCLUSIONS.has(fullKey);
    }

    _toDisplayPath(fileUri) {
        return fileUri?.fsPath || fileUri?.path || String(fileUri);
    }
}

module.exports = {
    SettingsOrganizer
};
