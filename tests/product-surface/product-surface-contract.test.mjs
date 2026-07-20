#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const validator = path.join(root, 'scripts/validate-product-surface.mjs');
const sourceManifest = path.join(root, 'tests/product-surface/product-surface.json');
const base = JSON.parse(fs.readFileSync(sourceManifest, 'utf8'));
const cases = [];
function run(label, mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'product-surface-probe-'));
  const manifest = JSON.parse(JSON.stringify(base));
  mutate(manifest, dir);
  const manifestPath = path.join(dir, 'product-surface.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const command = spawnSync(process.execPath, [validator, '--manifest', manifestPath], { cwd: root, encoding: 'utf8' });
  cases.push({ label, status: command.status, detected: command.status !== 0, output: `${command.stdout}\n${command.stderr}`.slice(-4000) });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.notEqual(command.status, 0, `${label} should fail validation`);
}
run('missing command entry', manifest => { manifest.commands.pop(); });
run('stale command entry', manifest => { manifest.commands.push({ ...manifest.commands[0], id: 'explorerDates.stale' }); });
run('duplicate command entry', manifest => { manifest.commands.push(manifest.commands[0]); });
run('missing setting entry', manifest => { manifest.settings.pop(); });
run('invalid schema value', manifest => { manifest.schemaVersion = 99; });

const undeclaredRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'product-surface-source-probe-'));
fs.cpSync(path.join(root, 'package.json'), path.join(undeclaredRoot, 'package.json'));
fs.cpSync(path.join(root, 'extension.js'), path.join(undeclaredRoot, 'extension.js'));
fs.cpSync(path.join(root, 'src'), path.join(undeclaredRoot, 'src'), { recursive: true });
fs.mkdirSync(path.join(undeclaredRoot, 'tests/product-surface'), { recursive: true });
fs.cpSync(sourceManifest, path.join(undeclaredRoot, 'tests/product-surface/product-surface.json'));
const core = path.join(undeclaredRoot, 'src/commands/coreCommands.js');
fs.appendFileSync(core, "\nregisterCommand('explorerDates.undeclaredProbe', () => {});\n");
const sourceProbe = spawnSync(process.execPath, [validator, '--root', undeclaredRoot], { cwd: root, encoding: 'utf8' });
cases.push({ label: 'undeclared runtime registration', status: sourceProbe.status, detected: sourceProbe.status !== 0, output: `${sourceProbe.stdout}\n${sourceProbe.stderr}`.slice(-4000) });
assert.notEqual(sourceProbe.status, 0, 'undeclared runtime registration should fail validation');
fs.rmSync(undeclaredRoot, { recursive: true, force: true });

const output = { status: 'passed', total: cases.length, detected: cases.filter(item => item.detected).length, cases };
console.log(JSON.stringify(output, null, 2));
