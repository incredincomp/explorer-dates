#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tests/product-surface/product-surface.json'), 'utf8'));
const mismatches = [];
for (const [file, expected] of Object.entries(manifest.runtimeParity.sourceHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  if (actual !== expected) mismatches.push({ file, expected, actual });
}
for (const file of ['dist/extension.js', 'dist/extension.web.js']) if (!fs.existsSync(path.join(root, file))) mismatches.push({ file, reason: 'missing-production-artifact' });
if (mismatches.length) { console.error(JSON.stringify({ status: 'failed', mismatches }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ status: 'passed', checkedSourceFiles: Object.keys(manifest.runtimeParity.sourceHashes).length, productionArtifacts: ['dist/extension.js', 'dist/extension.web.js'] }, null, 2));
