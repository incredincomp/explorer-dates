#!/usr/bin/env node

const assert = require('assert');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');

async function main() {
    const harness = createWebVscodeMock();
    let event = null;
    const disposable = harness.vscode.workspace.onDidChangeConfiguration((change) => { event = change; });
    try {
        await harness.vscode.workspace.getConfiguration('explorerDates').update('colorScheme', 'recency', harness.vscode.ConfigurationTarget.Global);
        assert.ok(event, 'configuration update should emit an event');
        assert.strictEqual(event.affectsConfiguration('explorerDates'), true);
        assert.strictEqual(event.affectsConfiguration('explorerDates.colorScheme'), true);
        assert.strictEqual(harness.vscode.workspace.getConfiguration('explorerDates').get('colorScheme'), 'recency');
        console.log('Web configuration event contract passed.');
    } finally {
        disposable.dispose();
        harness.restore();
    }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
