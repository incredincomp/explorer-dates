const esbuild = require('esbuild');

const chunks = process.argv.slice(2);
if (!chunks.length) {
  console.error('Usage: node scripts/analyze-chunks.js <entry-path> [<entry-path> ...]');
  process.exit(1);
}

(async function() {
  for (const chunk of chunks) {
    try {
      const res = await esbuild.build({
        entryPoints: [chunk],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        metafile: true,
        write: false,
        external: ['vscode', './utils/localization', 'src/utils/localization', 'src/utils/localization.js']
      });
      const mf = res.metafile;
      const inputs = Object.entries(mf.inputs).map(([k, v]) => [k, v.bytes]).sort((a, b) => b[1] - a[1]);
      console.log(`\n=== Analysis for ${chunk} ===`);
      inputs.slice(0, 30).forEach(([p, b]) => console.log(`${(b / 1024).toFixed(2)}KB  ${p}`));
      const total = inputs.reduce((s, [,b]) => s + b, 0);
      console.log(`Total inputs bytes: ${(total/1024).toFixed(2)}KB`);
    } catch (err) {
      console.error(`Failed analyzing ${chunk}:`, err.message);
    }
  }
})();