#!/usr/bin/env node

const { spawnSync } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rawProfiles = process.env.MEMORY_WORKSPACE_PROFILES || 'baseline,50k,100k,250k,450k';
const profiles = rawProfiles
    .split(',')
    .map(profile => profile.trim())
    .filter(Boolean);

if (!profiles.length) {
    console.error('❌ No workspace profiles specified. Set MEMORY_WORKSPACE_PROFILES or edit scripts/run-memory-profiles.js.');
    process.exit(1);
}

for (const profile of profiles) {
    console.log(`\n🚀 Running memory suite for workspace profile "${profile}"`);
    const result = spawnSync(
        npmCmd,
        ['run', 'test:memory-suite'],
        {
            stdio: 'inherit',
            env: {
                ...process.env,
                MEMORY_WORKSPACE_PROFILE: profile
            }
        }
    );

    if (result.status !== 0) {
        console.error(`❌ Memory suite failed for profile "${profile}" (exit code ${result.status})`);
        process.exit(result.status || 1);
    }
}

console.log('\n✅ Completed memory suite for all requested profiles.');
