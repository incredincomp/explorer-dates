#!/usr/bin/env node

/**
 * Test script to verify periodic refresh mechanism
 * This script simulates the behavior of the periodic refresh timer
 */

const { createTestMock } = require('./helpers/mockVscode');

console.log('🧪 Testing Periodic Refresh Mechanism\n');

// Set up mock VS Code environment with a very short workspace-level refresh interval
const mockEnv = createTestMock({
    config: {
        'explorerDates.showDateDecorations': true
    },
    workspaceConfig: {
        // Use a 500ms interval so the timer fires quickly inside the test harness.
        'explorerDates.badgeRefreshInterval': 500
    }
});
const vscode = mockEnv.vscode;

// Load the FileDateDecorationProvider
const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

console.log('✅ Creating FileDateDecorationProvider instance...');
const provider = new FileDateDecorationProvider();

console.log(`✅ Provider created successfully`);
console.log(`   - Refresh interval: ${provider._refreshInterval}ms`);
console.log(`   - Refresh timer active: ${provider._refreshTimer !== null}`);

// Test 1: Verify timer is created
console.log('\n📋 Test 1: Verify periodic refresh timer is created');
if (provider._refreshTimer) {
    console.log('   ✅ Refresh timer exists');
} else {
    console.log('   ❌ Refresh timer is null');
    require('./helpers/forceExit').scheduleExit(0, 1);
    return;
}

// Track fire events by wrapping the fire method
let fireCount = 0;
const originalFire = provider._onDidChangeFileDecorations.fire.bind(provider._onDidChangeFileDecorations);
provider._onDidChangeFileDecorations.fire = function(data) {
    fireCount++;
    console.log(`  🔔 EventEmitter.fire() called (count: ${fireCount})`);
    return originalFire(data);
};

// Test 2: Check event emitter fire count before and after a simulated period
console.log('\n📋 Test 2: Verify timer triggers decoration refresh');
const initialFireCount = fireCount;
console.log(`   Initial fire count: ${initialFireCount}`);

// Wait for one refresh interval plus a bit
const waitTime = provider._refreshInterval + 500;
console.log(`   Waiting ${waitTime}ms for at least one refresh cycle...`);

setTimeout(async () => {
    const finalFireCount = fireCount;
    console.log(`   Final fire count: ${finalFireCount}`);

    if (finalFireCount > initialFireCount) {
        console.log(`   ✅ Timer fired ${finalFireCount - initialFireCount} time(s) - periodic refresh is working!`);
    } else {
        console.log(`   ❌ Timer did not fire - periodic refresh may not be working`);
        await provider.dispose();
        require('./helpers/forceExit').scheduleExit(0, 1);
        return;
    }

    // Insert a deliberately stale cache entry
    const staleTimestamp = Date.now() - (provider._cacheTimeout || 60000) - 1000;
    provider._decorationCache.set('test-key', {
        decoration: new vscode.FileDecoration('5m'),
        timestamp: staleTimestamp
    });

    console.log(`   Added stale cache entry (timestamp offset: ${Date.now() - staleTimestamp}ms)`);

    // Wait for another refresh cycle
    setTimeout(async () => {
        const refreshedEntry = provider._decorationCache.get('test-key');
        const wasMarkedForRefresh = !refreshedEntry || refreshedEntry.forceRefresh === true;

        if (wasMarkedForRefresh) {
            console.log('   ✅ Stale cache entry was marked for refresh or evicted');
        } else {
            console.log('   ❌ Stale cache entry was not marked for refresh');
            await provider.dispose();
            require('./helpers/forceExit').scheduleExit(0, 1);
            return;
        }

        // Test 4: Verify dispose cleans up timer
        console.log('\n📋 Test 4: Verify dispose() cleans up timer');
        await provider.dispose();

        if (provider._refreshTimer === null) {
            console.log('   ✅ Timer was cleared on dispose');
        } else {
            console.log('   ❌ Timer was not cleared on dispose');
            require('./helpers/forceExit').scheduleExit(0, 1);
            return;
        }

        // Test 5: Ensure scheduled incremental refresh callbacks are cancelled when provider is disposed
        console.log('\n📋 Test 5: Incremental refresh timers cancelled on dispose');
        const { scheduleIncrementalRefresh } = require('../src/chunks/decoration-refresh-chunk');

        // Use a fresh provider instance to avoid reusing a disposed one
        const provider2 = new (require('../src/fileDateDecorationProvider').FileDateDecorationProvider)();
        // Prepare provider with many cached entries so incremental refresh schedules delayed timers
        for (let i = 0; i < 120; i++) {
            provider2._decorationCache.set(`k${i}`, { uri: vscode.Uri.file(`/file${i}.txt`), timestamp: Date.now() - 60000 });
        }
        // Force a large refresh interval to ensure spacing > 0
        provider2._refreshInterval = 10000;

        let fired = false;
        const originalFire2 = provider2._onDidChangeFileDecorations.fire.bind(provider2._onDidChangeFileDecorations);
        provider2._onDidChangeFileDecorations.fire = (u) => { fired = true; return originalFire2(u); };

        // Schedule incremental refresh and immediately dispose — callbacks must not run after dispose
        console.log('   DEBUG before schedule: _isDisposed=', provider2._isDisposed, 'timers=', provider2._incrementalRefreshTimers.size);
        scheduleIncrementalRefresh(provider2, 'manual-test');
        console.log('   DEBUG after schedule: _isDisposed=', provider2._isDisposed, 'timers=', provider2._incrementalRefreshTimers.size);

        // Wrap dispose so we can observe timing
        const disposePromise2 = provider2.dispose();
        console.log('   DEBUG after dispose() called: _isDisposed=', provider2._isDisposed, 'timers=', provider2._incrementalRefreshTimers.size);
        await disposePromise2;
        console.log('   DEBUG after dispose() awaited: _isDisposed=', provider2._isDisposed, 'timers=', provider2._incrementalRefreshTimers && provider2._incrementalRefreshTimers.size);

        // Give timers a short moment to run if they weren't cancelled
        await new Promise(r => setTimeout(r, 150));

        if (!fired && (!provider2._incrementalRefreshTimers || provider2._incrementalRefreshTimers.size === 0)) {
            console.log('   ✅ Incremental refresh callbacks were cancelled on dispose');
        } else {
            console.log('   ❌ Incremental refresh callbacks ran after dispose (flaky)');
            require('./helpers/forceExit').scheduleExit(0, 1);
            return;
        }

        console.log('\n🎉 All tests passed! Periodic refresh mechanism is working correctly.\n');
        require('./helpers/forceExit').scheduleExit(0, 0);
    }, waitTime);
}, waitTime);
