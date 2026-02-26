#!/usr/bin/env node

// Simulate a minimal vscode.dev-like environment to ensure the web bundle
// doesn't touch Node-only APIs at load/activation time.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');
const { createExtensionContext } = require('./helpers/mockVscode');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /No FileDateDecorationProvider available for web runtime/,
    /FileDateDecorationProvider unavailable — continuing without file decorations/,
    /Onboarding preload failed \(non-fatal\): .*OnboardingManager/,
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

const analysisCommandIds = new Set([
    'explorerDates.showWorkspaceActivity',
    'explorerDates.showPerformanceAnalytics',
    'explorerDates.debugCache',
    'explorerDates.runDiagnostics',
    'explorerDates.testDecorations',
    'explorerDates.monitorDecorations',
    'explorerDates.testVSCodeRendering',
    'explorerDates.quickFix',
    'explorerDates.showKeyboardShortcuts'
]);

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

        const registeredCommands = await harness.vscode.commands.getCommands(true);
        assert.ok(Array.isArray(registeredCommands), 'Web bundle should expose command registry');
        const contributed = (require('../package.json').contributes?.commands || [])
            .map((c) => c.command);
        const missing = contributed.filter((cmd) =>
            !analysisCommandIds.has(cmd) && !registeredCommands.includes(cmd)
        );
        assert.strictEqual(
            missing.length,
            0,
            `Web bundle missing registered commands: ${missing.join(', ')}`
        );
        const tokenSourcePath = path.join(extensionRoot, 'src', 'chunks', 'file-date-provider-impl.js');
        const tokenSource = fs.readFileSync(tokenSourcePath, 'utf8');
        const tokenMatches = tokenSource.match(/explorerDates\\.customColor\\.[A-Za-z0-9._-]+/g) || [];
        const emittedTokens = Array.from(new Set(tokenMatches));
        const contributedTokens = new Set(
            (require('../package.json').contributes?.colors || []).map((c) => c.id)
        );
        const missingTokens = emittedTokens.filter((token) => !contributedTokens.has(token));
        assert.strictEqual(
            missingTokens.length,
            0,
            `Missing contributes.colors entries for tokens: ${missingTokens.join(', ')}`
        );

        const webSafeCommands = [
            'explorerDates.applyPreset',
            'explorerDates.configureRuntime',
            'explorerDates.openLogs',
            'explorerDates.runWebDiagnostics'
        ];
        for (const commandId of webSafeCommands) {
            assert.ok(
                registeredCommands.includes(commandId),
                `Web bundle should register ${commandId}`
            );
            try {
                await harness.vscode.commands.executeCommand(commandId);
            } catch (error) {
                throw new Error(`Web command failed: ${commandId} (${error?.message || error})`);
            }
        }

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

        const diagState = globalThis.__explorerDatesWebDiagnostics;
        if (diagState) {
            const config = harness.vscode.workspace.getConfiguration('explorerDates');
            await config.update('colorScheme', 'recency', harness.vscode.ConfigurationTarget.Global);
            await config.update('performanceMode', false, harness.vscode.ConfigurationTarget.Global);

            const provider = harness.fileDecorationProvider();
            assert.ok(provider && typeof provider.provideFileDecoration === 'function', 'Web bundle should register a file decoration provider');
            const sampleFile = path.join(extensionRoot, 'tests', 'fixtures', 'sample-workspace', 'package.json');
            const sampleUri = harness.vscode.Uri.file(sampleFile).with({ scheme: 'vscode-vfs' });
            await provider.provideFileDecoration(sampleUri);

            const logText = diagState.logs
                .map((entry) => `${entry.level}:${entry.message} ${(entry.meta && entry.meta.error) || ''}`)
                .join('\n');
            assert.ok(
                !logText.includes('require is not a function'),
                'Web diagnostics should not report "require is not a function"'
            );
            assert.ok(
                !logText.includes('process is not defined'),
                'Web diagnostics should not report "process is not defined"'
            );
            assert.ok(
                !logText.includes('non-file-scheme'),
                'Web diagnostics should not short-circuit non-file schemes'
            );
            assert.ok(
                !logText.includes('Web require unsupported: ../teamConfigPersistence.proxy'),
                'Web diagnostics should not report team config persistence require failures'
            );
            assert.ok(
                !logText.includes('showQuickPick is not a function'),
                'Web diagnostics should not report showQuickPick is not a function'
            );
            assert.ok(
                !logText.includes('Provider unavailable in web runtime'),
                'Web diagnostics should not report provider unavailable in web runtime'
            );
            assert.ok(
                !logText.includes('Provider unavailable for decorations'),
                'Web diagnostics should not report provider unavailable for decorations'
            );
            assert.ok(
                diagState.provider?.created,
                'Web diagnostics should report provider created'
            );
            assert.ok(
                diagState.provider?.registered,
                'Web diagnostics should report provider registered'
            );
            const decorationSamples = diagState.logs.filter((entry) => entry.message === 'Decoration return sample');
            assert.ok(
                decorationSamples.length > 0,
                'Web diagnostics should include decoration return samples'
            );
            const vfsSamples = decorationSamples.filter((entry) => entry.meta && entry.meta.scheme === 'vscode-vfs');
            assert.ok(
                vfsSamples.length > 0,
                'Web diagnostics should include a decoration sample for vscode-vfs scheme'
            );
            const hasTimestampSource = decorationSamples.some((entry) => entry.meta && entry.meta.timestampSource);
            assert.ok(
                hasTimestampSource,
                'Web diagnostics should include timestampSource for decoration samples'
            );
            const hasReturnOrNull = decorationSamples.some((entry) =>
                entry.meta && (entry.meta.decorationKeys || entry.meta.nullReason)
            );
            assert.ok(
                hasReturnOrNull,
                'Web diagnostics should include decorationKeys or nullReason in samples'
            );
            const hasColorSample = decorationSamples.some((entry) => entry.meta && entry.meta.hasColor);
            assert.ok(
                hasColorSample,
                'Web diagnostics should include a decoration sample with color'
            );
            const webFlagSample = decorationSamples.some((entry) => entry.meta && entry.meta.isWeb === true);
            assert.ok(
                webFlagSample,
                'Web diagnostics should flag samples as web runtime'
            );
            assert.ok(
                !logText.includes('Failed to apply preset'),
                'Web diagnostics should not report applyPreset failures'
            );
            assert.ok(
                logText.includes('QuickPick unavailable'),
                'Web diagnostics should log quick pick unavailable fallback'
            );
        }

        await webBundle.deactivate();

        console.log('✅ Web bundle smoke test passed');
    } catch (error) {
        console.error('❌ Web bundle smoke test failed:', error);
        process.exitCode = 1;
    } finally {
        harness.restore();
        // Force the process to exit even if a hidden handle stays open
        try {
            const { scheduleExit } = require('./helpers/forceExit');
            scheduleExit(0, process.exitCode ?? 0);
        } catch {
            require('./helpers/forceExit').scheduleExit(0, process.exitCode ?? 0);
        }
    }
}

runWebSmokeTest();
