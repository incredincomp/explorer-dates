#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { AdvancedCache } = require('../src/advancedCache');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

async function runFuzz(iterations = 300, strict = false) {
    const mock = createTestMock();
    const { configValues } = mock;
    configValues['explorerDates.persistentCache'] = true;
    configValues['explorerDates.maxMemoryUsage'] = 50; // MB default for fuzz
    configValues['explorerDates.strictPersistentCacheValidation'] = !!strict;

    let rejectedTotal = 0;

    for (let i = 0; i < iterations; i++) {
        const ctx = createExtensionContext();

        // Build a random snapshot
        const snapshot = {};
        const keys = Math.max(1, Math.floor(Math.random() * 12));
        for (let k = 0; k < keys; k++) {
            const name = `r${i}_${k}`;
            const choice = Math.floor(Math.random() * 8);

            switch (choice) {
                case 0:
                    snapshot[name] = 'string-only';
                    break;
                case 1:
                    snapshot[name] = { data: Math.random() * 1000 };
                    break;
                case 2:
                    snapshot[name] = { data: 'v', metadata: { sz: Math.floor(Math.random() * 20) + 1, ts: Date.now() - Math.floor(Math.random() * 1e12), la: Date.now(), ttl: Math.floor(Math.random() * 1e9) } };
                    break;
                case 3:
                    snapshot[name] = { data: 'v', metadata: { sz: 'NaN', ts: 'not-number', la: null, ttl: -100 } };
                    break;
                case 4:
                    snapshot[name] = { data: 'v', metadata: { sz: Math.floor(Math.random() * 50) * 1024 * 1024, ts: Date.now(), la: Date.now(), ttl: 1000000 } };
                    break;
                case 5:
                    snapshot[name] = { meta: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000 }, value: 'ok' };
                    break;
                case 6:
                    snapshot[name] = { data: 'x', metadata: { sz: 2, ts: Date.now() + (1000 * 60 * 60 * 24 * 4000), la: Date.now(), ttl: 1000 } }; // absurd future ts
                    break;
                case 7:
                    snapshot[name] = { data: 'y', metadata: { sz: 0, ts: Date.now(), la: Date.now(), ttl: 1 } };
                    break;
            }
        }

        await ctx.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, snapshot);

        const cache = new AdvancedCache(ctx);
        try {
            await cache.initialize();
            // Ensure initialize doesn't throw and we can call get for all keys
            for (const k of Object.keys(snapshot)) {
                try {
                    await cache.get(k);
                } catch {
                    // In strict mode some gets may throw if we didn't tolerate inputs; count as rejection
                    rejectedTotal++;
                }
            }
            rejectedTotal += cache._metrics.persistentRejected || 0;
        } finally {
            await cache.dispose();
        }
    }

    return rejectedTotal;
}

(async function main() {
    scheduleExit(120000);

    console.log('Running fuzz (tolerant mode)');
    const tolerantRejections = await runFuzz(200, false);
    console.log('Tolerant rejections:', tolerantRejections);
    assert.ok(typeof tolerantRejections === 'number', 'Tolerant run must complete');

    console.log('Running fuzz (strict mode)');
    const strictRejections = await runFuzz(200, true);
    console.log('Strict rejections:', strictRejections);
    assert.ok(strictRejections > 0, 'Strict mode should reject some malformed entries');

    console.log('\nFuzz tests passed');
})();