#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const { createTestMock } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

scheduleExit(120000);

async function runTests() {
    const mock = createTestMock({
        config: {
            'explorerDates.performanceMode': false
        }
    });

    const originalStat = fs.promises.stat;
    const previousForce = process.env.EXPLORER_DATES_FORCE_VSCODE_FS;

    try {
        fs.promises.stat = async () => {
            throw new Error('nodeFsUsed');
        };
        process.env.EXPLORER_DATES_FORCE_VSCODE_FS = '0';
        delete require.cache[require.resolve('../src/filesystem/FileSystemAdapter')];

        const { FileSystemAdapter } = require('../src/filesystem/FileSystemAdapter');
        const adapter = new FileSystemAdapter();
        const remoteUri = {
            scheme: 'vscode-remote',
            path: '/home/remote/project/file.txt',
            fsPath: '/home/remote/project/file.txt'
        };

        const stat = await adapter.stat(remoteUri);
        assert.ok(stat, 'Expected stat result for vscode-remote URI');
        assert.ok(stat.mtime instanceof Date, 'Expected mtime to be a Date instance');
        console.log('✅ vscode-remote URI uses workspace.fs stat');
    } finally {
        fs.promises.stat = originalStat;
        if (previousForce === undefined) {
            delete process.env.EXPLORER_DATES_FORCE_VSCODE_FS;
        } else {
            process.env.EXPLORER_DATES_FORCE_VSCODE_FS = previousForce;
        }
        mock.dispose();
    }
}

runTests().catch((error) => {
    console.error('filesystem remote URI test failed', error);
    process.exitCode = 1;
}).finally(() => {
    scheduleExit(0, process.exitCode ?? 0);
});
