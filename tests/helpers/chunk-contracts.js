const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.join(WORKSPACE_ROOT, 'src');
const DIST_CHUNKS_ROOT = path.join(WORKSPACE_ROOT, 'dist', 'chunks');

function normalizeModuleExports(mod) {
    if (!mod || typeof mod !== 'object') {
        return { raw: mod, flat: mod };
    }
    const flat = Object.assign({}, mod);
    if (mod.default && typeof mod.default === 'object') {
        Object.assign(flat, mod.default);
    }
    return { raw: mod, flat };
}

function listExportKeys(mod) {
    if (!mod || typeof mod !== 'object') return [];
    return Object.keys(mod);
}

function matchesExpectedKind(value, kinds = []) {
    if (!kinds.length) return true;
    return kinds.some((kind) => {
        switch (kind) {
            case 'function':
                return typeof value === 'function';
            case 'object':
                return value !== null && typeof value === 'object';
            default:
                return false;
        }
    });
}

function formatMissingExportsError({ modulePath, missing, available, contractName }) {
    const lines = [];
    lines.push(`Contract "${contractName}" missing exports in ${modulePath}`);
    for (const entry of missing) {
        const kindText = entry.kinds && entry.kinds.length ? ` (${entry.kinds.join('|')})` : '';
        lines.push(`- ${entry.name}${kindText}`);
    }
    lines.push(`Available exports: ${available.length ? available.join(', ') : '(none)'}`);
    return lines.join('\n');
}

function buildDistPathCandidates(baseName) {
    const base = baseName.endsWith('.js') ? baseName : `${baseName}.js`;
    return [
        path.join(DIST_CHUNKS_ROOT, base),
        path.join(WORKSPACE_ROOT, 'dist', base)
    ];
}

const CHUNK_EXPORT_CONTRACTS = [
    {
        name: 'onboarding-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'onboarding-chunk.js'),
        distPathCandidates: buildDistPathCandidates('onboarding'),
        requiredExports: [
            { name: 'createOnboardingManager', kinds: ['function'] },
            { name: 'loadOnboardingAssets', kinds: ['function'] }
        ],
        optionalExports: [
            { name: 'OnboardingManager', kinds: ['function', 'object'] },
            { name: 'getAssetsMemoryInfo', kinds: ['function'] }
        ]
    },
    {
        name: 'onboarding-assets-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'onboarding-assets-chunk.js'),
        distPathCandidates: buildDistPathCandidates('onboardingAssets'),
        requiredExports: [
            { name: 'createOnboardingAssets', kinds: ['function'] },
            { name: 'getPresets', kinds: ['function'] }
        ],
        optionalExports: [
            { name: 'OnboardingAssets', kinds: ['function', 'object'] },
            { name: 'getTips', kinds: ['function'] },
            { name: 'getMemoryInfo', kinds: ['function'] }
        ]
    },
    {
        name: 'reporting-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'reporting-chunk.js'),
        distPathCandidates: buildDistPathCandidates('reporting'),
        requiredExports: [
            { name: 'ExportReportingManager', kinds: ['function'] }
        ],
        optionalExports: [
            { name: 'createExportReportingManager', kinds: ['function'] }
        ]
    },
    {
        name: 'templates-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'templates-chunk.js'),
        distPathCandidates: buildDistPathCandidates('templates'),
        requiredExports: [
            { name: 'createWorkspaceTemplatesManager', kinds: ['function'] }
        ],
        optionalExports: [
            { name: 'WorkspaceTemplatesManager', kinds: ['function', 'object'] }
        ]
    },
    {
        name: 'analysis-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'analysis-chunk.js'),
        distPathCandidates: buildDistPathCandidates('analysis'),
        requiredExports: [
            { name: 'registerAnalysisCommands', kinds: ['function'] }
        ]
    },
    {
        name: 'extension-api-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'extension-api-chunk.js'),
        distPathCandidates: buildDistPathCandidates('extensionApi'),
        requiredExports: [
            { name: 'ExtensionApiManager', kinds: ['function'] }
        ],
        optionalExports: [
            { name: 'createExtensionApiManager', kinds: ['function'] }
        ]
    },
    {
        name: 'provider-init-chunk',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'provider-init-chunk.js'),
        distPathCandidates: buildDistPathCandidates('providerInit'),
        requiredExports: [
            { name: 'hydrateProviderOptionalSystems', kinds: ['function'] },
            { name: 'createFileDateDecorationProvider', kinds: ['function'] }
        ]
    },
    {
        name: 'file-date-provider-impl',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'file-date-provider-impl.js'),
        distPathCandidates: buildDistPathCandidates('fileDateProviderImpl'),
        requiredAnyOf: [
            [{ name: 'FileDateDecorationProvider', kinds: ['function'] }],
            [{ name: 'FileDateDecorationProviderImpl', kinds: ['function'] }]
        ]
    },
    {
        name: 'file-date-provider-impl-export',
        sourcePath: path.join(SRC_ROOT, 'chunks', 'file-date-provider-impl-export.js'),
        distPathCandidates: buildDistPathCandidates('fileDateProviderImplExport'),
        requiredAnyOf: [
            [{ name: 'FileDateDecorationProvider', kinds: ['function'] }],
            [{ name: 'FileDateDecorationProviderImpl', kinds: ['function'] }]
        ]
    }
];

const PROVIDER_METHOD_CONTRACT = {
    requiredNested: [
        { path: ['_accessibility'], methods: ['showKeyboardShortcutsHelp'] }
    ],
    ignoreMethods: new Set()
};

module.exports = {
    CHUNK_EXPORT_CONTRACTS,
    PROVIDER_METHOD_CONTRACT,
    normalizeModuleExports,
    listExportKeys,
    matchesExpectedKind,
    formatMissingExportsError
};
