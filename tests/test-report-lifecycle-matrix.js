#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const { OUTCOME_CATEGORIES } = require('../src/utils/commandOutcome');

function report() {
    return { schemaVersion: '1', files: [], summary: { totalFiles: 0 }, timeRange: 'all' };
}

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function fakeFileSystem({ failWrite = false, failTempStat = false, failFinalStat = false } = {}) {
    const files = new Map();
    const calls = [];
    return {
        files, calls,
        async writeFile(path, content) {
            calls.push(['write', path]);
            if (failWrite) throw new Error('write failure');
            files.set(path, String(content));
        },
        async stat(path) {
            calls.push(['stat', path]);
            if ((failTempStat && String(path).includes('.tmp-')) || (failFinalStat && !String(path).includes('.tmp-'))) throw new Error('stat failure');
            if (!files.has(path)) throw new Error('missing file');
            return { size: Buffer.byteLength(files.get(path)) };
        },
        async rename(from, to) {
            calls.push(['rename', from, to]);
            if (!files.has(from)) throw new Error('missing temporary file');
            files.set(to.fsPath || to.path || to, files.get(from));
            files.delete(from);
        },
        async delete(path) {
            calls.push(['delete', path]);
            files.delete(path);
        }
    };
}

const silentLogger = { error() {}, warn() {}, info() {}, debug() {} };

async function main() {
    const mock = createTestMock();
    const { ExportReportingManager } = require('../src/exportReporting');
    const target = '/tmp/explorer-dates-report-lifecycle-matrix.json';
    try {
        const held = deferred();
        const phases = [];
        const manager = new ExportReportingManager({
            fileSystem: fakeFileSystem(),
            logger: silentLogger,
            phaseHook: async phase => {
                phases.push(phase);
                if (phase === 'scanning-workspace' && phases.filter(value => value === phase).length === 1) await held.promise;
            }
        });
        manager.collectFileData = async () => report();
        manager.formatReport = async () => '{}';
        const first = manager.generateFileModificationReport({ format: 'json' });
        await new Promise(resolve => setImmediate(resolve));
        const second = await manager.generateFileModificationReport({ format: 'json' });
        assert.strictEqual(second.category, OUTCOME_CATEGORIES.EXPECTED_ALREADY_RUNNING);
        held.resolve();
        assert.strictEqual(await first, '{}');
        assert(phases.includes('scanning-workspace'));
        manager.dispose();

        for (const phase of ['scanning-workspace', 'creating-summary', 'formatting-report', 'writing-temporary-file', 'verifying-temporary-file', 'promoting-final-file', 'verifying-final-file']) {
            const cancellationManager = new ExportReportingManager({ logger: silentLogger, phaseHook: async current => {
                if (current === phase) { const error = new Error('cancelled'); error.code = 'REPORT_CANCELLED'; throw error; }
            }});
            cancellationManager.collectFileData = async () => report();
            cancellationManager.formatReport = async () => '{}';
            const outcome = await cancellationManager.generateFileModificationReport({ format: 'json', outputPath: target });
            assert.strictEqual(outcome.category, OUTCOME_CATEGORIES.EXPECTED_CANCELLATION, `cancellation at ${phase}`);
            cancellationManager.dispose();
        }

        for (const failure of [{ name: 'write', options: { failWrite: true } }, { name: 'temporary-stat', options: { failTempStat: true } }, { name: 'final-stat', options: { failFinalStat: true } }]) {
            const fs = fakeFileSystem(failure.options);
            const failureManager = new ExportReportingManager({ fileSystem: fs, logger: silentLogger });
            failureManager.collectFileData = async () => report();
            failureManager.formatReport = async () => '{}';
            const outcome = await failureManager.generateFileModificationReport({ format: 'json', outputPath: target });
            assert.strictEqual(outcome.category, OUTCOME_CATEGORIES.HANDLED_COMMAND_FAILURE, failure.name);
            assert.strictEqual(fs.calls.filter(([kind]) => kind === 'delete').length, failure.name === 'write' || failure.name === 'temporary-stat' ? 1 : 0);
            failureManager.dispose();
        }
        console.log('✅ report lifecycle cancellation, concurrency, recovery, and failure matrix passed');
    } finally {
        mock.dispose();
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
