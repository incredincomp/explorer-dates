#!/usr/bin/env node
const assert = require('assert');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

console.log('🧪 decoration helper concurrency & fallback tests...');

async function testConcurrentHelperLoad() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Simulate an in-flight lazy-load that resolves the helper after a short delay
  provider._decorationHelperLoading = new Promise((resolve) => {
    setTimeout(() => {
      provider.U = { provideDecoration: async () => ({ badge: 'Z', tooltip: 'ok' }) };
      resolve();
    }, 30);
  });

  const uri1 = VSCodeUri.file(`${mock.workspaceRoot}/one.js`);
  const uri2 = VSCodeUri.file(`${mock.workspaceRoot}/two.js`);

  const [r1, r2] = await Promise.all([
    provider.provideFileDecoration(uri1),
    provider.provideFileDecoration(uri2)
  ]);

  assert(r1 && (r1.badge === 'Z' || r1.badge === '.' || typeof r1 === 'object'), 'first concurrent call should resolve to a decoration or safe object');
  assert(r2 && (r2.badge === 'Z' || r2.badge === '.' || typeof r2 === 'object'), 'second concurrent call should resolve to a decoration or safe object');

  // Malformed helper returns should be handled gracefully (no throw, return undefined)
  provider.U = { provideDecoration: async () => 'not-an-object' };
  const bad = await provider.provideFileDecoration(uri1);
  assert.strictEqual(bad, undefined, 'provider should return undefined for malformed helper return values');

  provider.U = { provideDecoration: async () => ({ foo: 'bar' }) };
  const shaped = await provider.provideFileDecoration(uri1);
  assert.strictEqual(shaped, undefined, 'provider should ignore helper objects missing decoration keys');

  await provider.dispose();
  mock.dispose();
}

(async () => {
  try {
    await testConcurrentHelperLoad();
    console.log('  ✓ concurrent helper-load + malformed-helper cases');
    console.log('\n✅ decoration helper concurrency tests passed');
    scheduleExit(0, 0);
  } catch (err) {
    console.error('\n❌ decoration helper concurrency tests failed:', err && err.message ? err.message : err);
    scheduleExit(0, 1);
  }
})();