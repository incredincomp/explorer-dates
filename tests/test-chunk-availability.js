#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Core production chunks that must exist in both node and web builds
const REQUIRED_CHUNKS = [
    'onboarding',
    'onboardingAssets',
    'analysis',
    'reporting',
    'templates',
    'workspaceIntelligence',
    'incrementalWorkers',
    'extensionApi',
    'advancedCache',
    'batchProcessor'
];

const MIN_CHUNK_SIZE_BYTES = 512;
const EXPORT_SIGNATURES = ['module.exports', '.exports='];

function chunkPath(chunkName, target) {
    const base = path.join(__dirname, '..', 'dist', target);
    return path.join(base, `${chunkName}.js`);
}

function assertChunkHealthy(chunkName, targetLabel, targetDir) {
    const filePath = chunkPath(chunkName, targetDir);
    const exists = fs.existsSync(filePath);
    assert.ok(
        exists,
        `Missing ${targetLabel} chunk artifact: ${filePath} (run "npm run package-chunks")`
    );

    const stats = fs.statSync(filePath);
    assert.ok(
        stats.size >= MIN_CHUNK_SIZE_BYTES,
        `${targetLabel} chunk ${chunkName} appears empty (${stats.size} bytes): ${filePath}`
    );

    const contents = fs.readFileSync(filePath, 'utf8');
    const hasExportSignature = EXPORT_SIGNATURES.some((signature) => contents.includes(signature));
    assert.ok(
        hasExportSignature,
        `${targetLabel} chunk ${chunkName} missing export signatures (expected ${EXPORT_SIGNATURES.join(
            ', '
        )})`
    );
}

function assertChunkExists(chunkName) {
    assertChunkHealthy(chunkName, 'node', 'chunks');
    assertChunkHealthy(chunkName, 'web', 'web-chunks');
}

function main() {
    console.log('🔎 Verifying production chunk artifacts...');
    REQUIRED_CHUNKS.forEach(assertChunkExists);
    console.log(`✅ All required chunks present (${REQUIRED_CHUNKS.length})`);
}

if (require.main === module) {
    main();
}

module.exports = { assertChunkExists, REQUIRED_CHUNKS };
