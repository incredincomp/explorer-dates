#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const mockHelpers = require('./helpers/mockVscode');
const mockInstall = mockHelpers.createMockVscode();
const { createExtensionContext, createMockVscode } = mockHelpers;
const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
const { TeamConfigPersistenceManager } = require('../src/teamConfigPersistence');

async function disposeContext(context) {
    if (!context?.subscriptions) return;
    for (const disposable of context.subscriptions) {
        try {
            disposable?.dispose?.();
        } catch {
            // Ignore errors from disposals in tests
        }
    }
    context.subscriptions.length = 0;
}

async function testPresetAutoSuggestion() {
    // Create isolated mock for this test to prevent state leaks
    const testMock = createMockVscode({
        config: {
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.performanceMode': false
        }
    });
    
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);

    const { vscode, configValues } = testMock;
    const originalFindFiles = vscode.workspace.findFiles;
    const originalRemoteName = vscode.env.remoteName;
    
    // Simulate a large local workspace (15k files, desktop)
    vscode.workspace.findFiles = async () => {
        const files = new Array(15000);
        for (let i = 0; i < files.length; i += 1) {
            files[i] = testMock.VSCodeUri.file(path.join(testMock.sampleWorkspace, `file-${i}.ts`));
        }
        return files;
    };
    vscode.env.remoteName = undefined;

    try {
        await runtimeManager.checkAutoSuggestion();
    } finally {
        vscode.workspace.findFiles = originalFindFiles;
        vscode.env.remoteName = originalRemoteName;
        testMock.dispose();
    }

    // Balanced preset disables reporting/API and enables performance mode
    assert.strictEqual(
        configValues['explorerDates.enableExportReporting'],
        false,
        'Balanced preset should disable export reporting'
    );
    assert.strictEqual(
        configValues['explorerDates.enableExtensionApi'],
        false,
        'Balanced preset should disable extension API'
    );
    assert.strictEqual(
        configValues['explorerDates.performanceMode'],
        true,
        'Balanced preset should enable performance mode'
    );

    const history = context.globalState.get('explorerDates.suggestionHistory', {});
    const historyEntries = Object.values(history);
    assert.strictEqual(historyEntries.length, 1, 'Suggestion history should capture one record');

    const record = historyEntries[0];
    assert.strictEqual(record.profileDetected, 'balanced');
    assert.strictEqual(record.presetId, 'balanced');
    assert.strictEqual(record.accepted, true, 'Auto suggestion should mark the preset as accepted');
    assert.ok(
        record.fileCountAtSuggestion >= 15000,
        'Suggestion record should capture simulated file count'
    );

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ Runtime preset auto-suggestion test passed');
}

async function testTeamConfigScaffold() {
    // Create completely fresh mock for this test to prevent state leaks from previous test
    const testMock = createMockVscode({
        config: {
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableExportReporting': false
        }
    });
    
    try {
        // Scenario 1: no team config present - mock should explicitly return no workspace
        const context = createExtensionContext();
        const manager = new TeamConfigPersistenceManager(context);
        
        // Explicitly mock the file check to return false for no team config scenario
        manager._fileExists = async () => false;
        
        const result = await manager.validateTeamConfiguration();
        assert.strictEqual(result.hasTeamConfig, false, 'Should report no team config when file is absent');
        assert.strictEqual(result.valid, true, 'Missing team config should still be considered valid');

        // Scenario 2: conflict flow with scaffolded hooks
    const contextWithTeam = createExtensionContext();
    const managerWithTeam = new TeamConfigPersistenceManager(contextWithTeam);
    managerWithTeam._fileExists = async () => true;
    managerWithTeam._loadTeamConfiguration = async () => ({ profiles: {} });

    let warningShown = false;
    managerWithTeam._showTeamConflictWarning = async () => {
        warningShown = true;
    };
    managerWithTeam._detectConfigConflicts = async () => ([
        { key: 'explorerDates.enableWorkspaceTemplates', expected: true, actual: false }
    ]);

    const conflictResult = await managerWithTeam.validateTeamConfiguration();
    assert.strictEqual(conflictResult.hasTeamConfig, true, 'Should report team config when file exists');
    assert.strictEqual(conflictResult.valid, false, 'Conflicts should mark result as invalid');
    assert.strictEqual(conflictResult.conflicts.length, 1, 'Expected one synthetic conflict');
    assert.ok(warningShown, 'Conflict warning flow should execute when conflicts are detected');

    await disposeContext(context);
    await disposeContext(contextWithTeam);
    console.log('✅ Team configuration scaffold test passed');
    } finally {
        testMock.dispose();
    }
}

async function main() {
    try {
        await testPresetAutoSuggestion();
        await testTeamConfigScaffold();
        console.log('🎯 Runtime configuration tests completed');
    } catch (error) {
        console.error('❌ Runtime configuration tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main();
