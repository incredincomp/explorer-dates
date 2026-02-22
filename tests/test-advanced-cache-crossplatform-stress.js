#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { GLOBAL_STATE_KEYS } = require('../src/constants');

function requireAdvancedCache() {
    delete require.cache[require.resolve('../src/advancedCache')];
    return require('../src/advancedCache').AdvancedCache;
}

async function runQuickFuzz(iterations = 300, strict = false, mockOptions = {}) {
    const mock = createTestMock(mockOptions);
    mock.configValues['explorerDates.persistentCache'] = true;
    mock.configValues['explorerDates.maxMemoryUsage'] = 50;
    mock.configValues['explorerDates.strictPersistentCacheValidation'] = !!strict;

    let rejected = 0;

    for (let i = 0; i < iterations; i++) {
        const ctx = createExtensionContext();
        const entries = {};
        const count = Math.floor(Math.random() * 10) + 1;
        for (let k = 0; k < count; k++) {
            const key = `p_${i}_${k}`;
            // randomly create either valid or malformed
            if (Math.random() > 0.7) {
                entries[key] = 'broken';
            } else {
                entries[key] = { data: 'v', metadata: { sz: Math.floor(Math.random() * 20) + 1, ts: Date.now(), la: Date.now(), ttl: 1000000 } };
            }
        }
        await ctx.globalState.update(GLOBAL_STATE_KEYS.ADVANCED_CACHE, entries);

        const AdvancedCache = requireAdvancedCache();
        const cache = new AdvancedCache(ctx);
        try {
            await cache.initialize();
            rejected += cache._metrics.persistentRejected || 0;
        } finally {
            await cache.dispose();
        }
    }

    return rejected;
}

(async function main() {
    scheduleExit(300000);

    const platforms = [
        { name: 'linux', opts: {} },
        { name: 'web', opts: { uiKind: 2 } },
        { name: 'windows', opts: { sampleWorkspace: 'C:\\mock\\workspace', mockWorkspaceFileCount: 50000 } },
        { name: 'mac', opts: { sampleWorkspace: '/Users/mock/workspace' } }
    ];

    for (const p of platforms) {
        console.log(`Running cross-platform stress on ${p.name} (tolerant)...`);
        const tol = await runQuickFuzz(300, false, p.opts);
        console.log(`${p.name} tolerant rejected:`, tol);

        console.log(`Running cross-platform stress on ${p.name} (strict)...`);
        const strict = await runQuickFuzz(300, true, p.opts);
        console.log(`${p.name} strict rejected:`, strict);

        assert.ok(typeof tol === 'number' && typeof strict === 'number', 'Rejected counts should be numbers');
        assert.ok(strict >= tol, `Strict mode should reject at least as many as tolerant on ${p.name}`);
    }

    console.log('\nCross-platform stress tests passed');
    // Exit immediately on success to avoid waiting the scheduled timeout
    scheduleExit(0, 0);
})();