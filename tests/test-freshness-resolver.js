#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');

async function runTests() {
    // Test 1: FS timestamp on file scheme
    {
        const mock = createTestMock({
            config: {
                'explorerDates.freshnessSourcePolicy': 'auto'
            }
        });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const uri = mock.vscode.Uri.file('/tmp/example.txt');
            const now = Date.now();
            const stat = { mtime: new Date(now - 36 * 60 * 60 * 1000) };
            const provider = { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) };
            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({ uri, stat, provider, config, workspaceKind: 'desktop' });
            assert.strictEqual(freshness.source, 'fs', 'Expected fs source');
            assert.strictEqual(freshness.bucket, '2d', 'Expected 2d bucket');
            assert.strictEqual(freshness.confidence, 'high', 'Expected high confidence for file scheme');
        } finally {
            mock.dispose();
        }
    }

    // Test 2: Non-file scheme with untrusted mtime -> unknown
    {
        const harness = createWebVscodeMock({
            configValues: {
                freshnessSourcePolicy: 'auto'
            }
        });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const uri = harness.vscode.Uri.file('/workspace/file.txt').with({ scheme: 'vscode-vfs' });
            const now = Date.now();
            const stat = { mtime: new Date(now - 2 * 60 * 1000) };
            const provider = { _getGitRecencyTimestamp: async () => ({ timestampMs: null, available: false }) };
            const config = harness.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({ uri, stat, provider, config, workspaceKind: 'web' });
            assert.strictEqual(freshness.source, 'unknown', 'Expected unknown source for untrusted non-file mtime');
            assert.strictEqual(freshness.bucket, 'unknown', 'Expected unknown bucket for untrusted non-file mtime');
        } finally {
            harness.restore();
        }
    }

    // Test 3: Git fallback with policy override
    {
        const mock = createTestMock({
            config: {
                'explorerDates.freshnessSourcePolicy': 'git'
            }
        });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const uri = mock.vscode.Uri.file('/tmp/example.txt');
            const now = Date.now();
            const stat = { mtime: new Date(now - 5 * 24 * 60 * 60 * 1000) };
            const provider = {
                _getGitRecencyTimestamp: async () => ({
                    timestampMs: now - 5 * 24 * 60 * 60 * 1000,
                    author: 'Test Author',
                    message: 'Test commit'
                })
            };
            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({ uri, stat, provider, config, workspaceKind: 'desktop' });
            assert.strictEqual(freshness.source, 'git', 'Expected git source');
            assert.strictEqual(freshness.confidence, 'medium', 'Expected medium confidence for git');
            assert.strictEqual(freshness.author, 'Test Author', 'Expected author from git');
        } finally {
            mock.dispose();
        }
    }

    // Test 4: GitHub fallback for github scheme
    {
        const mock = createTestMock({
            config: {
                'explorerDates.freshnessSourcePolicy': 'github'
            }
        });
        const originalFetch = global.fetch;
        try {
            global.fetch = async () => ({
                ok: true,
                status: 200,
                json: async () => ([{
                    commit: {
                        author: { name: 'GH Author', date: '2026-02-20T12:00:00Z' },
                        message: 'GH commit'
                    },
                    author: { login: 'gh-user' }
                }])
            });
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const uri = {
                scheme: 'github',
                path: '/owner/repo/path/to/file.txt',
                query: 'ref=main',
                toString() { return 'github://owner/repo/path/to/file.txt?ref=main'; }
            };
            const stat = { mtime: null };
            const provider = { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) };
            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({ uri, stat, provider, config, workspaceKind: 'web' });
            assert.strictEqual(freshness.source, 'github', 'Expected github source');
            assert.strictEqual(freshness.author, 'GH Author', 'Expected author from GitHub');
            assert.strictEqual(freshness.message, 'GH commit', 'Expected message from GitHub');
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }
}

runTests().catch((error) => {
    console.error('freshness resolver tests failed', error);
    process.exitCode = 1;
});
