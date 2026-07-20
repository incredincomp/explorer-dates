#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.argv.includes('--root') ? path.resolve(process.argv[process.argv.indexOf('--root') + 1]) : defaultRoot;
const manifestPath = process.argv.includes('--manifest') ? process.argv[process.argv.indexOf('--manifest') + 1] : path.join(root, 'tests/product-surface/product-surface.json');
const outputPath = process.argv.includes('--json-output') ? process.argv[process.argv.indexOf('--json-output') + 1] : null;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, manifestPath), 'utf8'));
const failures = [];
const warnings = [];
const allowedStatuses = new Set(['static-reconciled', 'source-contract-covered', 'production-contract-covered', 'real-host-covered', 'manual-certification-pending', 'coverage-missing', 'intentionally-internal']);
const packageCommands = pkg.contributes?.commands || [];
const declared = new Set(packageCommands.map(command => command.command));
const manifestCommands = manifest.commands || [];
const manifestIds = manifestCommands.map(command => command.id);
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
const registrations = [];
for (const file of sourceText) {
  const regex = /registerCommand\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(file.text))) registrations.push({ id: match[1], file: file.file, line: file.text.slice(0, match.index).split(/\r?\n/).length });
  if (file.text.includes('vscode.commands.registerCommand(RESET_TO_DEFAULTS_COMMAND')) registrations.push({ id: 'explorerDates.resetToDefaults', file: file.file, line: file.text.split(/\r?\n/).findIndex(line => line.includes('vscode.commands.registerCommand(RESET_TO_DEFAULTS_COMMAND')) + 1, derived: true });
}
const registrationIds = new Set(registrations.map(item => item.id));
const internal = new Set((manifest.runtimeOnlyCommands || []).map(item => item.id));
const menuRefs = Object.values(pkg.contributes?.menus || {}).flat().map(item => item.command).filter(Boolean);
const keybindingRefs = (pkg.contributes?.keybindings || []).map(item => item.command).filter(Boolean);
const settings = Object.keys(pkg.contributes?.configuration?.properties || {}).filter(key => key.startsWith('explorerDates.'));
const manifestSettings = (manifest.settings || []).map(setting => setting.key);
const duplicates = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const compareSets = (label, expected, actual) => {
  const missing = [...expected].filter(value => !actual.has(value));
  const stale = [...actual].filter(value => !expected.has(value));
  if (missing.length || stale.length) failures.push({ type: 'set-mismatch', label, missing, stale });
};
if (manifest.schemaVersion !== 1) failures.push({ type: 'invalid-schema-value', field: 'schemaVersion', value: manifest.schemaVersion });
if (manifestCommands.some(command => !command.id || !allowedStatuses.has(command.certificationStatus))) failures.push({ type: 'invalid-schema-value', field: 'commands.certificationStatus' });
if (duplicates(manifestIds).length) failures.push({ type: 'duplicate-command-entry', ids: duplicates(manifestIds) });
compareSets('contributed-commands', declared, new Set(manifestIds));
for (const command of manifestCommands) {
  const count = registrations.filter(item => item.id === command.id).length;
  const expectedCount = command.id === 'explorerDates.resetToDefaults' ? 2 : 1;
  if (count !== expectedCount) failures.push({ type: 'registration-count', id: command.id, expected: expectedCount, actual: count });
}
for (const ref of [...menuRefs, ...keybindingRefs]) if (!declared.has(ref)) failures.push({ type: 'unknown-command-reference', id: ref });
for (const id of registrations.map(item => item.id)) if (!declared.has(id) && !internal.has(id)) failures.push({ type: 'undeclared-runtime-registration', id });
compareSets('intentional-internal-commands', new Set(['explorerDates.clearTelemetryData.force', 'explorerDates.restorePreviousPreset']), internal);
compareSets('settings', new Set(settings), new Set(manifestSettings));
for (const setting of manifest.settings || []) if (!Object.prototype.hasOwnProperty.call(pkg.contributes?.configuration?.properties || {}, setting.key)) failures.push({ type: 'stale-setting-entry', key: setting.key });
for (const command of manifestCommands) for (const file of [...(command.sourceContractTests || []), ...(command.productionContractTests || [])]) if (!fs.existsSync(path.join(root, file))) failures.push({ type: 'missing-test-path', id: command.id, file });
const result = { status: failures.length ? 'failed' : 'passed', auditedSha: process.env.PRODUCT_SURFACE_SHA || null, auditedTree: process.env.PRODUCT_SURFACE_TREE || null, counts: { contributedCommands: declared.size, manifestCommands: manifestIds.length, registrations: registrations.length, runtimeOnlyCommands: internal.size, settings: settings.length, menuEntries: menuRefs.length, keybindings: keybindingRefs.length }, reconciliation: { missingCommands: [...declared].filter(id => !manifestIds.includes(id)), staleCommands: manifestIds.filter(id => !declared.has(id)), unknownMenuOrKeybindingCommands: [...new Set([...menuRefs, ...keybindingRefs].filter(id => !declared.has(id)))], undeclaredRuntimeRegistrations: registrations.map(item => item.id).filter(id => !declared.has(id) && !internal.has(id)), missingSettings: settings.filter(key => !manifestSettings.includes(key)), staleSettings: manifestSettings.filter(key => !settings.includes(key)) }, failures, warnings };
if (outputPath) { fs.mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true }); fs.writeFileSync(path.resolve(root, outputPath), `${JSON.stringify(result, null, 2)}\n`); }
console.log(JSON.stringify(result, null, 2));
process.exitCode = failures.length ? 1 : 0;
