#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const { createMockVscode } = require('./helpers/mockVscode');
const mock = createMockVscode(); // provides a global `vscode` shim for provider tests
global.vscode = mock;

// Small helper to clear module from cache
function clearModule(p) {
    try { delete require.cache[require.resolve(p)]; } catch {}
}

async function testDynamicChunkLoad() {
    console.log('test: dynamic chunk load uses chunk-provided implementation');

    const chunkPath = path.join(__dirname, '..', 'src', 'chunks', 'file-date-provider-impl-export.js');
    // Ensure original cache is cleared
    clearModule(chunkPath);

    // Stub the chunk to export a fake provider
    const fakeProvider = function FakeProvider() { this._isFake = true; };
    fakeProvider.prototype.dispose = function () {};
    const fakeExports = { FileDateDecorationProvider: fakeProvider };
    require.cache[require.resolve(chunkPath)] = { id: chunkPath, filename: chunkPath, loaded: true, exports: fakeExports };

    clearModule(path.join(__dirname, '..', 'src', 'fileDateDecorationProvider'));
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const inst = new FileDateDecorationProvider();
    assert.ok(inst && inst._isFake === true, 'Expected dynamic chunk to provide fake implementation');

    // Cleanup - dispose provider to avoid leaving background timers/watchers active
    try { inst?.dispose?.(); } catch { /* ignore */ }
    delete require.cache[require.resolve(chunkPath)];
    console.log('\t✅ dynamic chunk load works');
}

async function testFallbackToLocalImpl() {
    console.log('test: fallback to local implementation when chunk exports missing provider');
    const chunkPath = path.join(__dirname, '..', 'src', 'chunks', 'file-date-provider-impl-export.js');

    // Stub the chunk to export empty object (no provider)
    const emptyExports = {};
    require.cache[require.resolve(chunkPath)] = { id: chunkPath, filename: chunkPath, loaded: true, exports: emptyExports };

    // Reload provider module to pick up stubbed chunk resolution
    clearModule(path.join(__dirname, '..', 'src', 'fileDateDecorationProvider'));
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    const inst = new FileDateDecorationProvider();
    // Local implementation sets _instanceId and _logger; check for one of those
    assert.ok(inst && (typeof inst._instanceId === 'string' || typeof inst._logger === 'object'), 'Expected fallback to local implementation');

    // Cleanup - dispose provider instance so background timers/watchers stop
    try { inst?.dispose?.(); } catch { /* ignore */ }
    delete require.cache[require.resolve(chunkPath)];
    console.log('\t✅ fallback to local implementation works');
}

(async () => {
    try {
        await testDynamicChunkLoad();
        await testFallbackToLocalImpl();
        console.log('\nAll wrapper tests passed');

        // Additional regression test: localization initialization should be resilient
        // when workspace.onDidChangeConfiguration is missing (previously threw).
        try {
            const original = mock.workspace.onDidChangeConfiguration;
            mock.workspace.onDidChangeConfiguration = undefined;
            clearModule(path.join(__dirname, '..', 'src', 'chunks', 'localization-core'));
            const { getLocalization } = require('../src/chunks/localization-core');
            const l10n = getLocalization();
            assert.strictEqual(l10n.getString('now'), 'now');
            mock.workspace.onDidChangeConfiguration = original;
            console.log('\t✅ localization resilience check passed');
        } catch (err) {
            console.error('localization resilience check failed:', err);
            throw err;
        }
    } catch (e) {
        console.error('Wrapper tests failed:', e);
        process.exit(1);
    } finally {
        // Ensure mock disposed
        mock.dispose();
    }
})();
