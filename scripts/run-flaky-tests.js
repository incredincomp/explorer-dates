#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tests = [
  'tests/test-runtime-change-handling.js',
  'tests/test-multi-workspace-scenarios.js',
  'tests/test-preset-application-paths.js',
  'tests/test-advanced-cache.js',
  'tests/test-settings-coordinator-concurrency.js',
  'tests/test-settings-coordinator-failure.js'
];

const iterations = parseInt(process.argv[2] || '50', 10);
const logsDir = path.join(__dirname, '../logs');
try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}

function runTest(testPath, iter) {
  console.error(`Running ${testPath} (iteration ${iter})`);
  const res = spawnSync('node', [testPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  const out = {
    test: testPath,
    iteration: iter,
    exitCode: res.status,
    stdout: res.stdout,
    stderr: res.stderr
  };
  const file = path.join(logsDir, `flaky-${path.basename(testPath)}-${iter}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(out));

  // Consolidate output for checks
  const combined = (res.stdout || '') + '\n' + (res.stderr || '');
  // Match only real unhandled promise rejection lines, avoid matching function/test names
  const unhandledRegex = /(^|\W)(UnhandledPromiseRejection|Unhandled Rejection|UnhandledPromiseRejectionWarning|UnhandledRejection)(\W|$)/i;
  let unhandledMatch = combined.match(unhandledRegex);
  let hasUnhandled = !!unhandledMatch;
  console.error(`[DBG2] unhandledMatch=${unhandledMatch ? unhandledMatch[0] : '<none>'}`);
  if (unhandledMatch) {
    const i = unhandledMatch.index || combined.indexOf(unhandledMatch[0]);
    console.error('[DBG2] surrounding:', combined.slice(Math.max(0, i - 120), i + 120));
    // Ignore matches that are clearly negated like "No unhandled rejection"
    const pre = combined.slice(Math.max(0, i - 10), i);
    if (/\bno\s*$/i.test(pre) || /\bno unhandled\b/i.test(combined.slice(Math.max(0, i - 20), i + 20))) {
      console.error('[DBG] Ignoring unhandled match because it appears negated ("no unhandled rejection")');
      hasUnhandled = false;
      unhandledMatch = null;
    }
  }

  // If the test process produced a diagnostics handle dump, parse it and only fail
  // when the active handle count is suspiciously large (>2). Many tests leave
  // the process WriteStream handles (stdout/stderr) open which is expected.
  const diagMatch = combined.match(/\[DIAG\] Wrote handle dump to (.+)/);
  let handleCount = null;
  if (diagMatch) {
    try {
      const diagPath = diagMatch[1].trim();
      const diagData = JSON.parse(fs.readFileSync(diagPath, 'utf8'));
      handleCount = diagData.count;
    } catch {
      // ignore parse errors and fall back to scanning logs directory below
    }
  }

  // Fallback: if we couldn't parse a diag path from output, look up the latest
  // diag file for this test by prefix in the logs directory and read its count
  if (handleCount === null) {
    try {
      const prefix = `diag-${path.basename(testPath)}-`;
      const files = fs.readdirSync(logsDir).filter(f => f.startsWith(prefix)).sort();
      if (files.length > 0) {
        const latestFile = path.join(logsDir, files[files.length - 1]);
        const diagData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
        handleCount = diagData.count;
        console.error(`[INFO] Read fallback diag file ${latestFile} (count=${handleCount})`);
      }
    } catch {
      // ignore lookup errors - proceed with other checks
    }
  }

  // Debug output for troubleshooting flaky detection
  console.error(`[DBG] status=${res.status}, hasUnhandled=${hasUnhandled}, diagMatch=${!!diagMatch}, handleCount=${handleCount}`);

  // Determine failure only for real failures
  const isRealFailure = (res.status !== 0) || hasUnhandled || (handleCount !== null && handleCount > 2);
  if (isRealFailure) {
    console.error(`❌ ${testPath} failed on iteration ${iter} (exitCode=${res.status}). Dumping handles...`);
    // require the diagnostics helper from the repo to dump handles when needed
    const diag = require(path.join(__dirname, '../tests/helpers/diagnostics'));
    try {
      if (!diagMatch) {
        diag.dumpActiveHandles(path.basename(testPath), iter);
      } else {
        console.error(`[INFO] Found handle dump at ${diagMatch[1]} (count=${handleCount})`);
      }
    } catch (e) {
      console.error('Failed to dump handles:', e);
    }
    return false;
  }

  // If there was a handle dump but handle count is small (<=2), treat as pass
  if (diagMatch && handleCount !== null && handleCount <= 2) {
    console.error(`✅ ${testPath} passed iteration ${iter} (handle dump present, count=${handleCount} <= 2 — ignored)`);
    return true;
  }

  console.error(`✅ ${testPath} passed iteration ${iter}`);
  return true;
}

let failures = [];
for (const test of tests) {
  for (let i = 1; i <= iterations; i++) {
    const ok = runTest(test, i);
    if (!ok) {
      failures.push({ test, iteration: i });
      // continue running to collect more data
    }
  }
}

const summary = {
  timestamp: new Date().toISOString(),
  iterations,
  failures
};
fs.writeFileSync(path.join(logsDir, `flaky-summary-${Date.now()}.json`), JSON.stringify(summary, null, 2));
console.error('Done. Summary:', JSON.stringify(summary, null, 2));
process.exit(failures.length > 0 ? 1 : 0);
