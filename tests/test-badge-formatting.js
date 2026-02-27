#!/usr/bin/env node

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

function runTests() {
    const baseConfig = createConfig({
        'freshnessShowUnknown': true,
        'badge.sourceLabelMode': 'auto'
    });

    runTest('FS + high confidence hides label', () => {
        const badge = formatBadge('2d', 'fs', baseConfig, 'high');
        assert.strictEqual(badge, '2d');
    });

    runTest('FS + medium confidence shows label', () => {
        const badge = formatBadge('2d', 'fs', baseConfig, 'medium');
        assert.strictEqual(badge, '2d • FS');
    });

    runTest('Git + high confidence shows label', () => {
        const badge = formatBadge('2d', 'git', baseConfig, 'high');
        assert.strictEqual(badge, '2d • Git');
    });

    runTest('GitHub + high confidence shows label', () => {
        const badge = formatBadge('2d', 'github', baseConfig, 'high');
        assert.strictEqual(badge, '2d • GH');
    });

    runTest('Unknown badge stays minimal', () => {
        const badge = formatBadge('unknown', 'unknown', baseConfig, 'low');
        assert.strictEqual(badge, '?');
    });

    runTest('Always mode shows label for fs', () => {
        const config = createConfig({
            'freshnessShowUnknown': true,
            'badge.sourceLabelMode': 'always'
        });
        const badge = formatBadge('today', 'fs', config, 'high');
        assert.strictEqual(badge, 'today • FS');
    });

    runTest('Never mode hides label', () => {
        const config = createConfig({
            'freshnessShowUnknown': true,
            'badge.sourceLabelMode': 'never'
        });
        const badge = formatBadge('today', 'git', config, 'high');
        assert.strictEqual(badge, 'today');
    });

    runTest('Never mode with unknown badge shows only ?', () => {
        const config = createConfig({
            'freshnessShowUnknown': true,
            'badge.sourceLabelMode': 'never'
        });
        const badge = formatBadge('unknown', 'unknown', config, 'low');
        assert.strictEqual(badge, '?');
    });

    runTest('Never mode with suppressed badge returns null', () => {
        const config = createConfig({
            'freshnessShowUnknown': false,
            'badge.sourceLabelMode': 'never'
        });
        const badge = formatBadge('unknown', 'unknown', config, 'low');
        assert.strictEqual(badge, null);
    });
}

runTests();
