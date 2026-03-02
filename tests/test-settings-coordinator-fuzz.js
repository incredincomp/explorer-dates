#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
let getSettingsCoordinator;
const { scheduleExit } = require('./helpers/forceExit');

// Deterministic seeded RNG (mulberry32)
function makeRng(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

async function runSeed(seed) {
    const rng = makeRng(seed);
    const mock = createTestMock({ config: {}, workspaceFolders: [] });
    try {
        const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
        mock.vscode.workspace.getConfiguration = function(section, resource) {
            const cfg = originalGetConfiguration(section, resource);
            const originalUpdate = cfg.update.bind(cfg);
            cfg.update = async function(key, value, target) {
                await new Promise(r => setTimeout(r, Math.floor(rng() * 30) + 5));
                return originalUpdate(key, value, target);
            };
            return cfg;
        };

        getSettingsCoordinator = getSettingsCoordinator || require('../src/utils/settingsCoordinator').getSettingsCoordinator;
        const coordinator = getSettingsCoordinator({ forceNew: true });

        const keys = ['maxCacheSize', 'cacheTimeout', 'featureLevel'];
        const ops = [];

        for (let i = 0; i < 80; i++) {
            if (rng() < 0.3) {
                // multi-key transaction
                const a = Math.floor(rng() * keys.length);
                const b = Math.floor(rng() * keys.length);
                const entries = [];
                entries.push({ key: keys[a], value: Math.floor(rng() * 10000) });
                entries.push({ key: keys[b], value: Math.floor(rng() * 10000) });
                ops.push(coordinator.applySettings(entries, { scope: 'user' }));
            } else {
                const k = keys[Math.floor(rng() * keys.length)];
                const v = Math.floor(rng() * 10000);
                ops.push(coordinator.updateSetting(k, v, { scope: 'user' }));
            }
        }

        await Promise.all(ops);

        // extract final value per key (last applied in mock)
        const final = {};
        for (const u of mock.appliedUpdates) {
            final[u.key] = u.value;
        }
        return final;
    } finally {
        mock.dispose();
    }
}

async function testDeterministicFuzz() {
    const seed = 12345;
    const a = await runSeed(seed);
    const b = await runSeed(seed);
    assert.deepStrictEqual(a, b, 'Fuzz runs with same seed should produce identical final state');
}

async function main() {
    try {
        await testDeterministicFuzz();
        console.log('✅ SettingsCoordinator deterministic fuzz test passed');
    } catch (error) {
        console.error('❌ SettingsCoordinator deterministic fuzz test failed:', error);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
}

if (require.main === module) main();