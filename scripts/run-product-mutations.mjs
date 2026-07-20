#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tests/product-surface/mutation-manifest.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sha256File = file => hash(fs.readFileSync(file));
const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
const keepFailed = process.argv.includes('--keep-failed-worktree');

export function verifyBaseline(repo = root, expectedSha = manifest.baselineSha, expectedTree = manifest.baselineTree) {
  const sha = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const tree = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
  if (sha !== expectedSha || tree !== expectedTree) throw new Error(`baseline mismatch sha=${sha} tree=${tree}`);
  return { sha, tree };
}

export function applyHashGuardedMutation(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  const occurrences = original.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`mutation-invalid: expected one match, found ${occurrences}`);
  const mutated = original.replace(before, after);
  if (mutated === original || hash(mutated) === hash(original)) throw new Error('mutation-invalid: unchanged hash');
  fs.writeFileSync(file, mutated);
  return { beforeSha256: hash(original), afterSha256: hash(mutated), occurrences };
}

export function classifyDetection({ status, signal, output, expectedReason }) {
  if (status === null && signal) return 'harness-failure';
  if (status === 0) return 'survived';
  if (status === null) return 'harness-failure';
  if (/SyntaxError|command not found|ENOENT|timed out/i.test(output)) return 'caught-wrong-reason';
  return new RegExp(expectedReason, 'i').test(output) ? 'caught-intended-reason' : 'caught-wrong-reason';
}

export function removeWorkspace(workspace, keep = false) {
  if (!keep) fs.rmSync(workspace, { recursive: true, force: true });
  return !fs.existsSync(workspace);
}

function archiveWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-dates-mutation-'));
  fs.cpSync(root, workspace, { recursive: true, filter: source => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(`${path.sep}node_modules`) && !source.includes(`${path.sep}test-results${path.sep}`) });
  const modules = path.join(root, 'node_modules');
  if (fs.existsSync(modules)) fs.symlinkSync(modules, path.join(workspace, 'node_modules'), 'dir');
  return workspace;
}

function runOne(mutation) {
  const started = Date.now();
  let workspace;
  const result = { id: mutation.id, detector: mutation.detector, status: 'harness-failure', mutation, cleanup: null };
  try {
    verifyBaseline();
    const authoritativeStatus = execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' });
    workspace = archiveWorkspace();
    const target = path.join(workspace, mutation.targetFile);
    const original = fs.readFileSync(target, 'utf8');
    result.diff = `--- ${mutation.targetFile} (baseline)\n+++ ${mutation.targetFile} (mutated)\n-${mutation.before}\n+${mutation.after}`;
    result.hashes = applyHashGuardedMutation(target, mutation.before, mutation.after);
    const command = spawnSync(mutation.detector, { cwd: workspace, shell: true, timeout: 60000, encoding: 'utf8' });
    const output = `${command.stdout || ''}\n${command.stderr || ''}`;
    result.detectorResult = { status: command.status, signal: command.signal, output: output.slice(-12000) };
    result.status = classifyDetection({ status: command.status, signal: command.signal, output, expectedReason: mutation.expectedReason });
    if (original === fs.readFileSync(target, 'utf8')) result.status = 'harness-failure';
    verifyBaseline();
    const afterAuthoritativeStatus = execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' });
    if (afterAuthoritativeStatus !== authoritativeStatus) throw new Error('authoritative worktree mutation detected');
  } catch (error) {
    result.error = error.message;
    if (!result.status || result.status === 'harness-failure') result.status = 'harness-failure';
  } finally {
    if (workspace) {
      try { result.cleanup = { removed: removeWorkspace(workspace, keepFailed && result.status !== 'caught-intended-reason') }; }
      catch (error) { result.cleanup = { removed: false, error: error.message }; result.status = 'cleanup-failure'; }
    }
    result.durationMs = Date.now() - started;
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const requested = process.argv.includes('--all') ? manifest.mutations : (() => { const id = arg('--mutation'); return id ? manifest.mutations.filter(item => item.id === id) : []; })();
  if (process.argv.includes('--list')) { console.log(JSON.stringify(manifest.mutations.map(({ id, category, detector }) => ({ id, category, detector })), null, 2)); process.exit(0); }
  if (!requested.length) { console.error('choose --list, --mutation MUT-FND-00N, or --all'); process.exit(2); }
  const results = requested.map(runOne);
  const summary = { total: results.length, caughtIntendedReason: results.filter(item => item.status === 'caught-intended-reason').length, survived: results.filter(item => item.status === 'survived').length, harnessFailures: results.filter(item => !['caught-intended-reason', 'survived'].includes(item.status)).length };
  const output = { status: summary.caughtIntendedReason === summary.total ? 'passed' : 'failed', baseline: { sha: manifest.baselineSha, tree: manifest.baselineTree }, summary, results };
  const outputPath = arg('--json-output');
  if (outputPath) { fs.mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true }); fs.writeFileSync(path.resolve(root, outputPath), `${JSON.stringify(output, null, 2)}\n`); }
  console.log(JSON.stringify(output, null, 2));
  process.exitCode = output.status === 'passed' ? 0 : 1;
}
