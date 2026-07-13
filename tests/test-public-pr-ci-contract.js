#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const repoRoot = path.join(__dirname, '..');
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'public-pr-validation.yml');
const packageJsonPath = path.join(repoRoot, 'package.json');
const source = fs.readFileSync(workflowPath, 'utf8');
const workflow = yaml.load(source, { schema: yaml.JSON_SCHEMA });
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function stepsFor(job) {
    return job.steps || [];
}

function runText(step) {
    return typeof step.run === 'string' ? step.run : '';
}

function main() {
    assert(workflow && typeof workflow === 'object', 'Public PR workflow must parse as YAML');
    assert.strictEqual(workflow.name, 'Public PR Validation');
    assert(workflow.on && workflow.on.pull_request, 'Workflow must define pull_request');
    assert.deepStrictEqual(workflow.on.pull_request.branches, ['release/1.3']);
    assert.deepStrictEqual(workflow.on.push.branches, ['release/1.3']);
    assert(workflow.on.workflow_dispatch !== undefined, 'Workflow must support workflow_dispatch');
    assert.deepStrictEqual(workflow.permissions, { contents: 'read' });

    const jobs = Object.values(workflow.jobs || {});
    assert.strictEqual(jobs.length, 1, 'Public PR contract should have one authoritative job');
    const job = jobs[0];
    assert.strictEqual(job['runs-on'], 'ubuntu-latest');
    assert(Number.isInteger(job['timeout-minutes']) && job['timeout-minutes'] > 0, 'Job needs a timeout');
    assert(!('if' in job), 'Draft PRs and ordinary pull requests must not be excluded by a job condition');

    const steps = stepsFor(job);
    const runs = steps.map(runText).join('\n');
    assert(!/continue-on-error\s*:/i.test(source), 'Required validation cannot use continue-on-error');
    assert(!/draft/i.test(source), 'Draft PRs must not be excluded');
    assert(!workflow.on.pull_request.paths && !workflow.on.pull_request['paths-ignore'], 'Source changes must not bypass validation by path');
    assert(source.includes('node-version: 20'), 'Workflow must pin the supported Node version');
    assert(source.includes('cache: npm'), 'Workflow must enable npm caching');

    const requiredCommands = [
        'npm ci',
        'npm run lint',
        'npm run test:critical',
        'npm run test:feature-gates',
        'npm run package-bundle',
        'npm run test:dist-parity',
        'npm run test:bundle',
        'npm run test:verify-bundle',
        'node -r ./tests/helpers/strictConsole.js tests/test-web-bundle-smoke.js',
        'npm run test:suite',
        'git diff --check'
    ];
    for (const command of requiredCommands) {
        assert(runs.includes(command), `Missing required validation command: ${command}`);
    }

    const packageIndex = runs.indexOf('npm run package-bundle');
    const parityIndex = runs.indexOf('npm run test:dist-parity');
    assert(packageIndex >= 0 && parityIndex > packageIndex, 'Production parity must run after package-bundle');
    assert(runs.includes('git diff --name-only'), 'Workflow must check production generation scope');
    assert(runs.includes('git restore --worktree -- dist'), 'Workflow must remove non-authoritative compile output');
    assert(!source.includes('npm publish') && !source.includes('vsce publish'), 'Validation workflow must not publish');

    const definedScripts = new Set(Object.keys(packageJson.scripts || {}));
    const referencedScripts = [...runs.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)].map((match) => match[1]);
    const missingScripts = referencedScripts.filter((script) => !definedScripts.has(script));
    assert.deepStrictEqual(missingScripts, [], `Workflow references nonexistent npm scripts: ${missingScripts.join(', ')}`);

    console.log(`✅ Public PR CI contract validated: ${requiredCommands.length} required commands and structured workflow policy checks passed.`);
}

main();
