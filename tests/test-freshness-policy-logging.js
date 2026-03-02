#!/usr/bin/env node

const assert = require('assert');

const { createTestMock } = require('./helpers/mockVscode');

function createUri(filePath) {
    return {
        scheme: 'file',
        fsPath: filePath,
        path: filePath,
        toString() {
            return `file://${filePath}`;
        }
    };
}

function main() {
    const mock = createTestMock();
    const warnCalls = [];
    const debugCalls = [];
    const state = {
        _freshnessWarningReasons: new Set(),
        _logger: {
            warn(message, meta) {
                warnCalls.push({ message, meta });
            },
            debug(message, meta) {
                debugCalls.push({ message, meta });
            }
        }
    };

    try {
        const { FileDateDecorationProviderImpl } = require('../src/chunks/file-date-provider-impl.js');
        const logWarningOnce = FileDateDecorationProviderImpl.prototype._logFreshnessWarningOnce;
        const uri = createUri('/tmp/freshness-policy-test.txt');

        logWarningOnce.call(state, 'no-source', uri, 'auto');
        assert.strictEqual(debugCalls.length, 1, 'auto policy should log at debug level');
        assert.strictEqual(warnCalls.length, 0, 'auto policy should not log at warn level');
        assert.strictEqual(debugCalls[0].meta.policy, 'auto', 'Expected auto policy metadata');
        assert.strictEqual(debugCalls[0].meta.reason, 'no-source', 'Expected no-source reason metadata');

        logWarningOnce.call(state, 'no-source', uri, 'auto');
        assert.strictEqual(debugCalls.length, 1, 'Repeated auto reason should be deduped');

        logWarningOnce.call(state, 'no-source', uri, 'git');
        assert.strictEqual(warnCalls.length, 1, 'git policy should log at warn level');
        assert.strictEqual(warnCalls[0].meta.policy, 'git', 'Expected git policy metadata');

        logWarningOnce.call(state, 'no-source', uri, 'github');
        assert.strictEqual(warnCalls.length, 2, 'github policy should log at warn level');
        assert.strictEqual(warnCalls[1].meta.policy, 'github', 'Expected github policy metadata');

        // Same reason across different policies should not collide in dedupe.
        assert.strictEqual(
            state._freshnessWarningReasons.size,
            3,
            'Dedupe key should include policy and reason'
        );

        console.log('✅ Freshness policy logging behavior tests passed');
    } finally {
        mock.dispose();
    }
}

main();
