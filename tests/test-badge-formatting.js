#!/usr/bin/env node
/**
 * Badge formatting tests.
 *
 * VS Code enforces a hard 2-codepoint maximum on FileDecoration.badge.
 * Strings longer than 2 chars are silently dropped with a console warning.
 * All formatBadge() return values MUST be <= 2 characters or null.
 *
 * Source labels cannot appear in badge text due to this constraint.
 * badge.sourceLabelMode controls tooltip source visibility instead.
 */

const assert = require('assert');
const { formatBadge } = require('../src/utils/freshnessResolver');
const { scheduleExit } = require('./helpers/forceExit');

scheduleExit(60000);

function createConfig(values) {
    return {
        get(key, fallback) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                return values[key];
            }
            return fallback;
        }
    };
}

function runTest(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        throw error;
    }
}

function assertBadgeLength(badge, testName) {
    if (badge === null) return;
    const len = [...badge].length;
    assert.ok(len <= 2, `Badge '${badge}' is ${len} codepoints — exceeds VS Code's 2-char limit (test: ${testName})`);
}

function runTests() {
    const baseConfig = createConfig({
        'freshnessShowUnknown': true,
        'badge.sourceLabelMode': 'auto'
    });

    // --- Bucket label shape ---

    runTest('now bucket produces 2-char badge', () => {
        const badge = formatBadge('now', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, '!!');
        assertBadgeLength(badge, 'now bucket');
    });

    runTest('today bucket produces 1-char badge', () => {
        const badge = formatBadge('today', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, 'T');
        assertBadgeLength(badge, 'today bucket');
    });

    runTest('2d bucket produces 2-char badge', () => {
        const badge = formatBadge('2d', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, '2d');
        assertBadgeLength(badge, '2d bucket');
    });

    runTest('1w bucket produces 2-char badge', () => {
        const badge = formatBadge('1w', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, '1w');
        assertBadgeLength(badge, '1w bucket');
    });

    runTest('stale bucket produces 2-char badge', () => {
        const badge = formatBadge('stale', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, '~~');
        assertBadgeLength(badge, 'stale bucket');
    });

    // --- Source variations produce same badge (source goes to tooltip) ---

    runTest('git source produces age-only badge', () => {
        const badge = formatBadge('2d', 'git', baseConfig, 'high');
        assert.strictEqual(badge, '2d');
        assertBadgeLength(badge, 'git source');
    });

    runTest('github source produces age-only badge', () => {
        const badge = formatBadge('2d', 'github', baseConfig, 'high');
        assert.strictEqual(badge, '2d');
        assertBadgeLength(badge, 'github source');
    });

    runTest('fs + medium confidence still age-only badge', () => {
        const badge = formatBadge('2d', 'fs', baseConfig, 'medium');
        assert.strictEqual(badge, '2d');
        assertBadgeLength(badge, 'fs medium');
    });

    // --- Unknown / suppressed ---

    runTest('unknown bucket shows ?', () => {
        const badge = formatBadge('unknown', 'unknown', baseConfig, 'low');
        assert.strictEqual(badge, '?');
        assertBadgeLength(badge, 'unknown');
    });

    runTest('unknown bucket suppressed when showUnknown=false', () => {
        const config = createConfig({ 'freshnessShowUnknown': false, 'badge.sourceLabelMode': 'auto' });
        const badge = formatBadge('unknown', 'unknown', config, 'low');
        assert.strictEqual(badge, null);
    });

    // --- sourceLabelMode has no effect on badge text ---

    runTest('always mode still produces age-only badge', () => {
        const config = createConfig({ 'freshnessShowUnknown': true, 'badge.sourceLabelMode': 'always' });
        const badge = formatBadge('today', 'fs', config, 'high');
        assert.strictEqual(badge, 'T');
        assertBadgeLength(badge, 'always mode');
    });

    runTest('never mode still produces age-only badge', () => {
        const config = createConfig({ 'freshnessShowUnknown': true, 'badge.sourceLabelMode': 'never' });
        const badge = formatBadge('today', 'git', config, 'high');
        assert.strictEqual(badge, 'T');
        assertBadgeLength(badge, 'never mode');
    });

    runTest('never mode with unknown badge shows only ?', () => {
        const config = createConfig({ 'freshnessShowUnknown': true, 'badge.sourceLabelMode': 'never' });
        const badge = formatBadge('unknown', 'unknown', config, 'low');
        assert.strictEqual(badge, '?');
        assertBadgeLength(badge, 'never + unknown');
    });

    runTest('never mode with suppressed badge returns null', () => {
        const config = createConfig({ 'freshnessShowUnknown': false, 'badge.sourceLabelMode': 'never' });
        const badge = formatBadge('unknown', 'unknown', config, 'low');
        assert.strictEqual(badge, null);
    });

    // --- Exhaustive length guard across all buckets x sources ---

    const buckets = ['now', 'today', '2d', '1w', 'stale'];
    const sources = ['fs', 'git', 'github'];
    const confidences = ['high', 'medium', 'low'];
    const modes = ['auto', 'always', 'never'];

    runTest('all bucket/source/confidence/mode combos produce valid badge length', () => {
        for (const bucket of buckets) {
            for (const source of sources) {
                for (const confidence of confidences) {
                    for (const mode of modes) {
                        const config = createConfig({ 'freshnessShowUnknown': true, 'badge.sourceLabelMode': mode });
                        const badge = formatBadge(bucket, source, config, confidence);
                        assertBadgeLength(badge, `${bucket}/${source}/${confidence}/${mode}`);
                    }
                }
            }
        }
    });
}

runTests();
