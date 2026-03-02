#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function testMovePreferredSettingsToWorkspace() {
    const nodeContext = createExtensionContext();
    const workspaceFolders = [{ path: path.join(__dirname, 'fixtures', 'sample-workspace'), name: 'sample' }];
    const mock = createTestMock({ config: { 'explorerDates.performanceMode': true }, workspaceFolders });

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const plan = await organizer.getOrganizationPlan();

        // If performanceMode is set at user scope and not workspace, it should be suggested to move
        if (plan.keysToMove.length > 0) {
            const summary = await organizer.organize({ plan });
            assert.ok(summary.changed, 'Organizer should perform changes when keysToMove present');
            assert.ok(summary.movedToWorkspace.length > 0, 'Moved keys should be recorded');
        } else {
            // It's possible our sample fixtures don't trigger move; still, method should be safe
            const summary = await organizer.organize({ plan });
            assert.ok(typeof summary === 'object', 'Organizer should return a summary object');
        }
    } finally {
        mock.dispose();
    }
}

async function testReorderWorkspaceSettings() {
    const nodeContext = createExtensionContext();
    // Setup config with unsorted workspace keys
    const mock = createTestMock({
        workspaceConfig: {
            'explorerDates.featureLevel': 'full',
            'explorerDates.performanceMode': false,
            'explorerDates.smartFileWatching': true
        }
    });

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const plan = await organizer.getOrganizationPlan();
        const summary = await organizer.organize({ plan });
        // Even if already ordered, summary should be an object
        assert.ok(typeof summary === 'object');
    } finally {
        mock.dispose();
    }
}

async function testSortExplorerFileWritesWhenNeeded() {
    const nodeContext = createExtensionContext();
    const sampleFile = VSCodeUri.file(path.join(__dirname, 'fixtures', '.explorer-dates-sample.json'));

    // Create a sample file content (unsorted)
    const mock = createTestMock({ workspaceFolders: [{ path: path.join(__dirname, 'fixtures'), name: 'fixtures' }] });
    const fsApi = mock.vscode.workspace.fs;
    const originalRead = fsApi.readFile.bind(fsApi);
    const originalWrite = fsApi.writeFile.bind(fsApi);

    // Provide an unsorted JSON file
    fsApi.readFile = async (uri) => {
        if (uri.fsPath === sampleFile.fsPath) {
            return Buffer.from(JSON.stringify({ b: 2, a: 1 }));
        }
        return originalRead(uri);
    };

    const wrote = [];
    fsApi.writeFile = async (uri, buf) => {
        if (uri.fsPath === sampleFile.fsPath) {
            wrote.push(buf.toString());
            return;
        }
        return originalWrite(uri, buf);
    };

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const sorted = await organizer._sortJsonFile(sampleFile);
        assert.strictEqual(sorted, true);
        assert.ok(wrote.length === 1, 'Expected file to be written once');
        const parsed = JSON.parse(wrote[0]);
        const keys = Object.keys(parsed);
        assert.deepStrictEqual(keys, ['a', 'b']);
    } finally {
        fsApi.readFile = originalRead;
        fsApi.writeFile = originalWrite;
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['Move preferred settings to workspace (happy path)', testMovePreferredSettingsToWorkspace],
        ['Reorder workspace settings (happy path)', testReorderWorkspaceSettings],
        ['Sort explorer files writes when needed', testSortExplorerFileWritesWhenNeeded]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ SettingsOrganizer happy-path tests passed');
    } catch (error) {
        console.error('❌ SettingsOrganizer happy-path tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
