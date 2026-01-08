#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { scheduleExit } = require('../tests/helpers/forceExit');

const repo = process.env.GITHUB_REPOSITORY || 'incredincomp/explorer-dates';
const token = process.env.GITHUB_TOKEN || process.env.EXPLORER_DATES_GITHUB_TOKEN;
const ciArtifactsDir = path.join(process.cwd(), 'ci-artifacts');
const downloadSpecs = [
    {
        label: 'chunk baseline',
        names: [
            process.env.EXPLORER_DATES_CI_CHUNK_ARTIFACT,
            process.env.EXPLORER_DATES_CI_BASELINE_ARTIFACT,
            'chunk-load-baseline'
        ].filter(Boolean),
        target: process.env.EXPLORER_DATES_CI_BASELINE_PATH
            || path.join(ciArtifactsDir, 'chunk-load-baseline.json')
    },
    {
        label: 'performance metrics',
        names: [process.env.EXPLORER_DATES_CI_METRICS_ARTIFACT || 'performance-metrics'],
        target: path.join(ciArtifactsDir, 'performance-metrics.json')
    },
    {
        label: 'performance trend',
        names: [process.env.EXPLORER_DATES_CI_TREND_ARTIFACT || 'performance-baseline-trend'],
        target: path.join(ciArtifactsDir, 'performance-baseline-trend.json')
    }
].filter((spec) => spec.names.length > 0);

if (!token) {
    console.error('❌ Missing GitHub token. Set GITHUB_TOKEN or EXPLORER_DATES_GITHUB_TOKEN.');
    process.exit(1);
}

async function githubRequest(pathname) {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: pathname,
        method: 'GET',
        headers: {
            'User-Agent': 'explorer-plus-ci',
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body);
                    return;
                }
                reject(new Error(`GitHub API ${res.statusCode}: ${body}`));
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function downloadFile(url, outfile, depth = 0) {
    if (depth > 5) {
        throw new Error('Too many redirects while downloading artifact');
    }
    const parsed = new URL(url);
    const isGithubHost = parsed.hostname.endsWith('github.com');
    const isGithubApiHost = parsed.hostname === 'api.github.com';
    const isActionsHost = parsed.hostname.endsWith('actions.githubusercontent.com');
    const options = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers: {
            'User-Agent': 'explorer-plus-ci'
        }
    };
    if (isGithubHost || isGithubApiHost || isActionsHost) {
        options.headers.Authorization = `Bearer ${token}`;
    }
    if (isGithubApiHost) {
        options.headers.Accept = 'application/vnd.github+json';
        options.headers['X-GitHub-Api-Version'] = '2022-11-28';
    }
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outfile);
        const req = https.request(options, (res) => {
            if (res.statusCode === 302 && res.headers.location) {
                file.close(() => {
                    fs.unlink(outfile, () =>
                        downloadFile(res.headers.location, outfile, depth + 1)
                            .then(resolve)
                            .catch(reject)
                    );
                });
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Download failed with status ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        });
        req.on('error', (error) => {
            fs.unlink(outfile, () => reject(error));
        });
        req.end();
    });
}

function ensureUnzipAvailable() {
    const result = spawnSync('unzip', ['-v'], { encoding: 'utf8' });
    if (result.error) {
        throw new Error('The "unzip" command is required to extract GitHub artifacts.');
    }
}

function listEntries(zipPath) {
    const result = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(`Failed to list entries from ${zipPath}: ${result.stderr}`);
    }
    return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractEntry(zipPath, entryName, targetFile) {
    const result = spawnSync('unzip', ['-p', zipPath, entryName], { encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(`Failed to extract ${entryName}: ${result.stderr}`);
    }
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, result.stdout, 'utf8');
}

async function fetchArtifacts() {
    const perPage = 100;
    const response = await githubRequest(`/repos/${repo}/actions/artifacts?per_page=${perPage}`);
    const parsed = JSON.parse(response);
    return Array.isArray(parsed.artifacts) ? parsed.artifacts : [];
}

function selectArtifact(artifacts, names) {
    if (!names || names.length === 0) {
        return null;
    }
    for (const name of names) {
        const candidates = artifacts
            .filter((artifact) => artifact.name === name && !artifact.expired)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        if (candidates.length > 0) {
            return candidates[0];
        }
    }
    return null;
}

(async () => {
    try {
        ensureUnzipAvailable();
        if (downloadSpecs.length === 0) {
            console.warn('⚠️ No artifact download specs configured.');
            return;
        }

        const artifacts = await fetchArtifacts();
        for (const spec of downloadSpecs) {
            const artifact = selectArtifact(artifacts, spec.names);
            if (!artifact) {
                console.warn(
                    `⚠️ No artifact found for ${spec.label} (tried: ${spec.names.join(', ')}).`
                );
                continue;
            }

            console.log(
                `📦 (${spec.label}) Found artifact ${artifact.name} (id ${artifact.id}) updated ${artifact.updated_at}`
            );
            const tmpZip = path.join(os.tmpdir(), `ci-artifact-${artifact.id}.zip`);
            await downloadFile(artifact.archive_download_url, tmpZip);
            console.log(`⬇️  (${spec.label}) Downloaded artifact to ${tmpZip}`);

            const entries = listEntries(tmpZip);
            const targetEntry = entries.find((entry) => entry.toLowerCase().endsWith('.json'))
                || entries[0];
            if (!targetEntry) {
                console.warn(`⚠️ (${spec.label}) Artifact archive is empty.`);
                continue;
            }

            extractEntry(tmpZip, targetEntry, spec.target);
            console.log(`✅ (${spec.label}) Extracted ${targetEntry} to ${spec.target}`);
        }
    } catch (error) {
        console.error('❌ Failed to download CI baseline:', error.message);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
})();
