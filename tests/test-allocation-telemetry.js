#!/usr/bin/env node

/**
 * Test allocation telemetry functionality in dev mode.
 */

const { createMockVscode, createExtensionContext, workspaceRoot, VSCodeUri } = require('./helpers/mockVscode');

// Create dev environment
process.env.NODE_ENV = 'development';
process.env.EXPLORER_DATES_TELEMETRY_INTERVAL_MS = '2000'; // 2 seconds for testing

console.log('🧪 Testing allocation telemetry in dev mode...');

const mock = createMockVscode({
    explorerDates: {
        enableReporting: false,
        autoThemeAdaptation: false,
        accessibilityMode: false
    }
});

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider.js');

async function testTelemetry() {
    const provider = new FileDateDecorationProvider();
    const context = createExtensionContext();
    
    console.log('📊 Initializing provider with telemetry enabled...');
    await provider.initializeAdvancedSystems(context);
    
    console.log('🔄 Processing some decorations to generate telemetry...');
    
    // Process a few files to generate allocation data
    const testFiles = [
        'test1.js',
        'test2.js', 
        'test3.js',
        'test1.js', // Repeat to trigger reuse
        'test2.js'
    ];
    
    for (const file of testFiles) {
        const uri = VSCodeUri.file(`${workspaceRoot}/${file}`);
        try {
            await provider.provideFileDecoration(uri);
        } catch (error) {
            // Expected in test environment
        }
    }
    
    console.log('📈 Current allocation metrics:', provider.getMetrics().allocationTelemetry);
        // Manually trigger a telemetry report to see output
    console.log('📊 Triggering manual telemetry report...');
    provider._reportAllocationTelemetry();
        // Wait for telemetry report
    console.log('⏱️  Waiting for telemetry report...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🧹 Cleaning up...');
    await provider.dispose();
    
    console.log('✅ Telemetry test complete');
}

testTelemetry().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});