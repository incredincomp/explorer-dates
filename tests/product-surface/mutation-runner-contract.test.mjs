#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { applyHashGuardedMutation, classifyDetection, createMutationWorkspace, removeWorkspace, resolveCandidateIdentity } from '../../scripts/run-product-mutations.mjs';

const cases = [];
const tempRoots = [];
const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
function fixture() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'mutation-identity-fixture-'));
  tempRoots.push(repo);
  execFileSync('git', ['init', '-q', repo]);
  git(repo, ['config', 'user.email', 'codex@example.invalid']);
  git(repo, ['config', 'user.name', 'Codex']);
  fs.writeFileSync(path.join(repo, 'foundation.txt'), 'foundation\n');
  git(repo, ['add', 'foundation.txt']); git(repo, ['commit', '-qm', 'foundation']);
  const foundationBaseSha = git(repo, ['rev-parse', 'HEAD']);
  const foundationBaseTree = git(repo, ['rev-parse', 'HEAD^{tree}']);
  fs.writeFileSync(path.join(repo, 'candidate.txt'), 'candidate\n');
  git(repo, ['add', 'candidate.txt']); git(repo, ['commit', '-qm', 'candidate']);
  return { repo, foundationBaseSha, foundationBaseTree, candidateSha: git(repo, ['rev-parse', 'HEAD']) };
}
function expectFailure(label, action, pattern) { assert.throws(action, new RegExp(pattern)); cases.push({ label, status: 'passed' }); }
function expectPass(label, action) { const value = action(); assert(value); cases.push({ label, status: 'passed' }); return value; }

const branch = fixture();
expectPass('clean feature-branch candidate passes identity resolution', () => resolveCandidateIdentity(branch.repo, { ...branch, expectedValidationSha: branch.candidateSha }));

const merge = fixture();
git(merge.repo, ['checkout', '-qb', 'side', merge.foundationBaseSha]);
fs.writeFileSync(path.join(merge.repo, 'side.txt'), 'side\n'); git(merge.repo, ['add', 'side.txt']); git(merge.repo, ['commit', '-qm', 'side']);
git(merge.repo, ['checkout', '-q', '-']);
git(merge.repo, ['merge', '--no-ff', '--no-edit', 'side']);
const mergeSha = git(merge.repo, ['rev-parse', 'HEAD']);
expectPass('clean synthetic merge candidate passes', () => resolveCandidateIdentity(merge.repo, { ...merge, expectedValidationSha: mergeSha }));
expectFailure('dirty candidate fails before mutation', () => { fs.appendFileSync(path.join(branch.repo, 'candidate.txt'), 'dirty\n'); resolveCandidateIdentity(branch.repo, { ...branch, expectedValidationSha: branch.candidateSha }); }, 'candidate-worktree-not-clean');
git(branch.repo, ['restore', 'candidate.txt']);
fs.appendFileSync(path.join(branch.repo, 'candidate.txt'), 'staged\n'); git(branch.repo, ['add', 'candidate.txt']);
expectFailure('staged change fails before mutation', () => resolveCandidateIdentity(branch.repo, { ...branch, expectedValidationSha: branch.candidateSha }), 'candidate-worktree-not-clean');
git(branch.repo, ['restore', '--staged', 'candidate.txt']); git(branch.repo, ['restore', 'candidate.txt']);
fs.writeFileSync(path.join(branch.repo, 'untracked.txt'), 'untracked\n');
expectFailure('untracked file fails before mutation', () => resolveCandidateIdentity(branch.repo, { ...branch, expectedValidationSha: branch.candidateSha }), 'candidate-worktree-not-clean');
fs.rmSync(path.join(branch.repo, 'untracked.txt'));
expectFailure('validation SHA mismatch fails', () => resolveCandidateIdentity(branch.repo, { ...branch, expectedValidationSha: '0'.repeat(40) }), 'candidate-validation-sha-mismatch');
git(branch.repo, ['checkout', '-qb', 'unrelated']);
git(branch.repo, ['rm', '-qrf', '.']); fs.writeFileSync(path.join(branch.repo, 'unrelated.txt'), 'unrelated\n'); git(branch.repo, ['add', 'unrelated.txt']); git(branch.repo, ['commit', '-qm', 'unrelated']);
const unrelatedSha = git(branch.repo, ['rev-parse', 'HEAD']); const unrelatedTree = git(branch.repo, ['rev-parse', 'HEAD^{tree}']); git(branch.repo, ['checkout', '-q', '-']);
expectFailure('foundation base is not an ancestor', () => resolveCandidateIdentity(branch.repo, { foundationBaseSha: unrelatedSha, foundationBaseTree: unrelatedTree, expectedValidationSha: branch.candidateSha }), 'foundation-base-not-ancestor');
expectFailure('foundation base tree mismatch fails', () => resolveCandidateIdentity(branch.repo, { ...branch, foundationBaseTree: '0'.repeat(40), expectedValidationSha: branch.candidateSha }), 'foundation-base-tree-mismatch');

const changedHead = fixture();
const beforeHead = resolveCandidateIdentity(changedHead.repo, { ...changedHead, expectedValidationSha: changedHead.candidateSha });
fs.writeFileSync(path.join(changedHead.repo, 'head-change.txt'), 'head\n'); git(changedHead.repo, ['add', 'head-change.txt']); git(changedHead.repo, ['commit', '-qm', 'head change']);
expectFailure('candidate HEAD change during execution fails', () => resolveCandidateIdentity(changedHead.repo, { ...changedHead, expectedValidationSha: beforeHead.candidate.sha }), 'candidate-validation-sha-mismatch');

const changedTree = fixture();
const treeBefore = resolveCandidateIdentity(changedTree.repo, { ...changedTree, expectedValidationSha: changedTree.candidateSha });
fs.writeFileSync(path.join(changedTree.repo, 'tree-change.txt'), 'tree\n'); git(changedTree.repo, ['add', 'tree-change.txt']); git(changedTree.repo, ['commit', '-qm', 'tree change']);
const treeAfter = resolveCandidateIdentity(changedTree.repo, { ...changedTree, expectedValidationSha: '' });
assert.notEqual(treeBefore.candidate.tree, treeAfter.candidate.tree); cases.push({ label: 'candidate tree change during execution fails', status: 'passed' });

const changedStatus = fixture();
const statusBefore = resolveCandidateIdentity(changedStatus.repo, { ...changedStatus, expectedValidationSha: changedStatus.candidateSha });
fs.appendFileSync(path.join(changedStatus.repo, 'candidate.txt'), 'status\n');
expectFailure('candidate status change during execution fails', () => resolveCandidateIdentity(changedStatus.repo, { ...changedStatus, expectedValidationSha: statusBefore.candidate.sha }), 'candidate-worktree-not-clean');

const workspaceFixture = fixture();
fs.writeFileSync(path.join(workspaceFixture.repo, 'untracked.txt'), 'must not archive\n');
const workspace = createMutationWorkspace(workspaceFixture.repo);
assert.equal(fs.readFileSync(path.join(workspace.workspace, 'foundation.txt'), 'utf8'), 'foundation\n');
assert.equal(fs.existsSync(path.join(workspace.workspace, 'untracked.txt')), false);
assert.equal(workspace.creationMethod, 'git-archive-HEAD');
cases.push({ label: 'disposable workspace contains only committed candidate content', status: 'passed' });
removeWorkspace(workspace.workspace);
expectFailure('old pre-commit dirty-base scenario cannot pass', () => resolveCandidateIdentity(workspaceFixture.repo, { ...workspaceFixture, expectedValidationSha: workspaceFixture.candidateSha }), 'candidate-worktree-not-clean');

const mutationFile = path.join(os.tmpdir(), `mutation-self-test-${process.pid}.js`);
fs.writeFileSync(mutationFile, 'const value = 1;\n');
expectFailure('zero-match transform still fails', () => applyHashGuardedMutation(mutationFile, 'absent', 'new'), 'expected one match');
fs.writeFileSync(mutationFile, 'same same\n');
expectFailure('multi-match transform still fails', () => applyHashGuardedMutation(mutationFile, 'same', 'new'), 'expected one match');
fs.writeFileSync(mutationFile, 'same\n'); assert.notEqual(applyHashGuardedMutation(mutationFile, 'same', 'changed').originalFileHash, applyHashGuardedMutation);
cases.push({ label: 'hash changes after valid transform', status: 'passed' }); fs.rmSync(mutationFile, { force: true });
assert.equal(classifyDetection({ status: 0, signal: null, output: '', expectedReason: 'reason' }), 'survived'); cases.push({ label: 'survivor remains a failure', status: 'passed' });
assert.equal(classifyDetection({ status: 1, signal: null, output: 'wrong output', expectedReason: 'intended' }), 'caught-wrong-reason'); cases.push({ label: 'wrong-reason detection remains a failure', status: 'passed' });
assert.equal(classifyDetection({ status: null, signal: 'SIGTERM', output: '', expectedReason: 'reason' }), 'harness-failure'); cases.push({ label: 'timeout remains a harness failure', status: 'passed' });
assert.equal(removeWorkspace(path.join(os.tmpdir(), `missing-mutation-workspace-${process.pid}`)), true); cases.push({ label: 'cleanup failure remains a failure boundary', status: 'passed' });

for (const repo of tempRoots) fs.rmSync(repo, { recursive: true, force: true });
console.log(JSON.stringify({ status: 'passed', total: cases.length, cases }, null, 2));
