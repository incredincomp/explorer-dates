const path = require('path');
const { createTestMock, createExtensionContext, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');
const { addWarningFilters } = require('./helpers/warningFilters');

process.env.EXPLORER_DATES_TEST_MODE = '1';
addWarningFilters([/Failed to register analysis commands/]);

const extensionRoot = path.resolve(__dirname, '..');
const sampleWorkspaceRoot = path.join(extensionRoot, 'tests', 'fixtures', 'sample-workspace');

function clearCaches() {
    for (const key of Object.keys(require.cache)) {
        if (
            key.includes(`${path.sep}extension.js`) ||
            key.includes(`${path.sep}src${path.sep}featureFlags`) ||
            key.includes(`${path.sep}src${path.sep}commands${path.sep}analysisCommands`)
        ) {
            delete require.cache[key];
        }
    }
}

function createContextOverrides() {
    return {
        extensionPath: extensionRoot,
        asAbsolutePath: (relative) => path.join(extensionRoot, relative)
    };
}

function commandRegistered(mock, commandId) {
    return mock.commandRegistry?.has(commandId);
}

function infoMessages(mock) {
    return mock.infoLog.filter((entry) => typeof entry === 'string');
}

function analysisCommandIds() {
    return [
        'explorerDates.showWorkspaceActivity',
        'explorerDates.showPerformanceAnalytics',
        'explorerDates.debugCache',
        'explorerDates.runDiagnostics',
        'explorerDates.testDecorations',
        'explorerDates.monitorDecorations',
        'explorerDates.testVSCodeRendering',
        'explorerDates.quickFix',
        'explorerDates.showKeyboardShortcuts'
    ];
}

async function testAnalysisCommandRegistration() {
    console.log('🔬 Testing analysis command registration and feature flag behavior...');

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': true }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        for (const command of analysisCommandIds()) {
            if (!commandRegistered(mock, command)) {
                throw new Error(`Expected ${command} to register when analysis commands enabled`);
            }
        }
        mock.dispose();
    }

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': false }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        for (const command of analysisCommandIds()) {
            if (commandRegistered(mock, command)) {
                throw new Error(`Did not expect ${command} to register when analysis commands disabled`);
            }
        }
        mock.dispose();
    }

    console.log('  ✓ Analysis commands respect feature flag');
}

async function testStartupWarningLogic() {
    console.log('🔬 Testing startup warning and auto-enable logic...');

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': false }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (!infoMessages(mock).some((msg) =>
            msg.includes('analysis commands are disabled') &&
            msg.includes('Ctrl+Shift+M/H/A')
        )) {
            throw new Error('Expected startup warning mentioning affected shortcuts');
        }
        mock.dispose();
    }

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': false }
        });
        const { activate } = require('../extension.js');
        const context = createExtensionContext(createContextOverrides());
        await activate(context);

        mock.resetLogs();
        clearCaches();
        const { activate: activateAgain } = require('../extension.js');
        await activateAgain(context);

        if (infoMessages(mock).length > 0) {
            throw new Error('Warning should not repeat for same workspace');
        }
        mock.dispose();
    }

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': true }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (infoMessages(mock).some((msg) => msg.includes('analysis commands are disabled'))) {
            throw new Error('Unexpected warning when analysis commands are enabled');
        }
        mock.dispose();
    }

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': false }
        });
        const workspaceA = VSCodeUri.file(path.join(sampleWorkspaceRoot, 'workspaceA'));
        const workspaceB = VSCodeUri.file(path.join(sampleWorkspaceRoot, 'workspaceB'));
        mock.vscode.workspace.workspaceFolders = [
            { uri: workspaceA, name: 'workspaceA', index: 0 },
            { uri: workspaceB, name: 'workspaceB', index: 1 }
        ];
        const originalGetConfiguration = mock.vscode.workspace.getConfiguration.bind(mock.vscode.workspace);
        mock.vscode.workspace.getConfiguration = (section, resource) => {
            const base = originalGetConfiguration(section, resource);
            if (section === 'explorerDates' && resource) {
                return {
                    ...base,
                    inspect: () => ({
                        workspaceFolderValue: resource.fsPath?.includes('workspaceA') ? false : undefined,
                        workspaceValue: undefined,
                        globalValue: undefined
                    }),
                    update: async () => {}
                };
            }
            return base;
        };

        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (!infoMessages(mock).some((msg) => msg.includes('analysis commands are disabled'))) {
            throw new Error('Expected warning in multi-folder workspace with disabled folder');
        }

        mock.vscode.workspace.getConfiguration = originalGetConfiguration;
        mock.dispose();
    }

    console.log('  ✓ Startup warnings behave correctly');
}

async function testKeybindingCoverage() {
    console.log('🔬 Testing keybinding coverage...');

    const keyboundCommands = [
        'explorerDates.debugCache',
        'explorerDates.showKeyboardShortcuts',
        'explorerDates.showWorkspaceActivity'
    ];

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': true }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        for (const command of keyboundCommands) {
            if (!commandRegistered(mock, command)) {
                throw new Error(`Keybinding target ${command} missing when feature enabled`);
            }
        }
        mock.dispose();
    }

    {
        clearCaches();
        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': false }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (!infoMessages(mock).some((msg) => msg.includes('Ctrl+Shift+M/H/A'))) {
            throw new Error('Warning should mention affected shortcuts when feature disabled');
        }
        mock.dispose();
    }

    console.log('  ✓ Keybinding coverage verified');
}

async function testChunkFailureHandling() {
    console.log('🔬 Testing chunk failure handling...');

    {
        clearCaches();
        const featureFlags = require('../src/featureFlags');
        const originalAnalysis = featureFlags.analysisCommands;
        featureFlags.analysisCommands = async () => null;

        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': true }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (analysisCommandIds().some((cmd) => commandRegistered(mock, cmd))) {
            throw new Error('Analysis commands should not register when chunk returns null');
        }

        featureFlags.analysisCommands = originalAnalysis;
        mock.dispose();
    }

    {
        clearCaches();
        const featureFlags = require('../src/featureFlags');
        const originalAnalysis = featureFlags.analysisCommands;
        featureFlags.analysisCommands = async () => {
            throw new Error('Simulated diagnostics chunk failure');
        };

        const mock = createTestMock({
            config: { 'explorerDates.enableAnalysisCommands': true }
        });
        const { activate } = require('../extension.js');
        await activate(createExtensionContext(createContextOverrides()));

        if (!infoMessages(mock).some((msg) => msg.includes('Explorer Dates analysis commands failed to initialize'))) {
            throw new Error('Expected warning when diagnostics chunk fails to load');
        }

        featureFlags.analysisCommands = originalAnalysis;
        mock.dispose();
    }

    console.log('  ✓ Chunk failures handled gracefully');
}

async function runTests() {
    console.log('🧪 Running analysis command registration tests...\n');
    await testAnalysisCommandRegistration();
    await testStartupWarningLogic();
    await testKeybindingCoverage();
    await testChunkFailureHandling();
    console.log('\n✅ All analysis command registration tests passed!');
}

if (require.main === module) {
    runTests()
        .then(() => {
            process.exitCode = 0;
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exitCode = 1;
        })
        .finally(scheduleExit);
}

module.exports = {
    testAnalysisCommandRegistration,
    testStartupWarningLogic,
    testKeybindingCoverage,
    testChunkFailureHandling,
    runTests
};
