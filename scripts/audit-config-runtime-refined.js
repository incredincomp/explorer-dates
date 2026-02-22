const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

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
        if (['node_modules','dist','.git'].includes(e.name)) continue;
        walk(full);
      } else if (e.isFile() && (full.endsWith('.js') || full.endsWith('.ts') || full.endsWith('.json') || full.endsWith('.md'))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function extractGenericBlocks(files) {
  // find occurrences of if (e.affectsConfiguration('explorerDates')) { ... }
  const blocks = [];
  const pattern = /affectsConfiguration\(\s*['"]explorerDates['"]\s*\)/g;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const idx = match.index;
      // find the opening brace after the match
      const braceIdx = text.indexOf('{', idx);
      if (braceIdx === -1) continue;
      // simple brace matching
      let depth = 0;
      let i = braceIdx;
      for (; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const blockText = text.substring(braceIdx + 1, i);
      blocks.push({ file, start: braceIdx + 1, end: i, text: blockText });
    }
  }
  return blocks;
}

function analyze(keys, files) {
  const blocks = extractGenericBlocks(files);

  const report = {};
  for (const key of keys) {
    report[key] = { explicitHandler: false, genericHandler: false, initCallsInGeneric: [] };
  }

  // check per-key explicit affectsConfiguration lines and package.json 'when' usages and config.explorerDates.* references
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');

    for (const key of keys) {
      // explicit affectsConfiguration('explorerDates.<key>') anywhere
      const explicit = new RegExp(`affectsConfiguration\\(\\s*['\"]${key}['\"]\\s*\\)`).test(text);
      if (explicit) report[key].explicitHandler = true;

      // package.json 'when' clauses referencing config.explorerDates.<shortKey>
      // or generic config usage like config.explorerDates.<shortKey>
      const shortKey = key.replace(/^explorerDates\./, '');
      const configDotPattern = new RegExp(`config\.explorerDates\\.${shortKey}`);
      const whenPattern = new RegExp(`"when"\\s*:\\s*"[^"]*config\\.explorerDates\\.${shortKey}[^"]*"`);
      if (configDotPattern.test(text) || whenPattern.test(text)) {
        report[key].explicitHandler = true;
      }
    }
  }

  // check if each key appears in any generic block (using get('key' or string presence) and record initializer calls nearby
  const INIT_FUNCTIONS = [
    'initializeAdvancedSystems', '_reloadUIAdapters', '_applyProgressiveLoadingSetting', '_setupFileWatcher', '_setupPeriodicRefresh', '_loadGitInsightsChunk', 'refreshAll', '_applyFeatureLevel'
  ];
  for (const block of blocks) {
    for (const key of keys) {
      // escape key for regex safety
      const escapedKey = key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      // Also consider the unprefixed key usage (e.g., config.get('cacheTimeout') or get('cacheTimeout'))
      const shortKey = key.replace(/^explorerDates\./, '');
      const getPattern = new RegExp(`get\\(\\s*['\"]${escapedKey}['\"]`);
      const configGetPattern = new RegExp(`config\.get\\(\\s*['\"]${shortKey}['\"]`);
      const shortPattern = new RegExp(`\\b${shortKey}\\b`);
      const rawPattern = key; // direct string occurrence
      if (getPattern.test(block.text) || configGetPattern.test(block.text) || shortPattern.test(block.text) || block.text.includes(rawPattern)) {
        report[key].genericHandler = true;
      }
      for (const fn of INIT_FUNCTIONS) {
        if (block.text.includes(fn)) report[key].initCallsInGeneric.push(fn);
      }
    }
  }

  return report;
}

function summarize(report) {
  const keys = Object.keys(report);
  const rows = keys.map(k => {
    const r = report[k];
    return { key: k, explicitHandler: r.explicitHandler, genericHandler: r.genericHandler, initCalls: r.initCallsInGeneric.join(', ') };
  });
  return rows;
}

function print(rows) {
  console.log('\n=== Refined Runtime Audit ===\n');
  console.log('Key | ExplicitHandler | GenericHandler | InitCallsInGeneric');
  console.log('--- | --- | --- | ---');
  for (const r of rows) {
    console.log(`${r.key} | ${r.explicitHandler ? 'YES' : 'NO'} | ${r.genericHandler ? 'YES' : 'NO'} | ${r.initCalls ? r.initCalls : ''}`);
  }
  const lacks = rows.filter(r => !r.explicitHandler && !r.genericHandler);
  if (lacks.length) {
    console.log('\nKeys without explicit or generic runtime handlers (need attention):');
    lacks.forEach(r => console.log(` - ${r.key}`));
  } else {
    console.log('\nAll keys are either handled explicitly per-key or read inside the generic explorerDates change handler.');
  }
}

function main() {
  const keys = readPackageConfigKeys();
  const files = readAllFiles(SRC);
  const report = analyze(keys, files);
  const rows = summarize(report);
  print(rows);
}

main();
