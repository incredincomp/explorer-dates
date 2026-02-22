# Explorer Dates

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/incredincomp.explorer-dates.svg?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/incredincomp.explorer-dates.svg?color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/incredincomp.explorer-dates?cacheSeconds=3600)](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates&ssr=false#review-details)
[![VS Code for Web](https://img.shields.io/badge/vscode.dev-supported-0078d4)](https://vscode.dev)

Quickly view file activity and prioritize recent work from the Explorer.

**Explorer Dates** shows file modification times directly in the Explorer sidebar, using compact two-character badges (for example, `5m`, `2h`). Tooltips provide full timestamps, author, and size details.

## Key features
- Compact file modification badges in the Explorer sidebar (two-character visual badges).
- Flexible date formats (smart, relative, absolute) with optional file size or Git author display.
- Low overhead with smart caching and an adaptive performance mode for large workspaces.
- Workspace templates and team configuration for consistent settings across teams.
- Built-in diagnostics and performance tools for troubleshooting and verification.
- Browser-ready: supports `vscode.dev` and `github.dev`.

## Quick start
1. Install from the VS Code Marketplace.
2. Reload VS Code to activate decorations.
3. Configure settings or apply a preset using `Explorer Dates: Apply Configuration Preset`.

Note: Explorer badges are limited to two characters. Full timestamps and metadata remain available in Tooltips and accessibility output.

For full usage and configuration, see the documentation in `DOCS/` (Troubleshooting, Settings Guide, Upgrade Guide, and Commands).

**Release notes:** v1.3.0 — Module federation and team configuration. See `CHANGELOG.md` for full details.

## How It Works

The extension uses VS Code's `FileDecorationProvider` API to add date badges next to file names in the Explorer. The feature integrates directly into the Explorer — no separate panels are required.

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
- **Large projects / Low resource systems**: Enable `performanceMode: true` to turn off all non-essential features except basic date/time Tooltips
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

### Documentation
- [DOCS/TROUBLESHOOTING.md](./DOCS/TROUBLESHOOTING.md) — quick triage, upgrade checklist, symptom playbooks
- [DOCS/SETTINGS_GUIDE.md](./DOCS/SETTINGS_GUIDE.md) — setting-by-setting reference and examples
- [DOCS/UPGRADE_GUIDE.md](./DOCS/UPGRADE_GUIDE.md) — v1.3.x migration steps and presets
- [DOCS/ARCHITECTURE.md](./DOCS/ARCHITECTURE.md) — module federation, chunk gating, and bundle optimization details
- [DOCS/COMMANDS.md](./DOCS/COMMANDS.md) — command palette reference with IDs and descriptions
- [DOCS/PERFORMANCE_BASELINES.md](./DOCS/PERFORMANCE_BASELINES.md) — managing local vs. CI performance baselines and downloading artifacts

### Memory tests (quick start)

- Fast CI-friendly memory checks: `npm run test:memory-fast` (runs `baseline` and `50k` with reduced iterations).
- Lightweight option: `npm run test:memory-fast-light` (forces `EXPLORER_DATES_LIGHTWEIGHT_MODE=1` and runs `baseline`).
- Full memory matrix: `npm run test:memory-matrix` (runs `baseline,50k,100k,250k,450k`) — can be slow and should be run locally or via the scheduled CI job.

Notes:
- In CI, `scripts/run-memory-profiles.js` restricts profiles to `baseline,50k` by default unless `RUN_FULL_MEMORY_MATRIX=1` is set. Use `MEMORY_WORKSPACE_PROFILES_CI` to override the CI default if necessary.
- Full matrix runs are intended for on-demand or scheduled runs only (longer timeouts required).

### Settings Housekeeping
- Explorer Dates now auto-detects misplaced workspace settings or unsorted `explorer-dates-*.json` files during activation/migrations and quietly reorganizes them when needed.
- `Explorer Dates: Organize Settings` remains available for manual runs (or when automation is turned off).
- Use `npm run format:settings` (or `node scripts/sort-settings.js path/to/file.json`) to alphabetize any VS Code or Explorer Dates JSON config on demand.

## VS Code for Web Support

- Launch [vscode.dev](https://vscode.dev) or [github.dev](https://github.dev) and open a repository (File → Open Remote Repository, or press `.` in GitHub).
- Install Explorer Dates from the Extensions sidebar—no desktop dependencies required.
- Browser-specific behaviors:
  - Templates export/import via download dialogs because the sandbox cannot write to disk.
  - Persistent cache and Onboarding data use VS Code’s synced `globalState`, so settings sync with the user's Microsoft/GitHub account.
- Git-only commands automatically hide when the web Host cannot expose repository metadata.
- Remote environments (Codespaces, Dev Containers, Remote Tunnels) leverage the same web bundle, so Explorer Dates stays lightweight even when running over the network.

For details about v1.3.0 (module federation, bundle sizing, and team configuration), see `DOCS/V1_3_RELEASE_NOTES.md` and `CHANGELOG.md`. The upgrade guide is available at `DOCS/UPGRADE_GUIDE.md`.

> Note: This project is personally maintained. Current releases are distributed publicly under the MIT license via the VS Code Marketplace. Future versions may be privately distributed; published OSS releases will remain under the MIT license.

## Configuration

For full configuration details and examples, see `DOCS/SETTINGS_GUIDE.md`. The Settings Guide includes descriptions for all settings, presets, performance modes, and color configuration.

**Progressive Feature Levels**
- The new `featureLevel` setting (default `auto`) chooses between Full → Enhanced → Standard → Minimal profiles based on workspace size. Each profile selectively turns off expensive features (e.g., Git blame, rich tooltips, color math) for background files while keeping everything enabled for the files you are actually working on.

**Background Indexer & Web Workers**
- A cancellable incremental indexer now walks each workspace folder in the background and stores stat metadata. VS Code can request thousands of decorations without hammering the file system because most background requests reuse those cached stats.
- On VS Code desktop the indexer runs inside a dedicated `worker_threads` helper. On the web build the same logic runs inside a lightweight WebWorker. Both stream delta updates from file watchers so the index remains synchronized with file edits within a few hundred milliseconds.
- Workspace folder changes (adding/removing repos) automatically restart the indexer, purge orphaned entries, and re-run the large-workspace detector so Explorer Dates keeps the correct scale without manual reloads.

**Automatic Large Workspace Detection**
- Explorer Dates automatically detects workspaces with **250,000+ files** during startup
- When detected, a prompt appears with options:
  - **Enable Performance Mode**: Automatically enables minimal-overhead mode
  - **Keep Current Settings**: Continue with current configuration
  - **Do not ask again**: Suppress future warnings for this workspace
- This proactive detection prevents performance issues before they occur
- Set `explorerDates.forceEnableForLargeWorkspaces: true` to manually suppress the warning

**Adaptive File Watching (New)**
- Smart watchers analyze your workspace layout and only subscribe to high-signal folders like `src/`, `app/`, `packages/`, etc.
- Dynamic watchers shadow directories of files that are opened or edited and automatically expire after a few idle minutes, so the watcher set reflects the active working set.
- Watcher events are automatically throttled (100ms normal, 250ms large workspaces, 600ms extreme/150K+) to avoid thrashing the decoration pipeline.
- Tune the behavior via:
  - `explorerDates.smartFileWatching` (toggle adaptive mode, fallback to `**/*` watcher when turned off)
  - `explorerDates.smartWatcherMaxPatterns` (cap the number of base patterns per workspace folder)
  - `explorerDates.smartWatcherExtensions` (prioritized file extensions)
- Large-workspace detection automatically re-calibrates the watcher strategy when a repo crosses the 50K files threshold, so you keep badges without flipping performance mode.

**Activity Tracking Guardrail**
- Workspace activity tracking now defaults to **3,000 files** and automatically evicts the oldest entries when the cap is exceeded.
- Adjust via `explorerDates.maxTrackedActivityFiles` (set to `0` to turn off tracking entirely; range 500–20,000).
- Matches existing exclusion rules, so folders like `node_modules/` or patterns such as `**/*.log` never enter the cache.
- The activity watcher is turned off automatically on the web build or when the cap is `0`, preventing VS Code idle-memory creep.
- Hybrid filtering prefers explicit VS Code user events (saves/creates/deletes) and only falls back to the filesystem watcher for files that are currently open or were touched recently, so automated build churn is ignored by default.
- Tracking is automatically suppressed when `performanceMode` is enabled or `EXPLORER_DATES_LIGHTWEIGHT_MODE=1`, so lightweight profiles stay completely idle.
- Activity reports now include a source breakdown (user vs watcher) so you can confirm whether entries were driven by real edits or background automation.

**v1.2.5 Memory Enhancements:**
- **Decoration Pooling**: Reuses `FileDecoration` objects instead of allocating new ones per request (99.9% cache hit rate)
- **Flyweight String Caching**: Capped FIFO caches for badge strings and Tooltips prevent transient allocations
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
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1             # Force performance mode and turn off Git, theme colors, and accessibility adornments
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
- **Fallback**: If memory shedding is unavailable, the extension continues operating normally with standard caching

This is useful for:
- Workspaces with 1000+ JavaScript/TypeScript files
- VS Code in Codespaces or containerized environments
- Laptops/embedded systems with <4GB RAM
- Remote development environments with bandwidth constraints

**Memory Benchmarks (v1.2.5)**

| Scenario | Heap Delta | Status |
|---|---|---|
| Baseline (normal caching) | 0.53 MB | 95% improvement |
| Production usage (5ms delays) | 4.68 MB | Excellent |
| Memory shedding enabled | 0.54 MB | Adaptive guardrail working |
| Lightweight mode | 0.39 MB | 24% additional reduction |
| Combined (both features) | ~0.25 MB | Maximum efficiency |

See [MEMORY_FIX_REPORT.md](./MEMORY_FIX_REPORT.md) for comprehensive analysis, test methodology, and Phase 1-4 optimization details.

## Debugging & Diagnostics

### Support & Maintenance

This project is personally maintained by the author. For support, open an issue on GitHub or check the project's profile for sponsorship/contact options. The **latest patch release in each minor series (for example, 1.3.x)** is maintained for **90 days** from the release date and receives bug fixes during that window. Responses for the free core edition are handled on a **best-effort** basis; users of **Explorer Dates Pro** receive prioritized support. For prioritized or paid support options, please see `DISTRIBUTION.md`.

**Governance & contribution**: See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for contribution guidelines and community expectations. For security reports and responsible disclosure, see `SECURITY.md`.

### Telemetry & Privacy

This project does not collect telemetry by default. Optional telemetry and diagnostic events are gated by the `EXPLORER_DATES_TELEMETRY` environment flag and an explicit opt-in setting `explorerDates.enableTelemetry`. See `DOCS/SETTINGS_GUIDE.md` for details on what is collected and how to opt out.

You can clear locally-stored diagnostic telemetry with the command `Explorer Dates: Clear Telemetry Data` (`explorerDates.clearTelemetryData`). This command will prompt for confirmation before removing any stored events.

- **Developer Tools**: If you need to verify badge acceptance, open `Help → Toggle Developer Tools` (Extension Host console) while running the extension to view any rejection messages.
- **Built-in diagnostic command (optional)**: Add the diagnostic snippet from `DOCS/SETTINGS_GUIDE.md` to register a temporary command that emits test badges for several lengths. Run it and capture Extension Host console output if you see rejection warnings.

## Testing & Verification

- Run `npm test` for the full suite (lint, configuration wiring, feature-flag scenarios, workspace/reporting flows, and both bundle verifiers).
- `npm run test:config` ensures every contributed setting is referenced in code/docs before publishing.
- `npm run test:config-scenarios` activates the extension across 90+ mocked configuration permutations to flush out settings regressions.
- `npm run test:feature-gates` activates the extension in a mocked VS Code host and verifies feature-flag scenarios, workspace templates, reporting, and API/plug-in toggles behave as expected.
- `npm run test:flows` exercises workspace templates, reporting, and the web bundle using lightweight VS Code shims.
- `npm run test:bundle` and `npm run test:verify-bundle` provide quick validation checks for the packaged bundle/VSIX before submission to the Marketplace.
- `npm run test:memory` runs a GC-assisted soak test that hammers the decoration pipeline for several hundred iterations. It now includes a cache-hit phase followed by forced refreshes and fails if heap growth exceeds 24 MB by default (override with `MEMORY_SOAK_MAX_DELTA_MB`). Requires Node `--expose-gc`, which the script enables automatically.

## Inspiration & Motivation

*Inspired by the original explorer-plus concept, but completely reimplemented using VS Code's native FileDecorationProvider API for better performance and integration.*

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## Release Notes

### Version 1.3.0 (Latest)

**Module Federation & Team Configuration Release** *(Released January 4, 2026)*

Explorer Dates v1.3.0 introduces a modern module federation architecture with comprehensive team collaboration features:

#### Architecture
- **Module Federation**: Dynamic chunk loading reduces base bundle from 267KB to ~99KB core + 281KB optional features
- **Feature flags**: Turn off unused features to save bundle size (up to 36% reduction).
- **Cross-Platform Bundles**: Dedicated Node.js and web bundles with platform-specific optimizations
- **Smart Loading**: Features load only when needed, with graceful fallback when turned off

#### Team Collaboration & Configuration
- **Team Configuration Profiles**: Share standardized Explorer Dates configurations across your team (included in the current OSS release; commercial/paid changes may apply in future private builds).
- **Conflict Resolution**: Intelligent merge strategies when team configurations conflict with user preferences
- **Configuration Templates**: Built-in presets for different development scenarios (minimal, balanced, enterprise)
- **Settings Migration**: Automatic migration from legacy settings with intelligent conflict detection
- **Runtime Optimization**: Suggest optimal configurations based on workspace characteristics

#### Enhanced Performance & Reliability
- **Comprehensive Testing**: 40+ test suites covering feature flags, chunk loading, memory isolation, and edge cases
- **Memory Optimizations**: Advanced pooling and flyweight caching from v1.2.5 retained and enhanced
- **Error Resilience**: Graceful handling of missing chunks, corrupted configurations, and network failures
- **Bundle Verification**: Automated testing ensures all builds are production-ready

#### Developer Experience
- **Configuration Validation**: Real-time validation of all settings with helpful error messages
- **Preset System**: One-click application of optimized configurations for different use cases
- **Chunk Status Monitoring**: Visibility into which features are loaded and their impact on bundle size
- **Advanced Diagnostics**: Enhanced debugging tools for configuration and performance analysis

#### Migration & Deprecations
- **Settings consolidated**: `enableReporting` → `enableExportReporting` (automatic migration)
- **All configurations auto-migrated**: Existing configurations were upgraded with conflict detection
- **Backward compatibility**: New feature flags default to enabled
- **Team optimization**: Teams can turn off unused features to optimize bundle size

**Upgrade Path:** See [UPGRADE_GUIDE.md](./DOCS/UPGRADE_GUIDE.md) for detailed migration information.

---

### Version 1.2.6

**Stability & Memory Optimizations** *(December 2025)*

#### Memory Management Enhancements
- **Decoration Pooling**: 99.9% cache hit rate with object reuse
- **Flyweight String Caching**: FIFO caches prevent transient allocations
- **Advanced Cache Slimming**: 40% per-entry memory reduction
- **Memory Shedding**: Optional adaptive guardrail for resource-constrained environments

#### Performance Improvements
- **Hierarchical Cache Buckets**: O(1) lookups with intelligent directory-based trimming
- **viewport-aware decorations**: Full experience for active files, lightweight for background
- **Progressive Feature Levels**: Auto-scaling based on workspace size

---

### Version 1.2.5

**Large Workspace Performance** *(November 2025)*

#### Workspace Intelligence
- **Automatic Large Workspace Detection**: Proactive warnings for 250,000+ file projects
- **Adaptive File Watching**: Smart watchers for high-signal folders only
- **Activity Tracking Guardrail**: 3,000 file activity cap with LRU eviction
- **Hybrid Filtering**: User events prioritized over filesystem churn

#### Deprecations & Changes
- **Memory Environment Variables**: New adaptive memory management options
- **Feature Level Auto-Detection**: Workspace size now determines optimal feature set
- **Smart Watcher Patterns**: Legacy `**/*` watching replaced with adaptive patterns

---

### Version 1.2.2

**Workspace Exclusion Reliability** *(October 2025)*

#### Configuration Management
- **Automatic Profile Cleanup**: Deduplicates exclusion lists at startup
- **Smart Suggestion Logic**: Only writes newly detected folders, prevents repeat prompts
- **Enhanced User Control**: Single Keep/Review/Revert prompt for auto-exclusions

#### Improvements
- Existing installs automatically sanitized before new suggestions
- Cleaner `.vscode/settings.json` maintenance
- Reduced prompt fatigue for workspace exclusions

---

### Version 1.2.0

**Configuration Validation & Progressive Loading** *(September 2025)*

#### VS Code for Web Support *(New)*
- **Dedicated Browser Bundle**: Seamless operation on `vscode.dev`, `github.dev`
- **Filesystem Adapter**: Platform-agnostic file operations
- **Download-Based Exports**: Web-compatible configuration sharing

#### Feature Enhancements
- **Feature flags**: Active control via `enableWorkspaceTemplates`, `enableReporting`, `enableExtensionApi`
- **Progressive Loading Warm-up**: Background decoration pre-warming for large workspaces
- **Enhanced Reporting**: Custom formats, retention windows, time-tracking integration
- **Template Accuracy**: Built-in templates reference actual Explorer Dates settings

#### Configuration Changes
- **New Feature Flags**: Granular control over extension components
- **Report Format Evolution**: Enhanced CSV/JSON/HTML/Markdown exports
- **API Access Control**: `allowExternalPlugins` for security-conscious environments

---

### Version 1.1.0

**Major Configuration & Feature Update** *(August 2025)*

#### Visual Enhancements *(New)*
- **File Size Display**: Optional file size alongside dates (e.g., "5m • 1.2KB")
- **Enhanced Color Schemes**: `recency`, `file-type`, `subtle`, `vibrant`, `custom` options
- **Badge Priority Control**: Choose between time, author, or size in 2-character badges

#### User Experience *(New)*
- **Context Menu Integration**: Right-click "Copy File Date" and "Show File Details"
- **Keyboard Shortcuts**: Ctrl+Shift+D (Cmd+Shift+D) for quick toggle
- **Improved Tooltips**: Rich hover information with full timestamps and Git data

#### Deprecated Features
- **Legacy Color Settings**: Moved to `workbench.colorCustomizations` for theme integration
- **Basic Context Actions**: Enhanced with dedicated menu items and shortcuts

#### Configuration Fixes
- Resolved setting conflicts and validation issues
- Enhanced settings organization and documentation

---

### Version 1.0.1

**Performance & Localization Update** *(July 2025)*

#### Accessibility & Localization *(New)*
- **Multi-Language Support**: EN, ES, FR, DE, JA, ZH with auto-detection
- **High-Contrast Mode**: Enhanced visibility for accessibility needs
- **Screen Reader Compatibility**: Full ARIA support and accessible tooltips

#### Performance Optimizations *(New)*
- **Configurable Exclusions**: Smart exclusion patterns for large projects
- **Intelligent Caching**: Advanced caching algorithms with hit rate optimization
- **Performance Metrics**: Built-in monitoring and diagnostic commands

#### **Debugging Tools** *(New)*
- **Built-in Logging**: Comprehensive logging system with configurable levels
- **Performance Metrics Viewer**: Real-time performance and cache statistics
- **Diagnostic Commands**: Troubleshooting and health check utilities

---

### Version 1.0.0

**Initial Release** *(June 2025)*

#### Core Features *(New)*
- **Native VS Code Integration**: Built using FileDecorationProvider API for optimal performance
- **Intuitive Time Badges**: Clear, readable formats like `5m`, `2h`, `3d`, `1w`
- **Smart Caching**: Intelligent file system watching and metadata caching
- **Lightweight Architecture**: No UI overlays, pure native decorations

#### Foundation
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
