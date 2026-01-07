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
const { performance, PerformanceObserver, constants: perfConstants } = require('perf_hooks');
const { createMockVscode, VSCodeUri, workspaceRoot } = require('./helpers/mockVscode');
const {
    resolveMemoryProfile,
    applyProfileEnv,
    buildMemoryTestSettings
} = require('./helpers/memoryProfiles');
const inspector = require('inspector');
const v8 = require('v8');

if (typeof global.gc !== 'function') {
    console.error('❌ Memory soak test requires Node to run with "--expose-gc".');
    console.error('   Use "npm run test:memory" or run the script manually with:');
    console.error('   node --expose-gc tests/test-memory-soak.js');
    process.exit(1);
}

const memoryProfile = resolveMemoryProfile({ defaultProfile: '250k' });
applyProfileEnv(memoryProfile);

const {
    iterations: ITERATIONS,
    hitIterations: HIT_PHASE_ITERATIONS,
    delayMs: BATCH_DELAY_MS,
    maxDeltaMb: MAX_HEAP_DELTA_MB,
    softDeltaMb: SOFT_HEAP_DELTA_MB,
    concurrency: WORKER_CONCURRENCY
} = buildMemoryTestSettings(memoryProfile);
const INCLUDE_HIT_PHASE = process.env.MEMORY_SOAK_INCLUDE_HITS !== 'false';
const MISS_PHASE_DURATION_TARGET_MS = Math.max(0, Number(process.env.MEMORY_SOAK_DURATION_MS || 0));

const shouldForceStressLogProfile = !process.env.EXPLORER_DATES_LOG_PROFILE && BATCH_DELAY_MS === 0;
if (shouldForceStressLogProfile) {
    process.env.EXPLORER_DATES_LOG_PROFILE = 'stress';
}
const ACTIVE_LOG_PROFILE = (process.env.EXPLORER_DATES_LOG_PROFILE || 'default').toLowerCase();
const FORCE_CACHE_BYPASS = process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS === '1';
const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const profileTag = memoryProfile.key.replace(/[^a-z0-9-]/gi, '') || 'profile';
const logDir = path.join(workspaceRoot, 'logs');
const logFilePath = path.join(logDir, `memory-soak-${profileTag}-${runTimestamp}.json`);
const historyFilePath = path.join(logDir, 'memory-soak-history.json');
const baseScenarioLabel = process.env.MEMORY_SOAK_LABEL
    || (FORCE_CACHE_BYPASS ? 'forced-cache-bypass' : 'default');
const SCENARIO_LABEL = `${baseScenarioLabel}-${profileTag}`;
const runMetadata = {
    iterations: ITERATIONS,
    maxDeltaMb: MAX_HEAP_DELTA_MB,
    delayMs: BATCH_DELAY_MS,
    includeHitPhase: INCLUDE_HIT_PHASE,
    hitPhaseIterations: HIT_PHASE_ITERATIONS,
    concurrency: WORKER_CONCURRENCY,
    durationTargetMs: MISS_PHASE_DURATION_TARGET_MS || null,
    logProfile: ACTIVE_LOG_PROFILE,
    logProfileAutoEnabled: shouldForceStressLogProfile,
    forceCacheBypass: FORCE_CACHE_BYPASS,
    scenario: SCENARIO_LABEL,
    workspaceProfile: memoryProfile.key,
    workspaceFileCount: memoryProfile.fileCount
};

console.log(`\n🏗️ Workspace profile: ${memoryProfile.label} (${memoryProfile.fileCount.toLocaleString()} files)`);
if (memoryProfile.description) {
    console.log(`   ${memoryProfile.description}`);
}

const mockInstall = createMockVscode({
    config: {
        'explorerDates.badgeRefreshInterval': memoryProfile.badgeRefreshInterval ?? 1500,
        'explorerDates.showDateDecorations': true,
        'explorerDates.colorScheme': 'recency'
    },
    mockWorkspaceFileCount: memoryProfile.fileCount,
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

const CAPTURE_SNAPSHOTS = process.env.MEMORY_SOAK_CAPTURE_SNAPSHOTS === '1';
const CAPTURE_HEAP_FILES = process.env.MEMORY_SOAK_CAPTURE_HEAP === '1';

function heapUsedMB() {
    return Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
}

function forceGcCycles(count = 3) {
    if (typeof global.gc !== 'function') {
        return;
    }
    for (let i = 0; i < count; i++) {
        global.gc();
    }
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
    
    if (CAPTURE_SNAPSHOTS && snapshots) {
        snapshots.push(snapshot);
    }
    
    return snapshot;
}

const snapshots = CAPTURE_SNAPSHOTS ? [] : null;
const perfSnapshots = [];
const processSnapshots = [];
const retainedSnapshots = [];
let perfWarningLogged = false;
let snapshotTimeline = null;
let heapSnapshotFiles = { baseline: null, final: null };
let softThresholdAlert = false;
const gcStats = {
    total: 0,
    major: 0,
    minor: 0,
    incremental: 0,
    weakCb: 0,
    forced: 0,
    durationMs: 0
};
let gcObserver = null;

if (typeof PerformanceObserver === 'function') {
    try {
        gcObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const detail = entry?.detail || entry;
                const kind = detail?.kind ?? entry?.kind;
                const flags = detail?.flags ?? entry?.flags ?? 0;

                gcStats.total++;
                gcStats.durationMs = Number((gcStats.durationMs + entry.duration).toFixed(2));
                switch (kind) {
                    case perfConstants?.NODE_PERFORMANCE_GC_MAJOR:
                        gcStats.major++;
                        break;
                    case perfConstants?.NODE_PERFORMANCE_GC_MINOR:
                        gcStats.minor++;
                        break;
                    case perfConstants?.NODE_PERFORMANCE_GC_INCREMENTAL:
                        gcStats.incremental++;
                        break;
                    case perfConstants?.NODE_PERFORMANCE_GC_WEAKCB:
                        gcStats.weakCb++;
                        break;
                    default:
                        break;
                }
                if (perfConstants?.NODE_PERFORMANCE_GC_FLAGS_FORCED &&
                    (flags & perfConstants.NODE_PERFORMANCE_GC_FLAGS_FORCED)) {
                    gcStats.forced++;
                }
            }
        });
        gcObserver.observe({ entryTypes: ['gc'], buffered: false });
    } catch (error) {
        gcObserver = null;
        console.warn(`⚠️ Unable to observe GC events: ${error.message}`);
    }
}

async function captureHeapSnapshotFile(label) {
    if (!CAPTURE_HEAP_FILES) {
        return null;
    }
    const session = new inspector.Session();
    session.connect();

    await fs.promises.mkdir(logDir, { recursive: true });
    const snapshotPath = path.join(logDir, `heap-${runTimestamp}-${label}.heapsnapshot`);
    const writeStream = fs.createWriteStream(snapshotPath);

    return new Promise((resolve, reject) => {
        session.on('HeapProfiler.addHeapSnapshotChunk', (message) => {
            writeStream.write(message.params.chunk);
        });

        session.post('HeapProfiler.takeHeapSnapshot', null, (err) => {
            if (err) {
                writeStream.end(() => {
                    session.disconnect();
                    reject(err);
                });
                return;
            }
            writeStream.end(() => {
                session.disconnect();
                resolve(snapshotPath);
            });
        });
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDecorationPass(providerInstance) {
    const pass = async () => {
        for (const uri of sampleFiles) {
            await providerInstance.provideFileDecoration(uri);
        }
    };

    if (WORKER_CONCURRENCY <= 1) {
        await pass();
        return;
    }

    const workers = [];
    for (let worker = 0; worker < WORKER_CONCURRENCY; worker++) {
        workers.push(pass());
    }
    await Promise.all(workers);
}

function recordProcessSnapshot(label) {
    const usage = process.memoryUsage();
    const snapshot = {
        label,
        timestamp: new Date().toISOString(),
        heapUsedMB: Number((usage.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMB: Number((usage.heapTotal / 1024 / 1024).toFixed(2)),
        rssMB: Number((usage.rss / 1024 / 1024).toFixed(2)),
        externalMB: Number((usage.external / 1024 / 1024).toFixed(2)),
        arrayBuffersMB: Number((usage.arrayBuffers / 1024 / 1024).toFixed(2))
    };
    processSnapshots.push(snapshot);
    return snapshot;
}

function captureRetainedSnapshot(label) {
    if (!v8 || typeof v8.getHeapStatistics !== 'function') {
        return null;
    }

    try {
        const heapStats = v8.getHeapStatistics();
        const spaces = typeof v8.getHeapSpaceStatistics === 'function'
            ? v8.getHeapSpaceStatistics()
            : [];
        const oldSpace = spaces.find((space) => space.space_name === 'old_space');
        const snapshot = {
            label,
            timestamp: new Date().toISOString(),
            usedHeapMB: Number((heapStats.used_heap_size / 1024 / 1024).toFixed(2)),
            totalHeapMB: Number((heapStats.total_heap_size / 1024 / 1024).toFixed(2)),
            physicalMB: Number((heapStats.total_physical_size / 1024 / 1024).toFixed(2)),
            heapLimitMB: Number((heapStats.heap_size_limit / 1024 / 1024).toFixed(2)),
            oldSpaceMB: oldSpace ? Number((oldSpace.space_used_size / 1024 / 1024).toFixed(2)) : null
        };
        retainedSnapshots.push(snapshot);
        return snapshot;
    } catch {
        return null;
    }
}

function updateSoftThresholdHistory(delta) {
    if (isNaN(delta)) {
        return { triggered: false, previousDeltaMB: null };
    }
    let history = [];
    try {
        const raw = fs.readFileSync(historyFilePath, 'utf8');
        history = JSON.parse(raw);
        if (!Array.isArray(history)) {
            history = [];
        }
    } catch {
        history = [];
    }

    const previous = history.length > 0 ? history[history.length - 1] : null;
    const triggered = Boolean(
        previous &&
        typeof previous.deltaMB === 'number' &&
        previous.deltaMB >= SOFT_HEAP_DELTA_MB &&
        delta >= SOFT_HEAP_DELTA_MB
    );

    history.push({
        timestamp: new Date().toISOString(),
        deltaMB: delta
    });
    if (history.length > 12) {
        history = history.slice(history.length - 12);
    }

    try {
        fs.mkdirSync(logDir, { recursive: true });
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    } catch (error) {
        console.warn(`⚠️ Failed to persist memory soak history: ${error.message}`);
    }

    return {
        triggered,
        previousDeltaMB: previous ? previous.deltaMB : null
    };
}

async function capturePerformanceMemory(label) {
    const timestamp = new Date().toISOString();

    const recordSnapshot = (bytes, source) => {
        const usedBytes = typeof bytes?.jsHeapUsed === 'number'
            ? bytes.jsHeapUsed
            : typeof bytes === 'number'
                ? bytes
                : process.memoryUsage().heapUsed;

        const measurement = {
            bytes: {
                jsHeapUsed: usedBytes,
                total: bytes?.total || bytes?.totalHeap || bytes?.total_heap_size,
                heapLimit: bytes?.heapLimit || bytes?.heap_limit || bytes?.heap_size_limit
            },
            source
        };

        const summary = { label, timestamp, measurement };
        perfSnapshots.push(summary);
        const usedMb = (usedBytes / (1024 * 1024)).toFixed(2);
        console.log(`   • Perf memory snapshot (${label}, ${source}): ${usedMb} MB`);
        return summary;
    };

    const logOnce = (message) => {
        if (!perfWarningLogged) {
            console.warn(message);
            perfWarningLogged = true;
        }
    };

    try {
        if (typeof performance?.measureUserAgentSpecificMemory === 'function') {
            const measurement = await performance.measureUserAgentSpecificMemory();
            const bytes = measurement?.bytes || measurement;
            return recordSnapshot({
                jsHeapUsed: bytes?.jsHeapUsed ?? bytes?.usedJSHeapSize,
                total: bytes?.total,
                heapLimit: bytes?.jsHeapTotal ?? bytes?.heapTotal
            }, 'measureUserAgentSpecificMemory');
        }
    } catch (error) {
        logOnce(`⚠️ Failed to capture performance.measureUserAgentSpecificMemory() snapshot: ${error.message}`);
    }

    try {
        if (typeof performance?.measureMemory === 'function') {
            const measurement = await performance.measureMemory();
            const bytes = measurement?.bytes || measurement;
            return recordSnapshot({
                jsHeapUsed: bytes?.jsHeapUsed ?? bytes?.usedJSHeapSize,
                total: bytes?.total,
                heapLimit: bytes?.jsHeapTotal ?? bytes?.heapTotal
            }, 'measureMemory');
        }
    } catch (error) {
        logOnce(`⚠️ Failed to capture performance.measureMemory() snapshot: ${error.message}`);
    }

    try {
        if (typeof v8?.getHeapStatistics === 'function') {
            const stats = v8.getHeapStatistics();
            return recordSnapshot({
                jsHeapUsed: stats?.used_heap_size,
                total: stats?.total_heap_size,
                heapLimit: stats?.heap_size_limit
            }, 'v8.getHeapStatistics');
        }
    } catch (error) {
        logOnce(`⚠️ Failed to capture v8 heap statistics: ${error.message}`);
    }

    return recordSnapshot(process.memoryUsage().heapUsed, 'process.memoryUsage');
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
    let missIterationsCompleted = 0;
    let hitIterationsCompleted = 0;
    let missPhaseDurationMs = 0;

    recordProcessSnapshot('startup');

    try {
        provider = new FileDateDecorationProvider();
        forceGcCycles();
        recordProcessSnapshot('pre-baseline');
        baseline = heapUsedMB();
        captureRetainedSnapshot('baseline');
        if (CAPTURE_HEAP_FILES) {
            try {
                heapSnapshotFiles.baseline = await captureHeapSnapshotFile('baseline');
                console.log(`🧾 Baseline heap snapshot written to ${heapSnapshotFiles.baseline}`);
            } catch (snapshotError) {
                console.warn(`⚠️ Failed to capture baseline heap snapshot: ${snapshotError.message}`);
            }
        }
        peak = baseline;
        await capturePerformanceMemory(`pre-run (${ACTIVE_LOG_PROFILE})`);

        console.log('🧪 Memory soak test starting');
        console.log(`   Iterations: ${ITERATIONS}`);
        console.log(`   Max heap delta allowed: ${MAX_HEAP_DELTA_MB} MB`);
        console.log(`   Sample files: ${sampleFiles.length}`);
        console.log(`   Hit phase: ${INCLUDE_HIT_PHASE ? `enabled (${HIT_PHASE_ITERATIONS} iterations)` : 'disabled'}`);
        console.log(`   Log profile: ${ACTIVE_LOG_PROFILE}${shouldForceStressLogProfile ? ' (auto-enabled for zero-delay run)' : ''}`);
        console.log(`   Forced cache bypass: ${FORCE_CACHE_BYPASS ? 'enabled' : 'disabled'}`);
        console.log(`   Concurrency: ${WORKER_CONCURRENCY > 1 ? `${WORKER_CONCURRENCY} parallel passes` : 'sequential'}`);
        if (MISS_PHASE_DURATION_TARGET_MS > 0) {
            console.log(`   Duration target: ${MISS_PHASE_DURATION_TARGET_MS} ms`);
        }

        if (INCLUDE_HIT_PHASE) {
            // Prime the cache so we can observe hit behavior and ensure cache bookkeeping
            // does not leak when entries are reused.
            await runDecorationPass(provider);
            global.gc();

            for (let iteration = 0; iteration < HIT_PHASE_ITERATIONS; iteration++) {
                await runDecorationPass(provider);
                hitIterationsCompleted++;
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
        const missPhaseStart = Date.now();
        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            await runDecorationPass(provider);
            missIterationsCompleted++;

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

            if (MISS_PHASE_DURATION_TARGET_MS > 0) {
                const elapsed = Date.now() - missPhaseStart;
                if (elapsed >= MISS_PHASE_DURATION_TARGET_MS) {
                    console.log(`   • Miss phase duration target (${MISS_PHASE_DURATION_TARGET_MS} ms) reached at iteration ${iteration + 1}`);
                    break;
                }
            }
        }
        missPhaseDurationMs = Date.now() - missPhaseStart;

        // Allow any staged incremental timers to complete before final measurement
        await delay(Math.min(provider._refreshInterval || 1000, 1500));
        snapshotTimeline = CAPTURE_SNAPSHOTS && snapshots ? snapshots.slice() : null;
        if (CAPTURE_SNAPSHOTS && snapshots) {
            snapshots.length = 0;
        }
        forceGcCycles();

        finalHeap = heapUsedMB();
        captureRetainedSnapshot('final');
        if (CAPTURE_HEAP_FILES) {
            try {
                heapSnapshotFiles.final = await captureHeapSnapshotFile('final');
                console.log(`🧾 Final heap snapshot written to ${heapSnapshotFiles.final}`);
            } catch (snapshotError) {
                console.warn(`⚠️ Failed to capture final heap snapshot: ${snapshotError.message}`);
            }
        }
        delta = Number((finalHeap - baseline).toFixed(2));
        providerMetrics = typeof provider.getMetrics === 'function' ? provider.getMetrics() : null;
        await capturePerformanceMemory('post-run');
        recordProcessSnapshot('post-run');

        console.log('📈 Memory summary:');
        console.log(`   Baseline heap: ${baseline} MB`);
        console.log(`   Peak heap:     ${peak} MB`);
        console.log(`   Final heap:    ${finalHeap} MB`);
        console.log(`   Delta:         ${delta} MB`);
        const finalRetention = retainedSnapshots[retainedSnapshots.length - 1];
        if (finalRetention) {
            const oldSpaceLabel = typeof finalRetention.oldSpaceMB === 'number'
                ? `${finalRetention.oldSpaceMB} MB`
                : 'n/a';
            console.log(`   Retained heap: ${finalRetention.usedHeapMB} MB (old space ${oldSpaceLabel})`);
        }
        if (gcStats.total > 0) {
            console.log(
                `   GC events: ${gcStats.total} (major ${gcStats.major}, minor ${gcStats.minor}, forced ${gcStats.forced}) over ${gcStats.durationMs.toFixed(2)} ms`
            );
        }
        if (providerMetrics?.allocationTelemetry) {
            const describeAllocation = (label, stats) => {
                if (!stats) {
                    return null;
                }
                const total = (stats.allocations || 0) + (stats.reuses || 0);
                if (!total) {
                    return null;
                }
                const percent = typeof stats.reusePercent === 'number'
                    ? stats.reusePercent.toFixed(1)
                    : ((stats.reuses / total) * 100).toFixed(1);
                return `${label}: ${percent}% reuse (${stats.reuses}/${total})`;
            };
            const allocationLines = [
                describeAllocation('Decoration pool', providerMetrics.allocationTelemetry.decorationPool),
                describeAllocation('Badge flyweight', providerMetrics.allocationTelemetry.badgeFlyweight),
                describeAllocation('Readable flyweight', providerMetrics.allocationTelemetry.readableFlyweight)
            ].filter(Boolean);
            if (allocationLines.length > 0) {
                console.log('\n🧮 Allocation telemetry:');
                allocationLines.forEach(line => console.log(`   ${line}`));
            }
        }

        const softHistory = updateSoftThresholdHistory(delta);
        if (delta >= SOFT_HEAP_DELTA_MB && !softHistory.triggered) {
            console.log(`   (soft threshold ${SOFT_HEAP_DELTA_MB} MB breached, monitoring for sustained growth)`);
        }
        if (softHistory.triggered) {
            softThresholdAlert = true;
            console.warn(`⚠️ Heap delta exceeded ${SOFT_HEAP_DELTA_MB} MB in consecutive runs (previous ${softHistory.previousDeltaMB} MB, current ${delta} MB)`);
        }
        
        // Output heap snapshot timeline (optional, for debugging)
        if (snapshotTimeline && snapshotTimeline.length > 0) {
            console.log('\n📊 Heap snapshot timeline:');
            snapshotTimeline.forEach(snap => {
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
        if (gcObserver) {
            try {
                gcObserver.disconnect();
            } catch {
                // ignore observer teardown issues
            }
        }
        if (provider) {
            await provider.dispose();
        }
        if (processSnapshots.length === 0 || processSnapshots[processSnapshots.length - 1].label !== 'post-run') {
            recordProcessSnapshot('post-run');
        }
        runMetadata.missIterationsCompleted = missIterationsCompleted;
        runMetadata.hitIterationsExecuted = hitIterationsCompleted;
        runMetadata.missPhaseDurationMs = missPhaseDurationMs;
        runMetadata.sampleFiles = sampleFiles.length;
        persistSoakLog({
            timestamp: new Date().toISOString(),
            runMetadata,
            exitCode,
            heap: {
                baselineMB: baseline,
                peakMB: peak,
                finalMB: finalHeap,
                deltaMB: delta,
                retainedSnapshots,
                gcStats
            },
            heapSnapshots: heapSnapshotFiles,
            snapshots: snapshotTimeline || [],
            perfSnapshots,
            providerMetrics,
            processSnapshots,
            softThresholdAlert
        });
        mockInstall.dispose();
        process.exit(exitCode);
    }
})();
