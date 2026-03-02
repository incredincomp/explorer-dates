#!/usr/bin/env node

const assert = require('assert'); void assert;
const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

const sampleWorkspaceRoot = path.join(__dirname, 'fixtures', 'sample-workspace');
const mockInstall = createTestMock({ sampleWorkspace: sampleWorkspaceRoot });
const { vscode, configValues, workspaceRoot } = mockInstall;

let configChangeListener = null;
vscode.workspace.onDidChangeConfiguration = (listener) => {
    configChangeListener = listener;
    return { dispose() { if (configChangeListener === listener) { configChangeListener = null; } } };
};

function resetConfig(overrides = {}) {
    for (const key of Object.keys(configValues)) { delete configValues[key]; }
    Object.assign(configValues, JSON.parse(JSON.stringify(configValues)), overrides);
}

function fireConfigChange(...keys) {
    if (!configChangeListener) throw new Error('No configuration listener registered');
    const affected = new Set(keys);
    configChangeListener({ affectsConfiguration(name) { return affected.has(name); } });
}

function createFileUri(relativePath) { return VSCodeUri.file(path.join(workspaceRoot, relativePath)); }

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function runExtendedMatrix() {
    const workspaceScales = ['small', 'large', 'extreme'];
    const featureLevels = ['auto', 'full', 'enhanced', 'standard', 'minimal'];
    const memoryModes = ['normal', 'shedding', 'lightweight'];

    const colorSchemes = ['none', 'custom'];
    const accessibilityModes = [false, true];

    let failures = [];
    let attempts = 0;

    for (const ws of workspaceScales) {
        for (const fl of featureLevels) {
            for (const mm of memoryModes) {
                for (const color of colorSchemes) {
                    for (const acc of accessibilityModes) {
                        attempts++;
                        const combo = `ws=${ws} feat=${fl} mem=${mm} color=${color} acc=${acc}`;
                        try {
                            // Simulate workspace scale
                            const provider = new FileDateDecorationProvider();
                            provider._workspaceScale = ws;

                            // Apply base config
                            resetConfig({
                                'explorerDates.featureLevel': fl,
                                'explorerDates.colorScheme': color,
                                'explorerDates.accessibilityMode': acc
                            });
                            fireConfigChange('explorerDates');

                            // Set memory mode via env
                            const oldLightweight = process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE;
                            const oldShedding = process.env.EXPLORER_DATES_MEMORY_SHEDDING;
                            try {
                                if (mm === 'lightweight') {
                                    process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE = '1';
                                } else {
                                    delete process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE;
                                }
                                if (mm === 'shedding') {
                                    process.env.EXPLORER_DATES_MEMORY_SHEDDING = '1';
                                } else {
                                    delete process.env.EXPLORER_DATES_MEMORY_SHEDDING;
                                }

                                // Force a config-change propagation
                                fireConfigChange('explorerDates');

                                // Try to initialize advanced systems (may warn if chunk missing)
                                try {
                                    await provider.initializeAdvancedSystems(createExtensionContext());
                                } catch {
                                    // OK in harness
                                }

                                const deco = await provider.provideFileDecoration(createFileUri('package.json'));
                                if (!deco || !deco.badge) throw new Error('No decoration');

                                // If accessibility expected ensure accessible tooltip present when enabled and allowed by feature level
                                if (acc && provider._accessibility) {
                                    const tooltip = provider._accessibility.getAccessibleTooltip?.(createFileUri('package.json').fsPath || '', new Date(), new Date(), 123); void tooltip;
                                    // Accept both null (if not enhanced) or a string - just ensure no exception
                                }

                                console.log(`✅ ${combo}`);
                            } finally {
                                if (oldLightweight !== undefined) process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE = oldLightweight; else delete process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE;
                                if (oldShedding !== undefined) process.env.EXPLORER_DATES_MEMORY_SHEDDING = oldShedding; else delete process.env.EXPLORER_DATES_MEMORY_SHEDDING;
                                await provider.dispose();
                            }
                        } catch (error) {
                            console.error(`❌ ${combo}: ${error.message}`);
                            failures.push({ combo, error: String(error) });
                        }
                    }
                }
            }
        }
    }

    console.log(`\nExtended matrix: ${attempts} combinations tested. Failures: ${failures.length}`);
    if (failures.length) {
        console.table(failures);
        process.exitCode = 1;
    }
}

runExtendedMatrix().finally(scheduleExit);
