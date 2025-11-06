# Architecture Documentation

## Overview

Explorer Dates is a VS Code extension that displays file modification dates as decorations in the Explorer sidebar. This document outlines the architecture and key components of version 1.1.0.

## Core Components

### 1. FileDateDecorationProvider (`src/fileDateDecorationProvider.js`)

The main provider class that implements VS Code's `FileDecorationProvider` API.

**Key Responsibilities:**
- Provides date decorations for files in the Explorer
- Manages caching to optimize performance
- Handles file system watching for automatic updates
- Applies exclusion rules to avoid decorating unwanted files
- Enforces VS Code's 2-character badge limit with automatic truncation

**Performance Features:**
- Intelligent cache with configurable timeout and size limits
- Automatic cache cleanup when exceeding size limits
- Performance metrics tracking (cache hits/misses, total decorations, errors)
- Batch processing support through VS Code's decoration API

**Configuration Integration:**
- Reads user settings for exclusion patterns
- Supports high-contrast mode
- Respects locale settings for date formatting

### 2. Logger (`src/logger.js`)

Centralized logging system for debugging and error tracking.

**Features:**
- Multiple log levels: debug, info, warn, error
- Dedicated output channel in VS Code
- Configurable logging (enabled/disabled via settings)
- Timestamps and structured logging
- Singleton pattern for consistent logging across the extension

**Usage:**
```javascript
const { getLogger } = require('./src/logger');
const logger = getLogger();
logger.debug('Debug message', { additional: 'data' });
logger.error('Error occurred', error, { context: 'info' });
```

### 3. Localization Manager (`src/localization.js`)

Handles internationalization and locale-specific formatting.

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

**Features:**
- Auto-detection of VS Code's display language
- Fallback to English for unsupported languages
- Locale-specific date formatting
- Translated time badges and UI messages

**Usage:**
```javascript
const { getLocalization } = require('./src/localization');
const l10n = getLocalization();
const message = l10n.getString('lastModified');
const date = l10n.formatDate(new Date(), { month: 'short', day: 'numeric' });
```

### 4. Extension Entry Point (`extension.js`)

Manages the extension lifecycle and command registration.

**Registered Commands:**
- `explorerDates.refreshDateDecorations`: Manually refresh all decorations
- `explorerDates.showMetrics`: Display performance metrics
- `explorerDates.openLogs`: Open the log output channel

**Lifecycle:**
- `activate()`: Initialize components, register providers and commands
- `deactivate()`: Clean up resources, dispose of providers

## Configuration System

All settings are prefixed with `explorerDates.` and defined in `package.json`:

### Performance Settings
- `excludedFolders`: Array of folder names to skip
- `excludedPatterns`: Glob patterns for file exclusion
- `cacheTimeout`: Cache entry lifetime (5-300 seconds)
- `maxCacheSize`: Maximum cached decorations (100-50000)

### Appearance Settings
- `showDateDecorations`: Master enable/disable switch
- `dateDecorationFormat`: smart/relative/absolute
- `highContrastMode`: Enhanced visibility for accessibility

### Localization
- `locale`: Language selection (auto/en/es/fr/de/ja/zh)

### Debugging
- `enableLogging`: Enable detailed logging

## Performance Considerations

### Caching Strategy
1. Cache lookup on every decoration request
2. Return cached value if within timeout period
3. Fetch fresh data from file system if cache miss or expired
4. Store in cache with timestamp
5. Periodic cleanup when cache exceeds size limit

### File Exclusions
Two-level exclusion system:
1. **Folder-based**: Skip entire directories (node_modules, .git, etc.)
2. **Pattern-based**: Glob patterns for fine-grained control

### Optimization Techniques
- Early return for excluded files (minimal overhead)
- Cancellation token support for long-running operations
- Only decorate files, not directories
- Batch refresh on configuration changes

## Accessibility Features

### High-Contrast Mode
- Optional color highlighting for better visibility
- Uses theme-aware colors (`editorWarning.foreground`)

### Badge Limitations
- VS Code enforces a 2-character maximum for file decoration badges
- Longer formats are automatically truncated (e.g., "Oct 12" becomes "Oc")
- Full date information is preserved in tooltips and accessible via hover

### Screen Reader Support
- Descriptive tooltip text with full timestamp
- Localized date descriptions
- Semantic HTML in tooltips (via VS Code API)

### Keyboard Navigation
- Full keyboard accessibility through VS Code's native Explorer
- No custom UI that would require additional keyboard handling

## Error Handling

### Graceful Degradation
- Silent failures for inaccessible files
- Fallback to English for locale errors
- Default values for missing configurations

### User-Friendly Messages
- Localized error messages
- Detailed logging for developers
- Error metrics tracking

### Recovery Mechanisms
- Automatic retry on configuration change
- Manual refresh command
- Cache invalidation options

## Testing & Debugging

### Debug Mode
Enable detailed logging via settings:
```json
{
  "explorerDates.enableLogging": true
}
```

### Performance Metrics
View metrics via Command Palette:
- Total decorations provided
- Cache hit rate
- Cache size
- Error count

### Log Analysis
Access logs via Command Palette → "Open Logs"
- Timestamped entries
- Structured data logging
- Error stack traces

## Future Enhancements

Potential areas for improvement:
1. Additional locales
2. Custom date format strings
3. Color customization per time range
4. Integration with Git (show commit dates)
5. Workspace-specific exclusion rules

## Dependencies

### Runtime
- `vscode`: VS Code Extension API (^1.102.0)
- `fs/promises`: Node.js file system (built-in)
- `path`: Node.js path utilities (built-in)

### Development
- `eslint`: Code linting (^9.37.0)
- `globals`: ESLint globals support
- `@vscode/test-*`: Testing infrastructure

## File Structure

```
explorer-dates/
├── src/
│   ├── fileDateDecorationProvider.js  # Main provider
│   ├── logger.js                       # Logging system
│   └── localization.js                 # i18n support
├── extension.js                        # Entry point
├── package.json                        # Extension manifest
├── eslint.config.js                    # Linting config
├── README.md                           # User documentation
├── CHANGELOG.md                        # Version history
└── ARCHITECTURE.md                     # This file
```

## Contributing

When adding new features:
1. Use the logger for debugging output
2. Add localization strings to all supported languages
3. Update configuration in package.json
4. Document changes in CHANGELOG.md
5. Add performance metrics if applicable
6. Run eslint before committing
7. Test with large projects to verify performance

## Version History

- **1.1.0**: Performance, accessibility, localization, and debugging features
- **1.0.2**: Changelog cleanup
- **1.0.1**: ESLint update
- **1.0.0**: Initial release with basic decoration support
