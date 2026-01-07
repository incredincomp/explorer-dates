#!/usr/bin/env node
/**
 * Test: Workspace Intelligence Chunk Integration
 * 
 * Tests that the workspace intelligence chunk loads properly and provides
 * the expected API when the feature flag is enabled vs disabled.
 */

const assert = require('assert');
const path = require('path');

// Mock vscode module first before any requires
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    if (id === 'vscode') {
        return {
            workspace: {
                getConfiguration: (section) => {
                    const configs = {
                        enableWorkspaceIntelligence: process.env.TEST_WS_INTELLIGENCE === 'true'
                    };
                    
                    return {
                        get: (key, defaultValue) => configs[key] ?? defaultValue
                    };
                },
                onDidChangeConfiguration: (callback) => ({ dispose: () => {} }),
                workspaceFolders: []
            },
            window: {
                createOutputChannel: () => ({
                    show: () => {},
                    appendLine: () => {},
                    append: () => {},
                    dispose: () => {}
                }),
                showInformationMessage: () => {},
                showWarningMessage: () => {},
                showErrorMessage: () => {}
            },
            Uri: {
                file: (path) => ({ scheme: 'file', path, fsPath: path }),
                parse: (uriString) => ({ scheme: 'file', path: uriString, fsPath: uriString })
            },
            FileType: {
                File: 1,
                Directory: 2,
                SymbolicLink: 64
            },
            EventEmitter: class EventEmitter {
                constructor() {
                    this._listeners = [];
                }
                event = (listener) => {
                    this._listeners.push(listener);
                    return { dispose: () => {} };
                };
                fire = (data) => {
                    this._listeners.forEach(listener => listener(data));
                };
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

async function testWorkspaceIntelligenceChunk() {
    console.log('🔬 Testing workspace intelligence chunk integration...');
    
    try {
        // Test 1: Feature flag controls loading
        console.log('📋 Test 1: Feature flag controls chunk loading');
        
        // Enable workspace intelligence
        process.env.TEST_WS_INTELLIGENCE = 'true';
        
        // Clear require cache to get fresh import
        delete require.cache[require.resolve('../src/featureFlags')];
        const featureFlags = require('../src/featureFlags');
        
        const enabledModule = await featureFlags.workspaceIntelligence();
        assert(enabledModule !== null, 'Workspace intelligence should be loaded when enabled');
        assert(enabledModule.WorkspaceIntelligenceManager, 'Should export WorkspaceIntelligenceManager');
        assert(enabledModule.IncrementalIndexer, 'Should export IncrementalIndexer');
        assert(enabledModule.SmartExclusionManager, 'Should export SmartExclusionManager');
        
        console.log('✅ Workspace intelligence loads when enabled');
        
        // Test 2: Chunk is disabled when feature flag is off
        console.log('📋 Test 2: Chunk is disabled when feature flag is off');
        
        process.env.TEST_WS_INTELLIGENCE = 'false';
        delete require.cache[require.resolve('../src/featureFlags')];
        const featureFlagsDisabled = require('../src/featureFlags');
        
        const disabledModule = await featureFlagsDisabled.workspaceIntelligence();
        assert(disabledModule === null, 'Workspace intelligence should be null when disabled');
        
        console.log('✅ Workspace intelligence is disabled when feature flag is off');
        
        // Test 3: API compatibility
        console.log('📋 Test 3: API compatibility check');
        
        process.env.TEST_WS_INTELLIGENCE = 'true';
        delete require.cache[require.resolve('../src/featureFlags')];
        const featureFlagsEnabled = require('../src/featureFlags');
        
        const module = await featureFlagsEnabled.workspaceIntelligence();
        const { WorkspaceIntelligenceManager } = module;
        
        // Mock file system
        const mockFileSystem = {
            stat: async () => ({ mtime: new Date(), size: 1000 }),
            readdir: async () => []
        };
        
        const manager = new WorkspaceIntelligenceManager(mockFileSystem);
        
        // Test API methods exist
        assert(typeof manager.initialize === 'function', 'Should have initialize method');
        assert(typeof manager.analyzeWorkspace === 'function', 'Should have analyzeWorkspace method');
        assert(typeof manager.getMetrics === 'function', 'Should have getMetrics method');
        assert(typeof manager.dispose === 'function', 'Should have dispose method');
        assert(manager.incrementalIndexer === null, 'Should start with null incrementalIndexer');
        assert(manager.smartExclusion === null, 'Should start with null smartExclusion');
        
        console.log('✅ API compatibility verified');
        
        // Test 4: Bundle size impact calculation
        console.log('📋 Test 4: Bundle size calculation includes workspace intelligence');
        
        const savings = featureFlagsEnabled.calculateSavings();
        assert(savings.totalSavings.includes('KB'), 'Should calculate savings in KB');
        
        // Check that disabling workspace intelligence saves space
        const enabledFeatures = featureFlagsEnabled.getEnabledFeatures();
        assert(enabledFeatures.includes('workspaceIntelligence'), 'Should include workspaceIntelligence in enabled features');
        
        console.log('✅ Bundle size calculation includes workspace intelligence');
        
        console.log('🎉 All workspace intelligence chunk tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Workspace intelligence chunk test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run test
if (require.main === module) {
    testWorkspaceIntelligenceChunk().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testWorkspaceIntelligenceChunk };