#!/usr/bin/env node

/**
 * Memory isolation test - identify specific memory sources.
 * 
 * Disables selected features to isolate which mechanism causes heap growth.
 * 
 * Usage:
 *   DISABLE_TIMERS=1 node --expose-gc tests/test-memory-isolation.js
 *   DISABLE_CACHE_EXTENSION=1 node --expose-gc tests/test-memory-isolation.js
 *   DISABLE_INCREMENTAL_REFRESH=1 node --expose-gc tests/test-memory-isolation.js
 */

const fs = require('fs');
const path = require('path');
const { createMockVscode, VSCodeUri, workspaceRoot } = require('./helpers/mockVscode');

if (typeof global.gc !== 'function') {
    console.error('❌ Memory isolation test requires Node to run with "--expose-gc".');
    console.error('   Use: node --expose-gc tests/test-memory-isolation.js');
    process.exit(1);
}

const ITERATIONS = Number(process.env.MEMORY_SOAK_ITERATIONS || 2000);
const MAX_HEAP_DELTA_MB = Number(process.env.MEMORY_SOAK_MAX_DELTA_MB || 12);
const BATCH_DELAY_MS = Number(process.env.MEMORY_SOAK_DELAY_MS || 0);
const INCLUDE_HIT_PHASE = process.env.MEMORY_SOAK_INCLUDE_HITS !== 'false';
const HIT_PHASE_ITERATIONS = Number(
    process.env.MEMORY_SOAK_HIT_ITERATIONS || Math.max(50, Math.floor(ITERATIONS * 0.75))
);

const DISABLE_TIMERS = process.env.DISABLE_TIMERS === '1';
const DISABLE_CACHE_EXTENSION = process.env.DISABLE_CACHE_EXTENSION === '1';
const DISABLE_INCREMENTAL_REFRESH = process.env.DISABLE_INCREMENTAL_REFRESH === '1';

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
    console.error('❌ Could not locate sample files for isolation test.');
    mockInstall.dispose();
    process.exit(1);
}

function heapUsedMB() {
    return Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
    let exitCode = 0;
    let provider;

    try {
        provider = new FileDateDecorationProvider();
        
        // Apply isolation patches
        if (DISABLE_TIMERS) {
            console.log('⚠️  ISOLATION: Disabling incremental refresh timers');
            provider._scheduleIncrementalRefresh = () => {
                // Just fire global refresh without timers
                provider._onDidChangeFileDecorations.fire(undefined);
            };
        }
        
        if (DISABLE_CACHE_EXTENSION) {
            console.log('⚠️  ISOLATION: Disabling cache timeout extension');
            provider._maybeExtendCacheTimeout = () => {
                // No-op
            };
        }
        
        if (DISABLE_INCREMENTAL_REFRESH) {
            console.log('⚠️  ISOLATION: Disabling incremental refresh entirely');
            provider._scheduleIncrementalRefresh = () => {
                // No-op
            };
        }
        
        global.gc();

        const baseline = heapUsedMB();
        let peak = baseline;

        console.log('\n🧪 Memory isolation test starting');
        console.log(`   Iterations: ${ITERATIONS}`);
        console.log(`   Max heap delta allowed: ${MAX_HEAP_DELTA_MB} MB`);
        console.log(`   Sample files: ${sampleFiles.length}`);
        console.log(`   Hit phase: ${INCLUDE_HIT_PHASE ? `enabled (${HIT_PHASE_ITERATIONS} iterations)` : 'disabled'}`);
        console.log(`   Disabled features: timers=${DISABLE_TIMERS}, cache-ext=${DISABLE_CACHE_EXTENSION}, refresh=${DISABLE_INCREMENTAL_REFRESH}\n`);

        if (INCLUDE_HIT_PHASE) {
            // Prime cache
            for (const uri of sampleFiles) {
                await provider.provideFileDecoration(uri);
            }
            global.gc();

            for (let iteration = 0; iteration < HIT_PHASE_ITERATIONS; iteration++) {
                for (const uri of sampleFiles) {
                    await provider.provideFileDecoration(uri);
                }
                if ((iteration + 1) % 100 === 0) {
                    global.gc();
                    const current = heapUsedMB();
                    peak = Math.max(peak, current);
                    console.log(`   Hit phase ${iteration + 1}/${HIT_PHASE_ITERATIONS} – heap ${current} MB (peak ${peak} MB)`);
                } else {
                    peak = Math.max(peak, heapUsedMB());
                }
            }
        }

        console.log('   Miss phase starting...\n');
        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            for (const uri of sampleFiles) {
                await provider.provideFileDecoration(uri);
            }

            if (!DISABLE_INCREMENTAL_REFRESH) {
                provider._scheduleIncrementalRefresh('memory-soak');
            }
            await delay(BATCH_DELAY_MS);

            if ((iteration + 1) % 100 === 0) {
                global.gc();
                const current = heapUsedMB();
                peak = Math.max(peak, current);
                
                const timerCount = provider._incrementalRefreshTimers?.size || 0;
                const cacheSize = provider._decorationCache?.size || 0;
                
                console.log(`   Iteration ${iteration + 1}/${ITERATIONS} – heap ${current} MB (peak ${peak} MB) | timers: ${timerCount}, cache: ${cacheSize}`);
            } else {
                peak = Math.max(peak, heapUsedMB());
            }
        }

        // Allow timers to complete
        await delay(Math.min(provider._refreshInterval || 1000, 1500));
        global.gc();

        const finalHeap = heapUsedMB();
        const delta = Number((finalHeap - baseline).toFixed(2));

        console.log('\n📈 Memory summary:');
        console.log(`   Baseline heap: ${baseline} MB`);
        console.log(`   Peak heap:     ${peak} MB`);
        console.log(`   Final heap:    ${finalHeap} MB`);
        console.log(`   Delta:         ${delta} MB`);

        if (delta > MAX_HEAP_DELTA_MB) {
            console.error(`❌ Heap grew by ${delta} MB (limit ${MAX_HEAP_DELTA_MB} MB)`);
            exitCode = 1;
        } else {
            console.log(`✅ Heap growth (${delta} MB) within limit (${MAX_HEAP_DELTA_MB} MB)`);
        }
    } catch (error) {
        console.error('❌ Memory isolation test failed with error:', error);
        exitCode = 1;
    } finally {
        if (provider) {
            await provider.dispose();
        }
        mockInstall.dispose();
        process.exit(exitCode);
    }
})();
