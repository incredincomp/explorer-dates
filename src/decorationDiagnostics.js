const vscode = require('vscode');
const { getLogger } = require('./logger');

/**
 * Comprehensive File Decoration Diagnostics
 * This class provides deep analysis of why decorations aren't appearing
 */
class DecorationDiagnostics {
    constructor(decorationProvider) {
        this._logger = getLogger();
        this._provider = decorationProvider;
        this._testResults = [];
    }

    /**
     * Run comprehensive decoration diagnostics
     */
    async runComprehensiveDiagnostics() {
        this._logger.info('🔍 Starting comprehensive decoration diagnostics...');
        
        const results = {
            timestamp: new Date().toISOString(),
            vscodeVersion: vscode.version,
            extensionVersion: vscode.extensions.getExtension('incredincomp.explorer-dates')?.packageJSON?.version,
            tests: {}
        };

        // Test 1: VS Code Settings
        results.tests.vscodeSettings = await this._testVSCodeSettings();
        
        // Test 2: Provider Registration
        results.tests.providerRegistration = await this._testProviderRegistration();
        
        // Test 3: File Processing
        results.tests.fileProcessing = await this._testFileProcessing();
        
        // Test 4: Decoration Creation
        results.tests.decorationCreation = await this._testDecorationCreation();
        
        // Test 5: Cache Analysis
        results.tests.cacheAnalysis = await this._testCacheAnalysis();
        
        // Test 6: Extension Conflicts
        results.tests.extensionConflicts = await this._testExtensionConflicts();
        
        // Test 7: URI and Path Issues
        results.tests.uriPathIssues = await this._testURIPathIssues();

        this._logger.info('🔍 Comprehensive diagnostics completed', results);
        return results;
    }

    /**
     * Test VS Code settings that affect file decorations
     */
    async _testVSCodeSettings() {
        const explorerConfig = vscode.workspace.getConfiguration('explorer');
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const explorerDatesConfig = vscode.workspace.getConfiguration('explorerDates');

        const settings = {
            'explorer.decorations.badges': explorerConfig.get('decorations.badges'),
            'explorer.decorations.colors': explorerConfig.get('decorations.colors'),
            'workbench.colorTheme': workbenchConfig.get('colorTheme'),
            'explorerDates.showDateDecorations': explorerDatesConfig.get('showDateDecorations'),
            'explorerDates.colorScheme': explorerDatesConfig.get('colorScheme'),
            'explorerDates.showGitInfo': explorerDatesConfig.get('showGitInfo')
        };

        const issues = [];
        if (settings['explorer.decorations.badges'] === false) {
            issues.push('CRITICAL: explorer.decorations.badges is disabled');
        }
        if (settings['explorer.decorations.colors'] === false) {
            issues.push('WARNING: explorer.decorations.colors is disabled');
        }
        if (settings['explorerDates.showDateDecorations'] === false) {
            issues.push('CRITICAL: explorerDates.showDateDecorations is disabled');
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            settings,
            issues
        };
    }

    /**
     * Test provider registration status
     */
    async _testProviderRegistration() {
        const issues = [];
        
        if (!this._provider) {
            issues.push('CRITICAL: Decoration provider is null/undefined');
            return { status: 'FAILED', issues };
        }

        // Check if provider has required methods
        if (typeof this._provider.provideFileDecoration !== 'function') {
            issues.push('CRITICAL: provideFileDecoration method missing');
        }

        if (!this._provider.onDidChangeFileDecorations) {
            issues.push('WARNING: onDidChangeFileDecorations event emitter missing');
        }

        // Test if provider is actually being called
        const testUri = vscode.Uri.file('/test/path');
        try {
            const testResult = await this._provider.provideFileDecoration(testUri);
            this._logger.debug('Provider test call completed', { result: !!testResult });
        } catch (error) {
            issues.push(`ERROR: Provider test call failed: ${error.message}`);
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            providerActive: !!this._provider,
            issues
        };
    }

    /**
     * Test file processing for workspace files
     */
    async _testFileProcessing() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return { status: 'NO_WORKSPACE', issues: ['No workspace folders available'] };
        }

        const testFiles = [];
        const issues = [];

        try {
            // Test common files in workspace
            const commonFiles = ['package.json', 'README.md', 'extension.js', 'src/logger.js'];
            
            for (const fileName of commonFiles) {
                const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName);
                
                try {
                    await vscode.workspace.fs.stat(fileUri);
                    
                    // Test if file would be excluded
                    const isExcluded = this._provider._isExcludedSimple ? 
                        await this._provider._isExcludedSimple(fileUri) : false;
                    
                    // Test decoration creation
                    const decoration = await this._provider.provideFileDecoration(fileUri);
                    
                    testFiles.push({
                        file: fileName,
                        exists: true,
                        excluded: isExcluded,
                        hasDecoration: !!decoration,
                        badge: decoration?.badge,
                        uri: fileUri.toString()
                    });
                    
                } catch (fileError) {
                    testFiles.push({
                        file: fileName,
                        exists: false,
                        error: fileError.message
                    });
                }
            }
            
        } catch (error) {
            issues.push(`File processing test failed: ${error.message}`);
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            testFiles,
            issues
        };
    }

    /**
     * Test decoration creation with various inputs
     */
    async _testDecorationCreation() {
        const tests = [];
        const issues = [];

        // Test 1: Simple decoration
        try {
            const simpleDecoration = new vscode.FileDecoration('test');
            tests.push({ name: 'Simple decoration', success: true, badge: simpleDecoration.badge });
        } catch (error) {
            tests.push({ name: 'Simple decoration', success: false, error: error.message });
            issues.push('CRITICAL: Cannot create simple FileDecoration');
        }

        // Test 2: Decoration with tooltip
        try {
            const tooltipDecoration = new vscode.FileDecoration('test', 'Test tooltip');
            tests.push({ name: 'Decoration with tooltip', success: true, hasTooltip: !!(tooltipDecoration && tooltipDecoration.tooltip) });
        } catch (error) {
            tests.push({ name: 'Decoration with tooltip', success: false, error: error.message });
            issues.push('WARNING: Cannot create FileDecoration with tooltip');
        }

        // Test 3: Decoration with color
        try {
            const colorDecoration = new vscode.FileDecoration('test', 'Test tooltip', new vscode.ThemeColor('charts.red'));
            tests.push({ name: 'Decoration with color', success: true, hasColor: !!colorDecoration.color });
        } catch (error) {
            tests.push({ name: 'Decoration with color', success: false, error: error.message });
            issues.push('WARNING: Cannot create FileDecoration with color');
        }

        // Test 4: Various badge formats
        const badgeTests = ['1d', '10m', '2h', '!!', '●●', 'JA12', '123456789'];
        for (const badge of badgeTests) {
            try {
                const badgeDecoration = new vscode.FileDecoration(badge);
                tests.push({ 
                    name: `Badge format: ${badge}`, 
                    success: true, 
                    badge: badgeDecoration.badge,
                    length: badge.length 
                });
            } catch (error) {
                tests.push({ name: `Badge format: ${badge}`, success: false, error: error.message });
                if (badge.length <= 8) {
                    issues.push(`WARNING: Valid badge format '${badge}' failed`);
                }
            }
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            tests,
            issues
        };
    }

    /**
     * Test cache analysis
     */
    async _testCacheAnalysis() {
        const cacheInfo = {
            memoryCache: {
                size: this._provider._decorationCache?.size || 0,
                maxSize: this._provider._maxCacheSize || 0
            },
            advancedCache: {
                available: !!this._provider._advancedCache,
                initialized: false
            },
            metrics: this._provider.getMetrics ? this._provider.getMetrics() : null
        };

        const issues = [];
        
        if (cacheInfo.memoryCache.size > cacheInfo.memoryCache.maxSize * 0.9) {
            issues.push('WARNING: Memory cache is nearly full');
        }

        if (cacheInfo.metrics && cacheInfo.metrics.cacheHits === 0 && cacheInfo.metrics.cacheMisses > 10) {
            issues.push('WARNING: Cache hit rate is 0% - potential cache key issues');
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            cacheInfo,
            issues
        };
    }

    /**
     * Test for potential extension conflicts
     */
    async _testExtensionConflicts() {
        const allExtensions = vscode.extensions.all;
        const potentialConflicts = [];
        const decorationExtensions = [];

        for (const ext of allExtensions) {
            if (!ext.isActive) continue;
            
            const packageJson = ext.packageJSON;
            
            // Check for other file decoration providers
            if (packageJson.contributes?.commands?.some(cmd => 
                cmd.command?.includes('decoration') || 
                cmd.title?.includes('decoration') ||
                cmd.title?.includes('badge') ||
                cmd.title?.includes('explorer')
            )) {
                decorationExtensions.push({
                    id: ext.id,
                    name: packageJson.displayName || packageJson.name,
                    version: packageJson.version
                });
            }

            // Check for known conflicting extensions
            const knownConflicts = [
                'file-icons', 'vscode-icons', 'material-icon-theme',
                'explorer-exclude', 'hide-files', 'file-watcher'
            ];
            
            if (knownConflicts.some(conflict => ext.id.includes(conflict))) {
                potentialConflicts.push({
                    id: ext.id,
                    name: packageJson.displayName || packageJson.name,
                    reason: 'Known to potentially interfere with file decorations'
                });
            }
        }

        const issues = [];
        if (decorationExtensions.length > 1) {
            issues.push(`WARNING: ${decorationExtensions.length} extensions might provide file decorations`);
        }
        if (potentialConflicts.length > 0) {
            issues.push(`WARNING: ${potentialConflicts.length} potentially conflicting extensions detected`);
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            decorationExtensions,
            potentialConflicts,
            issues
        };
    }

    /**
     * Test URI and path issues
     */
    async _testURIPathIssues() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return { status: 'NO_WORKSPACE', issues: ['No workspace available for URI testing'] };
        }

        const tests = [];
        const issues = [];

        // Test various URI formats
        const testPaths = [
            'package.json',
            'src/logger.js',
            'README.md',
            '.gitignore'
        ];

        for (const testPath of testPaths) {
            const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, testPath);
            
            tests.push({
                path: testPath,
                scheme: fileUri.scheme,
                fsPath: fileUri.fsPath,
                authority: fileUri.authority,
                valid: fileUri.scheme === 'file' && fileUri.fsPath.length > 0
            });

            if (fileUri.scheme !== 'file') {
                issues.push(`WARNING: Non-file URI scheme for ${testPath}: ${fileUri.scheme}`);
            }

            if (fileUri.fsPath.includes('\\\\') || fileUri.fsPath.includes('//')) {
                issues.push(`WARNING: Potential path separator issues in ${testPath}`);
            }
        }

        return {
            status: issues.length > 0 ? 'ISSUES_FOUND' : 'OK',
            tests,
            issues
        };
    }
}

module.exports = { DecorationDiagnostics };
