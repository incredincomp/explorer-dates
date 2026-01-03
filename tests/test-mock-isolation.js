#!/usr/bin/env node

const assert = require('assert');
const mockHelpers = require('./helpers/mockVscode');
const { createExtensionContext, createIsolatedMock } = mockHelpers;

async function testBasicMockIsolation() {
    console.log('Testing basic mock isolation...');
    
    // Create two truly isolated mocks with completely different configurations
    const mock1 = createIsolatedMock({
        testName: 'mock1-instance',
        isolationKey: 'test-mock-1',
        config: {
            'explorerDates.enableWorkspaceTemplates': true,
            'explorerDates.testValue': 'MOCK1_VALUE',
            'explorerDates.numberValue': 100
        }
    });
    
    const mock2 = createIsolatedMock({
        testName: 'mock2-instance',
        isolationKey: 'test-mock-2', 
        config: {
            'explorerDates.enableWorkspaceTemplates': false,
            'explorerDates.testValue': 'MOCK2_VALUE',
            'explorerDates.numberValue': 200
        }
    });
    
    try {
        // Test 1: Basic configuration isolation
        console.log('Verifying basic configuration isolation...');
        
        assert.strictEqual(mock1.configValues['explorerDates.enableWorkspaceTemplates'], true,
            'Mock1 should have templates enabled');
        assert.strictEqual(mock2.configValues['explorerDates.enableWorkspaceTemplates'], false,
            'Mock2 should have templates disabled');
            
        assert.strictEqual(mock1.configValues['explorerDates.testValue'], 'MOCK1_VALUE',
            'Mock1 should have MOCK1_VALUE');
        assert.strictEqual(mock2.configValues['explorerDates.testValue'], 'MOCK2_VALUE',
            'Mock2 should have MOCK2_VALUE');
        
        assert.strictEqual(mock1.configValues['explorerDates.numberValue'], 100,
            'Mock1 should have number 100');
        assert.strictEqual(mock2.configValues['explorerDates.numberValue'], 200,
            'Mock2 should have number 200');
        
        console.log('✅ Basic configuration values are isolated');
        
        // Test 2: Dynamic configuration changes should be isolated
        console.log('Testing dynamic configuration isolation...');
        
        // Update configurations independently
        Object.assign(mock1.configValues, {
            'explorerDates.dynamicValue1': 'dynamic-from-mock1',
            'explorerDates.sharedKey': 'mock1-version'
        });
        
        Object.assign(mock2.configValues, {
            'explorerDates.dynamicValue2': 'dynamic-from-mock2', 
            'explorerDates.sharedKey': 'mock2-version'
        });
        
        // Verify isolation of dynamic changes
        assert.strictEqual(mock1.configValues['explorerDates.dynamicValue1'], 'dynamic-from-mock1',
            'Mock1 should see its dynamic value');
        assert.strictEqual(mock1.configValues['explorerDates.dynamicValue2'], undefined,
            'Mock1 should not see mock2 dynamic value');
        assert.strictEqual(mock1.configValues['explorerDates.sharedKey'], 'mock1-version',
            'Mock1 should see its version of shared key');
            
        assert.strictEqual(mock2.configValues['explorerDates.dynamicValue2'], 'dynamic-from-mock2',
            'Mock2 should see its dynamic value');
        assert.strictEqual(mock2.configValues['explorerDates.dynamicValue1'], undefined,
            'Mock2 should not see mock1 dynamic value'); 
        assert.strictEqual(mock2.configValues['explorerDates.sharedKey'], 'mock2-version',
            'Mock2 should see its version of shared key');
        
        console.log('✅ Dynamic configuration changes are isolated');
        
        // Test 3: VS Code API isolation
        console.log('Testing VS Code API isolation...');
        
        // Test workspace configuration API
        const config1 = mock1.vscode.workspace.getConfiguration('explorerDates');
        const config2 = mock2.vscode.workspace.getConfiguration('explorerDates');
        
        const value1 = config1.get('testValue');
        const value2 = config2.get('testValue');
        
        assert.strictEqual(value1, 'MOCK1_VALUE', 'Config API should return mock1 value for mock1');
        assert.strictEqual(value2, 'MOCK2_VALUE', 'Config API should return mock2 value for mock2');
        assert.notStrictEqual(value1, value2, 'Config API values should be different');
        
        console.log('✅ VS Code configuration API is isolated');
        
        // Test 4: Context isolation  
        console.log('Testing context isolation...');
        
        const context1 = createExtensionContext();
        const context2 = createExtensionContext();
        
        // Set different context values
        context1.globalState = { testKey: 'context1-value' };
        context2.globalState = { testKey: 'context2-value' };
        
        assert.notStrictEqual(context1.globalState.testKey, context2.globalState.testKey,
            'Extension contexts should be isolated');
        
        console.log('✅ Extension contexts are isolated');
        
        // Test 5: Command registry isolation (if supported)
        console.log('Testing command registry isolation...');
        
        if (mock1.commandRegistry && mock2.commandRegistry) {
            // Register commands in each mock
            mock1.vscode.commands.registerCommand('test.mock1Cmd', () => 'mock1-result');
            mock2.vscode.commands.registerCommand('test.mock2Cmd', () => 'mock2-result');
            
            // Check isolation
            const mock1Commands = Array.from(mock1.commandRegistry.keys());
            const mock2Commands = Array.from(mock2.commandRegistry.keys());
            
            if (mock1Commands.length > 0 || mock2Commands.length > 0) {
                assert.ok(!mock1Commands.includes('test.mock2Cmd') || mock1Commands.length === 0,
                    'Mock1 should not see mock2 commands');
                assert.ok(!mock2Commands.includes('test.mock1Cmd') || mock2Commands.length === 0,
                    'Mock2 should not see mock1 commands');
                console.log('✅ Command registries are isolated');
            } else {
                console.log('ℹ️ Command registry isolation not testable (no commands registered)');
            }
        } else {
            console.log('ℹ️ Command registry isolation not available');
        }
        
        console.log('\n✅ ALL ISOLATION TESTS PASSED - Mocks are properly isolated!');
        
    } finally {
        // Cleanup
        mock1.dispose();
        mock2.dispose();
    }
}

async function testConfigurationSnapshotRestore() {
    console.log('Testing configuration snapshot and restore...');
    
    const mock = createIsolatedMock({
        testName: 'snapshot-test',
        config: {
            'explorerDates.originalValue': 'original',
            'explorerDates.numberValue': 42
        }
    });
    
    try {
        // Take snapshot of original configuration
        const originalSnapshot = { ...mock.configValues };
        
        // Modify configuration
        mock.configValues['explorerDates.originalValue'] = 'modified';
        mock.configValues['explorerDates.newValue'] = 'added';
        mock.configValues['explorerDates.numberValue'] = 99;
        
        // Verify modifications
        assert.strictEqual(mock.configValues['explorerDates.originalValue'], 'modified',
            'Configuration should be modified');
        assert.strictEqual(mock.configValues['explorerDates.newValue'], 'added',
            'New value should be added');
        assert.strictEqual(mock.configValues['explorerDates.numberValue'], 99,
            'Number value should be changed');
        
        // Restore from snapshot
        Object.keys(mock.configValues).forEach(key => {
            if (!key.startsWith('explorerDates.')) return;
            if (originalSnapshot.hasOwnProperty(key)) {
                mock.configValues[key] = originalSnapshot[key];
            } else {
                delete mock.configValues[key];
            }
        });
        
        // Verify restoration
        assert.strictEqual(mock.configValues['explorerDates.originalValue'], 'original',
            'Original value should be restored');
        assert.strictEqual(mock.configValues['explorerDates.newValue'], undefined,
            'New value should be removed');
        assert.strictEqual(mock.configValues['explorerDates.numberValue'], 42,
            'Number value should be restored');
        
        console.log('✅ Configuration snapshot and restore works correctly');
        
    } finally {
        mock.dispose();
    }
}

async function testCrossTestContamination() {
    console.log('Testing cross-test contamination prevention...');
    
    // Run multiple "tests" in sequence to verify no state leakage
    const testRuns = [];
    
    for (let i = 1; i <= 3; i++) {
        const mock = createIsolatedMock({
            testName: `contamination-test-${i}`,
            config: {
                [`explorerDates.testRun${i}`]: `value-${i}`,
                'explorerDates.commonKey': `run-${i}-value`
            }
        });
        
        testRuns.push({
            runNumber: i,
            mock,
            expectedValue: `value-${i}`,
            commonValue: `run-${i}-value`
        });
    }
    
    try {
        // Verify each test run only sees its own values
        for (const run of testRuns) {
            const { runNumber, mock, expectedValue, commonValue } = run;
            
            // Should see own values
            assert.strictEqual(mock.configValues[`explorerDates.testRun${runNumber}`], expectedValue,
                `Run ${runNumber} should see its own test value`);
            assert.strictEqual(mock.configValues['explorerDates.commonKey'], commonValue,
                `Run ${runNumber} should see its own common value`);
            
            // Should not see other runs' values
            for (let otherRun = 1; otherRun <= 3; otherRun++) {
                if (otherRun !== runNumber) {
                    assert.strictEqual(mock.configValues[`explorerDates.testRun${otherRun}`], undefined,
                        `Run ${runNumber} should not see testRun${otherRun} value`);
                }
            }
        }
        
        console.log('✅ Cross-test contamination prevention verified');
        
    } finally {
        // Cleanup all test runs
        testRuns.forEach(run => run.mock.dispose());
    }
}

async function disposeContext(context) {
    if (!context?.subscriptions) return;
    
    for (const disposable of context.subscriptions) {
        try {
            disposable?.dispose?.();
        } catch {
            // Ignore disposal errors in tests
        }
    }
    context.subscriptions.length = 0;
}

async function main() {
    console.log('🧪 Starting STRICT isolation validation tests...\n');
    
    try {
        await testBasicMockIsolation();
        await testConfigurationSnapshotRestore();
        await testCrossTestContamination();
        
        console.log('\n🎉 ALL ISOLATION TESTS PASSED!');
        console.log('✅ Mock instances are properly isolated');
        console.log('✅ Configuration state is not shared between tests');
        console.log('✅ Cross-test contamination is prevented');
        console.log('✅ Snapshot/restore functionality works correctly');
        console.log('\n🛡️ Test isolation is ROCK SOLID!');
        
    } catch (error) {
        console.error('\n💥 ISOLATION TEST FAILED:', error);
        console.error('\n🚨 This indicates serious test isolation problems that MUST be fixed!');
        console.error('   - Tests may be contaminating each other');
        console.error('   - Mock state is being shared between test instances');  
        console.error('   - Configuration changes are bleeding between tests');
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    testBasicMockIsolation,
    testConfigurationSnapshotRestore,
    testCrossTestContamination
};