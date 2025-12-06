const DEFAULT_CACHE_TIMEOUT = 120000; // 2 minutes
const DEFAULT_MAX_CACHE_SIZE = 10000;
const DEFAULT_PERSISTENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_BADGE_LENGTH = 2;
const MONTH_ABBREVIATIONS = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 'Jl', 'Au', 'Se', 'Oc', 'No', 'De'];

const GLOBAL_STATE_KEYS = {
    ADVANCED_CACHE: 'explorerDates.advancedCache',
    ADVANCED_CACHE_METADATA: 'explorerDates.advancedCacheMetadata',
    TEMPLATE_STORE: 'explorerDates.templates',
    WEB_GIT_NOTICE: 'explorerDates.webGitNotice'
};

module.exports = {
    DEFAULT_CACHE_TIMEOUT,
    DEFAULT_MAX_CACHE_SIZE,
    DEFAULT_PERSISTENT_CACHE_TTL,
    MAX_BADGE_LENGTH,
    MONTH_ABBREVIATIONS,
    GLOBAL_STATE_KEYS
};
