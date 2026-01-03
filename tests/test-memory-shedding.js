#!/usr/bin/env node

const assert = require('assert');

// Enable shedding env vars before loading the provider
process.env.EXPLORER_DATES_MEMORY_SHEDDING = '1';
process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB = '1';
process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT = '10';
process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS = '12345';

const { createMockVscode } = require('./helpers/mockVscode');

async function main() {
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const provider = new FileDateDecorationProvider();

    try {
        // Force deterministic heap readings
        let calls = 0;
        provider._safeHeapUsedMB = () => {
            calls++;
            return calls === 1 ? 10 : 12; // baseline then +2MB
        };

        provider._maxCacheSize = 1000;
        provider._refreshInterval = 1000;
        provider._memoryBaselineMB = 0;

        // First call sets baseline; second triggers shedding
        provider._maybeShedWorkload(); // establishes baseline
        provider._maybeShedWorkload(); // triggers shedding

        assert.strictEqual(provider._memorySheddingActive, true, 'Memory shedding should activate when over threshold');
        assert.ok(provider._maxCacheSize <= 10, 'Cache size should be capped to shed limit');
        assert.strictEqual(
            provider._refreshIntervalOverride,
            12345,
            'Refresh interval should stretch when shedding triggers'
        );
    } finally {
        await provider.dispose();
        mockInstall.dispose();
        delete process.env.EXPLORER_DATES_MEMORY_SHEDDING;
        delete process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB;
        delete process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT;
        delete process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS;
    }
}

main().catch((error) => {
    console.error('❌ Memory shedding test failed:', error);
    process.exitCode = 1;
});
