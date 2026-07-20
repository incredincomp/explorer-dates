#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) sourceFiles.push(full);
  }
}
walk(path.join(root, 'src'));
sourceFiles.push(path.join(root, 'extension.js'));
const sourceText = sourceFiles.map(file => ({ file: path.relative(root, file), text: fs.readFileSync(file, 'utf8') }));
const sourceFor = id => sourceText.find(({ text }) => text.includes(`'${id}'`) || text.includes(`"${id}"`));
const lineFor = (file, predicate) => {
  if (!file) return null;
  const lines = file.text.split(/\r?\n/);
  const index = lines.findIndex(predicate);
  return index < 0 ? null : { file: file.file, line: index + 1 };
};
const registrationFor = id => {
  const literal = new RegExp(`registerCommand\\s*\\(\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const matches = [];
  for (const file of sourceText) {
    const location = lineFor(file, line => literal.test(line));
    if (location) matches.push({ ...location, count: (file.text.match(literal) || []).length });
  }
  if (id === 'explorerDates.resetToDefaults') {
    const file = sourceText.find(({ text }) => text.includes('vscode.commands.registerCommand(RESET_TO_DEFAULTS_COMMAND'));
    const location = lineFor(file, line => line.includes('RESET_TO_DEFAULTS_COMMAND'));
    if (location) matches.push({ ...location, count: 1, derivedFromConstant: true });
  }
  if (matches.length) return { ...matches[0], count: matches.reduce((total, match) => total + match.count, 0) };
  const helper = sourceFor(id);
  return helper ? { file: helper.file, line: lineFor(helper, line => line.includes(id))?.line || null, count: 0 } : null;
};
const packageCommands = pkg.contributes?.commands || [];
const commandIds = new Set(packageCommands.map(command => command.command));
const allCommandRefs = new Set();
for (const value of Object.values(pkg.contributes?.menus || {})) for (const item of value || []) if (item.command) allCommandRefs.add(item.command);
for (const item of pkg.contributes?.keybindings || []) if (item.command) allCommandRefs.add(item.command);
const commands = packageCommands.map(command => {
  const registration = registrationFor(command.command);
  const source = sourceFor(command.command);
  const menuLocations = Object.entries(pkg.contributes?.menus || {}).flatMap(([menu, entries]) => (entries || []).filter(item => item.command === command.command).map(() => menu));
  const keybindings = (pkg.contributes?.keybindings || []).filter(item => item.command === command.command).map(item => ({ key: item.key, when: item.when || null }));
  const tests = sourceText.filter(({ file, text }) => file.startsWith('tests/') && text.includes(command.command)).map(({ file }) => file);
  return {
    id: command.command, title: command.title, category: command.category || null,
    ownership: command.title?.includes('(Internal)') ? 'internal' : 'public-user',
    declaration: { file: 'package.json', path: 'contributes.commands' },
    registration: registration ? { file: registration.file, line: registration.line, count: registration.count } : null,
    handler: source ? { file: source.file, line: source.text.split(/\r?\n/).findIndex(line => line.includes(command.command)) + 1 } : null,
    desktopSupport: true, webSupport: true, workspaceRequirement: 'feature-dependent', trustRequirement: 'feature-dependent',
    selectedResourceRequirement: ['showFileDetails', 'copyFileDate', 'showFileHistory', 'compareWithPrevious'].some(suffix => command.command.endsWith(suffix)),
    fileFolderApplicability: 'feature-dependent', supportedUriSchemes: ['file', 'vscode-vfs', 'provider-dependent'], gitRequirement: 'feature-dependent',
    featureGate: null, contextKeys: [], menuLocations, commandPaletteCondition: null, keybindings,
    expectedInteractionType: command.command.includes('show') || command.command.includes('open') ? 'interactive' : 'command',
    commandOutcomeContract: 'explicit-or-legacy-command-wrapper', sourceContractTests: tests,
    productionContractTests: [], realHostEvidenceStatus: 'manual-certification-pending', certificationStatus: registration?.count === 1 ? 'static-reconciled' : 'coverage-missing',
    referencedBySurface: allCommandRefs.has(command.command)
  };
});
const internalIds = ['explorerDates.clearTelemetryData.force', 'explorerDates.restorePreviousPreset'];
const runtimeOnlyCommands = internalIds.map(id => {
  const registration = registrationFor(id);
  return { id, registration, purpose: id.endsWith('.force') ? 'explicit destructive telemetry clear path' : 'runtime preset restoration', intendedCaller: 'internal feature flow', remainInternal: true, noContributionReason: 'runtime-only implementation command', tests: [], collisionRisk: 'must not collide with contributed command IDs' };
});
const properties = pkg.contributes?.configuration?.properties || {};
const settings = Object.entries(properties).filter(([key]) => key.startsWith('explorerDates.')).map(([key, value]) => {
  const readers = sourceText.filter(({ text }) => text.includes(key) || text.includes(`'${key.slice('explorerDates.'.length)}'`)).map(({ file }) => file);
  return { key, type: value.type || null, default: value.default ?? null, scope: value.scope || 'window', enum: value.enum || null, bounds: { minimum: value.minimum ?? null, maximum: value.maximum ?? null }, readers, writers: [], changeListeners: [], affectedFeatures: [], desktopWebApplicability: 'feature-dependent', documentation: value.description || null, testReferences: [], reconciliationStatus: readers.length ? 'static-reconciled' : 'coverage-missing' };
});
const featureGroups = [
  ['activation-deactivation', ['extension.js'], 'source-contract-covered'], ['decorations', ['src/fileDateDecorationProvider.js', 'src/chunks'], 'static-reconciled'],
  ['file-date-freshness', ['src/fileDateDecorationProvider.js', 'src/filesystem'], 'static-reconciled'], ['filesystem-provider', ['src/filesystem/FileSystemAdapter.js'], 'source-contract-covered'],
  ['git', ['src/commands/coreCommands.js'], 'static-reconciled'], ['cache-watcher-lifecycle', ['src/advancedCache.js', 'src/smartWatcher.js'], 'static-reconciled'],
  ['reporting-serialization', ['src/exportReporting.js', 'src/reporting'], 'source-contract-covered'], ['templates-configuration', ['src/workspaceTemplates.js', 'src/commands'], 'static-reconciled'],
  ['diagnostics-onboarding', ['src/utils/webDiagnostics.js', 'src/onboarding.js'], 'static-reconciled'], ['public-extension-api', ['src/extensionApi.js', 'src/chunks/extension-api-chunk.js'], 'static-reconciled']
].map(([id, owningSourcePaths, certificationStatus]) => ({ id, owningSourcePaths, declaredCapabilities: [], principalTests: [], productionArtifactApplicability: 'desktop-and-supported-web', certificationStatus, knownGaps: ['manual and environment-specific certification pending'] }));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const manifest = {
  schemaVersion: 1, generatedAt: 'deterministic-from-repository-state', repository: 'incredincomp/explorer-dates', auditedSha: process.env.PRODUCT_SURFACE_SHA || 'derive-at-validation', auditedTree: process.env.PRODUCT_SURFACE_TREE || 'derive-at-validation',
  counts: { contributedCommands: commands.length, runtimeOnlyCommands: runtimeOnlyCommands.length, settings: settings.length, menuEntries: Object.values(pkg.contributes?.menus || {}).flat().length, keybindings: (pkg.contributes?.keybindings || []).length },
  commands, runtimeOnlyCommands, settings, featureGroups,
  runtimeParity: { sourceFiles: ['extension.js', 'src/commands/coreCommands.js', 'src/exportReporting.js', 'src/reporting/reportContract.js', 'src/utils/commandOutcome.js'], sourceHashes: Object.fromEntries(['extension.js', 'src/commands/coreCommands.js', 'src/exportReporting.js', 'src/reporting/reportContract.js', 'src/utils/commandOutcome.js'].map(file => [file, hash(file)])), desktopBundle: hash('dist/extension.js'), webBundle: hash('dist/extension.web.js') }
};
const output = process.argv[2] || path.join(root, 'tests/product-surface/product-surface.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), counts: manifest.counts }, null, 2));
