#!/usr/bin/env node

const assert = require('assert');
const { scheduleExit } = require('./helpers/forceExit');
const { hydrateProviderOptionalSystems } = require('../src/chunks/provider-init-chunk');

async function main() {
    let initialized = false;
    const mockProvider = {
        _l10n: {
            getString: (k) => k,
            formatDate: (d) => String(d),
            getCurrentLocale: () => 'en',
            dispose: () => {}
        },
        _decorationLogic: null,
        _decorationProviderHelpers: null,
        _allocationTelemetryEnabled: false,
        _logger: {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {}
        },
        _getDecorationsAdvancedChunk: async () => ({ initializeAdvancedSystems: async () => { initialized = true; } })
    };

    await hydrateProviderOptionalSystems(mockProvider);
    assert.strictEqual(initialized, true, 'Advanced systems initializer should be called');
    console.log('✅ provider-init chunk test passed');
}

main().then(() => scheduleExit(0, 0)).catch((error) => {
    console.error('❌ provider-init chunk test failed:', error && error.message ? error.message : error);
    scheduleExit(0, 1);
});
