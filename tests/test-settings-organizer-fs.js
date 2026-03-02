#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');

const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /Failed to sort Explorer Dates file .*not valid JSON/,
    /Failed to sort Explorer Dates file .*Simulated write failure/,
    /Failed to inspect Explorer Dates file .*Simulated read failure/
]);

async function testCollectExplorerFilesHandlesReadDirError() {
    const nodeContext = createExtensionContext();
    const workspaceFolders = [{ path: path.join(__dirname, 'fixtures', 'sample-workspace'), name: 'sample' }];
    const mock = createTestMock({ config: {}, workspaceFolders });

    // Simulate readDirectory errors (permission or unexpected error)
    const fsApi = mock.vscode.workspace.fs;
    const originalRead = fsApi.readDirectory.bind(fsApi);
    fsApi.readDirectory = async (uri) => { void uri;
        const err = new Error('Simulated FS permission error');
        err.code = 'EACCES';
        throw err;
    };

    try {
        // Require after mock installed so 'vscode' is intercepted by the test harness
    const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
    const organizer = new SettingsOrganizer(nodeContext);
    const files = await organizer._collectExplorerFiles();
    assert.ok(Array.isArray(files) && files.length === 0, 'Should return empty list when readDirectory errors');
    } finally {
        // restore
        fsApi.readDirectory = originalRead;
        mock.dispose();
    }
}

async function testSortJsonFileMalformedJsonReturnsFalse() {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // Create a fake file URI
    const fakeFile = VSCodeUri.file('/virtual/.explorer-dates-bad.json');

    // Make readFile return malformed JSON
    const fsApi = mock.vscode.workspace.fs;
    const originalReadFile = fsApi.readFile.bind(fsApi);
    fsApi.readFile = async (uri) => { void uri; return Buffer.from('not-a-json'); };

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const res = await organizer._sortJsonFile(fakeFile);
        assert.strictEqual(res, false, 'Malformed JSON should result in false and not throw');
    } finally {
        fsApi.readFile = originalReadFile;
        mock.dispose();
    }
}

async function testSortJsonFileWriteErrorHandled() {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    const fakeFile = VSCodeUri.file('/virtual/.explorer-dates-ok.json');

    // readFile returns a JSON object that would be sorted
    const fsApi = mock.vscode.workspace.fs;
    const originalReadFile = fsApi.readFile.bind(fsApi);
    const originalWriteFile = fsApi.writeFile.bind(fsApi);

    fsApi.readFile = async (uri) => { void uri; return Buffer.from(JSON.stringify({ b: 2, a: 1 })); };
    fsApi.writeFile = async (uri, buf) => { void uri; void buf;
        const err = new Error('Simulated write failure');
        err.code = 'EACCES';
        throw err;
    };

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const res = await organizer._sortJsonFile(fakeFile);
        assert.strictEqual(res, false, 'Write errors should be handled and return false');
    } finally {
        fsApi.readFile = originalReadFile;
        fsApi.writeFile = originalWriteFile;
        mock.dispose();
    }
}

async function testNeedsJsonSortHandlesReadError() {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    const fakeFile = VSCodeUri.file('/virtual/.explorer-dates-need.json');
    const fsApi = mock.vscode.workspace.fs;
    const originalReadFile = fsApi.readFile.bind(fsApi);

    fsApi.readFile = async (uri) => { void uri;
        const err = new Error('Simulated read failure');
        err.code = 'EACCES';
        throw err;
    };

    try {
        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const organizer = new SettingsOrganizer(nodeContext);
        const res = await organizer._needsJsonSort(fakeFile);
        assert.strictEqual(res, false, 'Read errors should result in false for needsJsonSort');
    } finally {
        fsApi.readFile = originalReadFile;
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['Collect explorer files handles readDirectory errors', testCollectExplorerFilesHandlesReadDirError],
        ['_sortJsonFile handles malformed JSON', testSortJsonFileMalformedJsonReturnsFalse],
        ['_sortJsonFile handles writeFile errors', testSortJsonFileWriteErrorHandled],
        ['_needsJsonSort handles readFile errors', testNeedsJsonSortHandlesReadError]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ SettingsOrganizer FS error-path tests passed');
    } catch (error) {
        console.error('❌ SettingsOrganizer FS tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
