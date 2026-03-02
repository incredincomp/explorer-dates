#!/usr/bin/env node

const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

(async function debug() {
    const mock = createTestMock();
    const { configValues } = mock;

    // Require after installing the mock
    const { AdvancedCache } = require('../src/advancedCache');
    configValues['explorerDates.persistentCache'] = true;
    configValues['explorerDates.maxMemoryUsage'] = 50;

    const ctx = createExtensionContext();
    ctx.globalState.update = async function (key, value) {
        await new Promise(r => setTimeout(r, 50));
        this._store.set(key, value);
        this._data[key] = value;
    };

    const cache = new AdvancedCache(ctx);
    await cache.initialize();

    console.log('Adding keys...');
    for (let i = 0; i < 50; i++) {
        await cache.set(`con-${i}`, `v${i}`);
    }

    console.log('Triggering concurrent saves...');
    await Promise.all([cache._savePersistentCache(), cache._savePersistentCache(), cache._savePersistentCache()]);

    console.log('Checking snapshot...');
    const snapshot = ctx.globalState.get(GLOBAL_STATE_KEYS.ADVANCED_CACHE, {});
    console.log('snapshot keys:', Object.keys(snapshot).slice(-5));
    console.log('done');

    await cache.dispose();
})();