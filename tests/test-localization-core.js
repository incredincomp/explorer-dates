#!/usr/bin/env node
const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');

// Ensure a fresh mock for this test
const mock = createMockVscode();
// Make the mock available to modules that require('vscode')
global.vscode = mock;

function clearModule(p) {
    try { delete require.cache[require.resolve(p)]; } catch {}
}

(async () => {
    try {
        // Debug: ensure mock and workspace exist before mutation
        console.log('DEBUG: mock present?', !!mock);
        console.log('DEBUG: mock.workspace present?', !!mock.workspace);
        console.log('DEBUG: typeof onDidChangeConfiguration =>', mock.workspace && typeof mock.workspace.onDidChangeConfiguration);

        // Simulate an environment where workspace.onDidChangeConfiguration is missing / not a function
        const original = mock.workspace?.onDidChangeConfiguration;
        if (mock.workspace) mock.workspace.onDidChangeConfiguration = undefined;

        // Clear any previously-loaded chunk module to force new initialization path
        clearModule('../src/chunks/localization-core');

        const { getLocalization } = require('../src/chunks/localization-core');

        // Should not throw and should return a usable localization instance
        const l10n = getLocalization();
        assert.ok(l10n, 'getLocalization() should return an instance');
        assert.strictEqual(l10n.getString('now'), 'now', 'expected "now" translation to exist');

        // Cleanup / restore
        mock.workspace.onDidChangeConfiguration = original;
        console.log('✅ localization-core resilient to missing onDidChangeConfiguration');
        process.exit(0);
    } catch (err) {
        console.error('localization-core test failed:', err);
        process.exit(1);
    } finally {
        mock.dispose();
    }
})();