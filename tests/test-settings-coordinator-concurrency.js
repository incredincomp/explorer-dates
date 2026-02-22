#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// Note: don't require SettingsCoordinator at module top-level because it depends on 'vscode'.
// Require it lazily inside tests after installing the VS Code mock via createTestMock().

async function testConcurrentUpdateSettingNoCrash() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // Wrap configuration update to add a random delay, simulating real-world async contention
    const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
    mock.vscode.workspace.getConfiguration = function(section, resource) {
        const cfg = originalGetConfiguration(section, resource);
        const originalUpdate = cfg.update.bind(cfg);
        cfg.update = async function(key, value, target) {
            // random small delay
            await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 30) + 10));
            return originalUpdate(key, value, target);
        };
        return cfg;
    };

    try {
        // Require coordinator after mock is installed so 'vscode' resolves in dependent modules
        const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const N = 20;
        const promises = [];
        for (let i = 0; i < N; i++) {
            promises.push(coordinator.updateSetting('maxCacheSize', 1000 + i, { scope: 'auto' }));
        }

        // Should resolve without throwing
        const results = await Promise.all(promises);
        assert.ok(Array.isArray(results) && results.length === N, 'Expected all concurrent updates to resolve');

        // All updates should be recorded
        assert.strictEqual(mock.appliedUpdates.length, N, 'Expected each update to be applied once');

        // Final stored value should be one of the values we tried to set
        const final = mock.appliedUpdates[mock.appliedUpdates.length - 1].value;
        assert.ok(final >= 1000 && final < 1000 + N, 'Final value should be one of the attempted values');
    } finally {
        mock.dispose();
    }
}

async function testConcurrentApplySettingsOrdering() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // slow update to maximize interleaving
    const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
    mock.vscode.workspace.getConfiguration = function(section, resource) {
        const cfg = originalGetConfiguration(section, resource);
        const originalUpdate = cfg.update.bind(cfg);
        cfg.update = async function(key, value, target) {
            await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 40) + 20));
            return originalUpdate(key, value, target);
        };
        return cfg;
    };

    try {
        // Require coordinator after mock is installed so 'vscode' resolves in dependent modules
        const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const workload = [
            { key: 'maxCacheSize', value: 5000 },
            { key: 'cacheTimeout', value: 45000 }
        ];

        const runners = [coordinator.applySettings(workload, { scope: 'user' }), coordinator.applySettings(workload, { scope: 'user' }), coordinator.applySettings(workload, { scope: 'user' })];

        const all = await Promise.all(runners);
        // Each runner should return two results and complete
        assert.strictEqual(all.length, 3);
        for (const r of all) {
            assert.ok(Array.isArray(r) && r.length === 2, 'applySettings should return results for each entry');
        }

        // Total applied updates should be between 2 and 6 depending on timing and skip behavior
        assert.ok(mock.appliedUpdates.length >= 2 && mock.appliedUpdates.length <= 6, 'Expected between 2 and 6 updates depending on serialization and skip behavior');
    } finally {
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['Concurrent updateSetting calls do not crash', testConcurrentUpdateSettingNoCrash],
        ['Concurrent applySettings calls complete and write updates', testConcurrentApplySettingsOrdering]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ SettingsCoordinator concurrency tests passed');
    } catch (error) {
        console.error('❌ SettingsCoordinator concurrency tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
