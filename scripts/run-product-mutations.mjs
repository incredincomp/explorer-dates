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
const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();

function foundationFor(options = {}) {
  return {
    sha: options.foundationBaseSha || manifest.foundationBaseSha,
    tree: options.foundationBaseTree || manifest.foundationBaseTree
  };
}

export function resolveCandidateIdentity(repo = root, options = {}) {
  const candidateSha = git(repo, ['rev-parse', 'HEAD']);
  const candidateTree = git(repo, ['rev-parse', 'HEAD^{tree}']);
  const status = execFileSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' });
  if (status) throw new Error('candidate-worktree-not-clean');
  const expectedValidationSha = options.expectedValidationSha ?? process.env.EXPECTED_VALIDATION_SHA ?? null;
  if (expectedValidationSha && candidateSha !== expectedValidationSha) throw new Error(`candidate-validation-sha-mismatch expected=${expectedValidationSha} actual=${candidateSha}`);
  const foundationBase = foundationFor(options);
  if (!/^[0-9a-f]{40}$/.test(foundationBase.sha) || !/^[0-9a-f]{40}$/.test(foundationBase.tree)) throw new Error('foundation-provenance-invalid');
  if (spawnSync('git', ['-C', repo, 'cat-file', '-e', `${foundationBase.sha}^{commit}`]).status !== 0) throw new Error('foundation-base-missing');
  if (git(repo, ['rev-parse', `${foundationBase.sha}^{tree}`]) !== foundationBase.tree) throw new Error('foundation-base-tree-mismatch');
  const ancestry = spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', foundationBase.sha, candidateSha]);
  if (ancestry.status !== 0) throw new Error('foundation-base-not-ancestor');
  const parents = git(repo, ['rev-list', '--parents', '-n', '1', candidateSha]).split(/\s+/).slice(1);
  const candidateKind = candidateSha === foundationBase.sha ? 'merged-release' : parents.length > 1 ? 'pull-request-merge' : parents.length === 1 ? 'feature-branch' : 'detached-candidate';
  return { foundationBase, candidate: { sha: candidateSha, tree: candidateTree, expectedValidationSha, clean: true }, candidateKind };
}

export function applyHashGuardedMutation(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  const occurrences = original.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`mutation-invalid: expected one match, found ${occurrences}`);
  const mutated = original.replace(before, after);
  if (mutated === original || hash(mutated) === hash(original)) throw new Error('mutation-invalid: unchanged hash');
  fs.writeFileSync(file, mutated);
  return { originalFileHash: hash(original), mutatedFileHash: hash(mutated), occurrences };
}

export function classifyDetection({ status, signal, output, expectedReason }) {
  if (status === null || signal) return 'harness-failure';
  if (status === 0) return 'survived';
  if (/SyntaxError|command not found|ENOENT|timed out/i.test(output)) return 'caught-wrong-reason';
  return new RegExp(expectedReason, 'i').test(output) ? 'caught-intended-reason' : 'caught-wrong-reason';
}

export function createMutationWorkspace(repo = root) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-dates-mutation-'));
  const archive = path.join(os.tmpdir(), `explorer-dates-mutation-${process.pid}-${Date.now()}.tar`);
  try {
    execFileSync('git', ['-C', repo, 'archive', 'HEAD', '-o', archive]);
    execFileSync('tar', ['-xf', archive, '-C', workspace]);
  } finally { fs.rmSync(archive, { force: true }); }
  const modules = path.join(repo, 'node_modules');
  if (fs.existsSync(modules)) fs.symlinkSync(modules, path.join(workspace, 'node_modules'), 'dir');
  return { workspace, trackedFileCount: git(repo, ['ls-files', '-z']).split('\0').filter(Boolean).length, creationMethod: 'git-archive-HEAD' };
}

export function removeWorkspace(workspace, keep = false) {
  if (!keep) fs.rmSync(workspace, { recursive: true, force: true });
  return !fs.existsSync(workspace);
}

function runOne(mutation, candidateIdentity) {
  const started = Date.now();
  const result = { id: mutation.id, candidate: candidateIdentity.candidate, detector: mutation.detector, classification: 'harness-failure' };
  let workspaceInfo;
  try {
    workspaceInfo = createMutationWorkspace(root);
    result.workspace = { creationMethod: workspaceInfo.creationMethod, trackedFileCount: workspaceInfo.trackedFileCount, root: workspaceInfo.workspace };
    const target = path.join(workspaceInfo.workspace, mutation.targetFile);
    result.diff = `--- ${mutation.targetFile} (candidate)\n+++ ${mutation.targetFile} (mutated)\n-${mutation.before}\n+${mutation.after}`;
    Object.assign(result, applyHashGuardedMutation(target, mutation.before, mutation.after));
    const command = spawnSync(mutation.detector, { cwd: workspaceInfo.workspace, shell: true, timeout: 60000, encoding: 'utf8' });
    const output = `${command.stdout || ''}\n${command.stderr || ''}`;
    result.detectorResult = { exitCode: command.status, signal: command.signal, output: output.slice(-12000) };
    result.intendedReasonMatch = new RegExp(mutation.expectedReason, 'i').test(output);
    result.classification = classifyDetection({ status: command.status, signal: command.signal, output, expectedReason: mutation.expectedReason });
    const afterIdentity = resolveCandidateIdentity(root);
    if (JSON.stringify(afterIdentity.candidate) !== JSON.stringify(candidateIdentity.candidate)) throw new Error('authoritative-worktree-change-detected');
  } catch (error) {
    result.error = error.message;
  } finally {
    if (workspaceInfo) {
      try { result.cleanup = { removed: removeWorkspace(workspaceInfo.workspace, false) }; }
      catch (error) { result.cleanup = { removed: false, error: error.message }; result.classification = 'cleanup-failure'; }
    }
    result.durationMs = Date.now() - started;
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--list')) { console.log(JSON.stringify(manifest.mutations.map(({ id, category, detector }) => ({ id, category, detector })), null, 2)); process.exit(0); }
  const requested = process.argv.includes('--all') ? manifest.mutations : (() => { const id = arg('--mutation'); return id ? manifest.mutations.filter(item => item.id === id) : []; })();
  if (!requested.length) { console.error('choose --list, --mutation MUT-FND-00N, or --all'); process.exit(2); }
  let candidateIdentity;
  try { candidateIdentity = resolveCandidateIdentity(root); } catch (error) { console.error(JSON.stringify({ status: 'failed', error: error.message }, null, 2)); process.exit(1); }
  const results = requested.map(mutation => runOne(mutation, candidateIdentity));
  const summary = { total: results.length, caughtIntendedReason: results.filter(item => item.classification === 'caught-intended-reason').length, survived: results.filter(item => item.classification === 'survived').length, caughtWrongReason: results.filter(item => item.classification === 'caught-wrong-reason').length, invalid: results.filter(item => item.classification === 'mutation-invalid').length, harnessFailures: results.filter(item => !['caught-intended-reason', 'survived', 'caught-wrong-reason', 'mutation-invalid'].includes(item.classification)).length, cleanupFailures: results.filter(item => item.classification === 'cleanup-failure').length };
  const output = { status: summary.caughtIntendedReason === summary.total ? 'passed' : 'failed', foundationBase: candidateIdentity.foundationBase, candidate: { ...candidateIdentity.candidate, candidateKind: candidateIdentity.candidateKind }, summary, results };
  const outputPath = arg('--json-output');
  if (outputPath) { fs.mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true }); fs.writeFileSync(path.resolve(root, outputPath), `${JSON.stringify(output, null, 2)}\n`); }
  console.log(JSON.stringify(output, null, 2));
  process.exitCode = output.status === 'passed' ? 0 : 1;
}
