const assert = require('assert');

// Duplicate of detection logic used in scripts/run-flaky-tests.js
const unhandledRegex = /(^|\W)(UnhandledPromiseRejection|Unhandled Rejection|UnhandledPromiseRejectionWarning|UnhandledRejection)(\W|$)/i;
function detectsUnhandled(combined) {
  const unhandledMatch = combined.match(unhandledRegex);
  if (!unhandledMatch) return false;
  const i = unhandledMatch.index || combined.indexOf(unhandledMatch[0]);
  const pre = combined.slice(Math.max(0, i - 10), i);
  if (/\bno\s*$/i.test(pre) || /\bno unhandled\b/i.test(combined.slice(Math.max(0, i - 20), i + 20))) {
    return false;
  }
  return true;
}

// Positive cases
assert(detectsUnhandled('Unhandled Rejection: boom'), 'Should detect a plain unhandled rejection');
assert(detectsUnhandled('UnhandledPromiseRejectionWarning: something'), 'Should detect Node warning');

// Negative cases (negated phrases)
assert(!detectsUnhandled('No unhandled rejection from pending restart persistence failure'), 'Should ignore "No unhandled rejection" phrase');
assert(!detectsUnhandled('at async testNoUnhandledRejectionDuringRestartBatchOnConfigFailures (file.js:10:5)'), 'Should not match inside a function/test name');

console.log('✅ Detection tests passed');
process.exit(0);
