#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const mockHelpers = require('./helpers/mockVscode');
const mockInstall = mockHelpers.createMockVscode();
const { createExtensionContext } = mockHelpers;
const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
const { registerRuntimeCommands } = require('../src/commands/runtimeCommands');

const baseExplorerConfig = Object.fromEntries(
    Object.entries(mockInstall.configValues)
        .filter(([key]) => key.startsWith('explorerDates.'))
        .map(([key, value]) => [key, value])
);

function resetExplorerConfig(overrides = {}) {
    const stores = [
        { store: mockInstall.configValues, baseline: baseExplorerConfig },
        { store: mockInstall.workspaceConfigValues, baseline: {} },
        { store: mockInstall.workspaceFolderConfigValues, baseline: {} }
    ];

    for (const { store, baseline } of stores) {
        for (const key of Object.keys(store)) {
            if (key.startsWith('explorerDates.')) {
                delete store[key];
            }
        }
        if (baseline && Object.keys(baseline).length) {
            Object.entries(baseline).forEach(([key, value]) => {
                store[key] = value;
            });
        }
    }

    Object.entries(overrides).forEach(([key, value]) => {
        const normalizedKey = key.includes('.') ? key : `explorerDates.${key}`;
        mockInstall.configValues[normalizedKey] = value;
    });
}

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
 * Test showPresetComparison QuickPick rendering and user flows
 */
async function testShowPresetComparison() {
    console.log('Testing showPresetComparison QuickPick flows...');
    resetExplorerConfig();
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    
    const { vscode, configValues } = mockInstall;
    
    // Set up current configuration with high bundle size
    configValues['explorerDates.enableOnboardingSystem'] = true;
    configValues['explorerDates.enableAnalysisCommands'] = true;
    configValues['explorerDates.enableExportReporting'] = true;
    configValues['explorerDates.enableExtensionApi'] = true;
    configValues['explorerDates.enableWorkspaceTemplates'] = true;
    configValues['explorerDates.enableAdvancedCache'] = true;
    configValues['explorerDates.enableWorkspaceIntelligence'] = true;
    configValues['explorerDates.enableIncrementalWorkers'] = true;
    
    let quickPickItems = null;
    let quickPickOptions = null;
    let quickPickCallCount = 0;
    
    vscode.window.showQuickPick = async (items, options) => {
        quickPickCallCount++;
        
        // Capture the first QuickPick call (showPresetComparison)
        if (quickPickCallCount === 1) {
            quickPickItems = items;
            quickPickOptions = options;
            // Return null to avoid triggering browse flow for this test
            return null;
        }
        
        return null; // User cancelled
    };
    
    let informationMessageShown = false;
    let informationMessage = '';
    vscode.window.showInformationMessage = async (message, options, ...actions) => {
        informationMessageShown = true;
        informationMessage = message;
        return 'Apply'; // User confirms preset application
    };

    // Test preset comparison with recommended preset
    const { PRESET_DEFINITIONS } = require('../src/presetDefinitions');
    const recommendedPreset = PRESET_DEFINITIONS.balanced;
    const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
    
    await runtimeManager.showPresetComparison(currentSettings, recommendedPreset);

    // Verify QuickPick rendering
    assert.ok(quickPickItems, 'QuickPick items should be populated');
    console.log('QuickPick items structure:', quickPickItems.map(item => ({
        label: item.label,
        action: item.action,
        hasPreset: !!item.preset
    })));
    
    // showPresetComparison may have different number of items based on current vs recommended
    assert.ok(quickPickItems.length >= 2, 'Should show at least current and browse options');
    assert.ok(quickPickItems.length <= 5, 'Should not show too many options');
    
    // Check current configuration item
    const currentItem = quickPickItems.find(item => item.action === 'current');
    assert.ok(currentItem, 'Should include current configuration item');
    assert.ok(currentItem.label.includes('Current Configuration'), 'Current item should have descriptive label');
    assert.ok(currentItem.description.includes('Bundle:'), 'Current item should show bundle size');
    assert.ok(currentItem.detail, 'Current item should have configuration details');
    
    // Check recommended preset item (may or may not be present)
    const recommendedItem = quickPickItems.find(item => item.action === 'apply');
    if (recommendedItem) {
        assert.ok(recommendedItem.label.includes('Recommended'), 'Recommended item should have descriptive label');
        assert.ok(recommendedItem.description.includes('saves') || recommendedItem.description.includes('Bundle:'), 'Recommended item should show savings or size');
        assert.ok(recommendedItem.preset, 'Recommended item should include preset object');
    }
    
    // Check browse all presets item
    const browseItem = quickPickItems.find(item => item.action === 'browse');
    assert.ok(browseItem, 'Should include browse all presets item');
    assert.ok(browseItem.label.includes('Browse All Presets'), 'Browse item should have descriptive label');
    assert.ok(browseItem.description.includes('available presets'), 'Browse item should mention preset count');
    assert.ok(browseItem.detail.includes('Minimal'), 'Browse item should preview preset names');
    
    // Verify QuickPick options
    assert.ok(quickPickOptions.placeHolder, 'Should have placeholder text');
    assert.strictEqual(quickPickOptions.ignoreFocusOut, true, 'Should ignore focus out');
    assert.strictEqual(quickPickOptions.matchOnDescription, true, 'Should match on description');
    assert.strictEqual(quickPickOptions.matchOnDetail, true, 'Should match on detail');

    // Verify that showPresetComparison was called without triggering browse flow
    assert.strictEqual(quickPickCallCount, 1, 'Should call QuickPick once for preset comparison');
    assert.ok(!informationMessageShown, 'Should not show confirmation dialog when user cancels');

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ showPresetComparison UI test passed');
}

/**
 * Test showPresetComparison browse flow 
 */
async function testPresetComparisonBrowseFlow() {
    console.log('Testing showPresetComparison browse flow...');
    resetExplorerConfig();
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    
    const { vscode, configValues } = mockInstall;
    
    let quickPickCallCount = 0;
    let informationMessageShown = false;
    
    vscode.window.showQuickPick = async (items, options) => {
        quickPickCallCount++;
        
        if (quickPickCallCount === 1) {
            // First call: user selects "Browse All Presets"
            return items.find(item => item.action === 'browse');
        } else if (quickPickCallCount === 2) {
            // Second call (showAllPresets): user selects "Minimal" preset
            return items.find(item => item.preset?.id === 'minimal');
        }
        return null;
    };
    
    vscode.window.showInformationMessage = async (message, options, ...actions) => {
        informationMessageShown = true;
        return 'Apply'; // User confirms preset application
    };

    // Test preset comparison with recommended preset that triggers browse
    const { PRESET_DEFINITIONS } = require('../src/presetDefinitions');
    const recommendedPreset = PRESET_DEFINITIONS.balanced;
    const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
    
    await runtimeManager.showPresetComparison(currentSettings, recommendedPreset);

    // Verify the browse flow was executed correctly
    assert.strictEqual(quickPickCallCount, 2, 'Browse flow should trigger two QuickPick calls');
    assert.ok(informationMessageShown, 'Should show confirmation dialog for preset application');

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ showPresetComparison browse flow test passed');
}

/**
 * Test showAllPresets QuickPick rendering and selection flow
 */
async function testShowAllPresets() {
    console.log('Testing showAllPresets QuickPick rendering...');
    resetExplorerConfig();
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    
    const { vscode, configValues } = mockInstall;
    
    // Set up current configuration
    configValues['explorerDates.enableOnboardingSystem'] = true;
    configValues['explorerDates.enableAnalysisCommands'] = false;
    configValues['explorerDates.enableExportReporting'] = true;
    configValues['explorerDates.performanceMode'] = false;
    
    let quickPickItems = null;
    let quickPickOptions = null;
    let informationShown = false;
    let presetApplied = null;
    
    vscode.window.showQuickPick = async (items, options) => {
        quickPickItems = items;
        quickPickOptions = options;
        
        console.log('Available preset IDs:', items.map(item => item.preset?.id).filter(Boolean));
        
        // User selects the first available preset (whatever it is)
        return items.find(item => item.preset) || null;
    };
    
    vscode.window.showInformationMessage = async (message, options, ...actions) => {
        informationShown = true;
        presetApplied = message;
        return 'Apply'; // User confirms
    };

    await runtimeManager.showAllPresets();

    // Verify all presets are displayed
    const { PRESET_DEFINITIONS } = require('../src/presetDefinitions');
    const expectedPresetCount = Object.keys(PRESET_DEFINITIONS).length;
    assert.strictEqual(quickPickItems.length, expectedPresetCount, `Should show all ${expectedPresetCount} presets`);
    
    // Verify preset item structure
    for (const item of quickPickItems) {
        assert.ok(item.label, 'Each preset should have a label');
        assert.ok(item.description, 'Each preset should have description with size and savings');
        assert.ok(item.detail, 'Each preset should have detail with scenarios');
        assert.ok(item.preset, 'Each preset should include preset object');
        assert.ok(item.preset.name, 'Preset object should have name');
        assert.ok(item.preset.description, 'Preset object should have description');
        assert.ok(Array.isArray(item.preset.targetScenarios), 'Preset should have target scenarios');
    }
    
    // Verify specific preset rendering
    const minimalPreset = quickPickItems.find(item => item.preset?.id === 'minimal');
    assert.ok(minimalPreset, 'Should include minimal preset');
    assert.ok(minimalPreset.description.includes('KB'), 'Should show bundle size');
    assert.ok(minimalPreset.description.includes('saves') || minimalPreset.description.includes('adds') || minimalPreset.description.includes('same'), 'Should show savings comparison');
    
    const enterprisePreset = quickPickItems.find(item => item.preset?.id === 'enterprise');
    assert.ok(enterprisePreset, 'Should include enterprise preset');
    assert.ok(enterprisePreset.detail.includes('Team lead') || enterprisePreset.detail.includes('Analytics') || enterprisePreset.detail.includes('API'), 'Enterprise preset should mention target scenario');
    
    const webPreset = quickPickItems.find(item => item.preset?.id === 'web');
    if (webPreset) {
        // web preset might not exist, that's ok
        assert.ok(webPreset.detail, 'Web preset should have detail if it exists');
    }
    
    // Verify QuickPick options
    assert.strictEqual(quickPickOptions.placeHolder, 'Select a preset configuration', 'Should have descriptive placeholder');
    assert.strictEqual(quickPickOptions.ignoreFocusOut, true, 'Should ignore focus out');
    assert.strictEqual(quickPickOptions.matchOnDescription, true, 'Should enable description matching');
    assert.strictEqual(quickPickOptions.matchOnDetail, true, 'Should enable detail matching');
    
    // Verify confirmation flow
    assert.ok(informationShown, 'Should show confirmation dialog');
    // Don't check specific preset name since it could be any preset

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ showAllPresets UI test passed');
}

/**
 * Test showChunkStatus QuickPick rendering and chunk descriptions
 */
async function testShowChunkStatus() {
    console.log('Testing showChunkStatus QuickPick rendering...');
    resetExplorerConfig();
    const context = createExtensionContext();
    
    // Register runtime commands to get access to showChunkStatusQuickPick
    const { runtimeManager } = await registerRuntimeCommands(context);
    
    const { vscode, configValues } = mockInstall;
    
    // Configure some chunks enabled/disabled for variety
    configValues['explorerDates.enableOnboardingSystem'] = true;
    configValues['explorerDates.enableAnalysisCommands'] = false;
    configValues['explorerDates.enableExportReporting'] = true;
    configValues['explorerDates.enableExtensionApi'] = false;
    configValues['explorerDates.enableWorkspaceTemplates'] = true;
    configValues['explorerDates.enableAdvancedCache'] = true;
    configValues['explorerDates.enableWorkspaceIntelligence'] = false;
    configValues['explorerDates.enableIncrementalWorkers'] = true;
    
    let quickPickItems = null;
    let quickPickOptions = null;
    
    vscode.window.showQuickPick = async (items, options) => {
        quickPickItems = items;
        quickPickOptions = options;
        return null; // User cancels - we just want to verify rendering
    };

    // Execute the chunk status command
    await vscode.commands.executeCommand('explorerDates.showChunkStatus');

    // Verify QuickPick structure
    assert.ok(quickPickItems, 'QuickPick items should be populated');
    assert.ok(quickPickItems.length > 8, 'Should show bundle summary + all chunks'); // 1 summary + 8 chunks
    
    // Check bundle summary item (first item)
    const summaryItem = quickPickItems[0];
    assert.ok(summaryItem.label.includes('Bundle Summary'), 'First item should be bundle summary');
    assert.ok(summaryItem.description.includes('Total:'), 'Summary should show total size');
    assert.ok(summaryItem.detail.includes('Base bundle:'), 'Summary should break down base vs chunks');
    
    // Verify chunk items have proper structure
    const chunkItems = quickPickItems.slice(1); // Skip summary
    const expectedChunks = [
        'enableOnboardingSystem',
        'enableAnalysisCommands', 
        'enableExportReporting',
        'enableExtensionApi',
        'enableWorkspaceTemplates',
        'enableAdvancedCache',
        'enableWorkspaceIntelligence',
        'enableIncrementalWorkers'
    ];
    
    for (const chunkKey of expectedChunks) {
        const isEnabled = configValues[`explorerDates.${chunkKey}`];
        const expectedIcon = isEnabled ? '✅' : '❌';
        const expectedStatus = isEnabled ? 'Enabled' : 'Disabled';
        
        const chunkItem = chunkItems.find(item => 
            item.label.includes(expectedIcon) && item.description.includes(expectedStatus)
        );
        assert.ok(chunkItem, `Should show ${chunkKey} with correct status`);
        assert.ok(chunkItem.description.includes('KB'), 'Should show chunk size');
        assert.ok(chunkItem.detail, 'Should have description of chunk functionality');
    }
    
    // Verify specific chunk descriptions are meaningful
    const onboardingItem = chunkItems.find(item => item.label.includes('Onboarding System'));
    assert.ok(onboardingItem?.detail?.includes('Welcome'), 'Onboarding description should mention welcome messages');
    
    const analysisItem = chunkItems.find(item => item.label.includes('Analysis Commands'));
    assert.ok(analysisItem?.detail?.includes('analysis'), 'Analysis description should mention analysis functionality');
    
    const reportingItem = chunkItems.find(item => item.label.includes('Export Reporting'));
    assert.ok(reportingItem?.detail?.includes('CSV') || reportingItem?.detail?.includes('export'), 'Reporting description should mention export functionality');
    
    // Verify QuickPick options
    assert.strictEqual(quickPickOptions.placeHolder, 'Current chunk status', 'Should have descriptive placeholder');
    assert.strictEqual(quickPickOptions.ignoreFocusOut, true, 'Should ignore focus out');

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ showChunkStatus UI test passed');
}

/**
 * Test command registration and error handling for preset UI flows
 */
async function testCommandIntegration() {
    console.log('Testing command integration and error handling...');
    resetExplorerConfig();
    const context = createExtensionContext();
    
    const { vscode } = mockInstall;
    let errorShown = false;
    
    vscode.window.showErrorMessage = async (message) => {
        errorShown = true;
        return message;
    };
    
    // Register commands
    await registerRuntimeCommands(context);
    
    // Verify commands are registered
    const registeredCommands = context.subscriptions.filter(sub => 
        typeof sub === 'object' && 
        sub.dispose && 
        typeof sub.dispose === 'function'
    );
    assert.ok(registeredCommands.length >= 6, 'Should register runtime management commands');
    
    // Test applyPreset command (triggers showAllPresets)
    vscode.window.showQuickPick = async () => null; // User cancels
    
    try {
        await vscode.commands.executeCommand('explorerDates.applyPreset');
        // Should not throw - cancellation should be handled gracefully
    } catch (error) {
        assert.fail(`applyPreset command should handle cancellation gracefully: ${error.message}`);
    }
    
    // Test configureRuntime command (triggers showPresetComparison) 
    try {
        await vscode.commands.executeCommand('explorerDates.configureRuntime');
        // Should not throw
    } catch (error) {
        assert.fail(`configureRuntime command should handle cancellation gracefully: ${error.message}`);
    }
    
    // Test optimizeBundle command
    try {
        await vscode.commands.executeCommand('explorerDates.optimizeBundle');
        // Should not throw
    } catch (error) {
        assert.fail(`optimizeBundle command should handle cancellation gracefully: ${error.message}`);
    }
    
    // Test showChunkStatus command
    try {
        await vscode.commands.executeCommand('explorerDates.showChunkStatus');
        // Should not throw
    } catch (error) {
        assert.fail(`showChunkStatus command should handle cancellation gracefully: ${error.message}`);
    }

    await disposeContext(context);
    console.log('✅ Command integration test passed');
}

/**
 * Test edge cases and error scenarios in preset UI flows
 */
async function testPresetUIEdgeCases() {
    console.log('Testing preset UI edge cases...');
    resetExplorerConfig();
    const context = createExtensionContext();
    const runtimeManager = new RuntimeConfigManager(context);
    
    const { vscode, configValues } = mockInstall;
    
    // Test showPresetComparison with null recommended preset
    let quickPickItems = null;
    vscode.window.showQuickPick = async (items) => {
        quickPickItems = items;
        return null;
    };
    
    const currentSettings = runtimeManager._extractSettings(vscode.workspace.getConfiguration('explorerDates'));
    
    await runtimeManager.showPresetComparison(currentSettings, null);
    
    // Should still show current and browse options, but no recommended
    assert.strictEqual(quickPickItems.length, 2, 'Should show current and browse when no recommendation');
    assert.ok(quickPickItems.find(item => item.action === 'current'), 'Should include current option');
    assert.ok(quickPickItems.find(item => item.action === 'browse'), 'Should include browse option');
    assert.ok(!quickPickItems.find(item => item.action === 'apply'), 'Should not include apply option when no recommendation');
    
    // Test showAllPresets with user cancellation
    let confirmationShown = false;
    vscode.window.showQuickPick = async (items) => {
        return null; // User cancels preset selection
    };
    vscode.window.showInformationMessage = async () => {
        confirmationShown = true;
        return 'Cancel';
    };
    
    await runtimeManager.showAllPresets();
    assert.ok(!confirmationShown, 'Should not show confirmation when user cancels preset selection');
    
    // Test preset application cancellation
    vscode.window.showQuickPick = async (items) => {
        return items[0]; // Select first preset
    };
    vscode.window.showInformationMessage = async () => {
        confirmationShown = true;
        return 'Cancel'; // User cancels confirmation
    };
    
    // Reset config values to track changes
    const originalValues = { ...configValues };
    
    await runtimeManager.showAllPresets();
    assert.ok(confirmationShown, 'Should show confirmation dialog');
    
    // Verify no config changes were made after cancellation
    for (const [key, value] of Object.entries(originalValues)) {
        assert.strictEqual(configValues[key], value, `Config ${key} should not change after cancellation`);
    }

    await disposeContext(context);
    runtimeManager._configWatcher?.dispose?.();
    console.log('✅ Preset UI edge cases test passed');
}

/**
 * Test chunk descriptions and bundle size calculations
 */
async function testChunkDescriptions() {
    console.log('Testing chunk descriptions and calculations...');
    
    // Import the module to access the getChunkDescription function
    const runtimeCommandsPath = require.resolve('../src/commands/runtimeCommands.js');
    delete require.cache[runtimeCommandsPath];
    const runtimeCommands = require('../src/commands/runtimeCommands.js');
    
    // Access internal function through evaluation (since it's not exported)
    const moduleCode = require('fs').readFileSync(runtimeCommandsPath, 'utf8');
    const getChunkDescriptionMatch = moduleCode.match(/function getChunkDescription\(chunkKey\) \{[\s\S]*?\n\}/);
    
    if (!getChunkDescriptionMatch) {
        throw new Error('Could not find getChunkDescription function in runtimeCommands.js');
    }
    
    // Evaluate the function in context
    const getChunkDescription = eval(`(${getChunkDescriptionMatch[0]})`);
    
    // Test all expected chunk keys have descriptions
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
    
    for (const chunkKey of chunkKeys) {
        const description = getChunkDescription(chunkKey);
        assert.ok(description, `Should have description for ${chunkKey}`);
        assert.ok(description.length > 10, `Description for ${chunkKey} should be meaningful`);
        assert.ok(!description.includes('undefined'), `Description for ${chunkKey} should not contain undefined`);
    }
    
    // Test fallback description for unknown chunks
    const fallbackDesc = getChunkDescription('unknownChunkKey');
    assert.strictEqual(fallbackDesc, 'Explorer Dates feature chunk', 'Should provide fallback description');
    
    console.log('✅ Chunk descriptions test passed');
}

async function main() {
    try {
        await testShowPresetComparison();
        await testPresetComparisonBrowseFlow();
        await testShowAllPresets();
        await testShowChunkStatus();
        await testCommandIntegration();
        await testPresetUIEdgeCases();
        await testChunkDescriptions();
        console.log('🎯 All preset UI flow tests completed successfully');
    } catch (error) {
        console.error('❌ Preset UI flow tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main();
