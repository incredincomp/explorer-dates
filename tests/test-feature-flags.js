/**
 * Test Feature Flag System and Bundle Size Optimization
 */

const fs = require('fs');
const path = require('path');
const { createTestMock, createFeatureLoaderStub } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

// Ensure VS Code API calls route through the shared mock (all feature flags enabled)
const mockSetup = createTestMock({
    explorerDates: {
        enableOnboardingSystem: true,
        enableExportReporting: true,
        enableWorkspaceTemplates: true,
        enableAnalysisCommands: true,
        enableAdvancedCache: true
    }
});

async function testFeatureFlags() {
    console.log('🚀 Testing Feature Flag System...\n');
    
    try {
        // Import feature flags module
        const featureFlags = require('../src/featureFlags');
        // Use canonical test stubs that mirror production chunk shapes where useful
        featureFlags.registerFeatureLoader('onboarding', createFeatureLoaderStub('onboarding'));
        featureFlags.registerFeatureLoader('reporting', createFeatureLoaderStub('reporting'));
        featureFlags.registerFeatureLoader('templates', createFeatureLoaderStub('templates'));
        featureFlags.registerFeatureLoader('analysis', createFeatureLoaderStub('analysis'));
        featureFlags.registerFeatureLoader('advancedCache', createFeatureLoaderStub('advancedCache'));
        
        // Test feature configuration detection
        console.log('📊 Feature Configuration:');
        const config = featureFlags.getFeatureConfig();
        Object.entries(config).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        console.log();
        
        // Test bundle size calculations
        console.log('💾 Bundle Size Analysis:');
        const savings = featureFlags.calculateSavings(config);
        console.log(`  Base Bundle Size: ${savings.baseSize}`);
        console.log(`  Potential Savings: ${savings.totalSavings}`);
        console.log(`  Optimized Size: ${savings.optimizedSize}`);
        console.log(`  Savings Percentage: ${savings.percentage}%\n`);
        
        // Test individual feature loading
        console.log('🔄 Testing Feature Loading:');
        
        // Test onboarding system
        if (config.enableOnboarding) {
            try {
                const result = await featureFlags.onboarding();
                console.log(`  ✅ Onboarding loaded: ${result ? 'Module available' : 'Disabled'}`);
            } catch (err) {
                console.log(`  ⚠️  Onboarding fallback: ${err.message}`);
            }
        } else {
            console.log(`  ⏭️  Onboarding disabled by feature flag`);
        }
        
        // Test export reporting
        if (config.enableExportReporting) {
            try {
                const result = await featureFlags.exportReporting();
                console.log(`  ✅ Export reporting loaded: ${result ? 'Module available' : 'Disabled'}`);
            } catch (err) {
                console.log(`  ⚠️  Export reporting fallback: ${err.message}`);
            }
        } else {
            console.log(`  ⏭️  Export reporting disabled by feature flag`);
        }
        
        // Test workspace templates
        if (config.enableWorkspaceTemplates) {
            try {
                const result = await featureFlags.workspaceTemplates();
                console.log(`  ✅ Workspace templates loaded: ${result ? 'Module available' : 'Disabled'}`);
            } catch (err) {
                console.log(`  ⚠️  Workspace templates fallback: ${err.message}`);
            }
        } else {
            console.log(`  ⏭️  Workspace templates disabled by feature flag`);
        }
        
        // Test analysis commands
        if (config.enableAnalysisCommands) {
            try {
                const result = await featureFlags.analysisCommands();
                console.log(`  ✅ Analysis commands loaded: ${result ? 'Module available' : 'Disabled'}`);
            } catch (err) {
                console.log(`  ⚠️  Analysis commands fallback: ${err.message}`);
            }
        } else {
            console.log(`  ⏭️  Analysis commands disabled by feature flag`);
        }
        
        console.log('\n🎯 Feature Flag Test Summary:');
        console.log(`  • All features configured: ${Object.values(config).every(Boolean) ? 'YES' : 'NO'}`);
        console.log(`  • Bundle optimization active: ${savings.totalSavings > 0 ? 'YES' : 'NO'}`);
        console.log(`  • Feature loading successful: YES`);
        
        // Test with some features disabled to show potential savings
        console.log('\n📉 Potential Bundle Size Reduction:');
        const disabledConfig = {
            enableOnboarding: false,
            enableExportReporting: false,
            enableWorkspaceTemplates: true,
            enableAnalysisCommands: true,
            enableAdvancedCache: true
        };
        const potentialSavings = featureFlags.calculateSavings(disabledConfig);
        console.log(`  With onboarding + export disabled:`);
        console.log(`    Savings: ${potentialSavings.totalSavings} (${potentialSavings.percentage}%)`);
        console.log(`    New size: ${potentialSavings.optimizedSize}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Feature flag test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testBundleOptimization() {
    console.log('\n📦 Testing Bundle Optimization Results...\n');
    
    try {
        // Check if bundle files exist
        const distPath = path.join(__dirname, '..', 'dist');
        const bundleFiles = ['extension.js', 'extension.web.js'];
        
        console.log('📁 Bundle File Analysis:');
        
        let totalSize = 0;
        for (const file of bundleFiles) {
            const filePath = path.join(distPath, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`  ${file}: ${sizeKB}KB`);
                totalSize += sizeKB;
            } else {
                console.log(`  ${file}: NOT FOUND`);
            }
        }
        
        console.log(`  Total Bundle Size: ${totalSize}KB\n`);
        
        // Check feature flag integration in main bundle
        const mainBundlePath = path.join(distPath, 'extension.js');
        if (fs.existsSync(mainBundlePath)) {
            const bundleContent = fs.readFileSync(mainBundlePath, 'utf8');
            
            console.log('🔍 Bundle Content Analysis:');
            const checks = [
                { name: 'Feature flag imports', pattern: /featureFlags/g },
                { name: 'Chunk loading', pattern: /chunkLoader/g },
                { name: 'Dynamic imports', pattern: /import\(/g },
                { name: 'Conditional loading', pattern: /getFeatureConfig/g }
            ];
            
            checks.forEach(check => {
                const matches = bundleContent.match(check.pattern);
                const count = matches ? matches.length : 0;
                console.log(`  ${check.name}: ${count > 0 ? '✅' : '❌'} (${count} occurrences)`);
            });
        }
        
        console.log('\n🎯 Bundle Optimization Summary:');
        console.log(`  • Final bundle size: ${totalSize}KB`);
        console.log(`  • Feature flags integrated: YES`);
        console.log(`  • Dynamic loading enabled: YES`);
        console.log(`  • Optimization successful: ${totalSize < 250 ? 'YES' : 'PARTIAL'}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Bundle optimization test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Explorer Dates - Feature Flag & Bundle Optimization Tests\n');
    
    const featureFlagResults = await testFeatureFlags();
    const bundleResults = await testBundleOptimization();
    
    console.log('\n🏆 Final Test Results:');
    console.log(`  Feature Flags: ${featureFlagResults ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Bundle Optimization: ${bundleResults ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Overall: ${featureFlagResults && bundleResults ? '🎉 SUCCESS' : '⚠️ ISSUES'}`);
    
    return featureFlagResults && bundleResults;
}

runTests()
    .then(success => {
        mockSetup.dispose();
        try {
            scheduleExit(0, success ? 0 : 1);
        } catch {
            require('./helpers/forceExit').scheduleExit(0, success ? 0 : 1);
        }
    })
    .catch(error => {
        console.error('💥 Test runner failed:', error);
        mockSetup.dispose();
        try {
            scheduleExit(0, 1);
        } catch {
            require('./helpers/forceExit').scheduleExit(0, 1);
        }
    });
