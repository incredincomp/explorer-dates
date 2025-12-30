# Explorer Dates

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/incredincomp.explorer-dates.svg?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/incredincomp.explorer-dates.svg?color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/incredincomp.explorer-dates?cacheSeconds=3600)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates&ssr=false#review-details)
[![VS Code for Web](https://img.shields.io/badge/vscode.dev-supported-0078d4)](https://vscode.dev)

**Explorer Dates** brings file modification timestamps directly into VS Code's Explorer sidebar. See when files were last modified with intuitive time badges like `5m`, `2h`, `3d`.

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

### Productivity & Collaboration
- **Workspace Templates**: Save and reapply full Explorer Dates configurations, or export/share JSON templates for your team.
- **Reporting & Analytics**: Generate modification reports (JSON/CSV/HTML/Markdown) with activity retention controls and optional time-tracking integrations.
- **Extensibility**: Opt-in public API plus decoration provider plugin hooks for other extensions. Toggle `enableExtensionApi`/`allowExternalPlugins` if you need a locked-down environment.
- **VS Code for Web Ready**: Dedicated browser bundle keeps badges, templates, and reporting working inside `vscode.dev`, `github.dev`, and other remote/browser IDEs.

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
- **Large projects / Low resource systems**: Enable `performanceMode: true` to disable all features except basic date/time tooltips
- **Large projects (without performance mode)**: Enable performance exclusions for `node_modules`, `dist`, etc.
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

## VS Code for Web Support

- Launch [vscode.dev](https://vscode.dev) or [github.dev](https://github.dev) and open your repo (File → Open Remote Repository, or press `.` in GitHub).
- Install Explorer Dates from the Extensions sidebar—no desktop dependencies required.
- Browser-specific behaviors:
  - Templates export/import via download dialogs because the sandbox cannot write to disk.
  - Persistent cache and onboarding data use VS Code’s synced `globalState`, so settings roam with your Microsoft/GitHub account.
  - Git-only commands automatically hide when the web host cannot expose repository metadata.
- Remote environments (Codespaces, Dev Containers, Remote Tunnels) leverage the same web bundle, so Explorer Dates stays lightweight even when running over the network.

## Configuration

**Quick Setup**: Most users only need to configure the first 2-3 settings below. See [SETTINGS_GUIDE.md](./DOCS/SETTINGS_GUIDE.md) for detailed configuration examples.

### Performance Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `performanceMode` | `true`/`false` | `false` | **Minimal performance mode**: disables all features except basic date/time tooltips on files. Disables Git info, auto-updates, status bar, progressive loading, and advanced caching. Recommended for large projects or low-resource systems. |

**When to use Performance Mode:**
- Large projects with thousands of files
- Systems with limited CPU or memory
- When you only need basic date/time information on hover
- When experiencing high resource usage (laptop fan noise, CPU spikes)

**What gets disabled in Performance Mode:**
- Git blame operations (no author information)
- File system watching for auto-updates (manual refresh still available)
- Status bar integration
- Progressive loading and background processing
- Advanced caching layers
- Color schemes and visual enhancements
- File size display
- Reduced logging overhead

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

## Testing & Verification

- Run `npm test` for the full suite (lint, configuration wiring, feature-gate scenarios, workspace/reporting flows, and both bundle verifiers).
- `npm run test:config` ensures every contributed setting is referenced in code/docs before publishing.
- `npm run test:config-scenarios` activates the extension across 90+ mocked configuration permutations to flush out settings regressions.
- `npm run test:feature-gates` activates the extension in a mocked host and verifies the workspace templates, reporting, and API/plug-in toggles behave as expected.
- `npm run test:flows` exercises workspace templates, reporting, and the web bundle using lightweight VS Code shims.
- `npm run test:bundle` and `npm run test:verify-bundle` provide quick sanity checks for the packaged bundle/VSIX before submitting to the Marketplace.

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## Release Notes

### Version 1.2.2 (Latest)

**Workspace Exclusion Reliability**

- Automatic profile cleanup deduplicates every workspace exclusion list at startup, keeping `.vscode/settings.json` lean even after months of smart suggestions.
- Existing installs are sanitized before new suggestions run, so previously duplicated folders disappear without manual cleanup.

**Smarter Suggestions & Prompts**

- Smart Exclusion now only writes newly detected folders, preventing the repeated "add the same exclusions" prompts on every reload.
- When Explorer Dates auto-excludes something, you get a single Keep/Review/Revert prompt so you stay in control without cluttering settings.

### Version 1.2.0

**Configuration Validation & Progressive Loading**

- **VS Code for Web Compatibility**: Added a dedicated browser bundle, filesystem adapter, and download-based exports so Explorer Dates runs seamlessly on `vscode.dev`, `github.dev`, and other web-hosted IDEs.
- **Feature Gating**: `enableWorkspaceTemplates`, `enableReporting`, `enableExtensionApi`, and `allowExternalPlugins` now actively control their respective managers and commands.
- **Reporting Enhancements**: Respect custom report formats, activity retention windows, and time-tracking integration metadata while keeping historical data trimmed.
- **Progressive Loading Warm-up**: When enabled, the batch processor now pre-warms Explorer decorations in the background for large workspaces.
- **Template Accuracy**: Built-in workspace templates reference real Explorer Dates settings so exports/imports remain reliable.
- **Config Verification**: Added `npm run test:config` to ensure every contributed setting is referenced before publishing.

### Version 1.1.0

**Major Configuration & Feature Update**

- **Fixed Configuration Conflicts**
- **File Size Display**
- **Enhanced Color Schemes**
- **Context Menu Integration**
- **Keyboard Shortcuts**
- **Improved Settings**

### Version 1.0.1

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
