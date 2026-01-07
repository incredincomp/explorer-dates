#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINES_FILE = path.join(__dirname, '..', 'tests', 'artifacts', 'performance', 'baselines.local.json');

function main() {
    if (!fs.existsSync(BASELINES_FILE)) {
        console.error('❌ No baseline file found. Run tests with EXPLORER_DATES_UPDATE_PERF_BASELINES=1 first.');
        process.exit(1);
    }

    const baselines = JSON.parse(fs.readFileSync(BASELINES_FILE, 'utf8'));
    
    console.log('🧪 Testing performance with simulated repository variables...\n');
    
    // Build environment variables from baselines
    const envVars = [];
    Object.entries(baselines).forEach(([key, value]) => {
        const varName = `PERF_BASELINE_${key}`.toUpperCase();
        envVars.push(`${varName}=${value}`);
    });
    
    const envString = envVars.join(' ');
    
    console.log('📊 Simulated repository variables:');
    envVars.forEach(env => {
        const [name, value] = env.split('=');
        console.log(`   ${name}: ${value}`);
    });
    console.log();
    
    try {
        // Test performance regression with baselines
        console.log('⚡ Running chunk & heap regression test...');
        execSync(`${envString} npm run test:performance-regression`, { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        console.log('\n📦 Running bundle & decoration baseline test...');
        execSync(`${envString} npm run test:performance-baselines`, { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        console.log('\n🎉 All performance tests passed with baseline comparison!');
        console.log('\n💡 This simulates how the tests will behave in CI with repository variables.');
        
    } catch (error) {
        console.error('\n❌ Performance tests failed:', error.message);
        console.log('\n🔍 This indicates a performance regression that would fail CI.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}