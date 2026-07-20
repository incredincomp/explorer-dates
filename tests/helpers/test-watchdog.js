// Lightweight test watchdog preloaded into every test child process via `-r`.
// Writes active-handle dumps when a test runs longer than a configurable threshold.

try {
  const { dumpActiveHandles } = require('./diagnostics');

  const ENABLED = process.env.TEST_WATCHDOG_ENABLED !== '0';
  const THRESHOLD_MS = Number(process.env.TEST_WATCHDOG_THRESHOLD_MS) || 15000; // default 15s
  const INTERVAL_MS = Number(process.env.TEST_WATCHDOG_INTERVAL_MS) || 5000; // poll frequency
  const MAX_DUMPS = Number(process.env.TEST_WATCHDOG_MAX_DUMPS) || 3;
  const TEST_NAME = process.env.TEST_NAME || (process.argv && process.argv[1]) || 'unknown-test';

  if (!ENABLED) {
    // No-op when disabled
  } else {
    const start = Date.now();
    let dumpCount = 0;

    const checkFn = () => {
      try {
        const elapsed = Date.now() - start;
        if (elapsed >= THRESHOLD_MS && dumpCount < MAX_DUMPS) {
          dumpCount++;
          const file = dumpActiveHandles(TEST_NAME, dumpCount);
          console.error(`[TEST-WATCHDOG] long-running test (${TEST_NAME}) - elapsed=${elapsed}ms - wrote diagnostics to ${file}`);
        }
        if (dumpCount >= MAX_DUMPS) {
          clearInterval(handle);
        }
      } catch (err) {
        try { console.error('[TEST-WATCHDOG] failed to dump diagnostics', err && err.message); } catch {}
      }
    };

    const handle = setInterval(checkFn, INTERVAL_MS);
    // Diagnostics must never be the reason a completed test remains alive.
    // Keep the interval observable while work is active, but allow Node to
    // terminate naturally once the test has released its own resources.
    if (typeof handle.unref === 'function') handle.unref();

    // Run one immediate check after threshold to provide fast feedback.
    const thresholdTimer = setTimeout(() => {
      try { checkFn(); } catch {}
    }, THRESHOLD_MS + 50);
    if (typeof thresholdTimer.unref === 'function') thresholdTimer.unref();

    // Clean up on exit so the process can terminate quickly
    process.on('exit', () => { try { clearInterval(handle); } catch {} });
    process.on('SIGINT', () => { try { clearInterval(handle); } catch {} });
    process.on('SIGTERM', () => { try { clearInterval(handle); } catch {} });
  }
} catch (err) {
  try { console.error('[TEST-WATCHDOG] initialization failed', err && err.message); } catch {}
}
