#!/usr/bin/env node

/**
 * Analyze Phase 3 isolation matrix results and generate comparison report.
 * Reads 4 logs from test-memory-isolation-matrix.js and extracts metrics.
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

const scenarioLabels = [
    'forced-bypass-control',
    'forced-bypass-pool-only',
    'forced-bypass-flyweights-only',
    'forced-bypass-none'
];

const scenarioNames = {
    'forced-bypass-control': 'Control (Pool + Flyweights)',
    'forced-bypass-pool-only': 'Pool Only (No Flyweights)',
    'forced-bypass-flyweights-only': 'Flyweights Only (No Pool)',
    'forced-bypass-none': 'Neither (Baseline)'
};

function computeReusePercent(reuses = 0, allocations = 0, hits = 0, misses = 0) {
    const totalAlloc = reuses + allocations;
    if (totalAlloc > 0) {
        return `${((reuses / totalAlloc) * 100).toFixed(1)}%`;
    }
    const totalHits = hits + misses;
    if (totalHits > 0) {
        return `${((hits / totalHits) * 100).toFixed(1)}%`;
    }
    return '—';
}

function formatAllocationLine(label, stats = {}) {
    const allocations = stats.allocations || 0;
    const reuses = stats.reuses || 0;
    const total = allocations + reuses;
    if (!total) {
        return null;
    }
    let reusePercentValue;
    if (typeof stats.reusePercent === 'number') {
        reusePercentValue = stats.reusePercent;
    } else if (typeof stats.reusePercent === 'string') {
        const parsed = parseFloat(stats.reusePercent.replace('%', ''));
        reusePercentValue = Number.isFinite(parsed) ? parsed : null;
    } else {
        reusePercentValue = null;
    }
    const reusePercent = reusePercentValue != null
        ? reusePercentValue.toFixed(1)
        : ((reuses / total) * 100).toFixed(1);
    return `      ${label}: ${reusePercent}% reuse (${reuses}/${total})`;
}

function scenarioMatches(expected, observed) {
    if (!expected || !observed) return false;
    const normalizedExpected = String(expected).toLowerCase();
    const normalizedObserved = String(observed).toLowerCase();
    if (normalizedObserved === normalizedExpected) {
        return true;
    }
    return normalizedObserved.startsWith(`${normalizedExpected}-`);
}

function findLatestLogByScenario(scenario) {
    const files = fs.readdirSync(logsDir);
    const matching = [];

    for (const file of files) {
        if (!file.startsWith('memory-soak-') || !file.endsWith('.json')) continue;
        const fullPath = path.join(logsDir, file);
        try {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            const recordedScenario = content.runMetadata?.scenario;
            if (scenarioMatches(scenario, recordedScenario)) {
                matching.push({ file: fullPath, time: fs.statSync(fullPath).mtime });
            }
        } catch {
            // skip unparseable files
        }
    }

    if (matching.length === 0) return null;
    matching.sort((a, b) => b.time - a.time);
    return matching[0].file;
}

function extractMetrics(logPath) {
    if (!logPath || !fs.existsSync(logPath)) {
        return null;
    }
    
    const content = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    const heap = content.heap || {};
    const providerMetrics = content.providerMetrics || {};
    const decorationPool = providerMetrics.decorationPool || {};
    const badgeFlyweight = providerMetrics.badgeFlyweight || {};
    const readableFlyweight = providerMetrics.readableFlyweight || {};
    const allocationTelemetry = providerMetrics.allocationTelemetry || null;
    const retainedSnapshots = heap.retainedSnapshots || [];
    const finalRetention = retainedSnapshots.length > 0
        ? retainedSnapshots[retainedSnapshots.length - 1]
        : null;
    const gcStats = heap.gcStats || {};
    const runMetadata = content.runMetadata || {};

    return {
        timestamp: content.timestamp,
        deltaMB: heap.deltaMB,
        peakMB: heap.peakMB,
        retainedMB: finalRetention?.usedHeapMB ?? null,
        oldSpaceMB: finalRetention?.oldSpaceMB ?? null,
        totalGc: gcStats.total ?? 0,
        majorGc: gcStats.major ?? 0,
        forcedGc: gcStats.forced ?? 0,
        gcDurationMs: Number(gcStats.durationMs ?? 0),
        poolHits: decorationPool.hits ?? 0,
        poolMisses: decorationPool.misses ?? 0,
        poolAllocations: decorationPool.allocations ?? 0,
        poolReuses: decorationPool.reuses ?? 0,
        badgeFlyHits: badgeFlyweight.hits ?? 0,
        badgeFlyMisses: badgeFlyweight.misses ?? 0,
        badgeAllocations: badgeFlyweight.allocations ?? 0,
        badgeReuses: badgeFlyweight.reuses ?? 0,
        readableFlyHits: readableFlyweight.hits ?? 0,
        readableFlyMisses: readableFlyweight.misses ?? 0,
        readableAllocations: readableFlyweight.allocations ?? 0,
        readableReuses: readableFlyweight.reuses ?? 0,
        concurrency: runMetadata.concurrency ? Number(runMetadata.concurrency) : 1,
        missIterations: Number(runMetadata.missIterationsCompleted ?? runMetadata.iterations ?? 0),
        durationMs: runMetadata.missPhaseDurationMs != null ? Number(runMetadata.missPhaseDurationMs) : null,
        allocationTelemetry
    };
}

console.log('📊 Phase 3 Isolation Matrix Analysis\n');

const results = {};
let failureCount = 0;
scenarioLabels.forEach(label => {
    const name = scenarioNames[label];
    const logPath = findLatestLogByScenario(label);
    const metrics = extractMetrics(logPath);
    
    if (!metrics) {
        console.log(`⚠️  ${name}: No log found`);
        results[name] = null;
        failureCount++;
        return;
    }
    
    results[name] = metrics;
    console.log(`✅ ${name}`);
    console.log(`   Log: ${logPath ? path.basename(logPath) : 'N/A'}`);
    console.log(`   Heap Delta: ${metrics.deltaMB} MB | Peak: ${metrics.peakMB} MB`);
    const poolTotal = metrics.poolHits + metrics.poolMisses;
    if (poolTotal > 0 || (metrics.poolAllocations + metrics.poolReuses) > 0) {
        const reuse = computeReusePercent(
            metrics.poolReuses,
            metrics.poolAllocations,
            metrics.poolHits,
            metrics.poolMisses
        );
        console.log(`   Pool: ${metrics.poolHits} hits, ${metrics.poolMisses} misses | reuse ${reuse}`);
    }
    const badgeTotal = metrics.badgeFlyHits + metrics.badgeFlyMisses;
    if (badgeTotal > 0 || (metrics.badgeAllocations + metrics.badgeReuses) > 0) {
        const reuse = computeReusePercent(
            metrics.badgeReuses,
            metrics.badgeAllocations,
            metrics.badgeFlyHits,
            metrics.badgeFlyMisses
        );
        console.log(`   Badge Flyweight: ${metrics.badgeFlyHits} hits, ${metrics.badgeFlyMisses} misses | reuse ${reuse}`);
    }
    const readableTotal = metrics.readableFlyHits + metrics.readableFlyMisses;
    if (readableTotal > 0 || (metrics.readableAllocations + metrics.readableReuses) > 0) {
        const reuse = computeReusePercent(
            metrics.readableReuses,
            metrics.readableAllocations,
            metrics.readableFlyHits,
            metrics.readableFlyMisses
        );
        console.log(`   Readable Flyweight: ${metrics.readableFlyHits} hits, ${metrics.readableFlyMisses} misses | reuse ${reuse}`);
    }
    if (typeof metrics.retainedMB === 'number') {
        const oldSpace = typeof metrics.oldSpaceMB === 'number' ? `${metrics.oldSpaceMB} MB` : 'n/a';
        console.log(`   Retained Heap: ${metrics.retainedMB} MB (old space ${oldSpace})`);
    }
    if (metrics.totalGc > 0) {
        console.log(
            `   GC: ${metrics.totalGc} events (major ${metrics.majorGc}, forced ${metrics.forcedGc}) – ${metrics.gcDurationMs.toFixed(1)} ms`
        );
    }
    const durationText = metrics.durationMs ? ` (~${(metrics.durationMs / 1000).toFixed(1)}s)` : '';
    console.log(`   Load: ${metrics.missIterations} miss iterations @ concurrency ${metrics.concurrency}${durationText}`);
    if (metrics.allocationTelemetry) {
        const lines = [
            formatAllocationLine('Decoration pool', metrics.allocationTelemetry.decorationPool),
            formatAllocationLine('Badge flyweight', metrics.allocationTelemetry.badgeFlyweight),
            formatAllocationLine('Readable flyweight', metrics.allocationTelemetry.readableFlyweight)
        ].filter(Boolean);
        if (lines.length > 0) {
            console.log('   Allocation telemetry:');
            lines.forEach(line => console.log(line));
        }
    }
    console.log('');
});

// Generate comparison table
console.log('📈 Comparative Summary\n');
console.log('| Scenario | Heap Delta | Peak | Retained | GC Events | Pool Reuse | Badge Reuse | Readable Reuse |');
console.log('|----------|-----------|------|----------|-----------|-----------|-------------|-----------------|');

const names = Object.keys(results);
names.forEach(name => {
    const m = results[name];
    if (!m) {
        console.log(`| ${name} | — | — | — | — | — | — | — |`);
        failureCount++;
        return;
    }
    
    const retained = typeof m.retainedMB === 'number' ? `${m.retainedMB} MB` : '—';
    const gcEvents = m.totalGc > 0
        ? `${m.totalGc}${m.forcedGc ? ` (${m.forcedGc} forced)` : ''}`
        : '0';
    const poolReuse = computeReusePercent(m.poolReuses, m.poolAllocations, m.poolHits, m.poolMisses);
    const badgeReuse = computeReusePercent(m.badgeReuses, m.badgeAllocations, m.badgeFlyHits, m.badgeFlyMisses);
    const readableReuse = computeReusePercent(m.readableReuses, m.readableAllocations, m.readableFlyHits, m.readableFlyMisses);
    
    console.log(`| ${name} | ${m.deltaMB} MB | ${m.peakMB} MB | ${retained} | ${gcEvents} | ${poolReuse} | ${badgeReuse} | ${readableReuse} |`);
});

// Calculate savings
console.log('\n💾 Individual Feature Savings\n');

const control = results['Control (Pool + Flyweights)'];
const poolOnly = results['Pool Only (No Flyweights)'];
const flyOnly = results['Flyweights Only (No Pool)'];
const neither = results['Neither (Baseline)'];

if (control && poolOnly && flyOnly && neither) {
    const flyweightSavings = (poolOnly.deltaMB - control.deltaMB).toFixed(2);
    const poolSavings = (flyOnly.deltaMB - control.deltaMB).toFixed(2);
    const combinedSavings = (neither.deltaMB - control.deltaMB).toFixed(2);
    
    console.log(`Baseline (Neither): ${neither.deltaMB} MB`);
    console.log(`Pool contribution: ${poolSavings} MB reduction (${(neither.deltaMB > 0 ? (poolSavings / neither.deltaMB * 100).toFixed(1) : '—')}%)`);
    console.log(`Flyweight contribution: ${flyweightSavings} MB reduction (${(neither.deltaMB > 0 ? (flyweightSavings / neither.deltaMB * 100).toFixed(1) : '—')}%)`);
    console.log(`Combined contribution: ${combinedSavings} MB reduction (${(neither.deltaMB > 0 ? (combinedSavings / neither.deltaMB * 100).toFixed(1) : '—')}%)`);
}

console.log('\n✅ Matrix analysis complete');

if (failureCount > 0) {
    console.error(`❌ Matrix analysis failed: ${failureCount} missing or invalid scenario(s)`);
    process.exit(1);
}
