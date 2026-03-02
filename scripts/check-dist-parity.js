#!/usr/bin/env node

const { execSync } = require('child_process');

function run(cmd) {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function main() {
    const trackedScopes = [
        'dist',
        'src/locales'
    ];
    const diffOutput = run(`git diff --name-only -- ${trackedScopes.join(' ')}`);
    if (diffOutput) {
        const files = diffOutput.split('\n').filter(Boolean);
        console.error('❌ Dist parity check failed. Regenerated artifacts differ from tracked files:');
        for (const file of files) {
            console.error(`- ${file}`);
        }
        console.error('Run `npm run package-bundle` and commit generated updates.');
        process.exit(1);
    }

    console.log('✅ Dist parity check passed (dist/ and src/locales are in sync).');
}

main();
