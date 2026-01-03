#!/usr/bin/env node
/* eslint-disable no-unused-vars */

const assert = require('assert');
const mockHelpers = require('./helpers/mockVscode');
const { createExtensionContext } = mockHelpers;

async function runRestartBatchingTests() {
    console.log('🧪 Starting restart batching tests...');
    
    await testDebounceTimerFiresOnce();
    await testMultipleSettingsCoalesced();
    await testReloadNowClearsPendingRestart();
    await testConfigurationChangeHandling();
    await testBatchedRestartPrompt();
    await testRestartPromptFormatting();
    await testTimerCleanup();
    await testEmptyPendingRestart();
    await testDuplicateSettingsDeduplication();
    await testReloadLaterClearsPending();
    await testIntegratedConfigurationFlow();
    
    console.log('✅ All restart batching tests passed!');
}

/**
 * Test that the debounce timer fires only once even with multiple rapid changes
 */
async function testDebounceTimerFiresOnce() {
    console.log('Testing debounce timer fires once...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let promptCount = 0;
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (..._args) => {
        promptCount++;
        return 'Reload Later'; // Don't reload during test
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Simulate rapid configuration changes
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        runtimeManager._queueRestartPrompt(['enableExportReporting']);
        runtimeManager._queueRestartPrompt(['enableExtensionApi']);
        
        // Wait for debounce timer (2+ seconds)
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        assert.strictEqual(promptCount, 1, 'Should show restart prompt exactly once after debounce');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Debounce timer test passed');
}

/**
 * Test that multiple settings are properly coalesced into a single restart prompt
 */
async function testMultipleSettingsCoalesced() {
    console.log('Testing multiple settings coalesced...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let capturedMessage = '';
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (message, ..._args) => {
        capturedMessage = message;
        return 'Reload Later';
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Add multiple settings to pending restart
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        runtimeManager._queueRestartPrompt(['enableExportReporting']);
        runtimeManager._queueRestartPrompt(['enableExtensionApi']);
        
        // Verify settings are stored in global state
        const pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.ok(pending.includes('enableAnalysisCommands'), 'Should include Analysis Commands');
        assert.ok(pending.includes('enableExportReporting'), 'Should include Export Reporting');
        assert.ok(pending.includes('enableExtensionApi'), 'Should include Extension Api');
        assert.strictEqual(pending.length, 3, 'Should have exactly 3 unique pending settings');
        
        // Wait for debounced prompt
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        // Verify message format for multiple settings
        assert.ok(capturedMessage.includes('3 settings'), 'Message should mention 3 settings');
        assert.ok(capturedMessage.includes('Analysis Commands'), 'Should format Analysis Commands');
        assert.ok(capturedMessage.includes('Export Reporting'), 'Should format Export Reporting');
        assert.ok(capturedMessage.includes('Extension Api'), 'Should format Extension Api');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Multiple settings coalesced test passed');
}

/**
 * Test that "Reload Now" command actually clears explorerDates.pendingRestart
 */
async function testReloadNowClearsPendingRestart() {
    console.log('Testing Reload Now clears pending restart...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let reloadCommandExecuted = false;
    const originalExecuteCommand = vscode.commands.executeCommand;
    vscode.commands.executeCommand = async (command, ...args) => {
        if (command === 'workbench.action.reloadWindow') {
            reloadCommandExecuted = true;
            return;
        }
        return originalExecuteCommand(command, ...args);
    };
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (..._args) => {
        return 'Reload Now'; // User chooses to reload
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Queue a restart prompt
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands', 'enableExportReporting']);
        
        // Verify settings are pending
        let pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 2, 'Should have 2 pending settings before prompt');
        
        // Wait for debounced prompt
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        // Verify reload was executed
        assert.ok(reloadCommandExecuted, 'Should execute reload window command');
        
        // Verify pending restart is cleared
        pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 0, 'Should clear pending restart after Reload Now');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.commands.executeCommand = originalExecuteCommand;
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Reload Now clears pending restart test passed');
}

/**
 * Test configuration change handling detects restart-required settings
 */
async function testConfigurationChangeHandling() {
    console.log('Testing configuration change handling...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let queuedSettings = [];
    const originalQueueRestartPrompt = RuntimeConfigManager.prototype._queueRestartPrompt;
    RuntimeConfigManager.prototype._queueRestartPrompt = function(settingKeys) {
        queuedSettings = [...queuedSettings, ...settingKeys];
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Create mock configuration change events
        const mockChangeEventRestart = {
            affectsConfiguration: (section) => {
                return section === 'explorerDates.enableAnalysisCommands' || 
                       section === 'explorerDates.enableExportReporting';
            }
        };
        
        const mockChangeEventNoRestart = {
            affectsConfiguration: (section) => {
                return section === 'explorerDates.dateFormat'; // Non-restart setting
            }
        };
        
        // Test restart-required changes
        await runtimeManager._handleConfigurationChange(mockChangeEventRestart);
        
        assert.ok(queuedSettings.includes('enableAnalysisCommands'), 
                 'Should queue Analysis Commands for restart');
        assert.ok(queuedSettings.includes('enableExportReporting'), 
                 'Should queue Export Reporting for restart');
        
        // Reset and test non-restart changes
        queuedSettings = [];
        await runtimeManager._handleConfigurationChange(mockChangeEventNoRestart);
        
        assert.strictEqual(queuedSettings.length, 0, 
                          'Should not queue non-restart settings');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        RuntimeConfigManager.prototype._queueRestartPrompt = originalQueueRestartPrompt;
        mockInstall.dispose();
    }
    
    console.log('✅ Configuration change handling test passed');
}

/**
 * Test batched restart prompt shows correct message and handles all responses
 */
async function testBatchedRestartPrompt() {
    console.log('Testing batched restart prompt...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let capturedMessage = '';
    let capturedOptions = [];
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (message, options, ...actions) => {
        capturedMessage = message;
        capturedOptions = actions;
        return 'Reload Later'; // Test "Reload Later" path
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Set up pending restart with known settings
        await context.globalState.update('explorerDates.pendingRestart', 
                                       ['enableAnalysisCommands', 'enableExportReporting']);
        
        // Call the batched restart prompt directly
        await runtimeManager._showBatchedRestartPrompt();
        
        // Verify message content
        assert.ok(capturedMessage.includes('2 settings'), 'Should mention 2 settings');
        assert.ok(capturedMessage.includes('chunk optimizations'), 'Should mention chunk optimizations');
        
        // Verify options
        assert.ok(capturedOptions.includes('Reload Now'), 'Should offer Reload Now option');
        assert.ok(capturedOptions.includes('Reload Later'), 'Should offer Reload Later option');
        
        // Verify pending restart is cleared even with "Reload Later"
        const pendingAfter = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pendingAfter.length, 0, 'Should clear pending restart regardless of response');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Batched restart prompt test passed');
}

/**
 * Test restart prompt formatting for single vs multiple settings
 */
async function testRestartPromptFormatting() {
    console.log('Testing restart prompt formatting...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let singleSettingMessage = '';
    let multipleSettingsMessage = '';
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (message, ...args) => {
        if (message.includes('"Analysis Commands"')) {
            singleSettingMessage = message;
        } else if (message.includes('3 settings')) {
            multipleSettingsMessage = message;
        }
        return 'Reload Later';
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Test single setting formatting
        await context.globalState.update('explorerDates.pendingRestart', ['enableAnalysisCommands']);
        await runtimeManager._showBatchedRestartPrompt();
        
        assert.ok(singleSettingMessage.includes('"Analysis Commands"'), 
                 'Single setting should be quoted');
        assert.ok(!singleSettingMessage.includes(' settings '), 
                 'Single setting should not say "settings"');
        
        // Test multiple settings formatting  
        await context.globalState.update('explorerDates.pendingRestart', 
                                       ['enableAnalysisCommands', 'enableExportReporting', 'enableExtensionApi']);
        await runtimeManager._showBatchedRestartPrompt();
        
        assert.ok(multipleSettingsMessage.includes('3 settings'), 
                 'Multiple settings should show count');
        assert.ok(multipleSettingsMessage.includes('Analysis Commands, Export Reporting, Extension Api'), 
                 'Multiple settings should list all names');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Restart prompt formatting test passed');
}

/**
 * Test that timer is properly cleaned up and doesn't leak
 */
async function testTimerCleanup() {
    console.log('Testing timer cleanup...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (...args) => 'Reload Later';
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Queue a restart prompt
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        
        // Verify timer exists
        assert.ok(runtimeManager._restartDebounceTimer, 'Should have active debounce timer');
        
        // Queue another prompt (should clear previous timer)
        runtimeManager._queueRestartPrompt(['enableExportReporting']);
        
        // Wait for debounced prompt
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        // Verify timer is cleaned up
        assert.strictEqual(runtimeManager._restartDebounceTimer, null, 
                          'Timer should be null after execution');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Timer cleanup test passed');
}

/**
 * Test empty pending restart handling
 */
async function testEmptyPendingRestart() {
    console.log('Testing empty pending restart...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let promptShown = false;
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (..._args) => {
        promptShown = true;
        return 'Reload Later';
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Ensure pending restart is empty
        await context.globalState.update('explorerDates.pendingRestart', []);
        
        // Call batched restart prompt with empty pending
        await runtimeManager._showBatchedRestartPrompt();
        
        // Verify no prompt was shown
        assert.strictEqual(promptShown, false, 'Should not show prompt when no pending restarts');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Empty pending restart test passed');
}

/**
 * Test duplicate settings are properly deduplicated
 */
async function testDuplicateSettingsDeduplication() {
    console.log('Testing duplicate settings deduplication...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (...args) => 'Reload Later';
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Queue same setting multiple times
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        runtimeManager._queueRestartPrompt(['enableExportReporting']);
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']); // duplicate again
        
        // Check pending settings
        const pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 2, 'Should have only 2 unique settings');
        assert.ok(pending.includes('enableAnalysisCommands'), 'Should include Analysis Commands');
        assert.ok(pending.includes('enableExportReporting'), 'Should include Export Reporting');
        
        // Verify no duplicates
        const uniquePending = [...new Set(pending)];
        assert.strictEqual(pending.length, uniquePending.length, 
                          'Pending array should contain no duplicates');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Duplicate settings deduplication test passed');
}

/**
 * Test that "Reload Later" also clears pending restart state
 */
async function testReloadLaterClearsPending() {
    console.log('Testing Reload Later clears pending...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let reloadCommandExecuted = false;
    const originalExecuteCommand = vscode.commands.executeCommand;
    vscode.commands.executeCommand = async (command, ...args) => {
        if (command === 'workbench.action.reloadWindow') {
            reloadCommandExecuted = true;
            return;
        }
        return originalExecuteCommand(command, ...args);
    };
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (..._args) => {
        return 'Reload Later'; // User chooses to postpone
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Queue a restart prompt
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands', 'enableExportReporting']);
        
        // Verify settings are pending
        let pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 2, 'Should have 2 pending settings before prompt');
        
        // Wait for debounced prompt
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        // Verify reload was NOT executed
        assert.strictEqual(reloadCommandExecuted, false, 'Should not execute reload for Reload Later');
        
        // Verify pending restart is STILL cleared even with "Reload Later"
        pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 0, 'Should clear pending restart even with Reload Later');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.commands.executeCommand = originalExecuteCommand;
        vscode.window.showInformationMessage = originalShowInformationMessage;
        mockInstall.dispose();
    }
    
    console.log('✅ Reload Later clears pending test passed');
}

/**
 * Test integrated configuration change flow from start to finish
 */
async function testIntegratedConfigurationFlow() {
    console.log('Testing integrated configuration flow...');
    
    const mockInstall = mockHelpers.createMockVscode();
    const { vscode } = mockInstall;
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    const context = createExtensionContext();
    
    let promptCount = 0;
    let capturedMessages = [];
    let reloadExecuted = false;
    
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async (message, ..._args) => {
        promptCount++;
        capturedMessages.push(message);
        // Simulate user choosing "Reload Now" on the final prompt
        return promptCount === 1 ? 'Reload Now' : 'Reload Later';
    };
    
    const originalExecuteCommand = vscode.commands.executeCommand;
    vscode.commands.executeCommand = async (command, ...args) => {
        if (command === 'workbench.action.reloadWindow') {
            reloadExecuted = true;
            return;
        }
        return originalExecuteCommand(command, ...args);
    };
    
    try {
        const runtimeManager = new RuntimeConfigManager(context);
        
        // Simulate rapid configuration changes via the configuration watcher
        const mockChangeEvent = {
            affectsConfiguration: (section) => {
                return section === 'explorerDates.enableAnalysisCommands' || 
                       section === 'explorerDates.enableExportReporting' ||
                       section === 'explorerDates.enableExtensionApi';
            }
        };
        
        // Trigger configuration change handling
        await runtimeManager._handleConfigurationChange(mockChangeEvent);
        
        // Verify settings are queued immediately
        let pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.ok(pending.length >= 3, 'Should queue multiple restart-required settings');
        assert.ok(pending.includes('enableAnalysisCommands'), 'Should queue Analysis Commands');
        assert.ok(pending.includes('enableExportReporting'), 'Should queue Export Reporting');
        assert.ok(pending.includes('enableExtensionApi'), 'Should queue Extension Api');
        
        // Trigger another configuration change before debounce timer fires
        const mockChangeEvent2 = {
            affectsConfiguration: (section) => {
                return section === 'explorerDates.enableWorkspaceTemplates';
            }
        };
        
        await runtimeManager._handleConfigurationChange(mockChangeEvent2);
        
        // Verify additional setting is added
        pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.ok(pending.includes('enableWorkspaceTemplates'), 'Should add Workspace Templates');
        
        // Wait for debounced prompt to fire
        await new Promise(resolve => setTimeout(resolve, 2100));
        
        // Verify only one prompt was shown despite multiple configuration changes
        assert.strictEqual(promptCount, 1, 'Should show only one batched prompt');
        
        // Verify the message included all settings
        const finalMessage = capturedMessages[0];
        assert.ok(finalMessage.includes('4 settings'), 'Should mention all 4 settings');
        assert.ok(finalMessage.includes('Analysis Commands'), 'Should include first setting');
        assert.ok(finalMessage.includes('Workspace Templates'), 'Should include last setting');
        
        // Verify reload was executed
        assert.ok(reloadExecuted, 'Should execute reload command');
        
        // Verify pending restart was cleared
        pending = context.globalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pending.length, 0, 'Should clear all pending restarts after reload');
        
        await disposeContext(context);
        runtimeManager._configWatcher?.dispose?.();
    } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
        vscode.commands.executeCommand = originalExecuteCommand;
        mockInstall.dispose();
    }
    
    console.log('✅ Integrated configuration flow test passed');
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

async function main() {
    try {
        await runRestartBatchingTests();
        console.log('🎯 Restart batching tests completed successfully');
    } catch (error) {
        console.error('❌ Restart batching tests failed:', error);
        process.exitCode = 1;
    }
}

// Run tests if called directly
if (require.main === module) {
    main();
}

module.exports = { 
    runRestartBatchingTests,
    testDebounceTimerFiresOnce,
    testMultipleSettingsCoalesced,
    testReloadNowClearsPendingRestart,
    testTimerCleanup,
    testEmptyPendingRestart,
    testDuplicateSettingsDeduplication,
    testReloadLaterClearsPending,
    testIntegratedConfigurationFlow
};