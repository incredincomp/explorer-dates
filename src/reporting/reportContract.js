const REPORT_SCHEMA_VERSION = 2;
const DEFAULT_EXCLUDED_SEGMENTS = [
    '.git', 'node_modules', 'dist', 'build', 'out', '.vite', '.vscode-test',
    'test-results', 'playwright-report', 'coverage'
];
const REPORT_TIME_RANGES = ['24h', '7d', '30d', '90d', 'all'];

function normalizePath(value = '') {
    return String(value || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}

function normalizeTimeRange(value) {
    return value === 'full' || value === 'all' ? 'all' : REPORT_TIME_RANGES.includes(value) ? value : 'all';
}

function rangeStart(timeRange, now = Date.now()) {
    const range = normalizeTimeRange(timeRange);
    if (range === 'all') return null;
    const hours = range === '24h' ? 24 : Number.parseInt(range, 10) * 24;
    return now - hours * 60 * 60 * 1000;
}

function validDate(value) {
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(value < 1e12 ? value * 1000 : value);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof value === 'string' && value.trim()) {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    return null;
}

function normalizeStat(stat = {}) {
    const size = Number.isFinite(Number(stat.size)) && Number(stat.size) >= 0 ? Number(stat.size) : null;
    const modified = validDate(stat.mtime ?? stat.mtimeMs);
    const created = validDate(stat.birthtime ?? stat.ctime ?? stat.ctimeMs);
    return { size, modified, created };
}

function compilePattern(pattern) {
    const normalized = normalizePath(pattern).replace(/^\*\*\//, '').replace(/\/\*\*$/, '');
    const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
    try { return new RegExp(`(^|/)${escaped}($|/)`, 'i'); } catch { return null; }
}

function createInclusionPolicy(options = {}) {
    const segments = new Set([...DEFAULT_EXCLUDED_SEGMENTS, ...(options.excludedSegments || [])]
        .map(value => normalizePath(value).replace(/^\/+|\/+$/g, '').toLowerCase()).filter(Boolean));
    const patterns = (options.excludedPatterns || []).map(compilePattern).filter(Boolean);
    return {
        excludedSegments: [...segments],
        isExcluded(relativePath = '') {
            const normalized = normalizePath(relativePath);
            const pathSegments = normalized.split('/').filter(Boolean);
            if (pathSegments.some(segment => segments.has(segment.toLowerCase()))) return true;
            return patterns.some(regex => regex.test(normalized));
        },
        shouldDescend(relativePath = '') { return !this.isExcluded(relativePath, true); }
    };
}

function activityKey(activity) {
    const timestamp = validDate(activity?.timestamp);
    return timestamp ? `${timestamp.toISOString()}|${activity.action || 'modified'}|${activity.source || 'unknown'}` : null;
}

function inRange(date, timeRange, now) {
    const value = validDate(date);
    const start = rangeStart(timeRange, now);
    return Boolean(value && (start === null || value.getTime() >= start));
}

function sortFiles(files) {
    return [...files].sort((a, b) => {
        const at = validDate(a.lastActivity || a.modified)?.getTime() || 0;
        const bt = validDate(b.lastActivity || b.modified)?.getTime() || 0;
        return bt - at || normalizePath(a.path).localeCompare(normalizePath(b.path));
    });
}

function createSummary(files) {
    const sourceBreakdown = { filesystem: 0, user: 0, watcher: 0, git: 0, unavailable: 0 };
    const fileTypes = {};
    const activityByDay = {};
    for (const file of files) {
        fileTypes[file.type || 'unknown'] = (fileTypes[file.type || 'unknown'] || 0) + 1;
        for (const evidence of file.evidence || []) {
            sourceBreakdown[evidence.source] = (sourceBreakdown[evidence.source] || 0) + 1;
            const date = validDate(evidence.timestamp);
            if (date) activityByDay[date.toISOString().slice(0, 10)] = (activityByDay[date.toISOString().slice(0, 10)] || 0) + 1;
        }
        if (file.activityUnavailable) sourceBreakdown.unavailable++;
    }
    const recent = sortFiles(files);
    const active = [...files].filter(file => Number.isFinite(file.activityCount) && file.activityCount > 0)
        .sort((a, b) => b.activityCount - a.activityCount || normalizePath(a.path).localeCompare(normalizePath(b.path)));
    const bySize = [...files].sort((a, b) => (b.size || 0) - (a.size || 0) || normalizePath(a.path).localeCompare(normalizePath(b.path)));
    const oldest = [...files].filter(file => validDate(file.modified))
        .sort((a, b) => validDate(a.modified).getTime() - validDate(b.modified).getTime() || normalizePath(a.path).localeCompare(normalizePath(b.path)));
    return {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
        fileTypes,
        activityByDay,
        mostActiveFiles: active.slice(0, 10).map(file => ({ path: file.path, activityCount: file.activityCount, lastActivity: file.lastActivity })),
        recentlyModified: recent.slice(0, 20).map(file => ({ path: file.path, modified: file.modified, size: file.size })),
        largestFiles: bySize.slice(0, 10).map(file => ({ path: file.path, size: file.size, modified: file.modified })),
        oldestFiles: oldest.slice(0, 10).map(file => ({ path: file.path, modified: file.modified, size: file.size })),
        activitySourceBreakdown: sourceBreakdown
    };
}

module.exports = {
    REPORT_SCHEMA_VERSION, DEFAULT_EXCLUDED_SEGMENTS, REPORT_TIME_RANGES,
    normalizePath, normalizeTimeRange, rangeStart, validDate, normalizeStat,
    createInclusionPolicy, activityKey, inRange, sortFiles, createSummary
};
