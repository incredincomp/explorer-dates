const PROFILE_ALIASES = {
    dev: 'baseline',
    default: 'baseline',
    small: 'baseline',
    baseline: 'baseline',
    '50k': '50k',
    '50000': '50k',
    '50k-files': '50k',
    '100k': '100k',
    '120k': '100k',
    '100000': '100k',
    mid: '100k',
    medium: '100k',
    '250k': '250k',
    large: '250k',
    'quarter-million': '250k',
    '400k': '450k',
    '450k': '450k',
    extreme: '450k',
    stress: '450k'
};

const PROFILE_DEFINITIONS = {
    baseline: {
        key: 'baseline',
        label: 'Baseline dev workspace',
        description: '~5K files, matches historical soak defaults',
        fileCount: 5000,
        iterations: 250,
        hitPhaseRatio: 0.4,
        delayMs: 10,
        concurrency: 1,
        maxDeltaMb: 24,
        softDeltaMb: 2,
        scanLimit: 6000,
        badgeRefreshInterval: 1500
    },
    '50k': {
        key: '50k',
        label: '50K file workspace',
        description: 'Exercises new detection floor while staying below “large” tier',
        fileCount: 50000,
        iterations: 400,
        hitPhaseRatio: 0.45,
        delayMs: 6,
        concurrency: 1,
        maxDeltaMb: 26,
        softDeltaMb: 2.4,
        scanLimit: 52000,
        badgeRefreshInterval: 4000
    },
    '100k': {
        key: '100k',
        label: '100K file workspace',
        description: 'Medium, still expected to run “full” profile but with more churn',
        fileCount: 120000,
        iterations: 520,
        hitPhaseRatio: 0.5,
        delayMs: 4,
        concurrency: 1,
        maxDeltaMb: 28,
        softDeltaMb: 2.6,
        scanLimit: 121000,
        badgeRefreshInterval: 6000
    },
    '250k': {
        key: '250k',
        label: 'Large workspace (250K files)',
        description: 'Triggers large-tier heuristics and memory shedding',
        fileCount: 250000,
        iterations: 650,
        hitPhaseRatio: 0.55,
        delayMs: 0,
        concurrency: 2,
        maxDeltaMb: 32,
        softDeltaMb: 3,
        scanLimit: 251500,
        badgeRefreshInterval: 12000,
        envOverrides: {
            EXPLORER_DATES_MEMORY_SHEDDING: '1',
            EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB: '6',
            EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT: '1800',
            EXPLORER_DATES_MEMORY_SHED_REFRESH_MS: '90000'
        }
    },
    '450k': {
        key: '450k',
        label: 'Extreme workspace (450K files)',
        description: 'Stresses extreme-tier throttles and watcher fallbacks',
        fileCount: 450000,
        iterations: 780,
        hitPhaseRatio: 0.6,
        delayMs: 0,
        concurrency: 3,
        maxDeltaMb: 36,
        softDeltaMb: 4,
        scanLimit: 451500,
        badgeRefreshInterval: 18000,
        envOverrides: {
            EXPLORER_DATES_MEMORY_SHEDDING: '1',
            EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB: '8',
            EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT: '1500',
            EXPLORER_DATES_MEMORY_SHED_REFRESH_MS: '120000'
        }
    }
};

function normalizeProfileName(raw) {
    if (!raw) return '';
    return String(raw).trim().toLowerCase();
}

function resolveProfileKey(requested, fallback) {
    const normalized = normalizeProfileName(requested);
    if (!normalized) {
        return fallback;
    }
    if (PROFILE_DEFINITIONS[normalized]) {
        return normalized;
    }
    if (PROFILE_ALIASES[normalized]) {
        return PROFILE_ALIASES[normalized];
    }
    return fallback;
}

function resolveMemoryProfile(options = {}) {
    const fallback = normalizeProfileName(options.defaultProfile) || '250k';
    const explicit = options.profile || process.env.MEMORY_WORKSPACE_PROFILE || process.env.MEMORY_WORKSPACE_PROFILES;
    const requested = Array.isArray(explicit) ? explicit[0] : (explicit || '');
    const key = resolveProfileKey(requested, fallback);
    const definition = PROFILE_DEFINITIONS[key] || PROFILE_DEFINITIONS[fallback];
    return {
        ...definition,
        key
    };
}

function applyProfileEnv(profile) {
    const envToApply = {
        EXPLORER_DATES_WORKSPACE_LARGE_THRESHOLD: profile.largeThreshold ?? 250000,
        EXPLORER_DATES_WORKSPACE_EXTREME_THRESHOLD: profile.extremeThreshold ?? 400000,
        EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS: profile.scanLimit ?? Math.max(profile.fileCount + 1000, 50001),
        EXPLORER_DATES_DECORATION_POOL_SIZE: profile.poolSize,
        EXPLORER_DATES_FLYWEIGHT_CACHE_SIZE: profile.flyweightSize,
        EXPLORER_DATES_SOFT_HEAP_ALERT_MB: profile.softDeltaMb
    };

    if (profile.envOverrides) {
        Object.assign(envToApply, profile.envOverrides);
    }

    Object.entries(envToApply).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }
        if (process.env[key] === undefined) {
            process.env[key] = String(value);
        }
    });
}

function buildMemoryTestSettings(profile, overrides = {}) {
    const iterations = Number(
        overrides.iterations ??
            process.env.MEMORY_SOAK_ITERATIONS ??
            profile.iterations
    );

    const hitPhaseRatio = profile.hitPhaseRatio ?? 0.5;
    const hitIterations = Number(
        overrides.hitIterations ??
            process.env.MEMORY_SOAK_HIT_ITERATIONS ??
            Math.max(50, Math.floor(iterations * hitPhaseRatio))
    );

    const delayMs = Number(
        overrides.delayMs ??
            process.env.MEMORY_SOAK_DELAY_MS ??
            profile.delayMs ??
            0
    );

    const maxDeltaMb = Number(
        overrides.maxDeltaMb ??
            process.env.MEMORY_SOAK_MAX_DELTA_MB ??
            profile.maxDeltaMb ??
            24
    );

    const softDeltaMb = Number(
        overrides.softDeltaMb ??
            process.env.MEMORY_SOAK_SOFT_DELTA_MB ??
            profile.softDeltaMb ??
            2
    );

    const concurrency = Math.max(
        1,
        Number(
            overrides.concurrency ??
                process.env.MEMORY_SOAK_CONCURRENCY ??
                profile.concurrency ??
                1
        )
    );

    return {
        iterations,
        hitIterations,
        delayMs,
        maxDeltaMb,
        softDeltaMb,
        concurrency
    };
}

module.exports = {
    PROFILE_DEFINITIONS,
    resolveMemoryProfile,
    applyProfileEnv,
    buildMemoryTestSettings
};
