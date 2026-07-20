#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { createTestMock } = require('./helpers/mockVscode');

const NOW = Date.parse('2026-07-19T00:00:00Z');
const recent = new Date(NOW - 2 * 60 * 60 * 1000);
const old = new Date(NOW - 40 * 24 * 60 * 60 * 1000);
const includedPaths = [
    'src/app.js', 'src/node_modules-helper.js', 'README.md', 'package.json',
    '=danger,"<tag>|.js', 'src/recent.ts'
];
const excludedPaths = [
    '.git/config', 'node_modules/pkg/index.js', 'dist/extension.js', 'build/generated.js',
    'out/generated.js', 'coverage/coverage.json', 'test-results/result.xml', 'src/old.js'
];

function file(path, modified, activityCount, evidence) {
    return { path, size: path.length + 10, type: 'source', modified, created: null, activityCount, lastActivity: modified, evidence };
}

async function main() {
    const mock = createTestMock();
    const { ExportReportingManager } = require('../src/exportReporting');
    const { createInclusionPolicy, createSummary, inRange } = require('../src/reporting/reportContract');
    const manager = new ExportReportingManager();
    try {
        const policy = createInclusionPolicy();
        const candidates = [
            ...includedPaths.map(path => file(path, recent, 1, [{ source: 'filesystem', timestamp: recent }])),
            ...excludedPaths.slice(0, 7).map(path => file(path, recent, 1, [{ source: 'watcher', timestamp: recent }])),
            file('src/old.js', old, 1, [{ source: 'git', timestamp: old }])
        ];
        const included = candidates.filter(entry => !policy.isExcluded(entry.path) && inRange(entry.modified, '30d', NOW));
        const excluded = candidates.filter(entry => !included.includes(entry));
        assert.deepStrictEqual(included.map(entry => entry.path), includedPaths);
        assert.deepStrictEqual(excluded.map(entry => entry.path), excludedPaths);
        assert.strictEqual(candidates.length, 14);
        assert.strictEqual(included.length, 6);
        assert.strictEqual(excluded.length, 8);
        assert.strictEqual(policy.isExcluded('src/node_modules-helper.js'), false);
        assert.strictEqual(policy.shouldDescend('dist'), false);

        const summary = createSummary(included);
        assert.strictEqual(summary.totalFiles, 6);
        assert.strictEqual(summary.activitySourceBreakdown.filesystem, 6);
        const before = included.map(entry => entry.path);
        const report = { schemaVersion: 2, generatedAt: new Date(NOW).toISOString(), workspaceName: 'Fixture', timeRange: '30d', files: included, summary };
        const outputs = {
            json: manager.formatReport ? await manager.formatReport(report, 'json') : JSON.stringify(report, null, 2),
            csv: manager.formatAsCSV(report),
            markdown: manager.formatAsMarkdown(report),
            html: manager.formatAsHTML(report)
        };
        assert.deepStrictEqual(included.map(entry => entry.path), before);
        assert(outputs.csv.includes("'=danger") || outputs.csv.includes("'=danger"), 'CSV must neutralize formula paths');
        assert(outputs.markdown.includes('\\|'), 'Markdown must escape pipe');
        assert(outputs.html.includes('&lt;tag&gt;') && !outputs.html.includes('<tag>'), 'HTML must escape hostile path');
        assert(outputs.html.includes('color-scheme: dark'));
        const hashes = Object.fromEntries(Object.entries(outputs).map(([format, value]) => [format, { bytes: Buffer.byteLength(value), sha256: crypto.createHash('sha256').update(value).digest('hex') }]));
        assert.strictEqual(Object.keys(hashes).length, 4);
        console.log(JSON.stringify({ total: 14, included: 6, excluded: 8, hashes }));
    } finally {
        manager.dispose();
        mock.dispose();
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
