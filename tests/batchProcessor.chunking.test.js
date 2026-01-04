#!/usr/bin/env node

/**
 * BatchProcessor chunking tests executed as a vanilla Node script.
 * This avoids relying on mocha/jest globals that are not available in CI.
 */

const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');

const mockSetup = createMockVscode();
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function runTest(name, testFn) {
    const provider = new FileDateDecorationProvider();
    try {
        await testFn(provider);
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}:`, error);
        mockSetup.dispose();
        process.exitCode = 1;
        throw error;
    } finally {
        provider.dispose?.();
    }
}

async function testProgressiveLoadingDisabled() {
    await runTest('Does not load BatchProcessor when progressive loading disabled', async provider => {
        const originalGet = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key, defaultValue) => (key === 'progressiveLoading' ? false : defaultValue)
        });
        
        try {
            await provider._applyProgressiveLoadingSetting();
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);
        } finally {
            vscode.workspace.getConfiguration = originalGet;
        }
    });

    await runTest('Disposes BatchProcessor when progressive loading toggled off', async provider => {
        const originalGet = vscode.workspace.getConfiguration;
        const config = value => () => ({
            get: (key, defaultValue) => (key === 'progressiveLoading' ? value : defaultValue)
        });
        
        try {
            vscode.workspace.getConfiguration = config(true);
            await provider._applyProgressiveLoadingSetting();
            assert.notStrictEqual(provider._batchProcessor, null);
            
            vscode.workspace.getConfiguration = config(false);
            await provider._applyProgressiveLoadingSetting();
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);
        } finally {
            vscode.workspace.getConfiguration = originalGet;
        }
    });
}

async function testPerformanceMode() {
    await runTest('Skips BatchProcessor while in performance mode', async provider => {
        provider._performanceMode = true;
        const result = await provider._loadBatchProcessorIfNeeded();
        assert.strictEqual(result, null);
        assert.strictEqual(provider._batchProcessor, null);
    });
}

async function testDynamicLoading() {
    await runTest('Lazily loads BatchProcessor when needed', async provider => {
        assert.strictEqual(provider._batchProcessor, null);
        assert.strictEqual(provider._batchProcessorModule, null);
        
        const result = await provider._loadBatchProcessorIfNeeded();
        assert.notStrictEqual(result, null);
        assert.notStrictEqual(provider._batchProcessor, null);
        assert.notStrictEqual(provider._batchProcessorModule, null);
    });
    
    await runTest('Reuses existing BatchProcessor instance', async provider => {
        const first = await provider._loadBatchProcessorIfNeeded();
        const second = await provider._loadBatchProcessorIfNeeded();
        assert.strictEqual(first, second);
        assert.strictEqual(provider._batchProcessor, first);
    });
}

async function testBundleSizeBenefits() {
    await runTest('BatchProcessor excluded from base bundle until needed', async provider => {
        assert.strictEqual(provider._batchProcessor, null);
        assert.strictEqual(provider._batchProcessorModule, null);
    });
}

async function main() {
    try {
        await testProgressiveLoadingDisabled();
        await testPerformanceMode();
        await testDynamicLoading();
        await testBundleSizeBenefits();
        console.log('🎯 BatchProcessor chunking tests completed');
    } catch {
        // runTest already sets exit code/logs
    } finally {
        mockSetup.dispose();
    }
}

if (require.main === module) {
    main();
}
