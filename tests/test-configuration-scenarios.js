#!/usr/bin/env node

const path = require('path');
const pkg = require('../package.json');
const {
    createMockVscode,
    createExtensionContext,
    VSCodeUri,
    workspaceRoot
} = require('./helpers/mockVscode');

const configurationProperties = pkg?.contributes?.configuration?.properties || {};

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
let activeTimerHandles = new Set();
let timerHandleCounter = 1;

function enableImmediateTimers() {
    // Set shorter chunk timeout for tests
    process.env.EXPLORER_DATES_CHUNK_TIMEOUT = '100';
    
    global.setTimeout = (fn, delay, ...args) => {
        const handle = timerHandleCounter++;
        activeTimerHandles.add(handle);
        try {
            if (typeof fn === 'function') {
                fn(...args);
            }
        } finally {
            activeTimerHandles.delete(handle);
        }
        return handle;
    };
    global.clearTimeout = (handle) => {
        activeTimerHandles.delete(handle);
    };
}

function restoreTimers() {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    activeTimerHandles.clear();
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
    if (Array.isArray(value)) {
        return value.map(deepClone);
    }
    if (isPlainObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, deepClone(val)]));
    }
    return value;
}

function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }
        return keysA.every((key) => deepEqual(a[key], b[key]));
    }
    return false;
}

const SPECIAL_VALUE_SAMPLES = {
    'explorerDates.workspaceExclusionProfiles': [
        {
            label: 'sample-profile',
            value: {
                '/workspace/project': ['node_modules', 'dist']
            }
        }
    ],
    'explorerDates.customColors': [
        {
            label: 'muted-colors',
            value: {
                veryRecent: '#2ecc71',
                recent: '#f1c40f',
                old: '#e74c3c'
            }
        }
    ],
    'explorerDates.templateSyncPath': [
        {
            label: 'sync-path',
            value: path.join(workspaceRoot, 'tests', 'artifacts', 'templates-sync')
        }
    ]
};

function buildSampleValues(key, schema) {
    if (SPECIAL_VALUE_SAMPLES[key]) {
        return SPECIAL_VALUE_SAMPLES[key].map((entry) => ({
            label: entry.label,
            value: deepClone(entry.value)
        }));
    }

    const samples = [];
    const addSample = (label, value) => {
        if (typeof value === 'undefined') {
            return;
        }
        const candidate = { label, value: deepClone(value) };
        if (!samples.some((sample) => deepEqual(sample.value, candidate.value))) {
            samples.push(candidate);
        }
    };

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        schema.enum.forEach((option) => addSample(`${option}`, option));
        return samples;
    }

    switch (schema.type) {
        case 'boolean':
            addSample('true', true);
            addSample('false', false);
            break;
        case 'number':
        case 'integer':
            if (typeof schema.minimum === 'number') {
                addSample(`min-${schema.minimum}`, schema.minimum);
            }
            if (typeof schema.maximum === 'number') {
                addSample(`max-${schema.maximum}`, schema.maximum);
            }
            if (typeof schema.default === 'number') {
                addSample('default', schema.default);
            }
            break;
        case 'string':
            if (typeof schema.default === 'string') {
                addSample('default', schema.default);
            }
            addSample('custom', schema.default ? `${schema.default}-test` : 'sample-value');
            break;
        case 'array':
            if (Array.isArray(schema.default)) {
                addSample('default', schema.default);
            }
            if (schema.items && Array.isArray(schema.items.enum) && schema.items.enum.length > 0) {
                addSample('single-item', [schema.items.enum[0]]);
            } else {
                addSample('empty', []);
            }
            break;
        case 'object':
            if (schema.default && typeof schema.default === 'object') {
                addSample('default', schema.default);
            }
            addSample('empty', {});
            break;
        default:
            if (typeof schema.default !== 'undefined') {
                addSample('default', schema.default);
            }
    }

    if (samples.length === 0 && typeof schema.default !== 'undefined') {
        addSample('default', schema.default);
    }

    return samples;
}

function formatValueForLog(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return JSON.stringify(value);
}

async function disposeContext(context) {
    for (const disposable of context.subscriptions) {
        if (disposable && typeof disposable.dispose === 'function') {
            try {
                await disposable.dispose();
            } catch {
                // Ignore dispose errors in tests
            }
        }
    }
    context.subscriptions.length = 0;
}

async function exerciseCoreCommands(vscodeApi, sampleUri) {
    await vscodeApi.commands.executeCommand('explorerDates.refreshDateDecorations');
    await vscodeApi.commands.executeCommand('explorerDates.showCurrentConfig');
    await vscodeApi.commands.executeCommand('explorerDates.toggleDecorations');
    await vscodeApi.commands.executeCommand('explorerDates.copyFileDate', sampleUri);
    await vscodeApi.commands.executeCommand('explorerDates.showFileDetails', sampleUri);
    await vscodeApi.commands.executeCommand('explorerDates.openTemplateManager');
    await vscodeApi.commands.executeCommand('explorerDates.generateReport');
    await vscodeApi.commands.executeCommand('explorerDates.showApiInfo');
}

async function runScenario({ mockInstall, extension, scenario, sampleUri }) {
    const scenarioName = `${scenario.key} -> ${scenario.label}`;
    const hadValue = Object.prototype.hasOwnProperty.call(mockInstall.configValues, scenario.key);
    const previousValue = hadValue ? deepClone(mockInstall.configValues[scenario.key]) : undefined;
    mockInstall.configValues[scenario.key] = deepClone(scenario.value);

    const context = createExtensionContext();
    let activated = false;

    try {
        await extension.activate(context);
        activated = true;

        const provider = mockInstall.registeredProviders.at(-1);
        if (!provider) {
            throw new Error('No decoration provider registered');
        }

        const config = mockInstall.vscode.workspace.getConfiguration('explorerDates');
        const decorationsEnabled = config.get('showDateDecorations', true);
        const decoration = await provider.provideFileDecoration(sampleUri);
        if (decorationsEnabled && !decoration) {
            throw new Error('Decoration provider returned empty result');
        }

        await exerciseCoreCommands(mockInstall.vscode, sampleUri);

        console.log(`PASS ${scenarioName} (${formatValueForLog(scenario.value)})`);
    } catch (error) {
        console.error(`FAIL ${scenarioName} failed (${formatValueForLog(scenario.value)}): ${error.message}`);
        throw error;
    } finally {
        if (activated) {
            await extension.deactivate();
        }
        await disposeContext(context);

        if (hadValue) {
            mockInstall.configValues[scenario.key] = deepClone(previousValue);
        } else {
            delete mockInstall.configValues[scenario.key];
        }

        mockInstall.resetLogs();
    }
}

function buildScenarios() {
    const scenarios = [];
    for (const [key, schema] of Object.entries(configurationProperties)) {
        const samples = buildSampleValues(key, schema);
        for (const sample of samples) {
            scenarios.push({
                key,
                label: sample.label,
                value: sample.value
            });
        }
    }
    return scenarios;
}

async function main() {
    enableImmediateTimers();
    const mockInstall = createMockVscode();
    const extension = require('../extension');
    const sampleFilePath = path.join(mockInstall.sampleWorkspace, 'fileDateDecorationProvider.js');
    const sampleUri = VSCodeUri.file(sampleFilePath);
    const scenarios = buildScenarios();

    console.log(`Exercising ${scenarios.length} configuration scenarios...`);

    try {
        for (const scenario of scenarios) {
            await runScenario({ mockInstall, extension, scenario, sampleUri });
        }
        console.log(`Configuration scenarios succeeded (${scenarios.length} variants).`);
    } catch (error) {
        console.error('Configuration scenario tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
        restoreTimers();
    }
}

main();
