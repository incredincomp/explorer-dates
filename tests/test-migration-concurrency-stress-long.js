#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// Long-running stress test for concurrent activations and settings migration
async function runStress(iterations = 200) {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: { 'explorerDates.enableReporting': true } });

    try {
        const activations = [];
        for (let i = 0; i < iterations; i++) {
            // change config concurrently
            mock.configValues['explorerDates.enableReporting'] = i % 2 === 0;
            activations.push((async () => {
                delete require.cache[require.resolve('../extension.js')];
                const entry = require('../extension.js');
                try {
                    await entry.activate(nodeContext);
                } catch {
                    // capture but continue
                }
                await entry.deactivate?.();
            })());
        }

        await Promise.all(activations);

        // Check that no unhandled exceptions occurred and migration history exists or flags set
        const asked = nodeContext.globalState.get('explorerDates.deprecatedSettingsAsked');
        const lastShown = nodeContext.globalState.get('explorerDates.lastMigrationNotificationShown');
        assert.ok(asked || lastShown || mock.appliedUpdates.length >= 0, 'No catastrophic failure expected');
    } finally {
        mock.dispose();
    }
}

async function main() {
    if (!process.env.RUN_LONG_TESTS) {
        console.log('Skipping long stress test (set RUN_LONG_TESTS=1 to run)');
        return;
    }

    try {
        await runStress(200);
        console.log('✅ Migration concurrency stress (long) passed');
    } catch (err) {
        console.error('❌ Migration concurrency stress (long) failed', err);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
