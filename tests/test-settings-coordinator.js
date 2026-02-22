#!/usr/bin/env node

const assert = require('assert');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function testAutoScopeGlobalWhenNoWorkspaceFolders() {
    const nodeContext = createExtensionContext(); void nodeContext;
    // explicit empty workspaceFolders to ensure Global scope is chosen
    const mock = createTestMock({ config: {}, workspaceFolders: [] });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const res = await coordinator.updateSetting('maxCacheSize', 123, { scope: 'auto' });
        assert.strictEqual(res.updated, true, 'Expected update to be performed');
        const update = mock.appliedUpdates.find(u => u.key === 'explorerDates.maxCacheSize' && u.target === 'global');
        assert.ok(update, 'Expected update to global scope');
        assert.strictEqual(update.value, 123);
    } finally {
        mock.dispose();
    }
}

async function testAutoScopeWorkspaceWhenWorkspaceFoldersExist() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const workspaceFolders = [{ path: process.cwd(), name: 'root' }];
    const mock = createTestMock({ config: {}, workspaceFolders });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const res = await coordinator.updateSetting('cacheTimeout', 60000, { scope: 'auto' });
        assert.strictEqual(res.updated, true);
        const update = mock.appliedUpdates.find(u => u.key === 'explorerDates.cacheTimeout' && u.target === 'workspace');
        assert.ok(update, 'Expected update to workspace scope');
        assert.strictEqual(update.value, 60000);
    } finally {
        mock.dispose();
    }
}

async function testAutoScopeWorkspaceFolderWhenResourceProvided() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const workspaceFolders = [{ path: process.cwd(), name: 'root' }];
    const mock = createTestMock({ config: {}, workspaceFolders });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const resource = VSCodeUri.file(workspaceFolders[0].path);
        const res = await coordinator.updateSetting('cacheTimeout', 30000, { scope: 'auto', resource });
        assert.strictEqual(res.updated, true);
        const update = mock.appliedUpdates.find(u => u.key === 'explorerDates.cacheTimeout' && u.target === 'workspaceFolder');
        assert.ok(update, 'Expected update to workspaceFolder scope');
        assert.strictEqual(update.value, 30000);
    } finally {
        mock.dispose();
    }
}

async function testSkipUpdateWhenUnchanged() {
    const nodeContext = createExtensionContext(); void nodeContext;
    // ensure no workspace folders so scope resolves to Global for deterministic skip
    const mock = createTestMock({ config: { 'explorerDates.maxCacheSize': 100 }, workspaceFolders: [] });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const res = await coordinator.updateSetting('maxCacheSize', 100, { scope: 'auto' });
        assert.strictEqual(res.updated, false, 'Expected unchanged update to be skipped');
        const update = mock.appliedUpdates.find(u => u.key === 'explorerDates.maxCacheSize');
        assert.ok(!update, 'No update should have been applied');
    } finally {
        mock.dispose();
    }
}

async function testForceUpdateOverridesSkip() {
    const nodeContext = createExtensionContext(); void nodeContext;
    // ensure no workspace folders so scope resolves to Global for deterministic behavior
    const mock = createTestMock({ config: { 'explorerDates.maxCacheSize': 100 }, workspaceFolders: [] });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const res = await coordinator.updateSetting('maxCacheSize', 100, { scope: 'auto', force: true });
        assert.strictEqual(res.updated, true, 'Expected forced update to be performed');
        const update = mock.appliedUpdates.find(u => u.key === 'explorerDates.maxCacheSize');
        assert.ok(update, 'Expected an update despite unchanged value');
    } finally {
        mock.dispose();
    }
}

async function testApplySettingsOrdersAndReturns() {
    const nodeContext = createExtensionContext(); void nodeContext;
    const mock = createTestMock({ config: {} });
    // Require after mock install to ensure 'vscode' is available in require() calls
    const { getSettingsCoordinator } = require('../src/utils/settingsCoordinator');
    try {
        const coordinator = getSettingsCoordinator({ forceNew: true });
        const results = await coordinator.applySettings({ maxCacheSize: 999, cacheTimeout: 12345 }, { scope: 'user' });
        assert.ok(Array.isArray(results) && results.length === 2, 'applySettings should return an array of results');
        const keys = mock.appliedUpdates.map(u => u.key);
        assert.ok(keys.includes('explorerDates.maxCacheSize') && keys.includes('explorerDates.cacheTimeout'));
    } finally {
        mock.dispose();
    }
}

async function main() {
    const suites = [
        ['Auto scope chooses global when no workspace', testAutoScopeGlobalWhenNoWorkspaceFolders],
        ['Auto scope chooses workspace when workspaceFolders exist', testAutoScopeWorkspaceWhenWorkspaceFoldersExist],
        ['Auto scope chooses workspaceFolder when resource provided', testAutoScopeWorkspaceFolderWhenResourceProvided],
        ['Skip update when value unchanged', testSkipUpdateWhenUnchanged],
        ['Force update overrides skip', testForceUpdateOverridesSkip],
        ['applySettings returns ordered results', testApplySettingsOrdersAndReturns]
    ];

    try {
        for (const [label, fn] of suites) {
            await fn();
            console.log(`✅ ${label}`);
        }
        console.log('✅ SettingsCoordinator tests passed');
    } catch (error) {
        console.error('❌ SettingsCoordinator tests failed:', error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().finally(() => {
        scheduleExit();
    });
}
