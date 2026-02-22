#!/usr/bin/env node

/**
 * Test script to validate the bundled extension
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Explorer Dates Bundle...\n');

// Test 1: Check if bundle exists and has reasonable size
const repoRoot = path.join(__dirname, '..');
const bundlePath = path.join(repoRoot, 'dist', 'extension.js');
if (!fs.existsSync(bundlePath)) {
    console.error('❌ Bundle not found at:', bundlePath);
    require('./helpers/forceExit').scheduleExit(0, 1);
} 

const stats = fs.statSync(bundlePath);
const sizeKB = Math.round(stats.size / 1024);
console.log(`📦 Bundle size: ${sizeKB}KB`);

let failed = false;

// Enforce upper bound to avoid silent growth
if (sizeKB < 50) {
    console.error('❌ Bundle is unexpectedly small (< 50KB)');
    failed = true;
} else if (sizeKB < 100) {
    console.log('✅ Bundle size is optimal (< 100KB)');
} else if (sizeKB < 200) {
    console.log('✅ Bundle size is reasonable (< 200KB)');
} else {
    console.error('❌ Bundle size is large (> 200KB)');
    failed = true;
}

// Test 2: Check if bundle is valid JavaScript
try {
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    // Basic syntax validation
    if (bundleContent.includes('module.exports')) {
        console.log('✅ Bundle has CommonJS exports');
    }
    
    if (bundleContent.includes('activate') && bundleContent.includes('deactivate')) {
        console.log('✅ Bundle contains required extension functions');
    }
    
    // Check for key components
    const components = [
        'FileDateDecorationProvider',
        'getLogger',
        'getLocalization'
    ];
    
    let foundComponents = 0;
    components.forEach(component => {
        if (bundleContent.includes(component)) {
            foundComponents++;
            console.log(`✅ Found component: ${component}`);
        } else {
            console.error(`❌ Missing component: ${component}`);
            failed = true;
        }
    });
    
    if (foundComponents === components.length) {
        console.log('✅ All core components present in bundle');
    }
    
    // Test 3: Check for lazy loading
    const lazySignals = [
        'getOnboardingManager',
        'loadFeatureModule',
        'chunkLoader',
        'loadChunk'
    ];
    const hasLazy = lazySignals.some((token) => bundleContent.includes(token));
    if (hasLazy) {
        console.log('✅ Lazy loading markers found');
    } else {
        console.error('❌ Lazy loading markers not found');
        failed = true;
    }
    
} catch (error) {
    console.error('❌ Bundle validation failed:', error.message);
    require('./helpers/forceExit').scheduleExit(0, 1);
    return;
}
// Test 4: Check VSIX package
const pkg = require('../package.json');
const vsixPath = path.join(repoRoot, `explorer-dates-${pkg.version}.vsix`);
if (fs.existsSync(vsixPath)) {
    const vsixStats = fs.statSync(vsixPath);
    const vsixSizeKB = Math.round(vsixStats.size / 1024);
    console.log(`📦 VSIX package size: ${vsixSizeKB}KB`);
    if (vsixSizeKB < 100 || vsixSizeKB > 750) {
        console.error('❌ VSIX size outside expected range (100KB-750KB)');
        failed = true;
    } else {
        console.log('✅ VSIX package size within expected range');
    }
    console.log('✅ VSIX package ready for installation');
} else {
    console.error('❌ VSIX package not found - run "npm run package" to create it');
    failed = true;
}

if (failed) {
    console.error('\n❌ Bundle validation failed');
    require('./helpers/forceExit').scheduleExit(0, 1);
} 

console.log('\n🎉 Bundle validation complete!');
console.log('\n📋 Testing Instructions:');
console.log('1. Local VS Code: Extension already installed via VSIX');
console.log('2. Web testing: Use VS Code for the Web with file system access');
console.log('3. Manual testing: Check Explorer for date badges');
console.log('4. Performance: Run "Explorer Dates: Show Performance Metrics" command');
