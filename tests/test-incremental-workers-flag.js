#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createMockVscode, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');

/**
 * Tests for incremental workers feature flag functionality
 * Verifies that:
 * 1. toggleIncrementalWorkers setting prevents/permits chunk loading
 * 2. Presets correctly apply incremental workers settings
 * 3. Runtime behavior respects the feature flag
 * 4. Commands handle disabled state appropriately
 */

let mockInstall;
let extension;

function createCleanMock(overrides = {}) {
    if (mockInstall) {
        mockInstall.dispose();
    }
    mockInstall = createMockVscode({
        config: {
            'explorerDates.enableIncrementalWorkers': true,
            ...overrides
        }
    });
    // Import extension after mock setup to ensure proper module resolution
    extension = require('../extension');
    return mockInstall;
}

async function disposeContext(context) {
    for (const disposable of context.subscriptions) {
        if (disposable && typeof disposable.dispose === 'function') {
            try {
                disposable.dispose();
            } catch {
                // Ignore dispose errors in tests
            }
        }
    }
    context.subscriptions.length = 0;
}

async function runTestScenario(name, configOverrides, testFn) {
    createCleanMock(configOverrides);
    const { configValues } = mockInstall;
    
    // Apply any additional config overrides
    Object.assign(configValues, configOverrides);
    
    mockInstall.resetLogs();
    const context = createExtensionContext();
    let activated = false;
    
    try {
        await extension.activate(context);
        activated = true;
        await testFn(context);
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}:`, error.message);
        throw error;
    } finally {
        if (activated) {
            try {
                await extension.deactivate();
            } catch (error) {
                console.warn('⚠️ Deactivate failed:', error.message);
            }
        }
        await disposeContext(context);
    }
}

/**
 * Test that incremental workers feature flag prevents chunk loading
 */
async function testIncrementalWorkersDisabled() {
    // Set up console capture before extension activation
    const originalConsoleLog = console.log;
    const consoleMessages = [];
    console.log = (...args) => {
        // Properly serialize console arguments, including objects
        const serializedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg);
            }
            return String(arg);
        });
        consoleMessages.push(serializedArgs.join(' '));
        originalConsoleLog(...args);
    };
    
    try {
        await runTestScenario('Incremental workers disabled - chunk not loaded', {
            'explorerDates.enableIncrementalWorkers': false,
            'explorerDates.consoleLogLevel': 'info'
        }, async (context) => {
            const featureFlags = require('../src/featureFlags');
            
            // Check that the feature flag logic was applied
            const isEnabled = featureFlags.isEnabled('incrementalWorkers');
            assert.strictEqual(isEnabled, false, 'Feature flag should report incremental workers as disabled');
            
            // Try to load the chunk and verify it returns null
            const chunk = await featureFlags.incrementalWorkers();
            assert.strictEqual(chunk, null, 'Incremental workers chunk should return null when disabled');
            
            // Verify that the disabled message was logged to console
            const disabledMessage = consoleMessages.find(msg => 
                msg.includes('Feature disabled via configuration') && 
                msg.includes('"feature":"incrementalWorkers"') && 
                msg.includes('"savedKB":19')
            );
            assert(disabledMessage, 'Should log bundle size savings message when incremental workers disabled');
        });
    } finally {
        console.log = originalConsoleLog;
    }
}

/**
 * Test that incremental workers feature flag permits chunk loading
 */
async function testIncrementalWorkersEnabled() {
    await runTestScenario('Incremental workers enabled - chunk loads successfully', {
        'explorerDates.enableIncrementalWorkers': true
    }, async (context) => {
        const featureFlags = require('../src/featureFlags');
        
        // Check that the feature flag logic recognizes it as enabled
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, true, 'Feature flag should report incremental workers as enabled');
        
        // Capture console output to verify no disabled message
        const originalConsoleLog = console.log;
        const consoleMessages = [];
        console.log = (...args) => {
            consoleMessages.push(args.join(' '));
            originalConsoleLog(...args);
        };
        
        try {
            // Try to load the chunk and verify it loads successfully
            const chunk = await featureFlags.incrementalWorkers();
            assert(chunk !== null, 'Incremental workers chunk should load when enabled');
            assert(typeof chunk === 'object', 'Loaded chunk should be an object');
            
            // Verify that IncrementalWorkersManager is available
            assert(chunk.IncrementalWorkersManager, 'Chunk should export IncrementalWorkersManager');
            
            // Verify no disabled message was logged
            const disabledMessage = consoleMessages.find(msg => 
                msg.includes('Incremental Workers disabled')
            );
            assert(!disabledMessage, 'Should not log disabled message when incremental workers enabled');
        } finally {
            console.log = originalConsoleLog;
        }
    });
}

/**
 * Test that web-development preset correctly enables incremental workers
 */
async function testWebDevelopmentPresetEnablesWorkers() {
    await runTestScenario('Web development preset enables incremental workers', {
        'explorerDates.enableIncrementalWorkers': false // Start with disabled
    }, async (context) => {
        const { configValues } = mockInstall;
        const presetDefinitions = require('../src/presetDefinitions');
        
        // Get the web-development preset configuration
        const webDevPreset = presetDefinitions.PRESET_DEFINITIONS['web-development'];
        assert(webDevPreset, 'web-development preset should exist');
        
        // Verify the preset enables incremental workers
        const workersSetting = webDevPreset.settings['explorerDates.enableIncrementalWorkers'];
        assert.strictEqual(workersSetting, true, 'Web development preset should enable incremental workers');
        
        // Apply the preset settings to workspace scope (where feature flags are stored)
        const { workspaceConfigValues } = mockInstall;
        Object.assign(workspaceConfigValues, webDevPreset.settings);
        
        // Verify feature flag recognizes the change
        const featureFlags = require('../src/featureFlags');
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, true, 'Feature should be enabled after applying web-development preset');
        
        // Verify chunk can now load
        const chunk = await featureFlags.incrementalWorkers();
        assert(chunk !== null, 'Incremental workers chunk should load with web-development preset');
    });
}

/**
 * Test that minimal preset correctly disables incremental workers
 */
async function testMinimalPresetDisablesWorkers() {
    await runTestScenario('Minimal preset disables incremental workers', {
        'explorerDates.enableIncrementalWorkers': true // Start with enabled
    }, async (context) => {
        const { configValues } = mockInstall;
        const presetDefinitions = require('../src/presetDefinitions');
        
        // Get the minimal preset configuration
        const minimalPreset = presetDefinitions.PRESET_DEFINITIONS['minimal'];
        assert(minimalPreset, 'minimal preset should exist');
        
        // Verify the preset disables incremental workers
        const workersSetting = minimalPreset.settings['explorerDates.enableIncrementalWorkers'];
        assert.strictEqual(workersSetting, false, 'Minimal preset should disable incremental workers');
        
        // Apply the preset settings to workspace scope (where feature flags are stored)
        const { workspaceConfigValues } = mockInstall;
        Object.assign(workspaceConfigValues, minimalPreset.settings);
        
        // Verify feature flag recognizes the change
        const featureFlags = require('../src/featureFlags');
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, false, 'Feature should be disabled after applying minimal preset');
        
        // Verify chunk loading is now blocked
        const chunk = await featureFlags.incrementalWorkers();
        assert.strictEqual(chunk, null, 'Incremental workers chunk should not load with minimal preset');
    });
}

/**
 * Test that enterprise preset correctly enables incremental workers
 */
async function testEnterprisePresetEnablesWorkers() {
    await runTestScenario('Enterprise preset enables incremental workers', {
        'explorerDates.enableIncrementalWorkers': false // Start with disabled
    }, async (context) => {
        const { configValues } = mockInstall;
        const presetDefinitions = require('../src/presetDefinitions');
        
        // Get the enterprise preset configuration
        const enterprisePreset = presetDefinitions.PRESET_DEFINITIONS['enterprise'];
        assert(enterprisePreset, 'enterprise preset should exist');
        
        // Verify the preset enables incremental workers
        const workersSetting = enterprisePreset.settings['explorerDates.enableIncrementalWorkers'];
        assert.strictEqual(workersSetting, true, 'Enterprise preset should enable incremental workers');
        
        // Apply the preset settings to workspace scope (where feature flags are stored)
        const { workspaceConfigValues } = mockInstall;
        Object.assign(workspaceConfigValues, enterprisePreset.settings);
        
        // Verify feature flag recognizes the change
        const featureFlags = require('../src/featureFlags');
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, true, 'Feature should be enabled after applying enterprise preset');
        
        // Verify chunk can now load
        const chunk = await featureFlags.incrementalWorkers();
        assert(chunk !== null, 'Incremental workers chunk should load with enterprise preset');
    });
}

/**
 * Test that balanced preset correctly disables incremental workers
 */
async function testBalancedPresetDisablesWorkers() {
    await runTestScenario('Balanced preset disables incremental workers', {
        'explorerDates.enableIncrementalWorkers': true // Start with enabled
    }, async (context) => {
        const { configValues } = mockInstall;
        const presetDefinitions = require('../src/presetDefinitions');
        
        // Get the balanced preset configuration
        const balancedPreset = presetDefinitions.PRESET_DEFINITIONS['balanced'];
        assert(balancedPreset, 'balanced preset should exist');
        
        // Verify the preset disables incremental workers
        const workersSetting = balancedPreset.settings['explorerDates.enableIncrementalWorkers'];
        assert.strictEqual(workersSetting, false, 'Balanced preset should disable incremental workers');
        
        // Apply the preset settings to workspace scope (where feature flags are stored)
        const { workspaceConfigValues } = mockInstall;
        Object.assign(workspaceConfigValues, balancedPreset.settings);
        
        // Verify feature flag recognizes the change
        const featureFlags = require('../src/featureFlags');
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, false, 'Feature should be disabled after applying balanced preset');
        
        // Verify chunk loading is now blocked
        const chunk = await featureFlags.incrementalWorkers();
        assert.strictEqual(chunk, null, 'Incremental workers chunk should not load with balanced preset');
    });
}

/**
 * Test that data-science preset correctly disables incremental workers
 */
async function testDataSciencePresetDisablesWorkers() {
    await runTestScenario('Data science preset disables incremental workers', {
        'explorerDates.enableIncrementalWorkers': true // Start with enabled
    }, async (context) => {
        const { configValues } = mockInstall;
        const presetDefinitions = require('../src/presetDefinitions');
        
        // Get the data-science preset configuration
        const dataSciencePreset = presetDefinitions.PRESET_DEFINITIONS['data-science'];
        assert(dataSciencePreset, 'data-science preset should exist');
        
        // Verify the preset disables incremental workers
        const workersSetting = dataSciencePreset.settings['explorerDates.enableIncrementalWorkers'];
        assert.strictEqual(workersSetting, false, 'Data science preset should disable incremental workers');
        
        // Apply the preset settings to workspace scope (where feature flags are stored)
        const { workspaceConfigValues } = mockInstall;
        Object.assign(workspaceConfigValues, dataSciencePreset.settings);
        
        // Verify feature flag recognizes the change
        const featureFlags = require('../src/featureFlags');
        const isEnabled = featureFlags.isEnabled('incrementalWorkers');
        assert.strictEqual(isEnabled, false, 'Feature should be disabled after applying data-science preset');
        
        // Verify chunk loading is now blocked
        const chunk = await featureFlags.incrementalWorkers();
        assert.strictEqual(chunk, null, 'Incremental workers chunk should not load with data-science preset');
    });
}

/**
 * Test feature flag state consistency
 */
async function testFeatureFlagStateConsistency() {
    await runTestScenario('Feature flag state consistency', {
        'explorerDates.enableIncrementalWorkers': false
    }, async (context) => {
        const featureFlags = require('../src/featureFlags');
        
        // Test getEnabledFeatures list
        const enabledFeatures = featureFlags.getEnabledFeatures();
        const hasIncrementalWorkers = enabledFeatures.includes('incrementalWorkers');
        assert.strictEqual(hasIncrementalWorkers, false, 'getEnabledFeatures should not include incremental workers when disabled');
        
        // Test isEnabled method
        assert.strictEqual(featureFlags.isEnabled('incrementalWorkers'), false, 'isEnabled should return false');
        
        // Test chunk loading returns null
        const chunk = await featureFlags.incrementalWorkers();
        assert.strictEqual(chunk, null, 'Chunk loading should return null when disabled');
        
        // Now enable it and retest
        const { workspaceConfigValues } = mockInstall;
        workspaceConfigValues['explorerDates.enableIncrementalWorkers'] = true;
        
        // Test getEnabledFeatures list again
        const newEnabledFeatures = featureFlags.getEnabledFeatures();
        const newHasIncrementalWorkers = newEnabledFeatures.includes('incrementalWorkers');
        assert.strictEqual(newHasIncrementalWorkers, true, 'getEnabledFeatures should include incremental workers when enabled');
        
        // Test isEnabled method again
        assert.strictEqual(featureFlags.isEnabled('incrementalWorkers'), true, 'isEnabled should return true');
        
        // Test chunk loading works
        const newChunk = await featureFlags.incrementalWorkers();
        assert(newChunk !== null, 'Chunk loading should succeed when enabled');
    });
}

/**
 * Test chunk loading with missing module graceful handling
 */
async function testMissingChunkGracefulHandling() {
    await runTestScenario('Graceful handling of missing chunk modules', {
        'explorerDates.enableIncrementalWorkers': true
    }, async (context) => {
        const featureFlags = require('../src/featureFlags');
        
        // Temporarily replace the loader to simulate missing module
        const originalLoader = featureFlags.featureLoaders?.get('incrementalWorkers');
        if (featureFlags.registerFeatureLoader) {
            featureFlags.registerFeatureLoader('incrementalWorkers', () => {
                throw new Error('Module not found');
            });
        }
        
        let chunkResult = null;
        let errorCaught = null;
        
        try {
            chunkResult = await featureFlags.incrementalWorkers();
        } catch (error) {
            errorCaught = error;
        } finally {
            // Restore original loader if possible
            if (originalLoader && featureFlags.registerFeatureLoader) {
                featureFlags.registerFeatureLoader('incrementalWorkers', originalLoader);
            }
        }
        
        // Assert expected graceful fallback behavior - should either return null or throw specific error
        assert.ok(
            chunkResult === null || errorCaught !== null,
            'Missing chunk should either return null or throw an error for graceful handling'
        );
        
        if (errorCaught) {
            assert.ok(
                errorCaught.message.includes('Module not found') || errorCaught.message.includes('not found'),
                `Error should indicate module not found, got: ${errorCaught.message}`
            );
            console.log('✅ Missing chunk handled with controlled error:', errorCaught.message);
        }
        
        if (chunkResult === null) {
            console.log('✅ Missing chunk handled with null return (graceful fallback)');
        }
        
        console.log('Missing chunk result:', chunkResult, 'Error:', errorCaught?.message);
        
        // Verify system remains stable after missing chunk attempt
        assert.ok(typeof featureFlags.incrementalWorkers === 'function', 'Feature flag function should remain callable');
    });
}

async function main() {
    console.log('🧪 Testing incremental workers feature flag functionality...\n');
    
    try {
        await testIncrementalWorkersDisabled();
        await testIncrementalWorkersEnabled();
        await testWebDevelopmentPresetEnablesWorkers();
        await testMinimalPresetDisablesWorkers();
        await testEnterprisePresetEnablesWorkers();
        await testBalancedPresetDisablesWorkers();
        await testDataSciencePresetDisablesWorkers();
        await testFeatureFlagStateConsistency();
        await testMissingChunkGracefulHandling();
        
        console.log('\n✅ All incremental workers feature flag tests passed!');
    } catch (error) {
        console.error('\n❌ Incremental workers feature flag tests failed:', error);
        process.exitCode = 1;
    } finally {
        if (mockInstall) {
            mockInstall.dispose();
        }
    }
}

if (require.main === module) {
    main()
        .finally(() => {
            // Ensure lingering VS Code timers/watchers from presets don't keep the process alive.
            const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0;
            setTimeout(() => process.exit(exitCode), 0);
        });
}

module.exports = {
    testIncrementalWorkersDisabled,
    testIncrementalWorkersEnabled,
    testWebDevelopmentPresetEnablesWorkers,
    testMinimalPresetDisablesWorkers,
    testEnterprisePresetEnablesWorkers,
    testBalancedPresetDisablesWorkers,
    testDataSciencePresetDisablesWorkers,
    testFeatureFlagStateConsistency,
    testMissingChunkGracefulHandling
};
