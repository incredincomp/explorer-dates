#!/usr/bin/env node

const { scheduleExit } = require('./helpers/forceExit');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');

const pkg = require('../package.json');

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

async function main() {
    const mock = createTestMock();
    const context = createExtensionContext();
    const extension = require('../extension');

    let activated = false;
    try {
        await extension.activate(context);
        activated = true;

        const registered = await mock.vscode.commands.getCommands(true);
        const contributed = (pkg.contributes?.commands || []).map((c) => c.command);
        const missing = contributed.filter((cmd) => !analysisCommandIds.has(cmd) && !registered.includes(cmd));

        if (missing.length > 0) {
            throw new Error(`Missing registered commands: ${missing.join(', ')}`);
        }

        console.log('✅ Command registration coverage complete');
    } finally {
        if (activated) {
            await extension.deactivate();
        }
        mock.dispose();
    }
}

main().then(() => scheduleExit(0, 0)).catch((error) => {
    console.error('❌ Command registration test failed:', error && error.message ? error.message : error);
    scheduleExit(0, 1);
});
