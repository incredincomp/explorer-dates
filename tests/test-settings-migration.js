#!/usr/bin/env node

/**
 * Settings migration test suite
 * Ensures both desktop (Node) and web bundles migrate legacy settings.
 */

const assert = require('assert');
const path = require('path');
const { scheduleExit } = require('./helpers/forceExit');
const {
    createTestMock,
    createExtensionContext,
    VSCodeUri,
    workspaceRoot
} = require('./helpers/mockVscode');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');

const sampleWorkspaceRoot = path.join(__dirname, 'fixtures', 'sample-workspace');

// Filter intentional error noise to keep output readable
const originalError = console.error;
const errorFilters = [
    /Failed to initialize advanced systems/
];
const consoleErrorLog = [];
console.error = (...args) => {
    const msg = args.join(' ');
    if (errorFilters.some((pattern) => pattern.test(msg))) {
        return;
    }
    consoleErrorLog.push(msg);
    originalError(...args);
};

function drainConsoleErrors() {
    if (consoleErrorLog.length === 0) {
        return [];
    }
    const entries = consoleErrorLog.splice(0, consoleErrorLog.length);
    return entries;
}

const extensionEntryPath = path.join(__dirname, '..', 'extension.js');
const webEntryPath = path.join(__dirname, '..', 'dist', 'extension.web.js');
const MULTI_FOLDER_WORKSPACE = [
    { path: path.join(sampleWorkspaceRoot, 'workspaceA'), name: 'workspaceA' },
    { path: path.join(sampleWorkspaceRoot, 'workspaceB'), name: 'workspaceB' }
];

function getWorkspaceFolderDescriptors() {
    return MULTI_FOLDER_WORKSPACE.map((folder, index) => ({
        uri: VSCodeUri.file(folder.path),
        name: folder.name,
        index
    }));
}

function findUpdate(updates, key, target) {
    return updates.find((update) => {
        if (update.key !== key) {
            return false;
        }
        if (!target) {
            return true;
        }
        return update.target === target;
    });
}

function expectUpdateValue(updates, key, target, expectedValue, label) {
    const update = findUpdate(updates, key, target);
    assert.ok(
        update,
        `${label}: expected ${key} update (${target || 'any target'})`
    );
    assert.deepStrictEqual(
        update.value,
        expectedValue,
        `${label}: ${key} (${target || 'any'}) should equal ${JSON.stringify(expectedValue)}`
    );
    return update;
}

function expectCleanupAcrossScopes(updates, key, label, targets = ['global', 'workspace']) {
    targets.forEach((target) => {
        const update = updates.find((entry) => entry.key === key && entry.target === target);
        assert.ok(update, `${label}: expected ${key} cleanup for ${target}`);
        assert.strictEqual(
            update.value,
            undefined,
            `${label}: ${key} cleanup should remove value (${target})`
        );
    });
}

function expectMigrationHistory(context, expectedEntries, label) {
    const history = context.globalState._data['explorerDates.migrationHistory'];
    assert.ok(Array.isArray(history) && history.length > 0, `${label}: migration history missing`);
    const latest = history[history.length - 1];
    assert.ok(latest?.migratedSettings, `${label}: migration history missing details`);
    expectedEntries.forEach((entry) => {
        assert.ok(
            latest.migratedSettings.includes(entry),
            `${label}: migration history missing entry "${entry}"`
        );
    });
}

function expectNoCleanup(updates, key, label) {
    const removal = updates.find((entry) => entry.key === key && entry.value === undefined);
    assert.ok(!removal, `${label}: ${key} should not be removed when opting out`);
}

function expectNoUpdate(updates, key, target, label) {
    const update = updates.find((entry) => entry.key === key && (!target || entry.target === target));
    assert.ok(!update, `${label}: expected no ${key} update for ${target || 'any target'}`);
}

function getLatestMigratedSettings(context) {
    const history = context.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length === 0) {
        return [];
    }
    return history[history.length - 1]?.migratedSettings || [];
}

function expectTelemetryIncludes(context, entries, label) {
    const migrated = getLatestMigratedSettings(context);
    assert.ok(migrated.length > 0, `${label}: migration history missing`);
    for (const entry of entries) {
        assert.ok(migrated.includes(entry), `${label}: telemetry missing "${entry}"`);
    }
}

function expectTelemetryExcludes(context, entries, label) {
    const migrated = getLatestMigratedSettings(context);
    for (const entry of entries) {
        assert.ok(!migrated.includes(entry), `${label}: telemetry should not include "${entry}"`);
    }
}

function expectMigrationHistoryScopes(context, expectedScopes, label) {
    const history = context.globalState._data['explorerDates.migrationHistory'] || [];
    assert.ok(history.length > 0, `${label}: migration history missing`);
    const latest = history[history.length - 1];
    const reportingEntries = (latest?.migratedSettings || []).filter((entry) =>
        entry.startsWith('enableReporting→')
    );
    const expectedEntries = expectedScopes.map(
        (scope) => `enableReporting→enableExportReporting (${scope})`
    );
    assert.deepStrictEqual(
        reportingEntries.sort(),
        expectedEntries.sort(),
        `${label}: migration history should only record scopes (${expectedScopes.join(', ')})`
    );
}

async function activateExtension(entryPath, context) {
    delete require.cache[require.resolve(entryPath)];
    const entry = require(entryPath);
    drainConsoleErrors();
    try {
        await entry.activate(context);
        await entry.deactivate?.();
    } finally {
        delete require.cache[require.resolve(entryPath)];
    }
    const unexpectedErrors = drainConsoleErrors();
    if (unexpectedErrors.length > 0) {
        throw new Error(
            `Unexpected console errors while testing ${path.basename(entryPath)}:\n${unexpectedErrors.join('\n')}`
        );
    }
}

async function runNodeBundleMigration(options = {}) {
    const label = options.label || 'Node bundle';
    const globalCustomColors = {
        veryRecent: '#10b981',
        recent: '#fbbf24',
        old: '#f87171'
    };
    const workspaceCustomColors = {
        veryRecent: '#3b82f6',
        recent: '#6366f1',
        old: '#ec4899'
    };

    const workspaceFolderCustomColors = {
        veryRecent: '#facc15',
        recent: '#f97316',
        old: '#ef4444'
    };

    const workspaceFolders = getWorkspaceFolderDescriptors();
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true,
            'explorerDates.customColors': globalCustomColors
        },
        workspaceConfig: {
            enableReporting: false,
            customColors: workspaceCustomColors
        },
        workspaceFolderConfig: {
            enableReporting: true,
            customColors: workspaceFolderCustomColors
        },
        workspaceFolders,
        useDistChunks: options.useDistChunks === true
    });

    delete mockInstall.configValues['explorerDates.enableExportReporting'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Clean Up Now';
    assert.strictEqual(
        mockInstall.vscode.workspace.workspaceFolders.length,
        workspaceFolders.length,
        `${label}: workspace folders should reflect multi-root workspace`
    );
    try {
        await activateExtension(extensionEntryPath, nodeContext);
        const nodeCommands = await mockInstall.vscode.commands.getCommands(true);
        assert.ok(
            Array.isArray(nodeCommands) && nodeCommands.length > 0,
            `${label}: command registry should be queryable`
        );
    } finally {
        mockInstall.dispose();
    }

    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        true,
        label
    );
    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        false,
        label
    );
    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        true,
        label
    );

    const workbenchUpdate = findUpdate(
        mockInstall.appliedUpdates,
        'workbench.colorCustomizations',
        'global'
    );
    assert.ok(workbenchUpdate, `${label}: expected workbench.colorCustomizations update`);
    assert.strictEqual(
        workbenchUpdate.target,
        'global',
        `${label}: workbench update should target global scope`
    );
    assert.strictEqual(
        workbenchUpdate.value['explorerDates.customColor.veryRecent'],
        workspaceFolderCustomColors.veryRecent,
        `${label}: custom colors should migrate to workbench schema`
    );

    expectCleanupAcrossScopes(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        label,
        ['global', 'workspace', 'workspaceFolder']
    );
    expectCleanupAcrossScopes(
        mockInstall.appliedUpdates,
        'explorerDates.enableReporting',
        label,
        ['global', 'workspace', 'workspaceFolder']
    );

    expectMigrationHistory(nodeContext, [
        'enableReporting→enableExportReporting (Global)',
        'enableReporting→enableExportReporting (Workspace)',
        'enableReporting→enableExportReporting (WorkspaceFolder)',
        'customColors→workbench.colorCustomizations',
        'deprecatedSettings→removed'
    ], label);
}

async function testNodeBundleMigration() {
    await runNodeBundleMigration({ label: 'Node bundle' });
}

async function testNodeBundleMigrationDist() {
    await runNodeBundleMigration({ label: 'Node bundle (dist chunks)', useDistChunks: true });
}

async function testWebBundleMigration() {
    const globalCustomColors = {
        veryRecent: '#0ea5e9',
        recent: '#fde047',
        old: '#ef4444'
    };
    const workspaceCustomColors = {
        veryRecent: '#22d3ee',
        recent: '#a855f7',
        old: '#f97316'
    };

    const workspaceFolderCustomColors = {
        veryRecent: '#0ea5e9',
        recent: '#22d3ee',
        old: '#0284c7'
    };

    const workspaceFolders = MULTI_FOLDER_WORKSPACE;
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': false,
            'explorerDates.customColors': globalCustomColors
        },
        workspaceConfigValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.customColors': workspaceCustomColors
        },
        workspaceFolderConfigValues: {
            'explorerDates.enableReporting': false,
            'explorerDates.customColors': workspaceFolderCustomColors
        },
        workspaceFolders,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.enableExportReporting'];
    delete harness.workspaceConfigStore['explorerDates.enableExportReporting'];
    delete harness.workspaceFolderConfigStore['explorerDates.enableExportReporting'];
    harness.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    assert.strictEqual(
        harness.vscode.workspace.workspaceFolders.length,
        workspaceFolders.length,
        'Web bundle: workspace folders should reflect multi-root workspace'
    );

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
        const webCommands = await harness.vscode.commands.getCommands(true);
        assert.ok(
            Array.isArray(webCommands) && webCommands.length > 0,
            'Web bundle: command registry should be queryable'
        );
    } finally {
        harness.restore();
    }

    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        false,
        'Web bundle'
    );
    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        true,
        'Web bundle'
    );
    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        false,
        'Web bundle'
    );

    const workbenchUpdate = findUpdate(
        harness.appliedUpdates,
        'workbench.colorCustomizations',
        'global'
    );
    assert.ok(workbenchUpdate, 'Web bundle: expected workbench.colorCustomizations update');
    assert.strictEqual(
        workbenchUpdate.target,
        'global',
        'Web bundle: workbench update should target global scope'
    );
    assert.strictEqual(
        workbenchUpdate.value['explorerDates.customColor.veryRecent'],
        workspaceFolderCustomColors.veryRecent,
        'Web bundle: custom colors should migrate to workbench schema'
    );

    expectCleanupAcrossScopes(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web bundle',
        ['global', 'workspace', 'workspaceFolder']
    );
    expectCleanupAcrossScopes(
        harness.appliedUpdates,
        'explorerDates.enableReporting',
        'Web bundle',
        ['global', 'workspace', 'workspaceFolder']
    );

    expectMigrationHistory(webContext, [
        'enableReporting→enableExportReporting (Global)',
        'enableReporting→enableExportReporting (Workspace)',
        'enableReporting→enableExportReporting (WorkspaceFolder)',
        'customColors→workbench.colorCustomizations',
        'deprecatedSettings→removed'
    ], 'Web bundle');
}

async function testKeepOldSettingsOptOut() {
    const workspaceFolders = getWorkspaceFolderDescriptors();
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true,
            'explorerDates.customColors': {
                veryRecent: '#34d399',
                recent: '#fbbf24',
                old: '#fb7185'
            }
        },
        workspaceConfig: {
            enableReporting: false,
            customColors: {
                veryRecent: '#3b82f6',
                recent: '#6366f1',
                old: '#ec4899'
            }
        },
        workspaceFolderConfig: {
            enableReporting: true,
            customColors: {
                veryRecent: '#f472b6',
                recent: '#facc15',
                old: '#a855f7'
            }
        },
        workspaceFolders
    });
    delete mockInstall.configValues['explorerDates.enableExportReporting'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Keep Old Settings';
    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectNoCleanup(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        'Keep old settings'
    );
    expectNoCleanup(
        mockInstall.appliedUpdates,
        'explorerDates.enableReporting',
        'Keep old settings'
    );

    const history = nodeContext.globalState._data['explorerDates.migrationHistory'] || [];
    const latest = history[history.length - 1];
    assert.ok(latest, 'Keep old settings: migration history should exist');
    assert.ok(
        !latest.migratedSettings.includes('deprecatedSettings→removed'),
        'Keep old settings: telemetry history should not record cleanup'
    );
}

async function testWebBundleOptOut() {
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.customColors': {
                veryRecent: '#3b82f6',
                recent: '#fbbf24',
                old: '#fb7185'
            }
        },
        workspaceConfigValues: {
            'explorerDates.enableReporting': false,
            'explorerDates.customColors': {
                veryRecent: '#2563eb',
                recent: '#7c3aed',
                old: '#db2777'
            }
        },
        workspaceFolderConfigValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.customColors': {
                veryRecent: '#f472b6',
                recent: '#facc15',
                old: '#a855f7'
            }
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.enableExportReporting'];
    delete harness.workspaceConfigStore['explorerDates.enableExportReporting'];
    delete harness.workspaceFolderConfigStore['explorerDates.enableExportReporting'];
    harness.vscode.window.showInformationMessage = async () => 'Keep Old Settings';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectNoCleanup(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web keep old settings'
    );
    expectNoCleanup(
        harness.appliedUpdates,
        'explorerDates.enableReporting',
        'Web keep old settings'
    );

    const history = webContext.globalState._data['explorerDates.migrationHistory'] || [];
    const latest = history[history.length - 1];
    assert.ok(latest, 'Web keep old settings: migration history should exist');
    assert.ok(
        !latest.migratedSettings.includes('deprecatedSettings→removed'),
        'Web keep old settings: telemetry history should not record cleanup when user opts out'
    );
}

async function testMigrationHistoryRetention() {
    const nodeContext = createExtensionContext();
    const seededHistory = Array.from({ length: 5 }, (_, index) => ({
        timestamp: new Date(Date.now() - (index + 1) * 1000).toISOString(),
        extensionVersion: `0.0.${index}`,
        migratedSettings: [`seed-${index}`]
    })).reverse();
    await nodeContext.globalState.update('explorerDates.migrationHistory', seededHistory);

    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true
        }
    });
    delete mockInstall.configValues['explorerDates.enableExportReporting'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    const history = nodeContext.globalState._data['explorerDates.migrationHistory'];
    assert.ok(Array.isArray(history), 'Telemetry history should exist after migration');
    assert.ok(history.length <= 5, 'Telemetry history should cap at five entries');
    const earliest = history[0];
    assert.notStrictEqual(
        earliest.migratedSettings[0],
        'seed-4',
        'Telemetry history should evict the oldest record when capping'
    );
    const latest = history[history.length - 1];
    assert.ok(
        latest.migratedSettings.includes('enableReporting→enableExportReporting (Global)'),
        'Telemetry history should record the latest migration details'
    );
}

async function testWebTelemetryHistoryRetention() {
    const seededHistory = Array.from({ length: 5 }, (_, index) => ({
        timestamp: new Date(Date.now() - (index + 1) * 2000).toISOString(),
        extensionVersion: `0.1.${index}`,
        migratedSettings: [`web-seed-${index}`]
    })).reverse();

    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': true
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.enableExportReporting'];
    harness.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });
    await webContext.globalState.update('explorerDates.migrationHistory', seededHistory);

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    const history = webContext.globalState._data['explorerDates.migrationHistory'];
    assert.ok(Array.isArray(history), 'Web telemetry: history should exist after migration');
    assert.ok(history.length <= 5, 'Web telemetry: history should cap at five entries');
    const firstEntry = history[0];
    assert.notStrictEqual(
        firstEntry.migratedSettings[0],
        'web-seed-4',
        'Web telemetry: oldest entry should be evicted after new migration'
    );
    const latest = history[history.length - 1];
    assert.ok(
        latest.migratedSettings.includes('enableReporting→enableExportReporting (Global)'),
        'Web telemetry: latest migration should be recorded'
    );
}

async function testNodeSkipsWhenExportReportingExists() {
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true,
            'explorerDates.enableExportReporting': true
        },
        workspaceConfig: {
            enableReporting: false,
            enableExportReporting: false
        },
        workspaceFolderConfig: {
            enableReporting: true,
            enableExportReporting: true
        }
    });
    mockInstall.vscode.window.showInformationMessage = async () => 'Ask Later';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    const exportUpdates = mockInstall.appliedUpdates.filter(
        (entry) => entry.key === 'explorerDates.enableExportReporting'
    );
    assert.strictEqual(
        exportUpdates.length,
        0,
        'Node skip: should not rewrite enableExportReporting when already defined'
    );

    const history = nodeContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.some((entry) => entry.startsWith('enableReporting→')),
            'Node skip: migration history should not record enableReporting transitions'
        );
    }
}

async function testWebSkipsWhenExportReportingExists() {
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.enableExportReporting': true
        },
        workspaceConfigValues: {
            'explorerDates.enableReporting': false,
            'explorerDates.enableExportReporting': false
        },
        workspaceFolderConfigValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.enableExportReporting': true
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    harness.vscode.window.showInformationMessage = async () => 'Ask Later';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    const exportUpdates = harness.appliedUpdates.filter(
        (entry) => entry.key === 'explorerDates.enableExportReporting'
    );
    assert.strictEqual(
        exportUpdates.length,
        0,
        'Web skip: should not rewrite enableExportReporting when already defined'
    );

    const history = webContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.some((entry) => entry.startsWith('enableReporting→')),
            'Web skip: migration history should not record enableReporting transitions'
        );
    }
}

async function testNodePartialExportSkip() {
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true
        },
        workspaceConfig: {
            enableReporting: false,
            enableExportReporting: false
        },
        workspaceFolderConfig: {
            enableReporting: true
        }
    });
    delete mockInstall.configValues['explorerDates.enableExportReporting'];
    delete mockInstall.workspaceFolderConfigValues?.['explorerDates.enableExportReporting'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        true,
        'Node partial skip'
    );
    expectNoUpdate(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        'Node partial skip'
    );
    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        true,
        'Node partial skip'
    );

    expectMigrationHistoryScopes(
        nodeContext,
        ['Global', 'WorkspaceFolder'],
        'Node partial skip'
    );
}

async function testNodeWorkspaceFolderPartialExportSkip() {
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({
        config: {
            'explorerDates.enableReporting': true
        },
        workspaceConfig: {
            enableReporting: false
        },
        workspaceFolderConfig: {
            enableReporting: true,
            enableExportReporting: true
        }
    });
    delete mockInstall.configValues['explorerDates.enableExportReporting'];
    delete mockInstall.workspaceConfigValues?.['explorerDates.enableExportReporting'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        true,
        'Node folder partial skip'
    );
    expectUpdateValue(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        false,
        'Node folder partial skip'
    );
    expectNoUpdate(
        mockInstall.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        'Node folder partial skip'
    );

    expectMigrationHistoryScopes(
        nodeContext,
        ['Global', 'Workspace'],
        'Node folder partial skip'
    );
}

async function testWebPartialExportSkip() {
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': true
        },
        workspaceConfigValues: {
            'explorerDates.enableReporting': false,
            'explorerDates.enableExportReporting': false
        },
        workspaceFolderConfigValues: {
            'explorerDates.enableReporting': true
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.enableExportReporting'];
    delete harness.workspaceFolderConfigStore['explorerDates.enableExportReporting'];
    harness.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        true,
        'Web partial skip'
    );
    expectNoUpdate(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        'Web partial skip'
    );
    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        true,
        'Web partial skip'
    );

    expectMigrationHistoryScopes(
        webContext,
        ['Global', 'WorkspaceFolder'],
        'Web partial skip'
    );
}

async function testWebWorkspaceFolderPartialExportSkip() {
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.enableReporting': true
        },
        workspaceConfigValues: {
            'explorerDates.enableReporting': false
        },
        workspaceFolderConfigValues: {
            'explorerDates.enableReporting': true,
            'explorerDates.enableExportReporting': true
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.enableExportReporting'];
    delete harness.workspaceConfigStore['explorerDates.enableExportReporting'];
    harness.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'global',
        true,
        'Web folder partial skip'
    );
    expectUpdateValue(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspace',
        false,
        'Web folder partial skip'
    );
    expectNoUpdate(
        harness.appliedUpdates,
        'explorerDates.enableExportReporting',
        'workspaceFolder',
        'Web folder partial skip'
    );

    expectMigrationHistoryScopes(
        webContext,
        ['Global', 'Workspace'],
        'Web folder partial skip'
    );
}

async function testNodeCustomColorNoOp() {
    const nodeContext = createExtensionContext();
    const customizations = {
        'explorerDates.customColor.veryRecent': '#10b981',
        'explorerDates.customColor.recent': '#fbbf24',
        'explorerDates.customColor.old': '#ef4444'
    };
    const mockInstall = createTestMock({
        config: {
            'explorerDates.customColors': {
                veryRecent: '#22d3ee',
                recent: '#a855f7',
                old: '#f97316'
            },
            'workbench.colorCustomizations': customizations
        }
    });
    mockInstall.vscode.window.showInformationMessage = async () => 'Ask Later';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectNoUpdate(
        mockInstall.appliedUpdates,
        'workbench.colorCustomizations',
        undefined,
        'Node custom color no-op'
    );
    expectNoCleanup(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        'Node custom color no-op'
    );
    const history = nodeContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Node custom color no-op: migration history should not record color move'
        );
    }
}

async function testWebCustomColorNoOp() {
    const customizations = {
        'explorerDates.customColor.veryRecent': '#f97316',
        'explorerDates.customColor.recent': '#facc15',
        'explorerDates.customColor.old': '#f472b6'
    };
    const harness = createWebVscodeMock({
        configValues: {
            'explorerDates.customColors': {
                veryRecent: '#3b82f6',
                recent: '#6366f1',
                old: '#312e81'
            },
            'workbench.colorCustomizations': customizations
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    harness.vscode.window.showInformationMessage = async () => 'Ask Later';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectNoUpdate(
        harness.appliedUpdates,
        'workbench.colorCustomizations',
        undefined,
        'Web custom color no-op'
    );
    expectNoCleanup(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web custom color no-op'
    );
    const history = webContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Web custom color no-op: migration history should not record color move'
        );
    }
}

async function testNodeWorkspacePaletteNoOp() {
    const nodeContext = createExtensionContext();
    const workspacePalette = {
        'explorerDates.customColor.veryRecent': '#eab308',
        'explorerDates.customColor.recent': '#d946ef',
        'explorerDates.customColor.old': '#0ea5e9'
    };
    const mockInstall = createTestMock({
        workspaceConfig: {
            customColors: {
                veryRecent: '#fde047',
                recent: '#fb7185',
                old: '#22d3ee'
            },
            'workbench.colorCustomizations': workspacePalette
        }
    });
    delete mockInstall.configValues['explorerDates.customColors'];
    delete mockInstall.configValues['workbench.colorCustomizations'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Skip Cleanup';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectNoUpdate(
        mockInstall.appliedUpdates,
        'workbench.colorCustomizations',
        'workspace',
        'Node workspace palette no-op'
    );
    expectNoCleanup(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        'Node workspace palette no-op'
    );
    const history = nodeContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Node workspace palette no-op: migration history should not record color move'
        );
    }
}

async function testWebWorkspacePaletteNoOp() {
    const workspacePalette = {
        'explorerDates.customColor.veryRecent': '#22d3ee',
        'explorerDates.customColor.recent': '#a855f7',
        'explorerDates.customColor.old': '#f97316'
    };
    const harness = createWebVscodeMock({
        workspaceConfigValues: {
            'explorerDates.customColors': {
                veryRecent: '#fdee0a',
                recent: '#fb923c',
                old: '#1d4ed8'
            },
            'workbench.colorCustomizations': workspacePalette
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.customColors'];
    delete harness.configStore['workbench.colorCustomizations'];
    harness.vscode.window.showInformationMessage = async () => 'Skip Cleanup';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectNoUpdate(
        harness.appliedUpdates,
        'workbench.colorCustomizations',
        'workspace',
        'Web workspace palette no-op'
    );
    expectNoCleanup(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web workspace palette no-op'
    );
    const history = webContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Web workspace palette no-op: migration history should not record color move'
        );
    }
}

async function testNodeWorkspaceFolderPaletteNoOp() {
    const nodeContext = createExtensionContext();
    const workspaceFolders = getWorkspaceFolderDescriptors();
    const folderPalette = {
        'explorerDates.customColor.veryRecent': '#22c55e',
        'explorerDates.customColor.recent': '#a855f7',
        'explorerDates.customColor.old': '#f97316'
    };
    const mockInstall = createTestMock({
        workspaceFolderConfig: {
            customColors: {
                veryRecent: '#22c55e',
                recent: '#a855f7',
                old: '#f97316'
            },
            'workbench.colorCustomizations': folderPalette
        },
        workspaceFolders
    });
    delete mockInstall.configValues['explorerDates.customColors'];
    delete mockInstall.workspaceConfigValues?.['explorerDates.customColors'];
    delete mockInstall.configValues['workbench.colorCustomizations'];
    delete mockInstall.workspaceConfigValues?.['workbench.colorCustomizations'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Keep Old Settings';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    expectNoUpdate(
        mockInstall.appliedUpdates,
        'workbench.colorCustomizations',
        'workspaceFolder',
        'Node workspace folder palette no-op'
    );
    expectNoCleanup(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        'Node workspace folder palette no-op'
    );
    const history = nodeContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Node workspace folder palette no-op: migration history should not record color move'
        );
        assert.ok(
            !latest.migratedSettings.includes('deprecatedSettings→removed'),
            'Node workspace folder palette no-op: cleanup should remain opt-out'
        );
    }
}

async function testWebWorkspaceFolderPaletteNoOp() {
    const folderPalette = {
        'explorerDates.customColor.veryRecent': '#fbbf24',
        'explorerDates.customColor.recent': '#ea580c',
        'explorerDates.customColor.old': '#be123c'
    };
    const harness = createWebVscodeMock({
        workspaceFolderConfigValues: {
            'explorerDates.customColors': {
                veryRecent: '#fbbf24',
                recent: '#ea580c',
                old: '#be123c'
            },
            'workbench.colorCustomizations': folderPalette
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.customColors'];
    delete harness.workspaceConfigStore['explorerDates.customColors'];
    delete harness.configStore['workbench.colorCustomizations'];
    delete harness.workspaceConfigStore['workbench.colorCustomizations'];
    harness.vscode.window.showInformationMessage = async () => 'Keep Old Settings';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    expectNoUpdate(
        harness.appliedUpdates,
        'workbench.colorCustomizations',
        'workspaceFolder',
        'Web workspace folder palette no-op'
    );
    expectNoCleanup(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web workspace folder palette no-op'
    );
    const history = webContext.globalState._data['explorerDates.migrationHistory'] || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        assert.ok(
            !latest.migratedSettings.includes('customColors→workbench.colorCustomizations'),
            'Web workspace folder palette no-op: migration history should not record color move'
        );
        assert.ok(
            !latest.migratedSettings.includes('deprecatedSettings→removed'),
            'Web workspace folder palette no-op: cleanup should remain opt-out'
        );
    }
}

async function testNodeWorkspaceFolderPaletteMigration() {
    const nodeContext = createExtensionContext();
    const workspaceFolders = getWorkspaceFolderDescriptors();
    const folderCustomColors = {
        veryRecent: '#1d4ed8',
        recent: '#60a5fa',
        old: '#a78bfa'
    };
    const mockInstall = createTestMock({
        workspaceFolderConfig: {
            customColors: folderCustomColors
        },
        workspaceFolders
    });
    delete mockInstall.configValues['explorerDates.customColors'];
    delete mockInstall.workspaceConfigValues?.['explorerDates.customColors'];
    delete mockInstall.configValues['workbench.colorCustomizations'];
    delete mockInstall.workspaceConfigValues?.['workbench.colorCustomizations'];
    mockInstall.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    try {
        await activateExtension(extensionEntryPath, nodeContext);
    } finally {
        mockInstall.dispose();
    }

    const expectedPalette = {
        'explorerDates.customColor.veryRecent': folderCustomColors.veryRecent,
        'explorerDates.customColor.recent': folderCustomColors.recent,
        'explorerDates.customColor.old': folderCustomColors.old
    };

    expectUpdateValue(
        mockInstall.appliedUpdates,
        'workbench.colorCustomizations',
        'global',
        expectedPalette,
        'Node workspace folder palette migration'
    );
    expectCleanupAcrossScopes(
        mockInstall.appliedUpdates,
        'explorerDates.customColors',
        'Node workspace folder palette migration',
        ['global', 'workspace', 'workspaceFolder']
    );

    expectTelemetryIncludes(
        nodeContext,
        ['customColors→workbench.colorCustomizations', 'deprecatedSettings→removed'],
        'Node workspace folder palette migration'
    );
    expectMigrationHistoryScopes(nodeContext, [], 'Node workspace folder palette migration');
}

async function testWebWorkspaceFolderPaletteMigration() {
    const folderCustomColors = {
        veryRecent: '#fb7185',
        recent: '#f97316',
        old: '#facc15'
    };
    const harness = createWebVscodeMock({
        workspaceFolderConfigValues: {
            'explorerDates.customColors': folderCustomColors
        },
        workspaceFolders: MULTI_FOLDER_WORKSPACE,
        extensionPath: workspaceRoot
    });
    delete harness.configStore['explorerDates.customColors'];
    delete harness.workspaceConfigStore['explorerDates.customColors'];
    delete harness.configStore['workbench.colorCustomizations'];
    delete harness.workspaceConfigStore['workbench.colorCustomizations'];
    harness.vscode.window.showInformationMessage = async () => 'Clean Up Now';

    const webContext = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await activateExtension(webEntryPath, webContext);
    } finally {
        harness.restore();
    }

    const expectedPalette = {
        'explorerDates.customColor.veryRecent': folderCustomColors.veryRecent,
        'explorerDates.customColor.recent': folderCustomColors.recent,
        'explorerDates.customColor.old': folderCustomColors.old
    };

    expectUpdateValue(
        harness.appliedUpdates,
        'workbench.colorCustomizations',
        'global',
        expectedPalette,
        'Web workspace folder palette migration'
    );
    expectCleanupAcrossScopes(
        harness.appliedUpdates,
        'explorerDates.customColors',
        'Web workspace folder palette migration',
        ['global', 'workspace', 'workspaceFolder']
    );

    expectTelemetryIncludes(
        webContext,
        ['customColors→workbench.colorCustomizations', 'deprecatedSettings→removed'],
        'Web workspace folder palette migration'
    );
    expectMigrationHistoryScopes(webContext, [], 'Web workspace folder palette migration');
}

async function main() {
    const suites = [
        ['Node bundle migration', testNodeBundleMigration],
        ['Node bundle migration (dist chunks)', testNodeBundleMigrationDist],
        ['Web bundle migration', testWebBundleMigration],
        ['Keep old settings opt-out', testKeepOldSettingsOptOut],
        ['Web keep old settings opt-out', testWebBundleOptOut],
        ['Telemetry history retention', testMigrationHistoryRetention],
        ['Web telemetry history retention', testWebTelemetryHistoryRetention],
        ['Node skip when enableExportReporting exists', testNodeSkipsWhenExportReportingExists],
        ['Web skip when enableExportReporting exists', testWebSkipsWhenExportReportingExists],
        ['Node partial export skip', testNodePartialExportSkip],
        ['Node folder partial export skip', testNodeWorkspaceFolderPartialExportSkip],
        ['Web partial export skip', testWebPartialExportSkip],
        ['Web folder partial export skip', testWebWorkspaceFolderPartialExportSkip],
        ['Node custom color no-op', testNodeCustomColorNoOp],
        ['Web custom color no-op', testWebCustomColorNoOp],
        ['Node workspace palette no-op', testNodeWorkspacePaletteNoOp],
        ['Web workspace palette no-op', testWebWorkspacePaletteNoOp],
        ['Node workspace folder palette no-op', testNodeWorkspaceFolderPaletteNoOp],
        ['Web workspace folder palette no-op', testWebWorkspaceFolderPaletteNoOp],
        ['Node workspace folder palette migration', testNodeWorkspaceFolderPaletteMigration],
        ['Web workspace folder palette migration', testWebWorkspaceFolderPaletteMigration]
    ];
    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ Settings migration tests passed');
    } catch (error) {
        console.error('❌ Settings migration tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => {
        process.exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0;
        scheduleExit();
    });
}
