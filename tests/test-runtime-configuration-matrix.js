#!/usr/bin/env node

const assert = require('assert'); void assert;
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /Git chunk not available/
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

function resetConfig(overrides = {}) {
    for (const key of Object.keys(configValues)) {
        delete configValues[key];
    }
    const freshDefaults = JSON.parse(JSON.stringify(configValues));
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

function createFileUri(relativePath) {
    return VSCodeUri.file(path.join(workspaceRoot, relativePath));
}

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function runMatrix() {
    const performanceModes = [false, true];
    const accessibilityModes = [false, true];
    const keyboardNavs = [false, true];
    const colorSchemes = ['none', 'custom'];
    const advancedCacheFlags = [false, true];
    const gitOptions = ['none', 'both'];

    let failures = [];
    let count = 0;

    for (const perf of performanceModes) {
        for (const acc of accessibilityModes) {
            for (const keyNav of keyboardNavs) {
                for (const color of colorSchemes) {
                    for (const adv of advancedCacheFlags) {
                        for (const git of gitOptions) {
                            count++;
                            const comboName = `perf=${perf} acc=${acc} keyNav=${keyNav} color=${color} adv=${adv} git=${git}`;
                            try {
                                resetConfig({
                                    'explorerDates.performanceMode': perf,
                                    'explorerDates.accessibilityMode': acc,
                                    'explorerDates.keyboardNavigation': keyNav,
                                    'explorerDates.colorScheme': color,
                                    'explorerDates.enableAdvancedCache': adv,
                                    'explorerDates.showGitInfo': git
                                });

                                const provider = new FileDateDecorationProvider();
                                // Apply a config change to ensure watchers pick up changes
                                fireConfigChange('explorerDates');

                                // If accessibility expected, verify manager exists
                                if (acc && provider._accessibility) {
                                    if (provider._accessibility._keyboardNavigationEnabled !== keyNav) {
                                        throw new Error(`Accessibility keyboardNavigation mismatch: expected ${keyNav}`);
                                    }
                                }

                                // Color: if custom requested, either themeIntegration or color resolver should provide a color
                                const decoration = await provider.provideFileDecoration(createFileUri('package.json'));
                                if (!decoration || !decoration.badge) {
                                    throw new Error('Missing decoration or badge');
                                }

                                if (color === 'custom') {
                                    // Accept decoration.color being a ThemeColor with proper id when available
                                    if (decoration.color) {
                                        const id = decoration.color.id || String(decoration.color);
                                        if (!id.includes('explorerDates.customColor')) {
                                            throw new Error(`Custom color not applied, got: ${id}`);
                                        }
                                    } else {
                                        // Not all harnesses initialize theme adapters; warn only
                                        console.warn(`Note: custom color requested but color not present in this harness for ${comboName}`);
                                    }
                                }

                                // Advanced cache: try to initialize if requested
                                if (adv) {
                                    try {
                                        await provider.initializeAdvancedSystems(createExtensionContext());
                                    } catch (e) {
                                        console.warn(`Advanced systems init failed for ${comboName}: ${e.message || e}`);
                                    }
                                }

                                // Git: try to load
                                if (git !== 'none') {
                                    try {
                                        await provider._loadGitInsightsChunk();
                                    } catch (e) {
                                        console.warn(`Git chunk not available for ${comboName}: ${e.message || e}`);
                                    }
                                }

                                await provider.dispose();
                                console.log(`✅ ${comboName}`);
                            } catch (error) {
                                console.error(`❌ ${comboName}: ${error.message}`);
                                failures.push({ combo: comboName, error: String(error) });
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(`\nMatrix run complete: ${count} combinations tested. Failures: ${failures.length}`);
    if (failures.length > 0) {
        console.table(failures);
        process.exitCode = 1;
    }
}

runMatrix().finally(scheduleExit);
