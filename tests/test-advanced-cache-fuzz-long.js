#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

// Require AdvancedCache only after mock is available in tests to ensure 'vscode' hook is installed
function requireAdvancedCache() {
    delete require.cache[require.resolve('../src/advancedCache')];
    return require('../src/advancedCache').AdvancedCache;
}

// Simple seeded RNG (mulberry32)
function mulberry32(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ t >>> 15, 1 | t);
        r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
        return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
}

async function runSeededFuzz(iterations = 1000, strict = false, seed = 12345) {
    const rng = mulberry32(seed);
    let rejectedTotal = 0;

    for (let i = 0; i < iterations; i++) {
        const mock = createTestMock();
        mock.configValues['explorerDates.persistentCache'] = true;
        mock.configValues['explorerDates.maxMemoryUsage'] = 50; // MB
        mock.configValues['explorerDates.strictPersistentCacheValidation'] = !!strict;

        const ctx = createExtensionContext();
        const snapshot = {};
        const keys = Math.max(1, Math.floor(rng() * 12));

        for (let k = 0; k < keys; k++) {
            const name = `s${seed}_${i}_${k}`;
            const choice = Math.floor(rng() * 9);

            switch (choice) {
                case 0:
                    snapshot[name] = 'string-only';
                    break;
                case 1:
                    snapshot[name] = { data: Math.floor(rng() * 1000) };
                    break;
                case 2:
                    snapshot[name] = { data: 'v', metadata: { sz: Math.floor(rng() * 20) + 1, ts: Date.now() - Math.floor(rng() * 1e12), la: Date.now(), ttl: Math.floor(rng() * 1e9) } };
                    break;
                case 3:
                    snapshot[name] = { data: 'v', metadata: { sz: 'NaN', ts: 'not-number', la: null, ttl: -100 } };
                    break;
                case 4:
                    snapshot[name] = { data: 'v', metadata: { sz: Math.floor(rng() * 50) * 1024 * 1024, ts: Date.now(), la: Date.now(), ttl: 1000000 } };
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
                case 8:
                    // malformed tags
                    snapshot[name] = { data: 't', metadata: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000000, tg: rng() > 0.5 ? ['a','b'] : 'bad' } };
                    break;
            }
        }

        await ctx.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, snapshot);

        const AdvancedCache = requireAdvancedCache();
        const cache = new AdvancedCache(ctx);
        try {
            await cache.initialize();
            for (const k of Object.keys(snapshot)) {
                try {
                    await cache.get(k);
                } catch {
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
    scheduleExit(300000);

    const iterations = Number(process.env.FUZZ_LONG_ITERATIONS || 2000);
    const seed = Number(process.env.FUZZ_SEED || 123456789);

    console.log(`Running long fuzz: iterations=${iterations}, seed=${seed}`);
    const tolerantRejections = await runSeededFuzz(iterations, false, seed);
    console.log('Tolerant rejections (long):', tolerantRejections);

    const strictRejections = await runSeededFuzz(iterations, true, seed + 1);
    console.log('Strict rejections (long):', strictRejections);

    assert.ok(strictRejections > tolerantRejections, 'Strict mode should reject more entries than tolerant mode');

    console.log('\nLong fuzz tests passed');
})();