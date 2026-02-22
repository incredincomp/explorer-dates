#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { scheduleExit } = require('./helpers/forceExit');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

const extensionEntryPath = path.join(__dirname, '..', 'extension.js');

// Activate only (do not deactivate) — caller is responsible for teardown
async function activateExtension(entryPath, context) {
    delete require.cache[require.resolve(entryPath)];
    const entry = require(entryPath);
    try {
        await entry.activate(context);
        return entry;
    } finally {
        delete require.cache[require.resolve(entryPath)];
    }
}

async function testClearTelemetrySuccessful() {
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({ config: {} });

    // Seed some telemetry events
    await nodeContext.globalState.update('explorerDates.telemetryEvents', [ { a: 1 }, { b: 2 } ]);

    // Confirm action via modal (localized)
    mockInstall.vscode.window.showWarningMessage = async () => 'Clear Telemetry';

    let entry;
    try {
        entry = await activateExtension(extensionEntryPath, nodeContext);

        // Command registration test: ensure the command is available while activated
        const cmds = await mockInstall.vscode.commands.getCommands(true);
        assert.ok(cmds.includes('explorerDates.clearTelemetryData'), 'Expected clear telemetry command to be registered');

        // Execute command
        await mockInstall.vscode.commands.executeCommand('explorerDates.clearTelemetryData');

        const events = nodeContext.globalState._data['explorerDates.telemetryEvents'] || [];
        assert.ok(Array.isArray(events), 'Telemetry key should exist as an array after clear');
        assert.strictEqual(events.length, 0, 'Telemetry array should be empty after clearing');

        // Idempotent: calling again should still be fine
        await mockInstall.vscode.commands.executeCommand('explorerDates.clearTelemetryData');
        const events2 = nodeContext.globalState._data['explorerDates.telemetryEvents'] || [];
        assert.strictEqual(events2.length, 0, 'Telemetry array should remain empty after repeated clears');

        // Programmatic force clear via the wrapper command should also work without prompt
        await nodeContext.globalState.update('explorerDates.telemetryEvents', [ { z: 9 } ]);
        await mockInstall.vscode.commands.executeCommand('explorerDates.clearTelemetryData.force');
        const events3 = nodeContext.globalState._data['explorerDates.telemetryEvents'] || [];
        assert.strictEqual(events3.length, 0, 'Force wrapper should clear telemetry without prompt');
    } finally {
        try { await entry?.deactivate?.(); } catch {}
        // Dispose any subscriptions registered during activation (mimic VS Code host)
        try {
            if (nodeContext && Array.isArray(nodeContext.subscriptions)) {
                for (const d of nodeContext.subscriptions) { try { d?.dispose?.(); } catch {} }
                nodeContext.subscriptions.length = 0;
            }
        } catch {}
        mockInstall.dispose();
    }
}

async function testClearTelemetryCancelled() {
    const nodeContext = createExtensionContext();
    const mockInstall = createTestMock({ config: {} });

    await nodeContext.globalState.update('explorerDates.telemetryEvents', [ { c: 3 } ]);

    // Simulate user cancelling the modal
    mockInstall.vscode.window.showWarningMessage = async () => 'Cancel';

    let entry;
    try {
        entry = await activateExtension(extensionEntryPath, nodeContext);
        await mockInstall.vscode.commands.executeCommand('explorerDates.clearTelemetryData');

        const events = nodeContext.globalState._data['explorerDates.telemetryEvents'] || [];
        assert.strictEqual(events.length, 1, 'Telemetry should remain unchanged when user cancels');
    } finally {
        try { await entry?.deactivate?.(); } catch {}
        try {
            if (nodeContext && Array.isArray(nodeContext.subscriptions)) {
                for (const d of nodeContext.subscriptions) { try { d?.dispose?.(); } catch {} }
                nodeContext.subscriptions.length = 0;
            }
        } catch {}
        mockInstall.dispose();
    }
}

async function main() {
    try {
        await testClearTelemetrySuccessful();
        console.log('✅ Clear telemetry (successful)');
        await testClearTelemetryCancelled();
        console.log('✅ Clear telemetry (cancelled)');
        console.log('✅ Clear telemetry tests passed');
    } catch (err) {
        console.error('❌ Clear telemetry tests failed:', err);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
