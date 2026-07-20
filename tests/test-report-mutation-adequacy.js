#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { observeCommand } = require('./helpers/commandBehaviorOracle');

async function main() {
    const mutations = [
        ['throws-before-operation', async () => { throw new Error('before operation'); }, 'unhandled-command-failure'],
        ['catches-error-returns-normally', async () => {}, 'false-success', ['error']],
        ['logs-error-returns-normally', async () => {}, 'false-success', [], ['error']],
        ['error-notification-recorded-success', async () => {}, 'false-success', ['error']],
        ['missing-expected-side-effect', async () => {}, 'false-success', [], [], true, false],
        ['nonexistent-private-formatter', async () => { const provider = {}; return provider._formatFileSize(1); }, 'unhandled-command-failure'],
        ['raw-minified-property-error', async () => { throw new TypeError("Cannot read properties of undefined (reading 'a')"); }, 'unhandled-command-failure'],
        ['duplicate-error-notifications', async () => {}, 'swallowed-product-failure', ['custom', 'generic']],
        ['success-then-corrupt-next-invocation', async () => { throw new Error('stale failure state'); }, 'unhandled-command-failure']
    ];
    const results = [];
    for (const [name, invoke, expected, shown = [], logged = [], expectedSideEffect, actualSideEffect] of mutations) {
        const result = await observeCommand({ invoke, errorsShown: shown, errorsLogged: logged, expectedSideEffect, actualSideEffect });
        assert.strictEqual(result.classification, expected, name);
        results.push({ name, classification: result.classification, promiseState: result.promiseState });
    }
    results.forEach(result => process.stdout.write(`${JSON.stringify(result)}\n`));
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
