const esbuild = require('esbuild');
const { CHUNK_MAP, getAllChunkNames } = require('../src/shared/chunkMap');
const path = require('path');

const external = ['vscode', './utils/localization', 'src/utils/localization', 'src/utils/localization.js'];

async function analyzeChunk(entryPath) {
  try {
    const res = await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      metafile: true,
      write: false,
      external
    });
    const inputs = Object.entries(res.metafile.inputs).map(([p, v]) => ({ path: p, bytes: v.bytes }));
    return inputs;
  } catch (err) {
    console.error(`Failed analyzing ${entryPath}: ${err.message}`);
    return null;
  }
}

(async function main() {
  console.log('Running chunk duplication report...');
  const chunkNames = getAllChunkNames();
  const fileToChunks = new Map(); // file -> { chunks: Set, totalBytes }

  for (const name of chunkNames) {
    const source = CHUNK_MAP[name];
    if (!source) continue;
    // CHUNK_MAP values are already 'src/...' so avoid double prefixing
    const entry = source.endsWith('.js') ? source : `${source}.js`;
    process.stdout.write(`Analyzing ${name} -> ${entry} ... `);
    const inputs = await analyzeChunk(entry);
    if (!inputs) { console.log('failed'); continue; }
    console.log(`${inputs.length} inputs`);

    for (const inp of inputs) {
      const abs = path.normalize(inp.path);
      if (!fileToChunks.has(abs)) fileToChunks.set(abs, { chunks: new Set(), totalBytes: 0, perChunk: new Map() });
      const rec = fileToChunks.get(abs);
      rec.chunks.add(name);
      rec.totalBytes += inp.bytes;
      rec.perChunk.set(name, (rec.perChunk.get(name) || 0) + inp.bytes);
    }
  }

  const entries = Array.from(fileToChunks.entries()).map(([file, meta]) => ({
    file,
    chunkCount: meta.chunks.size,
    totalBytes: meta.totalBytes,
    chunks: Array.from(meta.chunks),
    perChunk: meta.perChunk
  }));

  entries.sort((a,b) => b.chunkCount - a.chunkCount || b.totalBytes - a.totalBytes);

  console.log('\nTop duplicated files (by chunk count):');
  console.log('Count  TotalKB   File');
  entries.slice(0, 40).forEach((e) => {
    console.log(`${String(e.chunkCount).padStart(5)}  ${ (e.totalBytes/1024).toFixed(2).padStart(7)}KB  ${e.file}`);
  });

  console.log('\nTop files by aggregated bytes across chunks:');
  entries.sort((a,b) => b.totalBytes - a.totalBytes);
  console.log('TotalKB  Count  File');
  entries.slice(0, 40).forEach((e) => {
    console.log(`${ (e.totalBytes/1024).toFixed(2).padStart(7)}KB  ${String(e.chunkCount).padStart(5)}  ${e.file}`);
  });

  // For convenience, print the per-chunk presence for the top 15 duplicated files
  console.log('\nPer-chunk presence for top duplicated files:');
  const topDup = entries.slice(0, 15).sort((a,b) => b.chunkCount - a.chunkCount || b.totalBytes - a.totalBytes);
  for (const e of topDup) {
    console.log(`\n${e.chunkCount} chunks — ${(e.totalBytes/1024).toFixed(2)}KB — ${e.file}`);
    const per = Array.from(e.perChunk.entries()).map(([c, b]) => ({ c, kb: (b/1024).toFixed(2) }));
    per.sort((a,b) => b.kb - a.kb);
    per.forEach(p => console.log(`   ${p.kb}KB  ${p.c}`));
  }

  // Also report chunks with the most unique inputs (for spotting heavy chunks)
  const chunkToFiles = new Map();
  for (const [, meta] of fileToChunks.entries()) {
    for (const c of meta.chunks) {
      if (!chunkToFiles.has(c)) chunkToFiles.set(c, { totalBytes: 0, fileCount: 0 });
      const rec = chunkToFiles.get(c);
      rec.totalBytes += meta.perChunk.get(c) || 0;
      rec.fileCount += 1;
    }
  }
  const chunkEntries = Array.from(chunkToFiles.entries()).map(([c, m]) => ({ c, ...m })).sort((a,b) => b.totalBytes - a.totalBytes);
  console.log('\nChunk aggregated footprint (approx, aggregated input bytes):');
  chunkEntries.forEach(e => console.log(`${(e.totalBytes/1024).toFixed(2)}KB  ${String(e.fileCount).padStart(4)} files  ${e.c}`));

})();