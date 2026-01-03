#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { createMockVscode } = require('./helpers/mockVscode');

// Mock vscode globally BEFORE requiring provider
const mockVsCode = createMockVscode({
    explorerDates: {
        enabled: true,
        format: 'relative',
        badgePriority: 'time',
        dateFormat: 'short',
        timestampFormat: '12h',
        cacheTimeout: 30000
    }
});

global.vscode = mockVsCode.vscode;

const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

async function runAllTests() {
    console.log('🚀 Starting Multi-Workspace Scenarios tests...\n');

    const testSuite = [
        testWorkspaceFolderManagement,
        testConfigurationInheritanceAndScoping,
        testResourceManagementAcrossWorkspaces,
        testCrossWorkspaceFileOperations,
        testProviderLifecycleInMultiWorkspace
    ];

    let passed = 0;
    let total = 0;

    for (const testGroup of testSuite) {
        try {
            const result = await testGroup();
            passed += result.passed;
            total += result.total;
        } catch (error) {
            console.error(`❌ Test group failed: ${error.message}`);
            total += 1;
        }
    }

    console.log(`\n🎯 Multi-workspace scenarios tests completed: ${passed}/${total} passed`);
    return { passed, total };
}

async function testWorkspaceFolderManagement() {
    console.log('📁 Testing Workspace Folder Management...');
    let passed = 0, total = 0;

    // Test 1: Multi-root workspace initialization
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Project2', index: 1 },
                { uri: { fsPath: '/workspace3' }, name: 'Project3', index: 2 }
            ]
        });

        const provider = new FileDateDecorationProvider();
        
        if (mock.workspace.workspaceFolders?.length === 3 && 
            mock.workspace.workspaceFolders[0].name === 'Project1' &&
            mock.workspace.workspaceFolders[2].name === 'Project3') {
            console.log('✅ Multi-root workspace initialization');
            passed++;
        } else {
            console.log('❌ Multi-root workspace initialization failed');
        }
        
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Multi-root workspace initialization:', error.message);
    }

    // Test 2: Workspace folder additions
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, dispose: localDispose } = createMockVscode();
        
        let workspaceChangeEvent = null;
        const disposable = mock.workspace.onDidChangeWorkspaceFolders(event => {
            workspaceChangeEvent = event;
        });

        const newFolder = addWorkspaceFolder({
            path: '/new-workspace',
            name: 'NewProject'
        });

        if (newFolder.name === 'NewProject' && 
            workspaceChangeEvent?.added?.length === 1 &&
            workspaceChangeEvent.added[0].name === 'NewProject' &&
            workspaceChangeEvent.removed.length === 0) {
            console.log('✅ Workspace folder additions');
            passed++;
        } else {
            console.log('❌ Workspace folder additions failed');
        }

        disposable.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Workspace folder additions:', error.message);
    }

    // Test 3: Workspace folder removals
    total++;
    try {
        const { vscode: mock, removeWorkspaceFolder, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Project2', index: 1 }
            ]
        });

        let workspaceChangeEvent = null;
        const disposable = mock.workspace.onDidChangeWorkspaceFolders(event => {
            workspaceChangeEvent = event;
        });

        const removedFolder = removeWorkspaceFolder(0);

        if (removedFolder?.name === 'Project1' &&
            mock.workspace.workspaceFolders.length === 1 &&
            mock.workspace.workspaceFolders[0].name === 'Project2' &&
            mock.workspace.workspaceFolders[0].index === 0 &&
            workspaceChangeEvent?.removed?.length === 1) {
            console.log('✅ Workspace folder removals');
            passed++;
        } else {
            console.log('❌ Workspace folder removals failed');
        }

        disposable.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Workspace folder removals:', error.message);
    }

    // Test 4: Workspace switching scenarios
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, removeWorkspaceFolder, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let configChangeCount = 0;
        let workspaceChangeCount = 0;

        const configDisposable = mock.workspace.onDidChangeConfiguration(() => {
            configChangeCount++;
        });

        const workspaceDisposable = mock.workspace.onDidChangeWorkspaceFolders(() => {
            workspaceChangeCount++;
        });

        removeWorkspaceFolder(0);
        addWorkspaceFolder({
            path: '/new-workspace',
            name: 'SwitchedWorkspace'
        });

        triggerConfigChange({
            'explorerDates.enabled': true,
            'explorerDates.format': 'relative'
        });

        if (workspaceChangeCount === 2 && configChangeCount === 1) {
            console.log('✅ Workspace switching scenarios');
            passed++;
        } else {
            console.log('❌ Workspace switching scenarios failed');
        }

        configDisposable.dispose();
        workspaceDisposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Workspace switching scenarios:', error.message);
    }

    return { passed, total };
}

async function testConfigurationInheritanceAndScoping() {
    console.log('⚙️ Testing Configuration Inheritance and Scoping...');
    let passed = 0, total = 0;

    // Test 1: Workspace-specific configurations
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Project2', index: 1 }
            ],
            explorerDates: {
                enabled: true,
                format: 'absolute'
            }
        });

        const provider = new FileDateDecorationProvider();

        const workspace1Config = mock.workspace.getConfiguration('explorerDates', mock.workspace.workspaceFolders[0].uri);
        const workspace2Config = mock.workspace.getConfiguration('explorerDates', mock.workspace.workspaceFolders[1].uri);

        if (workspace1Config.get('enabled') === true &&
            workspace2Config.get('enabled') === true &&
            workspace1Config.get('format') === 'absolute') {
            console.log('✅ Workspace-specific configurations');
            passed++;
        } else {
            console.log('❌ Workspace-specific configurations failed');
        }

        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Workspace-specific configurations:', error.message);
    }

    // Test 2: Conflicting workspace configurations
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let configurationUpdateCount = 0;
        
        const disposable = mock.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('explorerDates')) {
                configurationUpdateCount++;
            }
        });

        triggerConfigChange({
            'explorerDates.enabled': true,
            'explorerDates.format': 'relative',
            'explorerDates.badgePriority': 'time'
        });

        triggerConfigChange({
            'explorerDates.enabled': false,
            'explorerDates.format': 'absolute',
            'explorerDates.badgePriority': 'author'
        });

        if (configurationUpdateCount === 2) {
            console.log('✅ Conflicting workspace configurations');
            passed++;
        } else {
            console.log('❌ Conflicting workspace configurations failed');
        }

        disposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Conflicting workspace configurations:', error.message);
    }

    // Test 3: Workspace folder file resolution
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Project2', index: 1 },
                { uri: { fsPath: '/workspace3/subproject' }, name: 'Subproject', index: 2 }
            ]
        });

        const file1 = mock.workspace.getWorkspaceFolder('/workspace1/file.txt');
        const file2 = mock.workspace.getWorkspaceFolder('/workspace2/src/index.js');
        const file3 = mock.workspace.getWorkspaceFolder('/workspace3/subproject/app.js');
        const file4 = mock.workspace.getWorkspaceFolder('/external/file.txt');

        if (file1?.name === 'Project1' &&
            file2?.name === 'Project2' &&
            file3?.name === 'Subproject' &&
            file4 === undefined) {
            console.log('✅ Workspace folder file resolution');
            passed++;
        } else {
            console.log('❌ Workspace folder file resolution failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Workspace folder file resolution:', error.message);
    }

    // Test 4: Configuration inheritance hierarchy
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let appliedConfigurations = [];
        
        const disposable = mock.workspace.onDidChangeConfiguration((event) => {
            appliedConfigurations.push({
                timestamp: Date.now(),
                affectsExplorerDates: event.affectsConfiguration('explorerDates')
            });
        });

        triggerConfigChange({
            'explorerDates.enabled': false,
            'explorerDates.format': 'absolute'
        });

        triggerConfigChange({
            'explorerDates.enabled': true,
            'explorerDates.timestampFormat': '24h'
        });

        if (appliedConfigurations.length === 2 &&
            appliedConfigurations.every(config => config.affectsExplorerDates)) {
            console.log('✅ Configuration inheritance hierarchy');
            passed++;
        } else {
            console.log('❌ Configuration inheritance hierarchy failed');
        }

        disposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Configuration inheritance hierarchy:', error.message);
    }

    return { passed, total };
}

async function testResourceManagementAcrossWorkspaces() {
    console.log('🔧 Testing Resource Management Across Workspaces...');
    let passed = 0, total = 0;

    // Test 1: File watchers across multiple workspaces
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Project2', index: 1 }
            ]
        });

        const provider = new FileDateDecorationProvider();

        const watcher1 = mock.workspace.createFileSystemWatcher('**/*');
        const watcher2 = mock.workspace.createFileSystemWatcher('**/src/**');

        if (typeof mock.workspace.createFileSystemWatcher === 'function' &&
            watcher1.dispose && watcher2.dispose) {
            console.log('✅ File watchers across multiple workspaces');
            passed++;
        } else {
            console.log('❌ File watchers across multiple workspaces failed');
        }

        watcher1.dispose();
        watcher2.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ File watchers across multiple workspaces:', error.message);
    }

    // Test 2: Memory management with multiple workspaces
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        
        const testFiles = [
            '/workspace1/src/file1.js',
            '/workspace1/lib/file2.js',
            '/workspace2/app/file3.js',
            '/workspace2/tests/file4.js'
        ];

        const decorationPromises = testFiles.map(async (file) => {
            const uri = mock.Uri.file(file);
            return provider.provideFileDecoration(uri);
        });

        const decorations = await Promise.all(decorationPromises);
        const metrics = provider.getMetrics();

        if (decorations.every(decoration => decoration !== undefined) &&
            metrics.cacheMisses > 0) {
            console.log('✅ Memory management with multiple workspaces');
            passed++;
        } else {
            console.log('❌ Memory management with multiple workspaces failed');
        }

        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Memory management with multiple workspaces:', error.message);
    }

    // Test 3: Workspace deletion and resource cleanup
    total++;
    try {
        const { vscode: mock, removeWorkspaceFolder, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let disposeCallCount = 0;

        const originalDispose = provider.dispose;
        provider.dispose = function() {
            disposeCallCount++;
            return originalDispose.call(this);
        };

        const removedFolder = removeWorkspaceFolder(0);
        provider.dispose();

        if (removedFolder !== null && disposeCallCount === 1) {
            console.log('✅ Workspace deletion and resource cleanup');
            passed++;
        } else {
            console.log('❌ Workspace deletion and resource cleanup failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Workspace deletion and resource cleanup:', error.message);
    }

    // Test 4: Memory leak prevention across workspace changes
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        let providers = [];
        
        for (let i = 0; i < 3; i++) {
            const provider = new FileDateDecorationProvider();
            providers.push(provider);
            
            const uri = mock.Uri.file(`/workspace${i}/file.js`);
            await provider.provideFileDecoration(uri);
        }

        const metricsBefore = providers.map(p => p.getMetrics());
        providers.forEach(provider => provider.dispose());

        if (metricsBefore.every(m => m.cacheMisses > 0) && providers.length === 3) {
            console.log('✅ Memory leak prevention across workspace changes');
            passed++;
        } else {
            console.log('❌ Memory leak prevention across workspace changes failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Memory leak prevention across workspace changes:', error.message);
    }

    return { passed, total };
}

async function testCrossWorkspaceFileOperations() {
    console.log('🗂️ Testing Cross-Workspace File Operations...');
    let passed = 0, total = 0;

    // Test 1: Files from different workspace roots
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/project-a' }, name: 'ProjectA', index: 0 },
                { uri: { fsPath: '/project-b' }, name: 'ProjectB', index: 1 }
            ]
        });

        const provider = new FileDateDecorationProvider();

        const fileA = mock.Uri.file('/project-a/src/component.js');
        const fileB = mock.Uri.file('/project-b/lib/utility.js');
        const externalFile = mock.Uri.file('/external/file.js');

        const decorationA = await provider.provideFileDecoration(fileA);
        const decorationB = await provider.provideFileDecoration(fileB);
        const decorationExternal = await provider.provideFileDecoration(externalFile);

        if (decorationA !== undefined && decorationB !== undefined && decorationExternal !== undefined) {
            console.log('✅ Files from different workspace roots');
            passed++;
        } else {
            console.log('❌ Files from different workspace roots failed');
        }

        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Files from different workspace roots:', error.message);
    }

    // Test 2: Relative path resolution across workspaces
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Project1', index: 0 }
            ]
        });

        const relativePath1 = mock.workspace.asRelativePath('/workspace1/src/file.js');
        const relativePath2 = mock.workspace.asRelativePath('/external/file.js');

        if (typeof relativePath1 === 'string' && typeof relativePath2 === 'string') {
            console.log('✅ Relative path resolution across workspaces');
            passed++;
        } else {
            console.log('❌ Relative path resolution across workspaces failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Relative path resolution across workspaces:', error.message);
    }

    // Test 3: Batch operations across workspaces
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();

        const batchFiles = [
            '/workspace1/file1.js',
            '/workspace1/file2.js',
            '/workspace2/file3.js',
            '/workspace2/file4.js',
            '/workspace3/file5.js'
        ];

        const batchPromises = batchFiles.map(async (file) => {
            const uri = mock.Uri.file(file);
            return provider.provideFileDecoration(uri);
        });

        const batchResults = await Promise.all(batchPromises);
        const metrics = provider.getMetrics();

        if (batchResults.length === 5 && 
            batchResults.every(result => result !== undefined) &&
            metrics.cacheMisses > 0) {
            console.log('✅ Batch operations across workspaces');
            passed++;
        } else {
            console.log('❌ Batch operations across workspaces failed');
        }

        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Batch operations across workspaces:', error.message);
    }

    return { passed, total };
}

async function testProviderLifecycleInMultiWorkspace() {
    console.log('🔄 Testing Provider Lifecycle in Multi-Workspace Environment...');
    let passed = 0, total = 0;

    // Test 1: Initialization in multi-workspace environment
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode({
            workspaceFolders: [
                { uri: { fsPath: '/workspace1' }, name: 'Workspace1', index: 0 },
                { uri: { fsPath: '/workspace2' }, name: 'Workspace2', index: 1 },
                { uri: { fsPath: '/workspace3' }, name: 'Workspace3', index: 2 }
            ]
        });

        const provider = new FileDateDecorationProvider();
        const metrics = provider.getMetrics();

        if (mock.workspace.workspaceFolders.length === 3 && 
            metrics !== undefined && metrics.workspaceScale !== undefined) {
            console.log('✅ Initialization in multi-workspace environment');
            passed++;
        } else {
            console.log('❌ Initialization in multi-workspace environment failed');
        }

        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Initialization in multi-workspace environment:', error.message);
    }

    // Test 2: Provider disposal with active workspace operations
    total++;
    try {
        const { vscode: mock, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();

        const operations = [];
        for (let i = 0; i < 5; i++) {
            const uri = mock.Uri.file(`/workspace/file${i}.js`);
            operations.push(provider.provideFileDecoration(uri));
        }

        const disposePromise = new Promise(resolve => {
            setTimeout(() => {
                provider.dispose();
                resolve();
            }, 10);
        });

        const [operationResults] = await Promise.all([
            Promise.all(operations),
            disposePromise
        ]);

        if (operationResults.length === 5) {
            console.log('✅ Provider disposal with active workspace operations');
            passed++;
        } else {
            console.log('❌ Provider disposal with active workspace operations failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Provider disposal with active workspace operations:', error.message);
    }

    // Test 3: Configuration changes during multi-workspace operations
    total++;
    try {
        const { vscode: mock, triggerConfigChange, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let configChangeCount = 0;

        const disposable = mock.workspace.onDidChangeConfiguration(() => {
            configChangeCount++;
        });

        const fileOperations = [];
        for (let i = 0; i < 3; i++) {
            const uri = mock.Uri.file(`/workspace${i}/file.js`);
            fileOperations.push(provider.provideFileDecoration(uri));
        }

        triggerConfigChange({
            'explorerDates.format': 'relative',
            'explorerDates.enabled': false
        });

        await Promise.all(fileOperations);

        if (configChangeCount === 1) {
            console.log('✅ Configuration changes during multi-workspace operations');
            passed++;
        } else {
            console.log('❌ Configuration changes during multi-workspace operations failed');
        }

        disposable.dispose();
        provider.dispose();
        localDispose();
    } catch (error) {
        console.log('❌ Configuration changes during multi-workspace operations:', error.message);
    }

    // Test 4: Graceful shutdown in multi-workspace environment
    total++;
    try {
        const { vscode: mock, addWorkspaceFolder, dispose: localDispose } = createMockVscode();
        
        const provider = new FileDateDecorationProvider();
        let resourcesDisposed = 0;

        const originalDispose = provider.dispose;
        provider.dispose = function() {
            resourcesDisposed++;
            return originalDispose.call(this);
        };

        addWorkspaceFolder({ path: '/extra-workspace', name: 'Extra' });
        await provider.provideFileDecoration(mock.Uri.file('/workspace/test.js'));
        
        provider.dispose();

        if (resourcesDisposed === 1) {
            console.log('✅ Graceful shutdown in multi-workspace environment');
            passed++;
        } else {
            console.log('❌ Graceful shutdown in multi-workspace environment failed');
        }

        localDispose();
    } catch (error) {
        console.log('❌ Graceful shutdown in multi-workspace environment:', error.message);
    }

    return { passed, total };
}

// Run all tests
runAllTests()
    .then(() => {
        console.log('\n🎉 Multi-workspace scenario tests completed');
    })
    .catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });