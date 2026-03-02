#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..', 'tests');
const EXCLUDE = new Set([
  'test-configuration-scenarios.js',
  'test-feature-gates.js',
  'test-bundle.js',
  'verify-bundle.js',
  'test-performance-baselines.js'
]);

// Per-test timeout (ms). Configure with TEST_TIMEOUT_MS env var; default 60s.
const TEST_TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS) || 60_000;

function listTests() {
  if (!fs.existsSync(TESTS_DIR)) return [];

  // Allow opt-in execution of long-running tests via environment variable
  // or command-line flag. By default, long tests (fuzz/long/stress) are skipped
  const includeLong = process.env.RUN_LONG_TESTS === '1' || process.argv.includes('--include-long');

  return fs.readdirSync(TESTS_DIR)
    .filter(f => /^test-.*\.js$/.test(f))
    .filter(f => !EXCLUDE.has(f))
    .filter(f => !/memory/i.test(f))
    .filter(f => includeLong ? true : !/(long|stress|fuzz)/i.test(f))
    .sort();
}

function runTests(tests) {
  if (!tests.length) {
    console.log('⚠️  No matching extra tests found.');
    return 0;
  }

  const failFast = process.env.TESTS_FAIL_FAST === '1' || process.argv.includes('--fail-fast');
  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const name = tests[i];
    const full = path.join(TESTS_DIR, name);
    console.log(`🧪 [${i + 1}/${tests.length}] Running ${name}...`);

    const start = Date.now();
    // Capture output so we can display aggregated failures at the end
    // Apply per-test timeout so a hung test can't stall the whole suite.

    // Preload the test watchdog so child processes can dump diagnostics on hangs
    const watchdog = path.join(__dirname, '..', 'tests', 'helpers', 'test-watchdog.js');
    const strictConsole = path.join(__dirname, '..', 'tests', 'helpers', 'strictConsole.js');
    const nodeArgs = ['-r', strictConsole, '-r', watchdog, full];

    // Pass test name so watchdog output is helpful
    const childEnv = Object.assign({}, process.env, { TEST_NAME: name, TEST_WATCHDOG_ENABLED: process.env.TEST_WATCHDOG_ENABLED !== '0' ? '1' : '0' });

    const res = spawnSync(process.execPath, nodeArgs, { stdio: 'pipe', timeout: TEST_TIMEOUT_MS, killSignal: 'SIGKILL', env: childEnv });
    const duration = Date.now() - start;

    const timedOut = Boolean((res.error && res.error.code === 'ETIMEDOUT') || res.signal === 'SIGKILL' || res.signal === 'SIGTERM');

    const result = {
      name,
      status: (res.status === 0 && !res.error && !timedOut) ? 'passed' : 'failed',
      timedOut,
      exitCode: res.status,
      signal: res.signal,
      error: res.error ? (res.error.message || String(res.error)) : null,
      stdout: res.stdout ? String(res.stdout) : '',
      stderr: res.stderr ? String(res.stderr) : '',
      durationMs: duration
    };

    results.push(result);

    // If this was a timeout, automatically retry once (helps flaky hangs)
    if (result.timedOut) {
      console.warn(`⏱️  ${name} timed out — retrying once (${TEST_TIMEOUT_MS}ms)`);
      const retryStart = Date.now();
      const retryArgs = ['-r', path.join(__dirname, '..', 'tests', 'helpers', 'test-watchdog.js'), full];
      retryArgs.unshift('-r', path.join(__dirname, '..', 'tests', 'helpers', 'strictConsole.js'));
      const retryEnv = Object.assign({}, process.env, { TEST_NAME: `${name}-retry`, TEST_WATCHDOG_ENABLED: process.env.TEST_WATCHDOG_ENABLED !== '0' ? '1' : '0' });
      const retryRes = spawnSync(process.execPath, retryArgs, { stdio: 'pipe', timeout: TEST_TIMEOUT_MS, killSignal: 'SIGKILL', env: retryEnv });
      const retryDuration = Date.now() - retryStart;
      const retryTimedOut = Boolean((retryRes.error && retryRes.error.code === 'ETIMEDOUT') || retryRes.signal === 'SIGKILL' || retryRes.signal === 'SIGTERM');

      const retryResult = {
        name: `${name} (retry)`,
        status: (retryRes.status === 0 && !retryRes.error && !retryTimedOut) ? 'passed' : 'failed',
        timedOut: retryTimedOut,
        exitCode: retryRes.status,
        signal: retryRes.signal,
        error: retryRes.error ? (retryRes.error.message || String(retryRes.error)) : null,
        stdout: retryRes.stdout ? String(retryRes.stdout) : '',
        stderr: retryRes.stderr ? String(retryRes.stderr) : '',
        durationMs: retryDuration
      };

      results.push(retryResult);

      if (retryResult.status === 'passed') {
        console.log(`✅ ${name} (retry) passed (${retryResult.durationMs}ms)`);
      } else if (retryResult.timedOut) {
        console.error(`⏱️  ${name} (retry) timed out after ${TEST_TIMEOUT_MS}ms and was killed`);
      } else {
        console.error(`❌ ${name} (retry) failed (${retryResult.exitCode || 'ERR'}${retryResult.signal ? `, signal=${retryResult.signal}` : ''})`);
      }

      // don't fail-fast on first timeout if the retry is allowed to run; but obey failFast after retry
      if (failFast && retryResult.status === 'failed') {
        console.error('Fail-fast enabled; aborting remaining tests.');
        break;
      }

      // Skip the rest of the loop handling for the original timed-out result
      continue;
    }

    // Print a concise per-test line so developer sees progress
    if (result.status === 'passed') {
      console.log(`✅ ${name} (${result.durationMs}ms)`);
    } else {
      if (result.timedOut) {
        console.error(`⏱️  ${name} timed out after ${TEST_TIMEOUT_MS}ms and was killed`);
      } else {
        console.error(`❌ ${name} failed (${result.exitCode || 'ERR'}${result.signal ? `, signal=${result.signal}` : ''})`);
      }

      // show a short stderr preview to help triage quickly
      const stderrPreview = (result.stderr || result.stdout || '').trim().split('\n').slice(-6).join('\n');
      if (stderrPreview) {
        console.error('--- recent output ---');
        console.error(stderrPreview);
        console.error('--- end recent output ---');
      }
    }

    if ((res.error || res.status !== 0) && failFast) {
      console.error('Fail-fast enabled; aborting remaining tests.');
      break;
    }
  }

  // Summary
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const total = results.length;

  console.log('\n--- Test suite summary ---');
  console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests details:');
    for (const r of results.filter(x => x.status === 'failed')) {
      console.log('\n--------------------------------------------------');
      console.log(`Test: ${r.name}`);
      console.log(`Exit code: ${r.exitCode}  Signal: ${r.signal || '-'}  Duration: ${r.durationMs}ms`);
      if (r.error) console.log(`Error: ${r.error}`);
      if (r.stderr && r.stderr.trim().length) {
        console.log('\n--- STDERR ---');
        console.log(r.stderr.trim());
      }
      if (r.stdout && r.stdout.trim().length) {
        console.log('\n--- STDOUT ---');
        console.log(r.stdout.trim());
      }
      console.log('--------------------------------------------------');
    }
  } else {
    console.log('All tests passed ✅');
  }

  return failed > 0 ? 1 : 0;
}

if (require.main === module) {
  const tests = listTests();
  process.exit(runTests(tests));
}
