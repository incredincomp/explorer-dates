# Copilot Instructions for Explorer Dates Extension

This document provides AI coding agents with essential context for working on the Explorer Dates VS Code extension.

## Extension Overview

Explorer Dates is a VS Code extension that displays file modification timestamps as badges in the Explorer view using VS Code's native `FileDecorationProvider` API. The extension emphasizes performance, user experience, and proper integration with VS Code's theming system.

## Core Architecture Patterns

### FileDecorationProvider Pattern
- **Primary Class**: `FileDateDecorationProvider` in `src/fileDateDecorationProvider.js`
- **Key Constraint**: VS Code limits file decoration badges to 2 characters maximum
- **Core Method**: `provideFileDecoration(uri, token)` - returns `vscode.FileDecoration` objects
- **Event System**: Uses `vscode.EventEmitter` for `onDidChangeFileDecorations` to trigger UI updates
- **Threading**: All file operations are async/await with cancellation token support

### Multi-Layer Caching Strategy
```javascript
// Cache structure used throughout the codebase
this._decorationCache = new Map(); // filePath -> { decoration, timestamp }
this._cacheTimeout = 30000; // 30 seconds default
this._maxCacheSize = 10000; // Maximum entries
```

**Cache Management Patterns:**
- Cache keys are always `uri.fsPath` (absolute file paths)
- Cache entries include timestamp for expiration checking
- `_manageCacheSize()` method prevents memory leaks
- Preview mode bypasses cache entirely for live updates

### Component Initialization Pattern
```javascript
// Standard initialization in extension.js
const provider = new FileDateDecorationProvider();
const disposable = vscode.window.registerFileDecorationProvider(provider);
context.subscriptions.push(disposable);
context.subscriptions.push(provider); // Important: dispose the provider too
```

## Key Development Patterns

### Configuration Watching
```javascript
// Pattern used in FileDateDecorationProvider
_setupConfigurationWatcher() {
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('explorerDates')) {
            // Update internal settings
            // Call this.refreshAll() if UI-affecting changes
        }
    });
}
```

### File System Watching
```javascript
// Pattern for responsive decoration updates
_setupFileWatcher() {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange((uri) => this.refreshDecoration(uri));
    watcher.onDidCreate((uri) => this.refreshDecoration(uri));
    watcher.onDidDelete((uri) => this.clearDecoration(uri));
}
```

### Error Handling Strategy
- Silent failures for inaccessible files (return `undefined`)
- Detailed logging for debugging with `this._logger.error()`
- Performance metrics tracking in `this._metrics` object
- Graceful degradation when Git integration fails

### Badge Priority System
The extension implements a `badgePriority` setting with these options:
- `'time'` (default): Show modification timestamp
- `'author'`: Show author initials from Git blame
- `'size'`: Show file size indicators

Pattern for badge generation:
```javascript
// In _formatDateBadge() method
if (badgePriority === 'author' && gitBlame?.authorInitials) {
    badge = gitBlame.authorInitials; // Max 2 chars
} else if (badgePriority === 'size') {
    badge = this._formatSizeBadge(stat.size);
} else {
    badge = this._formatDateBadge(mtime, format, timestampFormat);
}
```

## Theme Integration Patterns

### Selection-Aware Colors
The extension enhances visibility when files are selected in Explorer:
```javascript
// In themeIntegration.js
const isHighlighted = config.get('enhanceSelectionVisibility', true);
if (isHighlighted) {
    // Use list.highlightForeground, list.warningForeground for contrast
    decoration.color = new vscode.ThemeColor('list.highlightForeground');
}
```

### Color Coding System
```javascript
// Time-based color coding in _getColorByRecency()
if (diffHours < 1) return new vscode.ThemeColor('charts.green');
if (diffHours < 24) return new vscode.ThemeColor('charts.yellow');
return new vscode.ThemeColor('charts.red');
```

## Bundle Configuration

The extension uses esbuild for production bundling:

**Entry Points:**
- Source: `extension.js` (JavaScript entry point)
- Bundled: `./dist/extension.js` (referenced in package.json)

**Build Commands:**
```bash
npm run compile       # Development build via esbuild.js
npm run package-bundle # Production build, minified via esbuild.js --production
npm run watch         # Development watch mode via esbuild.js --watch
```

**esbuild Configuration:**
- Uses `esbuild.js` script with custom problem matcher plugin
- Bundles CommonJS modules for Node.js platform
- Excludes `vscode` module as external dependency
- **Important**: The `main` field in package.json points to `./dist/extension.js` for bundled distribution.

## Component Architecture

### Modular Service Pattern
```javascript
// Services are imported as singletons
const { getLogger } = require('./src/logger');
const { getLocalization } = require('./src/localization');

// Initialize in constructor
this._logger = getLogger();
this._l10n = getLocalization();
```

### Command Registration Pattern
```javascript
// Standard command registration in extension.js activate()
const commandName = vscode.commands.registerCommand('explorerDates.commandName', (args) => {
    // Command implementation
});
context.subscriptions.push(commandName);
```

### Accessibility Integration
- `AccessibilityManager` detects screen readers and adjusts tooltip behavior
- Rich tooltips disabled in high contrast mode to prevent visual conflicts
- Enhanced tooltips with emoji formatting when accessibility permits

### Onboarding System
- WebviewPanel-based setup wizard with live preview functionality
- Preview commands: `explorerDates.previewConfiguration` and `explorerDates.clearPreview`
- Simplified preset system (3 presets) to avoid overwhelming users
- Gentle notifications for existing users during updates

## Performance Considerations

### File System Operations
- Always use `fs.promises` for async file operations
- Implement cancellation token checking: `if (token?.isCancellationRequested) return;`
- Cache file stats to avoid repeated disk access
- Use file system watchers instead of polling

### Memory Management
- Implement cache size limits with automatic cleanup
- Clear caches on configuration changes that affect output
- Dispose of all event listeners and watchers in `dispose()` method

### Git Integration
- Git blame operations are async and may fail silently
- Cache Git blame results with file path as key
- Graceful fallback when Git is unavailable or file is not in repository

## Testing Patterns

### Debug Configuration
- Extension supports VS Code Insiders for testing
- Comprehensive logging available via "Explorer Dates: Open Logs" command
- Performance metrics accessible via "Explorer Dates: Show Performance Metrics"

### Preview System
- Live preview mode bypasses all caching for immediate feedback
- Preview settings stored separately from actual configuration
- Preview commands registered separately to avoid conflicts

## Common Extension Points

### Adding New Badge Types
1. Extend `badgePriority` enum in package.json configuration
2. Add case in `provideFileDecoration()` method badge generation
3. Implement helper method following `_formatSizeBadge()` pattern
4. Ensure 2-character limit compliance

### Configuration Changes
1. Add setting to package.json configuration section
2. Update configuration watcher in `_setupConfigurationWatcher()`
3. Add cache invalidation if setting affects display
4. Update onboarding presets if user-facing

### New Commands
1. Register in `extension.js` activate() function
2. Add to package.json contributes.commands section
3. Follow error handling pattern with try/catch and logging
4. Add to context.subscriptions for proper disposal

## File Structure Context

```
src/
├── fileDateDecorationProvider.js  # Core FileDecorationProvider implementation
├── logger.js                      # Centralized logging service
├── localization.js                # i18n support with fallbacks
├── onboarding.js                  # WebviewPanel-based setup wizard
├── themeIntegration.js           # VS Code theme color integration
├── accessibility.js              # Screen reader and contrast support
├── advancedCache.js              # Enhanced caching strategies
├── batchProcessor.js             # Batch operation handling
├── smartExclusion.js             # File exclusion logic
└── workspaceTemplates.js         # Workspace setup templates
```

## Dependencies and APIs

### Required VS Code APIs
- `vscode.window.registerFileDecorationProvider()` - Core decoration API
- `vscode.workspace.createFileSystemWatcher()` - File change detection
- `vscode.workspace.onDidChangeConfiguration()` - Settings monitoring
- `vscode.commands.registerCommand()` - Command registration
- `vscode.ThemeColor()` - Theme-aware colors

### Node.js APIs
- `fs.promises` for async file operations
- `path` for cross-platform path handling  
- `child_process.exec` for Git command execution
- Standard event patterns with EventEmitter
- CommonJS module system (`require`/`module.exports`)
- jsconfig.json for JavaScript IntelliSense with ES2022 target

This extension represents a modern VS Code extension with proper JavaScript patterns, comprehensive testing, and production-ready bundling using esbuild. Focus on maintaining the existing architectural patterns when making modifications or additions.