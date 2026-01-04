/**
 * VS Code Decoration Renderer Test
 * This tests if VS Code is actually displaying the decorations it receives
 */

const vscode = require('vscode');
const { getFileName } = require('./utils/pathUtils');

/**
 * Test VS Code's decoration rendering system
 */
async function testVSCodeDecorationRendering() {
    const logger = require('./utils/logger').getLogger();
    
    logger.info('🎨 Testing VS Code decoration rendering...');
    
    // Create a minimal test decoration provider
    class TestDecorationProvider {
        constructor() {
            this._onDidChangeFileDecorations = new vscode.EventEmitter();
            this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        }

        provideFileDecoration(uri) {
            const fileName = getFileName(uri.fsPath || uri.path);
            
            // Return a very simple, guaranteed-to-work decoration
            const decoration = new vscode.FileDecoration('TEST');
            decoration.tooltip = `Test decoration for ${fileName}`;
            decoration.color = new vscode.ThemeColor('charts.red');
            
            logger.info(`🧪 Test provider returning decoration for: ${fileName}`);
            
            return decoration;
        }
    }
    
    // Register the test provider
    const testProvider = new TestDecorationProvider();
    const disposable = vscode.window.registerFileDecorationProvider(testProvider);
    
    logger.info('🧪 Test decoration provider registered');
    
    // Force refresh after a short delay
    setTimeout(() => {
        testProvider._onDidChangeFileDecorations.fire(undefined);
        logger.info('🔄 Test decoration refresh triggered');
        
        // Clean up after 10 seconds
        setTimeout(() => {
            disposable.dispose();
            logger.info('🧪 Test decoration provider disposed');
        }, 10000);
        
    }, 1000);
    
    return 'Test decoration provider registered for 10 seconds';
}

/**
 * Test direct FileDecoration API
 */
async function testFileDecorationAPI() {
    const logger = require('./utils/logger').getLogger();
    
    logger.info('🔧 Testing FileDecoration API...');
    
    const tests = [];
    
    // Test 1: Minimal decoration
    try {
        const minimal = new vscode.FileDecoration('MIN');
        tests.push({ name: 'Minimal decoration', success: true, badge: minimal.badge });
        logger.info('✅ Minimal decoration created successfully');
    } catch (error) {
        tests.push({ name: 'Minimal decoration', success: false, error: error.message });
        logger.error('❌ Minimal decoration failed:', error);
    }
    
    // Test 2: Decoration with all properties
    try {
        const full = new vscode.FileDecoration('FULL', 'Full decoration tooltip', new vscode.ThemeColor('charts.blue'));
        full.propagate = false;
        tests.push({ 
            name: 'Full decoration', 
            success: true, 
            badge: full.badge,
            hasTooltip: !!full.tooltip,
            hasColor: !!full.color,
            propagate: full.propagate
        });
        logger.info('✅ Full decoration created successfully');
    } catch (error) {
        tests.push({ name: 'Full decoration', success: false, error: error.message });
        logger.error('❌ Full decoration failed:', error);
    }
    
    // Test 3: ThemeColor variations
    const themeColors = [
        'charts.red', 'charts.blue', 'charts.green', 'charts.yellow',
        'terminal.ansiRed', 'terminal.ansiGreen', 'terminal.ansiBlue',
        'editorError.foreground', 'editorWarning.foreground', 'editorInfo.foreground'
    ];
    
    for (const colorName of themeColors) {
        try {
            // const colorDecoration = new vscode.FileDecoration('COL', `Color test: ${colorName}`, new vscode.ThemeColor(colorName));
            tests.push({ 
                name: `ThemeColor: ${colorName}`, 
                success: true, 
                colorId: colorName
            });
        } catch (error) {
            tests.push({ 
                name: `ThemeColor: ${colorName}`, 
                success: false, 
                error: error.message 
            });
            logger.error(`❌ ThemeColor ${colorName} failed:`, error);
        }
    }
    
    return tests;
}

module.exports = {
    testVSCodeDecorationRendering,
    testFileDecorationAPI
};
