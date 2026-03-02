#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');
const { expectMissingBuiltChunkWarning } = require('./helpers/chunk-test-env');

addWarningFilters([
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

expectMissingBuiltChunkWarning({
    chunkName: 'decorationsAdvanced',
    reason: 'provider lifecycle test tolerates missing built chunk'
});
expectMissingBuiltChunkWarning({
    chunkName: 'loggerImpl',
    reason: 'provider lifecycle test tolerates missing built chunk'
});

async function main() {
    const mockInstall = createTestMock();
    const extension = require('../extension');

    const context1 = createExtensionContext();
    try {
        // Activate first time and capture provider instance
        await extension.activate(context1);
        const providerA = mockInstall.registeredProviders.at(-1);
        assert(providerA, 'First provider not registered on activate()');

        let disposeCalledA = false;
        if (providerA && typeof providerA.dispose === 'function') {
            const originalDispose = providerA.dispose.bind(providerA);
            providerA.dispose = async (...args) => {
                disposeCalledA = true;
                return originalDispose(...args);
            };
        }

        // Deactivate and ensure it was disposed
        await extension.deactivate();
        assert(disposeCalledA, 'Provider dispose() was not invoked on deactivate()');
        if ('_isDisposed' in providerA || '_disposed' in providerA) {
            assert(providerA._isDisposed || providerA._disposed, 'Provider was not marked disposed on deactivate()');
        }

        // Ensure background handles are cleaned up to avoid test-suite process hangs
        if ('_refreshTimer' in providerA) {
            assert(!providerA._refreshTimer, 'Periodic refresh timer should be cleared after deactivate()');
        }
        if ('_watcherCleanupTimer' in providerA) {
            assert(!providerA._watcherCleanupTimer, 'Watcher cleanup timer should be cleared after deactivate()');
        }
        if ('_watcherManager' in providerA) {
            assert(!providerA._watcherManager, 'Watcher manager should be disposed on deactivate()');
        }
        if ('_fileWatchers' in providerA) {
            assert(!providerA._fileWatchers || providerA._fileWatchers.size === 0, 'File watchers should be cleared on deactivate()');
        }

        // Activate again with a fresh context and ensure a new provider instance is created
        const context2 = createExtensionContext();
        try {
            await extension.activate(context2);
            const providerB = mockInstall.registeredProviders.at(-1);
            assert(providerB, 'Second provider not registered on re-activate()');
            assert(providerB !== providerA, 'Re-activation reused a disposed provider instance');
            if ('_isDisposed' in providerB || '_disposed' in providerB) {
                assert(!providerB._isDisposed && !providerB._disposed, 'New provider instance is already disposed');
            }

            let disposeCalledB = false;
            if (providerB && typeof providerB.dispose === 'function') {
                const originalDispose = providerB.dispose.bind(providerB);
                providerB.dispose = async (...args) => {
                    disposeCalledB = true;
                    return originalDispose(...args);
                };
            }

            // Clean up
            await extension.deactivate();
            assert(disposeCalledB, 'Provider dispose() was not invoked on deactivate() (second instance)');
            if ('_isDisposed' in providerB || '_disposed' in providerB) {
                assert(providerB._isDisposed || providerB._disposed, 'Provider was not marked disposed on deactivate() (second instance)');
            }

            // Verify background handles cleared for second provider instance as well
            if ('_refreshTimer' in providerB) {
                assert(!providerB._refreshTimer, 'Periodic refresh timer should be cleared after deactivate() (second instance)');
            }
            if ('_watcherCleanupTimer' in providerB) {
                assert(!providerB._watcherCleanupTimer, 'Watcher cleanup timer should be cleared after deactivate() (second instance)');
            }
            if ('_watcherManager' in providerB) {
                assert(!providerB._watcherManager, 'Watcher manager should be disposed on deactivate() (second instance)');
            }
            if ('_fileWatchers' in providerB) {
                assert(!providerB._fileWatchers || providerB._fileWatchers.size === 0, 'File watchers should be cleared on deactivate() (second instance)');
            }
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
