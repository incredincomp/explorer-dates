#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASELINES_FILE = path.join(__dirname, '..', 'tests', 'artifacts', 'performance', 'baselines.local.json');

function main() {
    if (!fs.existsSync(BASELINES_FILE)) {
        console.error('❌ No baseline file found. Run tests with EXPLORER_DATES_UPDATE_PERF_BASELINES=1 first.');
        process.exit(1);
    }

    const baselines = JSON.parse(fs.readFileSync(BASELINES_FILE, 'utf8'));
    
    console.log('# 📊 GitHub Repository Variable Setup Commands');
    console.log('# Run these commands to seed performance baselines for CI validation:');
    console.log('');
    
    const commands = [];
    
    Object.entries(baselines).forEach(([key, value]) => {
        const varName = `PERF_BASELINE_${key}`.toUpperCase();
        commands.push(`gh variable set ${varName} --body "${value}"`);
    });
    
    // Add metadata variables
    const now = new Date().toISOString();
    const version = require('../package.json').version;
    commands.push(`gh variable set PERF_BASELINE_LAST_UPDATED --body "${now}"`);
    commands.push(`gh variable set PERF_BASELINE_VERSION --body "${version}"`);
    
    commands.forEach(cmd => console.log(cmd));
    
    console.log('');
    console.log('# 🚀 Or run all at once:');
    console.log(`${commands.join(' && ')}`);
    
    console.log('');
    console.log('# 📋 Current baseline values:');
    Object.entries(baselines).forEach(([key, value]) => {
        console.log(`# ${key}: ${value}`);
    });
}

if (require.main === module) {
    main();
}