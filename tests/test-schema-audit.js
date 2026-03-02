#!/usr/bin/env node

const assert = require('assert'); void assert;
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pkg = require(path.join(repoRoot, 'package.json'));
const configurationProperties = pkg?.contributes?.configuration?.properties || {};
const declaredKeys = new Set(Object.keys(configurationProperties).map(k => k.replace(/^explorerDates\./, '')));

function gatherReferencedKeys() {
    const srcDir = path.join(repoRoot, 'src');
    const testDir = path.join(repoRoot, 'tests');
    const files = [];

    function walk(dir) {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                walk(full);
                continue;
            }
            if (full.endsWith('.js') || full.endsWith('.ts')) {
                files.push(full);
            }
        }
    }

    walk(srcDir);
    walk(testDir);

    const regexAffects = /affectsConfiguration\(['"`]explorerDates\.([a-zA-Z0-9_.-]+)['"`]\)/g;
    const regexGet = /get\(['"`]explorerDates\.([a-zA-Z0-9_.-]+)['"`]\)/g;
    const regexConfigRef = /config\.explorerDates\.([a-zA-Z0-9_.-]+)/g;

    const referenced = new Set();

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        let m;
        while ((m = regexAffects.exec(content))) {
            // ignore calls coming from globalState (these are persisted keys, not user settings)
            const ctx = content.substr(Math.max(0, m.index - 50), 50);
            if (ctx.includes('globalState')) continue;
            referenced.add(m[1]);
        }
        while ((m = regexGet.exec(content))) {
            const ctx = content.substr(Math.max(0, m.index - 50), 50);
            if (ctx.includes('globalState')) continue;
            referenced.add(m[1]);
        }
        while ((m = regexConfigRef.exec(content))) referenced.add(m[1]);
    }

    return referenced;
}

function main() {
    const referenced = gatherReferencedKeys();
    const missing = [];
    for (const key of referenced) {
        if (!declaredKeys.has(key)) missing.push(key);
    }

    if (missing.length > 0) {
        console.error('Schema audit failed: the following keys are referenced in code but not declared in package.json:');
        for (const k of missing) console.error(` - ${k}`);
        process.exitCode = 1;
        throw new Error('Schema audit failure: missing keys referenced in source');
    }

    console.log('✅ Schema audit passed: all referenced config keys declared in package.json');
}

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
}
