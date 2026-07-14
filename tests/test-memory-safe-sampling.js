#!/usr/bin/env node

'use strict';

const assert = require('assert');

const MEMORY_SHEDDING_ENV = 'EXPLORER_DATES_MEMORY_SHEDDING';
const ABSENT = Symbol('absent');

const { createTestMock } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

function captureEnvironmentState() {
    return Object.prototype.hasOwnProperty.call(process.env, MEMORY_SHEDDING_ENV)
        ? process.env[MEMORY_SHEDDING_ENV]
        : ABSENT;
}

function restoreEnvironmentState(value) {
    if (value === ABSENT) delete process.env[MEMORY_SHEDDING_ENV];
    else process.env[MEMORY_SHEDDING_ENV] = value;
}

function assertEnvironmentState(expected) {
    const actual = captureEnvironmentState();
    assert.strictEqual(actual, expected, 'memory shedding environment state must be restored exactly');
}

async function runScenario(label, initialValue, failureMode) {
    restoreEnvironmentState(initialValue);
    const originalMemoryUsage = process.memoryUsage;
    let provider = null;
    let mockInstall = null;
    let scenarioError = null;

    try {
        mockInstall = createTestMock({ config: { 'explorerDates.performanceMode': false } });
        process.env[MEMORY_SHEDDING_ENV] = '1';
        process.memoryUsage = () => ({ heapUsed: Number.NaN, rss: -1 });

        const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
        provider = new FileDateDecorationProvider();

        assert.strictEqual(provider._memoryBaselineMB, 0, `${label}: invalid heap telemetry must use a zero baseline`);
        assert.strictEqual(provider._safeHeapUsedMB(), 0, `${label}: invalid heap telemetry must return zero`);
        assert.strictEqual(provider._safeRssMB(), 0, `${label}: invalid RSS telemetry must return zero`);

        if (failureMode === 'sync') throw new Error('injected synchronous cleanup-path failure');
        if (failureMode === 'async') await Promise.reject(new Error('injected asynchronous cleanup-path failure'));
    } catch (error) {
        scenarioError = error;
    } finally {
        try {
            if (provider) await provider.dispose();
        } finally {
            try {
                if (mockInstall) mockInstall.dispose();
            } finally {
                process.memoryUsage = originalMemoryUsage;
                restoreEnvironmentState(initialValue);
            }
        }
    }

    assert.strictEqual(process.memoryUsage, originalMemoryUsage, `${label}: process.memoryUsage identity must be restored`);
    assertEnvironmentState(initialValue);
    if (failureMode) assert(scenarioError, `${label}: injected failure must be observed`);
    else assert.strictEqual(scenarioError, null, `${label}: unexpected scenario failure`);
}

async function main() {
    const originalEnvironmentState = captureEnvironmentState();
    try {
        await runScenario('absent-success', ABSENT, null);
        await runScenario('non-default-success', 'diagnostic-value', null);
        await runScenario('already-enabled-success', '1', null);
        await runScenario('absent-sync-failure', ABSENT, 'sync');
        await runScenario('non-default-async-failure', 'diagnostic-value', 'async');
        console.log('test-memory-safe-sampling: cleanup scenarios passed');
    } finally {
        restoreEnvironmentState(originalEnvironmentState);
    }
}

main().then(() => scheduleExit(0, 0)).catch((error) => {
    console.error('test-memory-safe-sampling failed:', error);
    scheduleExit(0, 1);
});
