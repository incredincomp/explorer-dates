#!/usr/bin/env node

const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');

async function main() {
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.forceEnableForLargeWorkspaces': false
        }
    });
    const { vscode, appliedUpdates, VSCodeUri } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    // Simulate a massive workspace: return 50,001 fake files quickly
    vscode.workspace.findFiles = async () => Array.from({ length: 50001 }, (_, i) => VSCodeUri.file(`/tmp/fake-${i}.txt`));

    const provider = new FileDateDecorationProvider();
    try {
        await provider.checkWorkspaceSize();

        assert.strictEqual(provider._workspaceScale, 'extreme', 'Workspace scale should be extreme for 50K+ files');
        assert.strictEqual(provider._featureLevel, 'standard', 'Extreme scale should downgrade only to standard, not minimal');
        assert.ok(provider._featureProfile?.enableColors, 'Colors should stay enabled at extreme scale');
        assert.strictEqual(
            appliedUpdates.some((u) => u.key === 'explorerDates.performanceMode'),
            false,
            'Performance mode should not be auto-enabled for large workspaces'
        );
    } finally {
        await provider.dispose();
        mockInstall.dispose();
    }
}

main().catch((error) => {
    console.error('❌ Workspace scale test failed:', error);
    process.exitCode = 1;
});
