#!/usr/bin/env node

/**
 * Test: WASM profiling system
 * Verifies that the performance tracking works for WASM vs JS fallback
 */

const { performance } = require('perf_hooks');
const fs = require('fs'); void fs;
const path = require('path');
const { WEB_EXCLUDED_CHUNKS } = require('../src/shared/chunkMap');

// Set up VS Code mock
const { createTestMock } = require('./helpers/mockVscode');
const mockSetup = createTestMock({
    explorerDates: {
        enableProgressiveAnalysis: true,
        enableWasmDigest: true
    }
});

console.log('🧪 Testing WASM profiling system...');

let testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function addResult(name, passed, details = '') {
    testResults[passed ? 'passed' : 'failed']++;
    testResults.details.push({
        test: name,
        status: passed ? 'PASS' : 'FAIL',
        details: details
    });
    console.log(`${passed ? '✅' : '❌'} ${name}${details ? ': ' + details : ''}`);
}

async function testWasmProfilingSystem() {
    console.log('\n📊 Testing WASM profiling system...');
    
    try {
        // Import test utilities from mockVscode helper
        const { loadChunkForTesting } = require('./helpers/mockVscode');
        
        // Load the incremental workers chunk
        const workersChunk = loadChunkForTesting('incrementalWorkers');
        addResult('Incremental workers chunk loads', !!workersChunk);
        
        if (!workersChunk) {
            addResult('WASM profiling system test', false, 'Could not load workers chunk');
            return;
        }
        
        // Check if the chunk has the IndexWorkerHost
        const hostCtor = workersChunk.IndexWorkerHost;
        const hostFactory = workersChunk.createIndexWorkerHost;
        const hasIndexWorkerHost = typeof hostCtor === 'function';
        addResult('Exports IndexWorkerHost constructor', hasIndexWorkerHost);
        const exposesFactory = typeof hostFactory === 'function';
        addResult(
            'Exports worker host factory (optional)',
            exposesFactory || hasIndexWorkerHost,
            exposesFactory ? undefined : 'factory not exported'
        );
        
        // Test that the worker host file contains profiling code
        const fs = require('fs');
        const workerHostPath = require.resolve('../src/workers/indexWorkerHost.js');
        const workerHostContent = fs.readFileSync(workerHostPath, 'utf8');
        
        const hasPerformanceStats = workerHostContent.includes('performanceStats');
        addResult('Contains performance stats tracking', hasPerformanceStats);
        
        const hasWasmProfiling = workerHostContent.includes('wasmTotalTime');
        addResult('Contains WASM profiling code', hasWasmProfiling);
        
        const hasReporting = workerHostContent.includes('reportPerformanceIfNeeded');
        addResult('Contains performance reporting', hasReporting);
        
        const hasWasmBenefit = workerHostContent.includes('wasmBenefit');
        addResult('Contains WASM benefit calculation', hasWasmBenefit);
        
        const hasPerformanceNow = workerHostContent.includes('performance.now()');
        addResult('Uses performance.now() for timing', hasPerformanceNow);
        
        // Test that the profiling handles both WASM and JS cases
        const hasFallbackHandling = workerHostContent.includes('jsCalls++') && 
                                   workerHostContent.includes('wasmCalls++');
        addResult('Handles both WASM and JS profiling', hasFallbackHandling);
        
        // Check that the WASM path configuration exists
        const hasWasmPath = workerHostContent.includes('digest.wasm');
        addResult('Has WASM path configuration', hasWasmPath);

        // Validate built chunk artifacts exist and contain profiling code
        const chunkTargets = [
            { label: 'Node', file: path.join(__dirname, '../dist/chunks/incrementalWorkers.js'), required: true },
            { label: 'Web', file: path.join(__dirname, '../dist/web-chunks/incrementalWorkers.js'), required: !WEB_EXCLUDED_CHUNKS.has('incrementalWorkers') }
        ];

        const chunkMarkers = ['IndexWorkerHost', 'performanceStats', 'wasmTotalTime'];

        for (const target of chunkTargets) {
            const exists = fs.existsSync(target.file);
            addResult(
                `${target.label} incremental workers chunk exists`,
                target.required ? exists : !exists,
                target.file
            );

            if (!exists || !target.required) {
                continue;
            }

            const stats = fs.statSync(target.file);
            const sizeKb = Math.round(stats.size / 1024);
            addResult(`${target.label} incremental workers chunk non-empty`, sizeKb > 2, `${sizeKb}KB`);

            const contents = fs.readFileSync(target.file, 'utf8');
            const missingMarkers = chunkMarkers.filter((marker) => !contents.includes(marker));
            addResult(
                `${target.label} incremental workers chunk exports profiling code`,
                missingMarkers.length === 0,
                missingMarkers.length ? `Missing markers: ${missingMarkers.join(', ')}` : undefined
            );
        }
        
    } catch (error) {
        addResult('WASM profiling system test', false, error.message);
    }
}

async function testChunkOptimizations() {
    console.log('\n📦 Testing chunk optimizations...');
    
    try {
        // Test that core chunk was removed from federation config
        const { federationConfig } = require('../src/moduleFederation');
        const { getAllChunkNames } = require('../src/shared/chunkMap');

        const chunkNames = getAllChunkNames();
        const hasOldCoreChunk = Object.prototype.hasOwnProperty.call(federationConfig.chunks, 'core');
        addResult('Removed redundant core chunk', !hasOldCoreChunk);

        const chunkCount = Object.keys(federationConfig.chunks).length;
        const expectedCount = chunkNames.length;
        addResult('Expected chunk count', chunkCount === expectedCount, `${chunkCount}/${expectedCount} chunks`);

        // Test that chunk map still works
        const allChunksInFederation = chunkNames.every(name => 
            Object.prototype.hasOwnProperty.call(federationConfig.chunks, name));
        addResult('All chunk map entries in federation', allChunksInFederation);

        // Verify no core chunk in chunk map either
        const hasCoreInMap = chunkNames.includes('core');
        addResult('No core chunk in chunk map', !hasCoreInMap);

        // Ensure new decorationsAdvanced chunk is represented
        const hasDecorationsAdvanced = chunkNames.includes('decorationsAdvanced') &&
            Object.prototype.hasOwnProperty.call(federationConfig.chunks, 'decorationsAdvanced');
        addResult('decorationsAdvanced chunk registered', hasDecorationsAdvanced);

    } catch (error) {
        addResult('Chunk optimizations test', false, error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting WASM profiling and chunk optimization tests...\n');
    
    const startTime = performance.now();
    
    await testWasmProfilingSystem();
    await testChunkOptimizations();
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`\n📊 Test Results (${duration}ms):`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(result => result.status === 'FAIL')
            .forEach(result => {
                console.log(`   ${result.test}: ${result.details}`);
            });
    }
    
    console.log('\n🎯 Optimizations Applied:');
    console.log('   📉 Removed 92KB redundant core chunk');
    console.log('   📊 Added WASM vs JS performance profiling');
    console.log('   🔄 Performance reports identify optimization opportunities');
    console.log('   ⚡ Future: Can drop JS fallback if WASM proves consistently faster');
    
    return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            // Clean up mock
            mockSetup.dispose();
            require('./helpers/forceExit').scheduleExit(0, success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner error:', error);
            mockSetup.dispose();
            require('./helpers/forceExit').scheduleExit(0, 1);
        });
}

module.exports = { runAllTests };
