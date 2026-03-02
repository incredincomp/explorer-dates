#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..', 'tests');

const DEFAULTS = {
  MEMORY_SOAK_ITERATIONS: '2000',
  MEMORY_SOAK_DELAY_MS: '0',
  MEMORY_SOAK_MAX_DELTA_MB: '12',
  MEMORY_SOAK_CAPTURE_SNAPSHOTS: '0'
};

function listMemoryTests() {
  if (!fs.existsSync(TESTS_DIR)) return [];
  return fs.readdirSync(TESTS_DIR)
    .filter(f => /^test-memory.*\.js$/.test(f))
    .sort();
}

function envWithDefaults() {
  const env = Object.assign({}, process.env);
  for (const k of Object.keys(DEFAULTS)) {
    env[k] = process.env[k] || DEFAULTS[k];
  }
  return env;
}

function runTests(tests) {
  if (!tests.length) {
    console.log('⚠️  No memory tests found.');
    return 0;
  }

  const env = envWithDefaults();
  console.log('🔧 Running memory tests with settings:');
  console.log(`   MEMORY_SOAK_ITERATIONS=${env.MEMORY_SOAK_ITERATIONS}`);
  console.log(`   MEMORY_SOAK_DELAY_MS=${env.MEMORY_SOAK_DELAY_MS}`);
  console.log(`   MEMORY_SOAK_MAX_DELTA_MB=${env.MEMORY_SOAK_MAX_DELTA_MB}`);
  console.log(`   MEMORY_SOAK_CAPTURE_SNAPSHOTS=${env.MEMORY_SOAK_CAPTURE_SNAPSHOTS}`);
  console.log('');

  for (let i = 0; i < tests.length; i++) {
    const name = tests[i];
    const full = path.join(TESTS_DIR, name);
    console.log(`🧪 [${i + 1}/${tests.length}] Running ${name} (GC enabled)...`);
    const res = spawnSync(process.execPath, ['--expose-gc', full], { stdio: 'inherit', env });
    if (res.error) {
      console.error('❌ Error launching test:', res.error.message || res.error);
      return 1;
    }
    if (res.status !== 0) {
      console.error(`❌ Memory test failed (${name}) with exit code ${res.status}`);
      return res.status || 1;
    }
  }

  console.log('✅ All memory tests passed.');
  return 0;
}

if (require.main === module) {
  const tests = listMemoryTests();
  process.exit(runTests(tests));
}
