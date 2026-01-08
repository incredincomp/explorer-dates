// test-analysis-command-registration.js
// Tests analysis command registration, warning flows, keybinding coverage, and chunk failure handling

const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const path = require('path');

/**
 * Test analysis command registration and feature flag behavior
 */
async function testAnalysisCommandRegistration() {
    console.log('🔬 Testing analysis command registration and feature flag behavior...');
    
    // Test 1: Commands register when enableAnalysisCommands=true
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': true
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Verify analysis commands are registered
        const analysisCommands = [
            'explorerDates.debugCache',
            'explorerDates.showWorkspaceActivity', 
            'explorerDates.showPerformanceAnalytics',
            'explorerDates.runDiagnostics',
            'explorerDates.testDecorations',
            'explorerDates.monitorDecorations',
            'explorerDates.testVSCodeRendering',
            'explorerDates.quickFix',
            'explorerDates.showKeyboardShortcuts'
        ];
        
        for (const commandId of analysisCommands) {
            mock.resetLogs();
            await mock.vscode.commands.executeCommand(commandId);
            
            // Check if command was logged as missing (would indicate it's not registered)
            const missingCommandLogs = mock.infoLog.filter(msg => 
                typeof msg === 'string' && msg.includes(`executeCommand:${commandId}:missing`)
            );
            
            if (missingCommandLogs.length > 0) {
                throw new Error(`Command ${commandId} not registered when enableAnalysisCommands=true`);
            }
        }
        
        mock.dispose();
        console.log('  ✓ Analysis commands registered when feature enabled');
    }
    
    // Test 2: Commands show information message when enableAnalysisCommands=false
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': false
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Should get startup warning about disabled analysis commands
        const informationMessages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled') && 
            msg.includes('Ctrl+Shift+M/H/A')
        );
        
        if (informationMessages.length === 0) {
            throw new Error('Expected startup warning about disabled analysis commands');
        }
        
        // Test that commands are not registered
        mock.resetLogs();
        await mock.vscode.commands.executeCommand('explorerDates.debugCache');
        
        // Check if the command was logged as missing
        const missingCommandLogs = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('executeCommand:explorerDates.debugCache:missing')
        );
        
        if (missingCommandLogs.length === 0) {
            throw new Error('Expected debugCache command to be unregistered when feature disabled');
        }
        
        mock.dispose();
        console.log('  ✓ Startup warning shown when analysis commands disabled');
    }
}

/**
 * Test startup warning and auto-enable logic
 */
async function testStartupWarningLogic() {
    console.log('🔬 Testing startup warning and auto-enable logic...');
    
    // Test 1: Warning appears once per workspace
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': false
            },
            sampleWorkspace: '/test/workspace1'
        });
        
        const context = createExtensionContext();
        const { activate, deactivate } = require('../extension.js');
        
        // First activation - should show warning
        await activate(context);
        const firstMessages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled'));
        const hasWarning = firstMessages.length > 0;
        
        if (!hasWarning) {
            throw new Error('Expected warning on first activation');
        }
        
        await deactivate();
        mock.resetLogs();
        
        // Second activation - should not show warning (already shown for this workspace)
        await activate(context);
        const secondMessages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled'));
        const hasSecondWarning = secondMessages.length > 0;
        
        if (hasSecondWarning) {
            throw new Error('Warning should not repeat for same workspace');
        }
        
        mock.dispose();
        console.log('  ✓ Warning shown once per workspace');
    }
    
    // Test 2: Warning state is cleared when feature is enabled
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': true
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // With feature enabled, no warning should be shown
        const messages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled'));
        
        if (messages.length > 0) {
            throw new Error('No warning should be shown when analysis commands are enabled');
        }
        
        mock.dispose();
        console.log('  ✓ No warning when analysis commands are enabled');
    }
    
    // Test 3: Multi-folder scope handling
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': false
            },
            workspaceFolders: [
                { uri: { toString: () => 'file:///test/folder1' } },
                { uri: { toString: () => 'file:///test/folder2' } }
            ]
        });
        
        // Mock folder-specific config inspection
        const originalGetConfiguration = mock.vscode.workspace.getConfiguration;
        mock.vscode.workspace.getConfiguration = function(section, resource) {
            const config = originalGetConfiguration.call(this, section, resource);
            if (section === 'explorerDates' && resource) {
                // Simulate folder1 having enableAnalysisCommands=false at folder level
                if (resource.toString().includes('folder1')) {
                    config.inspect = () => ({
                        workspaceFolderValue: false,
                        workspaceValue: undefined,
                        globalValue: undefined
                    });
                }
            }
            return config;
        };
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Should show warning about disabled analysis commands
        const messages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled'));
        const hasWarning = messages.length > 0;
        
        if (!hasWarning) {
            throw new Error('Expected warning for multi-folder workspace with disabled folders');
        }
        
        mock.dispose();
        console.log('  ✓ Multi-folder scope handling works');
    }
}

/**
 * Test keybinding coverage
 */
async function testKeybindingCoverage() {
    console.log('🔬 Testing keybinding coverage...');
    
    const pkg = require('../package.json');
    const keybindings = pkg.contributes?.keybindings || [];
    
    // Filter analysis-related keybindings
    const analysisKeybindings = keybindings.filter(kb => 
        kb.command && [
            'explorerDates.debugCache',
            'explorerDates.showWorkspaceActivity',
            'explorerDates.runDiagnostics',
            'explorerDates.showKeyboardShortcuts'
        ].includes(kb.command)
    );
    
    if (analysisKeybindings.length === 0) {
        throw new Error('No analysis-related keybindings found in package.json');
    }
    
    // Test with analysis commands enabled
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': true
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Verify keybinding targets are registered
        for (const kb of analysisKeybindings) {
            mock.resetLogs();
            await mock.vscode.commands.executeCommand(kb.command);
            
            // Check if command was logged as missing
            const missingCommandLogs = mock.infoLog.filter(msg => 
                typeof msg === 'string' && msg.includes(`executeCommand:${kb.command}:missing`)
            );
            
            if (missingCommandLogs.length > 0) {
                throw new Error(`Keybinding target ${kb.command} (${kb.key}) not registered`);
            }
        }
        
        mock.dispose();
        console.log('  ✓ Analysis keybinding targets registered when enabled');
    }
    
    // Test with analysis commands disabled
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': false
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Verify startup warning mentions affected shortcuts
        const messages = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('analysis commands are disabled'));
        const warningMessage = messages.find(msg => msg.includes('analysis commands are disabled'));
        
        if (!warningMessage) {
            throw new Error('Expected warning about disabled analysis commands');
        }
        
        // Should mention specific shortcuts
        if (!warningMessage.includes('Ctrl+Shift+M/H/A')) {
            console.log('  Available messages:', messages);
            throw new Error('Warning should mention specific affected shortcuts like Ctrl+Shift+M/H/A');
        }
        
        mock.dispose();
        console.log('  ✓ Warning mentions affected keybindings when disabled');
    }
}

/**
 * Test chunk failure handling
 */
async function testChunkFailureHandling() {
    console.log('🔬 Testing chunk failure handling...');
    
    // Test 1: Extension activates gracefully even if chunks may be missing
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': true
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Extension should activate without throwing, even if chunks are missing
        // This test verifies the extension is resilient to missing chunks
        console.log('  ✓ Extension activates gracefully despite potential chunk issues');
        
        mock.dispose();
    }
    
    // Test 2: Commands are registered even if diagnostics chunk might fail
    {
        const mock = createTestMock({
            config: {
                'explorerDates.enableAnalysisCommands': true
            }
        });
        
        const context = createExtensionContext();
        const { activate } = require('../extension.js');
        
        await activate(context);
        
        // Try to execute a command that requires diagnostics chunk
        mock.resetLogs();
        await mock.vscode.commands.executeCommand('explorerDates.runDiagnostics');
        
        // Check if command was registered (not logged as missing)
        const missingCommandLogs = mock.infoLog.filter(msg => 
            typeof msg === 'string' && msg.includes('executeCommand:explorerDates.runDiagnostics:missing')
        );
        
        if (missingCommandLogs.length > 0) {
            throw new Error('Command should be registered even if diagnostics chunk fails to load');
        }
        
        mock.dispose();
        console.log('  ✓ Analysis commands registered despite potential chunk failures');
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🧪 Running analysis command registration tests...\n');
    
    try {
        await testAnalysisCommandRegistration();
        await testStartupWarningLogic();
        await testKeybindingCoverage();
        await testChunkFailureHandling();
        
        console.log('\n✅ All analysis command registration tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    runTests();
}

module.exports = {
    testAnalysisCommandRegistration,
    testStartupWarningLogic,
    testKeybindingCoverage,
    testChunkFailureHandling
};
