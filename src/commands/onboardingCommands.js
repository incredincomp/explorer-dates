const vscode = require('vscode');

function registerOnboardingCommands({ context, logger, getOnboardingManager }) {
    const subscriptions = [];

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showFeatureTour', async () => {
        try {
            const manager = await getOnboardingManager();
            if (!manager) {
                vscode.window.showWarningMessage('Onboarding system unavailable.');
                return;
            }
            await manager.showFeatureTour();
            logger.info('Feature tour opened');
        } catch (error) {
            logger.error('Failed to show feature tour', error);
            vscode.window.showErrorMessage(`Failed to show feature tour: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showQuickSetup', async () => {
        try {
            const manager = await getOnboardingManager();
            if (!manager) {
                vscode.window.showWarningMessage('Onboarding system unavailable.');
                return;
            }
            await manager.showQuickSetupWizard();
            logger.info('Quick setup wizard opened');
        } catch (error) {
            logger.error('Failed to show quick setup wizard', error);
            vscode.window.showErrorMessage(`Failed to show quick setup wizard: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showWhatsNew', async () => {
        try {
            const manager = await getOnboardingManager();
            if (!manager) {
                vscode.window.showWarningMessage('Onboarding system unavailable.');
                return;
            }
            const extensionVersion = context.extension.packageJSON.version;
            await manager.showWhatsNew(extensionVersion);
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
