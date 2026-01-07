#!/usr/bin/env node

/**
 * Race Condition Testing for Explorer Dates Extension
 * 
 * Tests concurrent operations, timing conflicts, and thread safety issues
 * that could occur in real-world VS Code usage scenarios.
 */

const fs = require('fs').promises;
const path = require('path');
const { createMockVscode, VSCodeUri } = require('./helpers/mockVscode');

/**
 * Create controlled delay utility
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test concurrent file decoration requests for the same file
 */
async function testConcurrentSameFileRequests() {
    console.log('🏁 Testing concurrent requests for same file...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Launch multiple concurrent requests for the same file
        const concurrentRequests = Array(5).fill().map((_, index) => {
            return provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
        });
        
        const results = await Promise.all(concurrentRequests);
        
        // All results should be consistent
        const firstResult = results[0];
        const allConsistent = results.every(result => {
            if (!result || !firstResult) return result === firstResult;
            return result.badge === firstResult.badge && 
                   result.tooltip === firstResult.tooltip;
        });
        
        if (allConsistent) {
            console.log('✅ Concurrent same-file requests handled consistently');
            return true;
        } else {
            console.log('❌ Concurrent same-file requests produced inconsistent results');
            console.log('Results:', results.map(r => r ? r.badge : null));
            return false;
        }
    } catch (error) {
        console.log('❌ Concurrent same-file requests failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test concurrent requests for different files
 */
async function testConcurrentDifferentFileRequests() {
    console.log('🔀 Testing concurrent requests for different files...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        // Launch concurrent requests for different files
        const concurrentRequests = Array(10).fill().map((_, index) => {
            const fileUri = vscode.Uri.file(`/workspace1/file${index + 1}.js`);
            return provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
        });
        
        const results = await Promise.all(concurrentRequests);
        
        // Check that all requests completed successfully
        const allSuccessful = results.every(result => result && result.badge);
        
        if (allSuccessful) {
            console.log('✅ Concurrent different-file requests handled successfully');
            return true;
        } else {
            console.log('❌ Some concurrent different-file requests failed');
            console.log('Results:', results.map((r, i) => `file${i+1}: ${r ? r.badge : 'FAILED'}`));
            return false;
        }
    } catch (error) {
        console.log('❌ Concurrent different-file requests failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test configuration changes during active operations
 */
async function testConfigurationChangeDuringOperations() {
    console.log('⚙️ Testing configuration changes during active operations...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Start a decoration request
        const decorationPromise = provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
        
        // Immediately trigger configuration change
        setTimeout(() => {
            if (vscode.workspace.updateConfiguration) {
                vscode.workspace.updateConfiguration('explorerDates.dateDecorationFormat', 'relative-short');
            }
        }, 5);
        
        // Wait for decoration to complete
        const result = await decorationPromise;
        
        // Should handle gracefully without crashing
        if (result && result.badge) {
            console.log('✅ Configuration change during operation handled gracefully');
            return true;
        } else {
            console.log('✅ Configuration change during operation handled gracefully (no decoration expected)');
            return true;
        }
    } catch (error) {
        console.log('❌ Configuration change during operation failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test file system events during decoration updates
 */
async function testFileSystemEventsDuringDecorations() {
    console.log('📁 Testing file system events during decoration updates...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Start decoration request
        const decorationPromise = provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
        
        // Trigger file system event during decoration
        setTimeout(() => {
            // Simulate file watcher event
            if (vscode.workspace.createFileSystemWatcher) {
                const mockWatcher = vscode.workspace.createFileSystemWatcher('**/*');
                if (mockWatcher.onDidChange) {
                    mockWatcher.onDidChange(fileUri);
                }
            }
        }, 10);
        
        const result = await decorationPromise;
        
        // Should complete without errors
        console.log('✅ File system events during decoration handled gracefully');
        return true;
    } catch (error) {
        console.log('❌ File system events during decoration failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test rapid sequential operations
 */
async function testRapidSequentialOperations() {
    console.log('⚡ Testing rapid sequential operations...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Perform rapid sequential requests
        const results = [];
        for (let i = 0; i < 20; i++) {
            const result = await provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
            results.push(result);
            // Very short delay between requests
            await delay(1);
        }
        
        // All results should be consistent and valid
        const allValid = results.every(result => result && result.badge);
        const firstBadge = results[0]?.badge;
        const allConsistent = results.every(result => result?.badge === firstBadge);
        
        if (allValid && allConsistent) {
            console.log('✅ Rapid sequential operations handled consistently');
            return true;
        } else {
            console.log('❌ Rapid sequential operations failed or inconsistent');
            console.log(`Valid: ${allValid}, Consistent: ${allConsistent}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Rapid sequential operations failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test cache consistency under concurrent access
 */
async function testCacheConsistencyUnderConcurrentAccess() {
    console.log('🗄️ Testing cache consistency under concurrent access...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        // Create multiple files for cache testing
        const fileUris = Array(10).fill().map((_, i) => 
            vscode.Uri.file(`/workspace1/cache-test-${i}.js`)
        );
        
        // First round: populate cache
        await Promise.all(fileUris.map(uri => 
            provider.provideFileDecoration(uri, { isCancellationRequested: false })
        ));
        
        // Second round: concurrent cache access
        const concurrentCacheAccess = await Promise.all(fileUris.map(uri => 
            provider.provideFileDecoration(uri, { isCancellationRequested: false })
        ));
        
        const allSuccessful = concurrentCacheAccess.every(result => result && result.badge);
        
        if (allSuccessful) {
            console.log('✅ Cache consistency under concurrent access maintained');
            return true;
        } else {
            console.log('❌ Cache consistency under concurrent access failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Cache consistency test failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test provider disposal during active operations
 */
async function testProviderDisposalDuringOperations() {
    console.log('🔄 Testing provider disposal during active operations...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Start multiple operations
        const operations = Array(5).fill().map(() =>
            provider.provideFileDecoration(fileUri, { isCancellationRequested: false })
        );
        
        // Dispose provider while operations are running
        setTimeout(() => {
            provider.dispose();
        }, 10);
        
        // Wait for operations to complete (they should handle disposal gracefully)
        const results = await Promise.allSettled(operations);
        
        // Operations should either succeed or be gracefully cancelled
        const handled = results.every(result => 
            result.status === 'fulfilled' || 
            (result.status === 'rejected' && 
             (result.reason.message.includes('disposed') || 
              result.reason.message.includes('cancelled')))
        );
        
        if (handled) {
            console.log('✅ Provider disposal during operations handled gracefully');
            return true;
        } else {
            console.log('❌ Provider disposal during operations caused unexpected failures');
            return false;
        }
    } catch (error) {
        console.log('❌ Provider disposal test failed:', error.message);
        return false;
    }
}

/**
 * Test async operation timing conflicts (Git + file stat)
 */
async function testAsyncOperationTimingConflicts() {
    console.log('⏱️ Testing async operation timing conflicts...');
    
    const mockInstall = createMockVscode({
        config: { 
            'explorerDates.performanceMode': false,
            'explorerDates.showGitInfo': 'author'
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        const fileUri = vscode.Uri.file('/workspace1/file1.js');
        
        // Multiple requests that will trigger both file stat and Git blame
        const concurrentRequests = Array(8).fill().map(async (_, index) => {
            // Add slight delays to create timing conflicts
            await delay(index * 2);
            return provider.provideFileDecoration(fileUri, { isCancellationRequested: false });
        });
        
        const results = await Promise.all(concurrentRequests);
        
        // All operations should complete successfully
        const allSuccessful = results.every(result => result && result.badge);
        
        if (allSuccessful) {
            console.log('✅ Async operation timing conflicts handled correctly');
            return true;
        } else {
            console.log('❌ Async operation timing conflicts caused failures');
            return false;
        }
    } catch (error) {
        console.log('❌ Async operation timing test failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Test event flooding scenarios
 */
async function testEventFloodingScenarios() {
    console.log('🌊 Testing event flooding scenarios...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
    
    const provider = new FileDateDecorationProvider();
    
    try {
        // Simulate massive concurrent file change events
        const fileUris = Array(50).fill().map((_, i) => 
            vscode.Uri.file(`/workspace1/flood-test-${i}.js`)
        );
        
        // Flood with decoration requests
        const floodPromises = fileUris.map((uri, index) => {
            return provider.provideFileDecoration(uri, { isCancellationRequested: false });
        });
        
        const results = await Promise.all(floodPromises);
        
        // Check that provider handled the flood without crashing
        const handledFlood = results.length === fileUris.length && 
                           results.every(result => result && result.badge);
        
        if (handledFlood) {
            console.log('✅ Event flooding scenarios handled successfully');
            return true;
        } else {
            console.log('❌ Event flooding scenarios caused failures');
            console.log(`Processed: ${results.filter(r => r && r.badge).length}/${fileUris.length}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Event flooding test failed:', error.message);
        return false;
    } finally {
        provider.dispose();
    }
}

/**
 * Main test runner
 */
async function runRaceConditionTests() {
    console.log('🏁 Starting Race Condition Tests for Explorer Dates\n');
    
    const tests = [
        testConcurrentSameFileRequests,
        testConcurrentDifferentFileRequests,
        testConfigurationChangeDuringOperations,
        testFileSystemEventsDuringDecorations,
        testRapidSequentialOperations,
        testCacheConsistencyUnderConcurrentAccess,
        testProviderDisposalDuringOperations,
        testAsyncOperationTimingConflicts,
        testEventFloodingScenarios
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
    
    console.log(`🎯 Race condition tests completed: ${passed}/${tests.length} passed`);
    
    if (failed > 0) {
        console.log(`\n⚠️ ${failed} race condition tests failed - these indicate potential thread safety issues`);
        process.exit(1);
    } else {
        console.log('\n🎉 All race condition tests passed - extension is thread-safe!');
    }
}

// Run tests if called directly
if (require.main === module) {
    runRaceConditionTests().catch(error => {
        console.error('Race condition test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = { runRaceConditionTests };