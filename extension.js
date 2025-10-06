// extension.js - Explorer Dates
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('./src/fileDateDecorationProvider');

let fileDateProvider;

/**
 * Extension activation function
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
    console.log('Explorer Dates: Extension activated');

    try {
        // Register file date decoration provider for overlay dates in Explorer
        fileDateProvider = new FileDateDecorationProvider();
        const decorationDisposable = vscode.window.registerFileDecorationProvider(fileDateProvider);
        context.subscriptions.push(decorationDisposable);
        context.subscriptions.push(fileDateProvider); // For proper disposal

        // Register refresh command for decorations
        const refreshDecorations = vscode.commands.registerCommand('explorerDates.refreshDateDecorations', () => {
            if (fileDateProvider) {
                fileDateProvider.refreshAll();
                vscode.window.showInformationMessage('Date decorations refreshed');
            }
        });
        context.subscriptions.push(refreshDecorations);
        
        console.log('Explorer Dates: Date decorations ready');
        
    } catch (error) {
        console.error('Explorer Dates: Failed to activate:', error);
        vscode.window.showErrorMessage(`Explorer Dates failed to activate: ${error.message}`);
    }
}

/**
 * Extension deactivation function
 */
function deactivate() {
    console.log('Explorer Dates extension is being deactivated');
    
    try {
        // Clean up resources
        if (fileDateProvider && typeof fileDateProvider.dispose === 'function') {
            fileDateProvider.dispose();
        }
    } catch (error) {
        console.error('Explorer Dates: Error during deactivation:', error);
    }
}

module.exports = {
    activate,
    deactivate
};