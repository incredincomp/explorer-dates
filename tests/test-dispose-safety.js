#!/usr/bin/env node
const assert = require('assert');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

console.log('🧪 dispose safety & monitoring tests...');

async function main() {
  const mock = createTestMock();
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

  const provider = new FileDateDecorationProvider();

  // Ensure provideFileDecoration after dispose is safe
  await provider.dispose();
  let threw = false;
  try {
    const res = await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/post-dispose.js`));
    // should not throw and should return undefined as provider is disposed
    assert.strictEqual(res, undefined);
  } catch {
    threw = true;
  }
  assert.strictEqual(threw, false, 'provideFileDecoration after dispose should not throw');

  // Timer cancellation: set fake timers and confirm dispose clears them
  const p2 = new FileDateDecorationProvider();
  p2._telemetryReportTimer = setTimeout(() => {}, 100000);
  p2._refreshTimer = setInterval(() => {}, 100000);
  p2._watcherCleanupTimer = setTimeout(() => {}, 100000);

  assert(p2._telemetryReportTimer, 'telemetry timer should be set');
  assert(p2._refreshTimer, 'refresh timer should be set');

  await p2.dispose();
  assert.strictEqual(p2._telemetryReportTimer, null, '_telemetryReportTimer must be cleared on dispose');
  assert.strictEqual(p2._refreshTimer, null, '_refreshTimer must be cleared on dispose');
  assert.strictEqual(p2._watcherCleanupTimer, null, '_watcherCleanupTimer must be cleared on dispose');

  // startProviderCallMonitoring after dispose should be a no-op
  const p3 = new FileDateDecorationProvider();
  await p3.dispose();
  p3.startProviderCallMonitoring();
  assert(!p3._providerMonitoringWrapped, 'startProviderCallMonitoring after dispose should be a no-op');

  // Repeated start/stop monitoring cycles should not stack wrappers
  const p4 = new FileDateDecorationProvider();
  p4.startProviderCallMonitoring();
  const orig = p4._providerMonitoringOriginal;
  p4.startProviderCallMonitoring();
  assert.strictEqual(p4._providerMonitoringOriginal, orig, 'original monitoring function should remain stable across restarts');

  await p4.dispose();

  mock.dispose();
  console.log('\n✅ dispose safety & monitoring tests passed');
  scheduleExit(0, 0);
}

main().catch((err) => {
  console.error('\n❌ dispose safety tests failed:', err && err.message ? err.message : err);
  scheduleExit(0, 1);
});
