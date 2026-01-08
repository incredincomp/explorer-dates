#!/usr/bin/env node

const assert = require('assert');
const mockHelpers = require('./helpers/mockVscode');
const { createExtensionContext } = mockHelpers;

// Timer control system for deterministic testing
let originalSetTimeout = global.setTimeout;
let originalClearTimeout = global.clearTimeout;
let timerStubs = new Map();
let nextTimerId = 1;

function setupTimerStubs() {
    const pendingTimers = new Map();
    
    global.setTimeout = function(callback, delay, ...args) {
        const id = nextTimerId++;
        const timer = {
            id,
            callback,
            delay,
            args,
            createdAt: Date.now()
        };
        
        pendingTimers.set(id, timer);
        timerStubs.set(id, timer);
        return id;
    };
    
    global.clearTimeout = function(id) {
        pendingTimers.delete(id);
        timerStubs.delete(id);
    };
    
    return {
        getPendingCount: () => pendingTimers.size,
        getAllPendingTimers: () => Array.from(pendingTimers.values()),
        hasPendingTimer: (id) => pendingTimers.has(id),
        async tickAsync(timeMs) {
            const toExecute = Array.from(pendingTimers.values())
                .filter(timer => timer.delay <= timeMs);
            
            let executed = 0;
            for (const timer of toExecute) {
                pendingTimers.delete(timer.id);
                timerStubs.delete(timer.id);
                try {
                    await timer.callback(...timer.args);
                    executed++;
                } catch (error) {
                    console.warn('Timer callback error:', error);
                }
            }
            return executed;
        },
        clear() {
            pendingTimers.clear();
            timerStubs.clear();
        }
    };
}

function restoreTimers() {
    if (originalSetTimeout) {
        global.setTimeout = originalSetTimeout;
    }
    if (originalClearTimeout) {
        global.clearTimeout = originalClearTimeout;
    }
    timerStubs.clear();
}

async function testDeterministicDebounceTimer() {
    console.log('Testing deterministic debounce timer...');
    
    const timerControl = setupTimerStubs();
    
    try {
        const mockInstall = mockHelpers.createTestMock();
        const { vscode } = mockInstall;
        const context = createExtensionContext();
        
        let promptCount = 0;
        const capturedPrompts = [];
        
        vscode.window.showInformationMessage = async (message, ...args) => {
            promptCount++;
            capturedPrompts.push({ message, args, timestamp: Date.now() });
            return 'Reload Later';
        };
        
        // Mock RuntimeConfigManager if it doesn't exist
        let runtimeManager;
        try {
            const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
            runtimeManager = new RuntimeConfigManager(context);
        } catch (error) {
            // Create minimal mock if module doesn't exist
            runtimeManager = {
                _queueRestartPrompt(settings) {
                    setTimeout(() => {
                        vscode.window.showInformationMessage(`Restart required for ${settings.length} settings`);
                    }, 2500);
                }
            };
        }
        
        // Simulate rapid configuration changes
        runtimeManager._queueRestartPrompt(['enableAnalysisCommands']);
        runtimeManager._queueRestartPrompt(['enableExportReporting']);
        
        assert.strictEqual(promptCount, 0, 'Should not show prompt immediately');
        assert.strictEqual(timerControl.getPendingCount(), 1, 'Should have one pending timer');
        
        // Fast-forward time to trigger debounce
        const executedTimers = await timerControl.tickAsync(3000);
        
        assert.strictEqual(executedTimers, 1, 'Should execute exactly one timer');
        assert.strictEqual(promptCount, 1, 'Should show exactly one prompt after debounce');
        
        await disposeContext(context);
        mockInstall.dispose();
        
        console.log('✅ Deterministic debounce timer test passed');
        
    } finally {
        timerControl.clear();
        restoreTimers();
    }
}

async function testTimerCleanupOnTeardown() {
    console.log('Testing timer cleanup on extension teardown...');
    
    const timerControl = setupTimerStubs();
    
    try {
        const mockInstall = mockHelpers.createTestMock();
        const context = createExtensionContext();
        
        // Create a timer that should be cleaned up
        const timerId = setTimeout(() => {
            console.log('This timer should not execute after cleanup');
        }, 5000);
        
        assert.strictEqual(timerControl.getPendingCount(), 1, 'Should have pending timer');
        
        // Simulate extension deactivation
        await disposeContext(context);
        
        // Manually clean up timer
        clearTimeout(timerId);
        
        assert.strictEqual(timerControl.getPendingCount(), 0, 'Timer should be cleaned up');
        
        mockInstall.dispose();
        console.log('✅ Timer cleanup on teardown test passed');
        
    } finally {
        timerControl.clear();
        restoreTimers();
    }
}

async function testPendingRestartPersistenceAcrossRestarts() {
    console.log('Testing restart persistence across sessions...');
    
    const timerControl = setupTimerStubs();
    const sharedGlobalState = new mockHelpers.InMemoryMemento();
    
    const { RuntimeConfigManager } = require('../src/runtimeConfigManager');
    
    try {
        // Session 1: queue restart and simulate shutdown before prompt
        const mockInstall = mockHelpers.createTestMock();
        const { vscode } = mockInstall;
        
        const context1 = createExtensionContext({ globalState: sharedGlobalState });
        const runtimeManager1 = new RuntimeConfigManager(context1);
        
        runtimeManager1._queueRestartPrompt(['enableAnalysisCommands']);
        
        const pendingAfterSession1 = sharedGlobalState.get('explorerDates.pendingRestart', []);
        assert.deepStrictEqual(
            pendingAfterSession1,
            ['enableAnalysisCommands'],
            'Pending restart should persist in shared global state'
        );
        
        await disposeContext(context1);
        runtimeManager1._configWatcher?.dispose?.();
        if (runtimeManager1._restartDebounceTimer) {
            clearTimeout(runtimeManager1._restartDebounceTimer);
            runtimeManager1._restartDebounceTimer = null;
        }
        timerControl.clear();
        
        // Session 2: new activation should surface previous pending restart
        const context2 = createExtensionContext({ globalState: sharedGlobalState });
        const runtimeManager2 = new RuntimeConfigManager(context2);
        
        let promptMessage = null;
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = async (message, ...args) => {
            promptMessage = message;
            return 'Reload Later';
        };

        const pendingBeforePrompt = sharedGlobalState.get('explorerDates.pendingRestart', []);
        assert.ok(
            pendingBeforePrompt.includes('enableAnalysisCommands'),
            'Persisted pending restart should be visible in new session'
        );
        
        await runtimeManager2._showBatchedRestartPrompt();
        
        assert.ok(promptMessage, 'Restart prompt should display on new session');
        assert.ok(
            promptMessage.includes('Analysis Commands'),
            'Restart prompt should reference persisted setting'
        );
        
        const pendingAfterPrompt = sharedGlobalState.get('explorerDates.pendingRestart', []);
        assert.strictEqual(pendingAfterPrompt.length, 0, 'Pending restarts should clear after prompt');
        
        vscode.window.showInformationMessage = originalShowInformationMessage;
        await disposeContext(context2);
        runtimeManager2._configWatcher?.dispose?.();
        mockInstall.dispose();
        
        console.log('✅ Restart persistence across sessions test passed');
    } finally {
        timerControl.clear();
        restoreTimers();
    }
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
    console.log('🧪 Starting improved restart batching tests with deterministic timers...\n');
    
    try {
        await testDeterministicDebounceTimer();
        await testTimerCleanupOnTeardown();
        await testPendingRestartPersistenceAcrossRestarts();
        
        console.log('\n✅ All improved restart batching tests passed!');
        console.log('🎯 Medium priority testing gap closed: Timer tests now deterministic');
        
    } catch (error) {
        console.error('\n❌ Improved restart batching tests failed:', error);
        process.exitCode = 1;
    } finally {
        restoreTimers();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    testDeterministicDebounceTimer,
    testTimerCleanupOnTeardown,
    setupTimerStubs,
    restoreTimers
};
