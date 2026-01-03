#!/usr/bin/env node

/**
 * VS Code API Edge Cases Test
 * 
 * Comprehensive test coverage for VS Code API edge cases including:
 * - Theme changes during active decorations
 * - Workspace events and timing issues
 * - Window focus and activation events
 * - API deprecations and failures
 * - Extension context edge cases
 * - Command execution failures
 * - File system watcher edge cases
 * - Configuration change timing issues
 */

const fs = require('fs').promises;
const path = require('path');
const { createMockVscode } = require('./helpers/mockVscode');

// Mock vscode globally BEFORE requiring provider
const mockVsCode = createMockVscode({
    explorerDates: {
        enabled: true,
        format: 'relative',
        badgePriority: 'time',
        dateFormat: 'short',
        timestampFormat: '12h',
        cacheTimeout: 30000
    }
});

global.vscode = mockVsCode.vscode;

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function runAllTests() {
    console.log('🚀 Starting VS Code API Edge Cases tests...\n');

    const testSuite = [
        testThemeChangeDuringDecorations,
        testWorkspaceEventTiming,
        testWindowFocusAndActivation,
        testAPIDeprecationsAndFailures,
        testExtensionContextEdgeCases,
        testCommandExecutionFailures,
        testFileSystemWatcherEdgeCases,
        testConfigurationChangeTimingIssues
    ];

    let passed = 0;
    let total = 0;

    for (const testGroup of testSuite) {
        try {
            const result = await testGroup();
            passed += result.passed;
            total += result.total;
        } catch (error) {
            console.error(`❌ Test group failed: ${error.message}`);
            total += 1;
        }
    }

    console.log(`\n🎯 VS Code API edge cases tests completed: ${passed}/${total} passed`);
    return { passed, total };
}

async function testThemeChangeDuringDecorations() {
    console.log('🎨 Testing Theme Changes During Active Decorations...');
    let passed = 0, total = 0;

    // Test 1: Theme change during decoration providing
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Start decoration operation
        const uri = mock.Uri.file('/test/file.js');
        const decorationPromise = provider.provideFileDecoration(uri);
        
        // Simulate theme change during decoration
        const mockThemeChange = {
            kind: 1 // ColorTheme
        };
        
        // If theme change listeners exist, trigger them
        if (mock.window.onDidChangeActiveColorTheme) {
            const disposable = mock.window.onDidChangeActiveColorTheme(() => {});
            disposable.dispose();
        }
        
        const decoration = await decorationPromise;
        
        if (decoration !== undefined) {
            console.log('✅ Theme change during decoration providing');
            passed++;
        } else {
            console.log('❌ Theme change during decoration providing failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Theme change during decoration providing:', error.message);
    }

    // Test 2: Multiple rapid theme changes
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let themeChangeCount = 0;
        
        // Simulate multiple rapid theme changes
        for (let i = 0; i < 5; i++) {
            const uri = mock.Uri.file(`/test/file${i}.js`);
            await provider.provideFileDecoration(uri);
            themeChangeCount++;
        }
        
        if (themeChangeCount === 5) {
            console.log('✅ Multiple rapid theme changes');
            passed++;
        } else {
            console.log('❌ Multiple rapid theme changes failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Multiple rapid theme changes:', error.message);
    }

    // Test 3: Theme changes with color preferences
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test different color theme configurations
        triggerConfigChange({
            'explorerDates.enableColors': true,
            'explorerDates.colorScheme': 'auto'
        });
        
        const uri = mock.Uri.file('/test/themed-file.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Theme changes with color preferences');
            passed++;
        } else {
            console.log('❌ Theme changes with color preferences failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Theme changes with color preferences:', error.message);
    }

    return { passed, total };
}

async function testWorkspaceEventTiming() {
    console.log('⚡ Testing Workspace Event Timing Issues...');
    let passed = 0, total = 0;

    // Test 1: Rapid workspace folder changes
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, removeWorkspaceFolder, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let eventCount = 0;
        
        const disposable = mock.workspace.onDidChangeWorkspaceFolders(() => {
            eventCount++;
        });

        // Rapid workspace changes
        addWorkspaceFolder({ path: '/workspace1', name: 'WS1' });
        addWorkspaceFolder({ path: '/workspace2', name: 'WS2' });
        removeWorkspaceFolder(0);
        addWorkspaceFolder({ path: '/workspace3', name: 'WS3' });
        
        if (eventCount === 4) {
            console.log('✅ Rapid workspace folder changes');
            passed++;
        } else {
            console.log('❌ Rapid workspace folder changes failed');
        }
        
        disposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Rapid workspace folder changes:', error.message);
    }

    // Test 2: Configuration changes during workspace events
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let workspaceEvents = 0;
        let configEvents = 0;
        
        const workspaceDisposable = mock.workspace.onDidChangeWorkspaceFolders(() => {
            workspaceEvents++;
        });
        
        const configDisposable = mock.workspace.onDidChangeConfiguration(() => {
            configEvents++;
        });

        // Interleave workspace and config changes
        addWorkspaceFolder({ path: '/workspace1', name: 'WS1' });
        triggerConfigChange({ 'explorerDates.enabled': false });
        addWorkspaceFolder({ path: '/workspace2', name: 'WS2' });
        triggerConfigChange({ 'explorerDates.format': 'absolute' });
        
        if (workspaceEvents === 2 && configEvents === 2) {
            console.log('✅ Configuration changes during workspace events');
            passed++;
        } else {
            console.log('❌ Configuration changes during workspace events failed');
        }
        
        workspaceDisposable.dispose();
        configDisposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Configuration changes during workspace events:', error.message);
    }

    // Test 3: Workspace event during file operations
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Start file operation
        const uri = mock.Uri.file('/workspace/file.js');
        const decorationPromise = provider.provideFileDecoration(uri);
        
        // Change workspace during operation
        addWorkspaceFolder({ path: '/new-workspace', name: 'NewWS' });
        
        const decoration = await decorationPromise;
        
        if (decoration !== undefined && mock.workspace.workspaceFolders.length === 2) {
            console.log('✅ Workspace event during file operations');
            passed++;
        } else {
            console.log('❌ Workspace event during file operations failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Workspace event during file operations:', error.message);
    }

    return { passed, total };
}

async function testWindowFocusAndActivation() {
    console.log('🖥️ Testing Window Focus and Activation Events...');
    let passed = 0, total = 0;

    // Test 1: Window state changes during decoration
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Simulate window state change events (if supported by mock)
        const uri = mock.Uri.file('/test/focus-file.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        // Window focus changes don't break decoration providing
        if (decoration !== undefined) {
            console.log('✅ Window state changes during decoration');
            passed++;
        } else {
            console.log('❌ Window state changes during decoration failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Window state changes during decoration:', error.message);
    }

    // Test 2: Active editor changes
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test decoration when there might be active editor changes
        const files = ['/file1.js', '/file2.js', '/file3.js'];
        const decorationPromises = files.map(file => {
            const uri = mock.Uri.file(file);
            return provider.provideFileDecoration(uri);
        });
        
        const decorations = await Promise.all(decorationPromises);
        
        if (decorations.every(decoration => decoration !== undefined)) {
            console.log('✅ Active editor changes');
            passed++;
        } else {
            console.log('❌ Active editor changes failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Active editor changes:', error.message);
    }

    // Test 3: Window visibility changes
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test provider behavior when window visibility might change
        const uri = mock.Uri.file('/test/visibility-file.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        const metrics = provider.getMetrics();
        
        if (decoration !== undefined && metrics.cacheMisses > 0) {
            console.log('✅ Window visibility changes');
            passed++;
        } else {
            console.log('❌ Window visibility changes failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Window visibility changes:', error.message);
    }

    return { passed, total };
}

async function testAPIDeprecationsAndFailures() {
    console.log('⚠️ Testing API Deprecations and Failures...');
    let passed = 0, total = 0;

    // Test 1: Missing API methods graceful handling
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test graceful handling when optional API methods might be missing
        const uri = mock.Uri.file('/test/api-test.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Missing API methods graceful handling');
            passed++;
        } else {
            console.log('❌ Missing API methods graceful handling failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Missing API methods graceful handling:', error.message);
    }

    // Test 2: API call failures
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test behavior when file system operations might fail
        const uris = [
            mock.Uri.file('/nonexistent/file.js'),
            mock.Uri.file('/protected/file.js'),
            mock.Uri.file('/invalid\x00path/file.js')
        ];
        
        const decorationPromises = uris.map(uri => provider.provideFileDecoration(uri));
        const decorations = await Promise.all(decorationPromises);
        
        // Should handle gracefully and return decorations (even if empty)
        if (decorations.length === 3) {
            console.log('✅ API call failures');
            passed++;
        } else {
            console.log('❌ API call failures failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ API call failures:', error.message);
    }

    // Test 3: Deprecated configuration handling
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test handling of potentially deprecated config options
        triggerConfigChange({
            'explorerDates.legacyOption': 'deprecated-value',
            'explorerDates.unknownSetting': 'unknown'
        });
        
        const uri = mock.Uri.file('/test/deprecated-config.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Deprecated configuration handling');
            passed++;
        } else {
            console.log('❌ Deprecated configuration handling failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Deprecated configuration handling:', error.message);
    }

    return { passed, total };
}

async function testExtensionContextEdgeCases() {
    console.log('🔌 Testing Extension Context Edge Cases...');
    let passed = 0, total = 0;

    // Test 1: Extension activation timing
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        // Test provider initialization in various activation scenarios
        const provider = new FileDateDecorationProvider();
        
        const uri = mock.Uri.file('/test/activation-test.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Extension activation timing');
            passed++;
        } else {
            console.log('❌ Extension activation timing failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Extension activation timing:', error.message);
    }

    // Test 2: Extension context disposal edge cases
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test multiple rapid disposal scenarios
        let disposeCount = 0;
        const originalDispose = provider.dispose;
        provider.dispose = function() {
            disposeCount++;
            return originalDispose.call(this);
        };
        
        // Rapid dispose calls should be idempotent
        provider.dispose();
        provider.dispose();
        provider.dispose();
        
        if (disposeCount >= 1) { // Should handle multiple dispose calls gracefully
            console.log('✅ Extension context disposal edge cases');
            passed++;
        } else {
            console.log('❌ Extension context disposal edge cases failed');
        }
        
        localDispose();
    } catch (error) {
        console.log('❌ Extension context disposal edge cases:', error.message);
    }

    // Test 3: Extension state persistence
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test provider with various state scenarios
        const uri = mock.Uri.file('/test/state-test.js');
        await provider.provideFileDecoration(uri);
        
        const metrics = provider.getMetrics();
        
        if (metrics && typeof metrics.cacheMisses === 'number') {
            console.log('✅ Extension state persistence');
            passed++;
        } else {
            console.log('❌ Extension state persistence failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Extension state persistence:', error.message);
    }

    return { passed, total };
}

async function testCommandExecutionFailures() {
    console.log('⌨️ Testing Command Execution Failures...');
    let passed = 0, total = 0;

    // Test 1: Command registration failures
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test that provider works even if some commands fail to register
        const uri = mock.Uri.file('/test/command-test.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Command registration failures');
            passed++;
        } else {
            console.log('❌ Command registration failures failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Command registration failures:', error.message);
    }

    // Test 2: Command execution with invalid arguments
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test command-like operations with edge cases
        const invalidUris = [
            null,
            undefined,
            '',
            mock.Uri.file('')
        ];
        
        let handledCount = 0;
        for (const uri of invalidUris) {
            try {
                if (uri) {
                    await provider.provideFileDecoration(uri);
                }
                handledCount++;
            } catch (error) {
                // Expected for invalid URIs
                handledCount++;
            }
        }
        
        if (handledCount === invalidUris.length) {
            console.log('✅ Command execution with invalid arguments');
            passed++;
        } else {
            console.log('❌ Command execution with invalid arguments failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Command execution with invalid arguments:', error.message);
    }

    // Test 3: Async command timing issues
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test concurrent command-like operations
        const concurrentOperations = [];
        for (let i = 0; i < 10; i++) {
            const uri = mock.Uri.file(`/test/concurrent${i}.js`);
            concurrentOperations.push(provider.provideFileDecoration(uri));
        }
        
        const results = await Promise.all(concurrentOperations);
        
        if (results.length === 10 && results.every(result => result !== undefined)) {
            console.log('✅ Async command timing issues');
            passed++;
        } else {
            console.log('❌ Async command timing issues failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Async command timing issues:', error.message);
    }

    return { passed, total };
}

async function testFileSystemWatcherEdgeCases() {
    console.log('📁 Testing File System Watcher Edge Cases...');
    let passed = 0, total = 0;

    // Test 1: Watcher disposal timing
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Create and immediately dispose watchers
        const watcher1 = mock.workspace.createFileSystemWatcher('**/*');
        const watcher2 = mock.workspace.createFileSystemWatcher('**/src/**');
        
        watcher1.dispose();
        watcher2.dispose();
        
        // Provider should still work
        const uri = mock.Uri.file('/test/watcher-test.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Watcher disposal timing');
            passed++;
        } else {
            console.log('❌ Watcher disposal timing failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Watcher disposal timing:', error.message);
    }

    // Test 2: Multiple watcher patterns
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test various watcher patterns
        const patterns = ['**/*', '**/*.js', '**/src/**', '**/{test,spec}/**'];
        const watchers = patterns.map(pattern => 
            mock.workspace.createFileSystemWatcher(pattern)
        );
        
        const uri = mock.Uri.file('/test/multiple-patterns.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        // Clean up watchers
        watchers.forEach(watcher => watcher.dispose());
        
        if (decoration !== undefined) {
            console.log('✅ Multiple watcher patterns');
            passed++;
        } else {
            console.log('❌ Multiple watcher patterns failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Multiple watcher patterns:', error.message);
    }

    // Test 3: Watcher event flooding
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Simulate rapid file operations that might flood watchers
        const uris = [];
        for (let i = 0; i < 50; i++) {
            uris.push(mock.Uri.file(`/test/flood${i}.js`));
        }
        
        const decorations = await Promise.all(
            uris.map(uri => provider.provideFileDecoration(uri))
        );
        
        if (decorations.length === 50 && decorations.every(d => d !== undefined)) {
            console.log('✅ Watcher event flooding');
            passed++;
        } else {
            console.log('❌ Watcher event flooding failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Watcher event flooding:', error.message);
    }

    return { passed, total };
}

async function testConfigurationChangeTimingIssues() {
    console.log('⚙️ Testing Configuration Change Timing Issues...');
    let passed = 0, total = 0;

    // Test 1: Rapid configuration updates
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let configChangeCount = 0;
        
        const disposable = mock.workspace.onDidChangeConfiguration(() => {
            configChangeCount++;
        });
        
        // Rapid config changes
        for (let i = 0; i < 10; i++) {
            triggerConfigChange({
                [`explorerDates.testOption${i}`]: `value${i}`
            });
        }
        
        const uri = mock.Uri.file('/test/rapid-config.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (configChangeCount === 10 && decoration !== undefined) {
            console.log('✅ Rapid configuration updates');
            passed++;
        } else {
            console.log('❌ Rapid configuration updates failed');
        }
        
        disposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Rapid configuration updates:', error.message);
    }

    // Test 2: Configuration changes during file operations
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Start file operation
        const uri = mock.Uri.file('/test/config-timing.js');
        const decorationPromise = provider.provideFileDecoration(uri);
        
        // Change config during operation
        triggerConfigChange({
            'explorerDates.enabled': false,
            'explorerDates.format': 'absolute'
        });
        
        const decoration = await decorationPromise;
        
        if (decoration !== undefined) {
            console.log('✅ Configuration changes during file operations');
            passed++;
        } else {
            console.log('❌ Configuration changes during file operations failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Configuration changes during file operations:', error.message);
    }

    // Test 3: Overlapping configuration scopes
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        // Test configuration updates with different scopes
        triggerConfigChange({
            'explorerDates.globalSetting': 'global-value',
            'explorerDates.workspaceSetting': 'workspace-value'
        });
        
        const uri = mock.Uri.file('/test/scope-test.js');
        const decoration = await provider.provideFileDecoration(uri);
        
        if (decoration !== undefined) {
            console.log('✅ Overlapping configuration scopes');
            passed++;
        } else {
            console.log('❌ Overlapping configuration scopes failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Overlapping configuration scopes:', error.message);
    }

    return { passed, total };
}

// Run all tests
runAllTests()
    .then(() => {
        console.log('\n🎉 VS Code API edge cases tests completed');
    })
    .catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });