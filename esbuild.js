const esbuild = require('esbuild');
const path = require('path');

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
const metafileArg = process.argv.find(arg => arg.startsWith('--metafile='));
const metafilePath = metafileArg ? path.resolve(metafileArg.split('=')[1]) : null;

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
  minifyIdentifiers: production, // Enable identifier minification in production
  minifySyntax: true,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: 'warning',
  keepNames: !production, // Disable keepNames in production for smaller bundles
  treeShaking: true,
  legalComments: 'none',
  allowOverwrite: true, // Allow overwriting existing files
  drop: production ? ['console', 'debugger'] : [],
  dropLabels: production ? ['DEV', 'DEBUG', 'TEST'] : [], // Drop labeled development blocks
  ignoreAnnotations: false, // Respect pure annotations
  metafile: production || !!metafilePath, // Allow explicit metafile output in dev
  mangleProps: production ? /^_/ : undefined, // Mangle private properties in production
  reserveProps: production ? reservePropsPattern : undefined,
  mangleQuoted: production ? true : false, // Also mangle quoted properties
  pure: production ? [
    'console.log', 'console.debug', 'console.trace', 'console.info', 
    'logger.debug', 'logger.trace', 'performance.mark', 'performance.measure'
  ] : [], // Mark console calls as pure for removal
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
  // More aggressive tree shaking  
  plugins: [esbuildProblemMatcherPlugin],
  external: [
    'vscode', // VS Code API
    'fs', 'path', 'util', 'child_process', 'os', 'crypto', 'stream', 'events', // Node.js modules
    'worker_threads', 'cluster', 'net', 'http', 'https', 'url', 'querystring', // Additional Node.js modules
    './chunks/onboarding-chunk', './chunks/reporting-chunk', './chunks/templates-chunk',
    './chunks/analysis-chunk', './chunks/advancedCache-chunk', './chunks/batchProcessor-chunk',
    './chunks/decorations-advanced', './chunks/runtime-management',
    './chunks/workspaceIntelligence', './chunks/extension-api-chunk', './chunks/ui-adapters',
    './chunks/gitInsights-chunk', './chunks/incrementalWorkers', './chunks/smartWatcherFallback-chunk',
    './chunks/diagnostics-chunk' // Mark chunks as external to prevent double bundling
  ]
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
    // Build main bundles
    for (const config of builds) {
      const result = await esbuild.build(config);
      
      // Report bundle size
      if (production) {
        try {
          const fs = require('fs');
          const stats = fs.statSync(config.outfile);
          const sizeKB = Math.round(stats.size / 1024);
          console.log(`📦 ${config.outfile}: ${sizeKB}KB`);
          
          if (result.metafile) {
            // Basic analysis without full output
            const analysis = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
            const lines = analysis.split('\n').slice(0, 10); // Only show top 10 lines
            console.log(`📊 Top imports for ${config.outfile}:`);
            lines.forEach(line => line.trim() && console.log(`  ${line}`));
          }
        } catch {
          // Silent fallback if analysis fails
        }
      }

      // Persist metafile if requested explicitly
      if (metafilePath && result.metafile) {
        try {
          const fs = require('fs');
          fs.writeFileSync(metafilePath, JSON.stringify(result.metafile, null, 2));
          console.log(`📝 Metafile written to ${metafilePath}`);
        } catch (error) {
          console.error(`❌ Failed to write metafile: ${error.message}`);
        }
      }
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
