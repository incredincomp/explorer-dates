#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');

async function main() {
    const mock = createTestMock({ uiKind: process.env.VSCODE_WEB === 'true' ? 2 : 1 });
    try {
        const { ExportReportingManager } = require('../dist/chunks/reporting');
        const calls = [];
        const fs = {
            async writeFile(path) { calls.push(['write', path]); },
            async stat(path) { calls.push(['stat', path]); return { size: 2 }; },
            async rename(from, to) { calls.push(['rename', from, to]); },
            async delete(path) { calls.push(['delete', path]); }
        };
        const manager = new ExportReportingManager({ fileSystem: fs, logger: { error() {}, warn() {}, info() {} } });
        manager.collectFileData = async () => ({ schemaVersion: '1', files: [], summary: { totalFiles: 0 }, timeRange: 'all' });
        manager.formatReport = async () => '{}';
        manager.allowedFormats = ['json'];
        const result = await manager.generateFileModificationReport({ format: 'json', outputPath: process.env.VSCODE_WEB === 'true' ? null : '/tmp/production-report-contract.json' });
        assert.notStrictEqual(result, undefined);
        if (process.env.VSCODE_WEB !== 'true') assert(calls.some(([kind]) => kind === 'rename'), 'desktop artifact must promote a temporary file');
        else await manager.saveReport('{}', null);
        manager.dispose();
        console.log(`✅ production report ${process.env.VSCODE_WEB === 'true' ? 'web' : 'desktop'} contract passed`);
    } finally {
        mock.dispose();
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
