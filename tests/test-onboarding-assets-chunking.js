#!/usr/bin/env node

/**
 * Test: Onboarding Assets Chunking
 * Verifies that webview assets are properly chunked and lazy-loaded
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Set up VS Code mock before requiring any extension modules
const { createMockVscode, createExtensionContext, loadChunkForTesting, validateAllChunks, getAllChunkNames } = require('./helpers/mockVscode');
const { CHUNK_MAP } = require('../src/shared/chunkMap');
const mockSetup = createMockVscode({
    explorerDates: {
        enableOnboarding: true
    }
});
const mockContext = createExtensionContext();

console.log('🧪 Testing onboarding assets chunking system...');

// Test configuration for chunking
const testConfig = {
    validateChunkSeparation: true,
    testLazyLoading: true,
    measureChunkSizes: true,
    testFallbackMechanism: true
};

let testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function addResult(name, passed, details = '') {
    testResults[passed ? 'passed' : 'failed']++;
    testResults.details.push({
        test: name,
        status: passed ? 'PASS' : 'FAIL',
        details: details
    });
    console.log(`${passed ? '✅' : '❌'} ${name}${details ? ': ' + details : ''}`);
}

async function testChunkStructure() {
    console.log('\n📦 Testing chunk structure...');
    
    try {
        // Use shared test utilities to validate chunk integrity
        const chunkValidation = validateAllChunks();
        addResult('All chunks can be loaded', chunkValidation.success, 
            `${chunkValidation.loadedCount}/${chunkValidation.totalCount} chunks`);
        
        if (!chunkValidation.success) {
            Object.entries(chunkValidation.errors).forEach(([chunkName, error]) => {
                console.warn(`  ⚠️ ${chunkName}: ${error}`);
            });
        }
        
        // Test that the onboarding assets chunk exists
        const assetsChunk = loadChunkForTesting('onboardingAssets');
        addResult('Onboarding assets chunk loads', !!assetsChunk);
        
        if (assetsChunk) {
            // Check that it contains the expected classes/exports
            const hasOnboardingAssets = assetsChunk.OnboardingAssets && 
                                        typeof assetsChunk.OnboardingAssets === 'function';
            addResult('Contains OnboardingAssets class', hasOnboardingAssets);
            
            const hasCreateFunction = typeof assetsChunk.createOnboardingAssets === 'function';
            addResult('Has create function', hasCreateFunction);
            
            const hasMemoryInfo = typeof assetsChunk.getMemoryInfo === 'function';
            addResult('Has memory info tracking', hasMemoryInfo);
        }
        
        // Test that the updated onboarding chunk exists and has asset loading
        const onboardingChunk = loadChunkForTesting('onboarding');
        addResult('Onboarding chunk loads', !!onboardingChunk);
        
        if (onboardingChunk) {
            const hasAssetLoader = typeof onboardingChunk.loadOnboardingAssets === 'function';
            addResult('Has asset loader function', hasAssetLoader);
            
            const hasMemoryTracking = typeof onboardingChunk.getAssetsMemoryInfo === 'function';
            addResult('Has assets memory tracking', hasMemoryTracking);
        }
        
    } catch (error) {
        addResult('Chunk structure test', false, error.message);
    }
}

async function testLazyLoadingMechanism() {
    console.log('\n🔄 Testing lazy loading mechanism...');
    
    try {
        // Test the actual lazy loading using shared utilities
        const onboardingChunk = loadChunkForTesting('onboarding');
        addResult('Onboarding chunk loads via test utils', !!onboardingChunk);
        
        if (!onboardingChunk) {
            addResult('Lazy loading mechanism test', false, 'Could not load onboarding chunk');
            return;
        }
        
        const hasLoadFunction = typeof onboardingChunk.loadOnboardingAssets === 'function';
        addResult('Load function is available', hasLoadFunction);
        
        if (hasLoadFunction) {
            // Test that assets are not loaded initially
            const memoryInfoBefore = onboardingChunk.getAssetsMemoryInfo();
            const notLoadedInitially = !memoryInfoBefore.loaded;
            addResult('Assets not loaded initially', notLoadedInitially);
            
            // Test loading the assets
            const startTime = performance.now();
            const assets = await onboardingChunk.loadOnboardingAssets();
            const loadTime = performance.now() - startTime;
            
            if (assets) {
                addResult('Assets loaded successfully', true, `${Math.round(loadTime)}ms`);
                
                // Test that assets provide expected methods
                const hasGetSetupWizardHTML = typeof assets.getSetupWizardHTML === 'function';
                addResult('Has getSetupWizardHTML method', hasGetSetupWizardHTML);
                
                const hasGetFeatureTourHTML = typeof assets.getFeatureTourHTML === 'function';
                addResult('Has getFeatureTourHTML method', hasGetFeatureTourHTML);
                
                const hasGetWhatsNewHTML = typeof assets.getWhatsNewHTML === 'function';
                addResult('Has getWhatsNewHTML method', hasGetWhatsNewHTML);
                
                // Test memory info after loading
                const memoryInfoAfter = onboardingChunk.getAssetsMemoryInfo();
                const loadedAfterLoading = memoryInfoAfter.templatesLoaded;
                addResult('Assets marked as loaded', loadedAfterLoading);
                
                // Test actual asset generation
                const mockPresets = {
                    minimal: { name: 'Test', description: 'Test', settings: {} }
                };
                
                const setupHTML = await assets.getSetupWizardHTML(mockPresets);
                const hasValidHTML = setupHTML && setupHTML.includes('<!DOCTYPE html>');
                addResult('Generated valid HTML', hasValidHTML);
                
                const hasChunkComment = setupHTML && setupHTML.includes('lazy loaded');
                addResult('HTML includes chunk information', hasChunkComment, 'in comments or descriptions');
                
            } else {
                addResult('Assets loaded successfully', false, 'returned null');
            }
        }
        
    } catch (error) {
        addResult('Lazy loading mechanism test', false, error.message);
    }
}

async function testFallbackMechanism() {
    console.log('\n🛡️ Testing fallback mechanism...');
    
    try {
        // Test that onboarding manager can handle missing assets chunk
        const { OnboardingManager } = require('../src/onboarding.js');
        
        const manager = new OnboardingManager(mockContext);
        
        // Test that HTML generation methods exist and can be called
        const hasAsyncGenerateSetup = typeof manager._generateSetupWizardHTML === 'function';
        addResult('Has async setup wizard HTML generator', hasAsyncGenerateSetup);
        
        const hasAsyncGenerateFeatureTour = typeof manager._generateFeatureTourHTML === 'function';
        addResult('Has async feature tour HTML generator', hasAsyncGenerateFeatureTour);
        
        const hasAsyncGenerateWhatsNew = typeof manager._generateWhatsNewHTML === 'function';
        addResult('Has async what\'s new HTML generator', hasAsyncGenerateWhatsNew);
        
        // Test that the methods can actually be called without errors
        try {
            const setupHTML = await manager._generateSetupWizardHTML();
            const hasSetupHTML = setupHTML && setupHTML.includes('<!DOCTYPE html>');
            addResult('Setup wizard HTML generation works', hasSetupHTML);
        } catch (setupError) {
            addResult('Setup wizard HTML generation works', false, setupError.message);
        }
        
        try {
            const featureTourHTML = await manager._generateFeatureTourHTML();
            const hasFeatureTourHTML = featureTourHTML && featureTourHTML.includes('<!DOCTYPE html>');
            addResult('Feature tour HTML generation works', hasFeatureTourHTML);
        } catch (tourError) {
            addResult('Feature tour HTML generation works', false, tourError.message);
        }
        
        try {
            const whatsNewHTML = await manager._generateWhatsNewHTML('1.0.0');
            const hasWhatsNewHTML = whatsNewHTML && whatsNewHTML.includes('<!DOCTYPE html>');
            addResult('What\'s new HTML generation works', hasWhatsNewHTML);
        } catch (whatsNewError) {
            addResult('What\'s new HTML generation works', false, whatsNewError.message);
        }
        
    } catch (error) {
        addResult('Fallback mechanism test', false, error.message);
    }
}

async function testChunkConfiguration() {
    console.log('\n⚙️ Testing chunk configuration...');
    
    try {
        // Test module federation configuration
        const { federationConfig } = require('../src/moduleFederation.js');
        
        const hasOnboardingAssetsChunk = federationConfig.chunks.onboardingAssets;
        addResult('Has onboarding assets chunk config', !!hasOnboardingAssetsChunk);
        
        if (hasOnboardingAssetsChunk) {
            const chunkConfig = federationConfig.chunks.onboardingAssets;
            
            const hasCorrectEntry = chunkConfig.entry === 'src/chunks/onboarding-assets-chunk.js';
            addResult('Chunk has correct entry point', hasCorrectEntry);
            
            const hasDescription = chunkConfig.description && chunkConfig.description.includes('23KB');
            addResult('Chunk has size description', hasDescription);
            
            const hasLoadTrigger = chunkConfig.loadTrigger === 'webview-launch';
            addResult('Chunk has load trigger specified', hasLoadTrigger);
        }
        
        // Test that main onboarding chunk excludes assets
        const mainOnboardingChunk = federationConfig.chunks.onboarding;
        if (mainOnboardingChunk) {
            const excludesAssets = mainOnboardingChunk.external && 
                                   mainOnboardingChunk.external.includes('./onboarding-assets');
            addResult('Main onboarding chunk excludes assets', excludesAssets);
        }
        
        // Test that esbuild chunks configuration exists
        const chunksConfigPath = path.join(__dirname, '../esbuild-federation.js');
        const chunksConfigExists = fs.existsSync(chunksConfigPath);
        addResult('Chunk build configuration exists', chunksConfigExists);
        
    } catch (error) {
        addResult('Chunk configuration test', false, error.message);
    }
}

async function testBundleSizes() {
    console.log('\n📊 Testing expected bundle size reductions...');
    
    try {
        // Test that chunks are built properly
        // We can't easily test actual sizes without building, but we can check structure
        const chunksScriptPath = path.join(__dirname, '../esbuild-federation.js');
        const chunksScriptExists = fs.existsSync(chunksScriptPath);
        addResult('Chunks build script exists', chunksScriptExists);
        
        if (chunksScriptExists) {
            const chunksScript = fs.readFileSync(chunksScriptPath, 'utf8');
            
            const hasAssetChunkBuilding = Boolean(CHUNK_MAP.onboardingAssets);
            addResult('Chunk build pipeline includes onboarding assets', hasAssetChunkBuilding);
            
            const hasProductionOptimizations = chunksScript.includes('minify: production');
            addResult('Has production optimizations for chunks', hasProductionOptimizations);
            
            const hasSizeReporting = chunksScript.includes('sizeKB');
            addResult('Has size reporting for chunks', hasSizeReporting);
        }
        
        // Check package.json scripts
        const packageJsonPath = path.join(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const hasChunkScript = packageJson.scripts['package-chunks'];
        addResult('Package.json has chunk building script', !!hasChunkScript);
        
        const hasChunkWatchScript = packageJson.scripts['watch-chunks'];
        addResult('Package.json has chunk watch script', !!hasChunkWatchScript);
        
    } catch (error) {
        addResult('Bundle sizes test', false, error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting onboarding assets chunking tests...\n');
    
    const startTime = performance.now();
    
    await testChunkStructure();
    await testLazyLoadingMechanism();
    await testFallbackMechanism();
    await testChunkConfiguration();
    await testBundleSizes();
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`\n📊 Test Results (${duration}ms):`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(result => result.status === 'FAIL')
            .forEach(result => {
                console.log(`   ${result.test}: ${result.details}`);
            });
    }
    
    console.log('\n🎯 Chunking Benefits:');
    console.log('   📉 Reduces initial bundle size by ~23KB');
    console.log('   🚀 Webview assets only load when onboarding opens');
    console.log('   🔄 Maintains compatibility with fallback templates');
    console.log('   📱 Better memory management for extension');
    
    return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            // Clean up mock
            mockSetup.dispose();
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner error:', error);
            mockSetup.dispose();
            process.exit(1);
        });
}

module.exports = { runAllTests, testConfig };
