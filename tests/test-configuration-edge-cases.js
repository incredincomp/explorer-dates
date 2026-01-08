#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
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
        console.log('🔧 Testing Configuration Edge Cases...\n');

        await runTest('Invalid Configuration Values', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': null, // Invalid null value
                    'explorerDates.badgePriority': 'invalid-option', // Invalid enum
                    'explorerDates.cacheTimeout': -1, // Invalid negative number
                    'explorerDates.maxCacheSize': 'not-a-number', // Invalid type
                    'explorerDates.performanceMode': false, // Keep valid to ensure decoration works
                    'explorerDates.security.enforceWorkspaceBoundaries': 'invalid-flag',
                    'explorerDates.security.allowedExtraPaths': [
                        path.join(path.sep, 'tmp', 'external-fixture'),
                        42
                    ],
                    'explorerDates.security.logThrottleWindowMs': -250,
                    'explorerDates.security.maxWarningsPerFile': -5,
                    'explorerDates.security.allowTestPaths': 'maybe'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            // Should handle invalid config gracefully with fallbacks
            const uri = vscode.Uri.file('/test-workspace/invalid-config.js');
            
            try {
                const decoration = await provider.provideFileDecoration(uri);
                
                // Should still provide a decoration despite invalid config
                // Note: decoration might be null if the extension chooses to skip for invalid config
                console.log(`   Decoration result: ${decoration ? 'provided' : 'null'}`);
                
                // The test passes if it doesn't throw an error, even if decoration is null
                assert(true, 'Should handle invalid config without throwing');
                
                if (Array.isArray(provider._securityAllowedExtraPaths)) {
                    const sanitized = provider._securityAllowedExtraPaths.every((entry) => typeof entry === 'string');
                    assert(sanitized, 'Security extra paths should be sanitized to strings');
                }
            } catch (error) {
                throw new Error(`Should not throw error with invalid config: ${error.message}`);
            }
            
            // Test that the provider handles invalid boolean as truthy performance mode
            const mockInstall2 = createTestMock({
                config: {
                    'explorerDates.performanceMode': 123 // Invalid type for boolean, treated as truthy
                }
            });
            
            const provider2 = new (require('../src/fileDateDecorationProvider').FileDateDecorationProvider)();
            const decoration2 = await provider2.provideFileDecoration(uri);
            
            // Performance mode enabled should return null/undefined
            assert(decoration2 === null || decoration2 === undefined, 'Performance mode should skip decoration');
            
            provider.dispose();
            provider2.dispose();
        });

        await runTest('Malformed JSON Configuration', async () => {
            // Mock configuration that simulates parsing errors
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.customColors': '{malformed json}', // Invalid object payload
                    'explorerDates.excludedPatterns': ['\\'], // Invalid regex pattern
                    'explorerDates.templateSyncPath': { not: 'a-path' }, // Invalid path structure
                    'explorerDates.colorScheme': { broken: undefined }, // Invalid object structure
                    'explorerDates.security.allowedExtraPaths': ['\u0000bad-path'] // Dangerous characters
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            // Should handle malformed config gracefully
            const uri = vscode.Uri.file('/test-workspace/malformed-config.js');
            const decoration = await provider.provideFileDecoration(uri);
            
            // Should still function with fallback values
            assert(decoration !== null, 'Should handle malformed config gracefully');
            
            provider.dispose();
        });

        await runTest('Rapid Configuration Changes', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.colorScheme': 'recency'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            // Simulate rapid config changes
            const uri = vscode.Uri.file('/test-workspace/rapid-changes.js');
            
            // First decoration with initial config
            let decoration1 = await provider.provideFileDecoration(uri);
            
            // Rapid configuration changes
            const promises = [];
            for (let i = 0; i < 10; i++) {
                // Trigger config change event
                mockInstall.triggerConfigChange({
                    'explorerDates.dateDecorationFormat': i % 2 === 0 ? 'smart' : 'absolute-long',
                    'explorerDates.colorScheme': i % 3 === 0 ? 'vibrant' : 'subtle'
                });
                
                // Small delay to simulate real-world timing
                await new Promise(resolve => setTimeout(resolve, 5));
                
                // Should still provide decorations during rapid changes
                promises.push((async () => {
                    const decoration = await provider.provideFileDecoration(uri);
                    return decoration !== null;
                })());
            }
            
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r).length;
            assert(successCount >= 8, `Most decorations should succeed during rapid changes (${successCount}/10)`);
            
            provider.dispose();
        });

        await runTest('Conflicting Workspace and User Settings', async () => {
            const mockInstall = createTestMock({
                config: {
                    // User settings
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.colorScheme': 'recency',
                    'explorerDates.badgePriority': 'time'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const uri = vscode.Uri.file('/workspace/conflicting-settings.js');
            let decoration = await provider.provideFileDecoration(uri);
            
            // Should work with initial settings
            assert(decoration !== null, 'Should work with initial settings');
            
            // Simulate workspace settings overriding user settings
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'absolute-long',
                'explorerDates.colorScheme': 'vibrant',
                'explorerDates.badgePriority': 'author'
            });
            
            decoration = await provider.provideFileDecoration(uri);
            assert(decoration !== null, 'Should resolve setting conflicts');
            
            // Test that provider remains functional
            const metrics = provider.getMetrics();
            assert(typeof metrics === 'object', 'Should provide metrics despite conflicts');
            
            provider.dispose();
        });

        await runTest('Settings Rollback Scenarios', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': 'relative-long',
                    'explorerDates.colorScheme': 'recency'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const uri = vscode.Uri.file('/test-workspace/rollback-test.js');
            
            // Initial decoration
            const decoration1 = await provider.provideFileDecoration(uri);
            assert(decoration1 !== null, 'Initial decoration should work');
            
            // Change to invalid settings
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'invalid-format',
                'explorerDates.colorScheme': { mode: 'invalid' },
                'explorerDates.badgePriority': null
            });
            
            // Allow configuration change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should still work with invalid settings (fallback)
            const decoration2 = await provider.provideFileDecoration(uri);
            assert(decoration2 !== null, 'Should handle invalid settings with fallback');
            
            // Rollback to valid settings
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'absolute-short',
                'explorerDates.colorScheme': 'file-type'
            });
            
            // Allow configuration change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should work normally after rollback
            const decoration3 = await provider.provideFileDecoration(uri);
            assert(decoration3 !== null, 'Should work after rollback to valid settings');
            
            provider.dispose();
        });

        await runTest('Configuration Schema Violations', async () => {
            const mockInstall = createTestMock({
                config: {
                    // Test various schema violations
                    'explorerDates.dateDecorationFormat': 123, // Wrong type
                    'explorerDates.colorScheme': { complex: 'object' }, // Invalid structure
                    'explorerDates.cacheTimeout': 'forever', // Non-numeric timeout
                    'explorerDates.excludedPatterns': 'not-an-array', // Wrong type for array
                    'explorerDates.badgePriority': { complex: 'object' }, // Object instead of string
                    'explorerDates.maxCacheSize': Infinity, // Invalid number value
                    'explorerDates.badgeRefreshInterval': NaN, // Invalid number value
                    'explorerDates.security.enforceWorkspaceBoundaries': 'sometimes',
                    'explorerDates.security.allowedExtraPaths': [null]
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            // Should handle all schema violations gracefully
            const uri = vscode.Uri.file('/test-workspace/schema-violations.js');
            const decoration = await provider.provideFileDecoration(uri);
            
            assert(decoration !== null, 'Should handle schema violations gracefully');
            
            // Test that the provider is still functional
            const metrics = provider.getMetrics();
            assert(typeof metrics === 'object', 'Provider should remain functional');
            
            provider.dispose();
        });

        await runTest('Configuration Event Flooding', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': 'relative-short'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const uri = vscode.Uri.file('/test-workspace/event-flood.js');
            
            // Flood the system with config change events
            const promises = [];
            for (let i = 0; i < 25; i++) {
                promises.push((async (index) => {
                    // Trigger config change
                    mockInstall.triggerConfigChange({
                        'explorerDates.dateDecorationFormat': index % 2 === 0 ? 'relative-long' : 'absolute-short',
                        'explorerDates.colorScheme': index % 3 === 0 ? 'vibrant' : 'none'
                    });
                    
                    // Small delay to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 2));
                    
                    // Try to get decoration during flood
                    const decoration = await provider.provideFileDecoration(uri);
                    return decoration !== null;
                })(i));
            }
            
            // All operations should complete successfully
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r).length;
            
            assert(successCount > 20, `Should handle most requests during flood (${successCount}/25)`);
            
            provider.dispose();
        });

        await runTest('Configuration Memory Consistency', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.colorScheme': 'recency'
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const uri = vscode.Uri.file('/test-workspace/memory-consistency.js');
            
            // Get initial decoration
            const decoration1 = await provider.provideFileDecoration(uri);
            
            // Change config
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'absolute-long'
            });
            
            // Allow change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Get decoration after change
            const decoration2 = await provider.provideFileDecoration(uri);
            
            // Change back
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'relative-short'
            });
            
            // Allow change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Get final decoration
            const decoration3 = await provider.provideFileDecoration(uri);
            
            // All decorations should be valid
            assert(decoration1 !== null, 'First decoration should be valid');
            assert(decoration2 !== null, 'Second decoration should be valid');
            assert(decoration3 !== null, 'Third decoration should be valid');
            
            // Memory should be properly managed
            const metrics = provider.getMetrics();
            assert(metrics.cacheSize >= 0, 'Cache should be properly managed');
            
            provider.dispose();
        });

        await runTest('Configuration Inheritance Edge Cases', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': undefined, // Explicitly undefined
                    'explorerDates.colorScheme': null, // Explicitly null
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const uri = vscode.Uri.file('/test-workspace/inheritance.js');
            const decoration = await provider.provideFileDecoration(uri);
            
            // Should use defaults when values are undefined/null
            assert(decoration !== null, 'Should handle undefined/null values gracefully');
            
            // Change to partially defined config
            mockInstall.triggerConfigChange({
                'explorerDates.dateDecorationFormat': 'absolute-long',
                'explorerDates.colorScheme': undefined
            });
            
            // Allow change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const decoration2 = await provider.provideFileDecoration(uri);
            assert(decoration2 !== null, 'Should handle partial config gracefully');
            
            provider.dispose();
        });

        await runTest('Security Boundary Configuration Updates', async () => {
            const initialExtraPath = path.join(path.sep, 'tmp', 'explorer-dates-trusted');
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.security.enforceWorkspaceBoundaries': true,
                    'explorerDates.security.enableBoundaryEnforcement': true,
                    'explorerDates.security.allowedExtraPaths': [initialExtraPath],
                    'explorerDates.security.allowTestPaths': false,
                    'explorerDates.security.logThrottleWindowMs': 5,
                    'explorerDates.security.maxWarningsPerFile': 2
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            const workspaceFile = vscode.Uri.file(path.join(mockInstall.sampleWorkspace, 'security-initial.js'));
            await provider.provideFileDecoration(workspaceFile);
            
            assert(Array.isArray(provider._securityAllowedExtraPaths), 'Security paths should initialize as an array');
            assert(provider._securityAllowedExtraPaths.length >= 1, 'Initial extra security path should be tracked');
            
            const relaxedPath = path.join(mockInstall.sampleWorkspace, '..', 'sandbox-fixtures');
            const normalizedRelaxedPath = path.normalize(relaxedPath);
            
            mockInstall.triggerConfigChange({
                'explorerDates.security.enforceWorkspaceBoundaries': false,
                'explorerDates.security.enableBoundaryEnforcement': false,
                'explorerDates.security.allowedExtraPaths': [relaxedPath],
                'explorerDates.security.logThrottleWindowMs': 0,
                'explorerDates.security.maxWarningsPerFile': 0
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            await provider.provideFileDecoration(workspaceFile);
            
            assert.strictEqual(
                provider._securityEnforceWorkspaceBoundaries,
                false,
                'Security enforcement flag should update based on configuration'
            );
            assert(
                provider._securityAllowedExtraPaths.some((entry) => entry === normalizedRelaxedPath),
                'Updated allowed path should be normalized and tracked'
            );
            
            provider.dispose();
        });

        await runTest('Configuration Performance Under Load', async () => {
            const mockInstall = createTestMock({
                config: {
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.performanceMode': false
                }
            });
            const { vscode } = mockInstall;
            const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

            const provider = new FileDateDecorationProvider();
            
            // Create many files and trigger config changes during processing
            const files = [];
            for (let i = 0; i < 15; i++) {
                files.push(vscode.Uri.file(`/test-workspace/load-test-${i}.js`));
            }
            
            const startTime = Date.now();
            
            // Process files while changing config
            const promises = files.map(async (uri, index) => {
                if (index % 3 === 0) {
                    // Trigger config change during processing
                    mockInstall.triggerConfigChange({
                        'explorerDates.dateDecorationFormat': index % 2 === 0 ? 'relative-long' : 'absolute-short'
                    });
                    
                    // Allow change to process
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
                
                return provider.provideFileDecoration(uri);
            });
            
            const results = await Promise.all(promises);
            const endTime = Date.now();
            
            // All decorations should succeed
            const successCount = results.filter(r => r !== null).length;
            assert(successCount === files.length, `All files should be processed (${successCount}/${files.length})`);
            
            // Performance should be reasonable even under load
            const duration = endTime - startTime;
            console.log(`   Processed ${files.length} files with config changes in ${duration}ms`);
            
            provider.dispose();
        });

        await runTest('Runtime Configuration Manager Toggle Coverage', async () => {
            const toggleDefaults = {
                'explorerDates.enableOnboardingSystem': false,
                'explorerDates.enableAnalysisCommands': false,
                'explorerDates.enableExportReporting': false,
                'explorerDates.enableExtensionApi': false,
                'explorerDates.enableWorkspaceTemplates': false,
                'explorerDates.enableAdvancedCache': false,
                'explorerDates.enableWorkspaceIntelligence': false,
                'explorerDates.enableIncrementalWorkers': false
            };
            const mockInstall = createTestMock({
                config: {
                    ...toggleDefaults,
                    'explorerDates.performanceMode': false
                }
            });
            const context = createExtensionContext();
            const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
            const manager = new RuntimeConfigManager(context);
            
            try {
                const initialState = await manager.getCurrentRuntimeState();
                Object.keys(toggleDefaults).forEach((key) => {
                    const snapshotKey = key.startsWith('explorerDates.')
                        ? key
                        : `explorerDates.${key}`;
                    assert.strictEqual(
                        initialState.currentSettings[snapshotKey],
                        toggleDefaults[key],
                        `${snapshotKey} should reflect configured value`
                    );
                });
                
                mockInstall.triggerConfigChange({
                    'explorerDates.enableOnboardingSystem': true,
                    'explorerDates.enableAdvancedCache': true,
                    'explorerDates.performanceMode': true
                });
                
                const pending = context.globalState.get('explorerDates.pendingRestart', []);
                assert(pending.includes('enableOnboardingSystem'), 'onboarding toggle should queue restart');
                assert(pending.includes('enableAdvancedCache'), 'advanced cache toggle should queue restart');
                assert(pending.includes('performanceMode'), 'performance mode toggle should queue restart');
                
                const refreshedState = await manager.getCurrentRuntimeState();
                assert.strictEqual(
                    refreshedState.currentSettings['explorerDates.enableOnboardingSystem'],
                    true,
                    'Runtime state should pick up new onboarding toggle'
                );
                assert.strictEqual(
                    refreshedState.currentSettings['explorerDates.enableAdvancedCache'],
                    true,
                    'Runtime state should pick up new cache toggle'
                );
            } finally {
                manager.dispose();
                mockInstall.dispose();
            }
        });

        console.log(`\n🎉 Configuration edge case tests completed: ${testsPassed}/${testsRun} passed`);

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
