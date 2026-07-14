#!/usr/bin/env node

'use strict';

const assert = require('assert');

process.env.EXPLORER_DATES_MEMORY_SHEDDING = '1';

const { createTestMock } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

const originalMemoryUsage = process.memoryUsage;
const mockInstall = createTestMock({ config: { 'explorerDates.performanceMode': false } });

try {
    process.memoryUsage = () => ({ heapUsed: Number.NaN, rss: -1 });
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    const provider = new FileDateDecorationProvider();

    assert.strictEqual(provider._memoryBaselineMB, 0, 'invalid heap telemetry must use a zero baseline');
    assert.strictEqual(provider._safeHeapUsedMB(), 0, 'invalid heap telemetry must return zero');
    assert.strictEqual(provider._safeRssMB(), 0, 'invalid RSS telemetry must return zero');

    provider.dispose().then(() => {
        console.log('test-memory-safe-sampling: ok');
        process.memoryUsage = originalMemoryUsage;
        mockInstall.dispose();
        scheduleExit(0, 0);
    }).catch((error) => {
        console.error(error);
        process.memoryUsage = originalMemoryUsage;
        mockInstall.dispose();
        scheduleExit(0, 1);
    });
} catch (error) {
    console.error(error);
    process.memoryUsage = originalMemoryUsage;
    mockInstall.dispose();
    scheduleExit(0, 1);
}
