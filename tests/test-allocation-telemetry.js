#!/usr/bin/env node

/**
 * Test allocation telemetry functionality in dev mode.
 */

const { createTestMock, createExtensionContext, workspaceRoot, VSCodeUri } = require('./helpers/mockVscode');

// Create dev environment
process.env.NODE_ENV = 'development';
process.env.EXPLORER_DATES_TELEMETRY_INTERVAL_MS = '2000'; // 2 seconds for testing

console.log('🧪 Testing allocation telemetry in dev mode...');

createTestMock({
    explorerDates: {
        enableReporting: false,
        autoThemeAdaptation: false,
        accessibilityMode: false
    }
});

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider.js');

async function testTelemetry() {
    // Case A: development env should enable telemetry
    const provider = new FileDateDecorationProvider();
    const context = createExtensionContext();
    
    console.log('📊 Initializing provider with telemetry enabled (dev)...');
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
        } catch {
            // Expected in test environment
        }
    }
    
    console.log('📈 Current allocation metrics:', provider.getMetrics().allocationTelemetry);
    // Manually trigger a telemetry report to see output
    console.log('📊 Triggering manual telemetry report...');
    const chunk = await provider._getDecorationsAdvancedChunk();
    chunk?.reportAllocationTelemetry?.(provider);
        // Wait for telemetry report
    console.log('⏱️  Waiting for telemetry report...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🧹 Cleaning up...');
    await provider.dispose();

    // Case B: config-based opt-in (non-dev env)
    delete process.env.NODE_ENV;
    delete process.env.EXPLORER_DATES_TELEMETRY_INTERVAL_MS;

    createTestMock({
        explorerDates: {
            enableTelemetry: true
        }
    });
    const provider2 = new FileDateDecorationProvider();
    const context2 = createExtensionContext();

    console.log('📊 Initializing provider with telemetry enabled (config opt-in)...');
    await provider2.initializeAdvancedSystems(context2);

    for (const file of testFiles) {
        const uri = VSCodeUri.file(`${workspaceRoot}/${file}`);
        try {
            await provider2.provideFileDecoration(uri);
        } catch {}
    }

    const metrics2 = provider2.getMetrics().allocationTelemetry;
    console.log('📈 Allocation metrics (config opt-in):', metrics2);

    await provider2.dispose();
    // Debug: show active handles so we can identify lingering timers that prevent
    // the Node process from exiting when run under the suite runner.
    try {
        const handles = (process._getActiveHandles && process._getActiveHandles()) || [];
        console.log('DEBUG activeHandles count=', handles.length);
        for (const h of handles) {
            try {
                const name = h && h.constructor && h.constructor.name;
                let info = `${name}`;
                if (name === 'Socket') {
                    info += ` fd=${h._handle && h._handle.fd}`;
                    info += ` local=${h.localAddress || ''}:${h.localPort || ''}`;
                    info += ` remote=${h.remoteAddress || ''}:${h.remotePort || ''}`;
                } else if (name === 'WriteStream') {
                    info += ` fd=${h.fd || (h._handle && h._handle.fd) || '?'} path=${h.path || ''}`;
                }
                console.log('  -', info);
            } catch (inner) {
                console.log('  - handle: (unreachable details)', inner && inner.message);
            }
        }
    } catch (e) {
        console.log('DEBUG activeHandles: unavailable', e && e.message);
    }

    console.log('✅ Telemetry test complete');
    // Force exit to ensure the test runner (spawnSync) does not hang due to
    // lingering handles (stdout/stderr or platform-specific drivers).
    require('./helpers/forceExit').scheduleExit(0, 0);
}

testTelemetry().catch(error => {
    console.error('❌ Test failed:', error);
    require('./helpers/forceExit').scheduleExit(0, 1);
});
