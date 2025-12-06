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

const sharedOptions = {
  bundle: true,
  format: 'cjs',
  minify: production,
  minifyWhitespace: true,
  minifyIdentifiers: false,
  minifySyntax: true,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: 'warning',
  keepNames: true,
  treeShaking: true,
  legalComments: 'none',
  drop: production ? ['console', 'debugger'] : [],
  plugins: [esbuildProblemMatcherPlugin],
  external: ['vscode']
};

const builds = [
  {
    ...sharedOptions,
    entryPoints: ['extension.js'],
    platform: 'node',
    target: 'node16',
    outfile: 'dist/extension.js',
    define: {
      'process.env.VSCODE_WEB': '"false"'
    }
  },
  {
    ...sharedOptions,
    entryPoints: ['src/extension.web.js'],
    platform: 'browser',
    target: ['es2020'],
    outfile: 'dist/extension.web.js',
    define: {
      'process.env.VSCODE_WEB': '"true"'
    }
  }
];

async function buildAll() {
  if (watch) {
    const contexts = await Promise.all(builds.map(config => esbuild.context(config)));
    await Promise.all(contexts.map(ctx => ctx.watch()));
  } else {
    for (const config of builds) {
      await esbuild.build(config);
    }
  }
}

buildAll().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Clean up temporary analysis files
process.on('exit', () => {
  try {
    const fs = require('fs');
    if (fs.existsSync('temp-analysis.js')) {
      fs.unlinkSync('temp-analysis.js');
    }
  } catch {
    // Ignore cleanup errors
  }
});
