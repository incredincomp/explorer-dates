import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('package.json'));
const readme = read('README.md');
const settingsGuide = read('DOCS/SETTINGS_GUIDE.md');
const args = process.argv.slice(2);
assert.ok(!args.length || (args.length === 1 && ['--write', '--check'].includes(args[0])),
    'Usage: node scripts/sync-readme.mjs [--check|--write]');
const commands = new Map(manifest.contributes.commands.map(({ command, title }) => [command, title]));
const settings = manifest.contributes.configuration.properties;
const command = (name) => {
    const title = commands.get(`explorerDates.${name}`);
    assert.ok(title, `Missing command: ${name}`);
    return `**Explorer Dates: ${title}**`;
};
const setting = (name, expectedDefault) => {
    const key = `explorerDates.${name}`;
    assert.equal(settings[key]?.type, 'boolean', `Missing boolean setting: ${key}`);
    if (expectedDefault !== undefined) assert.equal(settings[key].default, expectedDefault, `Unexpected default: ${key}`);
    return '\`' + key + '\`';
};

const versions = [...read('CHANGELOG.md').matchAll(/^##[ \t]+v?([^\s]+)(?=[ \t]|$)/gm)].map(([, version]) => version);
assert.ok(versions.includes(manifest.version), `Missing exact changelog version: ${manifest.version}`);
assert.ok(settingsGuide.startsWith(`# Explorer Dates v${manifest.version} - Complete Settings Guide`),
    'Stale Settings Guide heading');
assert.ok(manifest.main && manifest.browser, 'README documents desktop and browser support');
assert.ok(readme.includes(`itemName=${manifest.publisher}.${manifest.name}`), 'Stale Marketplace ID');
for (const name of ['toggleDecorations', 'applyPreset']) assert.ok(readme.includes(command(name)), `Stale command: ${name}`);
for (const [, path] of readme.matchAll(/\]\(\.\/([^#)]+)(?:#[^)]*)?\)/g)) {
    assert.ok(existsSync(new URL(path, root)), `Broken README link: ${path}`);
}

// Curated highlights, not a dump of every contributed command and setting.
const block = /<!-- features:start -->[\s\S]*?<!-- features:end -->/g;
assert.equal([...readme.matchAll(block)].length, 1, 'Expected exactly one README feature block');
const next = readme.replace(block, () => [
    '<!-- features:start -->',
    `Feature list for source version ${manifest.version}.`,
    '',
    '- **Spot recent work.** Read compact freshness badges beside files in Explorer.',
    `- **Check the details.** Hover for the timestamp or run ${command('showFileDetails')}. Timestamp sources depend on the workspace.`,
    `- **Reduce background work.** Turn on ${setting('performanceMode')} to keep basic date decorations in large workspaces.`,
    `- **Choose a neutral newest-file badge.** Turn on ${setting('freshnessUseNeutralNowBadge', false)} to show \`T\` instead of \`!!\` without changing the tooltip.`,
    '- **Use your usual workspace.** Runs on desktop, Remote SSH, [vscode.dev](https://vscode.dev), and [github.dev](https://github.dev). Some features depend on the host.',
    '<!-- features:end -->',
].join('\n'));

if (args[0] === '--write') {
    if (readme !== next) writeFileSync(new URL('README.md', root), next);
} else {
    assert.equal(readme, next, 'Stale feature block; run node scripts/sync-readme.mjs --write');
}
