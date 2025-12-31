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

function findLatestLogByScenario(scenario) {
    const files = fs.readdirSync(logsDir);
    const matching = [];
    
    for (const file of files) {
        if (!file.startsWith('memory-soak-') || !file.endsWith('.json')) continue;
        try {
            const content = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
            if (content.runMetadata?.scenario === scenario) {
                matching.push({ file, time: fs.statSync(path.join(logsDir, file)).mtime });
            }
        } catch {
            // skip unparseable files
        }
    }
    
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.time - a.time);
    return path.join(logsDir, matching[0].file);
}

function extractMetrics(logPath) {
    if (!logPath || !fs.existsSync(logPath)) {
        return null;
    }
    
    const content = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    return {
        timestamp: content.timestamp,
        deltaMB: content.heap.deltaMB,
        peakMB: content.heap.peakMB,
        poolHits: content.providerMetrics.decorationPool.hits,
        poolMisses: content.providerMetrics.decorationPool.misses,
        badgeFlyHits: content.providerMetrics.badgeFlyweight?.hits ?? 0,
        badgeFlyMisses: content.providerMetrics.badgeFlyweight?.misses ?? 0,
        readableFlyHits: content.providerMetrics.readableFlyweight?.hits ?? 0,
        readableFlyMisses: content.providerMetrics.readableFlyweight?.misses ?? 0
    };
}

console.log('📊 Phase 3 Isolation Matrix Analysis\n');

const results = {};
scenarioLabels.forEach(label => {
    const name = scenarioNames[label];
    const logPath = findLatestLogByScenario(label);
    const metrics = extractMetrics(logPath);
    
    if (!metrics) {
        console.log(`⚠️  ${name}: No log found`);
        results[name] = null;
        return;
    }
    
    results[name] = metrics;
    console.log(`✅ ${name}`);
    console.log(`   Log: ${logPath ? path.basename(logPath) : 'N/A'}`);
    console.log(`   Heap Delta: ${metrics.deltaMB} MB | Peak: ${metrics.peakMB} MB`);
    if (metrics.poolHits > 0 || metrics.poolMisses > 0) {
        console.log(`   Pool: ${metrics.poolHits} hits, ${metrics.poolMisses} misses`);
    }
    if (metrics.badgeFlyHits > 0 || metrics.badgeFlyMisses > 0) {
        console.log(`   Badge Flyweight: ${metrics.badgeFlyHits} hits, ${metrics.badgeFlyMisses} misses`);
    }
    if (metrics.readableFlyHits > 0 || metrics.readableFlyMisses > 0) {
        console.log(`   Readable Flyweight: ${metrics.readableFlyHits} hits, ${metrics.readableFlyMisses} misses`);
    }
    console.log('');
});

// Generate comparison table
console.log('📈 Comparative Summary\n');
console.log('| Scenario | Heap Delta | Peak | Pool Reuse | Badge Reuse | Readable Reuse |');
console.log('|----------|-----------|------|-----------|-------------|-----------------|');

const names = Object.keys(results);
names.forEach(name => {
    const m = results[name];
    if (!m) {
        console.log(`| ${name} | — | — | — | — | — |`);
        return;
    }
    
    const poolReuse = m.poolHits + m.poolMisses > 0 
        ? `${((m.poolHits / (m.poolHits + m.poolMisses)) * 100).toFixed(1)}%`
        : '—';
    const badgeReuse = m.badgeFlyHits + m.badgeFlyMisses > 0 
        ? `${((m.badgeFlyHits / (m.badgeFlyHits + m.badgeFlyMisses)) * 100).toFixed(1)}%`
        : '—';
    const readableReuse = m.readableFlyHits + m.readableFlyMisses > 0 
        ? `${((m.readableFlyHits / (m.readableFlyHits + m.readableFlyMisses)) * 100).toFixed(1)}%`
        : '—';
    
    console.log(`| ${name} | ${m.deltaMB} MB | ${m.peakMB} MB | ${poolReuse} | ${badgeReuse} | ${readableReuse} |`);
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
