#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createMockVscode } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// Patch the vscode import before loading the indexer so tests run headless
const mockInstall = createMockVscode();
const { VSCodeUri } = mockInstall;
const { IncrementalIndexer } = require('../src/incrementalIndexer');

async function testWorkerFallback() {
    const fileUri = VSCodeUri.file(path.join(mockInstall.workspaceRoot, 'fake.txt'));

    const indexer = new IncrementalIndexer({
        stat: async () => ({
            size: 42,
            mtime: new Date(),
            birthtime: new Date(),
            isFile: () => true
        })
    });

    // Inject a worker host that fails, ensuring ingestion still succeeds without digest
    indexer._workerHost = {
        isEnabled: () => true,
        async runTask() {
            throw new Error('worker unavailable');
        },
        dispose() {}
    };

    await indexer._ingestStat(fileUri, { size: 42, mtime: new Date(), birthtime: new Date() }, { source: 'test' });
    const stored = indexer._index.get(path.normalize(fileUri.fsPath));
    assert.ok(stored, 'Entry should still be indexed when worker fails');
    assert.strictEqual(stored.digest, null, 'Digest should be null when worker fails');

    indexer.dispose();
}

async function testInlineDigestAndDeltaFlush() {
    const fileUri = VSCodeUri.file(path.join(mockInstall.workspaceRoot, 'delta.txt'));

    const indexer = new IncrementalIndexer({
        stat: async () => ({
            size: 100,
            mtime: new Date(),
            birthtime: new Date(),
            isFile: () => true
        })
    });

    // Inject a fake worker host that runs inline
    indexer._workerHost = {
        isEnabled: () => true,
        async runTask(task, payload) {
            if (task === 'digest') {
                return payload.map(() => ({
                    hash: 'abc123',
                    sizeBucket: 'small',
                    ageBucket: 'minute'
                }));
            }
            return [];
        },
        dispose() {}
    };

    // Queue a change then flush immediately
    indexer.queueDelta(fileUri, 'change');
    await indexer._flushDeltaQueue();
    let stored = indexer._index.get(path.normalize(fileUri.fsPath));
    assert.ok(stored, 'Entry should be present after delta flush');
    assert.strictEqual(stored.digest, 'abc123', 'Digest should be populated from inline worker');

    // Queue a delete and ensure removal
    indexer.queueDelta(fileUri, 'delete');
    await indexer._flushDeltaQueue();
    stored = indexer._index.get(path.normalize(fileUri.fsPath));
    assert.strictEqual(stored, undefined, 'Entry should be removed after delete delta');

    indexer.dispose();
}

async function main() {
    await testWorkerFallback();
    await testInlineDigestAndDeltaFlush();
    mockInstall.dispose();
    console.log('✅ Incremental indexer fallback tests passed');
}

main().catch((error) => {
    console.error('❌ Incremental indexer fallback tests failed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);
