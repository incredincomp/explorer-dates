#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { scheduleExit } = require('./helpers/forceExit');
const { createTestMock } = require('./helpers/mockVscode');
const { PROVIDER_METHOD_CONTRACT } = require('./helpers/chunk-contracts');

const COMMANDS_ROOT = path.resolve(__dirname, '..', 'src', 'commands');

function stripComments(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function listCommandFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listCommandFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(full);
        }
    }
    return files;
}

function extractProviderMethods(source) {
    const methods = new Set();
    const cleaned = stripComments(source);

    const direct = /fileDateProvider\s*\??\.\s*([A-Za-z_$][\w$]*)\s*\(/g;
    const bracket = /fileDateProvider\s*\??\.\s*\[\s*['"]([^'"]+)['"]\s*\]\s*\(/g;

    let match;
    while ((match = direct.exec(cleaned)) !== null) {
        methods.add(match[1]);
    }
    while ((match = bracket.exec(cleaned)) !== null) {
        methods.add(match[1]);
    }
    return methods;
}

function instantiateProvider() {
    try {
        const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
        if (typeof FileDateDecorationProvider !== 'function') {
            throw new Error('FileDateDecorationProvider export is not a constructor');
        }
        return new FileDateDecorationProvider();
    } catch (error) {
        const message = error && error.message ? error.message : String(error);
        throw new Error(`Failed to instantiate FileDateDecorationProvider: ${message}`);
    }
}

function collectProviderKeys(provider) {
    if (!provider || (typeof provider !== 'object' && typeof provider !== 'function')) return [];
    const keys = new Set();
    let cursor = provider;
    while (cursor && cursor !== Object.prototype) {
        Object.getOwnPropertyNames(cursor).forEach((k) => keys.add(k));
        cursor = Object.getPrototypeOf(cursor);
    }
    return Array.from(keys).sort();
}

async function run() {
    const mock = createTestMock();
    let provider;
    try {
        provider = instantiateProvider();
    } catch (error) {
        mock.dispose();
        throw error;
    }

    const commandFiles = listCommandFiles(COMMANDS_ROOT);
    const methods = new Set();
    for (const file of commandFiles) {
        const source = fs.readFileSync(file, 'utf8');
        extractProviderMethods(source).forEach((name) => methods.add(name));
    }

    for (const ignored of PROVIDER_METHOD_CONTRACT.ignoreMethods) {
        methods.delete(ignored);
    }

    const missing = [];
    for (const method of Array.from(methods).sort()) {
        const value = provider[method];
        if (typeof value !== 'function') {
            missing.push(method);
        }
    }

    const nestedMissing = [];
    for (const nested of PROVIDER_METHOD_CONTRACT.requiredNested || []) {
        const target = nested.path.reduce((acc, key) => (acc ? acc[key] : undefined), provider);
        if (!target) {
            continue;
        }
        for (const method of nested.methods || []) {
            if (typeof target[method] !== 'function') {
                nestedMissing.push(`${nested.path.join('.')}.${method}`);
            }
        }
    }

    if (missing.length || nestedMissing.length) {
        const available = collectProviderKeys(provider);
        const lines = [];
        lines.push('Provider contract validation failed.');
        if (missing.length) {
            lines.push(`Missing provider methods (${missing.length}): ${missing.join(', ')}`);
        }
        if (nestedMissing.length) {
            lines.push(`Missing nested provider methods (${nestedMissing.length}): ${nestedMissing.join(', ')}`);
        }
        lines.push(`Command files scanned (${commandFiles.length}):`);
        for (const file of commandFiles) {
            lines.push(`- ${path.relative(process.cwd(), file)}`);
        }
        lines.push(`Available provider keys (${available.length}): ${available.join(', ')}`);
        assert.fail(lines.join('\n'));
    }

    mock.dispose();
}

run()
    .catch((error) => {
        process.exitCode = 1;
        throw error;
    })
    .finally(() => {
        scheduleExit();
    });
