const fs = require('fs');
const path = require('path');
const { addWarningFilters } = require('./warningFilters');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const DIST_CHUNKS_ROOT = path.join(WORKSPACE_ROOT, 'dist', 'chunks');

const DEFAULT_ALIAS_MAP = {
    exportReporting: 'reporting',
    workspaceTemplates: 'templates',
    analysisCommands: 'analysis',
    extensionApi: 'extensionApi',
    providerInit: 'providerInit',
    fileDateProviderImpl: 'fileDateProviderImpl',
    fileDateProviderImplExport: 'fileDateProviderImplExport',
    decorationsAdvanced: 'decorationsAdvanced',
    loggerImpl: 'loggerImpl'
};

function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
}

function buildCandidates(chunkName, aliases = DEFAULT_ALIAS_MAP) {
    const names = unique([chunkName, aliases[chunkName]]);
    const candidates = [];
    for (const name of names) {
        candidates.push(path.join(DIST_CHUNKS_ROOT, `${name}.js`));
        candidates.push(path.join(WORKSPACE_ROOT, 'dist', `${name}.js`));
    }
    return candidates;
}

function resolveBuiltChunk({ chunkName, candidates, aliases } = {}) {
    const search = candidates && candidates.length ? candidates : buildCandidates(chunkName, aliases);
    for (const candidate of search) {
        if (candidate && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function hasBuiltChunk(chunkName, options = {}) {
    return Boolean(resolveBuiltChunk({ chunkName, ...options }));
}

function requireBuiltChunkOrSkip({ chunkName, label, candidates, aliases } = {}) {
    const resolved = resolveBuiltChunk({ chunkName, candidates, aliases });
    if (!resolved) {
        const message = label
            ? `${label}: built chunk "${chunkName}" not found (source-only run)`
            : `Skipping: built chunk "${chunkName}" not found (source-only run)`;
        console.log(`ℹ️  [chunk-env] ${message}`);
        return null;
    }
    return require(resolved);
}

function expectMissingBuiltChunkWarning({ chunkName, reason } = {}) {
    if (!chunkName) {
        throw new Error('expectMissingBuiltChunkWarning requires a chunkName');
    }
    const pattern = new RegExp(`No built artifact available for chunk.*${chunkName}`);
    addWarningFilters([pattern]);
    if (typeof globalThis !== 'undefined') {
        if (!Array.isArray(globalThis.__strictConsoleAllowlist)) {
            globalThis.__strictConsoleAllowlist = [];
        }
        globalThis.__strictConsoleAllowlist.push(pattern);
    }
    const note = reason ? ` (${reason})` : '';
    console.log(`ℹ️  [chunk-env] Allowing missing built chunk warning for "${chunkName}"${note}`);
}

module.exports = {
    WORKSPACE_ROOT,
    DIST_CHUNKS_ROOT,
    resolveBuiltChunk,
    hasBuiltChunk,
    requireBuiltChunkOrSkip,
    expectMissingBuiltChunkWarning
};
