#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const {
    REPORT_SCHEMA_VERSION, normalizeTimeRange, createInclusionPolicy, createSummary
} = require('../src/reporting/reportContract');

const mock = createTestMock();
const { ExportReportingManager } = require('../src/exportReporting');
const manager = new ExportReportingManager();

try {
    assert.strictEqual(normalizeTimeRange('full'), 'all');
    assert.deepStrictEqual(createInclusionPolicy().isExcluded('src/node_modules-helper.ts'), false);
    assert.strictEqual(createInclusionPolicy().isExcluded('src\\node_modules\\index.js'), true);

    const files = [
        { path: 'z.js', size: 2, type: 'javascript', modified: new Date('2026-07-19T00:00:00Z'), lastActivity: new Date('2026-07-19T00:00:00Z'), activityCount: 1, evidence: [{ source: 'filesystem', timestamp: new Date('2026-07-19T00:00:00Z') }] },
        { path: '<script>alert(1)</script>|.js', size: 1, type: 'javascript', modified: null, lastActivity: null, activityCount: 0, evidence: [] }
    ];
    const before = files.map(file => file.path);
    const summary = createSummary(files);
    assert.deepStrictEqual(files.map(file => file.path), before, 'summary must not mutate report files');
    assert.strictEqual(summary.activitySourceBreakdown.filesystem, 1);
    assert.strictEqual(summary.mostActiveFiles.length, 1);

    const report = { schemaVersion: REPORT_SCHEMA_VERSION, generatedAt: new Date().toISOString(), workspaceName: 'Fixture', timeRange: '30d', files, summary };
    const html = manager.formatAsHTML(report);
    assert(html.includes('color-scheme: dark'));
    assert(!html.includes('<script>alert(1)</script>'));
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert(manager.formatAsCSV(report).includes('Path,Size'));
    assert(manager.formatAsMarkdown(report).includes('\\|'));
    console.log('✅ Report contract coverage complete');
} finally {
    manager.dispose();
    mock.dispose();
}
