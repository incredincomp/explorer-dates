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
            assert.strictEqual(freshness.source, 'workspace-fs', 'Expected workspace-fs source');
            assert.strictEqual(freshness.bucket, '2d', 'Expected 2d bucket');
            assert.strictEqual(freshness.confidence, 'trusted', 'Expected trusted confidence for workspace fs');
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
            assert.strictEqual(freshness.confidence, 'heuristic', 'Expected heuristic confidence for optional git');
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

    // Test 5: bucketFromAge pure function — edge cases and all bucket transitions
    {
        const { bucketFromAge } = require('../src/utils/freshnessResolver');
        const thresholds = { nowMinutes: 60, todayHours: 24, twoDays: 2, oneWeek: 7 };

        assert.strictEqual(bucketFromAge(0, thresholds), 'now', '0ms should be now');
        assert.strictEqual(bucketFromAge(30 * 60 * 1000, thresholds), 'now', '30min should be now');
        assert.strictEqual(bucketFromAge(61 * 60 * 1000, thresholds), 'today', '61min should be today');
        assert.strictEqual(bucketFromAge(25 * 60 * 60 * 1000, thresholds), '2d', '25h should be 2d');
        assert.strictEqual(bucketFromAge(3 * 24 * 60 * 60 * 1000, thresholds), '1w', '3d should be 1w');
        assert.strictEqual(bucketFromAge(8 * 24 * 60 * 60 * 1000, thresholds), 'stale', '8d should be stale');
        assert.strictEqual(bucketFromAge(-1, thresholds), 'unknown', 'Negative age should be unknown');
        assert.strictEqual(bucketFromAge(NaN, thresholds), 'unknown', 'NaN should be unknown');
        assert.strictEqual(bucketFromAge(Infinity, thresholds), 'unknown', 'Infinity should be unknown');
    }

    // Test 6: formatBadgeAge maps all buckets to ≤2-char strings
    {
        const { formatBadgeAge } = require('../src/utils/freshnessResolver');

        assert.strictEqual(formatBadgeAge('now'),     '!!', 'now badge should be !!');
        assert.strictEqual(formatBadgeAge('today'),   'T',  'today badge should be T');
        assert.strictEqual(formatBadgeAge('2d'),      '2d', '2d badge should be 2d');
        assert.strictEqual(formatBadgeAge('1w'),      '1w', '1w badge should be 1w');
        assert.strictEqual(formatBadgeAge('stale'),   '~~', 'stale badge should be ~~');
        assert.strictEqual(formatBadgeAge('unknown'), '?',  'unknown badge should be ?');
        // VS Code FileDecoration.badge is limited to 2 Unicode code points
        for (const bucket of ['now', 'today', '2d', '1w', 'stale', 'unknown']) {
            const badge = formatBadgeAge(bucket);
            assert.ok(
                typeof badge === 'string' && [...badge].length <= 2,
                `Badge for '${bucket}' must be ≤ 2 code points, got: '${badge}'`
            );
        }
    }

    // Test 7: formatBadge respects freshnessShowUnknown setting
    {
        const { formatBadge } = require('../src/utils/freshnessResolver');
        const show = { get: (k, d) => k === 'freshnessShowUnknown' ? true  : d };
        const hide = { get: (k, d) => k === 'freshnessShowUnknown' ? false : d };

        assert.strictEqual(formatBadge('unknown', 'unknown', show), '?',   'unknown + showUnknown=true → ?');
        assert.strictEqual(formatBadge('unknown', 'unknown', hide), null,  'unknown + showUnknown=false → null');
        assert.strictEqual(formatBadge('now',   'fs',     show), '!!', 'now bucket → !! badge');
        assert.strictEqual(formatBadge('stale', 'git',    show), '~~', 'stale bucket → ~~ badge');
        // All non-unknown badges must also satisfy the 2-char limit
        for (const bucket of ['now', 'today', '2d', '1w', 'stale']) {
            const badge = formatBadge(bucket, 'fs', show);
            assert.ok(
                badge === null || [...badge].length <= 2,
                `formatBadge('${bucket}') must be ≤ 2 code points, got: '${badge}'`
            );
        }
    }

    // Test 8: compareFreshness ordering
    {
        const { compareFreshness } = require('../src/utils/freshnessResolver');
        const high = { confidence: 'high',   exactTimestamp: 1000 };
        const med  = { confidence: 'medium', exactTimestamp: 2000 };
        const low  = { confidence: 'low',    exactTimestamp: 3000 };

        assert.ok(compareFreshness(null, high) < 0,  'null a → negative');
        assert.ok(compareFreshness(med, null)  > 0,  'null b → positive');
        assert.ok(compareFreshness(high, med)  > 0,  'high confidence ranks above medium');
        assert.ok(compareFreshness(low,  med)  < 0,  'low confidence ranks below medium');
        // Same confidence — older timestamp sorts first
        const older = { confidence: 'medium', exactTimestamp: 500 };
        const newer = { confidence: 'medium', exactTimestamp: 1500 };
        assert.ok(compareFreshness(older, newer) < 0, 'Older timestamp sorts before newer (same confidence)');
        assert.ok(compareFreshness(newer, older) > 0, 'Newer timestamp sorts after older (same confidence)');
    }

    // Test 9: vscode-vfs with github+<hex-json> authority (patch.23 core fix)
    // Verifies decodeVscodeVfsRef() and parseVscodeVfsUri() end-to-end through resolveFreshness.
    // Authority encodes {"v":1,"ref":{"type":4,"id":"release/1.3"}} — a named branch (type 4).
    {
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            let capturedUrl = null;
            global.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    status: 200,
                    json: async () => ([{
                        commit: {
                            author: { name: 'VFS Author', date: '2026-02-10T10:00:00Z' },
                            message: 'fix: vfs commit'
                        },
                        author: { login: 'vfs-user' }
                    }])
                };
            };

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            // authority = "github+" + hex("{"v":1,"ref":{"type":4,"id":"release/1.3"}}")
            const vfsUri = {
                scheme: 'vscode-vfs',
                authority: 'github+7b2276223a312c22726566223a7b2274797065223a342c226964223a2272656c656173652f312e33227d7d',
                path: '/incredincomp/explorer-dates/README.md',
                query: '',
                toString() { return 'vscode-vfs://github+hex/incredincomp/explorer-dates/README.md'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: vfsUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            assert.strictEqual(freshness.source, 'github', 'vscode-vfs + github+hex should resolve via github source');
            assert.strictEqual(freshness.author, 'VFS Author', 'Author should come from GitHub API');
            assert.ok(capturedUrl, 'fetch should have been called with a URL');
            assert.ok(capturedUrl.includes('incredincomp'), 'URL should contain owner from path');
            assert.ok(capturedUrl.includes('explorer-dates'), 'URL should contain repo from path');
            assert.ok(
                capturedUrl.includes('release%2F1.3') || capturedUrl.includes('release/1.3'),
                `URL should contain branch ref decoded from authority hex, got: ${capturedUrl}`
            );
            assert.ok(capturedUrl.includes('README.md'), 'URL should contain file path');
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 10: vscode-vfs with plain 'github' authority (no hex suffix → HEAD ref)
    {
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            let capturedUrl = null;
            global.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    status: 200,
                    json: async () => ([{
                        commit: {
                            author: { name: 'HEAD Author', date: '2026-01-15T08:00:00Z' },
                            message: 'head commit'
                        },
                        author: { login: 'head-user' }
                    }])
                };
            };

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const vfsUriHead = {
                scheme: 'vscode-vfs',
                authority: 'github',
                path: '/myorg/myrepo/src/index.js',
                query: '',
                toString() { return 'vscode-vfs://github/myorg/myrepo/src/index.js'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: vfsUriHead,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            assert.strictEqual(freshness.source, 'github', 'Plain github authority should resolve via github source');
            assert.ok(capturedUrl && capturedUrl.includes('HEAD'), 'Plain github authority should use HEAD as ref');
            assert.ok(capturedUrl.includes('myorg'),  'URL should contain owner');
            assert.ok(capturedUrl.includes('myrepo'), 'URL should contain repo');
            assert.ok(capturedUrl.includes('index.js'), 'URL should contain file path');
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 11: vscode-vfs with non-github authority → github-context-missing
    {
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const nonGithubVfsUri = {
                scheme: 'vscode-vfs',
                authority: 'bitbucket',
                path: '/owner/repo/file.js',
                query: '',
                toString() { return 'vscode-vfs://bitbucket/owner/repo/file.js'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: nonGithubVfsUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            assert.strictEqual(freshness.source, 'unknown', 'Non-github vscode-vfs authority should produce unknown freshness');
            const githubAttempt = (freshness.attempts || []).find(a => a.source === 'github');
            assert.ok(githubAttempt, 'GitHub attempt should be recorded in attempts list');
            assert.strictEqual(githubAttempt.reason, 'github-context-missing', 'Non-github authority → github-context-missing');
        } finally {
            mock.dispose();
        }
    }

    // Test 12: GitHub API returns HTTP 404
    {
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            global.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const githubUri = {
                scheme: 'github',
                path: '/owner/repo/path/to/file.txt',
                query: 'ref=main',
                authority: '',
                toString() { return 'github://owner/repo/path/to/file.txt?ref=main'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: githubUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            const githubAttempt = (freshness.attempts || []).find(a => a.source === 'github');
            assert.ok(githubAttempt, 'GitHub attempt should be recorded on 404');
            assert.strictEqual(githubAttempt.reason, 'github-http-404', 'HTTP 404 should produce github-http-404 reason');
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 13: GitHub fetch throws a network error
    {
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            global.fetch = async () => { throw new Error('ECONNREFUSED'); };

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const githubUri = {
                scheme: 'github',
                path: '/owner/repo/path/file.txt',
                query: 'ref=main',
                authority: '',
                toString() { return 'github://owner/repo/path/file.txt?ref=main'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: githubUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            const githubAttempt = (freshness.attempts || []).find(a => a.source === 'github');
            assert.ok(githubAttempt, 'GitHub attempt should be recorded on network error');
            assert.ok(
                githubAttempt.reason && githubAttempt.reason.startsWith('github-fetch-error'),
                `Network error should produce github-fetch-error:... reason, got: ${githubAttempt.reason}`
            );
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 14: fetch not available in environment → github-fetch-unavailable
    {
        const hadFetch = Object.prototype.hasOwnProperty.call(global, 'fetch');
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            delete global.fetch;

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const githubUri = {
                scheme: 'github',
                path: '/owner/repo/file.txt',
                query: 'ref=main',
                authority: '',
                toString() { return 'github://owner/repo/file.txt?ref=main'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: githubUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            const githubAttempt = (freshness.attempts || []).find(a => a.source === 'github');
            assert.ok(githubAttempt, 'GitHub attempt should be recorded when fetch unavailable');
            assert.strictEqual(githubAttempt.reason, 'github-fetch-unavailable', 'Missing fetch → github-fetch-unavailable');
        } finally {
            if (hadFetch) global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 15: GitHub API returns empty commits array → github-no-timestamp
    {
        const originalFetch = global.fetch;
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'github' } });
        try {
            global.fetch = async () => ({ ok: true, status: 200, json: async () => ([]) });

            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const githubUri = {
                scheme: 'github',
                path: '/owner/repo/file.txt',
                query: 'ref=main',
                authority: '',
                toString() { return 'github://owner/repo/file.txt?ref=main'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: githubUri,
                stat: { mtime: null },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            const githubAttempt = (freshness.attempts || []).find(a => a.source === 'github');
            assert.ok(githubAttempt, 'GitHub attempt should be recorded when commits array is empty');
            assert.strictEqual(githubAttempt.reason, 'github-no-timestamp', 'Empty commits array → github-no-timestamp');
        } finally {
            global.fetch = originalFetch;
            mock.dispose();
        }
    }

    // Test 16: freshnessAllowVirtualFs=true with non-file scheme and trustworthy mtime
    {
        const mock = createTestMock({
            config: {
                'explorerDates.freshnessSourcePolicy': 'auto',
                'explorerDates.freshnessAllowVirtualFs': true
            }
        });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            // 10 minutes old: older than minAge (5 min), not in future, well within maxAge (10 years)
            const mtimeMs = Date.now() - 10 * 60 * 1000;
            const vfsUri = {
                scheme: 'vscode-vfs',
                authority: 'some-authority',
                path: '/workspace/file.js',
                query: '',
                toString() { return 'vscode-vfs://some-authority/workspace/file.js'; }
            };

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri: vfsUri,
                stat: { mtime: new Date(mtimeMs) },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'web'
            });

            assert.strictEqual(freshness.source, 'workspace-fs', 'allowVirtualFs=true with trustworthy mtime should use workspace-fs source');
            assert.strictEqual(freshness.confidence, 'trusted', 'Virtual fs source should have trusted confidence');
        } finally {
            mock.dispose();
        }
    }

    // Test 17: FS mtime far in the future → treated as untrusted → not used as fs source
    {
        const mock = createTestMock({ config: { 'explorerDates.freshnessSourcePolicy': 'auto' } });
        try {
            const { resolveFreshness } = require('../src/utils/freshnessResolver');
            const futureMtime = Date.now() + 30 * 60 * 1000; // 30 min ahead
            const uri = mock.vscode.Uri.file('/tmp/future-file.txt');

            const config = mock.vscode.workspace.getConfiguration('explorerDates');
            const freshness = await resolveFreshness({
                uri,
                stat: { mtime: new Date(futureMtime) },
                provider: { _getGitRecencyTimestamp: async () => ({ timestampMs: null }) },
                config,
                workspaceKind: 'desktop'
            });

            assert.strictEqual(freshness.source, 'unknown', 'Future mtime should produce unknown source');
            const fsAttempt = (freshness.attempts || []).find(a => a.source === 'workspace-fs');
            assert.ok(fsAttempt, 'FS attempt should still be recorded');
            assert.ok(fsAttempt.reason, 'FS attempt should carry a rejection reason');
        } finally {
            mock.dispose();
        }
    }

    console.log('All freshness resolver tests passed ✅');
}

runTests().catch((error) => {
    console.error('freshness resolver tests failed', error);
    process.exitCode = 1;
});
