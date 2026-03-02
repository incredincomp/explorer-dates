#!/usr/bin/env node
/*
 * Extra provider tests covering:
 *  - Advanced chunk caching & error handling
 *  - Decoration-provider helper fallback (no-throw)
 *  - Provider monitoring reset behavior
 *  - Watcher fallback integration via decorationsAdvanced
 */

const assert = require('assert');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { registerFeatureFlagsGlobal } = require('../src/utils/featureFlagsBridge');

console.log('🧪 Running provider extra-case tests...');

async function testAdvancedChunkCaching() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // stub featureFlags.decorationsAdvanced to return an object initially
  const ff = {
    decorationsAdvanced: async () => ({ marker: 'ok' })
  };
  registerFeatureFlagsGlobal(ff);

  const c1 = await provider._getDecorationsAdvancedChunk();
  assert(c1 && c1.marker === 'ok', 'should load decorationsAdvanced chunk');

  // change the underlying stub to throw — provider should still return cached value
  ff.decorationsAdvanced = async () => { throw new Error('boom'); };
  const c2 = await provider._getDecorationsAdvancedChunk();
  assert.strictEqual(c2, c1, 'cached chunk should be returned even if loader starts failing');

  // clear cache and ensure failed loader yields null (safe fallback)
  provider._decorationsAdvancedChunk = null;
  const c3 = await provider._getDecorationsAdvancedChunk();
  assert.strictEqual(c3, null, 'failed chunk load should return null safely');

  // cleanup
  registerFeatureFlagsGlobal(null);
  await provider.dispose();
  mock.dispose();
}

async function testDecorationHelperFallback() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Force the in-memory helper to throw and the lazy-load promise to reject
  provider.U = { provideDecoration: () => { throw new Error('helper-bomb'); } };
  provider._decorationHelperLoading = Promise.reject(new Error('lazy-load-fail'));
  // avoid unhandled rejection noise
  provider._decorationHelperLoading.catch(() => {});

  const result = await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/file.js`));
  assert(typeof result === 'undefined', 'provideFileDecoration must not throw when helper and lazy-load fail');

  await provider.dispose();
  mock.dispose();
}

async function testMonitoringResetBehavior() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Start monitoring and invoke provider twice
  provider.startProviderCallMonitoring();
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/a.js`)).catch(() => {});
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/b.js`)).catch(() => {});
  let stats = provider.getProviderCallStats();
  assert(stats.totalCalls >= 2, 'monitoring should count calls');

  // Starting monitoring again resets counters (current implementation resets Vt)
  provider.startProviderCallMonitoring();
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/c.js`)).catch(() => {});
  stats = provider.getProviderCallStats();
  assert.strictEqual(stats.totalCalls, 1, 're-starting monitoring resets the internal counter');

  await provider.dispose();
  mock.dispose();
}

async function testWatcherFallbackIntegration() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Register a featureFlags global that exposes decorationsAdvanced.createFallbackWatcher
  const ff = {
    decorationsAdvanced: async () => ({
      createFallbackWatcher: async (p, pattern, label) => ({ pattern, label, dispose: () => {}, onDidChange: () => ({ dispose: () => {} }) })
    })
  };
  registerFeatureFlagsGlobal(ff);

  // Load watcher-manager chunk and call its _createFallbackWatcher
  const { createWatcherManager } = require('../src/chunks/watcher-manager-chunk');
  const wm = createWatcherManager(provider);

  const watcher = await wm._createFallbackWatcher('**/*.js', 'test-label');
  assert(watcher && watcher.pattern === '**/*.js' && watcher.label === 'test-label', 'should get fallback watcher from decorationsAdvanced chunk');

  // cleanup
  registerFeatureFlagsGlobal(null);
  await provider.dispose();
  mock.dispose();
}

async function testMonitoringRestoreOnDispose() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Start monitoring and capture original
  provider.startProviderCallMonitoring();
  const original = provider._providerMonitoringOriginal;
  assert(typeof original === 'function', 'original provideFileDecoration should be stored');

  // Ensure wrapper is active
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/x.js`)).catch(() => {});
  const stats1 = provider.getProviderCallStats();
  assert(stats1.totalCalls >= 1, 'monitoring should increment counters while wrapped');

  // Dispose should restore original function
  await provider.dispose();
  assert(provider._providerMonitoringWrapped === false, 'monitoring wrapped flag should be cleared on dispose');
  assert(provider._providerMonitoringOriginal === null, 'stored original should be cleared after dispose');
  assert(provider.provideFileDecoration === original, 'provideFileDecoration should be restored to original on dispose');

  mock.dispose();
}

async function testDecorationsAdvancedClearedOnDispose() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Prime a cached decorationsAdvanced value
  const ff = { decorationsAdvanced: async () => ({ marker: 'ok' }) };
  registerFeatureFlagsGlobal(ff);
  const c = await provider._getDecorationsAdvancedChunk();
  assert(c && c.marker === 'ok', 'should load chunk');

  // Dispose should clear cached references
  await provider.dispose();
  assert(provider._decorationsAdvancedChunk === null, '_decorationsAdvancedChunk should be null after dispose');
  assert(provider._decorationsAdvancedChunkPromise === null, '_decorationsAdvancedChunkPromise should be null after dispose');

  registerFeatureFlagsGlobal(null);
  mock.dispose();
}

async function testSecurityAllowedPathsSanitization() {
  const mock = createTestMock({
    config: {
      'explorerDates.security.allowedExtraPaths': ["/valid/path", 42, null, {}, '/another']
    }
  });
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // ensure security config is applied
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/file.js`)).catch(() => {});
  assert(Array.isArray(provider._securityAllowedExtraPaths), 'allowedExtraPaths should be an array');
  assert(provider._securityAllowedExtraPaths.every(p => typeof p === 'string'), 'all entries should be strings after sanitization');
  assert(provider._securityAllowedExtraPaths.includes('/valid/path'), 'valid string path should be present');
  assert(provider._securityAllowedExtraPaths.includes('/another'), 'second valid path should be present');

  await provider.dispose();
  mock.dispose();
}

// Execute tests sequentially
(async () => {
  try {
    await testAdvancedChunkCaching();
    console.log('  ✓ Advanced chunk caching/failure');

    await testDecorationHelperFallback();
    console.log('  ✓ Decoration-helper fallback');

    await testMonitoringResetBehavior();
    console.log('  ✓ Provider monitoring reset behavior');

    await testWatcherFallbackIntegration();
    console.log('  ✓ Watcher fallback integration');

    await testMonitoringRestoreOnDispose();
    console.log('  ✓ Monitoring restore on dispose');

    await testDecorationsAdvancedClearedOnDispose();
    console.log('  ✓ DecorationsAdvanced cache cleared on dispose');

    await testSecurityAllowedPathsSanitization();
    console.log('  ✓ Security allowed paths sanitization');

    console.log('\n✅ All extra provider tests passed');
    scheduleExit(0, 0);
  } catch (err) {
    console.error('\n❌ Extra provider tests failed:', err && err.message ? err.message : err);
    scheduleExit(0, 1);
  }
})();
