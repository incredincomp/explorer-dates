const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts', 'performance');
const LOCAL_BASELINES_FILE = path.join(ARTIFACTS_DIR, 'baselines.local.json');
const LATEST_METRICS_FILE = path.join(ARTIFACTS_DIR, 'latest-metrics.json');

function defaultVariableName(prefix, key) {
    return `${prefix}_${key}`.replace(/[^A-Z0-9]+/gi, '_').toUpperCase();
}

function parseNumeric(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

async function readJson(filePath) {
    try {
        const raw = await fsp.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
}

class BaselineManager {
    constructor(options = {}) {
        this.metrics = options.metrics || {};
        this.prefix = options.prefix || 'PERF_BASELINE';
        this.repo = options.repo || process.env.GITHUB_REPOSITORY || null;
        this.token = options.token || process.env.GITHUB_TOKEN || null;
        this.artifactsDir = options.artifactsDir || ARTIFACTS_DIR;
        this.localBaselineFile = options.localBaselineFile || LOCAL_BASELINES_FILE;
        this.latestMetricsFile = options.latestMetricsFile || LATEST_METRICS_FILE;
        this.updateFlagEnv = options.updateFlagEnv || 'EXPLORER_DATES_UPDATE_PERF_BASELINES';
        this.measurements = new Map();
        this.baselineCache = new Map();
    }

    defineMetric(key, config) {
        this.metrics[key] = { ...(this.metrics[key] || {}), ...config };
    }

    variableName(key) {
        const metric = this.metrics[key];
        if (metric?.variable) {
            return metric.variable;
        }
        return defaultVariableName(this.prefix, key);
    }

    record(key, value, meta = {}) {
        this.measurements.set(key, {
            value: parseNumeric(value),
            meta: {
                collectedAt: new Date().toISOString(),
                ...(meta || {})
            }
        });
    }

    async evaluate(overrides = {}) {
        const results = [];
        for (const [key, measurement] of this.measurements.entries()) {
            const metric = { ...(this.metrics[key] || {}), ...(overrides[key] || {}) };
            const baseline = await this.fetchBaselineValue(key);
            const comparison = this.compareAgainstBaseline(key, metric, measurement, baseline);
            results.push(comparison);
        }
        await this.writeLatestSnapshot(results);
        return results;
    }

    compareAgainstBaseline(key, metric, measurement, baselineEntry) {
        const label = metric.label || key;
        const unit = metric.unit || '';
        const measurementValue = measurement?.value;

        if (typeof measurementValue !== 'number') {
            return {
                key,
                label,
                unit,
                status: 'invalid',
                message: `No numeric measurement captured for ${label}`
            };
        }

        if (!baselineEntry || typeof baselineEntry.value !== 'number') {
            return {
                key,
                label,
                unit,
                status: 'missing-baseline',
                value: measurementValue,
                message: `No baseline defined for ${label}`
            };
        }

        const baselineValue = baselineEntry.value;
        const delta = Number((measurementValue - baselineValue).toFixed(3));
        const deltaPct = baselineValue !== 0 ? delta / baselineValue : Number.POSITIVE_INFINITY;
        const tolerancePct = metric.tolerancePct ?? 0.1;
        const minRegressionDelta = metric.minRegressionDelta ?? 0;

        const regression =
            delta > 0 &&
            (deltaPct >= tolerancePct || baselineValue === 0) &&
            Math.abs(delta) >= minRegressionDelta;

        if (regression) {
            return {
                key,
                label,
                unit,
                status: 'regressed',
                value: measurementValue,
                baseline: baselineValue,
                delta,
                deltaPct,
                source: baselineEntry.source,
                message: `${label} regressed by ${(deltaPct * 100).toFixed(1)}% (Δ${delta.toFixed(2)}${unit})`
            };
        }

        return {
            key,
            label,
            unit,
            status: delta < 0 ? 'improved' : 'pass',
            value: measurementValue,
            baseline: baselineValue,
            delta,
            deltaPct,
            source: baselineEntry.source,
            message: delta < 0
                ? `${label} improved by ${(Math.abs(deltaPct) * 100).toFixed(1)}%`
                : `${label} matched baseline`
        };
    }

    async writeLatestSnapshot(results) {
        if (!results || !results.length) {
            return;
        }
        const payload = results.map((result) => ({
            key: result.key,
            label: result.label,
            unit: result.unit,
            status: result.status,
            value: result.value,
            baseline: result.baseline,
            delta: result.delta,
            deltaPct: result.deltaPct,
            source: result.source,
            message: result.message
        }));
        await writeJson(this.latestMetricsFile, {
            generatedAt: new Date().toISOString(),
            repo: this.repo,
            metrics: payload
        });
    }

    async fetchBaselineValue(key) {
        if (this.baselineCache.has(key)) {
            return this.baselineCache.get(key);
        }

        const variableName = this.variableName(key);
        const envValue = parseNumeric(process.env[variableName]);
        if (typeof envValue === 'number') {
            const entry = { value: envValue, source: `env:${variableName}` };
            this.baselineCache.set(key, entry);
            return entry;
        }

        const repoValue = await this.fetchGithubVariable(variableName);
        if (typeof repoValue === 'number') {
            const entry = { value: repoValue, source: `github:${variableName}` };
            this.baselineCache.set(key, entry);
            return entry;
        }

        const localValue = await this.fetchLocalBaseline(key);
        if (typeof localValue === 'number') {
            const entry = { value: localValue, source: `local:${path.basename(this.localBaselineFile)}` };
            this.baselineCache.set(key, entry);
            return entry;
        }

        this.baselineCache.set(key, null);
        return null;
    }

    async fetchLocalBaseline(key) {
        const data = await readJson(this.localBaselineFile);
        return parseNumeric(data[key]);
    }

    async fetchGithubVariable(name) {
        if (!this.repo || !this.token) {
            return undefined;
        }
        try {
            const body = await this.githubRequest({
                path: `/repos/${this.repo}/actions/variables/${encodeURIComponent(name)}`,
                method: 'GET'
            });
            const parsed = JSON.parse(body);
            return parseNumeric(parsed?.value);
        } catch (error) {
            if (error?.statusCode === 404) {
                return undefined;
            }
            console.warn(`⚠️ Unable to read GitHub variable ${name}: ${error.message || error}`);
            return undefined;
        }
    }

    async upsertGithubVariable(name, value) {
        if (!this.repo || !this.token) {
            return false;
        }
        const payload = JSON.stringify({ name, value: String(value) });
        try {
            await this.githubRequest({
                path: `/repos/${this.repo}/actions/variables/${encodeURIComponent(name)}`,
                method: 'PATCH',
                body: JSON.stringify({ value: String(value) })
            });
            return true;
        } catch (error) {
            if (error?.statusCode !== 404) {
                console.warn(`⚠️ Unable to update variable ${name}: ${error.message || error}`);
                return false;
            }
        }

        try {
            await this.githubRequest({
                path: `/repos/${this.repo}/actions/variables`,
                method: 'POST',
                body: payload
            });
            return true;
        } catch (error) {
            console.warn(`⚠️ Unable to create variable ${name}: ${error.message || error}`);
            return false;
        }
    }

    async githubRequest({ path: requestPath, method, body }) {
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path: requestPath,
            method: method || 'GET',
            headers: {
                'User-Agent': 'explorer-plus-ci',
                'Authorization': `Bearer ${this.token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const responseBody = Buffer.concat(chunks).toString('utf8');
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseBody);
                        return;
                    }
                    const error = new Error(`GitHub API returned ${res.statusCode}: ${responseBody}`);
                    error.statusCode = res.statusCode;
                    reject(error);
                });
            });

            req.on('error', reject);
            if (body) {
                req.write(body);
            }
            req.end();
        });
    }

    async syncBaselines({ updateRemote = false, updateLocal = false } = {}) {
        const shouldUpdate = updateRemote || updateLocal;
        if (!shouldUpdate || this.measurements.size === 0) {
            return { updated: false };
        }

        const localBaselines = updateLocal ? await readJson(this.localBaselineFile) : {};
        let updated = false;

        for (const [key, measurement] of this.measurements.entries()) {
            if (typeof measurement.value !== 'number') {
                continue;
            }
            if (updateLocal) {
                localBaselines[key] = measurement.value;
                updated = true;
            }
            if (updateRemote) {
                const variableName = this.variableName(key);
                await this.upsertGithubVariable(variableName, measurement.value);
                updated = true;
            }
        }

        if (updateLocal && updated) {
            await writeJson(this.localBaselineFile, localBaselines);
        }

        return { updated };
    }
}

module.exports = {
    BaselineManager,
    ARTIFACTS_DIR,
    LOCAL_BASELINES_FILE,
    LATEST_METRICS_FILE
};
