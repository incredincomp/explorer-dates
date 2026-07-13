#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');
const packageJsonPath = path.join(repoRoot, 'package.json');
const npmRunPattern = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectWorkflowScripts() {
    const entries = fs.readdirSync(workflowsDir).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml')).sort();
    const scripts = [];

    for (const entry of entries) {
        const fullPath = path.join(workflowsDir, entry);
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const match of content.matchAll(npmRunPattern)) {
            scripts.push({
                script: match[1],
                workflow: entry
            });
        }
    }

    return scripts;
}

function main() {
    const pkg = readJson(packageJsonPath);
    const definedScripts = new Set(Object.keys(pkg.scripts || {}));
    const workflowScripts = collectWorkflowScripts();
    const missing = workflowScripts.filter(({ script }) => !definedScripts.has(script));

    assert(workflowScripts.length > 0, 'Expected at least one `npm run <script>` reference in workflows');
    assert.deepStrictEqual(
        missing,
        [],
        `Missing npm scripts referenced by workflows:\n${missing.map((item) => `- ${item.script} (${item.workflow})`).join('\n')}`
    );

    require('./test-public-pr-ci-contract.js');

    console.log(`✅ Workflow contract validated: ${workflowScripts.length} npm run references map to package.json scripts.`);
}

main();
