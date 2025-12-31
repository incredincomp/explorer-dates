#!/usr/bin/env node

/**
 * Runs comparative forced-bypass isolation scenarios to measure the impact
 * of decoration pooling and flyweight string caches independently.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const baseScript = path.join(__dirname, 'test-memory-isolation-forced-miss.js');
const defaultIterations = process.env.MEMORY_SOAK_ITERATIONS || '1000';
const defaultDelay = process.env.MEMORY_SOAK_DELAY_MS || '0';
const defaultMaxDelta = process.env.MEMORY_SOAK_MAX_DELTA_MB || '24';

const scenarios = [
    {
        title: 'Control: pool + flyweights (forced bypass)',
        label: 'forced-bypass-control',
        env: {}
    },
    {
        title: 'Pool only (flyweights disabled)',
        label: 'forced-bypass-pool-only',
        env: { EXPLORER_DATES_ENABLE_FLYWEIGHTS: '0', EXPLORER_DATES_ENABLE_DECORATION_POOL: '1' }
    },
    {
        title: 'Flyweights only (pool disabled)',
        label: 'forced-bypass-flyweights-only',
        env: { EXPLORER_DATES_ENABLE_DECORATION_POOL: '0', EXPLORER_DATES_ENABLE_FLYWEIGHTS: '1' }
    },
    {
        title: 'Neither (baseline allocations)',
        label: 'forced-bypass-none',
        env: { EXPLORER_DATES_ENABLE_DECORATION_POOL: '0', EXPLORER_DATES_ENABLE_FLYWEIGHTS: '0' }
    }
];

function runScenario({ title, label, env }) {
    const mergedEnv = {
        ...process.env,
        ...env,
        EXPLORER_DATES_FORCE_CACHE_BYPASS: '1',
        MEMORY_SOAK_LABEL: label,
        MEMORY_SOAK_ITERATIONS: defaultIterations,
        MEMORY_SOAK_DELAY_MS: defaultDelay,
        MEMORY_SOAK_MAX_DELTA_MB: defaultMaxDelta
    };

    console.log(`\n=== ${title} ===`);
    const result = spawnSync('node', ['--expose-gc', baseScript], {
        env: mergedEnv,
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        console.error(`Scenario "${title}" failed with exit code ${result.status}`);
        process.exit(result.status || 1);
    }
}

scenarios.forEach(runScenario);

console.log('\n✅ Isolation matrix completed. Check logs/memory-soak-*.json for per-scenario results.');
