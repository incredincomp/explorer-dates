# Copilot Instructions for Explorer Dates Extension

This document provides AI coding agents with essential context for working on the Explorer Dates VS Code extension.

## Extension Overview

Explorer Dates is a VS Code extension that displays file modification timestamps as badges in the Explorer view using VS Code's native `FileDecorationProvider` API. The extension uses **module federation architecture** with feature flags for optimal bundle sizing and performance.

## Core Architecture Patterns

### Module Federation & Feature Flags System
- **Primary Pattern**: Chunks loaded dynamically based on feature flags in `src/featureFlags.js`
- **Build Strategy**: `esbuild-federation.js` creates separate chunks, `esbuild.js` creates main bundle
- **Feature Loading**: Uses `loadFeatureModule()` pattern to lazy-load components
- **API Export**: Maintains synchronous compatibility with `context.exports = apiFactory` (function, not call result)

```javascript
// Feature flag pattern used throughout
const featureFlags = require('./src/featureFlags');
const chunk = await featureFlags.exportReporting(); // Returns module or null
```

### FileDecorationProvider Pattern  
- **Primary Class**: `FileDateDecorationProvider` in `src/fileDateDecorationProvider.js`
- **Key Constraint**: VS Code limits file decoration badges to 2 characters maximum
- **Core Method**: `provideFileDecoration(uri, token)` - returns `vscode.FileDecoration` objects
- **Event System**: Uses `vscode.EventEmitter` for `onDidChangeFileDecorations` to trigger UI updates
- **Threading**: All file operations are async/await with cancellation token support

### Dynamic Import System
```javascript
// Standard pattern for chunk loading in extension.js
const dynamicImports = {
    async loadAnalysisCommands() {
        return featureFlags.analysisCommands();
    },
    async loadExportReporting(context) {
        const chunk = await featureFlags.exportReporting();
        return chunk?.createExportReportingManager?.(context) || null;
    }
};
```

### Advanced Chunk Loading Patterns

#### Conditional Chunk Loading with Graceful Degradation
```javascript
// Pattern from FileDateDecorationProvider.initializeAdvancedSystems()
async initializeAdvancedSystems(context) {
    const AdvancedCacheModule = await featureFlags.advancedCache();
    if (AdvancedCacheModule) {
        const { AdvancedCache } = AdvancedCacheModule;
        this._advancedCache = new AdvancedCache(context);
        await this._advancedCache.initialize();
    } else {
        this._logger.info('Advanced cache disabled by feature flag');
        this._advancedCache = null; // Graceful fallback
    }
}
```

#### Factory Pattern for Chunk Managers
```javascript
// Pattern from extension.js dynamic imports
function ensureOnboardingManager(context) {
    if (!onboardingManagerPromise) {
        onboardingManagerPromise = dynamicImports.loadOnboarding(context);
    }
    return onboardingManagerPromise; // Singleton pattern with lazy loading
}

// Usage with error handling
try {
    const onboardingManager = await ensureOnboardingManager(context);
    if (onboardingManager && await onboardingManager.shouldShowOnboarding()) {
        setTimeout(() => onboardingManager.showWelcomeMessage(), 5000);
    }
} catch (error) {
    logger.warn('Onboarding system unavailable:', error.message);
}
```

#### Lazy Command Registration Pattern
```javascript
// Pattern for deferred command registration based on chunks
const registerAnalysisCommandsLazy = async () => {
    const analysisCommands = await dynamicImports.loadAnalysisCommands();
    if (!analysisCommands) {
        vscode.window.showWarningMessage('Analysis commands unavailable.');
        return null;
    }
    return analysisCommands.registerAnalysisCommands({
        context, fileDateProvider, logger, chunkLoader
    });
};

// Registration only happens when feature is enabled
if (featureConfig.get('enableAnalysisCommands', true)) {
    await registerAnalysisCommandsLazy();
}
```

### Settings Migration Pattern
```javascript
// Migration function for backward compatibility (extension.js)
async function migrateReportingSettings() {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const legacy = config.inspect('enableReporting');
    const current = config.inspect('enableExportReporting');
    
    if (legacy?.workspaceValue !== undefined && current?.workspaceValue === undefined) {
        await config.update('enableExportReporting', legacy.workspaceValue, 
                          vscode.ConfigurationTarget.Workspace);
    }
}
```

## Key Development Patterns

### Chunk Registration Pattern
```javascript
// Registration happens during activation when feature enabled
const analysisEnabled = featureConfig.get('enableAnalysisCommands', true);
if (analysisEnabled) {
    await registerAnalysisCommandsLazy();
}
```

### Service Singleton Pattern  
```javascript
// Services are imported as singletons from utils/
const { getLogger } = require('./src/utils/logger');
const { getLocalization } = require('./src/utils/localization');

// Initialize in constructor
this._logger = getLogger();
this._l10n = getLocalization();
```

### Error Handling Strategy
- **Chunk Loading**: Silent failures with null returns, graceful degradation
- **File Operations**: Return `undefined` for inaccessible files, detailed logging
- **API Calls**: Wrap async operations in try/catch with logger.error()

## Bundle & Build Architecture

### Multi-Target Build System
```bash
npm run compile           # Development build (esbuild.js)
npm run package-bundle    # Production: core + chunks (sequential)
npm run package:core      # Main extension bundle only  
npm run package-chunks    # Module federation chunks only
npm run watch            # Development watch mode
```

### Bundle Structure
- **Main Bundle**: `dist/extension.js` (~99KB) - core functionality only
- **Web Bundle**: `dist/extension.web.js` - browser-compatible version
- **Federation Chunks**: `dist/chunks/*.js` (~281KB total) - optional features
- **External Dependencies**: Chunks marked as external in esbuild config

## Web vs Node.js Bundle Patterns

### Platform Detection & Adaptation
```javascript
// Pattern used throughout extension.js and FileDateDecorationProvider
const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
const isWebEnvironment = typeof process !== 'undefined' && process?.env?.VSCODE_WEB === 'true';

// Conditional Node.js module loading
let nodeFs = null;
let nodePath = null;
try {
    nodeFs = require('fs'); // Only available in Node.js
} catch {
    nodeFs = null; // Graceful fallback for web
}

// Web-specific text decoder fallback
const webTextDecoder = typeof TextDecoder === 'function' 
    ? new TextDecoder('utf-8') 
    : null;
```

### File System Abstraction
```javascript
// Pattern from filesystem/FileSystemAdapter.js
class FileSystemAdapter {
    constructor() {
        this._isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        this._fs = this._isWeb ? vscode.workspace.fs : require('fs').promises;
    }
    
    async readFile(uri) {
        if (this._isWeb) {
            // Use VS Code's virtual file system API
            const data = await vscode.workspace.fs.readFile(uri);
            return webTextDecoder ? webTextDecoder.decode(data) : data.toString();
        } else {
            // Direct Node.js file system access
            return await this._fs.readFile(uri.fsPath, 'utf8');
        }
    }
}
```

### Git Integration Differences
```javascript
// Web environment has limited Git capabilities
if (isWeb) {
    await vscode.commands.executeCommand('setContext', 'explorerDates.gitFeaturesAvailable', false);
    this._logger.info('Git features disabled in web environment');
} else {
    // Full Git blame and author detection available
    await this._maybeLoadGitInsights();
}
```

### Bundle Entry Point Configuration
```json
// package.json configuration
{
    "main": "./dist/extension.js",      // Node.js entry point
    "browser": "./dist/extension.web.js" // Web entry point
}
```

### Build Target Differences
```javascript
// esbuild.js configurations
const builds = [
    {
        entryPoints: ['extension.js'],
        platform: 'node',
        target: 'node16',
        outfile: 'dist/extension.js',
        define: { 'process.env.VSCODE_WEB': '"false"' }
    },
    {
        entryPoints: ['extension.js'], 
        platform: 'browser',
        target: 'es2020',
        outfile: 'dist/extension.web.js',
        define: { 'process.env.VSCODE_WEB': '"true"' }
    }
];
```

### Import Resolution Priority
```javascript
// Pattern in createDefaultLoader (featureFlags.js)
// 1. Try chunk resolver (module federation)
// 2. Fall back to direct require (development)
if (chunkResolver && typeof chunkResolver === 'function') {
    const chunk = await chunkResolver(chunkName);
    if (chunk) return chunk;
}
return require(sourcePath);  // Fallback
```

## Testing & Debug Patterns

### Mock System Integration
- **Test Helper**: `tests/helpers/mockVscode.js` provides comprehensive VS Code API mock
- **Usage Pattern**: Always call `createMockVscode()` before importing extension modules
- **Configuration**: Pass test-specific config via `config` or `explorerDates` options

```javascript
// Correct test setup pattern
const { createMockVscode, createExtensionContext } = require('./tests/helpers/mockVscode');
const mock = createMockVscode({ config: { 'explorerDates.enableApi': true }});
const { activate } = require('./extension.js'); // Import after mock setup
```

### Test Command Patterns
```bash
npm run test:feature-gates    # Feature flag functionality
npm run test:verify-bundle    # Bundle integrity verification  
npm run test:suite           # Full test suite
npm run test:memory          # Memory leak detection
```

## Advanced Testing & Debugging Workflows

### Test Environment Setup
```javascript
// Critical: Mock must be created BEFORE importing extension modules
const { createMockVscode, createExtensionContext } = require('./tests/helpers/mockVscode');
const mock = createMockVscode({
    config: {
        'explorerDates.enableExtensionApi': true,
        'explorerDates.enableExportReporting': false // Test disabled features
    },
    sampleWorkspace: '/path/to/test/workspace'
});

// Import AFTER mock setup to ensure proper module resolution
const { activate } = require('./extension.js');
const context = createExtensionContext();
```

### Feature Flag Testing Scenarios
```javascript
// Test pattern for feature-disabled scenarios
async function testFeatureDisabled() {
    const mock = createMockVscode({
        explorerDates: { enableReporting: false }
    });
    
    const { activate } = require('./extension.js');
    await activate(createExtensionContext());
    
    // Verify command throws appropriate error
    try {
        await vscode.commands.executeCommand('explorerDates.generateReport');
        throw new Error('Expected command to fail when feature disabled');
    } catch (error) {
        assert(error.message.includes('disabled'), 'Should mention feature is disabled');
    }
    
    mock.dispose(); // Always cleanup
}
```

### Memory Leak Testing Pattern
```bash
# Run with garbage collection exposure for memory testing
node --expose-gc tests/test-memory-soak.js

# Environment variables for memory testing
EXPLORER_DATES_MEMORY_SHEDDING=1 \
EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=2 \
node --expose-gc tests/test-memory-soak.js
```

### Bundle Analysis Workflow
```bash
# 1. Build production bundles
npm run package-bundle

# 2. Verify bundle sizes and external dependencies
npm run test:verify-bundle

# 3. Analyze chunk loading in development
DEBUG_CHUNKS=1 npm run compile

# 4. Test federation loading
npm run test:chunk-mapping
```

### Debugging Live Extension Issues
```javascript
// Enable detailed logging for specific components
const logger = require('./src/utils/logger').getLogger();
logger.setLevel('debug'); // In development console

// Access internal metrics for performance debugging
vscode.commands.executeCommand('explorerDates.showMetrics');

// Force cache clear for decoration issues
vscode.commands.executeCommand('explorerDates.refreshDateDecorations');

// Open raw log output for detailed analysis
vscode.commands.executeCommand('explorerDates.openLogs');
```

## Configuration & Feature Management

### Unified Settings System
- **Primary Settings**: Use `enableExportReporting` (consolidated from legacy `enableReporting`)
- **Migration**: Legacy settings automatically migrated during activation
- **Feature Gates**: Each major component has corresponding `enable*` setting in package.json

### Configuration Watching
```javascript
// Standard pattern for config-aware components
vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('explorerDates')) {
        // Update internal settings, invalidate caches if needed
        this.refreshAll({ reason: 'configuration-change' });
    }
});
```

## File Structure Context

```
extension.js                    # Main entry, federation orchestration
src/
├── featureFlags.js            # Feature gating & chunk loading
├── fileDateDecorationProvider.js # Core decoration logic
├── moduleFederation.js        # Federation configuration
├── commands/                  # Command implementations by feature
├── utils/                     # Shared utilities (logger, l10n, etc.)
├── filesystem/                # Cross-platform file operations
├── chunks/                    # Chunk source files for federation
└── workers/                   # Background processing modules
dist/
├── extension.js              # Main bundle (~99KB)
├── extension.web.js          # Web-compatible bundle
└── chunks/                   # Federation chunks (~281KB total)
```

## Common Extension Points

### Adding New Commands
1. Create command in appropriate `src/commands/*.js` file
2. Register in chunk's command export function
3. Add to package.json `contributes.commands` 
4. Ensure proper feature flag gating in registration

### Adding New Chunks
1. Create source in `src/chunks/` or dedicated module
2. Add entry in `src/featureFlags.js` feature loading
3. Configure in `src/moduleFederation.js` if complex
4. Add feature flag to package.json configuration

### API Compatibility
- **Synchronous Export**: Always export function reference, not call result: `context.exports = apiFactory`  
- **Async Version**: Provide `context.exportsAsync` for future async consumers
- **Backward Compatibility**: Maintain function signature, cache internally

## Performance Optimization Strategies

### Bundle Size Optimization
```javascript
// Calculated savings from feature flags (featureFlags.js)
function calculateSavings(config) {
    const baseSize = 267; // Original bundle size in KB
    let totalSavings = 0;
    
    if (!config.enableOnboarding) totalSavings += 34;
    if (!config.enableExportReporting) totalSavings += 17;
    if (!config.enableExtensionApi) totalSavings += 15;
    if (!config.enableWorkspaceTemplates) totalSavings += 14;
    // Result: ~99KB core + 281KB optional chunks
}
```

### Memory Management Patterns
```javascript
// Cache size management in FileDateDecorationProvider
class FileDateDecorationProvider {
    constructor() {
        this._decorationCache = new Map();
        this._maxCacheSize = 10000;
        this._cacheTimeout = 480000; // 8 minutes
    }
    
    _manageCacheSize() {
        if (this._decorationCache.size > this._maxCacheSize) {
            const entries = Array.from(this._decorationCache.entries());
            const toDelete = entries.slice(0, Math.floor(this._maxCacheSize * 0.2));
            toDelete.forEach(([key]) => this._decorationCache.delete(key));
        }
    }
}
```

### Lazy Loading Performance
```javascript
// Viewport-based decoration loading
_shouldProcessInBackground(uri) {
    const isInViewport = this._isFileInViewport(uri.fsPath);
    return !isInViewport && this._featureProfile.applyBackgroundLimits;
}

// Progressive loading for large workspaces  
if (this._workspaceFileCount > 10000) {
    this._featureLevel = 'essential'; // Reduced feature set
    this._logger.info('Large workspace detected, using essential features');
}
```

### Background Processing Optimization
```javascript
// BatchProcessor pattern for expensive operations
class BatchProcessor {
    constructor() {
        this._queue = [];
        this._processing = false;
        this._batchSize = 50;
    }
    
    async processBatch() {
        if (this._processing) return;
        this._processing = true;
        
        const batch = this._queue.splice(0, this._batchSize);
        await Promise.all(batch.map(item => this._processItem(item)));
        
        this._processing = false;
        if (this._queue.length > 0) {
            setTimeout(() => this.processBatch(), 100); // Yield to UI
        }
    }
}
```

### Smart Exclusion Performance
```javascript
// File exclusion patterns to reduce decoration overhead
const DEFAULT_EXCLUSIONS = [
    '**/node_modules/**',
    '**/.git/**', 
    '**/dist/**',
    '**/*.min.js'
];

// Efficient exclusion testing with compiled patterns
this._compiledExclusions = exclusions.map(pattern => 
    new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
);
```

This extension represents a modern VS Code extension with module federation, feature flags, and production-ready chunking. Always maintain the lazy-loading patterns and ensure feature flags properly gate functionality.