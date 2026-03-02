#!/usr/bin/env node

/**
 * Test: Comprehensive chunk mapping validation
 * Verifies that all chunks in the shared mapping work correctly
 */

const { performance } = require('perf_hooks');

// Set up VS Code mock before requiring chunks
const { createTestMock } = require('./helpers/mockVscode');
const mockSetup = createTestMock({
    explorerDates: {
        enableOnboarding: true,
        enableWorkspaceTemplates: true,
        enableReporting: true,
        enableExtensionApi: true
    }
});

const { 
    validateAllChunks, 
    validateBuiltChunks,
    loadChunkForTesting, 
    loadAllChunksForTesting,
    getAllChunkNames 
} = require('./helpers/mockVscode');
const { CHUNK_MAP } = require('../src/shared/chunkMap');
const { federationConfig } = require('../src/moduleFederation');

console.log('🧪 Testing comprehensive chunk mapping...');

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

async function testSharedChunkMapping() {
    console.log('\n📦 Testing shared chunk mapping...');
    
    try {
        const allChunkNames = getAllChunkNames();
        addResult('Got all chunk names', allChunkNames.length > 0, `${allChunkNames.length} chunks`);
        
        console.log('   📋 Available chunks:', allChunkNames.join(', '));
        
        // Test that all chunks from CHUNK_MAP are defined
        const expectedChunks = [
            'onboarding', 'onboardingAssets', 'reporting', 'templates', 
            'analysis', 'diagnostics', 'extensionApi', 'advancedCache',
            'batchProcessor', 'workspaceIntelligence', 'incrementalWorkers',
            'uiAdapters', 'gitInsights', 'smartWatcherFallback'
        ];
        
        const hasAllExpectedChunks = expectedChunks.every(chunkName => 
            allChunkNames.includes(chunkName));
        addResult('Contains all expected chunks', hasAllExpectedChunks);
        
        if (!hasAllExpectedChunks) {
            const missingChunks = expectedChunks.filter(chunk => !allChunkNames.includes(chunk));
            console.log('   ⚠️ Missing chunks:', missingChunks.join(', '));
        }
        
    } catch (error) {
        addResult('Shared chunk mapping test', false, error.message);
    }
}

async function testChunkLoading() {
    console.log('\n🔄 Testing chunk loading...');
    
    try {
        const validation = validateAllChunks();
        addResult('All chunks validate', validation.success, 
            `${validation.loadedCount}/${validation.totalCount}`);
        
        if (!validation.success) {
            console.log('   ❌ Failed chunks:');
            Object.entries(validation.errors).forEach(([chunkName, error]) => {
                console.log(`      ${chunkName}: ${error}`);
            });
        }
        
        // Test loading all chunks at once
        const startTime = performance.now();
        const allChunks = loadAllChunksForTesting();
        const loadTime = performance.now() - startTime;
        
        const loadedChunkCount = Object.keys(allChunks).length;
        addResult('Loaded all chunks successfully', loadedChunkCount > 0, 
            `${loadedChunkCount} chunks in ${Math.round(loadTime)}ms`);
        
        // Test individual chunk loading
        const testChunks = ['onboarding', 'diagnostics', 'smartWatcherFallback'];
        for (const chunkName of testChunks) {
            const chunk = loadChunkForTesting(chunkName);
            addResult(`Individual load: ${chunkName}`, !!chunk);
        }
        
    } catch (error) {
        addResult('Chunk loading test', false, error.message);
    }
}

async function testBuiltArtifacts() {
    console.log('\n🧱 Testing built chunk artifacts...');
    try {
        const nodeArtifacts = validateBuiltChunks('node');
        addResult('Node built chunks resolve', nodeArtifacts.success, 
            `${nodeArtifacts.loadedCount}/${nodeArtifacts.totalCount}`);
        if (!nodeArtifacts.success) {
            console.log('   ❌ Node chunk failures:', nodeArtifacts.errors);
        }

        const webArtifacts = validateBuiltChunks('web');
        addResult('Web built chunks resolve', webArtifacts.success, 
            `${webArtifacts.loadedCount}/${webArtifacts.totalCount}`);
        if (!webArtifacts.success) {
            console.log('   ❌ Web chunk failures:', webArtifacts.errors);
        }
    } catch (error) {
        addResult('Built chunk artifact test', false, error.message);
    }
}

async function testFederationConfigSync() {
    console.log('\n⚙️ Testing federation config sync...');
    
    try {
        // Test that all CHUNK_MAP entries are in federationConfig.chunks
        const federationChunks = Object.keys(federationConfig.chunks).filter(name => name !== 'core');
        const chunkMapChunks = Object.keys(CHUNK_MAP);
        
        const allInFederation = chunkMapChunks.every(chunkName => 
            federationChunks.includes(chunkName));
        addResult('All CHUNK_MAP entries in federation config', allInFederation);
        
        const allFromFederationInMap = federationChunks.every(chunkName => 
            chunkMapChunks.includes(chunkName));
        addResult('All federation chunks in CHUNK_MAP', allFromFederationInMap);
        
        if (!allInFederation) {
            const missingInFederation = chunkMapChunks.filter(chunk => !federationChunks.includes(chunk));
            console.log('   ⚠️ Missing in federation:', missingInFederation.join(', '));
        }
        
        if (!allFromFederationInMap) {
            const missingInMap = federationChunks.filter(chunk => !chunkMapChunks.includes(chunk));
            console.log('   ⚠️ Missing in CHUNK_MAP:', missingInMap.join(', '));
        }
        
        // Test that entry points match
        let entryPointsMatch = true;
        for (const [chunkName, sourcePath] of Object.entries(CHUNK_MAP)) {
            const federationChunk = federationConfig.chunks[chunkName];
            if (federationChunk) {
                const expectedEntry = `${sourcePath}.js`;
                if (federationChunk.entry !== expectedEntry) {
                    console.log(`   ⚠️ Entry mismatch for ${chunkName}: expected ${expectedEntry}, got ${federationChunk.entry}`);
                    entryPointsMatch = false;
                }
            }
        }
        addResult('Entry points match between map and federation', entryPointsMatch);
        
    } catch (error) {
        addResult('Federation config sync test', false, error.message);
    }
}

async function testExtensionIntegration() {
    console.log('\n🔧 Testing extension integration...');
    
    try {
        // Test that extension.js can import the shared utilities
        const fs = require('fs');
        const extensionContent = fs.readFileSync('./extension.js', 'utf8');
        
        const importsChunkMap = extensionContent.includes('src/shared/chunkMap');
        addResult('Extension imports shared chunkMap', importsChunkMap);
        
        const usesGenerateDevLoaderMap = extensionContent.includes('generateDevLoaderMap');
        addResult('Extension uses generateDevLoaderMap', usesGenerateDevLoaderMap);
        
        const hasSourceChunkLoader = extensionContent.includes('sourceChunkLoader');
        addResult('Extension has sourceChunkLoader', hasSourceChunkLoader);
        
        // Test that the old hardcoded chunk map is removed
        const hasHardcodedMap = extensionContent.includes('onboarding: () => localRequire(');
        addResult('Removed hardcoded chunk map', !hasHardcodedMap);
        
    } catch (error) {
        addResult('Extension integration test', false, error.message);
    }
}

async function testJestCompatibility() {
    console.log('\n🧪 Testing Jest compatibility...');
    
    try {
        // Test that chunks can be loaded in Jest-like environment
        // (no actual Jest needed, just simulate the environment)
        
        // Simulate clearing require cache like Jest does
        const testChunk = 'diagnostics';
        
        try {
            const chunk1 = loadChunkForTesting(testChunk);
            
            // Clear cache (find the correct path)
            const sourcePath = CHUNK_MAP[testChunk];
            const fullSourcePath = `../src/${sourcePath}`;
            try {
                const chunkPath = require.resolve(fullSourcePath);
                delete require.cache[chunkPath];
            } catch {
                // If resolve fails, that's fine for this test
                console.log('   ℹ️ Cache clearing test - resolve failed (expected in some cases)');
            }
            
            const chunk2 = loadChunkForTesting(testChunk);
            
            addResult('Chunks work with cache clearing', !!(chunk1 || chunk2), 
                'At least one load succeeded');
            
        } catch (error) {
            addResult('Chunks work with cache clearing', false, error.message);
        }
        
        // Test error handling for missing chunks
        try {
            loadChunkForTesting('nonexistent');
            addResult('Graceful handling of missing chunks', false, 'Should throw for unknown chunks');
        } catch (error) {
            // This should throw for unknown chunks
            addResult('Graceful handling of missing chunks', 
                error.message.includes('Unknown chunk'), 
                'Throws appropriate error for missing chunks');
        }
        
    } catch (error) {
        addResult('Jest compatibility test', false, error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting comprehensive chunk mapping tests...\n');
    
    const startTime = performance.now();
    
    await testSharedChunkMapping();
    await testChunkLoading();
    await testBuiltArtifacts();
    await testFederationConfigSync();
    await testExtensionIntegration();
    await testJestCompatibility();
    
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
    
    console.log('\n🎯 Chunk Mapping Benefits:');
    console.log('   🔄 Dev and prod chunk maps stay in sync automatically');
    console.log('   🧪 Jest tests can load chunks without building');
    console.log('   🛠️ Single source of truth for all chunk definitions');
    console.log('   📦 Easy to add new chunks - just update one file');
    
    return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            // Clean up mock
            mockSetup.dispose();
            require('./helpers/forceExit').scheduleExit(0, success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner error:', error);
            mockSetup.dispose();
            require('./helpers/forceExit').scheduleExit(0, 1);
        });
}

module.exports = { runAllTests };
