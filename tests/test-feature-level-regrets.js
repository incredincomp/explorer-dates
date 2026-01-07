#!/usr/bin/env node

const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.featureLevel': 'full'
        }
    });
    const { vscode, configValues } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const provider = new FileDateDecorationProvider();
    try {
        // Force a change to featureLevel without touching performanceMode
        configValues['explorerDates.featureLevel'] = 'minimal';
        provider._applyFeatureLevel(provider._determineFeatureLevel(vscode.workspace.getConfiguration('explorerDates')), 'test-regrets');

        assert.strictEqual(provider._performanceMode, false, 'Performance mode should remain unchanged');
        assert.strictEqual(provider._featureLevel, 'minimal', 'Feature level should update immediately from config');

        // Switch back to enhanced and ensure colors remain enabled without perf-mode
        configValues['explorerDates.featureLevel'] = 'enhanced';
        provider._applyFeatureLevel(provider._determineFeatureLevel(vscode.workspace.getConfiguration('explorerDates')), 'test-regrets');
        assert.strictEqual(provider._featureLevel, 'enhanced');
        assert.ok(provider._featureProfile?.enableColors, 'Colors should remain enabled outside performance mode');
    } finally {
        await provider.dispose();
        mockInstall.dispose();
    }
}

main().catch((error) => {
    console.error('❌ Feature level regrets test failed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);
