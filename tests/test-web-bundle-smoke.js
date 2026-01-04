#!/usr/bin/env node

// Simulate a minimal vscode.dev-like environment to ensure the web bundle
// doesn't touch Node-only APIs at load/activation time.
const assert = require('assert');
const path = require('path');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');
const { createExtensionContext } = require('./helpers/mockVscode');

async function runWebSmokeTest() {
    const extensionRoot = path.join(__dirname, '..');
    const workspaceFolders = [
        { path: path.join(extensionRoot, 'tests', 'fixtures', 'web-a'), name: 'web-a' },
        { path: path.join(extensionRoot, 'tests', 'fixtures', 'web-b'), name: 'web-b' }
    ];
    const harness = createWebVscodeMock({
        extensionPath: extensionRoot,
        workspaceFolders
    });
    const webBundlePath = path.join(__dirname, '..', 'dist', 'extension.web.js');
    delete require.cache[require.resolve(webBundlePath)];
    const webBundle = require(webBundlePath);

    assert.ok(webBundle.activate, 'Web bundle should export activate');
    assert.ok(webBundle.deactivate, 'Web bundle should export deactivate');

    const context = createExtensionContext({
        extensionUri: harness.extensionUri,
        extensionPath: harness.extensionUri.fsPath
    });

    try {
        await webBundle.activate(context);
        await webBundle.deactivate();

        const gitContextCall = harness.commandCalls.find(
            (call) =>
                call.command === 'setContext' &&
                call.args[0] === 'explorerDates.gitFeaturesAvailable'
        );
        assert.ok(gitContextCall, 'Web bundle should set git availability context');
        assert.strictEqual(
            gitContextCall.args[1],
            false,
            'Git features must be disabled in web environments'
        );

        assert.strictEqual(
            harness.fileWatcherCount,
            0,
            'Web bundle should not register VS Code file system watchers'
        );

        const loadedGitChunk = harness.chunkLoads.includes('gitInsights');
        assert.strictEqual(
            loadedGitChunk,
            false,
            'Web bundle must not load gitInsights chunk in browser environments'
        );

        assert.strictEqual(
            harness.vscode.workspace.workspaceFolders.length,
            workspaceFolders.length,
            'Web harness should expose all workspace folders for chunk resolution'
        );

        console.log('✅ Web bundle smoke test passed');
    } catch (error) {
        console.error('❌ Web bundle smoke test failed:', error);
        process.exitCode = 1;
    } finally {
        harness.restore();
    }
}

runWebSmokeTest();
