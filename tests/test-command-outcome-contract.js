#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const outcomes = require('../src/utils/commandOutcome');

function logger() {
    return { info() {}, warn() {}, errorCalls: [], error(...args) { this.errorCalls.push(args); }, show() {} };
}

async function main() {
    const mock = createTestMock();
    const diagnostics = require('../src/utils/webDiagnostics');
    const originalRecord = diagnostics.recordCommandResult;
    const recorded = [];
    diagnostics.recordCommandResult = (...args) => recorded.push(args);
    const { fileSystem } = require('../src/filesystem/FileSystemAdapter');
    const originalStat = fileSystem.stat;
    const log = logger();
    try {
        delete require.cache[require.resolve('../src/commands/coreCommands')];
        const { registerCoreCommands } = require('../src/commands/coreCommands');
        registerCoreCommands({ context: createExtensionContext(), fileDateProvider: null, logger: log, l10n: null });
        const uri = VSCodeUri.file(path.join(mock.vscode.workspace.workspaceFolders[0].uri.fsPath, 'fixture.txt'));

        fileSystem.stat = async () => ({ size: 2048, mtime: new Date('2026-07-19T00:00:00Z'), ctime: null });
        await mock.vscode.commands.executeCommand('explorerDates.showFileDetails', uri);
        assert.strictEqual(recorded.at(-1)[1], true);
        assert.strictEqual(recorded.at(-1)[3], outcomes.OUTCOME_CATEGORIES.BEHAVIORAL_SUCCESS);
        assert.strictEqual(mock.errorLog.length, 0);

        mock.vscode.window.activeTextEditor = null;
        await mock.vscode.commands.executeCommand('explorerDates.showFileDetails');
        assert.strictEqual(recorded.at(-1)[3], outcomes.OUTCOME_CATEGORIES.EXPECTED_EMPTY_RESULT);

        const failure = Object.assign(new Error('provider unavailable'), { code: 'EIO' });
        fileSystem.stat = async () => { throw failure; };
        await assert.rejects(
            mock.vscode.commands.executeCommand('explorerDates.showFileDetails', uri),
            error => error === failure
        );
        const failureRecords = recorded.filter(entry => entry[3] === outcomes.OUTCOME_CATEGORIES.HANDLED_COMMAND_FAILURE);
        assert.strictEqual(failureRecords.length, 1, 'handled failure must produce one result record');
        assert.strictEqual(failureRecords[0][1], false);
        assert.strictEqual(log.errorCalls.length, 1);
        assert.strictEqual(mock.errorLog.length, 1);

        fileSystem.stat = async () => ({ size: 1, mtime: Date.now(), ctime: null });
        await mock.vscode.commands.executeCommand('explorerDates.showFileDetails', uri);
        assert.strictEqual(recorded.at(-1)[3], outcomes.OUTCOME_CATEGORIES.BEHAVIORAL_SUCCESS);
        assert.strictEqual(mock.infoLog.length > 0, true);
        console.log('✅ command outcome contract tests passed');
    } finally {
        fileSystem.stat = originalStat;
        diagnostics.recordCommandResult = originalRecord;
        mock.dispose();
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
