#!/usr/bin/env node

/**
 * Tests for Smart Watcher Fallback System
 */

const { createTestMock } = require('./helpers/mockVscode');

// Set up mock vscode
const { vscode } = createTestMock();
global.vscode = vscode;

console.log('Smart Watcher Fallback Test Suite');

// Mock logger for testing
const mockLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

// Mock module resolution for logger
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === './logger') {
        return { getLogger: () => mockLogger };
    }
    if (id === './utils/pathUtils') {
        return { normalizePath: (path) => path };
    }
    return originalRequire.apply(this, arguments);
};

// Now require the smart watcher fallback
const { SmartWatcherFallback, LegacyFileWatcher } = require('../src/smartWatcherFallback');

// Test functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

async function runTests() {
    console.log('Running Smart Watcher Fallback tests...');
    let passed = 0;
    let failed = 0;

    // Test 1: Basic creation and disposal
    try {
        const fallback = new SmartWatcherFallback({ logger: mockLogger });
        assert(fallback, 'SmartWatcherFallback should be created');
        assert(!fallback._disposed, 'Should not be disposed initially');
        fallback.dispose();
        assert(fallback._disposed, 'Should be disposed after dispose()');
        console.log('✅ Basic creation and disposal');
        passed++;
    } catch (error) {
        console.error('❌ Basic creation and disposal:', error.message);
        failed++;
    }

    // Test 2: Native watcher creation
    try {
        const fallback = new SmartWatcherFallback({ logger: mockLogger });
        const watcher = await fallback.createWatcherWithFallback('**/*.js');
        assert(watcher, 'Watcher should be created');
        assert(typeof watcher.onDidChange === 'function', 'Should have onDidChange');
        assert(typeof watcher.onDidCreate === 'function', 'Should have onDidCreate');  
        assert(typeof watcher.onDidDelete === 'function', 'Should have onDidDelete');
        watcher.dispose();
        fallback.dispose();
        console.log('✅ Native watcher creation');
        passed++;
    } catch (error) {
        console.error('❌ Native watcher creation:', error.message);
        failed++;
    }

    // Test 3: Fallback on native failure
    try {
        const originalCreateWatcher = vscode.workspace.createFileSystemWatcher;
        vscode.workspace.createFileSystemWatcher = () => {
            throw new Error('Native watcher not supported');
        };

        let fallbackActivated = false;
        const testLogger = {
            debug: () => {},
            info: (msg) => {
                if (msg.includes('fallback activated')) {
                    fallbackActivated = true;
                }
            },
            warn: () => {},
            error: () => {}
        };

        const fallback = new SmartWatcherFallback({ logger: testLogger });
        const watcher = await fallback.createWatcherWithFallback('**/*.js');
        
        assert(watcher, 'Fallback watcher should be created');
        assert(watcher instanceof LegacyFileWatcher, 'Should be LegacyFileWatcher');
        assert(fallbackActivated, 'Fallback should be activated');
        
        watcher.dispose();
        fallback.dispose();
        vscode.workspace.createFileSystemWatcher = originalCreateWatcher;
        console.log('✅ Fallback on native failure');
        passed++;
    } catch (error) {
        console.error('❌ Fallback on native failure:', error.message);
        failed++;
    }

    // Test 4: Platform detection
    try {
        const originalEnv = process.env;
        
        process.env = { ...originalEnv, WSL_DISTRO_NAME: 'Ubuntu' };
        assert(SmartWatcherFallback.platformRequiresFallback(), 'Should detect WSL');
        
        process.env = { ...originalEnv, DOCKER_CONTAINER: 'true' };
        assert(SmartWatcherFallback.platformRequiresFallback(), 'Should detect Docker');
        
        process.env = originalEnv;
        console.log('✅ Platform detection');
        passed++;
    } catch (error) {
        console.error('❌ Platform detection:', error.message);
        failed++;
    }

    // Test 5: Legacy watcher basic functionality
    try {
        let warningLogged = false;
        const testLogger = {
            debug: () => {},
            info: () => {},
            warn: (msg) => {
                if (msg.includes('legacy file watcher fallback')) {
                    warningLogged = true;
                }
            },
            error: () => {}
        };

        const legacyWatcher = new LegacyFileWatcher({
            pattern: '**/*.js',
            logger: testLogger,
            pollingInterval: 1000
        });

        assert(typeof legacyWatcher.onDidChange === 'function', 'Should have onDidChange');
        assert(typeof legacyWatcher.onDidCreate === 'function', 'Should have onDidCreate');
        assert(typeof legacyWatcher.onDidDelete === 'function', 'Should have onDidDelete');
        assert(warningLogged, 'Should log warning about legacy watcher');
        assert(legacyWatcher._pollingTimer != null, 'Should start polling');

        legacyWatcher.dispose();
        assert(legacyWatcher._disposed, 'Should be disposed');
        assert(legacyWatcher._pollingTimer === null, 'Timer should be cleared');
        console.log('✅ Legacy watcher basic functionality');
        passed++;
    } catch (error) {
        console.error('❌ Legacy watcher basic functionality:', error.message);
        failed++;
    }

    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
        process.exit(1);
    } else {
        console.log('All Smart Watcher Fallback tests passed! ✅');
    }
}

// Run tests
if (require.main === module) {
    runTests().catch(console.error);
}