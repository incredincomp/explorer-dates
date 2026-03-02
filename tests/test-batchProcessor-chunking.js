#!/usr/bin/env node

/**
 * BatchProcessor chunking tests executed as a vanilla Node script.
 * This avoids relying on mocha/jest globals that are not available in CI.
 */

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const { addWarningFilters } = require('./helpers/warningFilters');
const { applyProgressiveLoadingSetting, loadBatchProcessorIfNeeded } = require('../src/chunks/decoration-batch-chunk');
const { scheduleExit } = require('./helpers/forceExit');

addWarningFilters([/feature flags bridge unavailable for decorationsAdvanced chunk/]);

const mockSetup = createTestMock();
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
            await applyProgressiveLoadingSetting(provider);
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);
        } finally {
            vscode.workspace.getConfiguration = originalGet;
        }
    });

    await runTest('Disposes BatchProcessor when progressive loading toggled off', async provider => {
        const originalGet = vscode.workspace.getConfiguration;
        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        const config = value => () => ({
            get: (key, defaultValue) => (key === 'progressiveLoading' ? value : defaultValue)
        });
        
        try {
            // Avoid background warmup jobs in this unit test.
            vscode.workspace.workspaceFolders = [];
            vscode.workspace.getConfiguration = config(true);
            await applyProgressiveLoadingSetting(provider);
            assert.notStrictEqual(provider._batchProcessor, null);
            
            vscode.workspace.getConfiguration = config(false);
            await applyProgressiveLoadingSetting(provider);
            assert.strictEqual(provider._batchProcessor, null);
            assert.strictEqual(provider._progressiveLoadingEnabled, false);
        } finally {
            vscode.workspace.getConfiguration = originalGet;
            vscode.workspace.workspaceFolders = originalWorkspaceFolders;
        }
    });
}

async function testPerformanceMode() {
    await runTest('Skips BatchProcessor while in performance mode', async provider => {
        provider._performanceMode = true;
        const result = await loadBatchProcessorIfNeeded(provider);
        assert.strictEqual(result, null);
        assert.strictEqual(provider._batchProcessor, null);
    });
}

async function testDynamicLoading() {
    await runTest('Lazily loads BatchProcessor when needed', async provider => {
        assert.strictEqual(provider._batchProcessor, null);
        assert.strictEqual(provider._batchProcessorModule, null);
        
        const result = await loadBatchProcessorIfNeeded(provider);
        assert.notStrictEqual(result, null);
        assert.notStrictEqual(provider._batchProcessor, null);
        assert.notStrictEqual(provider._batchProcessorModule, null);
    });
    
    await runTest('Reuses existing BatchProcessor instance', async provider => {
        const first = await loadBatchProcessorIfNeeded(provider);
        const second = await loadBatchProcessorIfNeeded(provider);
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
        scheduleExit(0, typeof process.exitCode === 'number' ? process.exitCode : 0);
    }
}

if (require.main === module) {
    main();
}
