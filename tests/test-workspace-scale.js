#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// Allow workspace scans to cover the higher thresholds used in the new defaults
process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS = '500000';

async function main() {
    const mockInstall = createTestMock({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.forceEnableForLargeWorkspaces': false
        }
    });
    const { vscode, appliedUpdates, VSCodeUri } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const scenarios = [
        {
            name: '50K workspace remains normal/full',
            fileCount: 50000,
            expectedScale: 'normal',
            expectedFeatureLevel: 'full'
        },
        {
            name: '250K workspace enters large/standard',
            fileCount: 250000,
            expectedScale: 'large',
            expectedFeatureLevel: 'standard'
        },
        {
            name: '350K workspace stays large/standard',
            fileCount: 350000,
            expectedScale: 'large',
            expectedFeatureLevel: 'standard'
        }
    ];

    for (const scenario of scenarios) {
        // Simulate the workspace size for this scenario
        // The provider only inspects .length for workspace sizing, so a sparse array keeps the test light even at high counts.
        vscode.workspace.findFiles = async () => new Array(scenario.fileCount);

        const provider = new FileDateDecorationProvider();
        try {
            const timeoutMs = 4000;
            let timeoutHandle;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error(`checkWorkspaceSize timed out after ${timeoutMs}ms`)), timeoutMs);
            });

            await Promise.race([provider.checkWorkspaceSize(), timeoutPromise]).finally(() => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
            });

            assert.strictEqual(provider._workspaceFileCount, scenario.fileCount, `${scenario.name}: file count should match stubbed workspace`);
            assert.strictEqual(provider._workspaceScale, scenario.expectedScale, `${scenario.name}: workspace scale should be ${scenario.expectedScale}`);
            assert.strictEqual(provider._featureLevel, scenario.expectedFeatureLevel, `${scenario.name}: feature level should be ${scenario.expectedFeatureLevel}`);
            assert.strictEqual(provider._featureProfile?.enableColors, true, `${scenario.name}: colors should remain enabled`);
            assert.strictEqual(
                appliedUpdates.some((u) => u.key === 'explorerDates.performanceMode'),
                false,
                `${scenario.name}: performance mode should not be auto-enabled`
            );
        } finally {
            await provider.dispose();
        }
    }

    console.log('✅ Workspace scale tests passed');
    mockInstall.dispose();
}

main().catch((error) => {
    console.error('❌ Workspace scale test failed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);
