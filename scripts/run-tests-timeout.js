#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..', 'tests');

function listTests() {
  const includeLong = process.env.RUN_LONG_TESTS === '1' || process.argv.includes('--include-long');
  return fs.readdirSync(TESTS_DIR)
    .filter(f => /^test-.*\.js$/.test(f))
    .filter(f => includeLong ? true : !/(long|stress|fuzz)/i.test(f))
    .sort();
}

const tests = listTests();
for (let i = 0; i < tests.length; i++) {
  const name = tests[i];
  const full = path.join(TESTS_DIR, name);
  console.log(`\n🧪 [${i+1}/${tests.length}] Running ${name} with 20s timeout...`);
  const res = spawnSync(process.execPath, [full], { stdio: 'inherit', timeout: 20000 });

  // spawnSync may set res.error on timeout with code ETIMEDOUT or return res.signal
  if (res.error) {
    if (res.error && res.error.code === 'ETIMEDOUT') {
      console.error(`⏱️ Test timed out (${name}) - ETIMEDOUT`);
      const res2 = spawnSync(process.execPath, [full], { encoding: 'utf8', timeout: 10000 });
      console.error('--- stdout ---');
      console.error(res2.stdout || '<no stdout>');
      console.error('--- stderr ---');
      console.error(res2.stderr || '<no stderr>');
      process.exit(2);
    }
    console.error('❌ Error launching test:', res.error.message || res.error);
    process.exit(1);
  }

  if (res.signal === 'SIGTERM' || res.signal === 'SIGKILL') {
    console.error(`⏱️ Test timed out (${name}) - killed with signal ${res.signal}`);
    const res2 = spawnSync(process.execPath, [full], { encoding: 'utf8', timeout: 10000 });
    console.error('--- stdout ---');
    console.error(res2.stdout || '<no stdout>');
    console.error('--- stderr ---');
    console.error(res2.stderr || '<no stderr>');
    process.exit(2);
  }

  if (res.status !== 0) {
    console.error(`❌ Test failed (${name}) with exit code ${res.status}`);
    process.exit(res.status || 1);
  }
  console.log(`✅ ${name} passed`);
}

console.log('\n✅ All tests ran within timeout');
process.exit(0);
