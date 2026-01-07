const esbuild = require('esbuild');
const fs = require('fs');
const { federationConfig } = require('./src/moduleFederation');
const { WEB_CHUNK_GLOBAL_KEY, LEGACY_WEB_CHUNK_GLOBAL_KEY } = require('./src/constants');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alwaysReservedProps = ['activate', 'deactivate', 'provideFileDecoration', 'dispose', 'exports'];
const crossChunkPrivateProps = [
  '_accessibility',
  '_advancedCache',
  '_allocationTelemetryEnabled',
  '_batchProcessor',
  '_batchProcessorModule',
  '_enableWatcherFallbacks',
  '_extensionContext',
  '_fileSystem',
  '_getIndexerMaxFiles',
  '_isWeb',
  '_logger',
  '_maybeWarnAboutGitLimitations',
  '_metrics',
  '_performanceMode',
  '_progressiveLoadingEnabled',
  '_progressiveLoadingJobs',
  '_shouldEnableProgressiveAnalysis',
  '_smartWatcherFallbackManager',
  '_telemetryReportInterval',
  '_telemetryReportTimer',
  '_themeIntegration',
  '_workspaceIntelligence'
];
const reservePropsPattern = new RegExp(
  `^(${[...alwaysReservedProps, ...crossChunkPrivateProps].map(escapeRegex).join('|')})$`
);

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const chunks = process.argv.includes('--chunks');

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
  minifyIdentifiers: production,
  minifySyntax: true,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: 'warning',
  keepNames: !production,
  treeShaking: true,
  legalComments: 'none',
  drop: production ? ['console', 'debugger'] : [],
  dropLabels: production ? ['DEV', 'DEBUG', 'TEST'] : [],
  ignoreAnnotations: false,
  metafile: production,
  mangleProps: production ? /^_/ : undefined,
  reserveProps: production ? reservePropsPattern : undefined,
  mangleQuoted: production ? true : false,
  pure: production ? [
    'console.log', 'console.debug', 'console.trace', 'console.info', 
    'logger.debug', 'logger.trace', 'performance.mark', 'performance.measure'
  ] : [],
  define: production ? {
    'process.env.NODE_ENV': '"production"',
    'process.env.DEBUG': 'false',
    'process.env.DEVELOPMENT': 'false',
    '__DEV__': 'false',
    'DEBUG': 'false'
  } : {
    'process.env.NODE_ENV': '"development"',
    '__DEV__': 'true'
  },
  plugins: [esbuildProblemMatcherPlugin],
  external: [
    'vscode',
    'fs', 'path', 'util', 'child_process', 'os', 'crypto', 'stream', 'events',
    'worker_threads', 'cluster', 'net', 'http', 'https', 'url', 'querystring'
  ]
};

async function buildChunks() {
  console.log('🧩 Building module federation chunks...');
  await fs.promises.mkdir('dist', { recursive: true }).catch(() => {});
  await fs.promises.mkdir('dist/chunks', { recursive: true }).catch(() => {});
  await fs.promises.mkdir('dist/web-chunks', { recursive: true }).catch(() => {});

  const builds = [];
  
  for (const [chunkName, chunkConfig] of Object.entries(federationConfig.chunks)) {
    // Build for Node.js platform to dist/chunks/ for consistent chunk location
    const nodeBuildConfig = {
      ...sharedOptions,
      entryPoints: [chunkConfig.entry],
      outfile: `dist/chunks/${chunkName}.js`,
      platform: 'node',
      external: [...sharedOptions.external, ...chunkConfig.external]
    };
    
    builds.push(esbuild.build(nodeBuildConfig));

    const webBuildConfig = {
      ...sharedOptions,
      entryPoints: [chunkConfig.entry],
      outfile: `dist/web-chunks/${chunkName}.js`,
      platform: 'browser',
      format: 'cjs',
      banner: {
        js: `var module = { exports: {} }; var exports = module.exports; (function() {`
      },
      footer: {
        js: `})(); (function(){const primaryKey="${WEB_CHUNK_GLOBAL_KEY}";const legacyKey="${LEGACY_WEB_CHUNK_GLOBAL_KEY}";const registry=(globalThis[primaryKey]=globalThis[primaryKey]||globalThis[legacyKey]||(globalThis[legacyKey]={}));registry["${chunkName}"]=module.exports;})();`
      },
      external: [...sharedOptions.external, ...chunkConfig.external]
    };

    builds.push(esbuild.build(webBuildConfig));
  }
  
  await Promise.all(builds);
  
  // Report chunk sizes in production
  if (production) {
    console.log('\n📦 Built chunks:');
    let totalSize = 0;
    for (const [chunkName, chunkConfig] of Object.entries(federationConfig.chunks)) {
      try {
        const stats = fs.statSync(`dist/chunks/${chunkName}.js`);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += sizeKB;
        console.log(`   ${chunkName}: ${sizeKB}KB`);
        if (chunkConfig.description) {
          console.log(`     ${chunkConfig.description}`);
        }
      } catch {
        // File might not exist, skip size reporting
      }
    }
    console.log(`\n📊 Total chunks: ${totalSize}KB`);
  }
  
  console.log('✅ Module federation chunks built successfully');
}

async function buildStandard() {
  // Standard monolithic build
  const contexts = await Promise.all([
    // Node.js build
    esbuild.context({
      ...sharedOptions,
      entryPoints: ['extension.js'],
      outfile: 'dist/extension.js',
      platform: 'node'
    }),
    // Web build
    esbuild.context({
      ...sharedOptions,
      entryPoints: ['extension.js'],
      outfile: 'dist/extension.web.js',
      platform: 'browser'
    })
  ]);

  if (watch) {
    await Promise.all(contexts.map(ctx => ctx.watch()));
  } else {
    await Promise.all(contexts.map(ctx => ctx.rebuild()));
    await Promise.all(contexts.map(ctx => ctx.dispose()));
  }
  
  // Print bundle sizes
  for (const target of ['extension.js', 'extension.web.js']) {
    try {
      const fs = require('fs');
      const stats = fs.statSync(`dist/${target}`);
      console.log(`📦 dist/${target}: ${Math.round(stats.size / 1024)}KB`);
    } catch {}
  }
}

// Main build logic
if (chunks) {
  buildChunks();
} else {
  buildStandard();
}
