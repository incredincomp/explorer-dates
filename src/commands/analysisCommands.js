const vscode = require('vscode');
const { fileSystem } = require('../filesystem/FileSystemAdapter');
const { getFileName, getRelativePath } = require('../utils/pathUtils');
const { ensureDate } = require('../utils/dateHelpers');
const { getSettingsCoordinator } = require('../utils/settingsCoordinator');

const settingsCoordinator = getSettingsCoordinator();

function registerAnalysisCommands({
    context,
    fileDateProvider,
    logger,
    chunkLoader
}) {
    const subscriptions = [];

    // Lazy load diagnostics module using the chunk loader
    async function loadDiagnosticsGenerators() {
        try {
            const diagnosticsChunk = await chunkLoader.loadChunk('diagnostics');
            if (!diagnosticsChunk) {
                throw new Error('Diagnostics chunk not available');
            }
            
            // Ensure template store is initialized if we have context
            if (context) {
                diagnosticsChunk.ensureInitialized(context);
            }
            return {
                generateWorkspaceActivityHTML: diagnosticsChunk.generateWorkspaceActivityHTML,
                generatePerformanceAnalyticsHTML: diagnosticsChunk.generatePerformanceAnalyticsHTML,
                generateDiagnosticsHTML: diagnosticsChunk.generateDiagnosticsHTML,
                generateDiagnosticsWebview: diagnosticsChunk.generateDiagnosticsWebview
            };
        } catch (error) {
            throw new Error(`Failed to load diagnostics generators: ${error.message}`);
        }
    }

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showWorkspaceActivity', async () => {
        try {
            // Check if analysis commands feature is still enabled
            const vscodeConfig = vscode.workspace.getConfiguration('explorerDates');
            const analysisCommandsEnabled = vscodeConfig.get('enableAnalysisCommands', true);
            
            if (!analysisCommandsEnabled) {
                vscode.window.showInformationMessage('Analysis commands are disabled. Enable explorerDates.enableAnalysisCommands to use this feature.');
                return;
            }
            
            const { generateWorkspaceActivityHTML } = await loadDiagnosticsGenerators();
            
            const panel = vscode.window.createWebviewPanel(
                'workspaceActivity',
                'Workspace File Activity',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showWarningMessage('No workspace folder open');
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const files = [];
            const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);

            for (const fileUri of allFiles) {
                try {
                    const stat = await fileSystem.stat(fileUri);
                    const isFile = typeof stat.isFile === 'function' ? stat.isFile() : true;
                    if (isFile) {
                        files.push({
                            path: getRelativePath(workspaceFolder.uri.fsPath || workspaceFolder.uri.path, fileUri.fsPath || fileUri.path),
                            modified: ensureDate(stat.mtime),
                            size: stat.size
                        });
                    }
                } catch {
                    // Skip files we can't access
                }
            }

            files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
            panel.webview.html = await generateWorkspaceActivityHTML(files.slice(0, 50));
            logger.info('Workspace activity panel opened');
        } catch (error) {
            logger.error('Failed to show workspace activity', error);
            vscode.window.showErrorMessage(`Failed to show workspace activity: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showPerformanceAnalytics', async () => {
        try {
            const { generatePerformanceAnalyticsHTML } = await loadDiagnosticsGenerators();
            
            const panel = vscode.window.createWebviewPanel(
                'performanceAnalytics',
                'Explorer Dates Performance Analytics',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            const metrics = fileDateProvider ? fileDateProvider.getMetrics() : {};
            panel.webview.html = await generatePerformanceAnalyticsHTML(metrics);
            logger.info('Performance analytics panel opened');
        } catch (error) {
            logger.error('Failed to show performance analytics', error);
            vscode.window.showErrorMessage(`Failed to show performance analytics: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.debugCache', async () => {
        try {
            if (fileDateProvider) {
                const metrics = fileDateProvider.getMetrics();
                const debugInfo = {
                    'Cache Summary': {
                        'Memory Cache Size': metrics.cacheSize,
                        'Cache Hit Rate': metrics.cacheHitRate,
                        'Total Hits': metrics.cacheHits,
                        'Total Misses': metrics.cacheMisses,
                        'Cache Timeout': `${metrics.cacheDebugging.cacheTimeout}ms`
                    },
                    'Advanced Cache': metrics.advancedCache || 'Not available',
                    'Cache Namespace': metrics.cacheDebugging.cacheNamespace || 'default',
                    'Sample Cache Keys': metrics.cacheDebugging.memoryCacheKeys || []
                };

                vscode.window.showInformationMessage(
                    `Cache Debug Info:\n${JSON.stringify(debugInfo, null, 2)}`,
                    { modal: true }
                );
                logger.info('Cache debug info displayed', debugInfo);
            }
        } catch (error) {
            logger.error('Failed to show cache debug info', error);
            vscode.window.showErrorMessage(`Failed to show cache debug info: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.runDiagnostics', async () => {
        try {
            const { generateDiagnosticsHTML } = await loadDiagnosticsGenerators();
            
            const config = vscode.workspace.getConfiguration('explorerDates');
            const activeEditor = vscode.window.activeTextEditor;

            const diagnosticResults = {
                'Extension Status': {
                    'Provider Active': fileDateProvider ? 'Yes' : 'No',
                    'Decorations Enabled': config.get('showDateDecorations', true) ? 'Yes' : 'No',
                    'VS Code Version': vscode.version,
                    'Extension Version': context.extension.packageJSON.version
                }
            };

            if (activeEditor) {
                const { uri } = activeEditor.document;
                if (uri.scheme === 'file') {
                    diagnosticResults['Current File'] = {
                        'File Path': uri.fsPath,
                        'File Extension': getFileName(uri.fsPath || uri.path).split('.').pop() || 'No extension',
                        'Is Excluded': fileDateProvider ? await fileDateProvider._isExcludedSimple(uri) : 'Unknown'
                    };
                }
            }

            diagnosticResults['Configuration'] = {
                'Excluded Folders': config.get('excludedFolders', []),
                'Excluded Patterns': config.get('excludedPatterns', []),
                'Color Scheme': config.get('colorScheme', 'none'),
                'Cache Timeout': `${config.get('cacheTimeout', 30000)}ms`
            };

            if (fileDateProvider) {
                const metrics = fileDateProvider.getMetrics();
                diagnosticResults['Performance'] = {
                    'Total Decorations': metrics.totalDecorations,
                    'Cache Size': metrics.cacheSize,
                    'Cache Hit Rate': metrics.cacheHitRate,
                    'Errors': metrics.errors
                };

                if (metrics.performanceTiming) {
                    diagnosticResults['Performance Timing'] = {
                        'Avg Git Blame (ms)': metrics.performanceTiming.avgGitBlameMs,
                        'Avg File Stat (ms)': metrics.performanceTiming.avgFileStatMs,
                        'Git Calls': metrics.performanceTiming.gitBlameCalls,
                        'File Stat Calls': metrics.performanceTiming.fileStatCalls,
                        'Total Git Time (ms)': metrics.performanceTiming.totalGitBlameTimeMs,
                        'Total File Stat Time (ms)': metrics.performanceTiming.totalFileStatTimeMs
                    };
                }
            }

            const panel = vscode.window.createWebviewPanel(
                'explorerDatesDiagnostics',
                'Explorer Dates Diagnostics',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = await generateDiagnosticsHTML(diagnosticResults);
            logger.info('Diagnostics panel opened', diagnosticResults);
        } catch (error) {
            logger.error('Failed to run diagnostics', error);
            vscode.window.showErrorMessage(`Failed to run diagnostics: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.testDecorations', async () => {
        try {
            const { generateDiagnosticsWebview } = await loadDiagnosticsGenerators();
            
            logger.info('🔍 Starting comprehensive decoration diagnostics...');

            const { DecorationDiagnostics } = require('../decorationDiagnostics');
            const diagnostics = new DecorationDiagnostics(fileDateProvider);
            const results = await diagnostics.runComprehensiveDiagnostics();

            const panel = vscode.window.createWebviewPanel(
                'decorationDiagnostics',
                'Decoration Diagnostics - Root Cause Analysis',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = await generateDiagnosticsWebview(results);

            const criticalIssues = [];
            const warnings = [];

            Object.values(results.tests).forEach(test => {
                if (test.issues) {
                    test.issues.forEach(issue => {
                        if (issue.startsWith('CRITICAL:')) {
                            criticalIssues.push(issue);
                        } else if (issue.startsWith('WARNING:')) {
                            warnings.push(issue);
                        }
                    });
                }
            });

            if (criticalIssues.length > 0) {
                vscode.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${criticalIssues.join(', ')}`);
            } else if (warnings.length > 0) {
                vscode.window.showWarningMessage(`Warnings found: ${warnings.length} potential issues detected. Check diagnostics panel.`);
            } else {
                vscode.window.showInformationMessage('No critical issues found. Decorations should be working properly.');
            }

            logger.info('🔍 Comprehensive diagnostics completed', results);
        } catch (error) {
            logger.error('Failed to run comprehensive diagnostics', error);
            vscode.window.showErrorMessage(`Diagnostics failed: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.monitorDecorations', async () => {
        if (!fileDateProvider) {
            vscode.window.showErrorMessage('Decoration provider not available');
            return;
        }

        fileDateProvider.startProviderCallMonitoring();
        fileDateProvider.forceRefreshAllDecorations();

        setTimeout(() => {
            const stats = fileDateProvider.getProviderCallStats();
            const message = `VS Code Decoration Requests: ${stats.totalCalls} calls for ${stats.uniqueFiles} files`;
            vscode.window.showInformationMessage(message);
            logger.info('🔍 Decoration monitoring results:', stats);
        }, 5000);

        vscode.window.showInformationMessage('Started monitoring VS Code decoration requests. Results in 5 seconds...');
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.testVSCodeRendering', async () => {
        try {
            const { testVSCodeDecorationRendering, testFileDecorationAPI } = require('../decorationTester');

            logger.info('🎨 Testing VS Code decoration rendering system...');

            const apiTests = await testFileDecorationAPI();
            logger.info('🔧 FileDecoration API tests:', apiTests);

            const renderResult = await testVSCodeDecorationRendering();
            logger.info('🎨 Decoration rendering test:', renderResult);

            vscode.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.');
        } catch (error) {
            logger.error('Failed to test VS Code rendering:', error);
            vscode.window.showErrorMessage(`VS Code rendering test failed: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.quickFix', async () => {
        try {
            const fixes = [];

            if (!settingsCoordinator.getValue('showDateDecorations')) {
                fixes.push({
                    issue: 'Date decorations are disabled',
                    description: 'Enable date decorations',
                    fix: async () => settingsCoordinator.updateSetting('showDateDecorations', true, {
                        scope: 'user',
                        reason: 'quick-fix'
                    })
                });
            }

            const excludedPatterns = settingsCoordinator.getValue('excludedPatterns') || [];
            if (excludedPatterns.includes('**/*')) {
                fixes.push({
                    issue: 'All files are excluded by pattern',
                    description: 'Remove overly broad exclusion pattern',
                    fix: async () => {
                        const newPatterns = excludedPatterns.filter(p => p !== '**/*');
                        await settingsCoordinator.updateSetting('excludedPatterns', newPatterns, {
                            scope: 'user',
                            reason: 'quick-fix'
                        });
                    }
                });
            }

            if (fixes.length === 0) {
                vscode.window.showInformationMessage('No common issues detected. Decorations should be working.');
                return;
            }

            const selected = await vscode.window.showQuickPick(
                fixes.map(fix => ({ label: fix.description, description: fix.issue, fix: fix.fix })),
                { placeHolder: 'Select an issue to fix automatically' }
            );

            if (selected) {
                await selected.fix();
                vscode.window.showInformationMessage('Fixed! Try refreshing decorations now.');
                if (fileDateProvider) {
                    fileDateProvider.clearAllCaches();
                    fileDateProvider.refreshAll();
                }
            }
        } catch (error) {
            logger.error('Failed to run quick fix', error);
            vscode.window.showErrorMessage(`Failed to run quick fix: ${error.message}`);
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('explorerDates.showKeyboardShortcuts', async () => {
        try {
            if (fileDateProvider?._accessibility) {
                await fileDateProvider._accessibility.showKeyboardShortcutsHelp();
            } else {
                vscode.window.showInformationMessage(
                    'Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)'
                );
            }
            logger.info('Keyboard shortcuts help shown');
        } catch (error) {
            logger.error('Failed to show keyboard shortcuts help', error);
            vscode.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${error.message}`);
        }
    }));

    subscriptions.forEach(disposable => context.subscriptions.push(disposable));
}

module.exports = {
    registerAnalysisCommands
};
