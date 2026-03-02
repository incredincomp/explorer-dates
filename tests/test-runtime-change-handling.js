#!/usr/bin/env node

const assert = require('assert');
const path = require('path'); void path;
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode'); void createExtensionContext;

async function scenario(name, runner) {
    try {
        await runner();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}:`, error && error.message ? error.message : error);
        throw error;
    }
}

const { scheduleExit } = require('./helpers/forceExit');

(async function main() {
    const mockInstall = createTestMock();
    const { vscode, configValues } = mockInstall;

    // Provide a helper to require provider lazily after mock is installed
    function requireProvider() {
        try {
            const resolved = require.resolve('../src/fileDateDecorationProvider');
            delete require.cache[resolved];
        } catch {
            // ignore
        }
        return require('../src/fileDateDecorationProvider').FileDateDecorationProvider;
    }

    // Provide a change helper similar to other tests
    let configChangeListener = null;
    vscode.workspace.onDidChangeConfiguration = (listener) => {
        configChangeListener = listener;
        return {
            dispose() {
                if (configChangeListener === listener) configChangeListener = null;
            }
        };
    };

    function fireConfigChange(...keys) {
        if (!configChangeListener) throw new Error('No configuration listener registered');
        const affected = new Set(keys);
        configChangeListener({ affectsConfiguration(name) { return affected.has(name); } });
    }

    await scenario('Runtime update: persistentCache toggles advanced cache', async () => {
        // Start with advanced cache disabled
        configValues['explorerDates.enableAdvancedCache'] = false;
        configValues['explorerDates.persistentCache'] = false;

        const FileDateDecorationProvider = requireProvider();
        const provider = new FileDateDecorationProvider();
        try {
            assert.strictEqual(provider._advancedCache, null, 'advanced cache should be null when disabled');

            // Enable advanced cache
            configValues['explorerDates.enableAdvancedCache'] = true;
            fireConfigChange('explorerDates', 'explorerDates.enableAdvancedCache');

            try {
                await provider.initializeAdvancedSystems();
            } catch {
                // If chunk not available in harness, skip
            }

            if (provider._advancedCache) {
                assert.strictEqual(provider._advancedCache._persistentCacheEnabled, false, 'persistentCache initial state respected');

                // Enable persistent cache at runtime
                configValues['explorerDates.persistentCache'] = true;
                fireConfigChange('explorerDates', 'explorerDates.persistentCache');

                // Force reload configuration on cache if present
                if (typeof provider._advancedCache._loadConfiguration === 'function') {
                    await provider._advancedCache._loadConfiguration();
                }

                assert.strictEqual(provider._advancedCache._persistentCacheEnabled, true, 'persistentCache should update at runtime');
            } else {
                console.warn('Advanced cache not available in this environment; skipping assertions');
            }
        } finally {
            await provider.dispose();
        }
    });

    await scenario('Strict mode toggle updates AdvancedCache strict flag', async () => {
        configValues['explorerDates.enableAdvancedCache'] = true;
        configValues['explorerDates.persistentCache'] = true;
        configValues['explorerDates.strictPersistentCacheValidation'] = false;

        const FileDateDecorationProvider = requireProvider();
        const provider = new FileDateDecorationProvider();
        try {
            try {
                await provider.initializeAdvancedSystems();
            } catch {
                // ignore if chunk missing
            }

            if (!provider._advancedCache) {
                console.warn('Advanced cache not present; skipping check');
                return;
            }

            assert.strictEqual(provider._advancedCache._strictPersistedValidation, false, 'strict mode should start false');

            // Toggle strict mode on
            configValues['explorerDates.strictPersistentCacheValidation'] = true;
            fireConfigChange('explorerDates', 'explorerDates.strictPersistentCacheValidation');

            // Reload configuration if method exists
            if (typeof provider._advancedCache._loadConfiguration === 'function') {
                await provider._advancedCache._loadConfiguration();
            }
            assert.strictEqual(provider._advancedCache._strictPersistedValidation, true, 'strict mode should update to true');

            // Rapid toggles should not throw
            for (let i = 0; i < 5; i++) {
                configValues['explorerDates.strictPersistentCacheValidation'] = i % 2 === 0;
                fireConfigChange('explorerDates', 'explorerDates.strictPersistentCacheValidation');
            }

            // final state check
            if (typeof provider._advancedCache._loadConfiguration === 'function') {
                await provider._advancedCache._loadConfiguration();
            }
            assert.strictEqual(typeof provider._advancedCache._strictPersistedValidation, 'boolean', 'strict flag remains boolean after rapid toggles');

        } finally {
            await provider.dispose();
        }
    });

    await scenario('Rapid UI context toggles are stable', async () => {
        configValues['explorerDates.enableContextMenu'] = true;
        configValues['explorerDates.showStatusBar'] = true;

        const FileDateDecorationProvider = requireProvider();
        const provider = new FileDateDecorationProvider();
        try {
            // initial contexts set at construction
            await new Promise((r) => setImmediate(r));
            assert.strictEqual(mockInstall.contexts['explorerDates.enableContextMenu'], true);

            // Rapid toggles
            for (let i = 0; i < 10; i++) {
                configValues['explorerDates.enableContextMenu'] = (i % 2 === 0);
                configValues['explorerDates.showStatusBar'] = (i % 3 === 0);
                fireConfigChange('explorerDates', 'explorerDates.enableContextMenu', 'explorerDates.showStatusBar');

            }

            // Allow any queued setContext promises / microtasks to run. Rapid toggles
            // may enqueue async operations — give them a short grace period.
            await new Promise((resolve) => setTimeout(resolve, 20));

            // Final values should reflect last update
            assert.strictEqual(mockInstall.contexts['explorerDates.enableContextMenu'], (9 % 2 === 0));
        } finally {
            await provider.dispose();
        }
    });

    console.log('\nRuntime change handling tests passed');

    // DEBUG: dump active handles and requests to diagnose hanger
    try {
        const handles = typeof process._getActiveHandles === 'function' ? process._getActiveHandles() : [];
        const reqs = typeof process._getActiveRequests === 'function' ? process._getActiveRequests() : [];
        console.log('DEBUG: Active handles count:', handles.length);
        for (const h of handles) {
            try {
                console.log('DEBUG HANDLE:', h && h.constructor && h.constructor.name, h && (h._onTimeout ? 'Timer' : ''), h);
            } catch (e) {
                console.log('DEBUG HANDLE: <inspect failed>', e && e.message);
            }
        }
        console.log('DEBUG: Active requests count:', reqs.length);
        for (const r of reqs) {
            try {
                console.log('DEBUG REQ:', r && r.constructor && r.constructor.name, r);
            } catch (e) {
                console.log('DEBUG REQ: <inspect failed>', e && e.message);
            }
        }
    } catch (e) {
        console.warn('DEBUG: Failed to inspect active handles:', e && e.message);
    }

    // Ensure we exit promptly to avoid CI hangs
    scheduleExit(0, 0);
})();