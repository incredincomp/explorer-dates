#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');

// Allow workspace scans to consider the higher large/extreme thresholds without truncation
process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS = '500000';

async function runWorkspaceDetectionTests() {
    console.log('🧪 Running workspace detection heuristics tests...');
    
    let totalTests = 0;
    let passedTests = 0;
    
    async function runTest(testName, testFn) {
        totalTests++;
        try {
            await testFn();
            console.log(`✅ ${testName}`);
            passedTests++;
        } catch (error) {
            console.error(`❌ ${testName}:`);
            console.error(`   ${error.message}`);
            if (error.stack) {
                console.error(`   ${error.stack.split('\n').slice(1, 3).join('\n')}`);
            }
        }
    }

    // Test 1: Remote environment detection with various workspace sizes
    await runTest('Remote environment detection - small workspace', async () => {
        const mock = createTestMock({
            remoteName: 'ssh-remote',
            uiKind: 1, // Desktop
            mockWorkspaceFileCount: 500
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        // Create mock workspace URI
        const workspaceUri = { fsPath: '/remote/project', path: '/remote/project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'balanced', 'Remote small workspace should use balanced profile');
        assert.strictEqual(analysis.remoteType, 'remote', 'Should detect remote environment');
        assert.strictEqual(analysis.isRemoteEnvironment, true, 'Should flag as remote environment');
        assert.strictEqual(analysis.workspaceSize, 'small', 'Should correctly detect small workspace size');
        
        mock.dispose();
    });

    await runTest('Remote environment detection - large workspace', async () => {
        const mock = createTestMock({
            remoteName: 'ssh-remote',
            uiKind: 1, // Desktop
            mockWorkspaceFileCount: 300000
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/remote/large-project', path: '/remote/large-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'minimal', 'Remote large workspace should use minimal profile');
        assert.strictEqual(analysis.remoteType, 'remote', 'Should detect remote environment');
        assert.strictEqual(analysis.workspaceSize, 'large', 'Should correctly detect large workspace size');
        
        mock.dispose();
    });

    await runTest('Remote environment detection - extreme workspace', async () => {
        const mock = createTestMock({
            remoteName: 'codespaces',
            uiKind: 1, // Desktop
            mockWorkspaceFileCount: 450000
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/workspaces/huge-project', path: '/workspaces/huge-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'minimal', 'Remote extreme workspace should use minimal profile');
        
        mock.dispose();
    });

    // Test 2: Web UI environment detection
    await runTest('Web UI environment detection - small workspace', async () => {
        const mock = createTestMock({
            uiKind: 2, // Web
            remoteName: undefined,
            mockWorkspaceFileCount: 800
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/web/project', path: '/web/project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'balanced', 'Web small workspace should use balanced profile');
        assert.strictEqual(analysis.remoteType, 'web', 'Should detect web environment');
        assert.strictEqual(analysis.isRemoteEnvironment, true, 'Web should be flagged as remote environment');
        
        mock.dispose();
    });

    await runTest('Web UI environment detection - large workspace', async () => {
        const mock = createTestMock({
            uiKind: 2, // Web
            remoteName: undefined,
            mockWorkspaceFileCount: 300000
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/web/large-project', path: '/web/large-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'minimal', 'Web large workspace should use minimal profile');
        
        mock.dispose();
    });

    await runTest('Web UI environment detection - extreme workspace', async () => {
        const mock = createTestMock({
            uiKind: 2, // Web
            remoteName: undefined,
            mockWorkspaceFileCount: 450000
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/web/extreme-project', path: '/web/extreme-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'minimal', 'Web extreme workspace should use minimal profile');
        
        mock.dispose();
    });

    // Test 3: Project type detection - Node.js/JavaScript projects
    await runTest('Project type detection - Node.js with package.json', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 2000,
            mockDirectoryContents: {
                '/local/js-project': [
                    ['package.json', 1], // FileType.File
                    ['src', 2], // FileType.Directory
                    ['node_modules', 2],
                    ['README.md', 1]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/js-project', path: '/local/js-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'web-development', 'Should detect web-development profile for Node.js project');
        
        mock.dispose();
    });

    await runTest('Project type detection - Yarn workspace', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 3500,
            mockDirectoryContents: {
                '/local/yarn-project': [
                    ['yarn.lock', 1],
                    ['package.json', 1],
                    ['packages', 2],
                    ['lerna.json', 1]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/yarn-project', path: '/local/yarn-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'web-development', 'Should detect web-development profile for Yarn project');
        
        mock.dispose();
    });

    // Test 4: Project type detection - Data Science projects
    await runTest('Project type detection - Jupyter notebooks', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 150,
            mockDirectoryContents: {
                '/local/data-project': [
                    ['analysis.ipynb', 1],
                    ['dataset.csv', 1],
                    ['exploration.ipynb', 1],
                    ['models', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/data-project', path: '/local/data-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'data-science', 'Should detect data-science profile for Jupyter project');
        
        mock.dispose();
    });

    await runTest('Project type detection - Python data science', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 450,
            mockDirectoryContents: {
                '/local/python-project': [
                    ['requirements.txt', 1],
                    ['main.py', 1],
                    ['data', 2],
                    ['notebooks', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/python-project', path: '/local/python-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'data-science', 'Should detect data-science profile for Python data project');
        
        mock.dispose();
    });

    // Test 5: Project type detection - Enterprise projects
    await runTest('Project type detection - Docker compose enterprise', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 8000,
            mockDirectoryContents: {
                '/enterprise/microservices': [
                    ['docker-compose.yml', 1],
                    ['services', 2],
                    ['infrastructure', 2],
                    ['kubernetes', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/enterprise/microservices', path: '/enterprise/microservices' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'enterprise', 'Should detect enterprise profile for Docker compose project');
        
        mock.dispose();
    });

    await runTest('Project type detection - Explicit enterprise marker', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 5000,
            mockDirectoryContents: {
                '/enterprise/custom': [
                    ['.enterprise', 1],
                    ['src', 2],
                    ['config', 2],
                    ['deployment', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/enterprise/custom', path: '/enterprise/custom' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'enterprise', 'Should detect enterprise profile with .enterprise marker');
        
        mock.dispose();
    });

    // Test 6: Local environment with different sizes - full profile path
    await runTest('Local environment detection - small workspace (full profile)', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 600,
            mockDirectoryContents: {
                '/local/simple': [
                    ['main.py', 1],
                    ['utils.py', 1],
                    ['README.md', 1]
                ]
            }
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/simple', path: '/local/simple' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'full', 'Local small workspace should use full profile');
        assert.strictEqual(analysis.remoteType, 'local', 'Should detect local environment');
        assert.strictEqual(analysis.isRemoteEnvironment, false, 'Should not flag as remote environment');
        
        mock.dispose();
    });

    await runTest('Local environment detection - medium workspace', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 2500
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/medium-project', path: '/local/medium-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'full', 'Local medium workspace should use full profile');
        assert.strictEqual(analysis.workspaceSize, 'medium', 'Should correctly detect medium workspace size');
        
        mock.dispose();
    });

    await runTest('Local environment detection - large workspace', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 300000
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/large-project', path: '/local/large-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'balanced', 'Local large workspace should use balanced profile');
        
        mock.dispose();
    });

    await runTest('Local environment detection - extreme workspace', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: undefined,
            mockWorkspaceFileCount: 450000
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/local/extreme-project', path: '/local/extreme-project' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'minimal', 'Local extreme workspace should use minimal profile');
        
        mock.dispose();
    });

    // Test 7: Edge cases - null/undefined workspace
    await runTest('Edge case - null workspace URI', async () => {
        const mock = createTestMock({});
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const profile = await detectWorkspaceProfile(null);
        const analysis = await analyzeWorkspaceEnvironment(null);
        
        assert.strictEqual(profile, 'unknown', 'Should return unknown profile for null workspace');
        assert.strictEqual(analysis, null, 'Should return null analysis for null workspace');
        
        mock.dispose();
    });

    await runTest('Edge case - undefined workspace URI', async () => {
        const mock = createTestMock({});
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const profile = await detectWorkspaceProfile(undefined);
        
        assert.strictEqual(profile, 'unknown', 'Should return unknown profile for undefined workspace');
        
        mock.dispose();
    });

    // Test 8: Workspace key generation with different environments and profiles
    await runTest('Workspace key generation - local project', async () => {
        const mock = createTestMock({});
        
        const { generateWorkspaceKey } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/home/user/my-project', path: '/home/user/my-project' };
        
        const key1 = generateWorkspaceKey(workspaceUri, 'default');
        const key2 = generateWorkspaceKey(workspaceUri, 'minimal');
        const key3 = generateWorkspaceKey(workspaceUri, 'default');
        
        assert.ok(key1.startsWith('my-project-'), 'Should start with workspace name');
        assert.ok(key1.includes('-'), 'Should include hash separators');
        assert.notStrictEqual(key1, key2, 'Different profiles should generate different keys');
        assert.strictEqual(key1, key3, 'Same workspace and profile should generate same key');
        
        mock.dispose();
    });

    await runTest('Workspace key generation - null workspace', async () => {
        const mock = createTestMock({});
        
        const { generateWorkspaceKey } = require('../src/utils/workspaceDetection');
        
        const key = generateWorkspaceKey(null, 'test-profile');
        
        assert.strictEqual(key, 'unknown-workspace-test-profile', 'Should handle null workspace gracefully');
        
        mock.dispose();
    });

    // Test 9: Combined environment scenarios
    await runTest('Combined scenario - Remote web environment with enterprise project', async () => {
        const mock = createTestMock({
            uiKind: 2, // Web
            remoteName: 'github-codespaces',
            mockWorkspaceFileCount: 7500,
            mockDirectoryContents: {
                '/codespaces/enterprise-app': [
                    ['docker-compose.yml', 1],
                    ['package.json', 1],
                    ['k8s', 2],
                    ['microservices', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile, analyzeWorkspaceEnvironment } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/codespaces/enterprise-app', path: '/codespaces/enterprise-app' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        const analysis = await analyzeWorkspaceEnvironment(workspaceUri);
        
        assert.strictEqual(profile, 'balanced', 'Large workspace in web environment should use balanced profile (environment optimization takes precedence)');
        assert.strictEqual(analysis.remoteType, 'web', 'Should detect web environment even with remoteName');
        
        mock.dispose();
    });

    await runTest('Combined scenario - Remote environment with data science project', async () => {
        const mock = createTestMock({
            uiKind: 1, // Desktop
            remoteName: 'ssh-remote',
            mockWorkspaceFileCount: 1200,
            mockDirectoryContents: {
                '/remote/ml-research': [
                    ['requirements.txt', 1],
                    ['data-analysis.ipynb', 1],
                    ['models', 2],
                    ['datasets', 2]
                ]
            }
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/remote/ml-research', path: '/remote/ml-research' };
        
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        assert.strictEqual(profile, 'balanced', 'Medium workspace in remote environment should use balanced profile (environment optimization takes precedence)');
        
        mock.dispose();
    });

    // Test 10: Error handling scenarios
    await runTest('Error handling - filesystem read failure graceful degradation', async () => {
        const mock = createTestMock({
            uiKind: 1,
            remoteName: undefined,
            mockWorkspaceFileCount: 1500,
            simulateFileSystemError: true // This should be handled by mock
        });
        
        const { detectWorkspaceProfile } = require('../src/utils/workspaceDetection');
        
        const workspaceUri = { fsPath: '/failing/project', path: '/failing/project' };
        
        // Should not throw, should gracefully fall back
        const profile = await detectWorkspaceProfile(workspaceUri);
        
        // Should still return a reasonable default based on file count and environment
        assert.ok(['full', 'balanced', 'minimal', 'unknown'].includes(profile), 
                 'Should return valid profile even with filesystem errors');
        
        mock.dispose();
    });

    // Summary
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All workspace detection heuristics tests passed!');
        return true;
    } else {
        console.error(`❌ ${totalTests - passedTests} tests failed`);
        return false;
    }
}

if (require.main === module) {
    runWorkspaceDetectionTests()
        .then((success) => {
            process.exitCode = success ? 0 : 1;
        })
        .catch((error) => {
            console.error('❌ Test runner failed:', error);
            process.exitCode = 1;
        });
}

module.exports = { runWorkspaceDetectionTests };