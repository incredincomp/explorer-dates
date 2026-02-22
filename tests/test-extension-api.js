const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

const mock = createTestMock();
const { vscode, configValues, workspaceRoot } = mock;

const { ExtensionApiManager } = require('../src/extensionApi');

async function testApiEnableDisable() {
    console.log('🔬 Testing Extension API enable/disable and plugin controls...');

    // Start with API enabled and external plugins allowed
    configValues['explorerDates.enableExtensionApi'] = true;
    configValues['explorerDates.allowExternalPlugins'] = true;

    const manager = new ExtensionApiManager();

    // API should report usable
    assert.strictEqual(manager._isApiEnabled(), true, 'API should be enabled');
    assert.strictEqual(manager._allowsExternalPlugins(), true, 'External plugins should be allowed');

    // getFileDecorations should work (returns array) for an existing file
    const decorations = await manager.getFileDecorations([path.join(workspaceRoot, 'package.json')]);
    assert.ok(Array.isArray(decorations), 'getFileDecorations should return an array');

    // Plugin registration should succeed when allowed
    let activated = false;
    const plugin = {
        name: 'test-plugin',
        version: '0.1.0',
        activate: () => { activated = true; }
    };

    const registered = manager.registerPlugin('test-plugin', plugin);
    assert.strictEqual(registered, true, 'Plugin should register when external plugins are allowed');
    assert.strictEqual(activated, true, 'Plugin activate should be called on registration');
    const regList = manager.getRegisteredPlugins();
    assert.ok(regList.some(p => p.id === 'test-plugin'), 'Registered plugin should appear in list');

    // Now disallow external plugins at runtime
    configValues['explorerDates.allowExternalPlugins'] = false;
    vscode.workspace.onDidChangeConfiguration && vscode.workspace.onDidChangeConfiguration(() => {});
    // Fire a config change so listeners pick it up
    if (typeof global !== 'undefined' && global._testFireConfigChange) global._testFireConfigChange('explorerDates', 'explorerDates.allowExternalPlugins');

    // Try to register another plugin - should fail
    const plugin2 = { name: 'p2', version: '0.1.0', activate: () => {} };
    const registered2 = manager.registerPlugin('p2', plugin2);
    assert.strictEqual(registered2, false, 'Plugin registration should be rejected when external plugins are disallowed');

    // Now disable the entire API
    configValues['explorerDates.enableExtensionApi'] = false;
    if (typeof global !== 'undefined' && global._testFireConfigChange) global._testFireConfigChange('explorerDates', 'explorerDates.enableExtensionApi');

    // API calls should return non-usable results
    const decorationsWhenDisabled = await manager.getFileDecorations([path.join(workspaceRoot, 'package.json')]);
    assert.ok(Array.isArray(decorationsWhenDisabled), 'getFileDecorations still returns array when disabled');
    assert.strictEqual(decorationsWhenDisabled.length, 0, 'No decorations should be returned when API disabled');

    const registerWhenDisabled = manager.registerPlugin('p3', plugin2);
    assert.strictEqual(registerWhenDisabled, false, 'Register should fail when API disabled');

    manager.dispose();
    console.log('  ✓ Extension API enable/disable and plugin controls');
}

async function testPluginLifecycle() {
    console.log('🔬 Testing plugin lifecycle (activate/deactivate)...');

    configValues['explorerDates.enableExtensionApi'] = true;
    configValues['explorerDates.allowExternalPlugins'] = true;

    const manager = new ExtensionApiManager();
    let activated = false;
    let deactivated = false;

    const plugin = {
        name: 'lifecycle-plugin',
        version: '0.0.1',
        activate: () => { activated = true; },
        deactivate: () => { deactivated = true; }
    };

    const ok = manager.registerPlugin('lifecycle-plugin', plugin);
    assert.strictEqual(ok, true, 'Plugin should register successfully');
    assert.strictEqual(activated, true, 'Plugin activate should be called');

    // Unregister should call deactivate and remove from registry
    const unregistered = manager.unregisterPlugin('lifecycle-plugin');
    assert.strictEqual(unregistered, true, 'Plugin should unregister successfully');
    assert.strictEqual(deactivated, true, 'Plugin deactivate should be called');

    // Unregistering again should return false
    const secondUnregister = manager.unregisterPlugin('lifecycle-plugin');
    assert.strictEqual(secondUnregister, false, 'Double-unregister should be no-op');

    manager.dispose();
    console.log('  ✓ Plugin lifecycle validated');
}

async function testDecorationProviderErrorHandling() {
    console.log('🔬 Testing decoration provider error handling (provider throws)...');

    configValues['explorerDates.enableExtensionApi'] = true;
    configValues['explorerDates.allowExternalPlugins'] = true;

    const manager = new ExtensionApiManager();

    // Provider that throws
    const badProvider = {
        provideDecoration: async () => { throw new Error('boom'); }
    };

    // Provider that succeeds and appends a marker
    const goodProvider = {
        provideDecoration: async (uri, stat, currentDecoration) => {
            return { badge: `${currentDecoration.badge} • OK` };
        }
    };

    const r1 = manager.registerDecorationProvider('bad', badProvider);
    const r2 = manager.registerDecorationProvider('good', goodProvider);
    assert.strictEqual(r1, true, 'Bad provider should register');
    assert.strictEqual(r2, true, 'Good provider should register');

    // Call getDecorationForFile - ensure it does not throw and includes good provider output
    const dec = await manager.getDecorationForFile(VSCodeUri.file(path.join(workspaceRoot, 'package.json')));
    assert.ok(dec, 'Decoration should be returned even if one provider throws');
    assert.ok(dec.badge && dec.badge.includes('OK'), 'Good provider should have modified the badge');

    manager.unregisterDecorationProvider('bad');
    manager.unregisterDecorationProvider('good');
    manager.dispose();

    console.log('  ✓ Decoration provider error handling validated');
}

async function run() {
    try {
        await testApiEnableDisable();
        await testPluginLifecycle();
        await testDecorationProviderErrorHandling();
        console.log('\n✅ Extension API tests passed');
        process.exitCode = 0;
    } catch (err) {
        console.error('\n❌ Extension API tests failed:', err);
        process.exitCode = 1;
    } finally {
        mock.dispose();
        scheduleExit();
    }
}

if (require.main === module) run();

module.exports = { testApiEnableDisable };
