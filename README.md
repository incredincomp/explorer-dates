# Explorer Dates

**Explorer Dates** brings file modification timestamps directly into VS Code's Explorer sidebar. See when files were last modified with intuitive time badges like `5m`, `2h`, `3d` - no more cryptic single characters!

## Features

- **📅 Date Decorations**: Shows last modified dates directly in the Explorer sidebar
- **🧠 Smart Formatting**: Recent files show relative time (e.g., "5min", "2hr", "yesterday"), older files show absolute dates
- **🎯 Non-intrusive**: Subtle decorations that don't clutter your workspace
- **⚡ Performance**: Intelligent caching and file watching for smooth performance
- **🛠️ Configurable**: Toggle decorations on/off, choose formatting style
- **📅 Creation Dates**: View both file creation and modification dates
- **👤 Git Blame Integration**: See who last modified the file (when in a Git repository)
- **ℹ️ Detailed Tooltips**: Hover for comprehensive information including exact timestamps with timezone

## How It Works

The extension uses VS Code's `FileDecorationProvider` API to add date information as subtle badges next to file names in the Explorer. No separate panels or views - the dates appear directly where you need them.

**Date Format Examples:**
- Recent files: `now`, `5min`, `2hr`, `yesterday`  
- This year: `Oct 5`, `Sep 12`, `Jan 3`
- Older files: `Dec '23`, `Mar '22`

## Usage

1. Install the extension
2. Date decorations will automatically appear in the Explorer
3. Hover over any decoration to see detailed information:
   - Last modified date with exact timestamp and timezone
   - File creation date with exact timestamp and timezone
   - Git blame information (author name, email, and date) if the file is in a Git repository
4. Use `Ctrl+Shift+P` → "Refresh Date Decorations" to manually refresh

## Configuration

- `explorerDates.showDateDecorations`: Enable/disable date decorations (default: `true`)
- `explorerDates.dateDecorationFormat`: Choose format style - `smart`, `relative`, or `absolute` (default: `smart`)

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

This extension addresses popular requests from the VS Code community:
- [GitHub Issue #164033](https://github.com/microsoft/vscode/issues/164033) - Show file modified date in Explorer
- [GitHub Issue #124115](https://github.com/microsoft/vscode/issues/124115) - Display file timestamps
- [Stack Overflow](https://stackoverflow.com/questions/63381524/show-last-date-modified-in-vs-code) - Show last date modified in VS Code

## Release Notes

### 1.0.0

- **Native Integration**: Built from the ground up using VS Code's FileDecorationProvider API
- **Intuitive Time Badges**: Clear format like `5m`, `2h`, `3d`, `1w` - no cryptic single characters!
- **Smart Performance**: Intelligent caching and file system watching
- **Lightweight**: No complex UI overlays, just elegant native decorations

See [CHANGELOG.md](./CHANGELOG.md) for details.

## License

[MIT](./LICENSE)