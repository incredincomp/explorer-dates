#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');

async function main() {
    const mock = createTestMock();
    mock.configValues['explorerDates.enableAdvancedCache'] = false;
    mock.configValues['explorerDates.enableWorkspaceIntelligence'] = false;
    const featureFlags = require('../src/featureFlags');
    featureFlags.registerFeatureLoader('decorationsAdvanced', async () => require('../src/chunks/decorations-advanced'));
    globalThis.__strictConsoleAllowlist = [
        'No built artifact available for chunk',
        'Detected existing explorerDates.resetToDefaults handler'
    ];
    const extension = require('../extension');
    const context = createExtensionContext();
    try {
        await extension.activate(context);
        const before = mock.infoLog.length;
        const success = await mock.vscode.commands.executeCommand('explorerDates.generateReport');
        assert.notStrictEqual(success, undefined, 'registered report command must resolve after generation');
        assert(mock.infoLog.slice(before).some(message => String(message).includes('Report saved to')),
            'successful command must report the exact saved target');
        assert.strictEqual(mock.errorLog.length, 0);

        const originalQuickPick = mock.vscode.window.showQuickPick;
        mock.vscode.window.showQuickPick = async () => null;
        const cancelled = await mock.vscode.commands.executeCommand('explorerDates.generateReport');
        assert.strictEqual(cancelled, undefined, 'time-range cancellation must resolve as cancellation');
        assert.strictEqual(mock.errorLog.length, 0);
        mock.vscode.window.showQuickPick = originalQuickPick;
        console.log('✅ registered report lifecycle success and cancellation passed');
    } finally {
        await extension.deactivate();
        delete globalThis.__strictConsoleAllowlist;
        mock.dispose();
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
