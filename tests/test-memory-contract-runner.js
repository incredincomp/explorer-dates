#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { CASES, runCase, runContract } = require('../scripts/run-memory-contract');

function result(overrides = {}) {
    return { status: 0, signal: null, error: null, ...overrides };
}

function main() {
    const calls = [];
    const successLogs = [];
    const success = runContract({
        spawn: (...args) => {
            calls.push(args);
            return result();
        },
        log: (line) => successLogs.push(line),
        error: () => { throw new Error('unexpected runner error'); }
    });
    assert.strictEqual(success, 0);
    assert.strictEqual(calls.length, CASES.length, 'each contract case must execute exactly once');
    assert(successLogs.includes('bounded memory contract: passed'));
    assert(successLogs.includes(`cases: ${CASES.length}`));
    assert(calls.every(([executable, args, options]) => (
        executable === process.execPath && Array.isArray(args) && options.shell === false
    )));

    const failedLogs = [];
    let failedCalls = 0;
    const failed = runContract({
        spawn: () => {
            failedCalls++;
            return result({ status: 7 });
        },
        log: (line) => failedLogs.push(line),
        error: () => {}
    });
    assert.strictEqual(failed, 7);
    assert.strictEqual(failedCalls, 1, 'a failed child must stop the aggregate');
    assert(!failedLogs.includes('bounded memory contract: passed'));

    const timeout = runCase(CASES[0], {
        spawn: () => result({ status: null, signal: 'SIGTERM', error: { code: 'ETIMEDOUT' } }),
        log: () => {},
        error: () => {}
    });
    assert.notStrictEqual(timeout, 0, 'timeout/signal termination must fail the aggregate');

    let missingSpawned = false;
    const missing = runCase({ label: 'missing', script: 'tests/does-not-exist.js', args: [] }, {
        spawn: () => { missingSpawned = true; return result(); },
        log: () => {},
        error: () => {}
    });
    assert.notStrictEqual(missing, 0, 'missing test files must fail the aggregate');
    assert.strictEqual(missingSpawned, false, 'missing test files must not be silently spawned');

    console.log('test-memory-contract-runner: integrity assertions passed');
}

main();
