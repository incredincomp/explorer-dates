#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
let getSettingsCoordinator;
const { scheduleExit } = require('./helpers/forceExit');

async function testLockWaitStatsUnderLoad() {
    const mock = createTestMock({ config: {}, workspaceFolders: [] });

    try {
        // require coordinator after creating mock so the global mock is available
        getSettingsCoordinator = getSettingsCoordinator || require('../src/utils/settingsCoordinator').getSettingsCoordinator;

        // Add a small but consistent delay to cfg.update to simulate work
        const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
        mock.vscode.workspace.getConfiguration = function(section, resource) {
            const cfg = originalGetConfiguration(section, resource);
            const originalUpdate = cfg.update.bind(cfg);
            cfg.update = async function(key, value, target) {
                // 20ms delay to simulate IO
                await new Promise(r => setTimeout(r, 20));
                return originalUpdate(key, value, target);
            };
            return cfg;
        };

        const coordinator = getSettingsCoordinator({ forceNew: true });
        coordinator.resetLockWaitStats();

        // fire many concurrent updates to the same key to generate queueing
        const runners = Array.from({ length: 40 }, (_, i) => coordinator.updateSetting('maxCacheSize', 1000 + i, { scope: 'user' }));
        await Promise.all(runners);

        const stats = coordinator.getLockWaitStats();
        const key = 'explorerDates.maxCacheSize';
        assert.ok(stats[key], 'Expected wait stats for maxCacheSize');

        const max = stats[key].max || 0;
        // Ensure there's no pathological long tail under this load
        assert.ok(max < 2000, `Lock wait max should be <2000ms under simulated load (was ${max}ms)`);

    } finally {
        mock.dispose();
    }
}

async function main() {
    try {
        await testLockWaitStatsUnderLoad();
        console.log('✅ SettingsCoordinator lock wait stats test passed');
    } catch (error) {
        console.error('❌ SettingsCoordinator lock wait stats test failed:', error);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
}

if (require.main === module) main();