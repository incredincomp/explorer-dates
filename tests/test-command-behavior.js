#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { scheduleExit } = require('./helpers/forceExit');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');

function createLogger() {
    return {
        info() {},
        warn() {},
        error() {},
        show() {}
    };
}

async function testCoreCommands() {
    const mock = createTestMock();
    const context = createExtensionContext();

    let previewSettings = undefined;
    let logsOpened = 0;

    const fileDateProvider = {
        getMetrics() {
            return {
                totalDecorations: 1,
                cacheSize: 2,
                cacheHits: 3,
                cacheMisses: 4,
                cacheHitRate: '42%',
                errors: 0,
                advancedCache: {
                    memoryItems: 1,
                    memoryUsage: 1024 * 1024,
                    memoryHitRate: '50%',
                    diskHitRate: '25%',
                    evictions: 0
                },
                batchProcessor: {
                    queueLength: 1,
                    isProcessing: false,
                    averageBatchTime: 10
                }
            };
        },
        clearAllCaches() {},
        refreshAll() {},
        applyPreviewSettings(settings) {
            previewSettings = settings;
        }
    };

    const logger = createLogger();
    logger.show = () => { logsOpened += 1; };

    process.env.VSCODE_WEB = 'false';
    delete require.cache[require.resolve('../src/commands/coreCommands')];
    const { registerCoreCommands } = require('../src/commands/coreCommands');

    registerCoreCommands({ context, fileDateProvider, logger, l10n: null });

    await mock.vscode.commands.executeCommand('explorerDates.showMetrics');
    assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('Explorer Dates Metrics')),
        'Expected metrics information message');

    await mock.vscode.commands.executeCommand('explorerDates.openLogs');
    assert.strictEqual(logsOpened, 1, 'Expected logger.show to be called');

    await mock.vscode.commands.executeCommand('explorerDates.resetToDefaults');
    const resetKeys = mock.appliedUpdates
        .filter((entry) => ['explorerDates.highContrastMode', 'explorerDates.badgePriority', 'explorerDates.accessibilityMode'].includes(entry.key))
        .map((entry) => entry.key);
    assert.strictEqual(new Set(resetKeys).size, 3, 'Expected default settings to be reset');

    await mock.vscode.commands.executeCommand('explorerDates.toggleFadeOldFiles');
    assert.strictEqual(mock.configValues['explorerDates.fadeOldFiles'], true, 'Expected fadeOldFiles to toggle on');

    await mock.vscode.commands.executeCommand('explorerDates.previewConfiguration', { colorScheme: 'custom' });
    assert.deepStrictEqual(previewSettings, { colorScheme: 'custom' }, 'Expected preview settings applied');

    await mock.vscode.commands.executeCommand('explorerDates.clearPreview');
    assert.strictEqual(previewSettings, null, 'Expected preview settings cleared');

    const detailsUri = VSCodeUri.file(path.join(mock.vscode.workspace.workspaceFolders[0].uri.fsPath, 'package.json'));
    await mock.vscode.commands.executeCommand('explorerDates.showFileDetails', detailsUri);
    assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('File: package.json')),
        'Show File Details must use the shared formatter without a provider-private method');

    mock.dispose();
}

async function testMigrationCommands() {
    const mock = createTestMock();
    const context = createExtensionContext();

    const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
    const originalOrganize = SettingsOrganizer.prototype.organize;
    SettingsOrganizer.prototype.organize = async () => ({
        movedToWorkspace: [],
        sortedFiles: [],
        reorderedWorkspace: false
    });

    let migrateCalled = false;
    let validateCalled = false;
    let cleanupCalled = false;

    const migrationManager = {
        async migrateAllSettings() {
            migrateCalled = true;
            return ['migrated.setting'];
        },
        async autoOrganizeSettingsIfNeeded() {
            return { changed: true };
        },
        async validateConfiguration() {
            validateCalled = true;
            return [];
        },
        async cleanupDeprecatedSettings() {
            cleanupCalled = true;
            return true;
        },
        getMigrationHistory() {
            return [{
                timestamp: Date.now(),
                extensionVersion: '1.3.1',
                migratedSettings: ['explorerDates.enableReporting→enableExportReporting (Global)']
            }];
        }
    };

    try {
        const { registerMigrationCommands } = require('../src/commands/migrationCommands');
        await registerMigrationCommands({
            context,
            logger: createLogger(),
            getSettingsMigrationManager: async () => migrationManager
        });

        await mock.vscode.commands.executeCommand('explorerDates.migrateSettings');
        assert.strictEqual(migrateCalled, true, 'Expected migrateAllSettings to run');

        await mock.vscode.commands.executeCommand('explorerDates.organizeSettings');
        assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('organized')),
            'Expected organizeSettings to show a summary');

        await mock.vscode.commands.executeCommand('explorerDates.validateConfiguration');
        assert.strictEqual(validateCalled, true, 'Expected validateConfiguration to run');
        assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('Configuration is valid')),
            'Expected validation success message');

        await mock.vscode.commands.executeCommand('explorerDates.cleanLegacySettings');
        assert.strictEqual(cleanupCalled, true, 'Expected cleanupDeprecatedSettings to run');

        await mock.vscode.commands.executeCommand('explorerDates.showMigrationHistory');
        assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('createWebviewPanel:Explorer Dates - Migration History')),
            'Expected migration history webview');

        await mock.vscode.commands.executeCommand('explorerDates.exportConfiguration');
        assert(mock.vscode.env.clipboard.value.includes('explorerDates.'),
            'Expected exported configuration in clipboard');

        await mock.vscode.commands.executeCommand('explorerDates.applyCustomColors');
        assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('showQuickPick:Copy to Clipboard')),
            'Expected applyCustomColors to use quick pick');
        assert(mock.vscode.env.clipboard.value.includes('workbench.colorCustomizations'),
            'Expected custom colors JSON on clipboard');
    } finally {
        SettingsOrganizer.prototype.organize = originalOrganize;
        mock.dispose();
    }
}

async function testOnboardingCommands() {
    const mock = createTestMock();
    const context = createExtensionContext();

    let tourCalled = 0;
    let quickSetupCalled = 0;
    let whatsNewCalled = 0;

    const { registerOnboardingCommands } = require('../src/commands/onboardingCommands');
    registerOnboardingCommands({
        context,
        logger: createLogger(),
        getOnboardingManager: async () => ({
            showFeatureTour() { tourCalled += 1; },
            showQuickSetupWizard() { quickSetupCalled += 1; },
            showWhatsNew() { whatsNewCalled += 1; }
        })
    });

    await mock.vscode.commands.executeCommand('explorerDates.showFeatureTour');
    await mock.vscode.commands.executeCommand('explorerDates.showQuickSetup');
    await mock.vscode.commands.executeCommand('explorerDates.showWhatsNew');

    assert.strictEqual(tourCalled, 1, 'Expected showFeatureTour to be invoked');
    assert.strictEqual(quickSetupCalled, 1, 'Expected showQuickSetupWizard to be invoked');
    assert.strictEqual(whatsNewCalled, 1, 'Expected showWhatsNew to be invoked');

    mock.dispose();
}

async function testGitCommandsDesktop() {
    const mock = createTestMock();
    const context = createExtensionContext();

    process.env.VSCODE_WEB = 'false';
    delete require.cache[require.resolve('../src/commands/coreCommands')];
    const { registerCoreCommands } = require('../src/commands/coreCommands');

    registerCoreCommands({ context, fileDateProvider: null, logger: createLogger(), l10n: null });

    const childProcess = require('child_process');
    const originalExec = childProcess.exec;
    childProcess.exec = (cmd, options, cb) => {
        setImmediate(() => cb(null, 'abc123 Test commit\n'));
    };

    const originalExecute = mock.vscode.commands.executeCommand;
    let gitOpenChangeCalled = false;
    mock.vscode.commands.executeCommand = async (commandId, ...args) => {
        if (commandId === 'git.openChange') {
            gitOpenChangeCalled = true;
            return true;
        }
        return originalExecute(commandId, ...args);
    };

    const workspaceFolder = mock.vscode.workspace.workspaceFolders?.[0];
    const sampleUri = VSCodeUri.file(path.join(workspaceFolder.uri.fsPath, 'package.json'));
    await mock.vscode.commands.executeCommand('explorerDates.showFileHistory', sampleUri);
    const foundHistory = await waitForInfoLog(
        mock,
        (msg) => typeof msg === 'string' && msg.includes('Recent commits for'),
        10
    );
    assert(foundHistory, 'Expected git history info message');

    await mock.vscode.commands.executeCommand('explorerDates.compareWithPrevious', sampleUri);
    assert.strictEqual(gitOpenChangeCalled, true, 'Expected git.openChange to be called');

    childProcess.exec = originalExec;
    mock.vscode.commands.executeCommand = originalExecute;
    mock.dispose();
}

async function waitForInfoLog(mock, predicate, attempts) {
    for (let i = 0; i < attempts; i += 1) {
        if (mock.infoLog.some(predicate)) {
            return true;
        }
        await new Promise((resolve) => setImmediate(resolve));
    }
    return false;
}

async function testGitCommandsWeb() {
    const mock = createTestMock();
    const context = createExtensionContext();

    process.env.VSCODE_WEB = 'true';
    delete require.cache[require.resolve('../src/commands/coreCommands')];
    const { registerCoreCommands } = require('../src/commands/coreCommands');

    registerCoreCommands({ context, fileDateProvider: null, logger: createLogger(), l10n: null });

    const workspaceFolder = mock.vscode.workspace.workspaceFolders?.[0];
    const sampleUri = VSCodeUri.file(path.join(workspaceFolder.uri.fsPath, 'package.json'));
    await mock.vscode.commands.executeCommand('explorerDates.showFileHistory', sampleUri);
    await mock.vscode.commands.executeCommand('explorerDates.compareWithPrevious', sampleUri);

    assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('Git history is unavailable')),
        'Expected web-only git history message');
    assert(mock.infoLog.some((msg) => typeof msg === 'string' && msg.includes('Git comparisons are unavailable')),
        'Expected web-only compare message');

    mock.dispose();
}

async function main() {
    await testCoreCommands();
    await testMigrationCommands();
    await testOnboardingCommands();
    await testGitCommandsDesktop();
    await testGitCommandsWeb();
    console.log('✅ Command behavior coverage complete');
}

main().then(() => scheduleExit(0, 0)).catch((error) => {
    console.error('❌ Command behavior tests failed:', error && error.message ? error.message : error);
    scheduleExit(0, 1);
});
