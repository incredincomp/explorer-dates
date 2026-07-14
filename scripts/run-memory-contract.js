#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEFAULT_TIMEOUT_MS = 60000;
const MEMORY_ENV_KEYS = [
    'DISABLE_TIMERS',
    'DISABLE_INCREMENTAL_REFRESH',
    'MEMORY_SOAK_ITERATIONS',
    'MEMORY_SOAK_DELAY_MS',
    'MEMORY_SOAK_MAX_DELTA_MB',
    'MEMORY_SOAK_CAPTURE_SNAPSHOTS'
];

const CASES = [
    { label: 'safe-sampling', script: 'tests/test-memory-safe-sampling.js', args: [] },
    { label: 'isolation-normal', script: 'tests/test-memory-isolation.js', args: ['--expose-gc'], env: {} },
    { label: 'isolation-timers-disabled', script: 'tests/test-memory-isolation.js', args: ['--expose-gc'], env: { DISABLE_TIMERS: '1' } },
    { label: 'isolation-refresh-disabled', script: 'tests/test-memory-isolation.js', args: ['--expose-gc'], env: { DISABLE_INCREMENTAL_REFRESH: '1' } },
    {
        label: 'isolation-timers-and-refresh-disabled',
        script: 'tests/test-memory-isolation.js',
        args: ['--expose-gc'],
        env: { DISABLE_TIMERS: '1', DISABLE_INCREMENTAL_REFRESH: '1' }
    }
];

function caseEnvironment(overrides = {}) {
    const env = { ...process.env };
    for (const key of MEMORY_ENV_KEYS) delete env[key];
    Object.assign(env, {
        MEMORY_SOAK_ITERATIONS: '2000',
        MEMORY_SOAK_DELAY_MS: '0',
        MEMORY_SOAK_CAPTURE_SNAPSHOTS: '0'
    }, overrides);
    return env;
}

function runCase(testCase, options = {}) {
    const spawn = options.spawn || spawnSync;
    const log = options.log || console.log;
    const error = options.error || console.error;
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const scriptPath = path.join(ROOT, testCase.script);

    if (!fs.existsSync(scriptPath)) {
        error(`memory contract case missing: ${testCase.label}`);
        return 1;
    }

    log(`memory contract case: ${testCase.label}`);
    const result = spawn(process.execPath, [...testCase.args, scriptPath], {
        env: caseEnvironment(testCase.env),
        shell: false,
        stdio: 'inherit',
        timeout: timeoutMs,
        killSignal: 'SIGTERM'
    });

    if (result.error) {
        error(`memory contract case failed to start: ${testCase.label}`);
        return 1;
    }
    if (result.signal) {
        error(`memory contract case terminated by signal: ${testCase.label}`);
        return 1;
    }
    if (result.status !== 0) {
        error(`memory contract case failed: ${testCase.label}`);
        return result.status || 1;
    }
    return 0;
}

function runContract(options = {}) {
    const log = options.log || console.log;
    const error = options.error || console.error;
    const cases = options.cases || CASES;

    for (const testCase of cases) {
        const status = runCase(testCase, { ...options, log, error });
        if (status !== 0) return status;
    }

    log('bounded memory contract: passed');
    log(`cases: ${cases.length}`);
    return 0;
}

if (require.main === module) process.exitCode = runContract();

module.exports = { CASES, DEFAULT_TIMEOUT_MS, runCase, runContract };
