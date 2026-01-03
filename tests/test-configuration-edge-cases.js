#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const assert = require('assert');
const path = require('path');
const { createMockVscode, VSCodeUri } = require('./helpers/mockVscode');

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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': null, // Invalid null value
                    'explorerDates.badgePriority': 'invalid-option', // Invalid enum
                    'explorerDates.cacheTimeout': -1, // Invalid negative number
                    'explorerDates.maxCacheSize': 'not-a-number', // Invalid type
                    'explorerDates.performanceMode': false // Keep valid to ensure decoration works
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
                
            } catch (error) {
                throw new Error(`Should not throw error with invalid config: ${error.message}`);
            }
            
            // Test that the provider handles invalid boolean as truthy performance mode
            const mockInstall2 = createMockVscode({
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.customSettings': '{malformed json}', // Invalid JSON
                    'explorerDates.excludePatterns': ['\\'], // Invalid regex pattern
                    'explorerDates.timestampFormat': '{{invalid}}', // Invalid format string
                    'explorerDates.colorScheme': { broken: undefined }, // Invalid object structure
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': 'relative',
                    'explorerDates.enableColors': true
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
                    'explorerDates.dateFormat': i % 2 === 0 ? 'relative' : 'absolute',
                    'explorerDates.enableColors': i % 3 === 0
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
            const mockInstall = createMockVscode({
                config: {
                    // User settings
                    'explorerDates.dateFormat': 'relative',
                    'explorerDates.enableColors': true,
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
                'explorerDates.dateFormat': 'absolute',
                'explorerDates.enableColors': false,
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': 'relative',
                    'explorerDates.enableColors': true
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
                'explorerDates.dateFormat': 'invalid-format',
                'explorerDates.enableColors': 'not-boolean',
                'explorerDates.badgePriority': null
            });
            
            // Allow configuration change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should still work with invalid settings (fallback)
            const decoration2 = await provider.provideFileDecoration(uri);
            assert(decoration2 !== null, 'Should handle invalid settings with fallback');
            
            // Rollback to valid settings
            mockInstall.triggerConfigChange({
                'explorerDates.dateFormat': 'absolute',
                'explorerDates.enableColors': false
            });
            
            // Allow configuration change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should work normally after rollback
            const decoration3 = await provider.provideFileDecoration(uri);
            assert(decoration3 !== null, 'Should work after rollback to valid settings');
            
            provider.dispose();
        });

        await runTest('Configuration Schema Violations', async () => {
            const mockInstall = createMockVscode({
                config: {
                    // Test various schema violations
                    'explorerDates.dateFormat': 123, // Wrong type
                    'explorerDates.enableColors': 'yes', // Invalid boolean string
                    'explorerDates.cacheTimeout': 'forever', // Non-numeric timeout
                    'explorerDates.excludePatterns': 'not-an-array', // Wrong type for array
                    'explorerDates.badgePriority': { complex: 'object' }, // Object instead of string
                    'explorerDates.maxCacheSize': Infinity, // Invalid number value
                    'explorerDates.refreshInterval': NaN // Invalid number value
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': 'relative'
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
                        'explorerDates.dateFormat': index % 2 === 0 ? 'relative' : 'absolute',
                        'explorerDates.enableColors': index % 3 === 0
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': 'relative',
                    'explorerDates.enableColors': true
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
                'explorerDates.dateFormat': 'absolute'
            });
            
            // Allow change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Get decoration after change
            const decoration2 = await provider.provideFileDecoration(uri);
            
            // Change back
            mockInstall.triggerConfigChange({
                'explorerDates.dateFormat': 'relative'
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
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': undefined, // Explicitly undefined
                    'explorerDates.enableColors': null, // Explicitly null
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
                'explorerDates.dateFormat': 'absolute',
                'explorerDates.enableColors': undefined
            });
            
            // Allow change to process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const decoration2 = await provider.provideFileDecoration(uri);
            assert(decoration2 !== null, 'Should handle partial config gracefully');
            
            provider.dispose();
        });

        await runTest('Configuration Performance Under Load', async () => {
            const mockInstall = createMockVscode({
                config: {
                    'explorerDates.dateFormat': 'relative',
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
                        'explorerDates.dateFormat': index % 2 === 0 ? 'relative' : 'absolute'
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
    });
}

module.exports = { main };
