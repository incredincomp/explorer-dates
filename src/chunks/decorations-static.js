// Small static helpers and data that are safe to load out-of-band from the
// provider hot-path. Keep this module free of `vscode` dependencies so it can
// be required by the fallback loaders.

// Prefer shared utils chunk when available
let getFileName, normalizePath, getUriPath;
try {
    const shared = require('../chunks/utils-shared-chunk');
    if (shared) { getFileName = shared.getFileName; normalizePath = shared.normalizePath; getUriPath = shared.getUriPath; }
} catch { /* ignore */ }
if (!getFileName) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const pathUtils = dynamicRequire('../utils/pathUtils');
                getFileName = getFileName || pathUtils.getFileName;
                normalizePath = normalizePath || pathUtils.normalizePath;
                getUriPath = getUriPath || pathUtils.getUriPath;
            } catch { /* ignore */ }
        }
    } catch { /* ignore */ }
    if (!getFileName) getFileName = (s) => { const str = String(s||''); const idx = str.replace(/\\/g,'/').lastIndexOf('/'); return idx === -1 ? str : str.substring(idx+1); };
    if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
    if (!getUriPath) getUriPath = (t='') => { if (!t) return ''; if (typeof t === 'string') return t; if (t?.fsPath) return t.fsPath; if (t?.path) return t.path; return String(t); };
} 

const VIEWPORT_DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const VIEWPORT_STANDARD_WINDOW_MS = 10 * 60 * 1000;
const VIEWPORT_MINIMAL_WINDOW_MS = 15 * 60 * 1000;

const DEFAULT_SMART_WATCHER_EXTENSIONS = [
    'ts','tsx','js','jsx','mjs','cjs','mts','cts','vue',
    'py','go','rb','rs','java','kt','swift','cs','cpp','c',
    'php','scala','sql','md','mdx','json','jsonc','yml','yaml',
    'toml','ini','txt','html','css','scss'
];

const SMART_WATCHER_PRIORITY = new Map([
    ['src', 100], ['app', 95], ['apps', 95], ['packages', 90], ['services', 85], ['service', 80],
    ['client', 75], ['clients', 70], ['server', 70], ['servers', 65], ['lib', 65], ['libs', 60],
    ['api', 60], ['apis', 60], ['components', 55], ['modules', 55], ['feature', 50], ['features', 50],
    ['extensions', 45], ['scripts', 45], ['tools', 45], ['examples', 40], ['docs', 35], ['config', 35],
    ['test', 30], ['tests', 30], ['spec', 30], ['specs', 30], ['demo', 25], ['demos', 25]
]);

function basename(filePath) {
    if (!filePath) return '';
    try {
        const path = require('path');
        return path.basename(filePath);
    } catch {
        const normalized = filePath.replace(/\\/g, '/');
        const lastSlash = normalized.lastIndexOf('/');
        return lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);
    }
}

function dirname(filePath) {
    if (!filePath) return '.';
    try {
        const path = require('path');
        return path.dirname(filePath);
    } catch {
        const normalized = filePath.replace(/\\/g, '/');
        const lastSlash = normalized.lastIndexOf('/');
        return lastSlash === -1 ? '.' : normalized.substring(0, lastSlash);
    }
}

function describeFile(input = '') {
    try {
        const pathValue = typeof input === 'string' ? input : getUriPath(input);
        const normalized = normalizePath(pathValue);
        return getFileName(normalized) || normalized || 'unknown';
    } catch {
        return 'unknown';
    }
}

// --- Viewport helpers (pure-ish, operate on arrays/maps passed in) ---
function getNormalizedPathsFromEditors(editors) {
    const now = Date.now();
    if (!Array.isArray(editors)) return [];
    const out = [];
    for (const editor of editors) {
        const uri = editor?.document?.uri; if (!uri || uri.scheme !== 'file') continue;
        const normalized = normalizePath(getUriPath(uri)); if (!normalized) continue;
        out.push({ path: normalized, ts: now });
    }
    return out;
}

function keysToTrimViewportHistory(entriesArray, viewportWindowMs, viewportHistoryLimit, force = false, now = Date.now()) {
    // entriesArray is Array<[key, timestamp]>
    const cutoff = now - (viewportWindowMs * 2);
    const keysToRemove = [];

    for (const [key, ts] of entriesArray) {
        if (force || ts < cutoff || (entriesArray.length > viewportHistoryLimit && ts < now)) {
            keysToRemove.push(key);
        }
    }
    return keysToRemove;
}

// File type -> thematic color mapping (pure data, safe to load out-of-band)
const FILE_TYPE_COLOR_MAP = {
    'js': 'charts.blue', 'ts': 'charts.blue', 'jsx': 'charts.blue', 'tsx': 'charts.blue',
    'css': 'charts.purple', 'scss': 'charts.purple', 'less': 'charts.purple',
    'html': 'charts.orange', 'htm': 'charts.orange', 'xml': 'charts.orange',
    'json': 'charts.green', 'yaml': 'charts.green', 'yml': 'charts.green',
    'md': 'charts.yellow', 'txt': 'charts.yellow', 'log': 'charts.yellow',
    'py': 'charts.red', 'rb': 'charts.red', 'php': 'charts.red'
};

// Color enhancement map used to pick selection-safe alternatives
const COLOR_ENHANCEMENT_MAP = {
    'charts.yellow': 'list.warningForeground',
    'charts.red': 'list.errorForeground',
    'charts.green': 'list.highlightForeground',
    'charts.blue': 'symbolIcon.functionForeground',
    'charts.purple': 'symbolIcon.classForeground',
    'charts.orange': 'list.warningForeground',
    'terminal.ansiYellow': 'list.warningForeground',
    'terminal.ansiGreen': 'list.highlightForeground',
    'terminal.ansiRed': 'list.errorForeground',
    'terminal.ansiBlue': 'symbolIcon.functionForeground',
    'terminal.ansiMagenta': 'symbolIcon.classForeground',
    'terminal.ansiCyan': 'symbolIcon.stringForeground',
    'editorGutter.commentRangeForeground': 'list.deemphasizedForeground',
    'editorWarning.foreground': 'list.warningForeground',
    'editorError.foreground': 'list.errorForeground',
    'editorInfo.foreground': 'list.highlightForeground'
};

function getFileTypeColorMap() { return FILE_TYPE_COLOR_MAP; }
function getColorEnhancementMap() { return COLOR_ENHANCEMENT_MAP; }

// Compute a compact readable descriptor (no l10n) describing how to show the date
function computeReadableDescriptor(date, now = Date.now()) {
    const d = date instanceof Date ? date : new Date(date);
    const diffMs = now - d.getTime();
    if (diffMs < 0) return { kind: 'just' };
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return { kind: 'just' };
    if (diffMins < 60) return { kind: 'minutes', value: diffMins };
    if (diffHours < 24 && d.toDateString() === new Date(now).toDateString()) return { kind: 'hours', value: diffHours };
    if (diffDays === 1) return { kind: 'yesterday' };
    if (diffDays < 7) return { kind: 'days', value: diffDays };
    return null;
}

// Build a compact badge descriptor for basic formats
function formatDateBadge(date, formatType = 'smart', precalcDiffMs = null) {
    const now = Date.now();
    const ms = precalcDiffMs == null ? (now - (date instanceof Date ? date.getTime() : new Date(date).getTime())) : precalcDiffMs;
    const diffMinutes = Math.floor(ms / (1000 * 60));
    const diffHours = Math.floor(ms / (1000 * 60 * 60));
    const diffDays = Math.floor(ms / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    const p = (value, keySuffix = null) => ({ value, key: keySuffix ? `badge:${formatType || 'default'}:${keySuffix}` : null });

    switch (formatType) {
        case 'relative-short':
        case 'relative-long':
            if (diffMinutes < 1) return p('●●', 'just');
            if (diffMinutes < 60) return p(`${Math.min(diffMinutes, 99)}m`, `m:${Math.min(diffMinutes, 99)}`);
            if (diffHours < 24) return p(`${Math.min(diffHours, 23)}h`, `h:${Math.min(diffHours, 23)}`);
            if (diffDays < 7) return p(`${diffDays}d`, `d:${diffDays}`);
            if (diffWeeks < 4) return p(`${diffWeeks}w`, `w:${diffWeeks}`);
            if (diffMonths < 12) return p(`${diffMonths}M`, `M:${diffMonths}`);
            return p('1y', 'y:1');
        case 'absolute-short':
        case 'absolute-long': {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const D = (date instanceof Date) ? date.getDate() : new Date(date).getDate();
            const T = `${months[(date instanceof Date) ? date.getMonth() : new Date(date).getMonth()]}${D < 10 ? '0' + D : D}`;
            const key = `abs:${(date instanceof Date) ? date.getMonth() : new Date(date).getMonth()}-${D}`;
            return p(T, key);
        }
        case 'technical':
            if (diffMinutes < 60) return p(`${diffMinutes}m`, `tech:m:${diffMinutes}`);
            if (diffHours < 24) return p(`${diffHours}h`, `tech:h:${diffHours}`);
            return p(`${diffDays}d`, `tech:d:${diffDays}`);
        case 'minimal':
            if (diffHours < 1) return p('••', 'min:now');
            if (diffHours < 24) return p('○○', 'min:hours');
            return p('──', 'min:days');
        default:
            if (diffMinutes < 60) return p(`${diffMinutes}m`, `smart:m:${diffMinutes}`);
            if (diffHours < 24) return p(`${diffHours}h`, `smart:h:${diffHours}`);
            return p(`${diffDays}d`, `smart:d:${diffDays}`);
    }
}

module.exports = {
    VIEWPORT_DEFAULT_WINDOW_MS,
    VIEWPORT_STANDARD_WINDOW_MS,
    VIEWPORT_MINIMAL_WINDOW_MS,
    DEFAULT_SMART_WATCHER_EXTENSIONS,
    SMART_WATCHER_PRIORITY,
    FILE_TYPE_COLOR_MAP,
    COLOR_ENHANCEMENT_MAP,
    getFileTypeColorMap,
    getColorEnhancementMap,
    getNormalizedPathsFromEditors,
    keysToTrimViewportHistory,
    computeReadableDescriptor,
    formatDateBadge,
    basename,
    dirname,
    describeFile
};