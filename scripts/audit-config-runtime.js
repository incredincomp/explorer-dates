const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TESTS = path.join(ROOT, 'tests');

const INIT_FUNCTIONS = [
  'initializeAdvancedSystems',
  '_reloadUIAdapters',
  '_applyProgressiveLoadingSetting',
  '_setupFileWatcher',
  '_setupPeriodicRefresh',
  '_loadGitInsightsChunk',
  'refreshAll',
  '_applyFeatureLevel',
  'initializeAdvancedSystems',
];

function readPackageConfigKeys() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const props = (((pkg.contributes || {}).configuration || {}).properties) || {};
  return Object.keys(props).filter(k => k.startsWith('explorerDates.'));
}

function readAllFiles(dir) {
  const results = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        // skip node_modules and dist
        if (['node_modules','dist','.git'].includes(e.name)) continue;
        walk(full);
      } else if (e.isFile() && (full.endsWith('.js') || full.endsWith('.ts') || full.endsWith('.json'))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function findOccurrences(keys, files) {
  const report = {};
  for (const key of keys) {
    report[key] = { occurrences: [] };
  }

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const key of keys) {
        if (line.includes(key) || line.includes(`'${key}'`) || line.includes(`"${key}"`)) {
          // capture context
          const start = Math.max(0, i - 5);
          const end = Math.min(lines.length - 1, i + 5);
          const context = lines.slice(start, end + 1).join('\n');
          // look for initializer calls in context
          const initializers = INIT_FUNCTIONS.filter(fn => context.includes(fn));
          // also detect affectsConfiguration or config.get uses nearby
          const affectsConfig = /affectsConfiguration\(/.test(context);
          const configGet = /get\(|get\(/.test(context);

          report[key].occurrences.push({ file, line: i + 1, snippet: line.trim(), contextSnippet: context, initializers, affectsConfig, configGet });
        }
      }
    }
  }
  return report;
}

function summarize(report) {
  const summary = { keys: [], unmapped: [] };
  for (const [key, data] of Object.entries(report)) {
    const mapped = data.occurrences && data.occurrences.length > 0;
    const hasInit = data.occurrences && data.occurrences.some(o => o.initializers && o.initializers.length > 0);
    const hasAff = data.occurrences && data.occurrences.some(o => o.affectsConfig);
    summary.keys.push({ key, mapped, occurrences: data.occurrences.length, hasInit, hasAff });
    if (!mapped) summary.unmapped.push(key);
  }
  return summary;
}

function printReport(summary, report) {
  console.log('\n=== Configuration Runtime Audit Report ===\n');
  console.log('Key | Mapped | Occurrences | HasInitializer | HasChangeHandler');
  console.log('--- | --- | ---: | --- | ---');
  for (const k of summary.keys) {
    console.log(`${k.key} | ${k.mapped ? 'YES' : 'NO'} | ${k.occurrences} | ${k.hasInit ? 'YES' : 'NO'} | ${k.hasAff ? 'YES' : 'NO'}`);
  }
  if (summary.unmapped.length) {
    console.log('\n-- UNMAPPED KEYS (no references found):');
    summary.unmapped.forEach(k => console.log(` - ${k}`));
  } else {
    console.log('\nAll contributed keys have at least one reference in the codebase.');
  }

  console.log('\n-- DETAILED OCCURRENCES (first few per key) --');
  for (const [key, data] of Object.entries(report)) {
    if (!data.occurrences.length) continue;
    console.log(`\n[${key}] (${data.occurrences.length} occurrences)`);
    const slice = data.occurrences.slice(0, 4);
    for (const occ of slice) {
      console.log(` - ${occ.file}:${occ.line}    snippet: ${occ.snippet}`);
      if (occ.initializers.length) console.log(`   initializers: ${occ.initializers.join(', ')}`);
      if (occ.affectsConfig) console.log('   has affectsConfiguration(...) in context');
    }
  }
}

function main() {
  const keys = readPackageConfigKeys();
  console.log(`Found ${keys.length} explorerDates.* keys from package.json`);
  const files = [...readAllFiles(SRC), ...readAllFiles(TESTS)];
  console.log(`Scanning ${files.length} files for key references...`);
  const report = findOccurrences(keys, files);
  const summary = summarize(report);
  printReport(summary, report);
}

main();
