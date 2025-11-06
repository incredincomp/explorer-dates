# Explorer Dates

**Explorer Dates** brings file modification timestamps directly into VS Code's Explorer sidebar. See when files were last modified with intuitive time badges like `5m`, `2h`, `3d` - no more cryptic single characters!

## Features

### Core Features
- **Date Decorations**: Shows last modified dates directly in the Explorer sidebar
- **Smart Formatting**: Multiple format options from concise relative time to full absolute dates
- **File Size Display**: Optional file size alongside dates (e.g., "5m • 1.2KB")
- **Color Schemes**: Choose from none, recency-based, subtle, or vibrant color coding
- **Context Menu Integration**: Right-click to copy file dates or show detailed file information

### User Experience
- **Keyboard Shortcuts**: Quick toggle decorations with Ctrl+Shift+D (Cmd+Shift+D on Mac)
- **Non-intrusive**: Subtle decorations that don't clutter your workspace
- **Hover Mode**: Optional setting to only show decorations on file hover
- **Accessibility**: High-contrast mode and screen reader compatible
- **Localization**: Support for 6 languages (EN, ES, FR, DE, JA, ZH) with auto-detection

### Performance & Customization
- **Intelligent Performance**: Smart caching, configurable exclusions, and file watching
- **Flexible Configuration**: 15+ settings to customize display, performance, and behavior
- **Debugging Tools**: Built-in logging, performance metrics, and troubleshooting commands

## How It Works

The extension uses VS Code's `FileDecorationProvider` API to add date information as subtle badges next to file names in the Explorer. No separate panels or views - the dates appear directly where you need them.

**Date Format Examples:**
- Recent files: `now`, `5m`, `2h`, `3d`  
- This year: `Oct 5`, `Sep 12`, `Jan 3`
- Older files: `Dec 23`, `Mar 22`

## Getting Started

### Quick Start
1. **Install** the extension from VS Code Marketplace
2. **Restart** VS Code (decorations appear automatically)
3. **Customize** via Settings → search "explorer dates"
4. **Try shortcuts**: Ctrl+Shift+D to toggle, right-click files for options

### First-Time Setup Recommendations
- **Large projects**: Enable performance exclusions for `node_modules`, `dist`, etc.
- **Visual preference**: Try `colorScheme: "recency"` and `showFileSize: true`
- **Minimal look**: Use `dateDecorationFormat: "smart"` (default)
- **Accessibility**: Enable `highContrastMode` if needed

### Usage

1. **View decorations**: Date badges appear automatically in Explorer
2. **Get details**: Hover over decorations for full timestamps and Git info
3. **Quick actions**: Right-click files for "Copy File Date" and "Show File Details"
4. **Commands**: Use Command Palette (Ctrl+Shift+P) for:
   - **Toggle Date Decorations**: Quick on/off switch
   - **Copy File Date**: Copy modification date to clipboard
   - **Show File Details**: Comprehensive file information
   - **Show Performance Metrics**: View cache statistics
   - **Open Logs**: Access debug information
   - **Refresh Date Decorations**: Manual refresh

## Configuration

**Quick Setup**: Most users only need to configure the first 2-3 settings below. See [SETTINGS_GUIDE.md](./SETTINGS_GUIDE.md) for detailed configuration examples.

### Essential Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `showDateDecorations` | `true`/`false` | `true` | Enable/disable all date decorations |
| `dateDecorationFormat` | `smart`, `relative-short`, `relative-long`, `absolute-short`, `absolute-long` | `smart` | How dates are displayed |
| `colorScheme` | `none`, `recency`, `file-type`, `subtle`, `vibrant`, `custom` | `none` | Color coding for decorations |

### Display Enhancements

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `showFileSize` | `true`/`false` | `false` | Show file size with dates (e.g., "5m|~1K") |
| `fileSizeFormat` | `auto`, `bytes`, `kb`, `mb` | `auto` | File size display format |
| `fadeOldFiles` | `true`/`false` | `false` | Fade decorations for files older than threshold |
| `fadeThreshold` | Number | `30` | Days after which to fade decorations (1-365) |
| `showGitInfo` | `none`, `author`, `both` | `none` | Show Git commit author info with dates |
| `customColors` | Object | `{...}` | Custom colors when colorScheme is 'custom' |
| `highContrastMode` | `true`/`false` | `false` | Enhanced visibility for accessibility |

### Context & Controls

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `enableContextMenu` | `true`/`false` | `true` | Add options to Explorer right-click menu |
| `locale` | `auto`, `en`, `es`, `fr`, `de`, `ja`, `zh` | `auto` | Language for date formatting |

### Performance Tuning

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `excludedFolders` | Array | `["node_modules", ".git", "dist", "build", "out", ".vscode-test"]` | Folders to skip for better performance |
| `excludedPatterns` | Array | `["**/*.tmp", "**/*.log", "**/.git/**", "**/node_modules/**"]` | File patterns to exclude |
| `cacheTimeout` | Number | `30000` | Cache duration in milliseconds (5000-300000) |
| `maxCacheSize` | Number | `10000` | Maximum cached decorations (100-50000) |

### Debugging

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `enableLogging` | `true`/`false` | `false` | Detailed logging for troubleshooting |

### Keyboard Shortcuts

- **Ctrl+Shift+D** (Cmd+Shift+D on Mac): Toggle date decorations on/off

### Commands (Ctrl/Cmd+Shift+P)

- **Explorer Dates: Toggle Date Decorations**: Quick on/off switch
- **Explorer Dates: Copy File Date**: Copy selected file's date
- **Explorer Dates: Show File Details**: Display comprehensive file information
- **Explorer Dates: Toggle Fade Old Files**: Enable/disable fading for old files
- **Explorer Dates: Refresh Date Decorations**: Manually refresh all decorations
- **Explorer Dates: Show Performance Metrics**: View cache statistics
- **Explorer Dates: Open Logs**: Access debug information

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

This extension addresses popular requests from the VS Code community:
- [GitHub Issue #164033](https://github.com/microsoft/vscode/issues/164033) - Show file modified date in Explorer
- [GitHub Issue #124115](https://github.com/microsoft/vscode/issues/124115) - Display file timestamps
- [Stack Overflow](https://stackoverflow.com/questions/63381524/show-last-date-modified-in-vs-code) - Show last date modified in VS Code

## Release Notes

### Version 1.2.0 (Latest)

**Major Configuration & Feature Update**

- **Fixed Configuration Conflicts**: Consolidated overlapping settings into clear, comprehensive options
- **File Size Display**: Show file sizes alongside dates ("5m • 1.2KB")
- **Enhanced Color Schemes**: Four color options from none to vibrant
- **Context Menu Integration**: Right-click "Copy File Date" and "Show File Details"
- **Keyboard Shortcuts**: Ctrl+Shift+D to quickly toggle decorations
- **Improved Settings**: Better organization, clearer descriptions, smarter defaults

### Version 1.1.0

**Performance & Localization Update**

- Performance Optimization: Configurable exclusions, intelligent caching, and performance metrics
- Accessibility: High-contrast mode and enhanced screen reader support
- Localization: Support for 6 languages with auto-detection
- Debugging Tools: Built-in logging and performance metrics viewing

### Version 1.0.0

**Initial Release**

- Native Integration: Built using VS Code's FileDecorationProvider API
- Intuitive Time Badges: Clear formats like `5m`, `2h`, `3d`
- Smart Performance: Intelligent caching and file system watching
- Lightweight: Elegant native decorations without UI overlays

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## License

[MIT](./LICENSE)