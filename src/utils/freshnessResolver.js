const vscode = require('vscode');
const { normalizePath, getRelativePath, getUriPath } = require('./pathUtils');
const { isWebEnvironment } = require('./env');
const { diagLog, diagLogOnce } = require('./webDiagnostics');

const SOURCE_RANK = {
    unknown: 0,
    github: 1,
    git: 2,
    fs: 3
};

const CONFIDENCE_RANK = {
    low: 1,
    medium: 2,
    high: 3
};

function getConfigValue(config, key, fallback) {
    try {
        return config?.get ? config.get(key, fallback) : fallback;
    } catch {
        return fallback;
    }
}

function getBucketThresholds(config) {
    return {
        nowMinutes: Number(getConfigValue(config, 'freshnessBucketMinutesNow', 60)) || 60,
        todayHours: Number(getConfigValue(config, 'freshnessBucketHoursToday', 24)) || 24,
        twoDays: Number(getConfigValue(config, 'freshnessBucketDaysTwo', 2)) || 2,
        oneWeek: Number(getConfigValue(config, 'freshnessBucketDaysWeek', 7)) || 7
    };
}

function bucketFromAge(ageMs, thresholds) {
    if (!Number.isFinite(ageMs) || ageMs < 0) return 'unknown';
    const nowMs = thresholds.nowMinutes * 60 * 1000;
    const todayMs = thresholds.todayHours * 60 * 60 * 1000;
    const twoDaysMs = thresholds.twoDays * 24 * 60 * 60 * 1000;
    const weekMs = thresholds.oneWeek * 24 * 60 * 60 * 1000;
    if (ageMs <= nowMs) return 'now';
    if (ageMs <= todayMs) return 'today';
    if (ageMs <= twoDaysMs) return '2d';
    if (ageMs <= weekMs) return '1w';
    return 'stale';
}

function formatBucketLabel(bucket) {
    switch (bucket) {
        case 'now': return 'now';
        case 'today': return 'today';
        case '2d': return '2d';
        case '1w': return '1w';
        case 'stale': return 'stale';
        default: return 'unknown';
    }
}

function formatSourceLabel(source) {
    switch (source) {
        case 'fs': return 'FS';
        case 'git': return 'Git';
        case 'github': return 'GitHub';
        default: return 'Unknown';
    }
}

function formatBadge(bucket, source, config) {
    const showUnknown = Boolean(getConfigValue(config, 'freshnessShowUnknown', true));
    if (bucket === 'unknown' || source === 'unknown') {
        return showUnknown ? '??' : null;
    }
    const bucketCode = {
        now: 'N',
        today: 'T',
        '2d': '2',
        '1w': '1',
        stale: 'S'
    }[bucket] || '?';
    const sourceCode = {
        fs: 'F',
        git: 'G',
        github: 'H'
    }[source] || '?';
    return `${bucketCode}${sourceCode}`;
}

function formatExactTimestamp(ts) {
    try {
        const date = new Date(ts);
        if (!Number.isFinite(date.getTime())) return null;
        const iso = date.toISOString().replace('T', ' ').replace('Z', '');
        return iso;
    } catch {
        return null;
    }
}

function formatTooltip(freshness, config) {
    if (!freshness) return undefined;
    const verbosity = getConfigValue(config, 'freshnessTooltipVerbosity', 'full');
    const lines = [];
    const bucketLabel = formatBucketLabel(freshness.bucket);
    const sourceLabel = formatSourceLabel(freshness.source);
    lines.push(`Freshness: ${bucketLabel}`);
    if (freshness.exactTimestamp) {
        const exact = formatExactTimestamp(freshness.exactTimestamp);
        if (exact) lines.push(`Exact time: ${exact}`);
    }
    lines.push(`Source: ${sourceLabel}`);
    if (freshness.author) lines.push(`Author: ${freshness.author}`);
    if (freshness.message) lines.push(`Message: ${freshness.message}`);
    lines.push(`Confidence: ${freshness.confidence}`);
    if (freshness.reason && verbosity === 'full') lines.push(`Reason: ${freshness.reason}`);
    return lines.join('\n');
}

function isTimestampTrustworthyForFs(scheme, mtimeMs, nowMs) {
    if (!Number.isFinite(mtimeMs) || mtimeMs <= 0) return false;
    const maxFutureSkewMs = 5 * 60 * 1000;
    if (mtimeMs > nowMs + maxFutureSkewMs) return false;
    if (scheme === 'file') return true;
    const ageMs = nowMs - mtimeMs;
    const minAgeMs = 5 * 60 * 1000;
    const maxAgeMs = 365 * 24 * 60 * 60 * 1000 * 10;
    if (ageMs < minAgeMs) return false;
    if (ageMs > maxAgeMs) return false;
    return true;
}

function buildFreshnessResult({ source, timestampMs, author, message, confidence, reason }, config) {
    if (!Number.isFinite(timestampMs)) {
        return {
            bucket: 'unknown',
            source: source || 'unknown',
            confidence: confidence || 'low',
            reason: reason || 'no-timestamp'
        };
    }
    const thresholds = getBucketThresholds(config);
    const ageMs = Date.now() - timestampMs;
    return {
        bucket: bucketFromAge(ageMs, thresholds),
        source,
        exactTimestamp: timestampMs,
        author: author || undefined,
        message: message || undefined,
        confidence,
        reason: reason || undefined
    };
}

async function resolveFromFs(uri, stat, config) {
    const scheme = uri?.scheme || 'file';
    const allowVirtualFs = Boolean(getConfigValue(config, 'freshnessAllowVirtualFs', false));
    if (scheme !== 'file' && !allowVirtualFs) {
        return { freshness: null, reason: 'fs-virtual-disabled' };
    }
    const mtimeValue = stat?.mtime instanceof Date ? stat.mtime.getTime() : Number(stat?.mtime);
    const nowMs = Date.now();
    if (!Number.isFinite(mtimeValue)) {
        return { freshness: null, reason: 'fs-mtime-missing' };
    }
    if (!isTimestampTrustworthyForFs(scheme, mtimeValue, nowMs)) {
        return { freshness: null, reason: 'fs-mtime-untrusted' };
    }
    const confidence = scheme === 'file' ? 'high' : 'medium';
    const freshness = buildFreshnessResult({
        source: 'fs',
        timestampMs: mtimeValue,
        confidence,
        reason: scheme === 'file' ? 'fs-trust-high' : 'fs-trust-medium'
    }, config);
    return { freshness, reason: null };
}

async function resolveFromGit(uri, provider, config) {
    if (!provider || typeof provider._getGitRecencyTimestamp !== 'function') {
        return { freshness: null, reason: 'git-provider-missing' };
    }
    let gitResult;
    try {
        gitResult = await provider._getGitRecencyTimestamp(uri);
    } catch (error) {
        return { freshness: null, reason: `git-error:${error?.message || 'unknown'}` };
    }
    const ts = Number(gitResult?.timestampMs);
    if (!Number.isFinite(ts) || ts <= 0) {
        return { freshness: null, reason: gitResult?.error || 'git-no-timestamp' };
    }
    const freshness = buildFreshnessResult({
        source: 'git',
        timestampMs: ts,
        author: gitResult?.author || undefined,
        message: gitResult?.message || undefined,
        confidence: 'medium',
        reason: 'git-recency'
    }, config);
    return { freshness, reason: null };
}

function parseGithubUri(uri) {
    if (!uri) return null;
    const scheme = uri.scheme || '';
    if (scheme !== 'github') return null;
    const path = normalizePath(uri.path || '').replace(/^\/+/, '');
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const owner = segments[0];
    const repo = segments[1];
    const filePath = segments.slice(2).join('/');
    const params = new URLSearchParams(uri.query || '');
    const ref = params.get('ref') || params.get('branch') || 'HEAD';
    return { owner, repo, filePath, ref };
}

function findGithubWorkspaceContext(uri) {
    try {
        const folders = vscode.workspace.workspaceFolders || [];
        for (const folder of folders) {
            if (folder?.uri?.scheme === 'github') {
                const parsed = parseGithubUri(folder.uri);
                if (!parsed) continue;
                const relativePath = getRelativePath(folder.uri.path || '', uri?.path || '');
                return { ...parsed, filePath: relativePath };
            }
        }
    } catch { /* ignore */ }
    return null;
}

async function resolveFromGitHub(uri, config) {
    const parsed = parseGithubUri(uri) || findGithubWorkspaceContext(uri);
    if (!parsed || !parsed.owner || !parsed.repo || !parsed.filePath) {
        return { freshness: null, reason: 'github-context-missing' };
    }
    const cacheKey = `${parsed.owner}/${parsed.repo}@${parsed.ref}:${parsed.filePath}`;
    const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?path=${encodeURIComponent(parsed.filePath)}&sha=${encodeURIComponent(parsed.ref)}&per_page=1`;
    const headers = { 'Accept': 'application/vnd.github+json' };
    try {
        const session = vscode?.authentication && typeof vscode.authentication.getSession === 'function'
            ? await vscode.authentication.getSession('github', ['repo'], { createIfNone: false })
            : null;
        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }
    } catch { /* ignore auth */ }
    if (typeof fetch !== 'function') {
        return { freshness: null, reason: 'github-fetch-unavailable' };
    }
    let response;
    try {
        response = await fetch(url, { headers });
    } catch (error) {
        return { freshness: null, reason: `github-fetch-error:${error?.message || 'unknown'}` };
    }
    if (!response || !response.ok) {
        const reason = response ? `github-http-${response.status}` : 'github-no-response';
        return { freshness: null, reason };
    }
    let json;
    try {
        json = await response.json();
    } catch {
        return { freshness: null, reason: 'github-json-error' };
    }
    const entry = Array.isArray(json) ? json[0] : null;
    const commit = entry?.commit || null;
    const author = commit?.author?.name || entry?.author?.login || undefined;
    const message = commit?.message || undefined;
    const timestampMs = commit?.author?.date ? new Date(commit.author.date).getTime() : NaN;
    if (!Number.isFinite(timestampMs)) {
        return { freshness: null, reason: 'github-no-timestamp' };
    }
    const freshness = buildFreshnessResult({
        source: 'github',
        timestampMs,
        author,
        message,
        confidence: 'medium',
        reason: 'github-commit'
    }, config);
    return { freshness, reason: null, cacheKey };
}

function shouldAttemptSource(policy, source) {
    if (!policy || policy === 'auto') return true;
    if (policy === 'unknown') return source === 'unknown';
    return policy === source;
}

async function resolveFreshness({ uri, stat, provider, config, workspaceKind }) {
    const scheme = uri?.scheme || 'file';
    const policy = getConfigValue(config, 'freshnessSourcePolicy', 'auto');
    const attempts = [];
    const nowMs = Date.now();

    if (shouldAttemptSource(policy, 'fs')) {
        const fsResult = await resolveFromFs(uri, stat, config);
        attempts.push({ source: 'fs', reason: fsResult.reason || null });
        if (fsResult.freshness) return { ...fsResult.freshness, attempts };
    }

    if (shouldAttemptSource(policy, 'git')) {
        const gitResult = await resolveFromGit(uri, provider, config);
        attempts.push({ source: 'git', reason: gitResult.reason || null });
        if (gitResult.freshness) return { ...gitResult.freshness, attempts };
    }

    if (shouldAttemptSource(policy, 'github')) {
        const githubResult = await resolveFromGitHub(uri, config);
        attempts.push({ source: 'github', reason: githubResult.reason || null, cacheKey: githubResult.cacheKey || null });
        if (githubResult.freshness) return { ...githubResult.freshness, attempts };
    }

    diagLogOnce('freshness-unknown', 'info', 'No trustworthy freshness source available', {
        scheme,
        workspaceKind: workspaceKind || 'unknown',
        attempts
    });
    return {
        bucket: 'unknown',
        source: 'unknown',
        confidence: 'low',
        reason: 'no-source',
        attempts,
        resolvedAt: nowMs
    };
}

function compareFreshness(a, b) {
    if (!a) return -1;
    if (!b) return 1;
    const rankA = CONFIDENCE_RANK[a.confidence] || 0;
    const rankB = CONFIDENCE_RANK[b.confidence] || 0;
    if (rankA !== rankB) return rankA - rankB;
    const tsA = Number(a.exactTimestamp || 0);
    const tsB = Number(b.exactTimestamp || 0);
    return tsA - tsB;
}

module.exports = {
    resolveFreshness,
    formatBadge,
    formatTooltip,
    bucketFromAge,
    formatBucketLabel,
    formatSourceLabel,
    compareFreshness,
    SOURCE_RANK,
    CONFIDENCE_RANK
};
