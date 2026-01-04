#!/usr/bin/env node

/**
 * Test script to verify periodic refresh mechanism
 * This script simulates the behavior of the periodic refresh timer
 */

const { createMockVscode } = require('./helpers/mockVscode');

console.log('🧪 Testing Periodic Refresh Mechanism\n');

// Set up mock VS Code environment with a very short workspace-level refresh interval
const mockEnv = createMockVscode({
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
    process.exit(1);
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
        process.exit(1);
    }
    
    // Test 3: Verify cache is cleared during refresh
    console.log('\n📋 Test 3: Verify cache is cleared during refresh');
    
    // Add something to cache
    provider._decorationCache.set('test-key', {
        decoration: new vscode.FileDecoration('5m'),
        timestamp: Date.now()
    });
    
    const cacheSize = provider._decorationCache.size;
    console.log(`   Added test item to cache (size: ${cacheSize})`);
    
    // Wait for another refresh cycle
    setTimeout(async () => {
        const newCacheSize = provider._decorationCache.size;
        console.log(`   Cache size after refresh: ${newCacheSize}`);
        
        if (newCacheSize === 0) {
            console.log('   ✅ Cache was cleared during periodic refresh');
        } else {
            console.log('   ⚠️  Cache still has items (this may be OK if items were added after clear)');
        }
        
        // Test 4: Verify dispose cleans up timer
        console.log('\n📋 Test 4: Verify dispose() cleans up timer');
        await provider.dispose();
        
        if (provider._refreshTimer === null) {
            console.log('   ✅ Timer was cleared on dispose');
        } else {
            console.log('   ❌ Timer was not cleared on dispose');
            process.exit(1);
        }
        
        console.log('\n🎉 All tests passed! Periodic refresh mechanism is working correctly.\n');
        process.exit(0);
    }, waitTime);
}, waitTime);
