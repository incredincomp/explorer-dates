#!/usr/bin/env node

/**
 * Fuzz-style memory stress test.
 *
 * - Randomizes cache timeouts, refresh intervals, and iteration counts per run.
 * - Mixes cache-hit warmups with forced refreshes to exercise both paths.
 * - Logs heap and timing data for each run to an artifact file for post-mortem.
 *
 * Env controls (defaults are conservative):
 *   MEMORY_FUZZ_RUNS         Number of fuzz runs (default: 5)
 *   MEMORY_FUZZ_MIN_ITERS    Minimum iterations per run (default: 150)
 *   MEMORY_FUZZ_MAX_ITERS    Maximum iterations per run (default: 350)
 *   MEMORY_FUZZ_MAX_DELTA_MB Fail if final heap delta exceeds this (default: 32)
 *   MEMORY_FUZZ_FORCE_HITS   Set to "false" to skip hit warmups
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createMockVscode, VSCodeUri, workspaceRoot } = require('./helpers/mockVscode');

if (typeof global.gc !== 'function') {
    console.error('❌ Fuzz memory test requires Node to run with "--expose-gc".');
    console.error('   Use "npm run test:memory-fuzz" or run manually with:');
    console.error('   node --expose-gc tests/test-memory-fuzz.js');
    process.exit(1);
}

const RUNS = Number(process.env.MEMORY_FUZZ_RUNS || 5);
const MIN_ITERS = Number(process.env.MEMORY_FUZZ_MIN_ITERS || 150);
const MAX_ITERS = Number(process.env.MEMORY_FUZZ_MAX_ITERS || 350);
const MAX_HEAP_DELTA_MB = Number(process.env.MEMORY_FUZZ_MAX_DELTA_MB || 32);
const FORCE_HITS = process.env.MEMORY_FUZZ_FORCE_HITS !== 'false';

const artifactDir = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function heapUsedMB() {
    return Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickSampleFiles() {
    const candidatePaths = [
        'package.json',
        'README.md',
        'CHANGELOG.md',
        path.join('src', 'fileDateDecorationProvider.js'),
        path.join('src', 'themeIntegration.js'),
        path.join('src', 'advancedCache.js'),
        path.join('src', 'batchProcessor.js'),
        path.join('src', 'extensionApi.js'),
        path.join('tests', 'verify-config.js'),
        path.join('tests', 'test-configuration-scenarios.js')
    ].map((relativePath) => path.join(workspaceRoot, relativePath))
        .filter((targetPath) => fs.existsSync(targetPath))
        .map((targetPath) => VSCodeUri.file(targetPath));

    if (candidatePaths.length === 0) {
        throw new Error('No sample files found for fuzz test.');
    }

    return candidatePaths;
}

(async () => {
    const runsLog = [];
    let exitCode = 0;

    for (let run = 1; run <= RUNS; run++) {
        const iterations = randInt(MIN_ITERS, MAX_ITERS);
        const hitIterations = FORCE_HITS ? randInt(Math.max(40, Math.floor(iterations * 0.2)), Math.max(60, Math.floor(iterations * 0.4))) : 0;
        const refreshInterval = randInt(5_000, 60_000);
        const cacheTimeout = randInt(30_000, 180_000);
        const delayMs = randInt(5, 25);
        const runId = crypto.randomUUID();

        const mockInstall = createMockVscode({
            config: {
                'explorerDates.badgeRefreshInterval': refreshInterval,
                'explorerDates.cacheTimeout': cacheTimeout,
                'explorerDates.showDateDecorations': true,
                'explorerDates.maxCacheSize': randInt(500, 5000)
            },
            sampleWorkspace: workspaceRoot
        });

        const logEntry = {
            run,
            runId,
            iterations,
            hitIterations,
            refreshInterval,
            cacheTimeout,
            delayMs,
            sampleFiles: [],
            baseline: null,
            peak: null,
            final: null,
            delta: null,
            metrics: null,
            error: null
        };

        let provider;

        try {
            const sampleFiles = pickSampleFiles();
            logEntry.sampleFiles = sampleFiles.map((uri) => uri.fsPath);

            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
            provider = new FileDateDecorationProvider();
            global.gc();

            logEntry.baseline = heapUsedMB();
            logEntry.peak = logEntry.baseline;

            if (FORCE_HITS && hitIterations > 0) {
                for (const uri of sampleFiles) {
                    await provider.provideFileDecoration(uri);
                }
                global.gc();
                for (let i = 0; i < hitIterations; i++) {
                    for (const uri of sampleFiles) {
                        await provider.provideFileDecoration(uri);
                    }
                    if ((i + 1) % 50 === 0) {
                        global.gc();
                        const current = heapUsedMB();
                        logEntry.peak = Math.max(logEntry.peak, current);
                    } else {
                        logEntry.peak = Math.max(logEntry.peak, heapUsedMB());
                    }
                }
            }

            for (let i = 0; i < iterations; i++) {
                for (const uri of sampleFiles) {
                    await provider.provideFileDecoration(uri);
                }
                provider._scheduleIncrementalRefresh(`fuzz-${run}-${i}`);
                await delay(delayMs);
                if ((i + 1) % 50 === 0) {
                    global.gc();
                    const current = heapUsedMB();
                    logEntry.peak = Math.max(logEntry.peak, current);
                } else {
                    logEntry.peak = Math.max(logEntry.peak, heapUsedMB());
                }
            }

            await delay(Math.min(refreshInterval, 1500));
            global.gc();

            logEntry.final = heapUsedMB();
            logEntry.delta = Number((logEntry.final - logEntry.baseline).toFixed(2));
            logEntry.metrics = provider._metrics;

            if (logEntry.delta > MAX_HEAP_DELTA_MB) {
                throw new Error(`Heap delta ${logEntry.delta} MB exceeded limit ${MAX_HEAP_DELTA_MB} MB`);
            }
        } catch (error) {
            logEntry.error = error?.stack || String(error);
            exitCode = 1;
        } finally {
            if (provider) {
                await provider.dispose();
            }
            mockInstall.dispose();
            runsLog.push(logEntry);
        }
    }

    const artifactPath = path.join(artifactDir, `memory-fuzz-log-${Date.now()}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify({ runs: runsLog, maxHeapDeltaMB: MAX_HEAP_DELTA_MB }, null, 2), 'utf8');
    console.log(`📝 Fuzz log written to: ${artifactPath}`);

    const failing = runsLog.filter((r) => r.error);
    if (failing.length) {
        console.error(`❌ ${failing.length} run(s) failed. See log for details.`);
        process.exit(1);
    }

    const worstDelta = Math.max(...runsLog.map((r) => r.delta ?? 0));
    console.log(`✅ All fuzz runs passed. Worst heap delta: ${worstDelta} MB (limit ${MAX_HEAP_DELTA_MB} MB)`);
    process.exit(exitCode);
})();
