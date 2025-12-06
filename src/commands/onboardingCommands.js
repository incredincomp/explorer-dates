const vscode = require('vscode');

function registerOnboardingCommands({ context, logger, getOnboardingManager }) {
    const subscriptions = [];

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFeatureTour', async () => {
        try {
            await getOnboardingManager().showFeatureTour();
            logger.info('Feature tour opened');
        } catch (error) {
            logger.error('Failed to show feature tour', error);
            vscode.window.showErrorMessage(`Failed to show feature tour: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showQuickSetup', async () => {
        try {
            await getOnboardingManager().showQuickSetupWizard();
            logger.info('Quick setup wizard opened');
        } catch (error) {
            logger.error('Failed to show quick setup wizard', error);
            vscode.window.showErrorMessage(`Failed to show quick setup wizard: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showWhatsNew', async () => {
        try {
            const extensionVersion = context.extension.packageJSON.version;
            await getOnboardingManager().showWhatsNew(extensionVersion);
            logger.info('What\'s new panel opened');
        } catch (error) {
            logger.error('Failed to show what\'s new', error);
            vscode.window.showErrorMessage(`Failed to show what's new: ${error.message}`);
        }
    }));

    subscriptions.forEach(disposable => context.subscriptions.push(disposable));
}

module.exports = {
    registerOnboardingCommands
};
