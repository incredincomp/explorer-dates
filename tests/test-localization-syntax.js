#!/usr/bin/env node

const assert = require('assert');
const { scheduleExit } = require('./helpers/forceExit');
const { createTestMock } = require('./helpers/mockVscode');

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

// Defer requiring the localization module until after the VS Code mock is installed
// This ensures the internal require('vscode') call in the module resolves to the test mock.
const KEYS_TO_CHECK = [
    'clearTelemetryPrompt',
    'migrationDetailsTitle',
    'analysisCommandsDisabled',
    'workspaceTemplatesDisabled',
    'gitAttributionWarning',
    'noOverridesToDocument',
    'overrideNotesHeader'
];

async function testLocale(locale) {
    const mockInstall = createTestMock({ config: { 'explorerDates.locale': locale } });

    try {
        // Ensure a fresh localization instance for this locale
        // Require after installing the mock so the module's 'vscode' dependency resolves to our mock
        const { getLocalization } = require('../src/utils/localization');
        const l10n = getLocalization();

        // Each key should resolve to a string (functions are supported and should return a string)
        for (const key of KEYS_TO_CHECK) {
            let value;
            try {
                // Provide a sample argument for any function-style keys
                if (key === 'migrationDetailsTitle' || key === 'gitAttributionWarning' || key === 'noOverridesToDocument') {
                    value = l10n.getString(key);
                } else if (key === 'overrideNotesHeader') {
                    value = l10n.getString(key);
                } else {
                    value = l10n.getString(key);
                }
            } catch (err) {
                assert.fail(`Localization failed for key ${key} in locale ${locale}: ${err.message}`);
            }

            assert.ok(typeof value === 'string', `Expected string for ${key} in ${locale}`);
            assert.ok(value.length > 0, `Expected non-empty string for ${key} in ${locale}`);
        }

        // Clean up localization instance so next locale starts fresh
        l10n.dispose();
        mockInstall.dispose();
    } catch (err) {
        mockInstall.dispose();
        throw err;
    }
}

async function main() {
    try {
        for (const locale of LOCALES) {
            await testLocale(locale);
            console.log(`✅ Localization keys present for locale: ${locale}`);
        }
        console.log('✅ Localization syntax and key presence checks passed');
    } catch (err) {
        console.error('❌ Localization checks failed:', err);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
}

if (require.main === module) {
    main();
}
