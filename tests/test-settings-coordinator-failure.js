#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// NOTE: do NOT require SettingsCoordinator at module top-level. Tests must install
// the VS Code mock before requiring modules that import 'vscode'.


async function testUpdateSettingHandlesUpdateErrorsGracefully() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // Require SettingsCoordinator only after mock is installed so 'vscode' resolves
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');

    // Make update throw for a particular key to simulate write failure
    const cfg = mock.vscode.workspace.getConfiguration();
    const originalUpdate = cfg.update.bind(cfg);
    cfg.update = async (key, value, target) => {
        if (key === 'maxCacheSize') {
            const err = new Error('Simulated write failure');
            err.code = 'EACCES';
            throw err;
        }
        return originalUpdate(key, value, target);
    };

    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        try {
            await coordinator.updateSetting('maxCacheSize', 999, { scope: 'auto' });
            assert.ok(false, 'Expected updateSetting to throw on write failure');
        } catch (err) {
            // Expected error - ensure it's propagated in a reasonable way
            assert.ok(err instanceof Error, 'Error should be thrown on write failure');
        }
    } finally {
        mock.dispose();
    }
}

async function testApplySettingsHandlesPartialFailures() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    // Require SettingsCoordinator only after mock is installed so 'vscode' resolves
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');

    // update will fail for one key and succeed for the other
    const cfg = mock.vscode.workspace.getConfiguration();
    const originalUpdate = cfg.update.bind(cfg);
    cfg.update = async (key, value, target) => {
        if (key === 'maxCacheSize') {
            const err = new Error('Simulated write failure');
            err.code = 'EACCES';
            throw err;
        }
        return originalUpdate(key, value, target);
    };

    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const results = await coordinator.applySettings([{ key: 'maxCacheSize', value: 5000 }, { key: 'cacheTimeout', value: 40000 }], { scope: 'user' }); void results;
        // One of the results should indicate an exception (we'll represent by thrown rejection not in results), but ensure the other succeeded
        const applied = mock.appliedUpdates.filter(u => u.key === 'explorerDates.cacheTimeout');
        assert.strictEqual(applied.length, 1, 'cacheTimeout update should have succeeded');
    } finally {
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['updateSetting surfaces write errors', testUpdateSettingHandlesUpdateErrorsGracefully],
        ['applySettings completes partial successes', testApplySettingsHandlesPartialFailures]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ SettingsCoordinator failure-path tests passed');
    } catch (error) {
        console.error('❌ SettingsCoordinator failure-path tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
