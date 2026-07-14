'use strict';
const assert = require('assert');
const fs = require('fs').promises;
const { resolveFreshness } = require('../src/utils/freshnessResolver');
(async () => {
    const stat = await fs.stat(__filename);
    const result = await resolveFreshness({ uri: { scheme: 'file', path: __filename }, stat: { mtime: stat.mtime, __source: 'native-fs' } });
    assert.ok(Number.isFinite(result.timestamp));
    assert.strictEqual(result.source, 'native-fs');
    console.log('test-node-file-date-integration: ok');
})().catch((error) => { console.error(error); process.exitCode = 1; });
