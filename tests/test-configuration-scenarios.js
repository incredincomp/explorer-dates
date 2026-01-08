#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const ENABLE_HANDLE_DIAGNOSTICS = process.env.CONFIG_SCENARIO_DEBUG_HANDLES === '1';
if (!process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES) {
    process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES = '1';
}
const asyncHooks = ENABLE_HANDLE_DIAGNOSTICS ? require('async_hooks') : null;
const {
    createTestMock,
    createExtensionContext,
    VSCodeUri,
    workspaceRoot,
    validateAllChunks,
    validateBuiltChunks
} = require('./helpers/mockVscode');

const configurationProperties = pkg?.contributes?.configuration?.properties || {};
const fsRequestMetadata = ENABLE_HANDLE_DIAGNOSTICS ? new WeakMap() : null;
let fsHook = null;
if (ENABLE_HANDLE_DIAGNOSTICS && asyncHooks) {
    fsHook = asyncHooks.createHook({
        init(asyncId, type, triggerAsyncId, resource) {
            if ((type === 'FSREQPROMISE' || type === 'FSREQCALLBACK') && resource && typeof resource === 'object') {
                const stack = new Error().stack
                    ?.split('\n')
                    .slice(2, 8)
                    .map((line) => line.trim())
                    .join(' | ');
                fsRequestMetadata.set(resource, {
                    asyncId,
                    type,
                    triggerAsyncId,
                    createdAt: Date.now(),
                    stack
                });
            }
        }
    });
    fsHook.enable();
}

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
let activeTimerHandles = new Set();
let timerHandleCounter = 1;
let chunkTimeoutOverridden = false;
let previousChunkTimeout = process.env.EXPLORER_DATES_CHUNK_TIMEOUT;
let workspaceWatchdogOverridden = false;
let previousWorkspaceWatchdogTimeout = process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS;

function configureWorkspaceScanWatchdog() {
    if (!workspaceWatchdogOverridden) {
        previousWorkspaceWatchdogTimeout = process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS;
        workspaceWatchdogOverridden = true;
    }
    process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS = '0';
}

function enableImmediateTimers() {
    // Set shorter chunk timeout for tests
    if (!chunkTimeoutOverridden) {
        previousChunkTimeout = process.env.EXPLORER_DATES_CHUNK_TIMEOUT;
        chunkTimeoutOverridden = true;
    }
    process.env.EXPLORER_DATES_CHUNK_TIMEOUT = '100';
    configureWorkspaceScanWatchdog();
    
    global.setTimeout = (fn, delay = 0, ...args) => {
        if (typeof delay === 'number' && delay > 0) {
            const handle = originalSetTimeout(() => {
                try {
                    if (typeof fn === 'function') {
                        fn(...args);
                    }
                } finally {
                    activeTimerHandles.delete(handle);
                }
            }, delay);
            activeTimerHandles.add(handle);
            return handle;
        }

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
        if (activeTimerHandles.has(handle)) {
            activeTimerHandles.delete(handle);
            return;
        }
        originalClearTimeout(handle);
    };
}

function restoreTimers() {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    activeTimerHandles.clear();
    if (chunkTimeoutOverridden) {
        if (previousChunkTimeout === undefined) {
            delete process.env.EXPLORER_DATES_CHUNK_TIMEOUT;
        } else {
            process.env.EXPLORER_DATES_CHUNK_TIMEOUT = previousChunkTimeout;
        }
        chunkTimeoutOverridden = false;
    }
    if (workspaceWatchdogOverridden) {
        if (previousWorkspaceWatchdogTimeout === undefined) {
            delete process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS;
        } else {
            process.env.EXPLORER_DATES_WORKSPACE_SCAN_WATCHDOG_MS = previousWorkspaceWatchdogTimeout;
        }
        workspaceWatchdogOverridden = false;
    }
}

function normalizeConfigKey(fullKey) {
    if (!fullKey) {
        return fullKey;
    }
    return fullKey.startsWith('explorerDates.') ? fullKey.slice('explorerDates.'.length) : fullKey;
}

function shouldSkipValidation(schema) {
    if (!schema) {
        return false;
    }
    if (schema.deprecationMessage) {
        return true;
    }
    if (typeof schema.markdownDescription === 'string' && /deprecated/i.test(schema.markdownDescription)) {
        return true;
    }
    return false;
}

function summarizeScenarioEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return 'no-entries';
    }
    return entries
        .map((entry) => `${normalizeConfigKey(entry.key)}=${formatValueForLog(entry.value)}`)
        .join(', ');
}

function applyEntryValue(mockInstall, entry) {
    const scope = entry.scope || 'window';
    const globalValue = deepClone(entry.value);
    mockInstall.configValues[entry.key] = globalValue;

    if (scope !== 'application') {
        mockInstall.workspaceConfigValues[entry.key] = deepClone(entry.value);
    }
    if (scope === 'resource') {
        mockInstall.workspaceFolderConfigValues[entry.key] = deepClone(entry.value);
    }
}

function ensureChunkArtifactsAccessible() {
    const sourceStatus = validateAllChunks();
    if (!sourceStatus.success) {
        const details = Object.entries(sourceStatus.errors || {})
            .map(([chunk, message]) => `${chunk}: ${message}`)
            .join('; ');
        throw new Error(
            `Source chunk validation failed (${sourceStatus.loadedCount}/${sourceStatus.totalCount}): ${details}`
        );
    }

    const chunkTargets = [
        { target: 'node', dir: path.join(workspaceRoot, 'dist', 'chunks') },
        { target: 'web', dir: path.join(workspaceRoot, 'dist', 'web-chunks') }
    ];

    const summaries = [];
    for (const { target, dir } of chunkTargets) {
        if (!fs.existsSync(dir)) {
            console.warn(`Skipping ${target} chunk validation (missing ${dir})`);
            summaries.push(`${target}:skipped`);
            continue;
        }
        const status = validateBuiltChunks(target);
        if (!status.success) {
            const details = Object.entries(status.errors || {})
                .map(([chunk, message]) => `${chunk}: ${message}`)
                .join('; ');
            throw new Error(
                `${target} chunk validation failed (${status.loadedCount}/${status.totalCount}): ${details}`
            );
        }
        summaries.push(`${target}:${status.loadedCount}/${status.totalCount}`);
    }

    console.log(
        `Chunk artifacts validated (source:${sourceStatus.loadedCount}/${sourceStatus.totalCount}, ${summaries.join(
            ', '
        )})`
    );
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
    ],
    'explorerDates.security.allowedExtraPaths': [
        {
            label: 'trusted-fixtures',
            value: [
                path.join(workspaceRoot, 'tests', 'fixtures', 'trusted-temp'),
                path.join(workspaceRoot, 'tests', 'artifacts')
            ]
        }
    ]
};

const COMBINED_SCENARIOS = [
    {
        label: 'security-relaxed-profile',
        entries: [
            { key: 'explorerDates.security.enforceWorkspaceBoundaries', value: false },
            { key: 'explorerDates.security.enableBoundaryEnforcement', value: false },
            { key: 'explorerDates.security.allowTestPaths', value: true }
        ]
    },
    {
        label: 'performance-balanced-feature-set',
        entries: [
            { key: 'explorerDates.performanceMode', value: false },
            { key: 'explorerDates.enableAdvancedCache', value: true },
            { key: 'explorerDates.enableWorkspaceIntelligence', value: true },
            { key: 'explorerDates.enableIncrementalWorkers', value: true }
        ]
    },
    {
        label: 'reporting-minimal',
        entries: [
            { key: 'explorerDates.enableReporting', value: false },
            { key: 'explorerDates.enableExportReporting', value: false },
            { key: 'explorerDates.activityTrackingDays', value: 7 },
            { key: 'explorerDates.maxTrackedActivityFiles', value: 0 }
        ]
    }
];

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
    if (typeof value === 'undefined') {
        return 'undefined';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return JSON.stringify(value);
}

function validateScenarioEffect({ mockInstall, entries, scenarioName }) {
    const config = mockInstall.vscode.workspace.getConfiguration('explorerDates');
    for (const entry of entries) {
        if (entry.skipValidation) {
            continue;
        }
        const normalizedKey = normalizeConfigKey(entry.key);
        const inspected = config.inspect(normalizedKey) || {};
        const observedValues = [
            inspected.globalValue,
            inspected.workspaceValue,
            inspected.workspaceFolderValue,
            config.get(normalizedKey)
        ].filter((value) => value !== undefined);
        const hasMatch = observedValues.some((value) => deepEqual(value, entry.value));
        if (!hasMatch) {
            throw new Error(
                `Configuration value mismatch after scenario ${scenarioName}: ${entry.key} -> ${formatValueForLog(
                    observedValues.at(-1)
                )}`
            );
        }
    }
}

function snapshotConfigStores(mockInstall) {
    return {
        config: deepClone(mockInstall.configValues),
        workspace: deepClone(mockInstall.workspaceConfigValues),
        workspaceFolder: deepClone(mockInstall.workspaceFolderConfigValues)
    };
}

function restoreConfigStores(mockInstall, snapshot) {
    const restore = (target, replacement) => {
        for (const key of Object.keys(target)) {
            if (!Object.prototype.hasOwnProperty.call(replacement, key)) {
                delete target[key];
            }
        }
        Object.assign(target, replacement);
    };
    restore(mockInstall.configValues, snapshot.config);
    restore(mockInstall.workspaceConfigValues, snapshot.workspace);
    restore(mockInstall.workspaceFolderConfigValues, snapshot.workspaceFolder);
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

function isChunkLoadError(error) {
    if (!error) {
        return false;
    }
    if (error.code === 'CHUNK_LOAD_FAILED') {
        return true;
    }
    const name = (error.name || '').toLowerCase();
    const message = (error.message || '').toLowerCase();
    return name.includes('chunkloaderror') || message.includes('chunk missing');
}

async function executeCommandWithGuards(vscodeApi, commandId, options = {}) {
    const { args = [], enabled = true, skipReason, tolerateChunkFailures = false } = options;
    if (!enabled) {
        if (skipReason) {
            console.log(`⚠️  Skipping ${commandId}: ${skipReason}`);
        }
        return;
    }
    try {
        await vscodeApi.commands.executeCommand(commandId, ...args);
    } catch (error) {
        if (tolerateChunkFailures && isChunkLoadError(error)) {
            console.warn(`⚠️  Skipping ${commandId}: ${error.message}`);
            return;
        }
        throw error;
    }
}

async function exerciseCoreCommands(vscodeApi, sampleUri) {
    const featureConfig = vscodeApi.workspace.getConfiguration('explorerDates');
    const templatesEnabled = featureConfig.get('enableWorkspaceTemplates', true);
    const reportingEnabled = featureConfig.get('enableExportReporting', featureConfig.get('enableReporting', true));
    const extensionApiEnabled = featureConfig.get('enableExtensionApi', true);

    await executeCommandWithGuards(vscodeApi, 'explorerDates.refreshDateDecorations');
    await executeCommandWithGuards(vscodeApi, 'explorerDates.showCurrentConfig');
    await executeCommandWithGuards(vscodeApi, 'explorerDates.toggleDecorations');
    await executeCommandWithGuards(vscodeApi, 'explorerDates.copyFileDate', { args: [sampleUri] });
    await executeCommandWithGuards(vscodeApi, 'explorerDates.showFileDetails', { args: [sampleUri] });
    await executeCommandWithGuards(vscodeApi, 'explorerDates.openTemplateManager', {
        enabled: templatesEnabled,
        skipReason: 'workspace templates feature disabled'
    });
    await executeCommandWithGuards(vscodeApi, 'explorerDates.generateReport', {
        enabled: reportingEnabled,
        skipReason: 'export reporting disabled',
        tolerateChunkFailures: true
    });
    await executeCommandWithGuards(vscodeApi, 'explorerDates.showApiInfo', {
        enabled: extensionApiEnabled,
        skipReason: 'extension API disabled',
        tolerateChunkFailures: true
    });
}

async function exerciseRuntimeCommands(vscodeApi) {
    const runtimeCommandIds = [
        'explorerDates.applyPreset',
        'explorerDates.configureRuntime',
        'explorerDates.suggestOptimalPreset',
        'explorerDates.showChunkStatus',
        'explorerDates.optimizeBundle',
        'explorerDates.validateTeamConfig'
    ];

    for (const commandId of runtimeCommandIds) {
        try {
            await vscodeApi.commands.executeCommand(commandId);
        } catch (error) {
            throw new Error(`Runtime command ${commandId} failed: ${error.message}`);
        }
    }
}

async function runRuntimeCommandValidation(mockInstall, extension) {
    const context = createExtensionContext();
    const snapshot = snapshotConfigStores(mockInstall);
    let activated = false;

    try {
        await extension.activate(context);
        activated = true;
        await exerciseRuntimeCommands(mockInstall.vscode);
        console.log('Runtime management commands executed successfully.');
    } finally {
        if (activated) {
            await extension.deactivate();
        }
        await disposeContext(context);
        restoreConfigStores(mockInstall, snapshot);
        mockInstall.resetLogs();
    }
}

function getScenarioEntries(scenario) {
    if (scenario.combined) {
        return scenario.entries;
    }
    return [
        {
            key: scenario.key,
            value: deepClone(scenario.value),
            scope: scenario.scope || 'window',
            skipValidation: scenario.skipValidation === true
        }
    ];
}

async function runScenario({ mockInstall, extension, scenario, sampleUri }) {
    const entries = getScenarioEntries(scenario);
    const scenarioName = scenario.combined
        ? `combined -> ${scenario.label}`
        : `${normalizeConfigKey(scenario.key)} -> ${scenario.label}`;
    const entrySummary = summarizeScenarioEntries(entries);
    const configSnapshot = snapshotConfigStores(mockInstall);

    for (const entry of entries) {
        applyEntryValue(mockInstall, entry);
    }

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

        validateScenarioEffect({ mockInstall, entries, scenarioName });

        await exerciseCoreCommands(mockInstall.vscode, sampleUri);

        console.log(`PASS ${scenarioName} (${entrySummary})`);
    } catch (error) {
        console.error(`FAIL ${scenarioName} failed (${entrySummary}): ${error.message}`);
        throw error;
    } finally {
        if (activated) {
            await extension.deactivate();
        }
        await disposeContext(context);
        restoreConfigStores(mockInstall, configSnapshot);
        mockInstall.resetLogs();
    }
}

function buildScenarios() {
    const scenarios = [];
    const coveredKeys = new Set();
    for (const [key, schema] of Object.entries(configurationProperties)) {
        const samples = buildSampleValues(key, schema);
        for (const sample of samples) {
            scenarios.push({
                key,
                label: sample.label,
                value: sample.value,
                scope: schema.scope || 'window',
                skipValidation: shouldSkipValidation(schema)
            });
        }
        coveredKeys.add(key);
    }
    for (const combined of COMBINED_SCENARIOS) {
        scenarios.push({
            combined: true,
            label: combined.label,
            entries: combined.entries.map((entry) => ({
                key: entry.key,
                value: deepClone(entry.value),
                scope: configurationProperties[entry.key]?.scope || 'window',
                skipValidation: shouldSkipValidation(configurationProperties[entry.key])
            }))
        });
        combined.entries.forEach((entry) => coveredKeys.add(entry.key));
    }

    ensureSchemaCoverage(coveredKeys);
    return scenarios;
}

function ensureSchemaCoverage(coveredKeys) {
    const missing = Object.keys(configurationProperties).filter((key) => !coveredKeys.has(key));
    if (missing.length > 0) {
        throw new Error(`Configuration test coverage gap detected. Missing keys: ${missing.join(', ')}`);
    }
}

function describeHandle(handle) {
    if (!ENABLE_HANDLE_DIAGNOSTICS || !handle) {
        return '';
    }
    const type = handle.constructor?.name || typeof handle;
    if (type === 'Socket') {
        const local = handle.localAddress ? `${handle.localAddress}:${handle.localPort}` : 'local:n/a';
        const remote = handle.remoteAddress ? `${handle.remoteAddress}:${handle.remotePort}` : 'remote:n/a';
        const tag =
            handle === process.stdin
                ? 'stdin'
                : handle === process.stdout
                ? 'stdout'
                : handle === process.stderr
                ? 'stderr'
                : 'anonymous';
        return `${type}[${tag}](fd=${handle.fd ?? 'n/a'}, isTTY=${handle.isTTY === true}, ${local} -> ${remote}, destroyed=${handle.destroyed}, readable=${handle.readable}, writable=${handle.writable})`;
    }
    if (type === 'Timeout') {
        return `${type}(active=${!handle._destroyed})`;
    }
    if (type === 'Server') {
        return `${type}(connections=${handle._connections || 0})`;
    }
    if (type === 'ChildProcess') {
        const command = handle.spawnargs?.join(' ') || handle.spawnfile || 'unknown';
        return `${type}(pid=${handle.pid}, connected=${handle.connected}, exitCode=${handle.exitCode ?? 'n/a'}, cmd=${command})`;
    }
    if (type === 'MessagePort') {
        return `${type}(hasRef=${handle.hasRef?.() === true})`;
    }
    return type;
}

function describeRequest(request) {
    if (!ENABLE_HANDLE_DIAGNOSTICS || !request) {
        return '';
    }
    const type = request.constructor?.name || typeof request;
    if (type === 'FSReqPromise') {
        const ctx = request.context || {};
        const details = [];
        const meta = fsRequestMetadata?.get(request);
        if (meta) {
            details.push(`asyncId=${meta.asyncId}`);
            if (meta.stack) {
                details.push(`createdAt=${meta.stack}`);
            }
        }
        if (ctx.oncomplete?.name) {
            details.push(`on=${ctx.oncomplete.name}`);
        }
        if (ctx.path) {
            details.push(`path=${ctx.path}`);
        }
        if (ctx.fd !== undefined) {
            details.push(`fd=${ctx.fd}`);
        }
        if (ctx.promise instanceof Promise) {
            details.push('promise=pending');
        }
        if (ctx.syscall) {
            details.push(`syscall=${ctx.syscall}`);
        }
        return `${type}(${details.join(', ') || 'no-context'})`;
    }
    return type;
}

async function main() {
    enableImmediateTimers();
    const mockInstall = createTestMock();
    ensureChunkArtifactsAccessible();
    const extension = require('../extension');
    const sampleFilePath = path.join(mockInstall.sampleWorkspace, 'fileDateDecorationProvider.js');
    const sampleUri = VSCodeUri.file(sampleFilePath);
    const scenarios = buildScenarios();

    console.log(`Exercising ${scenarios.length} configuration scenarios...`);

    try {
        await runRuntimeCommandValidation(mockInstall, extension);

        for (const scenario of scenarios) {
            await runScenario({ mockInstall, extension, scenario, sampleUri });
        }
        console.log(`Configuration scenarios succeeded (${scenarios.length} variants).`);
    } catch (error) {
        console.error('Configuration scenario tests failed:', error);
        process.exitCode = 1;
    } finally {
        if (ENABLE_HANDLE_DIAGNOSTICS) {
            const pendingFsOps = mockInstall.getActiveFsOperations?.() || [];
            const handles = process._getActiveHandles?.() || [];
            const requests = process._getActiveRequests?.() || [];
            const handleDescriptions = handles.map(describeHandle);
            const interestingHandles = handleDescriptions.filter(
                (desc) => !/^Socket\[(std(?:out|err)|stdin)\]/.test(desc)
            );
            if (pendingFsOps.length > 0) {
                console.log(
                    'Active mock FS stats at config-scenarios exit:',
                    pendingFsOps.map((op) => `${op.path} (age=${Date.now() - op.startedAt}ms)`)
                );
            }

            if (interestingHandles.length > 0) {
                console.log('Active handles at config-scenarios exit:', handleDescriptions);
            } else {
                console.log('Active handles at config-scenarios exit: stdio only');
            }

            if (requests.length > 0) {
                console.log('Active requests at config-scenarios exit:', requests.map(describeRequest));
            }

            const hasHandleLeak = pendingFsOps.length > 0 || interestingHandles.length > 0 || requests.length > 0;
            const shouldForceExit = process.env.CONFIG_SCENARIO_FORCE_EXIT !== '0';
            if (hasHandleLeak || shouldForceExit) {
                const code = typeof process.exitCode === 'number' ? process.exitCode : 0;
                process.exit(code);
            }
        }

        if (!ENABLE_HANDLE_DIAGNOSTICS && process.env.CONFIG_SCENARIO_FORCE_EXIT !== '0') {
            const code = typeof process.exitCode === 'number' ? process.exitCode : 0;
            process.exit(code);
        }
        mockInstall.dispose();
        restoreTimers();
        if (fsHook) {
            fsHook.disable();
        }
    }
}

if (ENABLE_HANDLE_DIAGNOSTICS) {
    main();
} else {
    main().catch((error) => {
        console.error('Configuration scenario tests failed:', error);
        process.exitCode = 1;
    });
}
