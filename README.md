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
- **Automatic Refresh**: Configurable periodic badge refresh keeps timestamps accurate during long editor sessions
- **Context Menu Integration**: Right-click to copy file dates or show detailed file information

### User Experience
- **Keyboard Shortcuts**: Quick toggle decorations with Ctrl+Shift+D (Cmd+Shift+D on Mac)
- **Cache Diagnostics**: Inspect cache health instantly with `Explorer Dates: Debug Cache Performance` (`Ctrl+Shift+M` / `Cmd+Shift+M`)
- **Non-intrusive**: Subtle decorations that don't clutter your workspace
- **Accessibility**: High-contrast mode and screen reader compatible
- **Localization**: Support for 6 languages (EN, ES, FR, DE, JA, ZH) with auto-detection

### Performance & Customization
- **Intelligent Performance**: Smart caching, configurable exclusions, and file watching
- **Incremental Indexing**: Background indexer with worker-backed digestion keeps metadata fresh without blocking the UI
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
   - `Explorer Dates: Toggle Date Decorations`
   - `Explorer Dates: Copy File Date`
   - `Explorer Dates: Show File Details`
   - `Explorer Dates: Show Performance Metrics`
   - `Explorer Dates: Open Logs`
   - `Explorer Dates: Refresh Date Decorations`
   - `Explorer Dates: Organize Settings`
   - Full list in [DOCS/COMMANDS.md](./DOCS/COMMANDS.md)

### Settings Housekeeping
- Explorer Dates now auto-detects misplaced workspace settings or unsorted `explorer-dates-*.json` files during activation/migrations and quietly reorganizes them when needed.
- `Explorer Dates: Organize Settings` remains available for manual runs (or when automation is disabled).
- Use `npm run format:settings` (or `node scripts/sort-settings.js path/to/file.json`) to alphabetize any VS Code or Explorer Dates JSON config on demand.

## VS Code for Web Support

- Launch [vscode.dev](https://vscode.dev) or [github.dev](https://github.dev) and open your repo (File → Open Remote Repository, or press `.` in GitHub).
- Install Explorer Dates from the Extensions sidebar—no desktop dependencies required.
- Browser-specific behaviors:
  - Templates export/import via download dialogs because the sandbox cannot write to disk.
  - Persistent cache and onboarding data use VS Code’s synced `globalState`, so settings roam with your Microsoft/GitHub account.
  - Git-only commands automatically hide when the web host cannot expose repository metadata.
- Remote environments (Codespaces, Dev Containers, Remote Tunnels) leverage the same web bundle, so Explorer Dates stays lightweight even when running over the network.

## v1.3.0 Architecture & Bundle Size

### Module Federation System

Explorer Dates v1.3.0 uses a modern module federation architecture that dramatically reduces the initial bundle size while providing all the features you need:

**Bundle Structure:**
- **Core Bundle**: ~99KB (essential features: file decorations, basic commands, performance monitoring)
- **Optional Chunks**: ~281KB total (advanced features loaded on demand)
  - Onboarding System: ~34KB (welcome wizard, feature tour)
  - Export & Reporting: ~17KB (file modification reports, analytics)
  - Workspace Templates: ~14KB (configuration templates, team profiles)
  - Extension API: ~15KB (third-party extension integration)
  - Advanced Cache: ~5KB (enhanced caching algorithms)
  - Analysis Commands: ~8KB (diagnostic and debugging tools)
  - Workspace Intelligence: ~12KB (smart exclusions, large workspace detection)
  - Incremental Workers: ~19KB (background file processing)

**Feature Gating Benefits:**
- **Disable unused features**: Save 36% bundle size by disabling onboarding + reporting
- **Team standardization**: Consistent configurations across development teams
- **Performance optimization**: Only load features you actually use
- **Progressive enhancement**: Features activate based on workspace characteristics

**Configuration:**
To disable features and reduce bundle size, add these to your settings:
```json
{
  "explorerDates.enableOnboardingSystem": false,     // Save ~34KB
  "explorerDates.enableExportReporting": false,      // Save ~17KB
  "explorerDates.enableWorkspaceTemplates": false,   // Save ~14KB
  "explorerDates.enableExtensionApi": false,         // Save ~15KB
  "explorerDates.enableIncrementalWorkers": false    // Save ~19KB
}
```

### Team Configuration Management

v1.3.0 introduces comprehensive team configuration support:

- **Team Profiles**: Share standardized configurations across your team
- **Conflict Resolution**: Intelligent merging when team configs conflict with user preferences
- **Export/Import**: JSON-based configuration sharing with validation
- **Settings Migration**: Automatic migration from legacy settings with conflict detection

See [Upgrade Guide](./DOCS/UPGRADE_GUIDE.md) for detailed setup instructions.

## Configuration

**Quick Setup**: Most users only need to configure the first 2-3 settings below. See [SETTINGS_GUIDE.md](./DOCS/SETTINGS_GUIDE.md) for detailed configuration examples.

### Essential Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `showDateDecorations` | `true`/`false` | `true` | Enable/disable all date decorations |
| `dateDecorationFormat` | `smart`, `relative-short`, `relative-long`, `absolute-short`, `absolute-long` | `smart` | How dates are displayed |
| `colorScheme` | `none`, `recency`, `file-type`, `subtle`, `vibrant`, `custom` | `none` | Color coding for decorations |

### Feature Control Settings (v1.3.0)

| Setting | Options | Default | Bundle Impact | Description |
|---------|---------|---------|--------------|-------------|
| `enableOnboardingSystem` | `true`/`false` | `true` | ~34KB | Welcome wizard and feature tour |
| `enableExportReporting` | `true`/`false` | `true` | ~17KB | File modification reports and analytics |
| `enableWorkspaceTemplates` | `true`/`false` | `true` | ~14KB | Configuration templates and team profiles |
| `enableExtensionApi` | `true`/`false` | `true` | ~15KB | API for third-party extension integration |
| `enableAdvancedCache` | `true`/`false` | `true` | ~5KB | Enhanced caching algorithms |
| `enableAnalysisCommands` | `true`/`false` | `true` | ~8KB | Diagnostic and debugging commands |
| `enableWorkspaceIntelligence` | `true`/`false` | `true` | ~12KB | Smart exclusions and workspace analysis |
| `enableIncrementalWorkers` | `true`/`false` | `false` | ~19KB | Background file processing workers |

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

### Custom Colors Configuration

To use custom colors for file decorations:

1. **Set the color scheme**:
   ```json
   "explorerDates.colorScheme": "custom"
   ```

2. **Apply your custom colors** using one of these methods:

   **Method 1: Use the command** (Recommended)
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run `Explorer Dates: Apply Custom Colors`
   - Choose "Copy to Clipboard" or "Open Settings"

   **Method 2: Manual configuration**
   - Add to your `settings.json`:
   ```json
   "workbench.colorCustomizations": {
     "explorerDates.customColor.veryRecent": "#FF6095",
     "explorerDates.customColor.recent": "#E72969",
     "explorerDates.customColor.old": "#CCCCCC"
   }
   ```

3. **Color categories**:
   - `veryRecent`: Files modified within 1 hour
   - `recent`: Files modified within 1 day
   - `old`: Files modified more than 1 day ago

**Note**: The `explorerDates.customColors` setting in the extension configuration is deprecated. Use `workbench.colorCustomizations` instead for proper theme integration and color support.

### Performance & Memory Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `performanceMode` | `true`/`false` | `false` | **Minimal performance mode**: disables all features except basic date/time tooltips on files. Disables Git info, auto-updates, status bar, progressive loading, and advanced caching. Recommended for large projects or low-resource systems. |
| `featureLevel` | `auto`, `full`, `enhanced`, `standard`, `minimal` | `auto` | Progressive tuning that keeps Explorer Dates fast without forcing performance mode. `auto` adapts based on workspace size; `full` keeps every feature enabled; `enhanced` trims background tooltips/Git hits; `standard` prefers lightweight tooltips and trims file-size badges; `minimal` keeps only essentials for massive repos. |

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

### Memory Management

Explorer Dates is optimized for low memory usage, using smart caching and pooling to keep heap growth minimal. For most users, no configuration is needed.

**Hierarchical Cache Buckets**
- The in-memory decoration cache now groups entries by parent folder, so a single trim removes entire cold directories instead of churning file-by-file. This keeps lookups O(1) while preventing 150K-file monorepos from fragmenting the cache.

**Viewport-Aware Decorations**
- Files you are actively viewing get the full experience (Git badges, colors, rich tooltips). Files outside the current viewport fall back to lightweight badges/tooltips so Explorer stays responsive even when VS Code asks for thousands of decorations at once.

**Progressive Feature Levels**
- The new `featureLevel` setting (default `auto`) chooses between Full → Enhanced → Standard → Minimal profiles based on workspace size. Each profile selectively disables expensive features (e.g., Git blame, rich tooltips, color math) for background files while keeping everything enabled for the files you are actually working on.

**Background Indexer & Web Workers**
- A cancellable incremental indexer now walks each workspace folder in the background and stores stat metadata. VS Code can request thousands of decorations without hammering the file system because most background requests reuse those cached stats.
- On VS Code desktop the indexer runs inside a dedicated `worker_threads` helper; on the web build the same logic is executed inside a lightweight WebWorker. Both versions stream delta updates from file watchers so the index stays in sync with your edits within a few hundred milliseconds.
- Workspace folder changes (adding/removing repos) automatically restart the indexer, purge orphaned entries, and re-run the large-workspace detector so Explorer Dates keeps the correct scale without manual reloads.

**Automatic Large Workspace Detection**
- Explorer Dates automatically detects workspaces with **250,000+ files** during startup
- When detected, you'll receive a prompt with options:
  - **Enable Performance Mode**: Automatically enables minimal-overhead mode
  - **Keep Current Settings**: Continue with current configuration
  - **Don't Ask Again**: Suppress future warnings for this workspace
- This proactive detection prevents performance issues before they occur
- Set `explorerDates.forceEnableForLargeWorkspaces: true` to manually suppress the warning

**Adaptive File Watching (New)**
- Smart watchers analyze your workspace layout and only subscribe to high-signal folders like `src/`, `app/`, `packages/`, etc.
- Dynamic watchers shadow the directories of files you open or edit and automatically expire after a few idle minutes, so the watcher set always reflects your active working set.
- Watcher events are automatically throttled (100ms normal, 250ms large workspaces, 600ms extreme/150K+) to avoid thrashing the decoration pipeline.
- Tune the behavior via:
  - `explorerDates.smartFileWatching` (toggle adaptive mode, fallback to `**/*` watcher when disabled)
  - `explorerDates.smartWatcherMaxPatterns` (cap the number of base patterns per workspace folder)
  - `explorerDates.smartWatcherExtensions` (prioritized file extensions)
- Large-workspace detection automatically re-calibrates the watcher strategy when a repo crosses the 50K files threshold, so you keep badges without flipping performance mode.

**Activity Tracking Guardrail**
- Workspace activity tracking now defaults to **3,000 files** and automatically evicts the oldest entries when the cap is exceeded.
- Adjust via `explorerDates.maxTrackedActivityFiles` (set to `0` to disable tracking entirely; range 500–20,000).
- Matches your existing exclusion rules, so folders like `node_modules/` or patterns such as `**/*.log` never enter the cache.
- The activity watcher is disabled automatically on the web build or when the cap is `0`, preventing VS Code idle-memory creep.
- Hybrid filtering prefers explicit VS Code user events (saves/creates/deletes) and only falls back to the filesystem watcher for files that are currently open or were touched recently, so automated build churn is ignored by default.
- Tracking is automatically suppressed when `performanceMode` is enabled or `EXPLORER_DATES_LIGHTWEIGHT_MODE=1`, so lightweight profiles stay completely idle.
- Activity reports now include a source breakdown (user vs watcher) so you can confirm whether entries were driven by real edits or background automation.

**v1.2.5 Memory Enhancements:**
- **Decoration Pooling**: Reuses `FileDecoration` objects instead of allocating new ones per request (99.9% cache hit rate)
- **Flyweight String Caching**: Capped FIFO caches for badge strings and tooltips prevent transient allocations
- **Advanced Cache Slimming**: Compact storage reduces per-entry memory footprint by ~40%
- **Memory Shedding**: Optional adaptive guardrail that monitors heap and stretches refresh intervals under pressure

**Advanced Memory Options (Environment Variables)**

For users with very large workspaces (1000+ files) or memory-constrained systems, these options enable adaptive memory management:

```bash
# Memory Shedding (Adaptive Guardrail)
export EXPLORER_DATES_MEMORY_SHEDDING=1              # Enable adaptive memory guardrail
export EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=3    # Trigger threshold (MB, default 3, range 1-5)
export EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT=1000  # Cache cap during shedding (default 1000 entries)
export EXPLORER_DATES_MEMORY_SHED_REFRESH_MS=60000  # Min refresh interval during shedding (default 60s)

# Lightweight Mode (Maximum Memory Efficiency)
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1             # Force performance mode + disable git/colors/accessibility
```

**Example Usage**

```bash
# For large workspaces with memory concerns:
export EXPLORER_DATES_MEMORY_SHEDDING=1
code .

# For memory-constrained environments (Codespaces, embedded systems):
export EXPLORER_DATES_MEMORY_SHEDDING=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
export EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=2
code .

# Combined: maximum efficiency for resource-limited scenarios
export EXPLORER_DATES_MEMORY_SHEDDING=1
export EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
code .
```

**How Memory Shedding Works**

When enabled, memory shedding monitors heap usage during idle periods:
- **Below threshold**: No impact, operates normally (~0.53 MB typical delta in zero-delay soak)
- **Above threshold**: Automatically stretches decoration refresh intervals and shrinks the file metadata cache to reduce memory pressure
- **Fallback**: If memory shedding isn't available, the extension continues operating normally with standard caching

This is useful for:
- Workspaces with 1000+ JavaScript/TypeScript files
- VS Code in Codespaces or containerized environments
- Laptops/embedded systems with <4GB RAM
- Remote development environments with bandwidth constraints

**Memory Benchmarks (v1.2.5)**

| Scenario | Heap Delta | Status |
|---|---|---|
| Baseline (normal caching) | 0.53 MB | ✅ 95% improvement |
| Production usage (5ms delays) | 4.68 MB | ✅ Excellent |
| Memory shedding enabled | 0.54 MB | ✅ Adaptive guardrail working |
| Lightweight mode | 0.39 MB | ✅ 24% additional reduction |
| Combined (both features) | ~0.25 MB | ✅ Maximum efficiency |

See [MEMORY_FIX_REPORT.md](./MEMORY_FIX_REPORT.md) for comprehensive analysis, test methodology, and Phase 1-4 optimization details.

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
- `npm run test:memory` runs a GC-assisted soak test that hammers the decoration pipeline for several hundred iterations. It now includes a cache-hit phase followed by forced refreshes and fails if heap growth exceeds 24 MB by default (override with `MEMORY_SOAK_MAX_DELTA_MB`). Requires Node `--expose-gc`, which the script enables automatically.

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## Release Notes

### Version 1.3.0 (Latest)

**Module Federation & Team Configuration Release** *(Released January 4, 2026)*

Explorer Dates v1.3.0 introduces a modern module federation architecture with comprehensive team collaboration features:

#### **🏗️ Architecture Revolution**
- **Module Federation**: Dynamic chunk loading reduces base bundle from 267KB to ~99KB core + 281KB optional features
- **Feature Gating**: Disable features you don't use to save bundle size (up to 36% reduction possible)
- **Cross-Platform Bundles**: Dedicated Node.js and web bundles with platform-specific optimizations
- **Smart Loading**: Features load only when needed, with graceful fallback when disabled

#### **👥 Team Collaboration & Configuration**
- **Team Configuration Profiles**: Share standardized Explorer Dates configurations across your team
- **Conflict Resolution**: Intelligent merge strategies when team configs conflict with user preferences
- **Configuration Templates**: Built-in presets for different development scenarios (minimal, balanced, enterprise)
- **Settings Migration**: Automatic migration from legacy settings with intelligent conflict detection
- **Runtime Optimization**: Suggest optimal configurations based on workspace characteristics

#### **⚡ Enhanced Performance & Reliability**
- **Comprehensive Testing**: 40+ test suites covering feature gating, chunk loading, memory isolation, and edge cases
- **Memory Optimizations**: Advanced pooling and flyweight caching from v1.2.5 retained and enhanced
- **Error Resilience**: Graceful handling of missing chunks, corrupted configurations, and network failures
- **Bundle Verification**: Automated testing ensures all builds are production-ready

#### **🔧 Developer Experience**
- **Configuration Validation**: Real-time validation of all settings with helpful error messages
- **Preset System**: One-click application of optimized configurations for different use cases
- **Chunk Status Monitoring**: Visibility into which features are loaded and their impact on bundle size
- **Advanced Diagnostics**: Enhanced debugging tools for configuration and performance analysis

#### **📋 Migration & Deprecations**
- **⚠️ Settings Consolidated**: `enableReporting` → `enableExportReporting` (automatic migration)
- **✅ All Configurations Auto-Migrated**: Existing configurations automatically upgraded with conflict detection
- **✅ Backward Compatibility**: New feature flags default to enabled
- **✅ Team Optimization**: Teams can disable unused features to optimize bundle size

**Upgrade Path:** See [UPGRADE_GUIDE.md](./DOCS/UPGRADE_GUIDE.md) for detailed migration information.

---

### Version 1.2.6

**Stability & Memory Optimizations** *(December 2025)*

#### **🧠 Memory Management Enhancements**
- **Decoration Pooling**: 99.9% cache hit rate with object reuse
- **Flyweight String Caching**: FIFO caches prevent transient allocations
- **Advanced Cache Slimming**: 40% per-entry memory reduction
- **Memory Shedding**: Optional adaptive guardrail for resource-constrained environments

#### **🎯 Performance Improvements**
- **Hierarchical Cache Buckets**: O(1) lookups with intelligent directory-based trimming
- **Viewport-Aware Decorations**: Full experience for active files, lightweight for background
- **Progressive Feature Levels**: Auto-scaling based on workspace size

---

### Version 1.2.5

**Large Workspace Performance** *(November 2025)*

#### **📊 Workspace Intelligence**
- **Automatic Large Workspace Detection**: Proactive warnings for 250,000+ file projects
- **Adaptive File Watching**: Smart watchers for high-signal folders only
- **Activity Tracking Guardrail**: 3,000 file activity cap with LRU eviction
- **Hybrid Filtering**: User events prioritized over filesystem churn

#### **⚠️ Deprecations & Changes**
- **Memory Environment Variables**: New adaptive memory management options
- **Feature Level Auto-Detection**: Workspace size now determines optimal feature set
- **Smart Watcher Patterns**: Legacy `**/*` watching replaced with adaptive patterns

---

### Version 1.2.2

**Workspace Exclusion Reliability** *(October 2025)*

#### **🔧 Configuration Management**
- **Automatic Profile Cleanup**: Deduplicates exclusion lists at startup
- **Smart Suggestion Logic**: Only writes newly detected folders, prevents repeat prompts
- **Enhanced User Control**: Single Keep/Review/Revert prompt for auto-exclusions

#### **✅ Improvements**
- Existing installs automatically sanitized before new suggestions
- Cleaner `.vscode/settings.json` maintenance
- Reduced prompt fatigue for workspace exclusions

---

### Version 1.2.0

**Configuration Validation & Progressive Loading** *(September 2025)*

#### **🌐 VS Code for Web Support** *(New)*
- **Dedicated Browser Bundle**: Seamless operation on `vscode.dev`, `github.dev`
- **Filesystem Adapter**: Platform-agnostic file operations
- **Download-Based Exports**: Web-compatible configuration sharing

#### **🚀 Feature Enhancements**
- **Feature Gating**: Active control via `enableWorkspaceTemplates`, `enableReporting`, `enableExtensionApi`
- **Progressive Loading Warm-up**: Background decoration pre-warming for large workspaces
- **Enhanced Reporting**: Custom formats, retention windows, time-tracking integration
- **Template Accuracy**: Built-in templates reference actual Explorer Dates settings

#### **⚠️ Configuration Changes**
- **New Feature Flags**: Granular control over extension components
- **Report Format Evolution**: Enhanced CSV/JSON/HTML/Markdown exports
- **API Access Control**: `allowExternalPlugins` for security-conscious environments

---

### Version 1.1.0

**Major Configuration & Feature Update** *(August 2025)*

#### **🎨 Visual Enhancements** *(New)*
- **File Size Display**: Optional file size alongside dates (e.g., "5m • 1.2KB")
- **Enhanced Color Schemes**: `recency`, `file-type`, `subtle`, `vibrant`, `custom` options
- **Badge Priority Control**: Choose between time, author, or size in 2-character badges

#### **🖱️ User Experience** *(New)*
- **Context Menu Integration**: Right-click "Copy File Date" and "Show File Details"
- **Keyboard Shortcuts**: Ctrl+Shift+D (Cmd+Shift+D) for quick toggle
- **Improved Tooltips**: Rich hover information with full timestamps and Git data

#### **⚠️ Deprecated Features**
- **Legacy Color Settings**: Moved to `workbench.colorCustomizations` for theme integration
- **Basic Context Actions**: Enhanced with dedicated menu items and shortcuts

#### **🔧 Configuration Fixes**
- Resolved setting conflicts and validation issues
- Enhanced settings organization and documentation

---

### Version 1.0.1

**Performance & Localization Update** *(July 2025)*

#### **🌍 Accessibility & Localization** *(New)*
- **Multi-Language Support**: EN, ES, FR, DE, JA, ZH with auto-detection
- **High-Contrast Mode**: Enhanced visibility for accessibility needs
- **Screen Reader Compatibility**: Full ARIA support and accessible tooltips

#### **⚡ Performance Optimizations** *(New)*
- **Configurable Exclusions**: Smart exclusion patterns for large projects
- **Intelligent Caching**: Advanced caching algorithms with hit rate optimization
- **Performance Metrics**: Built-in monitoring and diagnostic commands

#### **🔍 Debugging Tools** *(New)*
- **Built-in Logging**: Comprehensive logging system with configurable levels
- **Performance Metrics Viewer**: Real-time performance and cache statistics
- **Diagnostic Commands**: Troubleshooting and health check utilities

---

### Version 1.0.0

**Initial Release** *(June 2025)*

#### **🎯 Core Features** *(New)*
- **Native VS Code Integration**: Built using FileDecorationProvider API for optimal performance
- **Intuitive Time Badges**: Clear, readable formats like `5m`, `2h`, `3d`, `1w`
- **Smart Caching**: Intelligent file system watching and metadata caching
- **Lightweight Architecture**: No UI overlays, pure native decorations

#### **📋 Foundation**
- Elegant sidebar integration without workspace clutter
- Automatic refresh and file system watching
- Basic configuration options for display preferences
- Cross-platform compatibility (Windows, macOS, Linux)

---

**Upgrade Notes:**
- **From v1.2.x**: Settings automatically migrated, new feature flags available for bundle optimization
- **From v1.1.x**: Color settings moved to `workbench.colorCustomizations`, enhanced context menu available
- **From v1.0.x**: Performance mode recommended for large workspaces, accessibility features available

See [CHANGELOG.md](./CHANGELOG.md) for complete technical details and [UPGRADE_GUIDE.md](./DOCS/UPGRADE_GUIDE.md) for migration assistance.

## License

[MIT](./LICENSE)
