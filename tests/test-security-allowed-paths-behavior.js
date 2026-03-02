#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { SecureFileOperations } = require('../src/utils/securityUtils');

console.log('🧪 security allowed-extra-paths behavior tests...');

async function main() {
  const mock = createTestMock({
    config: {
      'explorerDates.security.allowedExtraPaths': [],
      'explorerDates.security.enforceWorkspaceBoundaries': true
    }
  });

  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();

  // Add an outside path to allowedExtraPaths and ensure provider honors it
  const outside = path.join(mock.workspaceRoot, '..', 'external-fixture');
  mock.triggerConfigChange({
    'explorerDates.security.allowedExtraPaths': [outside],
    'explorerDates.security.enforceWorkspaceBoundaries': true
  });

  // provider reads security config at the start of provideFileDecoration/_ensureSecurityConfig
  await provider.provideFileDecoration(VSCodeUri.file(`${outside}/file.txt`));
  assert(Array.isArray(provider._securityAllowedExtraPaths), 'allowedExtraPaths should be an array');
  const normalized = provider._securityAllowedExtraPaths.map(String);
  assert(normalized.some(p => p.includes('external-fixture')), 'allowedExtraPaths should contain the outside path after config change');

  // Now assert SecureFileOperations considers the outside path valid when passed the allowed list
  const check = SecureFileOperations.validateFileUri(VSCodeUri.file(`${outside}/file.txt`), provider._securityAllowedExtraPaths);
  assert.strictEqual(check.isValid, true, 'validateFileUri should accept a path included in allowedExtraPaths');

  // Dangerous/invalid values are sanitized: trigger with bad entries
  mock.triggerConfigChange({ 'explorerDates.security.allowedExtraPaths': ['\u0000bad\x00path', 42, null, '/valid/one'] });
  await provider.provideFileDecoration(VSCodeUri.file(`${mock.workspaceRoot}/noop.js`));
  assert(Array.isArray(provider._securityAllowedExtraPaths), 'sanitized allowedExtraPaths should be an array');
  assert(provider._securityAllowedExtraPaths.every(p => typeof p === 'string'), 'sanitization should coerce entries to strings or drop invalids');
  assert(provider._securityAllowedExtraPaths.includes('/valid/one') || provider._securityAllowedExtraPaths.some(s => s.includes('valid/one')),
    'valid entries should remain after sanitization');

  await provider.dispose();
  mock.dispose();

  console.log('\n✅ security allowed-extra-paths tests passed');
  scheduleExit(0, 0);
}

main().catch((err) => {
  console.error('\n❌ security allowed-extra-paths tests failed:', err && err.message ? err.message : err);
  scheduleExit(0, 1);
});
