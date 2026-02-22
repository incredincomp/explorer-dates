#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

async function main() {
    const mockInstall = createTestMock();
    const extension = require('../extension');

    const context1 = createExtensionContext();
    try {
        // Activate first time and capture provider instance
        await extension.activate(context1);
        const providerA = mockInstall.registeredProviders.at(-1);
        assert(providerA, 'First provider not registered on activate()');

        // Deactivate and ensure it was disposed
        await extension.deactivate();
        assert(providerA._isDisposed || providerA._disposed, 'Provider was not disposed on deactivate()');

        // Ensure background handles are cleaned up to avoid test-suite process hangs
        assert(!providerA._refreshTimer, 'Periodic refresh timer should be cleared after deactivate()');
        assert(!providerA._watcherCleanupTimer, 'Watcher cleanup timer should be cleared after deactivate()');
        assert(!providerA._watcherManager, 'Watcher manager should be disposed on deactivate()');
        assert(!providerA._fileWatchers || providerA._fileWatchers.size === 0, 'File watchers should be cleared on deactivate()');

        // Activate again with a fresh context and ensure a new provider instance is created
        const context2 = createExtensionContext();
        try {
            await extension.activate(context2);
            const providerB = mockInstall.registeredProviders.at(-1);
            assert(providerB, 'Second provider not registered on re-activate()');
            assert(providerB !== providerA, 'Re-activation reused a disposed provider instance');
            assert(!providerB._isDisposed && !providerB._disposed, 'New provider instance is already disposed');

            // Clean up
            await extension.deactivate();

            // Verify background handles cleared for second provider instance as well
            assert(!providerB._refreshTimer, 'Periodic refresh timer should be cleared after deactivate() (second instance)');
            assert(!providerB._watcherCleanupTimer, 'Watcher cleanup timer should be cleared after deactivate() (second instance)');
            assert(!providerB._watcherManager, 'Watcher manager should be disposed on deactivate() (second instance)');
            assert(!providerB._fileWatchers || providerB._fileWatchers.size === 0, 'File watchers should be cleared on deactivate() (second instance)');
        } finally {
            // ensure second context disposed if needed
        }
    } finally {
        // ensure first context disposed if needed
    }

    console.log('PASS provider-lifecycle-regression');
    mockInstall.dispose();
    scheduleExit();
}

if (require.main === module) {
    main().catch(err => {
        console.error('FAIL', err && err.message);
        process.exitCode = 1;
        scheduleExit();
    });
}

module.exports = { main };
