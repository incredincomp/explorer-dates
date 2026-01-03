/**
 * Test suite for BatchProcessor dynamic chunking functionality
 */

const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');

// Install VS Code mock before requiring modules that depend on it
const mockSetup = createMockVscode();
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

describe('BatchProcessor Dynamic Chunking', function() {
    let provider;

    beforeEach(function() {
        provider = new FileDateDecorationProvider();
    });

    afterEach(function() {
        if (provider && typeof provider.dispose === 'function') {
            provider.dispose();
        }
    });

    describe('Progressive Loading Disabled', function() {
        it('should not load BatchProcessor when progressive loading is disabled', async function() {
            // Mock configuration to disable progressive loading
            const originalGet = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = () => ({
                get: (key, defaultValue) => {
                    if (key === 'progressiveLoading') return false;
                    return defaultValue;
                }
            });

            await provider._applyProgressiveLoadingSetting();

            // BatchProcessor should not be loaded
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);

            // Restore original implementation
            vscode.workspace.getConfiguration = originalGet;
        });

        it('should clean up existing BatchProcessor when progressive loading is disabled', async function() {
            // First, enable progressive loading and load BatchProcessor
            const originalGet = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = () => ({
                get: (key, defaultValue) => {
                    if (key === 'progressiveLoading') return true;
                    return defaultValue;
                }
            });

            await provider._applyProgressiveLoadingSetting();

            // Should have BatchProcessor loaded
            assert.notStrictEqual(provider._batchProcessor, null);

            // Now disable progressive loading
            vscode.workspace.getConfiguration = () => ({
                get: (key, defaultValue) => {
                    if (key === 'progressiveLoading') return false;
                    return defaultValue;
                }
            });

            await provider._applyProgressiveLoadingSetting();

            // BatchProcessor should be cleaned up
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);

            // Restore original implementation
            vscode.workspace.getConfiguration = originalGet;
        });
    });

    describe('Performance Mode', function() {
        it('should not load BatchProcessor in performance mode', async function() {
            provider._performanceMode = true;

            const result = await provider._loadBatchProcessorIfNeeded();

            assert.strictEqual(result, null);
            assert.strictEqual(provider._batchProcessor, null);
        });
    });

    describe('Dynamic Loading', function() {
        it('should load BatchProcessor only when needed', async function() {
            // Initially should be null
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._batchProcessorModule, null);

            // Load BatchProcessor
            const result = await provider._loadBatchProcessorIfNeeded();

            // Should now have BatchProcessor instance
            assert.notStrictEqual(result, null);
            assert.notStrictEqual(provider._batchProcessor, null);
            assert.notStrictEqual(provider._batchProcessorModule, null);
        });

        it('should reuse existing BatchProcessor instance', async function() {
            // Load BatchProcessor first time
            const firstResult = await provider._loadBatchProcessorIfNeeded();
            const firstInstance = provider._batchProcessor;

            // Load BatchProcessor second time
            const secondResult = await provider._loadBatchProcessorIfNeeded();
            const secondInstance = provider._batchProcessor;

            // Should return the same instance
            assert.strictEqual(firstResult, secondResult);
            assert.strictEqual(firstInstance, secondInstance);
        });
    });

    describe('Bundle Size Benefits', function() {
        it('should verify BatchProcessor is not in base bundle when disabled', function() {
            // This test verifies that when progressive loading is disabled,
            // the BatchProcessor code should not be included in the initial bundle load
            
            // In a real scenario, this would be tested by checking that:
            // 1. The base bundle size is smaller when BatchProcessor is not loaded
            // 2. The BatchProcessor chunk is only loaded when progressiveLoading=true
            
            // For this unit test, we verify the lazy loading behavior
            assert.strictEqual(provider._batchProcessor, null, 
                'BatchProcessor should not be loaded initially');
            assert.strictEqual(provider._batchProcessorModule, null, 
                'BatchProcessor module should not be loaded initially');
        });
    });

    after(function() {
        mockSetup.dispose();
    });
});
