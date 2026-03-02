const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTestMock } = require('./helpers/mockVscode');

console.log('🔬 Testing package.json "when" clauses referencing config.explorerDates.* map to startup contexts...');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const whenClauses = [];

function collectWhen(node) {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (key === 'when' && typeof val === 'string') {
      whenClauses.push(val);
    } else if (typeof val === 'object') {
      collectWhen(val);
    }
  }
}
collectWhen(pkg.contributes || {});

const regex = /config\.explorerDates\.([a-zA-Z0-9_]+)/g;
const keys = new Set();
for (const clause of whenClauses) {
  let m;
  while ((m = regex.exec(clause)) !== null) {
    keys.add(m[1]);
  }
}

if (keys.size === 0) {
  console.log('No package.json when-clauses reference config.explorerDates.* — nothing to test.');
  require('./helpers/forceExit').scheduleExit(0, 0);
}

const nonBooleanKeys = new Set();

const mock = createTestMock();
const { configValues } = mock;

// Require provider after installing the mock so 'vscode' resolves to the mock
const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

function isBooleanKey(key) {
  // Quick heuristic: consult package.json configuration schema if available
  const props = pkg?.contributes?.configuration?.properties || {};
  const full = `explorerDates.${key}`;
  if (props[full] && typeof props[full].type === 'string') {
    return props[full].type === 'boolean';
  }
  // Fallback: assume boolean for common UI flags
  return ['enableContextMenu', 'showStatusBar', 'showWelcomeOnStartup', 'enableExtensionApi'].includes(key);
}

(async () => {
  for (const key of keys) {
    if (!isBooleanKey(key)) {
      // Collect non-boolean keys for a post-run warning to surface potential UI gating mistakes
      nonBooleanKeys.add(key);
      console.warn(`Skipping non-boolean or unknown key in when-clauses: ${key}`);
      continue;
    }

    // Test both true and false values
    for (const val of [true, false]) {
      configValues[`explorerDates.${key}`] = val;
      // Construct provider which should set initial context for boolean keys
      const provider = new FileDateDecorationProvider();
      try {
        // Allow any async setContext to run
        await new Promise((resolve) => setImmediate(resolve));
        const ctxValue = mock.contexts[`explorerDates.${key}`];
        assert.strictEqual(ctxValue, val, `Initial context for ${key} should be ${val}`);
      } finally {
        await provider.dispose();
        delete configValues[`explorerDates.${key}`];
      }
    }

    console.log(`  ✓ ${key} initial-context verified`);
  }

  if (nonBooleanKeys.size > 0) {
    console.warn('\n⚠️  The following when-clauses reference non-boolean configuration keys:');
    for (const k of nonBooleanKeys) {
      console.warn(`   - ${k}`);
    }
    console.warn('Non-boolean keys in when-clauses cannot be represented as simple contexts and may indicate incorrect UI gating. Please review these keys to ensure they are intended and handled by runtime code.');
  }

  mock.dispose();
  console.log('\n✅ package.json when-clauses -> runtime contexts audit passed');
  require('./helpers/forceExit').scheduleExit(0, 0);
})();