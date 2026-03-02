#!/usr/bin/env node
/*
 * Unit tests for newly-added FileDateDecorationProvider helper APIs:
 *  - startProviderCallMonitoring / getProviderCallStats
 *  - forceRefreshAllDecorations
 *  - _getDecorationsAdvancedChunk (caching behavior)
 *  - dispose() idempotence
 *  - _ensureSecurityConfig applied on provideFileDecoration()
 */

const assert = require('assert');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

console.log('🧪 Running provider helper unit tests...');

async function main() {
  // Default mock environment
  const mock = createTestMock({
    config: {
      'explorerDates.security.allowedExtraPaths': [],
      'explorerDates.security.enforceWorkspaceBoundaries': true,
      'explorerDates.security.allowTestPaths': false
    }
  });

  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

  // Create provider instance
  const provider = new FileDateDecorationProvider();

  try {
    // --- startProviderCallMonitoring / getProviderCallStats ---
    provider.startProviderCallMonitoring();

    const files = [
      VSCodeUri.file(`${mock.workspaceRoot}/a.js`),
      VSCodeUri.file(`${mock.workspaceRoot}/b.js`),
      VSCodeUri.file(`${mock.workspaceRoot}/a.js`)
    ];

    for (const f of files) {
      try { await provider.provideFileDecoration(f); } catch { /* ignore test env errors */ }
    }

    const stats = provider.getProviderCallStats();
    assert(stats.totalCalls >= files.length, 'totalCalls should be at least number of provideFileDecoration calls');
    assert.strictEqual(stats.uniqueFiles, 2, 'uniqueFiles should reflect unique URIs');

    // --- forceRefreshAllDecorations fires the event emitter ---
    let fired = 0;
    const originalFire = provider._onDidChangeFileDecorations.fire.bind(provider._onDidChangeFileDecorations);
    provider._onDidChangeFileDecorations.fire = function (data) {
      fired++;
      return originalFire(data);
    };

    provider.forceRefreshAllDecorations();
    assert(fired >= 1, 'forceRefreshAllDecorations should call the onDidChangeFileDecorations emitter');

    // --- _getDecorationsAdvancedChunk: repeated calls return same cached value (possibly null) ---
    const c1 = await provider._getDecorationsAdvancedChunk();
    const c2 = await provider._getDecorationsAdvancedChunk();
    assert.strictEqual(c1, c2, '_getDecorationsAdvancedChunk should cache/load consistently');

    // --- _ensureSecurityConfig applied during provideFileDecoration ---
    // initial setting: empty allowedExtraPaths
    await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/security.js`));
    assert(Array.isArray(provider._securityAllowedExtraPaths), 'provider._securityAllowedExtraPaths should be an array');

    // update config to add an extra allowed path and verify provider picks it up
    const extraPath = `${mock.workspaceRoot}/../sandbox-fixtures`;
    mock.triggerConfigChange({ 'explorerDates.security.allowedExtraPaths': [extraPath], 'explorerDates.security.enforceWorkspaceBoundaries': false });
    // call provideFileDecoration again (provider reads security config at start of provideFileDecoration)
    await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/security.js`));
    const normalized = provider._securityAllowedExtraPaths.map(p => p && p.toString ? p.toString() : String(p));
    assert(normalized.some(p => p.includes('sandbox-fixtures')), 'Updated allowed path should be tracked by provider');

    // --- dispose idempotence ---
    await provider.dispose();
    assert(provider._isDisposed === true, 'provider._isDisposed should be true after dispose');
    // second dispose should be a no-op (not throw)
    await provider.dispose();

    console.log('\n✅ Provider helper unit tests passed');
    scheduleExit(0, 0);
  } catch (err) {
    console.error('\n❌ Provider helper unit tests failed:', err && err.message ? err.message : err);
    try { provider.dispose(); } catch {}
    scheduleExit(0, 1);
  } finally {
    mock.dispose();
  }
}

main();
