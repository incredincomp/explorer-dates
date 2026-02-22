#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function testConcurrentMultiKeyTransactions() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // Require after the mock is installed so modules that `require('vscode')`
    // pick up the test harness stub instead of failing to load the module.
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');

    // Introduce random delay in cfg.update to force interleaving if not locked
    const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
    mock.vscode.workspace.getConfiguration = function(section, resource) {
        const cfg = originalGetConfiguration(section, resource);
        const originalUpdate = cfg.update.bind(cfg);
        cfg.update = async function(key, value, target) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 50) + 10));
            return originalUpdate(key, value, target);
        };
        return cfg;
    };

    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });

        const workloads = [
            [{ key: 'maxCacheSize', value: 4001 }, { key: 'cacheTimeout', value: 40001 }],
            [{ key: 'cacheTimeout', value: 50002 }, { key: 'maxCacheSize', value: 5002 }],
            [{ key: 'maxCacheSize', value: 6003 }, { key: 'cacheTimeout', value: 60003 }]
        ];

        const runners = workloads.map(w => coordinator.applySettings(w, { scope: 'user' }));
        const results = await Promise.all(runners);

        // Ensure each runner completed
        assert.strictEqual(results.length, workloads.length);

        // Validate that final applied values for each key are among attempted ones
        const attemptsMax = [4001, 5002, 6003];
        const attemptsTimeout = [40001, 50002, 60003];

        const maxUpdates = mock.appliedUpdates.filter(u => u.key === 'explorerDates.maxCacheSize');
        const timeoutUpdates = mock.appliedUpdates.filter(u => u.key === 'explorerDates.cacheTimeout');

        const finalMax = maxUpdates.length ? maxUpdates[maxUpdates.length - 1].value : null;
        const finalTimeout = timeoutUpdates.length ? timeoutUpdates[timeoutUpdates.length - 1].value : null;

        assert.ok(attemptsMax.includes(finalMax), 'Final maxCacheSize should be one of attempted values');
        assert.ok(attemptsTimeout.includes(finalTimeout), 'Final cacheTimeout should be one of attempted values');

    } finally {
        mock.dispose();
    }
}

async function main() {
    try {
        await testConcurrentMultiKeyTransactions();
        console.log('✅ Multi-key transaction test passed');
    } catch (error) {
        console.error('❌ Multi-key transaction test failed:', error);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
}

if (require.main === module) main();