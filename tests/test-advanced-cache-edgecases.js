#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

const sampleWorkspaceRoot = require('path').join(__dirname, 'fixtures', 'sample-workspace');
const mockInstall = createTestMock({ sampleWorkspace: sampleWorkspaceRoot });
const { configValues } = mockInstall;

// Require modules that depend on the VS Code hook only after installing the mock
const { AdvancedCache } = require('../src/advancedCache');

async function scenario(name, runner) {
    try {
        await runner();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}:`, error && error.message ? error.message : error);
        throw error;
    }
}

(async function main() {
    scheduleExit(120000);

    await scenario('Malformed metadata variants handled gracefully', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();

        // Compose malformed variants
        const now = Date.now();
        const snapshot = {
            missingMeta: { data: 'a' }, // no metadata -> should be ignored
            badTypes: { data: 'b', metadata: { sz: 'NaN', ts: 'not-a-number', la: null, ttl: -100 } },
            expired: { data: 'c', metadata: { sz: 10, ts: now - (1000 * 60 * 60 * 24), la: now - (1000 * 60 * 60 * 24), ttl: 10 } },
            futureValid: { data: 'd', metadata: { sz: 2, ts: now + (1000 * 60 * 60), la: now + (1000 * 60 * 60), ttl: 1000000 } }
        };

        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, snapshot);

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            const missing = await cache.get('missingMeta');
            const bad = await cache.get('badTypes');
            const expired = await cache.get('expired');
            const future = await cache.get('futureValid');

            assert.strictEqual(missing, null, 'Entry without metadata should be ignored');
            // badTypes likely becomes invalid because of malformed timestamps -> treated as not valid
            assert.ok(bad === null || bad === 'b', 'Malformed metadata should be tolerated or ignored without throwing');
            assert.strictEqual(expired, null, 'Expired entry should be ignored');
            assert.strictEqual(future, 'd', 'Future timestamp + long ttl should be considered valid');

            assert.ok(cache._metrics.persistentLoads >= 1, 'Persistent loads metric should increase');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Strict validation rejects malformed entries when enabled', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB
        configValues['explorerDates.strictPersistentCacheValidation'] = true;

        const context = createExtensionContext();
        const now = Date.now();
        const snapshot = {
            missingMeta: { data: 'a' }, // no metadata -> should be rejected in strict mode
            badTypes: { data: 'b', metadata: { sz: 'NaN', ts: 'not-a-number', la: null, ttl: -100 } },
            expired: { data: 'c', metadata: { sz: 10, ts: now - (1000 * 60 * 60 * 24), la: now - (1000 * 60 * 60 * 24), ttl: 10 } },
            futureValid: { data: 'd', metadata: { sz: 2, ts: now + (1000 * 60 * 60), la: now + (1000 * 60 * 60), ttl: 1000000 } }
        };

        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, snapshot);

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            const missing = await cache.get('missingMeta');
            const bad = await cache.get('badTypes');
            const expired = await cache.get('expired');
            const future = await cache.get('futureValid');

                assert.strictEqual(missing, null, 'Entry without metadata should be rejected in strict mode');
            assert.strictEqual(bad, null, 'Malformed metadata should be rejected in strict mode');
            assert.strictEqual(expired, null, 'Expired entry should be ignored');
            assert.strictEqual(future, 'd', 'Future timestamp + long ttl should be considered valid');
            assert.ok(cache._metrics.persistentRejected >= 1, 'strict mode should have incremented persistentRejected on malformed entries');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Version field normalization and acceptance', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();
        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {
            verStr: { data: 'v', metadata: { sz: 4, ts: Date.now(), la: Date.now(), ttl: 1000000, v: '2' } }
        });

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            const v = await cache.get('verStr');
            assert.strictEqual(v, 'v', 'Entry with string version should be normalized and loaded');
            const stats = cache.getStats();
            // version normalized - simple assertion that load succeeded
            assert.ok(stats.persistentLoads >= 1, 'Persistent loads incremented');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Malformed tags handling: tolerant vs strict', async () => {
        // Tolerant mode
        configValues['explorerDates.strictPersistentCacheValidation'] = false;
        const ctxT = createExtensionContext();
        await ctxT.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {
            t1: { data: 'x', metadata: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000000, tg: 'not-array' } }
        });
        const cacheT = new AdvancedCache(ctxT);
        try {
            await cacheT.initialize();
            const x = await cacheT.get('t1');
            assert.strictEqual(x, 'x', 'Tolerant mode should load entry with malformed tags');
        } finally {
            await cacheT.dispose();
        }

        // Strict mode should reject it
        configValues['explorerDates.strictPersistentCacheValidation'] = true;
        const ctxS = createExtensionContext();
        await ctxS.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {
            t2: { data: 'y', metadata: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000000, tg: 'not-array' } }
        });
        const cacheS = new AdvancedCache(ctxS);
        try {
            await cacheS.initialize();
            const y = await cacheS.get('t2');
            assert.strictEqual(y, null, 'Strict mode should reject entry with malformed tags');
            assert.ok(cacheS._metrics.persistentRejected >= 1, 'persistentRejected should increment for malformed tags in strict mode');
        } finally {
            await cacheS.dispose();
        }
    });

    await scenario('Invalid key names are preserved but do not crash', async () => {
        configValues['explorerDates.persistentCache'] = true;
        const ctx = createExtensionContext();
        const weirdKey = 'weird\0key';
        const entries = {};
        entries[weirdKey] = { data: 'z', metadata: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000000 } };
        await ctx.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, entries);

        const cache = new AdvancedCache(ctx);
        try {
            await cache.initialize();
            const z = await cache.get(weirdKey);
            assert.strictEqual(z, 'z', 'Weird key names should be preserved and loadable');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Strict mode rejects oversized persisted entries and timestamps and increments rejection metric', async () => {
        // Small budget to make size limits small
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 1; // MB
        configValues['explorerDates.strictPersistentCacheValidation'] = true;

        const ctx = createExtensionContext();
        const hugeSz = 50 * 1024 * 1024; // 50MB
        const futureTs = Date.now() + (2 * 365 * 24 * 60 * 60 * 1000); // 2 years in future

        const entries = {
            huge: { data: 'hugeval', metadata: { sz: hugeSz, ts: Date.now(), la: Date.now(), ttl: 1000000 } },
            future: { data: 'future', metadata: { sz: 2, ts: futureTs, la: Date.now(), ttl: 1000000 } }
        };

        await ctx.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, entries);
        const cache = new AdvancedCache(ctx);
        try {
            await cache.initialize();
            // both entries should be rejected in strict mode
            const hv = await cache.get('huge');
            const fv = await cache.get('future');
            assert.strictEqual(hv, null, 'Oversized entry should be rejected in strict mode');
            assert.strictEqual(fv, null, 'Future-dated entry should be rejected in strict mode');
            assert.ok(cache._metrics.persistentRejected >= 2, 'persistentRejected should count the two rejected entries');
        } finally {
            await cache.dispose();
        }
    });
    await scenario('Large persisted snapshot loads without crashing and obeys memory budget', async () => {
        configValues['explorerDates.persistentCache'] = true;
        // Keep a small budget so we force evictions while loading
        configValues['explorerDates.maxMemoryUsage'] = 5; // 5 MB

        const context = createExtensionContext();

        // Build a large snapshot (several hundred small entries)
        const entries = {};
        for (let i = 0; i < 800; i++) {
            entries[`k${i}`] = { data: `value-${i}`, metadata: { sz: 4, ts: Date.now(), la: Date.now(), ttl: 1000 * 60 * 60 } };
        }

        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, entries);

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            const stats = cache.getStats();
            assert.ok(stats.persistentLoads >= 1, 'Persistent loads should have occurred');
            // Ensure we're not loading absurdly more than the memory budget allows
            assert.ok(stats.memoryItems <= 800, 'Loaded memory items should be bounded by snapshot size');
            assert.ok(Number(stats.memoryUsage) <= (5 * 1024 * 1024), 'Memory usage should respect maxMemoryUsage limit (bytes)');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Concurrent saves and slow storage do not corrupt snapshot', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();

        // Make update slow so concurrent saves overlap
        context.globalState.update = async function (key, value) {
            // simulate async write latency
            await new Promise((resolve) => setTimeout(resolve, 50));
            this._store.set(key, value);
            this._data[key] = value;
        };

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            // Add many keys rapidly
            for (let i = 0; i < 50; i++) {
                await cache.set(`con-${i}`, `v${i}`);
            }

            // Trigger multiple concurrent saves
            await Promise.all([cache._savePersistentCache(), cache._savePersistentCache(), cache._savePersistentCache()]);

            // Final snapshot should contain at least the last key
            const snapshot = context.globalState.get(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {});
            assert.ok(Object.prototype.hasOwnProperty.call(snapshot, 'con-49'), 'Latest key should be present after concurrent saves');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Non-object persisted snapshot is ignored and counted as rejection', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();
        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, 'corrupted-string');

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            assert.ok(cache._metrics.persistentRejected >= 1, 'Non-object top-level snapshot should increment persistentRejected');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Oversized persisted entry is skipped when loading', async () => {
        // Keep a small budget so a large sz is considered oversized
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 1; // 1 MB

        const context = createExtensionContext();
        const hugeSize = 10 * 1024 * 1024; // 10 MB
        const entries = {
            huge: { data: 'hugeval', metadata: { sz: hugeSize, ts: Date.now(), la: Date.now(), ttl: 1000000 } },
            small: { data: 's', metadata: { sz: 2, ts: Date.now(), la: Date.now(), ttl: 1000000 } }
        };

        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, entries);

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            const huge = await cache.get('huge');
            const small = await cache.get('small');
            assert.strictEqual(huge, null, 'Oversized entry should not be loaded into memory');
            assert.strictEqual(small, 's', 'Small entry should be loaded');
        } finally {
            await cache.dispose();
        }
    });

    console.log('\nAll advanced cache edge-case scenarios passed');
    // Ensure we exit promptly after test completion instead of waiting the initial scheduleExit timeout
    try {
        scheduleExit(0, 0);
    } catch {
        require('./helpers/forceExit').scheduleExit(0, 0);
    }
})();