#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { performance } = require('perf_hooks');

const {
    PRESET_DEFINITIONS,
    CHUNK_SIZES,
    BASE_BUNDLE_SIZE,
    calculateBundleSize
} = require('../src/presetDefinitions');
const { CHUNK_MAP } = require('../src/shared/chunkMap');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { BaselineManager } = require('./baseline-manager');

const artifactsDir = path.join(__dirname, 'artifacts', 'performance');
const trendFile = path.join(artifactsDir, 'baseline-trend.json');
const DRIFT_THRESHOLD = 0.10; // 10% latency drift
const BUNDLE_DRIFT_THRESHOLD = 0.05; // 5% built bundle drift
const DECORATION_DRIFT_FLOOR_MS = 5; // ignore smaller absolute deltas to avoid timer noise
const FILE_STAT_DRIFT_FLOOR_MS = 2;
const MAX_HISTORY = 20;
const DECORATION_TOLERANCE = Number(process.env.EXPLORER_DATES_DECORATION_TOLERANCE || DRIFT_THRESHOLD);
const FILE_STAT_TOLERANCE = Number(process.env.EXPLORER_DATES_FILE_STAT_TOLERANCE || DRIFT_THRESHOLD);
const BUNDLE_TOLERANCE = Number(process.env.EXPLORER_DATES_BUNDLE_TOLERANCE || BUNDLE_DRIFT_THRESHOLD);
const BUNDLE_MIN_DELTA_KB = Number(process.env.EXPLORER_DATES_BUNDLE_MIN_DELTA_KB || 10);

const baselineManager = new BaselineManager({
    metrics: {
        decoration_latency_ms: {
            label: 'Decoration latency',
            unit: 'ms',
            tolerancePct: DECORATION_TOLERANCE,
            minRegressionDelta: DECORATION_DRIFT_FLOOR_MS
        },
        file_stat_latency_ms: {
            label: 'File stat latency',
            unit: 'ms',
            tolerancePct: FILE_STAT_TOLERANCE,
            minRegressionDelta: FILE_STAT_DRIFT_FLOOR_MS
        }
    }
});

baselineManager.defineMetric('bundle_node_total_kb', {
    label: 'Node bundle size',
    unit: 'KB',
    tolerancePct: BUNDLE_TOLERANCE,
    minRegressionDelta: BUNDLE_MIN_DELTA_KB
});

baselineManager.defineMetric('bundle_web_total_kb', {
    label: 'Web bundle size',
    unit: 'KB',
    tolerancePct: BUNDLE_TOLERANCE,
    minRegressionDelta: BUNDLE_MIN_DELTA_KB
});

const baselineResults = {
    bundleSizes: null,
    decorationLatency: null,
    builtBundles: null
};

async function ensureArtifactsDir() {
    await fsp.mkdir(artifactsDir, { recursive: true });
}

async function pathExists(targetPath) {
    try {
        await fsp.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function readBuiltBundleSnapshot() {
    const chunkNames = Object.keys(CHUNK_MAP || {});
    const snapshot = {
        node: { totalKB: 0, chunks: {}, missing: [], zeroByte: [] },
        web: { totalKB: 0, chunks: {}, missing: [], zeroByte: [] }
    };

    for (const target of ['node', 'web']) {
        const dir = path.join(__dirname, '..', 'dist', target === 'web' ? 'web-chunks' : 'chunks');
        const dirExists = await pathExists(dir);
        if (!dirExists) {
            snapshot[target].missing = chunkNames.slice();
            continue;
        }

        for (const chunkName of chunkNames) {
            const chunkPath = path.join(dir, `${chunkName}.js`);
            try {
                const stats = await fsp.stat(chunkPath);
                const sizeKB = Number((stats.size / 1024).toFixed(2));
                snapshot[target].chunks[chunkName] = sizeKB;
                snapshot[target].totalKB += sizeKB;
                if (stats.size === 0) {
                    snapshot[target].zeroByte.push(chunkName);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    snapshot[target].chunks[chunkName] = null;
                    snapshot[target].missing.push(chunkName);
                    continue;
                }
                throw error;
            }
        }

        snapshot[target].totalKB = Number(snapshot[target].totalKB.toFixed(2));
    }

    return snapshot;
}

async function readTrendHistory() {
    try {
        const raw = await fsp.readFile(trendFile, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.warn(`⚠️ Unable to read performance trend file: ${error.message}`);
        return [];
    }
}

function detectLatencyRegression(label, previous, current, floorMs) {
    if (typeof previous !== 'number' || typeof current !== 'number') {
        return null;
    }
    if (previous <= 0) {
        return null;
    }
    const delta = current - previous;
    if (delta <= 0) {
        return null;
    }
    const drift = delta / previous;
    if (drift > DRIFT_THRESHOLD && delta >= floorMs) {
        return new Error(`${label} regressed by ${(drift * 100).toFixed(1)}% (Δ${delta.toFixed(2)}ms; was ${previous}ms, now ${current}ms)`);
    }
    return null;
}

async function writeTrendHistory(entry) {
    const history = await readTrendHistory();
    const last = history[history.length - 1];
    let regressionError = null;

    if (last) {
        regressionError = detectLatencyRegression(
            'Decoration latency',
            last.avgDecorationMs,
            entry.avgDecorationMs,
            DECORATION_DRIFT_FLOOR_MS
        );
        if (!regressionError) {
            regressionError = detectLatencyRegression(
                'File stat latency',
                last.avgFileStatMs,
                entry.avgFileStatMs,
                FILE_STAT_DRIFT_FLOOR_MS
            );
        }
        const checkBundleDrift = (target) => {
            const previous = last.builtBundles?.[target]?.totalKB;
            const current = entry.builtBundles?.[target]?.totalKB;
            if (!previous || !current || previous <= 0) {
                return null;
            }
            const drift = (current - previous) / previous;
            if (drift > BUNDLE_DRIFT_THRESHOLD) {
                return new Error(`${target.toUpperCase()} built bundle grew by ${(drift * 100).toFixed(1)}% (was ${previous}KB, now ${current}KB)`);
            }
            return null;
        };

        if (!regressionError) {
            regressionError = checkBundleDrift('node');
        }
        if (!regressionError) {
            regressionError = checkBundleDrift('web');
        }
    }

    history.push(entry);
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }

    await ensureArtifactsDir();
    await fsp.writeFile(trendFile, JSON.stringify(history, null, 2));
    console.log(`📁 Baseline trend updated at ${trendFile}`);
    if (process.env.CI) {
        console.log('💡 Upload this file as a CI artifact to retain performance history across runs.');
    }

    if (regressionError) {
        throw regressionError;
    }
}

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        throw error;
    }
}

async function testPresetBundleSizes() {
    await runTest('Preset bundle sizes stay aligned with targets', async () => {
        const snapshot = {};
        for (const preset of Object.values(PRESET_DEFINITIONS)) {
            const calculated = calculateBundleSize(preset.settings);
            assert.strictEqual(
                calculated,
                preset.targetBundleSize,
                `${preset.id} bundle size drifted (expected ${preset.targetBundleSize}KB, got ${calculated}KB)`
            );
            snapshot[preset.id] = calculated;
        }

        const baseline = calculateBundleSize({});
        assert.strictEqual(baseline, BASE_BUNDLE_SIZE, 'Baseline bundle size should match the core bundle');
        snapshot.__baseline = baseline;

        const deltas = [
            ['explorerDates.enableOnboardingSystem', CHUNK_SIZES.onboarding],
            ['explorerDates.enableAnalysisCommands', CHUNK_SIZES.analysisCommands],
            ['explorerDates.enableExportReporting', CHUNK_SIZES.exportReporting],
            ['explorerDates.enableExtensionApi', CHUNK_SIZES.extensionApi],
            ['explorerDates.enableWorkspaceTemplates', CHUNK_SIZES.workspaceTemplates],
            ['explorerDates.enableAdvancedCache', CHUNK_SIZES.advancedCache],
            ['explorerDates.enableWorkspaceIntelligence', CHUNK_SIZES.workspaceIntelligence],
            ['explorerDates.enableIncrementalWorkers', CHUNK_SIZES.incrementalWorkers]
        ];

        for (const [setting, expectedDelta] of deltas) {
            const size = calculateBundleSize({ [setting]: true });
            assert.strictEqual(
                size - BASE_BUNDLE_SIZE,
                expectedDelta,
                `${setting} should add ${expectedDelta}KB to the bundle`
            );
        }

        snapshot.__chunkSizes = { ...CHUNK_SIZES };
        baselineResults.bundleSizes = snapshot;
        baselineResults.builtBundles = await readBuiltBundleSnapshot();
        const missingNode = baselineResults.builtBundles.node.missing.length;
        const missingWeb = baselineResults.builtBundles.web.missing.length;
        const zeroNode = baselineResults.builtBundles.node.zeroByte.length;
        const zeroWeb = baselineResults.builtBundles.web.zeroByte.length;
        const formatChunkList = (chunks) => (chunks.length ? chunks.join(', ') : 'none');
        if (missingNode || missingWeb || zeroNode || zeroWeb) {
            console.warn(
                `⚠️ Chunk health check — missing (node:${missingNode}, web:${missingWeb}), zero-byte (node:${zeroNode}, web:${zeroWeb})`
            );
            if (missingNode) {
                console.warn(`   Missing node chunks: ${formatChunkList(baselineResults.builtBundles.node.missing)}`);
            }
            if (missingWeb) {
                console.warn(`   Missing web chunks: ${formatChunkList(baselineResults.builtBundles.web.missing)}`);
            }
            if (zeroNode) {
                console.warn(`   Zero-byte node chunks: ${formatChunkList(baselineResults.builtBundles.node.zeroByte)}`);
            }
            if (zeroWeb) {
                console.warn(`   Zero-byte web chunks: ${formatChunkList(baselineResults.builtBundles.web.zeroByte)}`);
            }
        }
        assert.strictEqual(
            missingNode,
            0,
            `Missing node chunk artifacts: ${formatChunkList(baselineResults.builtBundles.node.missing)} (run "npm run package-chunks")`
        );
        assert.strictEqual(
            missingWeb,
            0,
            `Missing web chunk artifacts: ${formatChunkList(baselineResults.builtBundles.web.missing)} (run "npm run package-chunks")`
        );
        assert.strictEqual(
            zeroNode,
            0,
            `Zero-byte node chunk artifacts detected: ${formatChunkList(baselineResults.builtBundles.node.zeroByte)} (rebuild the chunks)`
        );
        assert.strictEqual(
            zeroWeb,
            0,
            `Zero-byte web chunk artifacts detected: ${formatChunkList(baselineResults.builtBundles.web.zeroByte)} (rebuild the chunks)`
        );
        if (Number.isFinite(baselineResults.builtBundles?.node?.totalKB)) {
            baselineManager.record(
                'bundle_node_total_kb',
                Number(baselineResults.builtBundles.node.totalKB.toFixed(2)),
                { missingChunks: missingNode, zeroByteChunks: zeroNode }
            );
        }
        if (Number.isFinite(baselineResults.builtBundles?.web?.totalKB)) {
            baselineManager.record(
                'bundle_web_total_kb',
                Number(baselineResults.builtBundles.web.totalKB.toFixed(2)),
                { missingChunks: missingWeb, zeroByteChunks: zeroWeb }
            );
        }
    });
}

async function testDecorationLatencyBaseline() {
    await runTest('Decoration latency baseline stays under 15ms', async () => {
        const mockInstall = createTestMock();
        const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
        const provider = new FileDateDecorationProvider();

        const targetPath = path.join(mockInstall.workspaceRoot, 'package.json');
        const uri = VSCodeUri.file(targetPath);

        try {
            for (let i = 0; i < 5; i++) {
                await provider.provideFileDecoration(uri, { isCancellationRequested: false });
            }

            const measurements = [];
            for (let i = 0; i < 20; i++) {
                const start = performance.now();
                await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                measurements.push(performance.now() - start);
            }

            const average = measurements.reduce((sum, value) => sum + value, 0) / measurements.length;
            assert.ok(
                average < 15,
                `Average decoration latency should stay under 15ms, observed ${average.toFixed(2)}ms`
            );

            const metrics = provider.getMetrics();
            const avgFileStat = parseFloat(metrics.performanceTiming.avgFileStatMs);
            assert.ok(
                avgFileStat <= 10,
                `Average file stat time should stay under 10ms, observed ${avgFileStat}ms`
            );

            baselineResults.decorationLatency = {
                avgDecorationMs: Number(average.toFixed(2)),
                avgFileStatMs: Number(avgFileStat.toFixed(2)),
                sampleCount: measurements.length,
                timestamp: new Date().toISOString()
            };
            baselineManager.record('decoration_latency_ms', baselineResults.decorationLatency.avgDecorationMs, {
                samples: measurements.length
            });
            baselineManager.record('file_stat_latency_ms', baselineResults.decorationLatency.avgFileStatMs);
            if (!baselineResults.bundleSizes) {
                throw new Error('Bundle size snapshot unavailable; performance trend cannot be recorded');
            }
            await writeTrendHistory({
                timestamp: baselineResults.decorationLatency.timestamp,
                avgDecorationMs: baselineResults.decorationLatency.avgDecorationMs,
                avgFileStatMs: baselineResults.decorationLatency.avgFileStatMs,
                sampleCount: baselineResults.decorationLatency.sampleCount,
                bundleSizes: baselineResults.bundleSizes,
                builtBundles: baselineResults.builtBundles
            });
        } finally {
            await provider.dispose();
            mockInstall.dispose();
        }
    });
}

async function main() {
    try {
        await testPresetBundleSizes();
        await testDecorationLatencyBaseline();

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
            const summary = regressions
                .map((result) => {
                    const unit = result.unit || '';
                    return ` - ${result.message} (baseline ${result.baseline}${unit})`;
                })
                .join('\n');
            throw new Error(`Performance baseline regressions detected:\n${summary}`);
        }

        console.log('\n📈 Performance baseline tests completed successfully');
    } catch (error) {
        console.error('\n❌ Performance baseline tests failed:', error);
        process.exitCode = 1;
    }
}

main();
