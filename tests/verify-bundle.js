const fs = require('fs');
const path = require('path');

// Simple test to check if our bundled extension can be required
console.log('🔍 Testing bundled extension API...');

try {
    // Check if the bundle exists
    const bundlePath = path.join(__dirname, '..', 'dist', 'extension.js');
    if (!fs.existsSync(bundlePath)) {
        throw new Error('Bundle not found');
    }
    
    console.log('✅ Bundle file exists');
    
    // Read the bundle content
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    // Check for essential patterns
    const patterns = [
        'activate',
        'deactivate', 
        'FileDateDecorationProvider',
        'module.exports',
        'getOnboardingManager', // Our lazy loading function
        'require("vscode")'
    ];
    
    let missingPattern = false;
    patterns.forEach(pattern => {
        if (bundleContent.includes(pattern)) {
            console.log(`✅ Found: ${pattern}`);
        } else {
            console.log(`❌ Missing: ${pattern}`);
            missingPattern = true;
        }
    });

    if (missingPattern) {
        console.error('❌ Bundle validation failed: required patterns missing');
        require('./helpers/forceExit').scheduleExit(0, 1);
        return;
    }
    
    console.log('\n📦 Bundle Summary:');
    console.log(`   Size: ${Math.round(bundleContent.length / 1024)}KB`);
    console.log(`   Lines: ${bundleContent.split('\n').length}`);
    console.log(`   Has source map: ${bundleContent.includes('sourceMappingURL')}`);
    
    console.log('\n✅ Extension bundle appears valid and ready for testing!');
    
} catch (error) {
    console.error('❌ Bundle test failed:', error.message);
    require('./helpers/forceExit').scheduleExit(0, 1);
    return;
}  
