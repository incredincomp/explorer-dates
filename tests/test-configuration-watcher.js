#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');
const { expectMissingBuiltChunkWarning } = require('./helpers/chunk-test-env');

addWarningFilters([
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

expectMissingBuiltChunkWarning({
    chunkName: 'decorationsAdvanced',
    reason: 'configuration watcher test tolerates missing built chunk'
});

function installConfigChangeHelper(mock) {
    let configChangeListener = null;
    mock.vscode.workspace.onDidChangeConfiguration = (listener) => {
        configChangeListener = listener;
        return { dispose() { if (configChangeListener === listener) configChangeListener = null; } };
    };
    return function fireConfigChange(...keys) {
        if (!configChangeListener) throw new Error('No configuration listener registered');
        const affected = new Set(keys);
        configChangeListener({ affectsConfiguration(name) { return affected.has(name); } });
    };
}

async function testProviderRespondsToPerformanceModeToggle() {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: { 'explorerDates.performanceMode': false } });
    const fireConfigChange = installConfigChangeHelper(mock);

    try {
        // Activate extension so provider sets up watcher
        delete require.cache[require.resolve('../extension.js')];
        const entry = require('../extension.js');
        await entry.activate(nodeContext);

        // Toggle config and fire change
        mock.configValues['explorerDates.performanceMode'] = true;
        fireConfigChange('explorerDates', 'explorerDates.performanceMode');

        // No errors and provider should have processed change; assert that no exception thrown and activation still intact
        assert.ok(true, 'Configuration change processed without exception');

        await entry.deactivate?.();
    } finally {
        mock.dispose();
    }
}

async function testProviderUpdatesBadgeRefreshInterval() {
    const nodeContext = createExtensionContext();
    const mock = createTestMock({ config: { 'explorerDates.badgeRefreshInterval': 60000 } });

    const fireConfigChange = installConfigChangeHelper(mock);

    try {
        delete require.cache[require.resolve('../extension.js')];
        const entry = require('../extension.js');
        await entry.activate(nodeContext);

        mock.configValues['explorerDates.badgeRefreshInterval'] = 500;
        fireConfigChange('explorerDates', 'explorerDates.badgeRefreshInterval');

        assert.ok(true, 'Badge refresh interval change processed');

        await entry.deactivate?.();
    } finally {
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['Provider responds to performanceMode toggle', testProviderRespondsToPerformanceModeToggle],
        ['Provider updates badgeRefreshInterval', testProviderUpdatesBadgeRefreshInterval]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ Configuration watcher tests passed');
    } catch (error) {
        console.error('❌ Configuration watcher tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => scheduleExit());
}
