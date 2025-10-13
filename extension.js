// extension.js - Explorer Dates
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('./src/fileDateDecorationProvider');
const { getLogger } = require('./src/logger');
const { getLocalization } = require('./src/localization');

let fileDateProvider;
let logger;
let l10n;

/**
 * Extension activation function
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
    try {
        // Initialize logger and localization
        logger = getLogger();
        l10n = getLocalization();
        
        logger.info('Explorer Dates: Extension activated');

        // Register file date decoration provider for overlay dates in Explorer
        fileDateProvider = new FileDateDecorationProvider();
        const decorationDisposable = vscode.window.registerFileDecorationProvider(fileDateProvider);
        context.subscriptions.push(decorationDisposable);
        context.subscriptions.push(fileDateProvider); // For proper disposal
        context.subscriptions.push(logger); // Dispose logger on deactivation

        // Register refresh command for decorations
        const refreshDecorations = vscode.commands.registerCommand('explorerDates.refreshDateDecorations', () => {
            try {
                if (fileDateProvider) {
                    fileDateProvider.refreshAll();
                    const message = l10n.getString('refreshSuccess');
                    vscode.window.showInformationMessage(message);
                    logger.info('Date decorations refreshed manually');
                }
            } catch (error) {
                logger.error('Failed to refresh decorations', error);
                vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`);
            }
        });
        context.subscriptions.push(refreshDecorations);

        // Register command to show metrics
        const showMetrics = vscode.commands.registerCommand('explorerDates.showMetrics', () => {
            try {
                if (fileDateProvider) {
                    const metrics = fileDateProvider.getMetrics();
                    const message = `Explorer Dates Metrics:\n` +
                        `Total Decorations: ${metrics.totalDecorations}\n` +
                        `Cache Size: ${metrics.cacheSize}\n` +
                        `Cache Hits: ${metrics.cacheHits}\n` +
                        `Cache Misses: ${metrics.cacheMisses}\n` +
                        `Cache Hit Rate: ${metrics.cacheHitRate}\n` +
                        `Errors: ${metrics.errors}`;
                    
                    vscode.window.showInformationMessage(message, { modal: true });
                    logger.info('Metrics displayed', metrics);
                }
            } catch (error) {
                logger.error('Failed to show metrics', error);
                vscode.window.showErrorMessage(`Failed to show metrics: ${error.message}`);
            }
        });
        context.subscriptions.push(showMetrics);

        // Register command to open logs
        const openLogs = vscode.commands.registerCommand('explorerDates.openLogs', () => {
            try {
                logger.show();
            } catch (error) {
                logger.error('Failed to open logs', error);
                vscode.window.showErrorMessage(`Failed to open logs: ${error.message}`);
            }
        });
        context.subscriptions.push(openLogs);
        
        logger.info('Explorer Dates: Date decorations ready');
        
    } catch (error) {
        const errorMessage = `${l10n ? l10n.getString('activationError') : 'Explorer Dates failed to activate'}: ${error.message}`;
        console.error('Explorer Dates: Failed to activate:', error);
        if (logger) {
            logger.error('Extension activation failed', error);
        }
        vscode.window.showErrorMessage(errorMessage);
        throw error;
    }
}

/**
 * Extension deactivation function
 */
function deactivate() {
    try {
        if (logger) {
            logger.info('Explorer Dates extension is being deactivated');
        } else {
            console.log('Explorer Dates extension is being deactivated');
        }
        
        // Clean up resources
        if (fileDateProvider && typeof fileDateProvider.dispose === 'function') {
            fileDateProvider.dispose();
        }
        
        if (logger) {
            logger.info('Explorer Dates extension deactivated successfully');
        }
    } catch (error) {
        const errorMessage = 'Explorer Dates: Error during deactivation';
        console.error(errorMessage, error);
        if (logger) {
            logger.error(errorMessage, error);
        }
    }
}

module.exports = {
    activate,
    deactivate
};