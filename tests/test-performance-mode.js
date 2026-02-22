#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /Detected existing explorerDates\.resetToDefaults handler; skipping duplicate registration/
]);

const sampleWorkspaceRoot = path.join(__dirname, 'fixtures', 'sample-workspace');
const mockInstall = createTestMock({ sampleWorkspace: sampleWorkspaceRoot });
const { vscode, configValues, workspaceRoot } = mockInstall;

let configChangeListener = null;
vscode.workspace.onDidChangeConfiguration = (listener) => {
    configChangeListener = listener;
    return {
        dispose() {
            if (configChangeListener === listener) {
                configChangeListener = null;
            }
        }
    };
};

const baseConfig = JSON.parse(JSON.stringify(configValues));

function resetConfig(overrides = {}) {
    for (const key of Object.keys(configValues)) {
        delete configValues[key];
    }
    const freshDefaults = JSON.parse(JSON.stringify(baseConfig));
    Object.assign(configValues, freshDefaults, overrides);
}

function fireConfigChange(...keys) {
    if (!configChangeListener) {
        throw new Error('No configuration listener registered');
    }
    const affected = new Set(keys);
    configChangeListener({
        affectsConfiguration(name) {
            return affected.has(name);
        }
    });
}

function clearConfigListener() {
    configChangeListener = null;
}

function createFileUri(relativePath) {
    return VSCodeUri.file(path.join(workspaceRoot, relativePath));
}

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function scenario(name, overrides, runner) {
    resetConfig(overrides);
    try {
        await runner();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}:`, error.message);
        throw error;
    } finally {
        clearConfigListener();
    }
}

async function verifyPerformanceModeSkipsWatchers() {
    await scenario('Performance mode skips file watchers and periodic refresh', {
        'explorerDates.performanceMode': true,
        'explorerDates.badgeRefreshInterval': 5000
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            assert.strictEqual(provider._fileWatcher, undefined, 'File watcher should not initialize in performance mode');
            assert.strictEqual(provider._refreshTimer, null, 'Periodic refresh timer should stay disabled in performance mode');
        } finally {
            await provider.dispose();
        }
    });
}

async function verifyRuntimeToggle() {
    await scenario('Performance mode toggle reconfigures watcher + timer', {
        'explorerDates.performanceMode': false,
        'explorerDates.showDateDecorations': true
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            assert.ok(provider._fileWatcher, 'File watcher should be active when performance mode is off');
            assert.ok(provider._refreshTimer, 'Periodic refresh should be running when performance mode is off');

            configValues['explorerDates.performanceMode'] = true;
            fireConfigChange('explorerDates', 'explorerDates.performanceMode');
            assert.strictEqual(provider._fileWatcher, null, 'Enabling performance mode should dispose the file watcher');
            assert.strictEqual(provider._refreshTimer, null, 'Enabling performance mode should clear the periodic refresh timer');

            configValues['explorerDates.performanceMode'] = false;
            fireConfigChange('explorerDates', 'explorerDates.performanceMode');
            assert.ok(provider._fileWatcher, 'Disabling performance mode should recreate the file watcher');
            assert.ok(provider._refreshTimer, 'Disabling performance mode should restart the periodic refresh timer');
        } finally {
            await provider.dispose();
        }
    });
}

async function verifyGitAndAdvancedSystemsDisabled() {
    await scenario('Performance mode skips git/progressive/advanced systems', {
        'explorerDates.performanceMode': true,
        'explorerDates.showGitInfo': 'both',
        'explorerDates.badgePriority': 'author'
    }, async () => {
        const provider = new FileDateDecorationProvider();
        provider._gitAvailable = true;
        let gitBlameCalls = 0;
        provider._getGitBlameInfo = async () => {
            gitBlameCalls++;
            return null;
        };

        await provider.initializeAdvancedSystems(createExtensionContext());
        assert.strictEqual(provider._advancedCache, null, 'Advanced cache should not initialize in performance mode');
        assert.strictEqual(provider._progressiveLoadingEnabled, false, 'Progressive loading should be disabled in performance mode');
        assert.strictEqual(provider._progressiveLoadingJobs.size, 0, 'No progressive jobs should be scheduled in performance mode');

        const decoration = await provider.provideFileDecoration(createFileUri('package.json'));
        assert.ok(decoration, 'Basic decoration should still be returned in performance mode');
        assert.strictEqual(gitBlameCalls, 0, 'Git operations should be skipped when performance mode is enabled');

        await provider.dispose();
    });
}

async function verifyStatusBarIntegrationDisabled() {
    await scenario('Performance mode disables status bar integration', {
        'explorerDates.performanceMode': true,
        'explorerDates.showStatusBar': true
    }, async () => {
        const statusBarInvocations = [];
        const originalCreateStatusBarItem = vscode.window.createStatusBarItem;
        vscode.window.createStatusBarItem = (alignment, priority) => {
            if (alignment === vscode.StatusBarAlignment.Right && priority === 100) {
                statusBarInvocations.push({ alignment, priority });
            }
            return originalCreateStatusBarItem(alignment, priority);
        };

        const extension = require('../extension');
        const context = createExtensionContext();
        try {
            await extension.activate(context);
            assert.strictEqual(statusBarInvocations.length, 0, 'Status bar should not initialize while performance mode is enabled');
        } finally {
            await extension.deactivate();
            vscode.window.createStatusBarItem = originalCreateStatusBarItem;
        }
    });
}

async function verifyPerformanceMetricsReporting() {
    await scenario('Performance metrics include derived timing data', {
        'explorerDates.performanceMode': false,
        'explorerDates.showDateDecorations': true
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            provider._metrics.gitBlameCalls = 2;
            provider._metrics.gitBlameTimeMs = 5;
            provider._metrics.fileStatCalls = 4;
            provider._metrics.fileStatTimeMs = 20;
            const metrics = provider.getMetrics();
            assert.strictEqual(metrics.performanceTiming.avgGitBlameMs, '2.5', 'Average git blame timing should be derived');
            assert.strictEqual(metrics.performanceTiming.avgFileStatMs, '5.0', 'Average file stat timing should be derived');
            assert.strictEqual(metrics.performanceTiming.gitBlameCalls, 2, 'Git blame calls should be reported');
            assert.strictEqual(metrics.performanceTiming.fileStatCalls, 4, 'File stat calls should be reported');
            assert.ok(Object.prototype.hasOwnProperty.call(metrics.cacheDebugging, 'cacheNamespace'),
                'Cache namespace should be included for diagnostics even if null');
        } finally {
            await provider.dispose();
        }
    });
}

async function verifyRuntimeSettingsAppliedAfterAdd() {
    await scenario('Runtime settings changes (performanceMode + keyboardNavigation) are honored', {
        // Start with accessibility mode enabled so keyboard navigation matters
        'explorerDates.performanceMode': false,
        'explorerDates.accessibilityMode': true,
        'explorerDates.keyboardNavigation': true
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            // Confirm initial state
            assert.strictEqual(provider._performanceMode, false, 'Performance mode should start disabled');
            assert.ok(provider._accessibility, 'Accessibility manager should be initialized when accessibilityMode=true');
            assert.strictEqual(provider._accessibility._keyboardNavigationEnabled, true, 'Keyboard navigation should start enabled');

            // Apply runtime changes as if saved in settings.json
            configValues['explorerDates.performanceMode'] = true;
            configValues['explorerDates.keyboardNavigation'] = false;
            fireConfigChange('explorerDates', 'explorerDates.performanceMode', 'explorerDates.keyboardNavigation');

            // Provider should update performance mode and accessibility manager should reflect the keyboard setting change
            assert.strictEqual(provider._performanceMode, true, 'Performance mode should be enabled after configuration change');
            // Accessibility manager updates its own config via workspace.onDidChangeConfiguration
            assert.strictEqual(provider._accessibility._keyboardNavigationEnabled, false, 'Keyboard navigation should update at runtime');

            // Decorations should still be returned in performance mode; ensure badge present
            const decoration = await provider.provideFileDecoration(createFileUri('package.json'));
            assert.ok(decoration, 'Decoration should still exist after runtime changes');
            assert.ok(decoration.badge, 'Decoration badge should still be present');
        } finally {
            await provider.dispose();
        }
    });

    // Also verify when accessibilityMode is not enabled, keyboardNavigation setting doesn't remove decorations
    await scenario('Runtime changes when accessibilityMode=false do not disable decorations', {
        'explorerDates.performanceMode': false,
        'explorerDates.accessibilityMode': false,
        'explorerDates.keyboardNavigation': false
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            assert.strictEqual(provider._accessibility, null, 'Accessibility manager should not initialize when accessibilityMode=false');

            // Toggle performance mode on and ensure decorations still exist
            configValues['explorerDates.performanceMode'] = true;
            fireConfigChange('explorerDates', 'explorerDates.performanceMode');

            assert.strictEqual(provider._performanceMode, true, 'Performance mode should be enabled after configuration change');
            const decoration = await provider.provideFileDecoration(createFileUri('package.json'));
            assert.ok(decoration, 'Decoration should exist even when accessibility is disabled and keyboardNavigation was set');
        } finally {
            await provider.dispose();
        }
    });
}
void verifyRuntimeSettingsAppliedAfterAdd;

async function verifyColorsAppliedInPerformanceMode() {
    await scenario('Performance mode applies custom colors for decorations', {
        'explorerDates.performanceMode': true,
        'explorerDates.colorScheme': 'custom'
    }, async () => {
        const provider = new FileDateDecorationProvider();
        try {
            const decoration = await provider.provideFileDecoration(createFileUri('package.json'));
            assert.ok(decoration, 'Decoration should exist in performance mode');
            assert.ok(decoration.color, 'Decoration should include a color when using custom color scheme');
            // Accept any of the custom color ids (veryRecent, recent, old) as proof the color system is applied
            assert.ok(String(decoration.color.id).startsWith('explorerDates.customColor.'), `Decoration color id should be a custom color, got: ${decoration.color?.id}`);
        } finally {
            await provider.dispose();
        }
    });
}

async function main() {
    try {
        await verifyPerformanceModeSkipsWatchers();
        await verifyRuntimeToggle();
        await verifyGitAndAdvancedSystemsDisabled();
        await verifyStatusBarIntegrationDisabled();
        await verifyPerformanceMetricsReporting();
        await verifyColorsAppliedInPerformanceMode();
        console.log('🎉 Performance mode coverage completed successfully');
    } catch (error) {
        console.error('❌ Performance mode tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main().finally(scheduleExit);
