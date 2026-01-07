#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { CHUNK_MAP } = require('../src/shared/chunkMap');
const { expectChunkOrFail, createMockVscode } = require('./helpers/mockVscode');

const workspaceRoot = path.resolve(__dirname, '..');

function loadDevChunk(chunkName) {
    const sourcePath = CHUNK_MAP[chunkName];
    if (!sourcePath) {
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
    const resolved = path.join(workspaceRoot, `${sourcePath}.js`);
    delete require.cache[require.resolve(resolved)];
    const mod = require(resolved);
    return mod?.default || mod;
}

function loadBuiltChunk(chunkName) {
    const resolved = path.join(workspaceRoot, 'dist', 'chunks', `${chunkName}.js`);
    delete require.cache[require.resolve(resolved)];
    const mod = require(resolved);
    return mod?.default || mod;
}

function compareExports(devExport, builtExport, chunkName) {
    const devKeys = Object.keys(devExport || {});
    const builtKeys = Object.keys(builtExport || {});
    // Parity check: dev keys should all exist in built artifact
    devKeys.forEach((key) => {
        assert.ok(
            builtKeys.includes(key),
            `Missing export "${key}" in built chunk ${chunkName}`
        );
    });
}

function main() {
    console.log('🔁 Verifying production parity for core chunks...');
    // Install vscode mock hook for dev chunk imports
    const mockInstall = createMockVscode();
    const required = [
        'analysis',
        'reporting',
        'templates',
        'workspaceIntelligence',
        'incrementalWorkers',
        'extensionApi'
    ];

    required.forEach((chunkName) => {
        expectChunkOrFail(chunkName, true);
        const devExport = loadDevChunk(chunkName);
        const builtExport = loadBuiltChunk(chunkName);
        assert.ok(devExport, `Dev chunk ${chunkName} failed to load`);
        assert.ok(builtExport, `Built chunk ${chunkName} failed to load`);
        compareExports(devExport, builtExport, chunkName);
        console.log(`✅ ${chunkName} dev/built exports aligned`);
    });
    mockInstall.dispose();
}

if (require.main === module) {
    main();
}

module.exports = { loadDevChunk, loadBuiltChunk, compareExports };
