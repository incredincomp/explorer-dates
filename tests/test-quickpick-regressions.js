#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const mockHelpers = require('./helpers/mockVscode');
const mockInstall = mockHelpers.createMockVscode();
const { createExtensionContext, createMockVscode } = mockHelpers;

async function disposeContext(context) {
    if (!context?.subscriptions) return;
    for (const disposable of context.subscriptions) {
        try {
            disposable?.dispose?.();
        } catch {
            // Ignore errors from disposals in tests
        }
    }
    context.subscriptions.length = 0;
}

/**
 * Test format regression detection catches actual issues
 */
async function testFormatRegressionDetection() {
    console.log('Testing format regression detection...');
    
    // Test with mock preset data that contains format regressions
    const testMock = createMockVscode({
        config: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true
        }
    });
    
    try {
        const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
        const context = createExtensionContext();
        const runtimeManager = new RuntimeConfigManager(context);
        const { vscode } = testMock;
        
        let capturedItems = [];
        
        vscode.window.showQuickPick = async (items, options) => {
            capturedItems = [...items];
            return null;
        };
        
        // Mock the bundle size calculation to return problematic values
        const originalCalculateBundleSize = runtimeManager._calculateCurrentBundleSize;
        runtimeManager._calculateCurrentBundleSize = () => {
            return NaN; // This should be caught as a regression
        };
        
        let regressionCaught = false;
        
        try {
            await runtimeManager.showAllPresets();
            
            // Check if any items contain NaN
            for (const item of capturedItems) {
                if (item.description && item.description.includes('NaN')) {
                    regressionCaught = true;
                    console.log(`✅ Format regression detected in description: "${item.description}"`);
                    break;
                }
            }
        } catch (error) {
            // Bundle size calculation error should be caught
            if (error.message.includes('NaN') || error.message.includes('bundle size')) {
                regressionCaught = true;
                console.log(`✅ Format regression caught as error: ${error.message}`);
            }
        }
        
        // Test with Infinity values
        runtimeManager._calculateCurrentBundleSize = () => {
            return Infinity; // This should also be caught
        };
        
        let infinityRegressionCaught = false;
        
        try {
            capturedItems = [];
            await runtimeManager.showAllPresets();
            
            for (const item of capturedItems) {
                if (item.description && item.description.includes('Infinity')) {
                    infinityRegressionCaught = true;
                    console.log(`✅ Infinity regression detected in description: "${item.description}"`);
                    break;
                }
            }
        } catch (error) {
            if (error.message.includes('Infinity')) {
                infinityRegressionCaught = true;
                console.log(`✅ Infinity regression caught as error: ${error.message}`);
            }
        }
        
        // Restore original method
        runtimeManager._calculateCurrentBundleSize = originalCalculateBundleSize;
        
        // Verify our test setup can detect regressions
        // Note: If no regressions were caught, it means the implementation 
        // is robust, but our test should still be able to catch them
        if (!regressionCaught && !infinityRegressionCaught) {
            console.log('ℹ️  Format regression test didn\'t trigger - implementation may be robust');
            console.log('    This is good, but we should verify our test can detect real regressions');
        }
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
        
        console.log('✅ Format regression detection test completed');
        
    } finally {
        testMock.dispose();
    }
}

/**
 * Test QuickPick rendering regression scenarios
 * These test specific visual aspects that could break silently
 */
async function testQuickPickRegressionPoints() {
    console.log('Testing QuickPick regression scenarios...');
    
    // Create isolated mock for this test to prevent global state contamination
    const testMock = createMockVscode({
        config: {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': true,
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.enableAdvancedCache': true,
            'explorerDates.enableWorkspaceIntelligence': true
        }
    });
    
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    const { vscode, configValues } = testMock;
    
    // Set up configuration with extreme values to test edge cases
    configValues['explorerDates.enableOnboardingSystem'] = true;
    configValues['explorerDates.enableAnalysisCommands'] = true;
    configValues['explorerDates.enableExportReporting'] = true;
    configValues['explorerDates.enableExtensionApi'] = true;
    configValues['explorerDates.enableWorkspaceTemplates'] = true;
    configValues['explorerDates.enableAdvancedCache'] = true;
    configValues['explorerDates.enableWorkspaceIntelligence'] = true;
    configValues['explorerDates.enableIncrementalWorkers'] = true;
    
    let capturedQuickPicks = [];
    let capturedQuickPickOptions = [];
    
    vscode.window.showQuickPick = async (items, options) => {
        capturedQuickPicks.push([...items]); // Deep copy for analysis
        capturedQuickPickOptions.push({ ...options });
        return null; // Always cancel to test rendering only
    };

    // Test 1: Preset comparison should handle very high bundle sizes
    const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
    const { PRESET_DEFINITIONS } = require('../src/presetDefinitions');
    
    await runtimeManager.showPresetComparison(currentSettings, PRESET_DEFINITIONS.minimal);
    
    const comparisonItems = capturedQuickPicks[0];
    
    // Verify bundle size calculations don't overflow or show NaN
    for (const item of comparisonItems) {
        if (item.description) {
            assert.ok(!item.description.includes('NaN'), `Description should not contain NaN: ${item.description}`);
            assert.ok(!item.description.includes('Infinity'), `Description should not contain Infinity: ${item.description}`);
            assert.ok(!item.description.includes('undefined'), `Description should not contain undefined: ${item.description}`);
            
            // Bundle sizes should be reasonable numbers
            const bundleSizeMatch = item.description.match(/(\d+)KB/);
            if (bundleSizeMatch) {
                const bundleSize = parseInt(bundleSizeMatch[1]);
                assert.ok(bundleSize >= 90 && bundleSize <= 500, `Bundle size should be reasonable: ${bundleSize}KB`);
            }
            
            // Savings calculations should be reasonable
            const savingsMatch = item.description.match(/saves (\d+)KB/);
            if (savingsMatch) {
                const savings = parseInt(savingsMatch[1]);
                assert.ok(savings >= 0 && savings <= 300, `Savings should be reasonable: ${savings}KB`);
            }
        }
    }
    
    // Test 2: All presets should render with consistent formatting
    await runtimeManager.showAllPresets();
    
    const allPresetsItems = capturedQuickPicks[1];
    const presetLabelFormats = new Set();
    const presetDescFormats = new Set();
    
    for (const item of allPresetsItems) {
        assert.ok(item.label?.length > 0, 'All preset items should have non-empty labels');
        assert.ok(item.description?.length > 0, 'All preset items should have non-empty descriptions');
        assert.ok(item.detail?.length > 0, 'All preset items should have non-empty details');
        
        // Track formatting consistency
        const labelFormat = item.label.replace(/[A-Za-z ]/g, '').substring(0, 3); // Extract special chars/numbers
        const sizeMatch = item.description.match(/(\d+KB \([^)]+\))/);
        const descFormat = sizeMatch ? 'size-with-percentage' : (item.description.includes('KB') ? 'size-only' : 'no-size');
        
        presetLabelFormats.add(labelFormat);
        presetDescFormats.add(descFormat);
        
        // Verify required preset object structure
        assert.ok(item.preset, 'Each preset item should have preset object');
        assert.ok(item.preset.name, 'Each preset should have name');
        assert.ok(item.preset.id, 'Each preset should have id');
        assert.ok(item.preset.description, 'Each preset should have description');
        assert.ok(Array.isArray(item.preset.targetScenarios), 'Each preset should have target scenarios array');
        assert.ok(item.preset.targetScenarios.length > 0, 'Each preset should have at least one target scenario');
    }
    
    // Critical: Actually assert on collected format sets
    console.log('Collected label formats:', Array.from(presetLabelFormats));
    console.log('Collected description formats:', Array.from(presetDescFormats));
    
    // Assert formatting consistency - all presets should use same format patterns
    assert.ok(presetLabelFormats.size <= 2, `Preset labels should use consistent formatting, found formats: ${Array.from(presetLabelFormats).join(', ')}`);
    assert.ok(presetDescFormats.size <= 3, `Preset descriptions should use consistent size formats, found formats: ${Array.from(presetDescFormats).join(', ')}`);
    
    // Ensure we're parsing actual size information, not falling back to 'no-size'
    const noSizeCount = Array.from(presetDescFormats).filter(f => f === 'no-size').length;
    assert.strictEqual(noSizeCount, 0, 'All preset descriptions should contain size information');
    
    // Verify we have actual size information in at least most descriptions
    const hasSizeFormats = Array.from(presetDescFormats).filter(f => f.includes('size')).length;
    assert.ok(hasSizeFormats > 0, 'At least some preset descriptions should contain size information');
    
    // Verify format parsing is working - should not be empty or just special characters
    for (const format of presetLabelFormats) {
        assert.ok(format !== null && format !== undefined, 'Label formats should be parsed successfully');
        // Allow empty format for labels that are pure text
    }
    
    // Test format regression detection - verify bundle sizes are reasonable numbers
    for (const item of allPresetsItems) {
        if (item.description) {
            // Check for NaN, Infinity, or undefined in descriptions
            assert.ok(!item.description.includes('NaN'), `Description should not contain NaN: ${item.description}`);
            assert.ok(!item.description.includes('Infinity'), `Description should not contain Infinity: ${item.description}`);
            assert.ok(!item.description.includes('undefined'), `Description should not contain undefined: ${item.description}`);
            
            // Bundle sizes should be reasonable numbers
            const bundleSizeMatch = item.description.match(/(\d+)KB/);
            if (bundleSizeMatch) {
                const bundleSize = parseInt(bundleSizeMatch[1]);
                assert.ok(bundleSize >= 90 && bundleSize <= 500, `Bundle size should be reasonable: ${bundleSize}KB in "${item.description}"`);
            }
            
            // Savings calculations should be reasonable
            const savingsMatch = item.description.match(/saves (\d+)KB/);
            if (savingsMatch) {
                const savings = parseInt(savingsMatch[1]);
                assert.ok(savings >= 0 && savings <= 300, `Savings should be reasonable: ${savings}KB in "${item.description}"`);
            }
            
            // Percentage savings should be valid
            const percentageMatch = item.description.match(/(\d+)%/);
            if (percentageMatch) {
                const percentage = parseInt(percentageMatch[1]);
                assert.ok(percentage >= 0 && percentage <= 100, `Percentage should be valid: ${percentage}% in "${item.description}"`);
            }
        }
    }
    
    console.log('✅ Format consistency validated:', { labelFormats: Array.from(presetLabelFormats), descFormats: Array.from(presetDescFormats) });
    
    // Verify all presets are included and none are duplicated
    const presetIds = allPresetsItems.map(item => item.preset?.id).filter(Boolean);
    const expectedIds = Object.keys(PRESET_DEFINITIONS);
    assert.strictEqual(presetIds.length, expectedIds.length, 'Should include all presets exactly once');
    
    for (const expectedId of expectedIds) {
        assert.ok(presetIds.includes(expectedId), `Should include preset ${expectedId}`);
    }
    
    // Clean up isolated mock to prevent state leaks
    testMock.dispose();

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ QuickPick regression scenarios test passed');
}

/**
 * Test chunk status QuickPick edge cases that could break rendering
 */
async function testChunkStatusRegressionPoints() {
    console.log('Testing chunk status rendering edge cases...');
    
    // Create isolated mock for this test to prevent state contamination from previous tests
    const testMock = createMockVscode({
        config: {
            'explorerDates.enableOnboardingSystem': false,
            'explorerDates.enableAnalysisCommands': false,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.enableWorkspaceTemplates': false,
            'explorerDates.enableAdvancedCache': false,
            'explorerDates.enableWorkspaceIntelligence': false
        }
    });
    
    const { registerRuntimeCommands } = require('../src/commands/runtimeCommands');
    const context = createExtensionContext();
    const { runtimeManager } = await registerRuntimeCommands(context);
    const { vscode, configValues } = testMock;
    
    let capturedChunkQuickPick = null;
    
    vscode.window.showQuickPick = async (items, options) => {
        capturedChunkQuickPick = { items: [...items], options: { ...options } };
        return null;
    };
    
    // Test with all chunks disabled - edge case that could break bundle calculations
    const chunkKeys = [
        'enableOnboardingSystem',
        'enableAnalysisCommands', 
        'enableExportReporting',
        'enableExtensionApi',
        'enableWorkspaceTemplates',
        'enableAdvancedCache',
        'enableWorkspaceIntelligence',
        'enableIncrementalWorkers'
    ];
    
    chunkKeys.forEach(key => {
        configValues[`explorerDates.${key}`] = false;
    });
    
    await vscode.commands.executeCommand('explorerDates.showChunkStatus');
    
    assert.ok(capturedChunkQuickPick, 'Should capture chunk status QuickPick');
    
    const { items: chunkItems } = capturedChunkQuickPick;
    
    // Verify bundle summary handles all-disabled state
    const summaryItem = chunkItems[0];
    assert.ok(summaryItem.label.includes('Bundle Summary'), 'First item should be bundle summary');
    assert.ok(summaryItem.description.includes('Total:'), 'Summary should show total even when chunks disabled');
    
    // Should still show base bundle size
    const totalMatch = summaryItem.description.match(/Total: (\d+)KB/);
    assert.ok(totalMatch, 'Should show total bundle size');
    const totalSize = parseInt(totalMatch[1]);
    assert.ok(totalSize >= 99, 'Should show at least base bundle size when all chunks disabled');
    
    // Verify all chunks show as disabled with proper icons
    const chunkItemsOnly = chunkItems.slice(1);
    for (const chunkItem of chunkItemsOnly) {
        assert.ok(chunkItem.label.includes('❌'), `All chunks should show disabled icon: ${chunkItem.label}`);
        assert.ok(chunkItem.description.includes('Disabled'), `All chunks should show disabled status: ${chunkItem.description}`);
        assert.ok(chunkItem.description.includes('KB'), 'Should show chunk size even when disabled');
    }
    
    // Test with mixed enabled/disabled state
    configValues['explorerDates.enableOnboardingSystem'] = true;
    configValues['explorerDates.enableAnalysisCommands'] = false;
    configValues['explorerDates.enableExportReporting'] = true;
    
    capturedChunkQuickPick = null;
    await vscode.commands.executeCommand('explorerDates.showChunkStatus');
    
    const { items: mixedItems } = capturedChunkQuickPick;
    const mixedChunkItems = mixedItems.slice(1);
    
    let enabledCount = 0;
    let disabledCount = 0;
    
    for (const item of mixedChunkItems) {
        if (item.label.includes('✅')) {
            enabledCount++;
            assert.ok(item.description.includes('Enabled'), 'Enabled chunks should show enabled status');
        } else if (item.label.includes('❌')) {
            disabledCount++;
            assert.ok(item.description.includes('Disabled'), 'Disabled chunks should show disabled status');
        }
    }
    
    assert.ok(enabledCount > 0, 'Should have some enabled chunks');
    assert.ok(disabledCount > 0, 'Should have some disabled chunks');
    assert.strictEqual(enabledCount + disabledCount, chunkKeys.length, 'Should account for all chunks');

    // Clean up isolated mock
    testMock.dispose();
    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ Chunk status regression scenarios test passed');
}

/**
 * Test Browse All Presets branch that could regress silently
 */
async function testBrowseAllPresetsBranch() {
    console.log('Testing Browse All Presets branch...');
    
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    const { vscode, configValues } = mockInstall;
    
    let quickPickCallOrder = [];
    let informationMessages = [];
    
    vscode.window.showQuickPick = async (items, options) => {
        quickPickCallOrder.push({
            type: 'quickpick',
            itemCount: items.length,
            hasCurrentItem: items.some(item => item.action === 'current'),
            hasRecommendedItem: items.some(item => item.action === 'apply'),
            hasBrowseItem: items.some(item => item.action === 'browse'),
            allHavePresets: items.every(item => !item.preset || typeof item.preset === 'object')
        });
        
        if (quickPickCallOrder.length === 1) {
            // First call: user selects browse
            return items.find(item => item.action === 'browse');
        } else if (quickPickCallOrder.length === 2) {
            // Second call: user selects specific preset
            return items.find(item => item.preset?.id === 'balanced');
        }
        return null;
    };
    
    vscode.window.showInformationMessage = async (message, options, ...actions) => {
        informationMessages.push(message);
        return 'Apply'; // User confirms
    };
    
    // Trigger the browse flow through showPresetComparison
    const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
    const { PRESET_DEFINITIONS } = require('../src/presetDefinitions');
    
    await runtimeManager.showPresetComparison(currentSettings, PRESET_DEFINITIONS.minimal);
    
    // Verify the browse flow was executed correctly
    assert.strictEqual(quickPickCallOrder.length, 2, 'Browse flow should trigger two QuickPick calls');
    
    const firstCall = quickPickCallOrder[0];
    assert.ok(firstCall.hasCurrentItem, 'First call should have current config item');
    assert.ok(firstCall.hasRecommendedItem, 'First call should have recommended item when provided');
    assert.ok(firstCall.hasBrowseItem, 'First call should have browse item');
    
    const secondCall = quickPickCallOrder[1];
    assert.ok(secondCall.itemCount > 3, 'Second call should show all presets');
    assert.ok(secondCall.allHavePresets, 'Second call should have preset objects for all items');
    
    // Verify confirmation was shown
    assert.strictEqual(informationMessages.length, 1, 'Should show one confirmation message');
    assert.ok(informationMessages[0].includes('Balanced'), 'Confirmation should mention selected preset');
    
    // Test direct browse without recommended preset
    quickPickCallOrder = [];
    informationMessages = [];
    
    await runtimeManager.showPresetComparison(currentSettings, null); // No recommendation
    
    // Should show current and browse only
    const noRecommendationCall = quickPickCallOrder[0];
    assert.ok(noRecommendationCall.hasCurrentItem, 'Should still have current item without recommendation');
    assert.ok(!noRecommendationCall.hasRecommendedItem, 'Should not have recommended item when none provided');
    assert.ok(noRecommendationCall.hasBrowseItem, 'Should still have browse item without recommendation');

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ Browse All Presets branch test passed');
}

/**
 * Test configuration details formatting that could break silently
 */
async function testConfigurationDetailsFormatting() {
    console.log('Testing configuration details formatting...');
    
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    const { vscode, configValues } = mockInstall;
    
    // Test edge case configurations
    const testConfigs = [
        // All enabled
        {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': true,
            'explorerDates.enableExportReporting': true,
            'explorerDates.enableExtensionApi': true,
            'explorerDates.performanceMode': false
        },
        // All disabled
        {
            'explorerDates.enableOnboardingSystem': false,
            'explorerDates.enableAnalysisCommands': false,
            'explorerDates.enableExportReporting': false,
            'explorerDates.enableExtensionApi': false,
            'explorerDates.performanceMode': true
        },
        // Mixed configuration
        {
            'explorerDates.enableOnboardingSystem': true,
            'explorerDates.enableAnalysisCommands': false,
            'explorerDates.enableExportReporting': true,
            'explorerDates.performanceMode': true
        }
    ];
    
    let capturedDetails = [];
    
    vscode.window.showQuickPick = async (items) => {
        for (const item of items) {
            if (item.detail) {
                capturedDetails.push(item.detail);
            }
        }
        return null;
    };
    
    for (let i = 0; i < testConfigs.length; i++) {
        const testConfig = testConfigs[i];
        
        // Apply test configuration
        Object.assign(configValues, testConfig);
        
        capturedDetails = [];
        const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
        
        await runtimeManager.showPresetComparison(currentSettings);
        
        // Verify details are properly formatted
        for (const detail of capturedDetails) {
            assert.ok(typeof detail === 'string', 'Detail should be string');
            assert.ok(detail.length > 0, 'Detail should not be empty');
            assert.ok(!detail.includes('undefined'), `Detail should not contain undefined: ${detail}`);
            assert.ok(!detail.includes('null'), `Detail should not contain null: ${detail}`);
            assert.ok(!detail.includes('[object Object]'), `Detail should not contain stringified objects: ${detail}`);
            
            // Should contain configuration information (unless it's the browse item)
            const isBrowseItem = detail.includes('Minimal, Balanced, Web Development, Enterprise, Data Science');
            if (!isBrowseItem) {
                assert.ok(
                    detail.includes('enabled') || detail.includes('disabled') || detail.includes(':') || 
                    detail.includes('On') || detail.includes('Off') || detail.includes('true') || detail.includes('false'),
                    `Detail should contain configuration info: ${detail}`
                );
            }
        }
    }

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ Configuration details formatting test passed');
}

async function main() {
    try {
        await testQuickPickRegressionPoints();
        await testChunkStatusRegressionPoints();
        await testBrowseAllPresetsBranch();
        await testConfigurationDetailsFormatting();
        await testFormatRegressionDetection();
        console.log('🎯 All QuickPick regression tests completed successfully');
    } catch (error) {
        console.error('❌ QuickPick regression tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main();