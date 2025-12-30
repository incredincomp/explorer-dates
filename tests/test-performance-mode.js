#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createMockVscode, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');

const mockInstall = createMockVscode();
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

async function main() {
    try {
        await verifyPerformanceModeSkipsWatchers();
        await verifyRuntimeToggle();
        await verifyGitAndAdvancedSystemsDisabled();
        await verifyStatusBarIntegrationDisabled();
        console.log('🎉 Performance mode coverage completed successfully');
    } catch (error) {
        console.error('❌ Performance mode tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main();
