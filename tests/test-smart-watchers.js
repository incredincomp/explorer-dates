#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function verifySmartWatcherTargets() {
    const patternsCreated = [];
    const mockInstall = createTestMock({
        workspaceFolders: [{ uri: VSCodeUri.file('/tmp/project'), name: 'project' }],
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.smartWatcherMaxPatterns': 5
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    // Track watcher creation
    vscode.workspace.createFileSystemWatcher = (pattern) => {
        patternsCreated.push(pattern);
        const disposable = { dispose() {} };
        return {
            onDidChange() { return disposable; },
            onDidCreate() { return disposable; },
            onDidDelete() { return disposable; },
            dispose() {}
        };
    };

    // Stub folder read to include prioritized directories
    const fakeDirs = ['src', 'apps', 'tests', 'node_modules', '.git'].map((name) => ({
        name,
        isDirectory: () => true
    }));
    const provider = new FileDateDecorationProvider();
    provider._fileSystem.readdir = async () => fakeDirs;

    try {
        const requestId = ++provider._watcherSetupToken;
        await provider._initializeSmartWatchers('test-smart-watchers', requestId);

        assert.ok(patternsCreated.length > 0, 'Should create at least one smart watcher pattern');
        const labels = patternsCreated.map((p) => (p?.pattern ? p.pattern : p)).map((p) => p?.pattern || p);
        assert.ok(
            labels.some((p) => typeof p === 'string' && p.includes('src')),
            'Should include high-priority src directory in watcher patterns'
        );
        assert.ok(
            labels.every((p) => typeof p === 'string' ? !p.includes('node_modules') : true),
            'Should not watch excluded directories'
        );
    } finally {
        await provider.dispose();
        mockInstall.dispose();
    }
}

async function verifyWatcherAbortOnPerfToggle() {
    const patternsCreated = [];
    const mockInstall = createTestMock({
        config: {
            'explorerDates.performanceMode': false
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    vscode.workspace.createFileSystemWatcher = (pattern) => {
        patternsCreated.push(pattern);
        const disposable = { dispose() {} };
        return {
            onDidChange() { return disposable; },
            onDidCreate() { return disposable; },
            onDidDelete() { return disposable; },
            dispose() {}
        };
    };

    const provider = new FileDateDecorationProvider();
    provider._fileSystem.readdir = async () => [];

    try {
        provider._performanceMode = true; // Force abort before setup
        const requestId = ++provider._watcherSetupToken;
        await provider._initializeSmartWatchers('abort-test', requestId);

        assert.strictEqual(provider._fileWatchers.size, 0, 'No watchers should remain after abort');
        assert.strictEqual(patternsCreated.length, 0, 'Abort should prevent watcher creation');
    } finally {
        await provider.dispose();
        mockInstall.dispose();
    }
}

async function main() {
    await verifySmartWatcherTargets();
    await verifyWatcherAbortOnPerfToggle();
    console.log('✅ Smart watcher tests passed');
}

main().catch((error) => {
    console.error('❌ Smart watcher tests failed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);
