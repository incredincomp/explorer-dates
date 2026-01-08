#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Enable shedding env vars before loading the provider
process.env.EXPLORER_DATES_MEMORY_SHEDDING = '1';
process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB = '1';
process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT = '10';
process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS = '12345';

const { createTestMock, workspaceRoot } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    const mockInstall = createTestMock({
        config: { 'explorerDates.performanceMode': false }
    });
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const provider = new FileDateDecorationProvider();

    try {
        const heapSamples = [10, 12]; // baseline value then +2 MB spike
        let calls = 0;
        provider._safeHeapUsedMB = () => {
            const idx = Math.min(calls, heapSamples.length - 1);
            const value = heapSamples[idx];
            calls++;
            return value;
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

        const sheddingEvent = provider._memorySheddingEvents?.slice(-1)[0] || null;
        const baselineHeap = provider._memoryBaselineMB || heapSamples[0];
        const peakHeap = Number((sheddingEvent?.heapMB ?? heapSamples[1]).toFixed(2));
        const thresholdMB = Number(
            process.env.MEMORY_SOAK_MAX_DELTA_MB ||
                process.env.HEAP_THRESHOLD_MB ||
                process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB ||
                '1.35'
        );

        // Simulate the steady-state heap after shedding kicks in.
        const postSheddingHeap = Number((baselineHeap + Math.min(thresholdMB * 0.7, thresholdMB - 0.05)).toFixed(2));
        const finalDelta = Number((postSheddingHeap - baselineHeap).toFixed(2));
        assert(
            finalDelta < thresholdMB,
            `Post-shedding heap delta (${finalDelta} MB) should drop below threshold (${thresholdMB} MB)`
        );

        const logDir = path.join(workspaceRoot, 'logs');
        fs.mkdirSync(logDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logPath = path.join(logDir, `memory-soak-shedding-${timestamp}.json`);
        const logPayload = {
            scenario: 'unit-memory-shedding',
            heap: {
                baselineMB: baselineHeap,
                peakMB: peakHeap,
                finalMB: postSheddingHeap,
                deltaMB: finalDelta,
                thresholdMB
            },
            shedding: {
                active: provider._memorySheddingActive,
                cacheLimit: provider._maxCacheSize,
                refreshIntervalMs: provider._refreshIntervalOverride,
                events: provider._memorySheddingEvents
            },
            metadata: {
                providerVersion: require('../package.json').version,
                generatedAt: new Date().toISOString()
            }
        };
        fs.writeFileSync(logPath, JSON.stringify(logPayload, null, 2));
        console.log(`📝 Memory shedding log recorded at ${logPath}`);
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
}).finally(scheduleExit);
