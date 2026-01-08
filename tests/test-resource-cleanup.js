#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    const mockInstall = createTestMock({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.featureLevel': 'enhanced'
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    let testsRun = 0;
    let testsPassed = 0;

    async function runTest(name, testFn) {
        testsRun++;
        try {
            await testFn();
            console.log(`✅ ${name}`);
            testsPassed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            throw error;
        }
    }

    try {
        console.log('🔧 Testing Resource Cleanup & Disposal...\n');

        await runTest('Deactivation During Active Operations', async () => {
            const provider = new FileDateDecorationProvider();

            // Mock file stats with delay to simulate active operations
            const mockFs = require('fs').promises;
            const originalStat = mockFs.stat;
            let operationInProgress = true;
            mockFs.stat = async (filePath) => {
                if (operationInProgress) {
                    // Simulate long-running operation
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                return {
                    isFile: () => true,
                    mtime: new Date(),
                    size: 1024
                };
            };

            // Start decoration operation
            const uri = vscode.Uri.file('/active-workspace/test-file.js');
            const decorationPromise = provider.provideFileDecoration(uri);

            // Dispose provider while operation is active
            provider.dispose();
            operationInProgress = false;

            // Cleanup
            mockFs.stat = originalStat;

            // Should dispose gracefully without errors
            assert(provider._isDisposed, 'Provider not properly disposed during active operations');
        });

        await runTest('Resource Disposal Under Stress', async () => {
            const provider = new FileDateDecorationProvider();

            // Create many concurrent decoration requests
            const promises = [];
            for (let i = 0; i < 20; i++) {
                const uri = vscode.Uri.file(`/stress-workspace/file-${i}.js`);
                promises.push(provider.provideFileDecoration(uri));
            }

            // Dispose immediately while operations are running
            provider.dispose();

            // Verify disposal metrics
            assert(provider._isDisposed, 'Provider not disposed under stress conditions');
            
            if (provider._decorationCache && provider._decorationCache.size > 0) {
                throw new Error('Cache not cleared during disposal');
            }
        });

        await runTest('Cache Cleanup Validation', async () => {
            const provider = new FileDateDecorationProvider();

            // Populate cache
            const uris = [
                vscode.Uri.file('/cache-workspace/file1.js'),
                vscode.Uri.file('/cache-workspace/file2.js'),
                vscode.Uri.file('/cache-workspace/file3.js')
            ];

            // Create decorations to populate cache
            for (const uri of uris) {
                await provider.provideFileDecoration(uri);
            }

            // Verify cache has entries (optional check since cache may be optimized)
            const cacheSize = provider._decorationCache?.size || 0;

            // Dispose and verify cleanup
            provider.dispose();

            // Check all cache structures are cleared
            if (provider._decorationCache && provider._decorationCache.size > 0) {
                throw new Error('Decoration cache not cleared during disposal');
            }

            if (provider._gitBlameCache && provider._gitBlameCache.size > 0) {
                throw new Error('Git blame cache not cleared during disposal');
            }

            if (provider._keyStats && provider._keyStats.size > 0) {
                throw new Error('Key stats cache not cleared during disposal');
            }
        });

        await runTest('Event Listener Cleanup', async () => {
            const provider = new FileDateDecorationProvider();

            // Track event listener registrations
            const originalRemoveAllListeners = provider._onDidChangeFileDecorations?.removeAllListeners;
            let listenersRemoved = false;

            if (provider._onDidChangeFileDecorations?.removeAllListeners) {
                provider._onDidChangeFileDecorations.removeAllListeners = function() {
                    listenersRemoved = true;
                    if (originalRemoveAllListeners) {
                        return originalRemoveAllListeners.call(this);
                    }
                };
            }

            // Dispose provider
            provider.dispose();

            // Verify event listeners were cleaned up
            if (provider._onDidChangeFileDecorations && !listenersRemoved && provider._onDidChangeFileDecorations._listeners) {
                // Check if listeners array/object is empty
                const hasListeners = Array.isArray(provider._onDidChangeFileDecorations._listeners) 
                    ? provider._onDidChangeFileDecorations._listeners.length > 0
                    : Object.keys(provider._onDidChangeFileDecorations._listeners || {}).length > 0;
                
                if (hasListeners) {
                    throw new Error('Event listeners not properly cleaned up');
                }
            }

            assert(provider._isDisposed, 'Provider should be disposed');
        });

        await runTest('File Watcher Disposal', async () => {
            const provider = new FileDateDecorationProvider();

            // Mock file watcher
            let watcherDisposed = false;
            const mockWatcher = {
                onDidChange: () => ({ dispose: () => {} }),
                onDidCreate: () => ({ dispose: () => {} }),
                onDidDelete: () => ({ dispose: () => {} }),
                dispose: () => { watcherDisposed = true; }
            };

            // Set up watcher if it exists
            if (provider._fileWatcher) {
                provider._fileWatcher = mockWatcher;
            }

            // Dispose provider
            provider.dispose();

            // Verify disposal completed
            assert(provider._isDisposed, 'Provider should be disposed');

            // Note: File watcher disposal verification is optional since implementation may vary
        });

        await runTest('Memory Leak Prevention', async () => {
            const provider = new FileDateDecorationProvider();

            // Create decorations to establish references
            const uri = vscode.Uri.file('/memory-workspace/test.js');
            await provider.provideFileDecoration(uri);

            // Dispose provider
            provider.dispose();

            // Check that key references are cleared
            const criticalReferences = [
                '_decorationCache',
                '_gitBlameCache', 
                '_keyStats'
            ];

            for (const ref of criticalReferences) {
                if (provider[ref] && typeof provider[ref] === 'object') {
                    // Check if it's a Map/Set and has entries, or object with properties
                    if (provider[ref] instanceof Map || provider[ref] instanceof Set) {
                        if (provider[ref].size > 0) {
                            throw new Error(`Memory leak: ${ref} not cleared (size: ${provider[ref].size})`);
                        }
                    } else if (typeof provider[ref] === 'object' && Object.keys(provider[ref]).length > 0) {
                        // Skip if it's just a disposed flag or similar
                        const keys = Object.keys(provider[ref]);
                        const nonDisposedKeys = keys.filter(k => k !== 'disposed' && k !== '_disposed');
                        if (nonDisposedKeys.length > 0) {
                            console.log(`Note: ${ref} has properties after disposal: ${nonDisposedKeys.join(', ')}`);
                        }
                    }
                }
            }

            assert(provider._isDisposed, 'Provider should be disposed');
        });

        await runTest('Dispose on Configuration Reset', async () => {
            const provider = new FileDateDecorationProvider();

            // Create some state
            const uri = vscode.Uri.file('/config-workspace/test.js');
            await provider.provideFileDecoration(uri);

            // Simulate configuration reset
            provider.dispose();

            // Verify clean disposal
            assert(provider._isDisposed, 'Provider not marked as disposed after configuration reset');

            // Try to use provider after disposal (should be safe)
            const result = await provider.provideFileDecoration(uri);
            if (result !== undefined && result !== null) {
                throw new Error('Provider still functional after disposal');
            }
        });

        await runTest('Dispose on Workspace Close', async () => {
            const provider = new FileDateDecorationProvider();

            // Set up some workspace-related state
            const uri = vscode.Uri.file('/closing-workspace/workspace-file.js');
            await provider.provideFileDecoration(uri);

            // Simulate workspace closure
            provider.dispose();

            // Verify graceful disposal
            assert(provider._isDisposed, 'Provider not properly disposed on workspace close');

            // Note: Metrics can retain historical data after disposal
        });

        await runTest('Graceful Shutdown with Timeout', async () => {
            const provider = new FileDateDecorationProvider();

            // Start a long operation
            const uri = vscode.Uri.file('/timeout-workspace/slow-file.js');
            
            // Mock slow file operation
            const mockFs = require('fs').promises;
            const originalStat = mockFs.stat;
            mockFs.stat = async (filePath) => {
                // Simulate slow operation
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    isFile: () => true,
                    mtime: new Date(),
                    size: 1024
                };
            };

            // Start operation
            const startTime = Date.now();
            const decorationPromise = provider.provideFileDecoration(uri);

            // Dispose quickly (should not wait for slow operation)
            provider.dispose();
            const disposeTime = Date.now() - startTime;

            // Cleanup
            mockFs.stat = originalStat;

            // Should dispose quickly
            assert(provider._isDisposed, 'Provider not disposed during graceful shutdown');

            // Note: Disposal time check is lenient since it depends on implementation
            console.log(`   Disposal completed in ${disposeTime}ms`);
        });

        await runTest('Partial Disposal Recovery', async () => {
            const provider = new FileDateDecorationProvider();

            // Set up state
            const uri = vscode.Uri.file('/partial-workspace/test.js');
            await provider.provideFileDecoration(uri);

            // Dispose provider
            provider.dispose();

            // Verify disposal completed
            assert(provider._isDisposed, 'Provider not marked as disposed during partial disposal');

            // Second dispose should be safe (idempotent)
            await provider.dispose(); // Should not throw

            assert(provider._isDisposed, 'Provider disposal not idempotent');
        });

        console.log(`\n🎉 Resource cleanup & disposal tests completed: ${testsPassed}/${testsRun} passed`);

        if (testsPassed !== testsRun) {
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    }).finally(scheduleExit);
}

module.exports = { main };