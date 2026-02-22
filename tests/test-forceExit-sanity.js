#!/usr/bin/env node

const assert = require('assert');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    console.log('🔧 Running forceExit sanity test');

    const originalExit = process.exit;
    try {
        let called = false;
        let codeArg = undefined;
        process.exit = (code) => {
            called = true;
            codeArg = code;
        };

        // Invoke scheduleExit with a specific code and wait a tick
        scheduleExit(0, 123);
        await new Promise((resolve) => setImmediate(resolve));

        assert.strictEqual(called, true, 'process.exit should have been called by scheduleExit');
        assert.strictEqual(codeArg, 123, 'process.exit should have been called with provided code');

        console.log('✅ forceExit sanity test passed');
    } catch (error) {
        console.error('❌ forceExit sanity test failed:', error);
        process.exitCode = 1;
    } finally {
        process.exit = originalExit;
        // Ensure process exits cleanly after test
        try {
            scheduleExit(0, process.exitCode || 0);
        } catch {
            require('./helpers/forceExit').scheduleExit(0, process.exitCode || 0);
        }
    }
}

if (require.main === module) main();