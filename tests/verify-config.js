#!/usr/bin/env node

/**
 * Ensures every contributed configuration key is referenced somewhere
 * outside of the configuration block (docs or code). Prevents stale settings
 * from shipping to users.
 */

const fs = require('fs');
const path = require('path');
const { createMockVscode, createExtensionContext } = require('./helpers/mockVscode');

const repoRoot = path.resolve(__dirname, '..');
const pkg = require('../package.json');

const CONFIG_KEYS = Object.keys(pkg?.contributes?.configuration?.properties || {});
const ALLOW_PACKAGE_ONLY = new Set([
    'explorerDates.enableContextMenu' // consumed entirely via when-clause bindings
]);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist']);
const fileCache = new Map();

function collectFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) {
            continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
}

function getFileContent(filePath) {
    if (!fileCache.has(filePath)) {
        fileCache.set(filePath, fs.readFileSync(filePath, 'utf8'));
    }
    return fileCache.get(filePath);
}

function fileReferencesKey(filePath, longKey, shortKeyRegex) {
    const content = getFileContent(filePath);
    return content.includes(longKey) || shortKeyRegex.test(content);
}

function verifyTemplateKeys() {
    let mockInstall;
    try {
        mockInstall = createMockVscode();
        const { WorkspaceTemplatesManager } = require('../src/workspaceTemplates');
        const manager = new WorkspaceTemplatesManager(createExtensionContext());
        const templates = manager.getBuiltInTemplates();
        const validKeys = new Set(CONFIG_KEYS);
        const invalidEntries = [];

        for (const [templateId, template] of Object.entries(templates)) {
            for (const key of Object.keys(template.settings || {})) {
                if (!validKeys.has(key)) {
                    invalidEntries.push({ templateId, key });
                }
            }
        }

        if (invalidEntries.length > 0) {
            console.error('❌ Built-in templates reference unknown configuration keys:');
            invalidEntries.forEach(({ templateId, key }) => {
                console.error(`   - ${templateId}: ${key}`);
            });
            process.exitCode = 1;
        } else {
            console.log('✅ Built-in templates reference only registered configuration keys.');
        }
    } catch (error) {
        console.error('❌ Failed to verify built-in template configuration keys:', error);
        process.exitCode = 1;
    } finally {
        if (mockInstall) {
            mockInstall.dispose();
        }
    }
}

function main() {
    if (CONFIG_KEYS.length === 0) {
        console.log('⚠️  No configuration keys were found in package.json.');
        return;
    }

    const files = collectFiles(repoRoot);
    const results = [];

    for (const key of CONFIG_KEYS) {
        let foundOutsidePackage = false;
        const shortKey = key.split('.').slice(1).join('.') || key;
        const shortKeyRegex = new RegExp(`['"]${shortKey}['"]`);
        for (const filePath of files) {
            if (!fileReferencesKey(filePath, key, shortKeyRegex)) {
                continue;
            }
            const relative = path.relative(repoRoot, filePath);
            if (relative === 'package.json') {
                continue;
            }
            foundOutsidePackage = true;
            break;
        }

        results.push({ key, foundOutsidePackage });
    }

    const missing = results.filter(result => !result.foundOutsidePackage && !ALLOW_PACKAGE_ONLY.has(result.key));
    if (missing.length > 0) {
        console.error('❌ The following configuration keys are only declared in package.json and never referenced elsewhere:');
        missing.forEach(result => console.error(`   - ${result.key}`));
        console.error('Please remove them or wire them up before publishing.');
        process.exitCode = 1;
    } else {
        console.log(`✅ Verified ${results.length} Explorer Dates configuration keys are referenced in code or docs.`);
    }

    verifyTemplateKeys();
}

main();
