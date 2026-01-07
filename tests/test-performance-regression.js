#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { performance } = require('perf_hooks');

// Setup mock environment before requiring chunks
const { createMockVscode, expectChunkOrFail } = require('./helpers/mockVscode');
const { BaselineManager } = require('./baseline-manager');

const mock = createMockVscode();

const workspaceRoot = path.resolve(__dirname, '..');
const MAX_CHUNK_LOAD_MS = Number(process.env.EXPLORER_DATES_PERF_MAX_CHUNK_MS || 1200);
const MAX_HEAP_MB = Number(process.env.EXPLORER_DATES_PERF_MAX_HEAP_MB || 256);
const CHUNK_TOLERANCE = Number(process.env.EXPLORER_DATES_CHUNK_TOLERANCE || 0.15);
const CHUNK_MIN_DELTA_MS = Number(process.env.EXPLORER_DATES_CHUNK_MIN_DELTA_MS || 8);
const HEAP_TOLERANCE = Number(process.env.EXPLORER_DATES_HEAP_TOLERANCE || 0.1);
const HEAP_MIN_DELTA_MB = Number(process.env.EXPLORER_DATES_HEAP_MIN_DELTA_MB || 5);

const TARGET_CHUNKS = [
    'analysis',
    'workspaceIntelligence',
    'incrementalWorkers'
];

const baselineManager = new BaselineManager({
    metrics: {
        chunk_avg_ms: {
            label: 'Average chunk load',
            unit: 'ms',
            tolerancePct: CHUNK_TOLERANCE,
            minRegressionDelta: CHUNK_MIN_DELTA_MS
        },
        heap_used_mb: {
            label: 'Heap usage',
            unit: 'MB',
            tolerancePct: HEAP_TOLERANCE,
            minRegressionDelta: HEAP_MIN_DELTA_MB
        }
    }
});

TARGET_CHUNKS.forEach((chunkName) => {
    baselineManager.defineMetric(`chunk_${chunkName}_ms`, {
        label: `${chunkName} chunk load`,
        unit: 'ms',
        tolerancePct: CHUNK_TOLERANCE,
        minRegressionDelta: CHUNK_MIN_DELTA_MS
    });
});

function loadBuiltChunk(chunkName) {
    const resolved = path.join(workspaceRoot, 'dist', 'chunks', `${chunkName}.js`);
    delete require.cache[require.resolve(resolved)];
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(resolved);
    return mod?.default || mod;
}

function measure(fn) {
    const start = performance.now();
    const value = fn();
    const duration = performance.now() - start;
    return { value, duration };
}

function assertHeapUsage() {
    if (typeof global.gc === 'function') {
        global.gc();
    }
    const heapUsedMb = process.memoryUsage().heapUsed / 1024 / 1024;
    assert.ok(
        heapUsedMb <= MAX_HEAP_MB,
        `Heap usage ${heapUsedMb.toFixed(1)}MB exceeds threshold ${MAX_HEAP_MB}MB`
    );
    return Number(heapUsedMb.toFixed(2));
}

async function main() {
    console.log('⏱️  Running performance regression checks...');

    const chunkDurations = [];
    for (const chunkName of TARGET_CHUNKS) {
        expectChunkOrFail(chunkName, true);
        const { duration, value } = measure(() => loadBuiltChunk(chunkName));
        assert.ok(value, `Chunk ${chunkName} failed to load`);
        assert.ok(
            duration <= MAX_CHUNK_LOAD_MS,
            `Chunk ${chunkName} load time ${duration.toFixed(1)}ms exceeds ${MAX_CHUNK_LOAD_MS}ms`
        );
        const durationMs = Number(duration.toFixed(2));
        console.log(`✅ ${chunkName} loaded in ${durationMs}ms`);
        chunkDurations.push(durationMs);
        baselineManager.record(`chunk_${chunkName}_ms`, durationMs, { chunk: chunkName });
    }

    if (chunkDurations.length) {
        const avg = chunkDurations.reduce((sum, value) => sum + value, 0) / chunkDurations.length;
        baselineManager.record('chunk_avg_ms', Number(avg.toFixed(2)), { samples: chunkDurations.length });
    }

    const heapUsed = assertHeapUsage();
    baselineManager.record('heap_used_mb', heapUsed);
    console.log(`✅ Heap usage within threshold (${heapUsed}MB)`);

    const results = await baselineManager.evaluate();
    const regressions = [];

    results.forEach((result) => {
        if (result.status === 'missing-baseline') {
            console.log(`ℹ️ ${result.label}: ${result.message}`);
            return;
        }
        if (result.status === 'regressed') {
            regressions.push(result);
            console.warn(`⚠️ ${result.label}: ${result.message}`);
            return;
        }
        console.log(`📊 ${result.label}: ${result.message}`);
    });

    const shouldUpdateBaselines = process.env.EXPLORER_DATES_UPDATE_PERF_BASELINES === '1';
    if (shouldUpdateBaselines) {
        const updateRemote = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
        await baselineManager.syncBaselines({ updateRemote, updateLocal: true });
        console.log(`📝 Baselines updated${updateRemote ? ' (GitHub + local)' : ' (local only)'}`);
    }

    if (regressions.length) {
        const details = regressions
            .map((result) => {
                const unit = result.unit || '';
                return ` - ${result.message} (baseline ${result.baseline}${unit})`;
            })
            .join('\n');
        throw new Error(`Performance baselines exceeded:\n${details}`);
    }

    console.log('🎯 Performance regression checks completed without baseline regressions.');
}

if (require.main === module) {
    main()
        .then(() => {
            console.log('🎉 All performance regression checks passed!');
        })
        .catch((error) => {
            console.error('❌ Performance regression detected:', error.message);
            process.exitCode = 1;
        })
        .finally(() => {
            if (mock && mock.dispose) {
                mock.dispose();
            }
        });
}

module.exports = { main };
