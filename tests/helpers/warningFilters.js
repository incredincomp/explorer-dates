const DEFAULT_WARNING_PATTERNS = [
    /Security workspace boundary enforcement relaxed/,
    /Duplicate explorerDates\.resetToDefaults registration skipped/
];

const activePatterns = new Map();
let originalConsoleWarn = null;

function toPatternKey(pattern) {
    if (!pattern) {
        return null;
    }
    return pattern instanceof RegExp ? pattern.toString() : String(pattern);
}

function coercePattern(pattern) {
    if (!pattern) {
        return null;
    }
    return pattern instanceof RegExp ? pattern : new RegExp(pattern);
}

function registerPattern(pattern) {
    const key = toPatternKey(pattern);
    if (!key || activePatterns.has(key)) {
        return;
    }
    activePatterns.set(key, coercePattern(pattern));
}

function shouldFilter(message) {
    for (const pattern of activePatterns.values()) {
        if (pattern.test(message)) {
            return true;
        }
    }
    return false;
}

function coerceMessageArg(arg) {
    if (typeof arg === 'string') {
        return arg;
    }
    if (arg instanceof Error && typeof arg.message === 'string') {
        return arg.message;
    }
    try {
        if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg);
        }
    } catch {
        // ignore serialization issues and fall back to default string coercion
    }
    return String(arg);
}

function ensureWarningFilterInstalled() {
    if (originalConsoleWarn) {
        return;
    }
    originalConsoleWarn = console.warn;
    console.warn = (...args) => {
        const message = args.map(coerceMessageArg).join(' ');
        if (shouldFilter(message)) {
            return;
        }
        originalConsoleWarn(...args);
    };
}

function installDefaultWarningFilters() {
    DEFAULT_WARNING_PATTERNS.forEach(registerPattern);
    ensureWarningFilterInstalled();
}

function addWarningFilters(patterns = []) {
    patterns.filter(Boolean).forEach(registerPattern);
    ensureWarningFilterInstalled();
}

function restoreWarningFilters() {
    if (!originalConsoleWarn) {
        return;
    }
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
    activePatterns.clear();
}

installDefaultWarningFilters();

module.exports = {
    DEFAULT_WARNING_PATTERNS,
    installDefaultWarningFilters,
    addWarningFilters,
    restoreWarningFilters
};
