const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location == null) return;
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  }
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['extension.js'], // Main entry point (JavaScript, not TypeScript)
    bundle: true,
    format: 'cjs',
    minify: production, // Re-enable minification with careful settings
    minifyWhitespace: true,
    minifyIdentifiers: false, // Keep identifiers readable for VS Code
    minifySyntax: true,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    target: 'node16', // Target Node 16 for better optimization
    outfile: 'dist/extension.js',
    external: ['vscode'], // Exclude vscode module
    logLevel: 'warning',
    keepNames: true, // Preserve function and class names
    treeShaking: true, // Enable tree shaking for size optimization
    legalComments: 'none', // Remove license comments
    drop: production ? ['console', 'debugger'] : [], // Remove console.* in production
    plugins: [
      esbuildProblemMatcherPlugin
    ]
  });
  
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

// Clean up temporary analysis files
process.on('exit', () => {
  try {
    const fs = require('fs');
    if (fs.existsSync('temp-analysis.js')) {
      fs.unlinkSync('temp-analysis.js');
    }
  } catch (e) {
    // Ignore cleanup errors
  }
});