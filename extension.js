// extension.js - Explorer Dates
const vscode = require('vscode');
const { FileDateDecorationProvider } = require('./src/fileDateDecorationProvider');
const { getLogger } = require('./src/logger');
const { getLocalization } = require('./src/localization');
const { fileSystem } = require('./src/filesystem/FileSystemAdapter');
const { registerCoreCommands } = require('./src/commands/coreCommands');
const { registerAnalysisCommands } = require('./src/commands/analysisCommands');
const { registerOnboardingCommands } = require('./src/commands/onboardingCommands');
// Lazy load large modules to reduce initial bundle size
// const { OnboardingManager } = require('./src/onboarding');
// const { WorkspaceTemplatesManager } = require('./src/workspaceTemplates');
// const { ExtensionApiManager } = require('./src/extensionApi');
// const { ExportReportingManager } = require('./src/exportReporting');

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
                    <div class="metric-value">${metrics.batchProcessor.queueLength || 0}</div>
                    <div class="metric-label">Queued Items</div>
                    <div class="metric-value">${metrics.batchProcessor.currentProgress ? (metrics.batchProcessor.currentProgress * 100).toFixed(0) + '%' : '0%'}</div>
                    <div class="metric-label">Progress</div>
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

                ${metrics.performanceTiming ? `
                <div class="metric-card">
                    <div class="metric-title">🕒 I/O Latency</div>
                    <div class="metric-value">${metrics.performanceTiming.avgGitBlameMs}ms</div>
                    <div class="metric-label">Avg Git Blame (${metrics.performanceTiming.gitBlameCalls} calls)</div>
                    <div class="metric-value">${metrics.performanceTiming.avgFileStatMs}ms</div>
                    <div class="metric-label">Avg File Stat (${metrics.performanceTiming.fileStatCalls} calls)</div>
                    <div class="metric-value">${metrics.performanceTiming.totalGitBlameTimeMs}ms</div>
                    <div class="metric-label">Total Git Time</div>
                    <div class="metric-value">${metrics.performanceTiming.totalFileStatTimeMs}ms</div>
                    <div class="metric-label">Total File Stat Time</div>
                </div>
                ` : ''}
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
            
            const stat = await fileSystem.stat(uri);
            
            const modified = stat.mtime instanceof Date ? stat.mtime : new Date(stat.mtime);
            const timeAgo = fileDateProvider._formatDateBadge(modified, 'smart');
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
        context.subscriptions.push(l10n);
        
        logger.info('Explorer Dates: Extension activated');

        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        await vscode.commands.executeCommand('setContext', 'explorerDates.gitFeaturesAvailable', !isWeb);

        const featureConfig = vscode.workspace.getConfiguration('explorerDates');
        const workspaceTemplatesEnabled = featureConfig.get('enableWorkspaceTemplates', true);
        const reportingEnabled = featureConfig.get('enableReporting', true);
        const apiEnabled = featureConfig.get('enableExtensionApi', true);

        // Register file date decoration provider for overlay dates in Explorer
        fileDateProvider = new FileDateDecorationProvider();
        const decorationDisposable = vscode.window.registerFileDecorationProvider(fileDateProvider);
        context.subscriptions.push(decorationDisposable);
        context.subscriptions.push(fileDateProvider); // For proper disposal
        context.subscriptions.push(logger); // Dispose logger on deactivation
        
        // Initialize advanced performance systems
        await fileDateProvider.initializeAdvancedSystems(context);
        
        // Initialize managers lazily to reduce startup time and bundle size
        let onboardingManager = null;
        let workspaceTemplatesManager = null;
        let extensionApiManager = null;
        let exportReportingManager = null;
        
        // Helper functions for lazy loading
        const getOnboardingManager = () => {
            if (!onboardingManager) {
                const { OnboardingManager } = require('./src/onboarding');
                onboardingManager = new OnboardingManager(context);
            }
            return onboardingManager;
        };
        
        const getWorkspaceTemplatesManager = () => {
            if (!workspaceTemplatesEnabled) {
                throw new Error('Workspace templates are disabled via explorerDates.enableWorkspaceTemplates');
            }
            if (!workspaceTemplatesManager) {
                const { WorkspaceTemplatesManager } = require('./src/workspaceTemplates');
                workspaceTemplatesManager = new WorkspaceTemplatesManager(context);
            }
            return workspaceTemplatesManager;
        };
        
        const getExtensionApiManager = () => {
            if (!extensionApiManager) {
                const { ExtensionApiManager } = require('./src/extensionApi');
                extensionApiManager = new ExtensionApiManager();
                context.subscriptions.push(extensionApiManager);
            }
            return extensionApiManager;
        };
        
        const getExportReportingManager = () => {
            if (!reportingEnabled) {
                throw new Error('Reporting is disabled via explorerDates.enableReporting');
            }
            if (!exportReportingManager) {
                const { ExportReportingManager } = require('./src/exportReporting');
                exportReportingManager = new ExportReportingManager();
                context.subscriptions.push(exportReportingManager);
            }
            return exportReportingManager;
        };
        
        // Expose public API for other extensions (lazy)
        const apiFactory = () => getExtensionApiManager().getApi();
        if (apiEnabled) {
            context.exports = apiFactory;
        } else {
            context.exports = undefined;
            logger.info('Explorer Dates API exports disabled via explorerDates.enableExtensionApi');
        }

        // Show onboarding if needed
        const onboardingConfig = vscode.workspace.getConfiguration('explorerDates');
        if (onboardingConfig.get('showWelcomeOnStartup', true) && await getOnboardingManager().shouldShowOnboarding()) {
            // Delay to let extension fully activate and avoid interrupting user workflow
            // Longer delay for more graceful experience
            setTimeout(() => {
                getOnboardingManager().showWelcomeMessage();
            }, 5000);
        }

        registerCoreCommands({ context, fileDateProvider, logger, l10n });

        registerAnalysisCommands({
            context,
            fileDateProvider,
            logger,
            generators: {
                generateWorkspaceActivityHTML,
                generatePerformanceAnalyticsHTML,
                generateDiagnosticsHTML,
                generateDiagnosticsWebview
            }
        });

        registerOnboardingCommands({ context, logger, getOnboardingManager });

        // Register workspace templates commands
        const openTemplateManager = vscode.commands.registerCommand('explorerDates.openTemplateManager', async () => {
            try {
                if (!workspaceTemplatesEnabled) {
                    vscode.window.showInformationMessage('Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.');
                    return;
                }
                await getWorkspaceTemplatesManager().showTemplateManager();
                logger.info('Template manager opened');
            } catch (error) {
                logger.error('Failed to open template manager', error);
                vscode.window.showErrorMessage(`Failed to open template manager: ${error.message}`);
            }
        });
        context.subscriptions.push(openTemplateManager);

        const saveTemplate = vscode.commands.registerCommand('explorerDates.saveTemplate', async () => {
            try {
                if (!workspaceTemplatesEnabled) {
                    vscode.window.showInformationMessage('Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.');
                    return;
                }
                const name = await vscode.window.showInputBox({ 
                    prompt: 'Enter template name',
                    placeHolder: 'e.g., My Project Setup'
                });
                if (name) {
                    const description = await vscode.window.showInputBox({ 
                        prompt: 'Enter description (optional)',
                        placeHolder: 'Brief description of this template'
                    }) || '';
                    await getWorkspaceTemplatesManager().saveCurrentConfiguration(name, description);
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
                if (!reportingEnabled) {
                    vscode.window.showInformationMessage('Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.');
                    return;
                }
                await getExportReportingManager().showReportDialog();
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
                if (!apiEnabled) {
                    vscode.window.showInformationMessage('Explorer Dates API is disabled via settings.');
                    return;
                }

                const panel = vscode.window.createWebviewPanel(
                    'apiInfo',
                    'Explorer Dates API Information',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                panel.webview.html = getApiInformationHtml(apiFactory());
                logger.info('API information panel opened');
            } catch (error) {
                logger.error('Failed to show API information', error);
                vscode.window.showErrorMessage(`Failed to show API information: ${error.message}`);
            }
        });
        context.subscriptions.push(showApiInfo);



        // Initialize status bar integration (disabled in performance mode)
        let statusBarItem;
        const config = vscode.workspace.getConfiguration('explorerDates');
        const performanceMode = config.get('performanceMode', false);
        const showStatusBar = config.get('showStatusBar', false);
        if (showStatusBar && !performanceMode) {
            statusBarItem = initializeStatusBar(context);
        }
        
        // Watch for status bar setting changes
        const statusBarConfigWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.showStatusBar') || e.affectsConfiguration('explorerDates.performanceMode')) {
                const newConfig = vscode.workspace.getConfiguration('explorerDates');
                const newValue = newConfig.get('showStatusBar', false);
                const newPerformanceMode = newConfig.get('performanceMode', false);
                const shouldShowStatusBar = newValue && !newPerformanceMode;
                
                if (shouldShowStatusBar && !statusBarItem) {
                    statusBarItem = initializeStatusBar(context);
                } else if (!shouldShowStatusBar && statusBarItem) {
                    statusBarItem.dispose();
                    statusBarItem = null;
                }
            }
        });
        context.subscriptions.push(statusBarConfigWatcher);
        
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
