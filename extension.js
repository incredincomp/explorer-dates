// extension.js - Explorer Dates
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('./src/fileDateDecorationProvider');
const { getLogger } = require('./src/logger');
const { getLocalization } = require('./src/localization');
const { OnboardingManager } = require('./src/onboarding');
const { WorkspaceTemplatesManager } = require('./src/workspaceTemplates');
const { ExtensionApiManager } = require('./src/extensionApi');
const { ExportReportingManager } = require('./src/exportReporting');

let fileDateProvider;
let logger;
let l10n;

/**
 * Generate HTML for API information panel
 */
function getApiInformationHtml(api) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Explorer Dates API</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .api-section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }
            .method {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-family: monospace;
            }
            .method-name {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
            }
            .example {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-family: monospace;
                border-left: 4px solid var(--vscode-charts-blue);
            }
            code {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 2px 4px;
                border-radius: 2px;
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔌 Explorer Dates Extension API</h1>
            <p>Version: ${api.version} | API Version: ${api.apiVersion}</p>
        </div>
        
        <div class="api-section">
            <h2>📋 Core Functions</h2>
            <div class="method">
                <div class="method-name">getFileDecorations(filePaths: string[])</div>
                <p>Get decoration information for specified files</p>
            </div>
            <div class="method">
                <div class="method-name">refreshDecorations(filePaths?: string[])</div>
                <p>Refresh decorations for all files or specific files</p>
            </div>
            <div class="method">
                <div class="method-name">formatDate(date: Date, format?: string)</div>
                <p>Format date according to current settings</p>
            </div>
            <div class="method">
                <div class="method-name">getFileStats(filePath: string)</div>
                <p>Get comprehensive file statistics</p>
            </div>
        </div>

        <div class="api-section">
            <h2>🔌 Plugin System</h2>
            <div class="method">
                <div class="method-name">registerPlugin(pluginId: string, plugin: Plugin)</div>
                <p>Register a new plugin with the extension</p>
            </div>
            <div class="method">
                <div class="method-name">registerDecorationProvider(providerId: string, provider: DecorationProvider)</div>
                <p>Register a custom decoration provider</p>
            </div>
        </div>

        <div class="api-section">
            <h2>📡 Events</h2>
            <div class="method">
                <div class="method-name">onDecorationChanged(callback: Function)</div>
                <p>Subscribe to decoration change events</p>
            </div>
            <div class="method">
                <div class="method-name">onFileScanned(callback: Function)</div>
                <p>Subscribe to file scan events</p>
            </div>
        </div>

        <div class="api-section">
            <h2>💡 Usage Example</h2>
            <div class="example">
// Get the Explorer Dates API<br>
const explorerDatesApi = vscode.extensions.getExtension('your-publisher.explorer-dates')?.exports;<br><br>
// Register a custom decoration provider<br>
explorerDatesApi.registerDecorationProvider('myProvider', {<br>
&nbsp;&nbsp;provideDecoration: async (uri, stat, currentDecoration) => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;return {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;badge: currentDecoration.badge + ' 🔥',<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tooltip: currentDecoration.tooltip + '\\nCustom info'<br>
&nbsp;&nbsp;&nbsp;&nbsp;};<br>
&nbsp;&nbsp;}<br>
});<br><br>
// Listen for decoration changes<br>
explorerDatesApi.onDecorationChanged((data) => {<br>
&nbsp;&nbsp;console.log('Decorations changed:', data);<br>
});
            </div>
        </div>

        <div class="api-section">
            <h2>📚 Plugin Structure</h2>
            <div class="example">
const myPlugin = {<br>
&nbsp;&nbsp;name: 'My Custom Plugin',<br>
&nbsp;&nbsp;version: '1.0.0',<br>
&nbsp;&nbsp;author: 'Your Name',<br>
&nbsp;&nbsp;description: 'Adds custom functionality',<br><br>
&nbsp;&nbsp;activate: (api) => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Plugin initialization<br>
&nbsp;&nbsp;&nbsp;&nbsp;console.log('Plugin activated!');<br>
&nbsp;&nbsp;},<br><br>
&nbsp;&nbsp;deactivate: () => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Cleanup<br>
&nbsp;&nbsp;&nbsp;&nbsp;console.log('Plugin deactivated!');<br>
&nbsp;&nbsp;}<br>
};<br><br>
// Register the plugin<br>
explorerDatesApi.registerPlugin('myPlugin', myPlugin);
            </div>
        </div>
    </body>
    </html>`;
}

/**
 * Generate HTML for workspace activity report
 */
function generateWorkspaceActivityHTML(files) {
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };
    
    const fileRows = files.map(file => `
        <tr>
            <td>${file.path}</td>
            <td>${file.modified.toLocaleString()}</td>
            <td>${formatFileSize(file.size)}</td>
        </tr>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Workspace File Activity</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
                th { background-color: var(--vscode-editor-background); font-weight: bold; }
                tr:hover { background-color: var(--vscode-list-hoverBackground); }
                .header { margin-bottom: 20px; }
                .stats { display: flex; gap: 20px; margin-bottom: 20px; }
                .stat-box { padding: 10px; background: var(--vscode-editor-background); border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Workspace File Activity</h1>
                <p>Recently modified files in your workspace</p>
            </div>
            <div class="stats">
                <div class="stat-box">
                    <strong>Total Files Analyzed:</strong> ${files.length}
                </div>
                <div class="stat-box">
                    <strong>Most Recent:</strong> ${files.length > 0 ? files[0].modified.toLocaleString() : 'N/A'}
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>File Path</th>
                        <th>Last Modified</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    ${fileRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

/**
 * Generate HTML for diagnostics
 */
function generateDiagnosticsHTML(diagnostics) {
    const sections = Object.entries(diagnostics).map(([title, data]) => {
        const rows = Object.entries(data).map(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(', ') || 'None' : value?.toString() || 'N/A';
            return `
                <tr>
                    <td><strong>${key}:</strong></td>
                    <td>${displayValue}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <div class="diagnostic-section">
                <h3>🔍 ${title}</h3>
                <table>
                    ${rows}
                </table>
            </div>
        `;
    }).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Explorer Dates Diagnostics</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-foreground); }
                .diagnostic-section { margin-bottom: 30px; padding: 20px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); }
                h1 { color: var(--vscode-textLink-foreground); }
                h3 { color: var(--vscode-textPreformat-foreground); margin-top: 0; }
                .header { margin-bottom: 20px; }
                .fix-suggestions { background: var(--vscode-inputValidation-warningBackground); padding: 15px; border-radius: 4px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔧 Explorer Dates Diagnostics</h1>
                <p>This report helps identify why date decorations might not be appearing in your Explorer.</p>
            </div>
            
            ${sections}
            
            <div class="fix-suggestions">
                <h3>💡 Quick Fixes</h3>
                <p><strong>If decorations aren't showing:</strong></p>
                <ol>
                    <li>Try running <code>Explorer Dates: Quick Fix</code> command</li>
                    <li>Use <code>Explorer Dates: Refresh Date Decorations</code> to force refresh</li>
                    <li>Check if your files are excluded by patterns above</li>
                    <li>Restart VS Code if the provider isn't active</li>
                </ol>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate comprehensive diagnostics webview HTML
 */
function generateDiagnosticsWebview(results) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Comprehensive Decoration Diagnostics</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid var(--vscode-panel-border);
            }
            .test-section {
                margin-bottom: 25px;
                padding: 20px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }
            .test-ok { 
                background-color: rgba(0, 255, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiGreen);
            }
            .test-warning { 
                background-color: rgba(255, 255, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiYellow);
            }
            .test-error { 
                background-color: rgba(255, 0, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiRed);
            }
            .status-ok { color: var(--vscode-terminal-ansiGreen); font-weight: bold; }
            .status-warning { color: var(--vscode-terminal-ansiYellow); font-weight: bold; }
            .status-error { color: var(--vscode-terminal-ansiRed); font-weight: bold; }
            .issue-critical { 
                color: var(--vscode-terminal-ansiRed); 
                font-weight: bold;
                background-color: rgba(255, 0, 0, 0.2);
                padding: 5px;
                border-radius: 3px;
                margin: 5px 0;
            }
            .issue-warning { 
                color: var(--vscode-terminal-ansiYellow); 
                background-color: rgba(255, 255, 0, 0.2);
                padding: 5px;
                border-radius: 3px;
                margin: 5px 0;
            }
            pre { 
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 0.9em;
            }
            .summary {
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 15px;
                margin: 20px 0;
            }
            .file-test {
                display: inline-block;
                margin: 5px;
                padding: 8px 12px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.9em;
            }
            .badge-test {
                display: inline-block;
                margin: 3px;
                padding: 4px 8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border-radius: 3px;
                font-family: monospace;
                font-size: 0.8em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔍 Comprehensive Decoration Diagnostics</h1>
            <p><strong>VS Code:</strong> ${results.vscodeVersion} | <strong>Extension:</strong> ${results.extensionVersion}</p>
            <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
        </div>

        ${Object.entries(results.tests).map(([testName, testResult]) => {
            const statusClass = testResult.status === 'OK' ? 'test-ok' : 
                               testResult.status === 'ISSUES_FOUND' ? 'test-warning' : 'test-error';
            const statusColor = testResult.status === 'OK' ? 'status-ok' : 
                               testResult.status === 'ISSUES_FOUND' ? 'status-warning' : 'status-error';
            
            return `
            <div class="test-section ${statusClass}">
                <h2>🧪 ${testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
                <p class="${statusColor}">Status: ${testResult.status}</p>
                
                ${testResult.issues && testResult.issues.length > 0 ? `
                    <h3>Issues Found:</h3>
                    ${testResult.issues.map(issue => {
                        const issueClass = issue.startsWith('CRITICAL:') ? 'issue-critical' : 'issue-warning';
                        return `<div class="${issueClass}">⚠️ ${issue}</div>`;
                    }).join('')}
                ` : ''}
                
                ${testResult.settings ? `
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(testResult.settings, null, 2)}</pre>
                ` : ''}
                
                ${testResult.testFiles ? `
                    <h3>File Tests:</h3>
                    ${testResult.testFiles.map(file => `
                        <div class="file-test">
                            📄 ${file.file}: 
                            ${file.exists ? '✅' : '❌'} exists | 
                            ${file.excluded ? '🚫' : '✅'} ${file.excluded ? 'excluded' : 'included'} | 
                            ${file.hasDecoration ? '🏷️' : '❌'} ${file.hasDecoration ? `badge: ${file.badge}` : 'no decoration'}
                        </div>
                    `).join('')}
                ` : ''}
                
                ${testResult.tests ? `
                    <h3>Test Results:</h3>
                    ${testResult.tests.map(test => `
                        <div class="badge-test">
                            ${test.success ? '✅' : '❌'} ${test.name}
                            ${test.badge ? ` → "${test.badge}"` : ''}
                            ${test.error ? ` (${test.error})` : ''}
                        </div>
                    `).join('')}
                ` : ''}
                
                ${testResult.cacheInfo ? `
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(testResult.cacheInfo, null, 2)}</pre>
                ` : ''}
                
                ${testResult.decorationExtensions && testResult.decorationExtensions.length > 0 ? `
                    <h3>Other Decoration Extensions:</h3>
                    ${testResult.decorationExtensions.map(ext => `
                        <div class="file-test">🔌 ${ext.name} (${ext.id})</div>
                    `).join('')}
                ` : ''}
            </div>`;
        }).join('')}
        
        <div class="summary">
            <h2>🎯 Summary & Next Steps</h2>
            <p>Review the test results above to identify the root cause of missing decorations.</p>
            <p><strong>Most common causes:</strong></p>
            <ul>
                <li>VS Code decoration settings disabled (explorer.decorations.badges/colors)</li>
                <li>Extension conflicts with icon themes or other decoration providers</li>
                <li>File exclusion patterns being too aggressive</li>
                <li>Badge format issues (length, characters, encoding)</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h2>🔧 Raw Results</h2>
            <pre>${JSON.stringify(results, null, 2)}</pre>
        </div>
    </body>
    </html>`;
}

/**
 * Generate HTML for performance analytics
 */
function generatePerformanceAnalyticsHTML(metrics) {
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Performance Analytics</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .metric-card { background: var(--vscode-editor-background); padding: 15px; border-radius: 8px; border: 1px solid var(--vscode-widget-border); }
                .metric-title { font-weight: bold; margin-bottom: 10px; color: var(--vscode-foreground); }
                .metric-value { font-size: 24px; font-weight: bold; color: var(--vscode-textLink-foreground); }
                .metric-label { font-size: 12px; color: var(--vscode-descriptionForeground); }
                .progress-bar { width: 100%; height: 8px; background: var(--vscode-progressBar-background); border-radius: 4px; margin: 8px 0; }
                .progress-fill { height: 100%; background: var(--vscode-progressBar-foreground); border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>🚀 Explorer Dates Performance Analytics</h1>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">📊 Basic Metrics</div>
                    <div class="metric-value">${metrics.totalDecorations || 0}</div>
                    <div class="metric-label">Total Decorations</div>
                    <div class="metric-value">${metrics.cacheHitRate || '0%'}</div>
                    <div class="metric-label">Cache Hit Rate</div>
                </div>
                
                ${metrics.advancedCache ? `
                <div class="metric-card">
                    <div class="metric-title">🧠 Advanced Cache</div>
                    <div class="metric-value">${metrics.advancedCache.memoryItems || 0}</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">${formatBytes(metrics.advancedCache.memoryUsage || 0)}</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${metrics.advancedCache.memoryUsagePercent || 0}%"></div>
                    </div>
                    <div class="metric-label">${metrics.advancedCache.memoryUsagePercent || '0.00'}% of limit</div>
                    <div class="metric-value">${metrics.advancedCache.memoryHitRate || '0%'}</div>
                    <div class="metric-label">Memory Hit Rate</div>
                    <div class="metric-value">${metrics.advancedCache.diskHitRate || '0%'}</div>
                    <div class="metric-label">Disk Hit Rate</div>
                </div>
                ` : `
                <div class="metric-card">
                    <div class="metric-title">🧠 Advanced Cache</div>
                    <div class="metric-value">0</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">0 B</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="metric-value">Inactive</div>
                    <div class="metric-label">Status</div>
                </div>
                `}
                
                ${metrics.batchProcessor ? `
                <div class="metric-card">
                    <div class="metric-title">⚡ Batch Processor</div>
                    <div class="metric-value">${metrics.batchProcessor.totalBatches}</div>
                    <div class="metric-label">Total Batches Processed</div>
                    <div class="metric-value">${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Batch Time</div>
                    <div class="metric-value">${metrics.batchProcessor.isProcessing ? 'Active' : 'Idle'}</div>
                    <div class="metric-label">Current Status</div>
                </div>
                ` : ''}
                
                <div class="metric-card">
                    <div class="metric-title">📈 Performance</div>
                    <div class="metric-value">${metrics.cacheHits || 0}</div>
                    <div class="metric-label">Cache Hits</div>
                    <div class="metric-value">${metrics.cacheMisses || 0}</div>
                    <div class="metric-label">Cache Misses</div>
                    <div class="metric-value">${metrics.errors || 0}</div>
                    <div class="metric-label">Errors</div>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Initialize status bar integration
 */
function initializeStatusBar(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'explorerDates.showFileDetails';
    statusBarItem.tooltip = 'Click to show detailed file information';
    
    // Update status bar when selection changes
    const updateStatusBar = async () => {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                statusBarItem.hide();
                return;
            }
            
            const uri = activeEditor.document.uri;
            if (uri.scheme !== 'file') {
                statusBarItem.hide();
                return;
            }
            
            const fs = require('fs').promises;
            const stat = await fs.stat(uri.fsPath);
            
            const timeAgo = fileDateProvider._formatDateBadge(stat.mtime, 'smart');
            const fileSize = fileDateProvider._formatFileSize(stat.size, 'auto');
            
            statusBarItem.text = `$(clock) ${timeAgo} $(file) ${fileSize}`;
            statusBarItem.show();
        } catch (error) {
            statusBarItem.hide();
            logger.debug('Failed to update status bar', error);
        }
    };
    
    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar);
    vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
    
    // Initial update
    updateStatusBar();
    
    context.subscriptions.push(statusBarItem);
    return statusBarItem;
}

/**
 * Extension activation function
 * @param {vscode.ExtensionContext} context 
 */
async function activate(context) {
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
        
        // Initialize advanced performance systems
        await fileDateProvider.initializeAdvancedSystems(context);
        
        // Initialize UX enhancement systems
        const onboardingManager = new OnboardingManager(context);
        
        // Initialize Integration & Ecosystem systems
        const workspaceTemplatesManager = new WorkspaceTemplatesManager();
        const extensionApiManager = new ExtensionApiManager();
        const exportReportingManager = new ExportReportingManager();
        
        // Expose public API for other extensions
        const api = extensionApiManager.getApi();
        context.exports = api;
        

        
        // Show onboarding if needed
        const onboardingConfig = vscode.workspace.getConfiguration('explorerDates');
        if (onboardingConfig.get('showWelcomeOnStartup', true) && await onboardingManager.shouldShowOnboarding()) {
            // Delay to let extension fully activate and avoid interrupting user workflow
            // Longer delay for more graceful experience
            setTimeout(() => {
                onboardingManager.showWelcomeMessage();
            }, 5000);
        }

        // Register refresh command for decorations
        const refreshDecorations = vscode.commands.registerCommand('explorerDates.refreshDateDecorations', () => {
            try {
                if (fileDateProvider) {
                    // Clear all caches to force fresh decorations
                    fileDateProvider.clearAllCaches();
                    fileDateProvider.refreshAll();
                    const message = l10n.getString('refreshSuccess') || 'Date decorations refreshed - all caches cleared';
                    vscode.window.showInformationMessage(message);
                    logger.info('Date decorations refreshed manually with cache clear');
                }
            } catch (error) {
                logger.error('Failed to refresh decorations', error);
                vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`);
            }
        });
        context.subscriptions.push(refreshDecorations);

        // Note: preview/clear preview commands for onboarding are registered later

        // Register preview commands for onboarding
        const previewConfiguration = vscode.commands.registerCommand('explorerDates.previewConfiguration', (settings) => {
            try {
                if (fileDateProvider) {
                    fileDateProvider.applyPreviewSettings(settings);
                    logger.info('Configuration preview applied', settings);
                }
            } catch (error) {
                logger.error('Failed to apply configuration preview', error);
            }
        });
        context.subscriptions.push(previewConfiguration);

        const clearPreview = vscode.commands.registerCommand('explorerDates.clearPreview', () => {
            try {
                if (fileDateProvider) {
                    fileDateProvider.applyPreviewSettings(null);
                    logger.info('Configuration preview cleared');
                }
            } catch (error) {
                logger.error('Failed to clear configuration preview', error);
            }
        });
        context.subscriptions.push(clearPreview);

        // Register command to show metrics
        const showMetrics = vscode.commands.registerCommand('explorerDates.showMetrics', () => {
            try {
                if (fileDateProvider) {
                    const metrics = fileDateProvider.getMetrics();
                    let message = `Explorer Dates Metrics:\n` +
                        `Total Decorations: ${metrics.totalDecorations}\n` +
                        `Cache Size: ${metrics.cacheSize}\n` +
                        `Cache Hits: ${metrics.cacheHits}\n` +
                        `Cache Misses: ${metrics.cacheMisses}\n` +
                        `Cache Hit Rate: ${metrics.cacheHitRate}\n` +
                        `Errors: ${metrics.errors}`;
                    
                    // Add advanced cache metrics if available
                    if (metrics.advancedCache) {
                        message += `\n\nAdvanced Cache:\n` +
                            `Memory Items: ${metrics.advancedCache.memoryItems}\n` +
                            `Memory Usage: ${(metrics.advancedCache.memoryUsage / 1024 / 1024).toFixed(2)} MB\n` +
                            `Memory Hit Rate: ${metrics.advancedCache.memoryHitRate}\n` +
                            `Disk Hit Rate: ${metrics.advancedCache.diskHitRate}\n` +
                            `Evictions: ${metrics.advancedCache.evictions}`;
                    }
                    
                    // Add batch processor metrics if available
                    if (metrics.batchProcessor) {
                        message += `\n\nBatch Processor:\n` +
                            `Queue Length: ${metrics.batchProcessor.queueLength}\n` +
                            `Is Processing: ${metrics.batchProcessor.isProcessing}\n` +
                            `Average Batch Time: ${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms`;
                    }
                    
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

        // Register debug command to show current configuration
        const showConfig = vscode.commands.registerCommand('explorerDates.showCurrentConfig', () => {
            try {
                const config = vscode.workspace.getConfiguration('explorerDates');
                const settings = {
                    highContrastMode: config.get('highContrastMode'),
                    badgePriority: config.get('badgePriority'), 
                    colorScheme: config.get('colorScheme'),
                    accessibilityMode: config.get('accessibilityMode'),
                    dateDecorationFormat: config.get('dateDecorationFormat'),
                    showGitInfo: config.get('showGitInfo'),
                    showFileSize: config.get('showFileSize')
                };
                
                const message = `Current Explorer Dates Configuration:\n\n${Object.entries(settings).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}`;
                
                vscode.window.showInformationMessage(message, { modal: true });
                logger.info('Current configuration displayed', settings);
            } catch (error) {
                logger.error('Failed to show configuration', error);
            }
        });
        context.subscriptions.push(showConfig);

        // Register command to reset problematic settings
        const resetSettings = vscode.commands.registerCommand('explorerDates.resetToDefaults', async () => {
            try {
                const config = vscode.workspace.getConfiguration('explorerDates');
                
                await config.update('highContrastMode', false, vscode.ConfigurationTarget.Global);
                await config.update('badgePriority', 'time', vscode.ConfigurationTarget.Global);
                await config.update('accessibilityMode', false, vscode.ConfigurationTarget.Global);
                
                vscode.window.showInformationMessage('Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately.');
                logger.info('Reset problematic settings to defaults');
                
                // Force refresh
                if (fileDateProvider) {
                    fileDateProvider.clearAllCaches();
                    fileDateProvider.refreshAll();
                }
            } catch (error) {
                logger.error('Failed to reset settings', error);
                vscode.window.showErrorMessage(`Failed to reset settings: ${error.message}`);
            }
        });
        context.subscriptions.push(resetSettings);

        // Register toggle decorations command
        const toggleDecorations = vscode.commands.registerCommand('explorerDates.toggleDecorations', () => {
            try {
                const config = vscode.workspace.getConfiguration('explorerDates');
                const currentValue = config.get('showDateDecorations', true);
                config.update('showDateDecorations', !currentValue, vscode.ConfigurationTarget.Global);
                const message = !currentValue ? 
                    l10n.getString('decorationsEnabled') || 'Date decorations enabled' :
                    l10n.getString('decorationsDisabled') || 'Date decorations disabled';
                vscode.window.showInformationMessage(message);
                logger.info(`Date decorations toggled to: ${!currentValue}`);
            } catch (error) {
                logger.error('Failed to toggle decorations', error);
                vscode.window.showErrorMessage(`Failed to toggle decorations: ${error.message}`);
            }
        });
        context.subscriptions.push(toggleDecorations);

        // Register copy file date command
        const copyFileDate = vscode.commands.registerCommand('explorerDates.copyFileDate', async (uri) => {
            try {
                if (!uri && vscode.window.activeTextEditor) {
                    uri = vscode.window.activeTextEditor.document.uri;
                }
                if (!uri) {
                    vscode.window.showWarningMessage('No file selected');
                    return;
                }
                
                const fs = require('fs').promises;
                const stat = await fs.stat(uri.fsPath);
                const dateString = stat.mtime.toLocaleString();
                
                await vscode.env.clipboard.writeText(dateString);
                vscode.window.showInformationMessage(`Copied to clipboard: ${dateString}`);
                logger.info(`File date copied for: ${uri.fsPath}`);
            } catch (error) {
                logger.error('Failed to copy file date', error);
                vscode.window.showErrorMessage(`Failed to copy file date: ${error.message}`);
            }
        });
        context.subscriptions.push(copyFileDate);

        // Register show file details command
        const showFileDetails = vscode.commands.registerCommand('explorerDates.showFileDetails', async (uri) => {
            try {
                if (!uri && vscode.window.activeTextEditor) {
                    uri = vscode.window.activeTextEditor.document.uri;
                }
                if (!uri) {
                    vscode.window.showWarningMessage('No file selected');
                    return;
                }
                
                const fs = require('fs').promises;
                const path = require('path');
                const stat = await fs.stat(uri.fsPath);
                
                const fileName = path.basename(uri.fsPath);
                const fileSize = fileDateProvider._formatFileSize(stat.size, 'auto');
                const modified = stat.mtime.toLocaleString();
                const created = stat.birthtime.toLocaleString();
                
                const details = `File: ${fileName}\n` +
                    `Size: ${fileSize}\n` +
                    `Modified: ${modified}\n` +
                    `Created: ${created}\n` +
                    `Path: ${uri.fsPath}`;
                
                vscode.window.showInformationMessage(details, { modal: true });
                logger.info(`File details shown for: ${uri.fsPath}`);
            } catch (error) {
                logger.error('Failed to show file details', error);
                vscode.window.showErrorMessage(`Failed to show file details: ${error.message}`);
            }
        });
        context.subscriptions.push(showFileDetails);

        // Register toggle fade old files command
        const toggleFadeOldFiles = vscode.commands.registerCommand('explorerDates.toggleFadeOldFiles', () => {
            try {
                const config = vscode.workspace.getConfiguration('explorerDates');
                const currentValue = config.get('fadeOldFiles', false);
                config.update('fadeOldFiles', !currentValue, vscode.ConfigurationTarget.Global);
                const message = !currentValue ? 
                    'Fade old files enabled' :
                    'Fade old files disabled';
                vscode.window.showInformationMessage(message);
                logger.info(`Fade old files toggled to: ${!currentValue}`);
            } catch (error) {
                logger.error('Failed to toggle fade old files', error);
                vscode.window.showErrorMessage(`Failed to toggle fade old files: ${error.message}`);
            }
        });
        context.subscriptions.push(toggleFadeOldFiles);

        // Register show file history command
        const showFileHistory = vscode.commands.registerCommand('explorerDates.showFileHistory', async (uri) => {
            try {
                if (!uri && vscode.window.activeTextEditor) {
                    uri = vscode.window.activeTextEditor.document.uri;
                }
                if (!uri) {
                    vscode.window.showWarningMessage('No file selected');
                    return;
                }
                
                const { exec } = require('child_process');
                const path = require('path');
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                if (!workspaceFolder) {
                    vscode.window.showWarningMessage('File is not in a workspace');
                    return;
                }
                
                const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
                const command = `git log --oneline -10 -- "${relativePath}"`;
                
                exec(command, { cwd: workspaceFolder.uri.fsPath }, (error, stdout) => {
                    if (error) {
                        if (error.message.includes('not a git repository')) {
                            vscode.window.showWarningMessage('This file is not in a Git repository');
                        } else {
                            vscode.window.showErrorMessage(`Git error: ${error.message}`);
                        }
                        return;
                    }
                    
                    if (!stdout.trim()) {
                        vscode.window.showInformationMessage('No Git history found for this file');
                        return;
                    }
                    
                    const history = stdout.trim();
                    const fileName = path.basename(uri.fsPath);
                    vscode.window.showInformationMessage(
                        `Recent commits for ${fileName}:\n\n${history}`,
                        { modal: true }
                    );
                });
                
                logger.info(`File history requested for: ${uri.fsPath}`);
            } catch (error) {
                logger.error('Failed to show file history', error);
                vscode.window.showErrorMessage(`Failed to show file history: ${error.message}`);
            }
        });
        context.subscriptions.push(showFileHistory);

        // Register compare with previous version command
        const compareWithPrevious = vscode.commands.registerCommand('explorerDates.compareWithPrevious', async (uri) => {
            try {
                if (!uri && vscode.window.activeTextEditor) {
                    uri = vscode.window.activeTextEditor.document.uri;
                }
                if (!uri) {
                    vscode.window.showWarningMessage('No file selected');
                    return;
                }
                
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                if (!workspaceFolder) {
                    vscode.window.showWarningMessage('File is not in a workspace');
                    return;
                }
                
                // Use VS Code's built-in Git diff command
                await vscode.commands.executeCommand('git.openChange', uri);
                logger.info(`Git diff opened for: ${uri.fsPath}`);
            } catch (error) {
                logger.error('Failed to compare with previous version', error);
                vscode.window.showErrorMessage(`Failed to compare with previous version: ${error.message}`);
            }
        });
        context.subscriptions.push(compareWithPrevious);

        // Register workspace activity command
        const showWorkspaceActivity = vscode.commands.registerCommand('explorerDates.showWorkspaceActivity', async () => {
            try {
                const panel = vscode.window.createWebviewPanel(
                    'workspaceActivity',
                    'Workspace File Activity',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                // Generate workspace activity report
                const fs = require('fs').promises;
                const path = require('path');
                const files = [];
                
                if (!vscode.workspace.workspaceFolders) {
                    vscode.window.showWarningMessage('No workspace folder open');
                    return;
                }
                
                // Get all files in workspace (simplified - in practice you'd want to use workspace.findFiles)
                const workspaceFolder = vscode.workspace.workspaceFolders[0];
                const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);
                
                for (const fileUri of allFiles) {
                    try {
                        const stat = await fs.stat(fileUri.fsPath);
                        if (stat.isFile()) {
                            files.push({
                                path: path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath),
                                modified: stat.mtime,
                                size: stat.size
                            });
                        }
                    } catch (err) {
                        // Skip files we can't access
                    }
                }
                
                // Sort by modification time (most recent first)
                files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
                
                // Generate HTML report
                const html = generateWorkspaceActivityHTML(files.slice(0, 50)); // Top 50 files
                panel.webview.html = html;
                
                logger.info('Workspace activity panel opened');
            } catch (error) {
                logger.error('Failed to show workspace activity', error);
                vscode.window.showErrorMessage(`Failed to show workspace activity: ${error.message}`);
            }
        });
        context.subscriptions.push(showWorkspaceActivity);

        // Register performance analytics command
        const showPerformanceAnalytics = vscode.commands.registerCommand('explorerDates.showPerformanceAnalytics', async () => {
            try {
                const panel = vscode.window.createWebviewPanel(
                    'performanceAnalytics',
                    'Explorer Dates Performance Analytics',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                const metrics = fileDateProvider ? fileDateProvider.getMetrics() : {};
                panel.webview.html = generatePerformanceAnalyticsHTML(metrics);
                
                logger.info('Performance analytics panel opened');
            } catch (error) {
                logger.error('Failed to show performance analytics', error);
                vscode.window.showErrorMessage(`Failed to show performance analytics: ${error.message}`);
            }
        });
        context.subscriptions.push(showPerformanceAnalytics);

        // Register cache debugging command
        const debugCache = vscode.commands.registerCommand('explorerDates.debugCache', async () => {
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
                        'Sample Cache Keys': metrics.cacheDebugging.memoryCacheKeys || []
                    };
                    
                    const message = JSON.stringify(debugInfo, null, 2);
                    vscode.window.showInformationMessage(
                        `Cache Debug Info:\n${message}`,
                        { modal: true }
                    );
                    logger.info('Cache debug info displayed', debugInfo);
                }
            } catch (error) {
                logger.error('Failed to show cache debug info', error);
                vscode.window.showErrorMessage(`Failed to show cache debug info: ${error.message}`);
            }
        });
        context.subscriptions.push(debugCache);

        // Register diagnostics command for troubleshooting missing decorations
        const diagnostics = vscode.commands.registerCommand('explorerDates.runDiagnostics', async () => {
            try {
                const path = require('path');
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
                    const uri = activeEditor.document.uri;
                    if (uri.scheme === 'file') {
                        diagnosticResults['Current File'] = {
                            'File Path': uri.fsPath,
                            'File Extension': path.extname(uri.fsPath) || 'No extension',
                            'Is Excluded': fileDateProvider ? await fileDateProvider._isExcludedSimple(uri) : 'Unknown'
                        };
                    }
                }
                
                diagnosticResults['Configuration'] = {
                    'Excluded Folders': config.get('excludedFolders', []),
                    'Excluded Patterns': config.get('excludedPatterns', []),
                    'Color Scheme': config.get('colorScheme', 'none'),
                    'Cache Timeout': config.get('cacheTimeout', 30000) + 'ms'
                };
                
                if (fileDateProvider) {
                    const metrics = fileDateProvider.getMetrics();
                    diagnosticResults['Performance'] = {
                        'Total Decorations': metrics.totalDecorations,
                        'Cache Size': metrics.cacheSize,
                        'Errors': metrics.errors
                    };
                }
                
                // Create diagnostic panel
                const panel = vscode.window.createWebviewPanel(
                    'explorerDatesDiagnostics',
                    'Explorer Dates Diagnostics',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                panel.webview.html = generateDiagnosticsHTML(diagnosticResults);
                logger.info('Diagnostics panel opened', diagnosticResults);
                
            } catch (error) {
                logger.error('Failed to run diagnostics', error);
                vscode.window.showErrorMessage(`Failed to run diagnostics: ${error.message}`);
            }
        });
        context.subscriptions.push(diagnostics);

        // Comprehensive decoration diagnostics command
        const testDecorations = vscode.commands.registerCommand('explorerDates.testDecorations', async () => {
            try {
                logger.info('🔍 Starting comprehensive decoration diagnostics...');
                
                const { DecorationDiagnostics } = require('./src/decorationDiagnostics');
                const diagnostics = new DecorationDiagnostics(fileDateProvider);
                
                const results = await diagnostics.runComprehensiveDiagnostics();
                
                // Create detailed diagnostics panel
                const panel = vscode.window.createWebviewPanel(
                    'decorationDiagnostics',
                    'Decoration Diagnostics - Root Cause Analysis',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                panel.webview.html = generateDiagnosticsWebview(results);
                
                // Show critical issues immediately
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
        });
        context.subscriptions.push(testDecorations);

        // Debug command to monitor VS Code decoration requests
        const monitorDecorations = vscode.commands.registerCommand('explorerDates.monitorDecorations', async () => {
            if (fileDateProvider) {
                fileDateProvider.startProviderCallMonitoring();
                
                // Force refresh to trigger new requests
                fileDateProvider.forceRefreshAllDecorations();
                
                // Show monitoring info after 5 seconds
                setTimeout(() => {
                    const stats = fileDateProvider.getProviderCallStats();
                    const message = `VS Code Decoration Requests: ${stats.totalCalls} calls for ${stats.uniqueFiles} files`;
                    vscode.window.showInformationMessage(message);
                    logger.info('🔍 Decoration monitoring results:', stats);
                }, 5000);
                
                vscode.window.showInformationMessage('Started monitoring VS Code decoration requests. Results in 5 seconds...');
            } else {
                vscode.window.showErrorMessage('Decoration provider not available');
            }
        });
        context.subscriptions.push(monitorDecorations);

        // Test VS Code decoration rendering system
        const testVSCodeRendering = vscode.commands.registerCommand('explorerDates.testVSCodeRendering', async () => {
            try {
                const { testVSCodeDecorationRendering, testFileDecorationAPI } = require('./src/decorationTester');
                
                logger.info('🎨 Testing VS Code decoration rendering system...');
                
                // Test direct API
                const apiTests = await testFileDecorationAPI();
                logger.info('🔧 FileDecoration API tests:', apiTests);
                
                // Test actual rendering
                const renderResult = await testVSCodeDecorationRendering();
                logger.info('🎨 Decoration rendering test:', renderResult);
                
                vscode.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.');
                
            } catch (error) {
                logger.error('Failed to test VS Code rendering:', error);
                vscode.window.showErrorMessage(`VS Code rendering test failed: ${error.message}`);
            }
        });
        context.subscriptions.push(testVSCodeRendering);

        // Register quick fix command for common issues
        const quickFix = vscode.commands.registerCommand('explorerDates.quickFix', async () => {
            try {
                const config = vscode.workspace.getConfiguration('explorerDates');
                const fixes = [];
                
                // Check if decorations are disabled
                if (!config.get('showDateDecorations', true)) {
                    fixes.push({
                        issue: 'Date decorations are disabled',
                        fix: async () => {
                            await config.update('showDateDecorations', true, vscode.ConfigurationTarget.Global);
                        },
                        description: 'Enable date decorations'
                    });
                }
                
                // Check for overly restrictive exclusions
                const excludedPatterns = config.get('excludedPatterns', []);
                if (excludedPatterns.includes('**/*')) {
                    fixes.push({
                        issue: 'All files are excluded by pattern',
                        fix: async () => {
                            const newPatterns = excludedPatterns.filter(p => p !== '**/*');
                            await config.update('excludedPatterns', newPatterns, vscode.ConfigurationTarget.Global);
                        },
                        description: 'Remove overly broad exclusion pattern'
                    });
                }
                
                if (fixes.length === 0) {
                    vscode.window.showInformationMessage('No common issues detected. Decorations should be working.');
                    return;
                }
                
                const items = fixes.map(fix => ({
                    label: fix.description,
                    description: fix.issue,
                    fix: fix.fix
                }));
                
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an issue to fix automatically'
                });
                
                if (selected) {
                    await selected.fix();
                    vscode.window.showInformationMessage('Fixed! Try refreshing decorations now.');
                    
                    // Refresh decorations
                    if (fileDateProvider) {
                        fileDateProvider.clearAllCaches();
                        fileDateProvider.refreshAll();
                    }
                }
                
            } catch (error) {
                logger.error('Failed to run quick fix', error);
                vscode.window.showErrorMessage(`Failed to run quick fix: ${error.message}`);
            }
        });
        context.subscriptions.push(quickFix);

        // Register keyboard shortcuts help command
        const showKeyboardShortcuts = vscode.commands.registerCommand('explorerDates.showKeyboardShortcuts', async () => {
            try {
                if (fileDateProvider && fileDateProvider._accessibility) {
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
        });
        context.subscriptions.push(showKeyboardShortcuts);

        // Register feature tour command
        const showFeatureTour = vscode.commands.registerCommand('explorerDates.showFeatureTour', async () => {
            try {
                await onboardingManager.showFeatureTour();
                logger.info('Feature tour opened');
            } catch (error) {
                logger.error('Failed to show feature tour', error);
                vscode.window.showErrorMessage(`Failed to show feature tour: ${error.message}`);
            }
        });
        context.subscriptions.push(showFeatureTour);

        // Register quick setup command
        const showQuickSetup = vscode.commands.registerCommand('explorerDates.showQuickSetup', async () => {
            try {
                await onboardingManager.showQuickSetupWizard();
                logger.info('Quick setup wizard opened');
            } catch (error) {
                logger.error('Failed to show quick setup wizard', error);
                vscode.window.showErrorMessage(`Failed to show quick setup wizard: ${error.message}`);
            }
        });
        context.subscriptions.push(showQuickSetup);

        // Register "What's New" command for existing users
        const showWhatsNew = vscode.commands.registerCommand('explorerDates.showWhatsNew', async () => {
            try {
                const extensionVersion = context.extension.packageJSON.version;
                await onboardingManager.showWhatsNew(extensionVersion);
                logger.info('What\'s new panel opened');
            } catch (error) {
                logger.error('Failed to show what\'s new', error);
                vscode.window.showErrorMessage(`Failed to show what's new: ${error.message}`);
            }
        });
        context.subscriptions.push(showWhatsNew);

        // Register workspace templates commands
        const openTemplateManager = vscode.commands.registerCommand('explorerDates.openTemplateManager', async () => {
            try {
                await workspaceTemplatesManager.showTemplateManager();
                logger.info('Template manager opened');
            } catch (error) {
                logger.error('Failed to open template manager', error);
                vscode.window.showErrorMessage(`Failed to open template manager: ${error.message}`);
            }
        });
        context.subscriptions.push(openTemplateManager);

        const saveTemplate = vscode.commands.registerCommand('explorerDates.saveTemplate', async () => {
            try {
                const name = await vscode.window.showInputBox({ 
                    prompt: 'Enter template name',
                    placeHolder: 'e.g., My Project Setup'
                });
                if (name) {
                    const description = await vscode.window.showInputBox({ 
                        prompt: 'Enter description (optional)',
                        placeHolder: 'Brief description of this template'
                    }) || '';
                    await workspaceTemplatesManager.saveCurrentConfiguration(name, description);
                }
                logger.info('Template saved');
            } catch (error) {
                logger.error('Failed to save template', error);
                vscode.window.showErrorMessage(`Failed to save template: ${error.message}`);
            }
        });
        context.subscriptions.push(saveTemplate);

        // Register export/reporting commands
        const generateReport = vscode.commands.registerCommand('explorerDates.generateReport', async () => {
            try {
                await exportReportingManager.showReportDialog();
                logger.info('Report generation started');
            } catch (error) {
                logger.error('Failed to generate report', error);
                vscode.window.showErrorMessage(`Failed to generate report: ${error.message}`);
            }
        });
        context.subscriptions.push(generateReport);

        // Register API information command
        const showApiInfo = vscode.commands.registerCommand('explorerDates.showApiInfo', async () => {
            try {
                const panel = vscode.window.createWebviewPanel(
                    'apiInfo',
                    'Explorer Dates API Information',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                panel.webview.html = getApiInformationHtml(api);
                logger.info('API information panel opened');
            } catch (error) {
                logger.error('Failed to show API information', error);
                vscode.window.showErrorMessage(`Failed to show API information: ${error.message}`);
            }
        });
        context.subscriptions.push(showApiInfo);



        // Initialize status bar integration
        let statusBarItem;
        const config = vscode.workspace.getConfiguration('explorerDates');
        if (config.get('showStatusBar', false)) {
            statusBarItem = initializeStatusBar(context);
        }
        
        // Watch for status bar setting changes
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.showStatusBar')) {
                const newValue = vscode.workspace.getConfiguration('explorerDates').get('showStatusBar', false);
                if (newValue && !statusBarItem) {
                    statusBarItem = initializeStatusBar(context);
                } else if (!newValue && statusBarItem) {
                    statusBarItem.dispose();
                    statusBarItem = null;
                }
            }
        });
        
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
async function deactivate() {
    try {
        if (logger) {
            logger.info('Explorer Dates extension is being deactivated');
        } else {
            console.log('Explorer Dates extension is being deactivated');
        }
        
        // Clean up resources
        if (fileDateProvider && typeof fileDateProvider.dispose === 'function') {
            await fileDateProvider.dispose();
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