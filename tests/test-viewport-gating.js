#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    const mockInstall = createTestMock({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.featureLevel': 'standard'
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    // Seed visible editor list
    const visibleUri = VSCodeUri.file(path.join(mockInstall.workspaceRoot, 'src/visible.js'));
    vscode.window.visibleTextEditors = [{ document: { uri: visibleUri } }];
    vscode.window.activeTextEditor = { document: { uri: visibleUri } };

    // Simple stat stub to avoid filesystem access
    const fakeStat = { mtime: new Date(), birthtime: new Date(), size: 123, isFile: () => true };

    const provider = new FileDateDecorationProvider();
    provider._fileSystem.stat = async () => fakeStat;
    provider._fileSystem.readdir = async () => [];

    try {
        // Off-viewport file (background)
        const backgroundUri = VSCodeUri.file(path.join(mockInstall.workspaceRoot, 'src/background.js'));
        const dec1 = await provider.provideFileDecoration(backgroundUri);
        assert.ok(dec1, 'Should return a decoration for background file');
        assert.strictEqual(provider._metrics.viewportBackgroundDecorations, 1, 'Background decoration should be counted');

        // Visible file (priority)
        const dec2 = await provider.provideFileDecoration(visibleUri);
        assert.ok(dec2, 'Should return a decoration for visible file');
        assert.strictEqual(provider._metrics.viewportPriorityDecorations, 1, 'Viewport decoration should be counted');
    } finally {
        await provider.dispose();
        mockInstall.dispose();
    }
}

main().catch((error) => {
    console.error('❌ Viewport gating test failed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);
