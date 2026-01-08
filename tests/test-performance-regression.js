#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const fsp = fs.promises;

// Setup mock environment before requiring chunks
const { createTestMock, expectChunkOrFail } = require('./helpers/mockVscode');
const { BaselineManager, LATEST_METRICS_FILE, ARTIFACTS_DIR } = require('./baseline-manager');

const mock = createTestMock();

const workspaceRoot = path.resolve(__dirname, '..');
const logsDir = path.join(workspaceRoot, 'logs');
const ciArtifactsDir = path.join(workspaceRoot, 'ci-artifacts');
const localChunkBaselineFile = process.env.EXPLORER_DATES_LOCAL_CHUNK_BASELINE
    || path.join(logsDir, 'chunk-load-baseline.json');
const ciChunkBaselineFile = process.env.EXPLORER_DATES_CI_BASELINE_PATH
    || path.join(ciArtifactsDir, 'chunk-load-baseline.json');
const ciMetricsFile = path.join(ciArtifactsDir, 'performance-metrics.json');
const ciTrendFile = path.join(ciArtifactsDir, 'performance-baseline-trend.json');
const latestMetricsFile = LATEST_METRICS_FILE;
const localTrendFile = path.join(ARTIFACTS_DIR, 'baseline-trend.json');
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
    },
    localBaselineFile: localChunkBaselineFile,
    latestMetricsFile
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

async function readJsonFile(filePath) {
    try {
        const raw = await fsp.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
}

function collectMetricValues(manager) {
    const metrics = {};
    const meta = {};
    for (const [key, entry] of manager.measurements.entries()) {
        if (entry && typeof entry.value === 'number') {
            metrics[key] = entry.value;
            const metricConfig = manager.metrics?.[key] || {};
            meta[key] = {
                label: metricConfig.label || key,
                unit: metricConfig.unit || ''
            };
        }
    }
    return { metrics, meta };
}

function normalizeSnapshot(raw) {
    if (!raw) {
        return null;
    }
    if (Array.isArray(raw)) {
        return normalizeSnapshot(raw[raw.length - 1]);
    }
    if (typeof raw !== 'object') {
        return null;
    }

    const coerceMetricMap = (value) => {
        if (Array.isArray(value)) {
            const map = {};
            value.forEach((entry) => {
                if (!entry || typeof entry !== 'object') {
                    return;
                }
                const key = entry.key || entry.name;
                if (key && typeof entry.value === 'number') {
                    map[key] = entry.value;
                }
            });
            return map;
        }
        if (value && typeof value === 'object') {
            return value;
        }
        return null;
    };

    const metricMap = coerceMetricMap(raw.metrics);
    if (metricMap) {
        return {
            ...raw,
            metrics: metricMap
        };
    }

    const metrics = {};
    let hasAny = false;
    for (const key of Object.keys(baselineManager.metrics || {})) {
        if (typeof raw[key] === 'number') {
            metrics[key] = raw[key];
            hasAny = true;
        }
    }
    if (!hasAny) {
        return null;
    }
    return {
        generatedAt: raw.generatedAt || raw.updatedAt || null,
        metrics,
        chunks: raw.chunks || {},
        heapUsedMb: raw.heapUsedMb || raw.heap_used_mb || metrics.heap_used_mb,
        environment: raw.environment || {}
    };
}

function normalizeMetricEntries(container) {
    if (!container) {
        return [];
    }
    if (Array.isArray(container.metrics)) {
        return container.metrics;
    }
    if (Array.isArray(container)) {
        return container;
    }
    if (container.metrics && typeof container.metrics === 'object') {
        return Object.entries(container.metrics).map(([key, value]) => ({
            key,
            value
        }));
    }
    if (typeof container === 'object') {
        return Object.entries(container)
            .filter(([, value]) => typeof value === 'number')
            .map(([key, value]) => ({ key, value }));
    }
    return [];
}

function buildMetricData(entries) {
    const map = {};
    const meta = {};
    entries.forEach((entry) => {
        if (!entry || typeof entry !== 'object') {
            return;
        }
        const key = entry.key || entry.name;
        const value = typeof entry.value === 'number'
            ? entry.value
            : typeof entry.latest === 'number'
                ? entry.latest
                : undefined;
        if (!key || typeof value !== 'number') {
            return;
        }
        map[key] = value;
        meta[key] = {
            label: entry.label || entry.title || key,
            unit: entry.unit || entry.units || ''
        };
    });
    return { map, meta };
}

async function loadMetricsSnapshot(filePath) {
    const raw = await readJsonFile(filePath);
    if (!raw) {
        return null;
    }
    const entries = normalizeMetricEntries(raw);
    const data = buildMetricData(entries);
    return {
        generatedAt: raw.generatedAt || raw.timestamp || null,
        ...data
    };
}

function mergeMetricData(base = {}, updates = {}) {
    return {
        map: { ...(base.map || {}), ...(updates.map || {}) },
        meta: { ...(base.meta || {}), ...(updates.meta || {}) }
    };
}

async function loadTrendMetrics(filePath) {
    const raw = await readJsonFile(filePath);
    if (!raw) {
        return null;
    }
    const entry = Array.isArray(raw) ? raw[raw.length - 1] : raw;
    if (!entry || typeof entry !== 'object') {
        return null;
    }
    const map = {};
    const meta = {};
    if (typeof entry.avgDecorationMs === 'number') {
        map.decoration_latency_ms = Number(entry.avgDecorationMs.toFixed(2));
        meta.decoration_latency_ms = { label: 'Decoration latency', unit: 'ms' };
    }
    if (typeof entry.avgFileStatMs === 'number') {
        map.file_stat_latency_ms = Number(entry.avgFileStatMs.toFixed(2));
        meta.file_stat_latency_ms = { label: 'File stat latency', unit: 'ms' };
    }
    if (entry.builtBundles?.node?.totalKB) {
        map.bundle_node_total_kb = Number(entry.builtBundles.node.totalKB.toFixed(2));
        meta.bundle_node_total_kb = { label: 'Node bundle size', unit: 'KB' };
    }
    if (entry.builtBundles?.web?.totalKB) {
        map.bundle_web_total_kb = Number(entry.builtBundles.web.totalKB.toFixed(2));
        meta.bundle_web_total_kb = { label: 'Web bundle size', unit: 'KB' };
    }
    return Object.keys(map).length ? { map, meta } : null;
}

function printMetricMapComparison(title, localData, remoteData) {
    const remoteMap = remoteData?.map || {};
    if (!Object.keys(remoteMap).length) {
        console.log(`ℹ️ ${title}: no data found.`);
        return;
    }
    console.log(`📊 ${title}:`);
    const localMap = localData?.map || {};
    const localMeta = localData?.meta || {};
    const remoteMeta = remoteData?.meta || {};
    let comparedAny = false;
    for (const [key, remoteValue] of Object.entries(remoteMap)) {
        const localValue = localMap[key];
        const meta = remoteMeta[key] || localMeta[key] || {};
        const unit = meta.unit || '';
        const label = meta.label || key;
        comparedAny = true;
        if (typeof localValue === 'number') {
            const { icon, summary } = describeDelta(localValue, remoteValue, unit);
            console.log(`   ${icon} ${label}: ${summary}`);
        } else {
            console.log(
                `   ℹ️ ${label}: no local measurement (CI ${formatValue(remoteValue, unit)})`
            );
        }
    }
    if (!comparedAny) {
        console.log('   (no overlapping metrics to compare)');
    }
}

async function writeMetricsSnapshot(filePath, metricData, generatedAt = new Date().toISOString()) {
    if (!metricData || !Object.keys(metricData.map || {}).length) {
        return;
    }
    const entries = Object.keys(metricData.map)
        .sort()
        .map((key) => ({
            key,
            value: metricData.map[key],
            label: metricData.meta?.[key]?.label || key,
            unit: metricData.meta?.[key]?.unit || ''
        }));
    await writeJsonFile(filePath, {
        generatedAt,
        metrics: entries
    });
}

async function loadBaselineSnapshot(filePath) {
    const raw = await readJsonFile(filePath);
    return normalizeSnapshot(raw);
}

function formatValue(value, unit) {
    if (typeof value !== 'number') {
        return `n/a${unit || ''}`;
    }
    return `${value.toFixed(2)}${unit || ''}`;
}

function describeDelta(current, baseline, unit) {
    if (typeof current !== 'number' || typeof baseline !== 'number') {
        return { icon: 'ℹ️', summary: 'Not enough data' };
    }
    const delta = Number((current - baseline).toFixed(2));
    const pct = baseline !== 0 ? (delta / baseline) * 100 : null;
    const trend = delta === 0 ? 'matched' : delta < 0 ? 'faster' : 'slower';
    const icon = delta === 0 ? '➖' : delta < 0 ? '✅' : '⚠️';
    const pctText = pct === null ? 'n/a' : `${Math.abs(pct).toFixed(1)}%`;
    return {
        icon,
        summary: `${formatValue(current, unit)} vs ${formatValue(baseline, unit)} (${pctText} ${trend})`
    };
}

function printComparison(title, current, baseline) {
    if (!baseline) {
        console.log(`ℹ️ ${title}: no baseline data found.`);
        return;
    }
    console.log(`📈 ${title}:`);
    let comparedAny = false;
    for (const [key, meta] of Object.entries(baselineManager.metrics)) {
        const currentValue = current.metrics?.[key];
        const baselineValue =
            baseline.metrics?.[key] ??
            (typeof baseline[key] === 'number' ? baseline[key] : undefined);
        if (typeof currentValue !== 'number' || typeof baselineValue !== 'number') {
            continue;
        }
        comparedAny = true;
        const { icon, summary } = describeDelta(currentValue, baselineValue, meta.unit);
        console.log(`   ${icon} ${meta.label}: ${summary}`);
    }
    if (!comparedAny) {
        console.log('   (no overlapping metrics to compare)');
    }
}

async function saveBaselineSnapshot(filePath, snapshot) {
    await writeJsonFile(filePath, snapshot);
}

async function main() {
    console.log('⏱️  Running performance regression checks...');

    const [localBaselineSnapshot, ciBaselineSnapshot] = await Promise.all([
        loadBaselineSnapshot(localChunkBaselineFile),
        loadBaselineSnapshot(ciChunkBaselineFile)
    ]);

    const chunkDurations = [];
    const chunkDurationMap = {};
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
        chunkDurationMap[chunkName] = durationMs;
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
    const chunkMetricData = collectMetricValues(baselineManager);
    const snapshot = {
        generatedAt: new Date().toISOString(),
        metrics: chunkMetricData.metrics,
        chunks: chunkDurationMap,
        heapUsedMb: heapUsed,
        environment: {
            node: process.version,
            platform: process.platform,
            ci: Boolean(process.env.CI || process.env.GITHUB_ACTIONS)
        }
    };

    const existingLocalMetrics = await loadMetricsSnapshot(latestMetricsFile);
    const trendMetricData = await loadTrendMetrics(localTrendFile);
    let combinedLocalMetrics = mergeMetricData(existingLocalMetrics || {}, trendMetricData || {});
    combinedLocalMetrics = mergeMetricData(combinedLocalMetrics, chunkMetricData);

    printComparison('Local baseline', snapshot, localBaselineSnapshot);
    printComparison('CI chunk baseline', snapshot, ciBaselineSnapshot);

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

    await saveBaselineSnapshot(localChunkBaselineFile, snapshot);
    console.log(`💾 Saved local baseline to ${path.relative(workspaceRoot, localChunkBaselineFile)}`);

    await writeMetricsSnapshot(latestMetricsFile, combinedLocalMetrics, snapshot.generatedAt);

    const runningInCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
    if (runningInCI) {
        await saveBaselineSnapshot(ciChunkBaselineFile, snapshot);
        console.log(`📦 Saved CI baseline artifact to ${path.relative(workspaceRoot, ciChunkBaselineFile)}`);
    }

    const ciMetrics = await loadMetricsSnapshot(ciMetricsFile);
    printMetricMapComparison('CI performance metrics', combinedLocalMetrics, ciMetrics);

    const ciTrendMetrics = await loadTrendMetrics(ciTrendFile);
    if (ciTrendMetrics) {
        printMetricMapComparison('CI trend snapshot', combinedLocalMetrics, ciTrendMetrics);
    }

    const shouldUpdateBaselines = process.env.EXPLORER_DATES_UPDATE_PERF_BASELINES === '1';
    if (shouldUpdateBaselines) {
        const updateRemote = runningInCI;
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
