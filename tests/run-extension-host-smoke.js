#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { runTests } = require('@vscode/test-electron');

const root = path.resolve(__dirname, '..');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-dates-host-workspace-'));
const resultPath = path.join(workspace, 'host-result.json');
fs.writeFileSync(path.join(workspace, 'README.md'), '# host smoke\n');

async function main() {
    await runTests({
        version: '1.129.0',
        extensionDevelopmentPath: root,
        extensionTestsPath: path.join(root, 'tests', 'extension-host', 'index.js'),
        launchArgs: [workspace, '--disable-gpu', '--disable-workspace-trust'],
        extensionTestsEnv: { HOST_RESULT_PATH: resultPath, EXPLORER_DATES_WEB_DIAG: '1' },
        reuseMachineInstall: true
    });
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    if (!result.selected || !result.activeEditorFallback || result.commandErrors !== 0 || result.privateFormatter) {
        throw new Error(`Extension-host result failed: ${JSON.stringify(result)}`);
    }
    console.log(JSON.stringify({ version: '1.129.0', ...result, cleanTermination: true }));
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
});
