'use strict';
const assert = require('assert');
const { resolveFilesystem, resolveFreshness } = require('../src/utils/freshnessResolver');
(async () => {
    const now = Date.now();
    assert.strictEqual(resolveFilesystem({ scheme: 'file' }, { mtime: now - 1000, __source: 'native-fs' }, now).source, 'native-fs');
    for (const mtime of [undefined, null, 'invalid', NaN, Infinity, 0, now + 10 * 60 * 1000]) assert.strictEqual(resolveFilesystem({ scheme: 'file' }, { mtime, __source: 'native-fs' }, now).timestamp, undefined);
    assert.strictEqual(resolveFilesystem({ scheme: 'synthetic' }, { mtime: now - 1000 }, now).source, 'unknown');
    assert.strictEqual(resolveFilesystem({ scheme: 'synthetic' }, { mtime: now - 1000, trusted: true }, now).source, 'workspace-fs');
    const result = await resolveFreshness({ uri: { scheme: 'file' }, stat: { mtime: now - 2000, __source: 'native-fs' }, provider: { _getGitRecencyTimestamp: async () => { throw new Error('git down'); } }, now });
    assert.strictEqual(result.timestamp, now - 2000);
    console.log('test-freshness-resolver-contract: ok');
})().catch((error) => { console.error(error); process.exitCode = 1; });
