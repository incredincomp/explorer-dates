# Explorer Dates

**Explorer Dates** brings file modification timestamps directly into VS Code's Explorer sidebar. See when files were last modified with intuitive time badges like `5m`, `2h`, `3d` - no more cryptic single characters!

## Features

- **📅 Date Decorations**: Shows last modified dates directly in the Explorer sidebar
- **🧠 Smart Formatting**: Recent files show relative time (e.g., "5min", "2hr", "yesterday"), older files show absolute dates
- **🎯 Non-intrusive**: Subtle decorations that don't clutter your workspace
- **⚡ Performance**: Intelligent caching and file watching for smooth performance
- **🛠️ Configurable**: Toggle decorations on/off, choose formatting style
- **🌍 Localization**: Support for multiple languages (EN, ES, FR, DE, JA, ZH)
- **♿ Accessibility**: High-contrast theme support and screen reader compatible
- **🐛 Debugging**: Built-in logging and performance metrics for troubleshooting
- **Date Decorations**: Shows last modified dates directly in the Explorer sidebar
- **Smart Formatting**: Recent files show relative time (e.g., "5min", "2hr", "yesterday"), older files show absolute dates
- **Non-intrusive**: Subtle decorations that don't clutter your workspace
- **Performance**: Intelligent caching and file watching for smooth performance
- **Configurable**: Toggle decorations on/off, choose formatting style, enable color-coding
- **Customizable Time Format**: Choose between short (`5m`) or long (`5 mins`) format
- **Color-Coding**: Optional color-coding based on file recency (green: <1 hour, yellow: <1 day, red: >1 day)
- **Flexible Timestamp Display**: Toggle between relative (`5m ago`) and absolute (`October 12, 2025`) timestamps

## How It Works

The extension uses VS Code's `FileDecorationProvider` API to add date information as subtle badges next to file names in the Explorer. No separate panels or views - the dates appear directly where you need them.

**Date Format Examples:**
- Recent files: `now`, `5min`, `2hr`, `yesterday`  
- This year: `Oct 5`, `Sep 12`, `Jan 3`
- Older files: `Dec '23`, `Mar '22`

## Usage

1. Install the extension
2. Date decorations will automatically appear in the Explorer
3. Hover over any decoration to see the full timestamp
4. Use the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) for these commands:
   - **Refresh Date Decorations**: Manually refresh all decorations
   - **Show Performance Metrics**: View caching and performance statistics
   - **Open Logs**: View detailed logs for debugging

## Configuration

3. Hover over any decoration to see detailed information:
   - Last modified date with exact timestamp and timezone
   - File creation date with exact timestamp and timezone
   - Git blame information (author name, email, and date) if the file is in a Git repository
4. Use `Ctrl+Shift+P` → "Refresh Date Decorations" to manually refresh

## Configuration

The extension provides several configuration options to customize the date decorations:

### Basic Settings

- `explorerDates.showDateDecorations`: Enable/disable date decorations (default: `true`)
- `explorerDates.dateDecorationFormat`: Choose format style - `smart`, `relative`, or `absolute` (default: `smart`)

### Performance Settings

- `explorerDates.excludedFolders`: Folders to exclude from decorations (default: `["node_modules", ".git", "dist", "build", "out", ".vscode-test"]`)
- `explorerDates.excludedPatterns`: File patterns (glob) to exclude (default: `["**/*.tmp", "**/*.log", "**/.git/**", "**/node_modules/**"]`)
- `explorerDates.cacheTimeout`: Cache timeout in milliseconds (default: `30000`, range: 5000-300000)
- `explorerDates.maxCacheSize`: Maximum number of cached file decorations (default: `10000`, range: 100-50000)

### Localization & Accessibility

- `explorerDates.locale`: Language for date formatting - `auto`, `en`, `es`, `fr`, `de`, `ja`, `zh` (default: `auto`)
- `explorerDates.highContrastMode`: Enable high-contrast styling for better visibility (default: `false`)

### Debugging

- `explorerDates.enableLogging`: Enable detailed logging for debugging (default: `false`)
### Time Badge Format

- `explorerDates.timeBadgeFormat`: Choose between short or long format (default: `short`)
  - **short**: Compact format like `5m`, `2h`, `3d`, `1w`
  - **long**: Descriptive format like `5 mins`, `2 hrs`, `3 days`, `1 week`

### Timestamp Format

- `explorerDates.timestampFormat`: Toggle between relative and absolute timestamps (default: `relative`)
  - **relative**: Shows time elapsed like `5m`, `2h`, `yesterday`
  - **absolute**: Shows actual date like `Oct 12`, `Mar 23, 2024`

### Color-Coding

- `explorerDates.enableColorCoding`: Enable color-coding based on file recency (default: `false`)
  - **Green**: Files modified within the last hour
  - **Yellow**: Files modified within the last day
  - **Red**: Files modified more than a day ago

**Example configuration in settings.json:**

```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.timeBadgeFormat": "long",
  "explorerDates.timestampFormat": "relative",
  "explorerDates.enableColorCoding": true
}
```

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

This extension addresses popular requests from the VS Code community:
- [GitHub Issue #164033](https://github.com/microsoft/vscode/issues/164033) - Show file modified date in Explorer
- [GitHub Issue #124115](https://github.com/microsoft/vscode/issues/124115) - Display file timestamps
- [Stack Overflow](https://stackoverflow.com/questions/63381524/show-last-date-modified-in-vs-code) - Show last date modified in VS Code

## Release Notes

### 1.1.0

**🚀 Major Feature Update!**

- **Performance Optimization**: Configurable exclusions, intelligent caching, and performance metrics
- **Accessibility**: High-contrast mode and enhanced screen reader support
- **Localization**: Support for 6 languages with auto-detection
- **Debugging Tools**: Built-in logging and performance metrics viewing

See [CHANGELOG.md](./CHANGELOG.md) for complete details.
- **Customizable Time Badge Format**: Choose between short (`5m`) or long (`5 mins`) format
- **Color-Coding Based on Recency**: Optional color-coding with green (<1 hour), yellow (<1 day), and red (>1 day)
- **Toggle Timestamp Format**: Switch between relative (`5m ago`) and absolute (`October 12, 2025`) timestamps
- **Enhanced Configuration**: New settings for fine-tuned customization

### 1.0.0

- **Native Integration**: Built from the ground up using VS Code's FileDecorationProvider API
- **Intuitive Time Badges**: Clear format like `5m`, `2h`, `3d`, `1w` - no cryptic single characters!
- **Smart Performance**: Intelligent caching and file system watching
- **Lightweight**: No complex UI overlays, just elegant native decorations

See [CHANGELOG.md](./CHANGELOG.md) for details.

## License

[MIT](./LICENSE)