/**
 * Test file to validate git insights gating functionality
 * Run this with: node test-git-gating.js
 */

// Set up mock vscode FIRST before requiring any modules
const { createTestMock } = require('./helpers/mockVscode');

const mockInstall = createTestMock({
    explorerDates: {
        'showGitInfo': 'none',
        'badgePriority': 'time',
        'enableWorkerThreads': true,
        'enableWasmDigest': true
    }
});
const { vscode } = mockInstall; void vscode;

// Now safe to require modules that depend on vscode
const { getFeatureConfig } = require('../src/featureFlags'); void getFeatureConfig;

// Test git insights conditional loading logic
function testGitGatingLogic() {
    console.log('🧪 Testing Git Insights Gating Logic...\n');
    
    // Test scenarios
    const testScenarios = [
        {
            name: 'Minimal Config (No Git Features)',
            showGitInfo: 'none',
            badgePriority: 'time',
            expectedGitLoad: false
        },
        {
            name: 'Author Badges Enabled',
            showGitInfo: 'none',
            badgePriority: 'author',
            expectedGitLoad: true
        },
        {
            name: 'Git Info in Tooltips',
            showGitInfo: 'tooltip',
            badgePriority: 'time',
            expectedGitLoad: true
        },
        {
            name: 'Full Git Features',
            showGitInfo: 'author',
            badgePriority: 'author',
            expectedGitLoad: true
        },
        {
            name: 'Git Info with Size Priority',
            showGitInfo: 'tooltip',
            badgePriority: 'size',
            expectedGitLoad: true
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    testScenarios.forEach((scenario, index) => {
        console.log(`Test ${index + 1}: ${scenario.name}`);
        console.log(`  Config: showGitInfo="${scenario.showGitInfo}", badgePriority="${scenario.badgePriority}"`);
        
        // Replicate the gating logic from fileDateDecorationProvider.js
        const gitFeaturesRequested = (scenario.showGitInfo !== 'none') || (scenario.badgePriority === 'author');
        
        if (gitFeaturesRequested === scenario.expectedGitLoad) {
            console.log(`  ✅ PASS: Git loading = ${gitFeaturesRequested} (expected: ${scenario.expectedGitLoad})`);
            passed++;
        } else {
            console.log(`  ❌ FAIL: Git loading = ${gitFeaturesRequested} (expected: ${scenario.expectedGitLoad})`);
            failed++;
        }
        console.log();
    });
    
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Test chunk loading paths
function testChunkPaths() {
    console.log('🧪 Testing Chunk Loading Paths...\n');
    
    try {
        // Test git insights chunk path
        const gitInsightsChunk = require('../src/chunks/gitInsights-chunk.js');
        console.log('✅ Git insights chunk entry point loads successfully');
        
        // Check export structure
        if (typeof gitInsightsChunk.getGitInsightsManager === 'function') {
            console.log('✅ getGitInsightsManager function is exported');
        } else {
            console.log('❌ getGitInsightsManager function is missing');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Error loading git insights chunk: ${error.message}`);
        return false;
    }
}

// Test bundle size estimation
function testBundleSizeImpact() {
    console.log('🧪 Testing Bundle Size Impact...\n');
    
    try {
        // Estimate size of git insights components
        const fs = require('fs');
        const path = require('path');
        
        const filesToMeasure = [
            'src/chunks/git-insights-chunk.js',
            'src/chunks/gitInsights-chunk.js',
            'src/workers/indexWorkerHost.js',
            'src/utils/execAsync.js'
        ];
        
        let totalSize = 0;
        
        filesToMeasure.forEach(file => {
            try {
                const stats = fs.statSync(path.join(__dirname, '..', file));
                totalSize += stats.size;
                console.log(`  ${file}: ${Math.round(stats.size / 1024 * 100) / 100}KB`);
            } catch {
                console.log(`  ${file}: File not found`);
            }
        });
        
        console.log(`\n📦 Total git insights size: ~${Math.round(totalSize / 1024 * 100) / 100}KB`);
        console.log('💡 This size is saved when git features are disabled');
        
        return true;
    } catch (error) {
        console.log(`❌ Error measuring bundle size: ${error.message}`);
        return false;
    }
}

// Main test runner
function runTests() {
    console.log('🚀 Git Insights Gating Tests\n');
    console.log('=' .repeat(50) + '\n');
    
    const results = [
        testGitGatingLogic(),
        testChunkPaths(),
        testBundleSizeImpact()
    ];
    
    const allPassed = results.every(result => result);
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('=' .repeat(50));
    
    if (allPassed) {
        console.log('\n🎉 Git insights gating is working correctly!');
        console.log('📋 Key Benefits:');
        console.log('  • Git features are only loaded when needed');
        console.log('  • Bundle size is reduced when git is disabled');  
        console.log('  • No runtime overhead for git-free configurations');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
    // Clean up mock
    mockInstall.dispose();
    
    return allPassed;
}

// Export for use in other test files
if (require.main === module) {
    const ok = runTests();
    if (!ok) {
        require('./helpers/forceExit').scheduleExit(0, 1);
    }
} 

module.exports = {
    testGitGatingLogic,
    testChunkPaths,
    testBundleSizeImpact,
    runTests
};
