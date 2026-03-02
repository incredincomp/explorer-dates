#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const path = require('path');

const sampleWorkspaceRoot = path.join(__dirname, 'fixtures', 'sample-workspace');
const mockInstall = createTestMock({ sampleWorkspace: sampleWorkspaceRoot });
const { configValues } = mockInstall;

const { AdvancedCache } = require('../src/advancedCache');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

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
    // Ensure test process will exit even if something hangs
    scheduleExit(120000);

    await scenario('Persistent cache save/load roundtrip', async () => {
        // Ensure persistent cache enabled and reasonable memory limit
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();
        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            // Set and force-save
            await cache.set('a', { value: 123 });
            await cache._savePersistentCache();

            // New instance should load persisted value
            const cache2 = new AdvancedCache(context);
            try {
                await cache2.initialize();
                const val = await cache2.get('a');
                assert.deepStrictEqual(val, { value: 123 }, 'Persisted value should roundtrip via globalState');
                assert.strictEqual(cache2._metrics.persistentLoads, 1, 'Persistent loads metric should increment');
            } finally {
                await cache2.dispose();
            }
        } finally {
            await cache.dispose();
        }
    });

    await scenario('resetRuntimeOnly preserves persistent snapshot', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();
        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            await cache.set('persisted', 'ok');
            await cache._savePersistentCache();

            // Confirm snapshot exists in globalState
            const snapshot = context.globalState.get(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {});
            assert.ok(snapshot && Object.prototype.hasOwnProperty.call(snapshot, 'persisted'), 'Snapshot should contain persisted key');

            // Reset runtime only should clear memory but keep persisted snapshot
            await cache.resetRuntimeOnly();
            assert.strictEqual(cache.getStats().memoryItems, 0, 'Memory cache should be cleared after resetRuntimeOnly');
            const snapshotAfter = context.globalState.get(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {});
            assert.ok(snapshotAfter && Object.prototype.hasOwnProperty.call(snapshotAfter, 'persisted'), 'Persistent snapshot should remain after resetRuntimeOnly');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Eviction triggered when exceeding max memory', async () => {
        // Set maximum memory small to force eviction
        configValues['explorerDates.maxMemoryUsage'] = 1; // 1 MB
        const context = createExtensionContext();
        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();

            // Small entry
            await cache.set('k1', 'v1');
            // Large entry (~2MB estimated)
            const big = 'x'.repeat(1024 * 1024);
            await cache.set('big', big);
            // Another small entry to provoke further eviction
            await cache.set('k2', 'v2');

            const stats = cache.getStats();
            assert.ok(stats.evictions > 0, 'Evictions should have occurred when adding large items');

            // Ensure that earlier small key may have been evicted
            const v1 = await cache.get('k1');
            // v1 may be null if evicted; assert that either v1 is null or still present but eviction occurred
            assert.ok(v1 === null || v1 === 'v1', 'k1 should be either evicted or present depending on eviction timing');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Persistent save failure does not throw', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        // Create context whose globalState update will throw
        const context = createExtensionContext();
        context.globalState.update = async function () {
            throw new Error('simulated storage failure');
        };

        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            await cache.set('z', 'zval');

            // invoking save should not throw and should not increment persistentSaves
            await cache._savePersistentCache();
            assert.strictEqual(cache._metrics.persistentSaves, 0, 'persistentSaves should not increment on failure');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Malformed persisted snapshots are tolerated', async () => {
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.maxMemoryUsage'] = 50; // MB

        const context = createExtensionContext();
        // Put malformed/corrupted data into persistent store via the public API
        await context.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {
            bad: { meta: 'not-a-metadata-object', data: 123 },
            ok: { data: 'value', metadata: { sz: 4, ts: Date.now(), la: Date.now(), ttl: 1000000 } }
        });

        const cache = new AdvancedCache(context);
        try {
            // Should not throw during initialize
            await cache.initialize();

            // Malformed entry is tolerated and will be normalized; both entries should be readable
            const bad = await cache.get('bad');
            const ok = await cache.get('ok');
            assert.strictEqual(bad, 123, 'Malformed entry should be tolerated and value preserved');
            assert.strictEqual(ok, 'value', 'Well-formed entry should be loaded');
            assert.ok(cache._metrics.persistentLoads >= 1, 'Persistent loads metric should increment when loading snapshot');
        } finally {
            await cache.dispose();
        }
    });

    await scenario('Eviction state persists in snapshot across restarts', async () => {
        // Force eviction by small memory budget
        configValues['explorerDates.maxMemoryUsage'] = 1; // 1 MB
        configValues['explorerDates.persistentCache'] = true;

        const context = createExtensionContext();
        const cache = new AdvancedCache(context);
        try {
            await cache.initialize();
            await cache.set('k1', 'v1');
            const big = 'x'.repeat(1024 * 1024);
            await cache.set('big', big);

            // Save current snapshot after eviction has occurred
            await cache._savePersistentCache();

            const snapshot = context.globalState.get(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {});
            // Debug: inspect persisted snapshot entries (help diagnose type issues)
            console.log('🔍 Persisted snapshot keys:', Object.keys(snapshot));
            console.log('🔍 snapshot.big (raw):', snapshot.big);
            console.log('🔍 typeof snapshot.big:', typeof snapshot.big);

            // The small item may have been evicted and thus not present in saved snapshot
            const hasBig = Object.prototype.hasOwnProperty.call(snapshot, 'big');
            assert.ok(hasBig, 'Large item should be present in persisted snapshot');

            // New cache initialized from same persistent snapshot should reflect persisted keys
            const cache2 = new AdvancedCache(context);
            try {
                await cache2.initialize();
                const v1 = await cache2.get('k1');
                const vbig = await cache2.get('big');
                assert.strictEqual(v1, null, 'Evicted small key should not be present after restart');
                assert.strictEqual(typeof vbig, 'string', 'Large key should be present after restart');
            } finally {
                await cache2.dispose();
            }
        } finally {
            await cache.dispose();
        }
    });

    console.log('\nAll advanced cache scenarios passed');
    // Ensure we exit promptly after test completion instead of waiting the initial scheduleExit timeout
    try {
        scheduleExit(0, 0);
    } catch {
        require('./helpers/forceExit').scheduleExit(0, 0);
    }
})();
