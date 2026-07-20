#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyHashGuardedMutation, classifyDetection, removeWorkspace } from '../../scripts/run-product-mutations.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutation-runner-self-test-'));
const file = path.join(dir, 'fixture.js');
fs.writeFileSync(file, 'const value = 1;\n');
const cases = [];
function expectFailure(label, action, message) { assert.throws(action, new RegExp(message)); cases.push({ label, status: 'passed' }); }
expectFailure('zero-match transform', () => applyHashGuardedMutation(file, 'absent', 'new'), 'expected one match');
fs.writeFileSync(file, 'same same\n');
expectFailure('multiple-match transform', () => applyHashGuardedMutation(file, 'same', 'new'), 'expected one match');
fs.writeFileSync(file, 'same\n');
const hashes = applyHashGuardedMutation(file, 'same', 'changed');
assert.notEqual(hashes.beforeSha256, hashes.afterSha256);
cases.push({ label: 'changed hash', status: 'passed' });
assert.equal(classifyDetection({ status: 127, signal: null, output: 'command not found', expectedReason: 'found' }), 'caught-wrong-reason'); cases.push({ label: 'missing detecting command', status: 'passed' });
assert.equal(classifyDetection({ status: 0, signal: null, output: '', expectedReason: 'reason' }), 'survived'); cases.push({ label: 'unexpected pass', status: 'passed' });
assert.equal(classifyDetection({ status: 1, signal: null, output: 'SyntaxError: broken', expectedReason: 'broken' }), 'caught-wrong-reason'); cases.push({ label: 'syntax failure', status: 'passed' });
assert.equal(classifyDetection({ status: null, signal: 'SIGTERM', output: '', expectedReason: 'reason' }), 'harness-failure'); cases.push({ label: 'timeout', status: 'passed' });
assert.equal(removeWorkspace(path.join(dir, 'missing')), true); cases.push({ label: 'cleanup missing workspace', status: 'passed' });
const baseline = fs.readFileSync(file, 'utf8'); fs.writeFileSync(file, 'mutated'); assert.notEqual(fs.readFileSync(file, 'utf8'), baseline); cases.push({ label: 'authoritative mutation detected', status: 'passed' });
fs.rmSync(dir, { recursive: true, force: true });
console.log(JSON.stringify({ status: 'passed', total: cases.length, cases }, null, 2));
