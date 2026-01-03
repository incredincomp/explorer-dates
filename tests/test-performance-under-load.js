#!/usr/bin/env node

/**
 * Performance Under Load Testing for Explorer Dates Extension
 * 
 * Tests extension behavior under high-stress conditions including:
 * - Large workspace file counts
 * - High-frequency file changes
 * - Memory pressure scenarios
 * - Concurrent decoration requests
 * - Cache thrashing scenarios
 * 
 * Follows established patterns from test-memory-soak.js and test-workspace-scale.js
 */

const assert = require('assert');
const { performance } = require('perf_hooks');
const { createMockVscode, VSCodeUri } = require('./helpers/mockVscode');

// Test configuration
const LARGE_WORKSPACE_SIZE = 25000;
const MASSIVE_WORKSPACE_SIZE = 100000; 
const HIGH_FREQUENCY_EVENTS = 500;
const CONCURRENT_REQUESTS = 100;
const MEMORY_PRESSURE_CYCLES = 50;

/**
 * Test large workspace performance
 */
async function testLargeWorkspacePerformance() {
    console.log('📊 Testing large workspace performance...');
    
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.smartFileWatching': true,
            'explorerDates.progressiveLoading': true
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        // Simulate large workspace
        vscode.workspace.findFiles = async () => Array.from(
            { length: LARGE_WORKSPACE_SIZE }, 
            (_, i) => VSCodeUri.file(`/workspace/file-${i}.js`)
        );

        const provider = new FileDateDecorationProvider();
        const startTime = performance.now();
        
        // Test multiple concurrent decoration requests
        const decorationPromises = Array(50).fill().map((_, i) => {
            const uri = VSCodeUri.file(`/workspace/test-file-${i}.js`);
            return provider.provideFileDecoration(uri, { isCancellationRequested: false });
        });
        
        const results = await Promise.all(decorationPromises);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Performance assertions
        assert.ok(duration < 5000, `Large workspace should complete within 5s, took ${duration}ms`);
        assert.ok(results.every(r => r !== null), 'All decoration requests should succeed');
        assert.ok(provider._workspaceScale, 'Workspace scale should be detected');
        
        console.log(`✅ Large workspace performance: ${Math.round(duration)}ms for ${results.length} decorations`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Large workspace performance failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test massive workspace auto-optimization
 */
async function testMassiveWorkspaceOptimization() {
    console.log('🏗️ Testing massive workspace auto-optimization...');
    
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.forceEnableForLargeWorkspaces': false
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        // Simulate massive workspace (100k files)
        vscode.workspace.findFiles = async () => Array.from(
            { length: MASSIVE_WORKSPACE_SIZE }, 
            (_, i) => VSCodeUri.file(`/massive/file-${i}.js`)
        );

        const provider = new FileDateDecorationProvider();
        await provider.checkWorkspaceSize();
        
        // Should auto-optimize for extreme scale
        assert.strictEqual(provider._workspaceScale, 'extreme', 'Should detect extreme workspace scale');
        assert.ok(provider._featureLevel === 'minimal' || provider._featureLevel === 'standard', 
                 'Should downgrade feature level for extreme scale');
        
        // Test that optimizations work
        const uri = VSCodeUri.file('/massive/test.js');
        const startTime = performance.now();
        const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
        const endTime = performance.now();
        
        assert.ok(endTime - startTime < 100, 'Optimized decoration should be very fast');
        console.log(`✅ Massive workspace optimization: scale=${provider._workspaceScale}, level=${provider._featureLevel}`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Massive workspace optimization failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test high-frequency file change performance
 */
async function testHighFrequencyFileChanges() {
    console.log('⚡ Testing high-frequency file changes...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        const fileUri = VSCodeUri.file('/workspace/rapid-change.js');
        
        // Simulate rapid file changes
        const changePromises = [];
        const startTime = performance.now();
        
        for (let i = 0; i < HIGH_FREQUENCY_EVENTS; i++) {
            const promise = provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
            changePromises.push(promise);
            
            // Minimal delay between requests
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        const results = await Promise.all(changePromises);
        const endTime = performance.now();
        const duration = endTime - startTime;
        const averageTime = duration / HIGH_FREQUENCY_EVENTS;
        
        // Performance assertions
        assert.ok(averageTime < 10, `Average decoration time should be < 10ms, was ${averageTime}ms`);
        assert.ok(results.every(r => r !== null), 'All high-frequency requests should succeed');
        
        console.log(`✅ High-frequency changes: ${HIGH_FREQUENCY_EVENTS} events in ${Math.round(duration)}ms (${averageTime.toFixed(2)}ms avg)`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ High-frequency file changes failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test concurrent request performance
 */
async function testConcurrentRequestPerformance() {
    console.log('🔀 Testing concurrent request performance...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Create many unique files for concurrent testing
        const fileUris = Array(CONCURRENT_REQUESTS).fill().map((_, i) => 
            VSCodeUri.file(`/workspace/concurrent-${i}.js`)
        );
        
        const startTime = performance.now();
        
        // Launch all requests concurrently
        const concurrentPromises = fileUris.map(uri => 
            provider.provideFileDecoration(uri, { isCancellationRequested: false })
        );
        
        const results = await Promise.all(concurrentPromises);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Performance and correctness assertions
        assert.ok(duration < 10000, `Concurrent requests should complete within 10s, took ${duration}ms`);
        assert.strictEqual(results.length, CONCURRENT_REQUESTS, 'Should handle all concurrent requests');
        
        const successRate = results.filter(r => r && r.badge).length / results.length;
        assert.ok(successRate > 0.95, `Success rate should be > 95%, was ${(successRate * 100).toFixed(1)}%`);
        
        console.log(`✅ Concurrent requests: ${CONCURRENT_REQUESTS} requests in ${Math.round(duration)}ms (${(successRate * 100).toFixed(1)}% success)`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Concurrent request performance failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test cache thrashing scenarios
 */
async function testCacheThrashingPerformance() {
    console.log('💾 Testing cache thrashing scenarios...');
    
    const mockInstall = createMockVscode({
        config: { 
            'explorerDates.performanceMode': false,
            'explorerDates.maxCacheSize': 50, // Small cache to force evictions
            'explorerDates.cacheTimeout': 5000
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Create more files than cache can hold
        const fileCount = 200; // 4x cache size
        const fileUris = Array(fileCount).fill().map((_, i) => 
            VSCodeUri.file(`/workspace/cache-thrash-${i}.js`)
        );
        
        const startTime = performance.now();
        
        // First pass: populate cache beyond capacity
        for (const uri of fileUris) {
            await provider.provideFileDecoration(uri, { isCancellationRequested: false });
        }
        
        // Second pass: should trigger cache evictions and refetches
        const secondPassPromises = fileUris.map(uri => 
            provider.provideFileDecoration(uri, { isCancellationRequested: false })
        );
        
        const results = await Promise.all(secondPassPromises);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should handle cache thrashing gracefully
        assert.ok(duration < 15000, `Cache thrashing should complete within 15s, took ${duration}ms`);
        assert.ok(results.every(r => r && r.badge), 'All cache-thrashed requests should succeed');
        
        console.log(`✅ Cache thrashing: ${fileCount} files with cache size 50 in ${Math.round(duration)}ms`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Cache thrashing performance failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test memory pressure scenarios
 */
async function testMemoryPressurePerformance() {
    console.log('🧠 Testing memory pressure scenarios...');
    
    const mockInstall = createMockVscode({
        config: { 
            'explorerDates.performanceMode': false,
            'explorerDates.maxMemoryUsage': 10, // Low memory limit
            'explorerDates.maxCacheSize': 1000
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        const results = [];
        
        const startTime = performance.now();
        
        // Simulate memory pressure cycles
        for (let cycle = 0; cycle < MEMORY_PRESSURE_CYCLES; cycle++) {
            // Create large batch of requests
            const batchUris = Array(50).fill().map((_, i) => 
                VSCodeUri.file(`/workspace/memory-${cycle}-${i}.js`)
            );
            
            const batchPromises = batchUris.map(uri => 
                provider.provideFileDecoration(uri, { isCancellationRequested: false })
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Force some cleanup opportunity
            if (cycle % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should handle memory pressure without failures
        const successCount = results.filter(r => r && r.badge).length;
        const successRate = successCount / results.length;
        
        assert.ok(successRate > 0.90, `Success rate under memory pressure should be > 90%, was ${(successRate * 100).toFixed(1)}%`);
        assert.ok(duration < 20000, `Memory pressure test should complete within 20s, took ${duration}ms`);
        
        console.log(`✅ Memory pressure: ${MEMORY_PRESSURE_CYCLES} cycles, ${successCount}/${results.length} success in ${Math.round(duration)}ms`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Memory pressure performance failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test performance degradation monitoring
 */
async function testPerformanceDegradationMonitoring() {
    console.log('📉 Testing performance degradation monitoring...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        const fileUri = VSCodeUri.file('/workspace/degradation-test.js');
        
        const measurements = [];
        
        // Take baseline measurements
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            await provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
            const end = performance.now();
            measurements.push(end - start);
        }
        
        const baselineAvg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        
        // Simulate load and measure degradation
        const loadMeasurements = [];
        
        // Create sustained load
        for (let i = 0; i < 100; i++) {
            const start = performance.now();
            await provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
            const end = performance.now();
            loadMeasurements.push(end - start);
            
            // Add some concurrent requests occasionally
            if (i % 20 === 0) {
                const concurrentUris = Array(5).fill().map((_, j) => 
                    VSCodeUri.file(`/workspace/concurrent-load-${j}.js`)
                );
                await Promise.all(concurrentUris.map(uri => 
                    provider.provideFileDecoration(uri, { isCancellationRequested: false })
                ));
            }
        }
        
        const loadAvg = loadMeasurements.reduce((a, b) => a + b, 0) / loadMeasurements.length;
        const degradationRatio = loadAvg / baselineAvg;
        
        // Performance should not degrade significantly under load
        assert.ok(degradationRatio < 3.0, `Performance degradation should be < 3x, was ${degradationRatio.toFixed(2)}x`);
        assert.ok(loadAvg < 50, `Average response time under load should be < 50ms, was ${loadAvg.toFixed(2)}ms`);
        
        console.log(`✅ Performance degradation: ${degradationRatio.toFixed(2)}x (${baselineAvg.toFixed(2)}ms → ${loadAvg.toFixed(2)}ms)`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Performance degradation monitoring failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Main test runner
 */
async function main() {
    console.log('📊 Starting Performance Under Load Tests\n');
    
    const tests = [
        testLargeWorkspacePerformance,
        testMassiveWorkspaceOptimization,
        testHighFrequencyFileChanges,
        testConcurrentRequestPerformance,
        testCacheThrashingPerformance,
        testMemoryPressurePerformance,
        testPerformanceDegradationMonitoring
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const success = await test();
            if (success) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`❌ Test ${test.name} crashed:`, error.message);
            failed++;
        }
        console.log(); // Add spacing between tests
    }
    
    console.log(`🎯 Performance under load tests completed: ${passed}/${tests.length} passed`);
    
    if (failed > 0) {
        console.log(`\n⚠️ ${failed} performance tests failed - extension may not handle high load gracefully`);
        process.exit(1);
    } else {
        console.log('\n🎉 All performance under load tests passed!');
    }
}

// Run tests if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Performance test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = { main };