#!/usr/bin/env node

/**
 * Memory soak test for the FileDateDecorationProvider.
 *
 * Simulates repeated decoration requests and incremental refreshes while tracking
 * Node heap usage. Fails if heap growth exceeds a configurable threshold,
 * helping us catch cache/timer leaks introduced by decoration changes.
 *
 * Requires Node to run with --expose-gc so the script can force garbage
 * collection between phases and capture stable measurements.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { createMockVscode, VSCodeUri, workspaceRoot } = require('./helpers/mockVscode');

if (typeof global.gc !== 'function') {
    console.error('❌ Memory soak test requires Node to run with "--expose-gc".');
    console.error('   Use "npm run test:memory" or run the script manually with:');
    console.error('   node --expose-gc tests/test-memory-soak.js');
    process.exit(1);
}

const ITERATIONS = Number(process.env.MEMORY_SOAK_ITERATIONS || 250);
// Tighter default guardrail for leak detection; raise with MEMORY_SOAK_MAX_DELTA_MB if needed.
const MAX_HEAP_DELTA_MB = Number(process.env.MEMORY_SOAK_MAX_DELTA_MB || 24);
const BATCH_DELAY_MS = Number(process.env.MEMORY_SOAK_DELAY_MS || 10);
const INCLUDE_HIT_PHASE = process.env.MEMORY_SOAK_INCLUDE_HITS !== 'false';
const HIT_PHASE_ITERATIONS = Number(
    process.env.MEMORY_SOAK_HIT_ITERATIONS || Math.max(50, Math.floor(ITERATIONS * 0.4))
);

const shouldForceStressLogProfile = !process.env.EXPLORER_DATES_LOG_PROFILE && BATCH_DELAY_MS === 0;
if (shouldForceStressLogProfile) {
    process.env.EXPLORER_DATES_LOG_PROFILE = 'stress';
}
const ACTIVE_LOG_PROFILE = (process.env.EXPLORER_DATES_LOG_PROFILE || 'default').toLowerCase();
const FORCE_CACHE_BYPASS = process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS === '1';
const SCENARIO_LABEL = process.env.MEMORY_SOAK_LABEL
    || (FORCE_CACHE_BYPASS ? 'forced-cache-bypass' : 'default');
const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(workspaceRoot, 'logs');
const logFilePath = path.join(logDir, `memory-soak-${runTimestamp}.json`);
const runMetadata = {
    iterations: ITERATIONS,
    maxDeltaMb: MAX_HEAP_DELTA_MB,
    delayMs: BATCH_DELAY_MS,
    includeHitPhase: INCLUDE_HIT_PHASE,
    hitPhaseIterations: HIT_PHASE_ITERATIONS,
    logProfile: ACTIVE_LOG_PROFILE,
    logProfileAutoEnabled: shouldForceStressLogProfile,
    forceCacheBypass: FORCE_CACHE_BYPASS,
    scenario: SCENARIO_LABEL
};

const mockInstall = createMockVscode({
    config: {
        'explorerDates.badgeRefreshInterval': 1500,
        'explorerDates.showDateDecorations': true,
        'explorerDates.colorScheme': 'recency'
    },
    sampleWorkspace: workspaceRoot
});

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
const sampleFiles = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    path.join('src', 'fileDateDecorationProvider.js'),
    path.join('src', 'themeIntegration.js'),
    path.join('src', 'advancedCache.js'),
    path.join('src', 'batchProcessor.js'),
    path.join('src', 'extensionApi.js')
].map((relativePath) => path.join(workspaceRoot, relativePath))
    .filter((targetPath) => fs.existsSync(targetPath))
    .map((targetPath) => VSCodeUri.file(targetPath));

if (sampleFiles.length === 0) {
    console.error('❌ Could not locate sample files for soak test.');
    mockInstall.dispose();
    process.exit(1);
}

function heapUsedMB() {
    return Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
}

function captureHeapSnapshot(label) {
    const usage = process.memoryUsage();
    const snapshot = {
        label,
        heapUsedMB: Number((usage.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMB: Number((usage.heapTotal / 1024 / 1024).toFixed(2)),
        externalMB: Number((usage.external / 1024 / 1024).toFixed(2)),
        rss: Number((usage.rss / 1024 / 1024).toFixed(2)),
        timestamp: new Date().toISOString()
    };
    
    // Count timer IDs and cache entries if provider is available
    if (typeof snapshots !== 'undefined') {
        snapshots.push(snapshot);
    }
    
    return snapshot;
}

const snapshots = [];
let snapshotLog = [];
const perfSnapshots = [];
let perfWarningLogged = false;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capturePerformanceMemory(label) {
    if (!performance || typeof performance.measureMemory !== 'function') {
        if (!perfWarningLogged) {
            console.warn('⚠️ performance.measureMemory() is unavailable in this Node version; skipping perf snapshots.');
            perfWarningLogged = true;
        }
        return null;
    }

    try {
        const measurement = await performance.measureMemory();
        const summary = {
            label,
            timestamp: new Date().toISOString(),
            measurement
        };
        perfSnapshots.push(summary);
        const usedBytes = typeof measurement?.bytes?.jsHeapUsed === 'number'
            ? measurement.bytes.jsHeapUsed
            : measurement?.usedJSHeapSize || 0;
        const usedMb = (usedBytes / (1024 * 1024)).toFixed(2);
        console.log(`   • Perf memory snapshot (${label}): ${usedMb} MB`);
        return summary;
    } catch (error) {
        if (!perfWarningLogged) {
            console.warn(`⚠️ Failed to capture performance.measureMemory() snapshot: ${error.message}`);
            perfWarningLogged = true;
        }
        return null;
    }
}

function persistSoakLog(payload) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
        fs.writeFileSync(logFilePath, JSON.stringify(payload, null, 2));
        console.log(`📝 Wrote soak log to ${logFilePath}`);
    } catch (error) {
        console.warn(`⚠️ Failed to persist soak log: ${error.message}`);
    }
}

(async () => {
    let exitCode = 0;
    let provider;
    let baseline = 0;
    let peak = 0;
    let finalHeap = 0;
    let delta = 0;
    let providerMetrics = null;

    try {
        provider = new FileDateDecorationProvider();
        global.gc();

        baseline = heapUsedMB();
        peak = baseline;
        await capturePerformanceMemory(`pre-run (${ACTIVE_LOG_PROFILE})`);

        console.log('🧪 Memory soak test starting');
        console.log(`   Iterations: ${ITERATIONS}`);
        console.log(`   Max heap delta allowed: ${MAX_HEAP_DELTA_MB} MB`);
        console.log(`   Sample files: ${sampleFiles.length}`);
        console.log(`   Hit phase: ${INCLUDE_HIT_PHASE ? `enabled (${HIT_PHASE_ITERATIONS} iterations)` : 'disabled'}`);
        console.log(`   Log profile: ${ACTIVE_LOG_PROFILE}${shouldForceStressLogProfile ? ' (auto-enabled for zero-delay run)' : ''}`);
        console.log(`   Forced cache bypass: ${FORCE_CACHE_BYPASS ? 'enabled' : 'disabled'}`);

        if (INCLUDE_HIT_PHASE) {
            // Prime the cache so we can observe hit behavior and ensure cache bookkeeping
            // does not leak when entries are reused.
            for (const uri of sampleFiles) {
                await provider.provideFileDecoration(uri);
            }
            global.gc();

            for (let iteration = 0; iteration < HIT_PHASE_ITERATIONS; iteration++) {
                for (const uri of sampleFiles) {
                    await provider.provideFileDecoration(uri);
                }
                if ((iteration + 1) % 50 === 0) {
                    global.gc();
                    const current = heapUsedMB();
                    peak = Math.max(peak, current);
                    console.log(`   • Hit phase ${iteration + 1}/${HIT_PHASE_ITERATIONS} – heap ${current} MB (peak ${peak} MB)`);
                } else {
                    peak = Math.max(peak, heapUsedMB());
                }
            }
        }

        console.log('   Miss phase starting (forces incremental refresh scheduling)...');
        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            for (const uri of sampleFiles) {
                await provider.provideFileDecoration(uri);
            }

            provider._scheduleIncrementalRefresh('memory-soak');
            await delay(BATCH_DELAY_MS);

            if ((iteration + 1) % 50 === 0) {
                global.gc();
                const current = heapUsedMB();
                peak = Math.max(peak, current);
                
                // Capture detailed heap snapshot at key marks
                captureHeapSnapshot(`iteration-${iteration + 1}`);
                const timerCount = provider._incrementalRefreshTimers?.size || 0;
                const cacheSize = provider._decorationCache?.size || 0;
                
                console.log(`   • Iteration ${iteration + 1}/${ITERATIONS} – heap ${current} MB (peak ${peak} MB)`);
                console.log(`     └─ timers: ${timerCount}, cache entries: ${cacheSize}`);
            } else {
                peak = Math.max(peak, heapUsedMB());
            }
            
            // Detailed snapshots at 500, 1000, 1500 iterations
            const iterCount = iteration + 1;
            if (iterCount === 500 || iterCount === 1000 || iterCount === 1500) {
                global.gc();
                const snapshot = captureHeapSnapshot(`critical-${iterCount}`);
                const timerCount = provider._incrementalRefreshTimers?.size || 0;
                const cacheSize = provider._decorationCache?.size || 0;
                const cacheHits = provider._metrics?.cacheHits || 0;
                const cacheMisses = provider._metrics?.cacheMisses || 0;
                const hitRate = cacheHits / (cacheHits + cacheMisses) || 0;
                
                console.log(`\n🔍 HEAP SNAPSHOT @ iteration ${iterCount}:`);
                console.log(`   Heap: ${snapshot.heapUsedMB} MB | RSS: ${snapshot.rss} MB`);
                console.log(`   Timers scheduled: ${timerCount} | Cache entries: ${cacheSize}`);
                console.log(`   Hit rate: ${(hitRate * 100).toFixed(2)}% (${cacheHits} hits / ${cacheHits + cacheMisses} total)`);
                console.log('');
            }
        }

        // Allow any staged incremental timers to complete before final measurement
        await delay(Math.min(provider._refreshInterval || 1000, 1500));
        snapshotLog = snapshots.slice();
        snapshots.length = 0;
        global.gc();

        finalHeap = heapUsedMB();
        delta = Number((finalHeap - baseline).toFixed(2));
        providerMetrics = typeof provider.getMetrics === 'function' ? provider.getMetrics() : null;
        await capturePerformanceMemory('post-run');

        console.log('📈 Memory summary:');
        console.log(`   Baseline heap: ${baseline} MB`);
        console.log(`   Peak heap:     ${peak} MB`);
        console.log(`   Final heap:    ${finalHeap} MB`);
        console.log(`   Delta:         ${delta} MB`);
        
        // Output heap snapshot timeline
        if (snapshotLog.length > 0) {
            console.log('\n📊 Heap snapshot timeline:');
            snapshotLog.forEach(snap => {
                console.log(`   ${snap.label}: ${snap.heapUsedMB} MB (RSS: ${snap.rss} MB)`);
            });
        }

        if (delta > MAX_HEAP_DELTA_MB) {
            console.error(`❌ Heap grew by ${delta} MB (limit ${MAX_HEAP_DELTA_MB} MB)`);
            exitCode = 1;
        } else {
            console.log(`✅ Heap growth (${delta} MB) within limit (${MAX_HEAP_DELTA_MB} MB)`);
        }
    } catch (error) {
        console.error('❌ Memory soak test failed with error:', error);
        exitCode = 1;
    } finally {
        if (provider) {
            await provider.dispose();
        }
        persistSoakLog({
            timestamp: new Date().toISOString(),
            runMetadata,
            exitCode,
            heap: {
                baselineMB: baseline,
                peakMB: peak,
                finalMB: finalHeap,
                deltaMB: delta
            },
            snapshots: snapshotLog,
            perfSnapshots,
            providerMetrics
        });
        mockInstall.dispose();
        process.exit(exitCode);
    }
})();
