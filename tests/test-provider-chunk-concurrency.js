#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const { registerFeatureFlagsGlobal } = require('../src/utils/featureFlagsBridge');
const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
const { scheduleExit } = require('./helpers/forceExit');

console.log('🧪 provider chunk concurrency tests...');

async function testConcurrentChunkLoadDedup() {
  const mock = createTestMock();
  const provider = new FileDateDecorationProvider();

  let calls = 0;
  const ff = {
    decorationsAdvanced: async () => {
      calls++;
      // simulate slow load
      await new Promise(r => setTimeout(r, 30));
      return { ok: true };
    }
  };
  registerFeatureFlagsGlobal(ff);

  const p1 = provider._getDecorationsAdvancedChunk();
  const p2 = provider._getDecorationsAdvancedChunk();
  const [r1, r2] = await Promise.all([p1, p2]);

  assert.strictEqual(calls, 1, 'decorationsAdvanced loader should be invoked once (deduped)');
  assert.strictEqual(r1, r2, 'both concurrent calls should return same chunk object');

  registerFeatureFlagsGlobal(null);
  await provider.dispose();
  mock.dispose();
}

async function testRetryAfterFailure() {
  const mock = createTestMock();
  const provider = new FileDateDecorationProvider();

  let attempt = 0;
  const ff = {
    decorationsAdvanced: async () => {
      attempt++;
      if (attempt === 1) throw new Error('transient');
      return { recovered: true };
    }
  };
  registerFeatureFlagsGlobal(ff);

  // first attempt should gracefully return null (failure handled)
  const first = await provider._getDecorationsAdvancedChunk();
  assert.strictEqual(first, null, 'first failing load should return null');

  // second attempt should succeed
  const second = await provider._getDecorationsAdvancedChunk();
  assert(second && second.recovered === true, 'second attempt should recover and return chunk');

  registerFeatureFlagsGlobal(null);
  await provider.dispose();
  mock.dispose();
}

(async () => {
  try {
    await testConcurrentChunkLoadDedup();
    console.log('  ✓ concurrent chunk-load dedup');

    await testRetryAfterFailure();
    console.log('  ✓ retry-after-failure behavior');

    console.log('\n✅ provider chunk concurrency tests passed');
    scheduleExit(0, 0);
  } catch (err) {
    console.error('\n❌ provider chunk concurrency tests failed:', err && err.message ? err.message : err);
    scheduleExit(0, 1);
  }
})();