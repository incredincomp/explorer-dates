#!/usr/bin/env node

const assert = require('assert');
const { scheduleExit } = require('./helpers/forceExit');
const {
    getEnvironmentContract,
    resourceIdentity,
    normalizeTimestamp,
    normalizeStat
} = require('../src/filesystem/environmentContract');

function run() {
    const file = { scheme: 'file', path: '/workspace/Readme.md', fsPath: '/workspace/Readme.md' };
    assert.strictEqual(getEnvironmentContract({ uri: file, isWeb: false }).filesystem, 'node.fs');
    assert.strictEqual(getEnvironmentContract({ uri: file, isWeb: false, remoteName: 'ssh-remote' }).filesystem, 'workspace.fs');
    assert.strictEqual(getEnvironmentContract({ uri: file, forceWorkspaceFs: true }).filesystem, 'workspace.fs');
    assert.strictEqual(getEnvironmentContract({ uri: { scheme: 'vscode-vfs', path: '/owner/repo/a.txt' }, isWeb: true }).filesystem, 'workspace.fs');
    assert.strictEqual(getEnvironmentContract({ uri: { scheme: 'custom', path: '/a.txt' } }).provider, 'virtual');

    assert.strictEqual(resourceIdentity({ scheme: 'github', authority: 'github', path: '/owner/repo/A.txt' }), 'github://github/owner/repo/A.txt');
    assert.notStrictEqual(
        resourceIdentity({ scheme: 'github', authority: 'github', path: '/owner/repo/A.txt' }),
        resourceIdentity({ scheme: 'github', authority: 'github', path: '/owner/repo/a.txt' })
    );
    assert.strictEqual(resourceIdentity(file, { platform: 'win32' }), resourceIdentity({ ...file, path: '/WORKSPACE/readme.MD' }, { platform: 'win32' }));
    assert.strictEqual(normalizeTimestamp('2026-07-14T00:00:00Z'), Date.parse('2026-07-14T00:00:00Z'));
    assert.strictEqual(normalizeTimestamp('not-a-date'), null);
    assert.strictEqual(normalizeTimestamp(new Date('invalid')), null);
    assert.strictEqual(normalizeStat({ mtime: '2026-07-14T00:00:00Z' }).mtimeMs, Date.parse('2026-07-14T00:00:00Z'));
    console.log('✅ File Date Awareness environment contract validated');
}

run();
scheduleExit();
