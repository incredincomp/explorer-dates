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
- **Accessibility**: High-contrast mode and screen reader compatible
- **Localization**: Support for 6 languages (EN, ES, FR, DE, JA, ZH) with auto-detection

### Performance & Customization
- **Intelligent Performance**: Smart caching, configurable exclusions, and file watching
- **Flexible Configuration**: 15+ settings to customize display, performance, and behavior
- **Debugging Tools**: Built-in logging, performance metrics, and troubleshooting commands

## How It Works

The extension uses VS Code's `FileDecorationProvider` API to add date information as subtle badges next to file names in the Explorer. No separate panels or views - the dates appear directly where you need them.

**Date Format Examples (practical 2‑char limit):**
- Recent files: `5m`, `2h`, `3d`, `1w`
- This year (month token examples, truncated to 2 chars): `Oc`, `Se`, `Ja`
- Author initials (when selected via `badgePriority: "author"`): `JD`, `AL`
- Compact sizes (when `badgePriority: "size"` and `showFileSize` enabled): `5K`, `2M`, `12`

**Note**: VS Code enforces a practical 2‑character limit for Explorer badges across platforms and fonts. Explorer Dates truncates visual badges to 2 characters to avoid rejection or layout issues. Full date, full size, and full Git info are always available in the decoration tooltip and in accessibility text.

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
   - **Toggle Date Decorations**
   - **Copy File Date**
   - **Show File Details**
   - **Show Performance Metrics**
   - **Open Logs**
   - **Refresh Date Decorations**

## Configuration

**Quick Setup**: Most users only need to configure the first 2-3 settings below. See [SETTINGS_GUIDE.md](./DOCS/SETTINGS_GUIDE.md) for detailed configuration examples.

### Essential Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `showDateDecorations` | `true`/`false` | `true` | Enable/disable all date decorations |
| `dateDecorationFormat` | `smart`, `relative-short`, `relative-long`, `absolute-short`, `absolute-long` | `smart` | How dates are displayed |
| `colorScheme` | `none`, `recency`, `file-type`, `subtle`, `vibrant`, `custom` | `none` | Color coding for decorations |

### Display Enhancements

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `showFileSize` | `true`/`false` | `false` | Show file size with dates |
| `fileSizeFormat` | `auto`, `bytes`, `kb`, `mb` | `auto` | File size display format |
| `fadeOldFiles` | `true`/`false` | `false` | Fade decorations for files older than threshold |
| `fadeThreshold` | Number | `30` | Days after which to fade decorations (1-365) |
| `showGitInfo` | `none`, `author`, `both` | `none` | Show Git commit author info with dates |
| `customColors` | Object | `{...}` | Custom colors when colorScheme is 'custom' |
| `highContrastMode` | `true`/`false` | `false` | Enhanced visibility for accessibility |

### Badge Priority (practical 2‑char limit)

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `badgePriority` | `time`, `author`, `size` | `time` | Choose which information should occupy the visual badge (limited to 2 characters). `time` shows the time-based badge (default). `author` shows author initials when available. `size` shows a compact size indicator when `showFileSize` is enabled.

Notes:
- VS Code enforces a practical 2-character limit for Explorer badges; the extension truncates visual badges to 2 characters to remain compatible with different platforms and icon fonts.
- Git author initials and compact size indicators are shown only when requested via `badgePriority`. Otherwise Git/size information is surfaced in the tooltip and the accessibility text.
- Compact size examples: `5K`, `2M`, or `12` (two-digit fallback).

## Debugging & Diagnostics

- **Developer Tools**: If you need to verify badge acceptance, open `Help → Toggle Developer Tools` (Extension Host console) while running the extension to view any rejection messages.
- **Built-in diagnostic command (optional)**: Add the diagnostic snippet from `DOCS/SETTINGS_GUIDE.md` to register a temporary command that emits test badges for several lengths. Run it and capture Extension Host console output if you see rejection warnings.

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## Release Notes

### Version 1.2.0 (Latest)

**Major Configuration & Feature Update**

- **Fixed Configuration Conflicts**
- **File Size Display**
- **Enhanced Color Schemes**
- **Context Menu Integration**
- **Keyboard Shortcuts**
- **Improved Settings**

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