# Changelog

## 1.3.0 - Module Federation & Team Configuration

### 🏗️ Architecture Revolution

**Module Federation System**
- Complete rewrite using module federation architecture
- Base bundle reduced from 267KB to **~99KB** core + **281KB** optional chunks
- Features load dynamically based on configuration flags
- **36% bundle size reduction** possible by disabling unused features
- Graceful degradation when chunks are missing or disabled

**Cross-Platform Optimization**
- Dedicated Node.js (`extension.js`) and Web (`extension.web.js`) bundles
- Platform-specific file system adapters for optimal performance
- Web bundle optimized for `vscode.dev`, `github.dev`, and Codespaces
- Automatic platform detection with appropriate feature gating

### 👥 Team Configuration & Collaboration

**Team Configuration Profiles**
- Share standardized Explorer Dates configurations across teams
- JSON-based export/import with validation and error handling
- Conflict resolution strategies when team configs clash with user preferences
- Automatic backup creation before applying team configurations
- File watching for real-time team configuration updates

**Configuration Management**
- Built-in configuration presets (minimal, balanced, enterprise, data-science)
- Runtime configuration suggestions based on workspace characteristics
- Settings validation with helpful error messages and auto-correction
- Migration system for legacy settings with intelligent conflict detection
- Configuration preview system for testing changes before applying

**Collaboration Features**
- Team profile CRUD operations with persistence
- User override documentation for transparency
- Conflict resolution UI with detailed diff views
- Workspace-specific configuration inheritance

### 🚀 Performance & Reliability Enhancements

**Comprehensive Testing Suite**
- **40+ test suites** covering all aspects of the extension
- Feature gating validation ensures disabled features don't load
- Chunk loading failure resilience testing
- Memory isolation matrix testing with allocation telemetry
- Cross-platform compatibility verification
- Bundle integrity verification before publication

**Error Handling & Resilience**
- Graceful handling of missing chunk files
- Corrupted configuration recovery
- Network failure resilience for team configurations
- File system permission error handling with ephemeral fallbacks
- Automatic retry mechanisms for transient failures

**Advanced Diagnostics**
- Bundle size analysis and optimization suggestions
- Chunk loading status monitoring
- Feature-level performance metrics
- Configuration validation and troubleshooting
- Memory usage analysis and optimization recommendations

### 🛠️ Developer Experience Improvements

**Enhanced Configuration System**
- **Real-time validation** of all settings with immediate feedback
- **Preset application** with one-click optimal configurations
- **Bundle optimization wizard** for size-conscious deployments
- **Configuration comparison** tools for understanding changes
- **Runtime chunk management** for feature-level control

**Advanced Features**
- **Restart batching** - intelligently groups configuration changes to minimize reloads
- **Settings migration** - automatic upgrade of legacy configurations
- **Theme integration** - automatic color scheme adaptation when VS Code themes change
- **QuickPick UI flows** - streamlined interfaces for common tasks

### 📦 Bundle Structure & Feature Gating

**Core Bundle (~99KB)**
- Essential file decoration functionality
- Basic commands and settings
- Performance monitoring
- Error handling and logging

**Optional Chunks (loaded on demand)**
- **Onboarding System** (~34KB): Welcome wizard, feature tour, getting started flows
- **Export & Reporting** (~17KB): File modification reports, analytics, activity tracking
- **Workspace Templates** (~14KB): Configuration templates, team profile management
- **Extension API** (~15KB): Third-party extension integration, plugin system
- **Advanced Cache** (~5KB): Enhanced caching algorithms, memory optimization
- **Analysis Commands** (~8KB): Diagnostic tools, performance analysis, debugging
- **Workspace Intelligence** (~12KB): Smart exclusions, large workspace detection
- **Incremental Workers** (~19KB): Background file processing, batch operations

### 🔧 Configuration Changes

**New Settings (v1.3.0)**
```json
{
  "explorerDates.enableOnboardingSystem": true,     // Control welcome flows
  "explorerDates.enableExportReporting": true,      // Control reporting features  
  "explorerDates.enableWorkspaceTemplates": true,   // Control template system
  "explorerDates.enableExtensionApi": true,         // Control API access
  "explorerDates.enableAdvancedCache": true,        // Control cache enhancements
  "explorerDates.enableAnalysisCommands": true,     // Control diagnostic tools
  "explorerDates.enableWorkspaceIntelligence": true, // Control smart features
  "explorerDates.enableIncrementalWorkers": false   // Control background workers
}
```

**Migration Notes**
- All existing settings are automatically migrated
- `enableReporting` → `enableExportReporting` (with deprecation notice)
- `customColors` → `workbench.colorCustomizations` (with migration assistant)
- New feature flags default to `true` for backward compatibility
- Disable unused features to reduce bundle size

### 🧪 Quality Assurance

**Testing Coverage**
- **Memory isolation testing** - ensures no memory leaks between feature combinations
- **Feature gate validation** - verifies disabled features don't load or execute
- **Chunk loading resilience** - tests graceful degradation when chunks fail to load
- **Configuration scenario testing** - validates 90+ configuration permutations
- **Cross-platform compatibility** - ensures consistent behavior across environments
- **Bundle verification** - automated checks for production readiness

**CI/CD Enhancements**
- Automated bundle size analysis with regression detection
- Memory usage monitoring with configurable thresholds
- Feature flag matrix testing across all supported configurations
- Platform-specific testing for Node.js and web environments

### 📚 Documentation Updates

**New Documentation**
- [Team Configuration Guide](./DOCS/TEAM_CONFIG_TESTING.md)
- [Settings Migration Guide](./DOCS/SETTINGS_MIGRATION_GUIDE.md)
- [Bundle Optimization Guide](./DOCS/BUNDLE_OPTIMIZATION.md)
- [Architecture Documentation](./DOCS/ARCHITECTURE.md)
- [Troubleshooting Guide](./DOCS/TROUBLESHOOTING.md)

**Updated Documentation**
- README with v1.3.0 features and configuration options
- Settings Guide with new feature flags and team configuration
- Upgrade Guide with migration instructions and breaking changes
- Commands documentation with new team configuration commands

### ⚠️ Breaking Changes

- **Minimum VS Code Version**: Now requires VS Code 1.105.0+
- **Bundle Structure**: Extensions relying on internal APIs may need updates
- **Configuration Schema**: Some legacy settings are deprecated (with automatic migration)
- **Web Environment**: Enhanced web support may change behavior in browser contexts

### 🔄 Migration Path

1. **Automatic Migration**: Settings are migrated automatically on first run
2. **Feature Validation**: Review new feature flags and disable unused features
3. **Bundle Optimization**: Use new optimization tools to reduce bundle size
4. **Team Setup**: Configure team profiles if working in collaborative environments
5. **Testing**: Verify all functionality works as expected in your environment

See [UPGRADE_GUIDE.md](./DOCS/UPGRADE_GUIDE.md) for detailed migration instructions.

## 1.2.10 - Workspace-Aware Indexing & Worker Reliability

### Automatic Workspace Sync
- Explorer Dates now listens for workspace folder additions/removals and reruns smart watchers, progressive loading, and the large-workspace detector automatically. Switching monorepo roots no longer requires a manual reload to keep decorations accurate.
- The incremental indexer restarts in the background with a scale-aware file budget, so new repos warm quickly while existing caches stay hot. Extreme workspaces cap their initial crawl aggressively, whereas normal projects keep the full 2,000-file budget (overridable via `EXPLORER_DATES_INDEXER_MAX_FILES`).

### Incremental Indexer Hygiene
- Removed workspace folders are pruned from the in-memory stat index immediately, preventing stale entries from lingering after you close a repo or remove a Codespace root.
- Reinitializing the indexer now disposes any previous worker host before creating another, eliminating worker_threads/WebWorker leaks when performance mode toggles on/off.

### Web Worker Reliability
- The worker host’s capability probe accepts environments where `URL` is exposed as a function (the standard shape in browsers), so the web bundle consistently spins up a real WebWorker instead of falling back to inline hashing on `vscode.dev`/`github.dev`.

### Guardrails & Observability
- `checkWorkspaceSize()` is serialized to avoid overlapping 50K-file scans and is reused by the workspace-change listener, keeping watcher throttle tiers, batch processor scaling, and feature levels in sync with the active repo footprint.
- README + SETTINGS_GUIDE call out the new workspace-change behavior so teams know the indexer restarts automatically when repos are added or removed.

## 1.2.9 - Viewport-Aware Scaling & Hierarchical Cache

### Hierarchical Cache Buckets
- In-memory decorations now live inside folder buckets, so trimming the cache evicts entire cold directories with one operation instead of hundreds of single-file deletions.
- Keeps the hit rate high in 150K-file workspaces while capping the cache size consistently (eviction stats are exposed via `Explorer Dates: Show Metrics`).

### Viewport-Aware Decorations
- Explorer Dates now tracks visible editors and your recent working set. Files you can actually see keep rich tooltips, colors, Git info, and size badges; background files fall back to lightweight badges so Explorer stays responsive even when VS Code requests thousands of decorations.
- The new summary tooltip mode keeps accessibility text concise for background files while still surfacing key metadata.

### Progressive Feature Levels
- Added `explorerDates.featureLevel` with `auto`/`full`/`enhanced`/`standard`/`minimal` profiles. `auto` adapts to workspace size and feeds into the viewport-aware pipeline so large repos stay fast without forcing `performanceMode`.
- Profiles control whether Git, color schemes, file sizes, and rich tooltips run for background files. Visible files always get the maximum fidelity that the current profile allows.

### Incremental Indexer & Workers
- A cancellable incremental indexer now warms a stat cache in the background using the BatchProcessor. Workspace scans stop immediately when settings change, and delta updates stream from file watcher events so the index never drifts.
- Heavy digest math (hashing, bucket calculations) runs inside a worker: `worker_threads` on desktop and a real WebWorker inside `vscode.dev`/`github.dev`. When workers are unavailable, the host falls back to inline computation automatically.
- Background decoration requests reuse the indexed stats, dramatically reducing `fs.stat` calls when Explorer asks for thousands of items. Priority/visible files still hit the live file system for perfect accuracy.

### Docs & Tooling
- README + SETTINGS_GUIDE document the new `featureLevel` setting, hierarchical cache, and viewport-aware behavior.
- Diagnostics now expose cache bucket counts, feature level, and viewport stats so performance webviews/showMetrics reflect the new systems.

## 1.2.8 - Smart File Watching & Large Workspace Resilience

### Adaptive Watchers (No More `**/*` on Monorepos)
- Replaced the single `**/*` watcher with a smart analyzer that prioritizes high-signal folders (`src/`, `app/`, `packages/`, etc.) and root-level config files. Watcher budgets adjust automatically when the workspace crosses 10K/50K files so Explorer remains responsive even in 150K-file repos.
- Added dynamic per-directory watchers that follow whatever you're actively editing. They spin up instantly when you open/save files and auto-expire after ~10 minutes of inactivity (tunable via `EXPLORER_DATES_WATCHER_TTL_MS`), keeping the total watcher count lean.
- Watcher events are throttled automatically (100 ms by default, 250 ms for large workspaces, 600 ms for extreme/50K+ workspaces) to prevent decoration thrash when build tools touch thousands of files at once.

### New Settings & Env Controls
- `explorerDates.smartFileWatching` (default `true`) toggles the adaptive watcher pipeline. Disable it to fall back to VS Code's global watcher if you prefer the old behavior.
- `explorerDates.smartWatcherMaxPatterns` (default `20`, min `5`, max `200`) caps how many static patterns we register per workspace folder—use this to fine-tune baseline overhead on mega repos.
- `explorerDates.smartWatcherExtensions` lets you customize which file extensions count as “high signal” for smart watcher coverage (defaults include common languages + config formats). Extensions are normalized so you can pass either `"ts"` or `".ts"`.
- Added environment flags `EXPLORER_DATES_MAX_DYNAMIC_WATCHERS` and `EXPLORER_DATES_WATCHER_TTL_MS` (existing env plumbing) to globally cap dynamic watchers or change their idle timeout.

### Large Folder Guardrail
- New `explorerDates.autoExcludeLargeFolders` + `explorerDates.autoExcludeFolderMinSizeMB` settings keep giant build/cache folders (50 MB+ by default) out of the decoration pipeline immediately—no settings.json edits required. The guardrail plugs directly into smart exclusions and watcher analysis, so once a folder is auto-suppressed it won’t get watchers or cache entries until it shrinks.

### Adaptive Batch Processor
- Batch processing now adapts to workspace scale and queue depth automatically. `explorerDates.adaptiveBatchProcessing` keeps per-chunk sizes tight in 10K+/50K+ repos without hurting smaller projects. Metrics now expose the effective batch size so diagnostics and the performance webview show the current tuning.

### Large Workspace Awareness
- The 50K+ file detector now feeds back into the watcher strategy: when a repo crosses the extreme threshold we immediately reconfigure watchers with the slower throttle window instead of nagging users to enable performance mode.
- Workspace metrics now report `watcherStrategy`, `staticWatchers`, `dynamicWatchers`, `workspaceScale`, and `workspaceFileCount` so diagnostics and the performance webview show exactly how Explorer Dates adapted to the current repo.

### Docs & Bundles
- README and SETTINGS_GUIDE gained a dedicated “Adaptive File Watching” section with tuning examples for large repos, plus the performance chapter now explains the new flow.
- `package.json` contributions expose the new settings so they appear in VS Code's Settings UI.
- Rebuilt both desktop/web bundles and refreshed `dist/extension*.js(.map)` to pick up the watcher implementation.

## 1.2.7 - Activity Tracking Guardrail

### Idle Memory Fixes
- Added `explorerDates.maxTrackedActivityFiles` (default 3,000) to cap the workspace activity cache and automatically evict oldest entries before they balloon VS Code's heap during long idle sessions.
- Setting the cap to `0` disables the activity watcher entirely; VS Code for Web also skips the watcher to keep browser sandboxes lean.
- Activity tracking now respects your existing exclusion rules (`explorerDates.excludedFolders` / `explorerDates.excludedPatterns`) before storing entries, eliminating noisy data from `node_modules/`, build artifacts, or logs.
- Cached activity entries are normalized + deduplicated by path, retaining only 100 recent events per file and automatically purging empty entries so the report generator stays lightweight.
- Hybrid filtering prefers editor-driven events (save/create/delete/rename) and only uses the raw filesystem watcher when the file is open or was touched recently, so automated build churn no longer floods the cache.
- Reports now ship with a `activitySourceBreakdown` summary so you can see how many entries came from explicit user actions vs. watcher fallbacks.
- Activity tracking auto-disables whenever `performanceMode` or `EXPLORER_DATES_LIGHTWEIGHT_MODE` is active, guaranteeing zero overhead for lightweight profiles.

### Reporting Reliability
- Activity reports pull from the normalized cache structure, so file deletions and restorations always reference the original path even after eviction.
- The reporting manager cleans up watchers/timers immediately when disposed, preventing runaway listeners between extension reloads.
- README + Settings Guide document the new guardrail and provide quick recipes for low-memory environments.

## 1.2.6 - Cache Preservation & Diagnostics

### Warm Resets Without Data Loss
- Introduced a hashed cache namespace that automatically rotates when decoration-affecting settings change, avoiding stale entries without nuking the persistent cache.
- `refreshAll()` now accepts a `preservePersistentCache` option so configuration/UI toggles only clear runtime state; disk snapshots survive and rehydrate immediately after the refresh.
- Advanced cache gains dirty-tracking plus a `resetRuntimeOnly()` helper, preventing empty snapshots from being written to `globalState` during routine refreshes or preview toggles.

### Mono-Repo Observability
- Cache debug output now includes the namespace and sample keys are stripped of their prefix so Explorer paths stay readable when diagnosing large workspaces.
- Performance analytics webview surfaces batch processor queue depth/progress and Git/file-stat latency (avg + totals) pulled straight from provider metrics.
- `Explorer Dates: Debug Cache` dialog highlights memory vs disk hit rates and the namespace, making it easy to compare runs between different tuning sessions.

### Log Hygiene & Packaging
- Decoration requests now log at `debug`, keeping standard logs concise even during stress tests (still available when `explorerDates.enableLogging` is on).
- Added `MEMORY_FIX_REPORT.md` to `.vscodeignore` so internal tuning docs never ship inside the VSIX bundle.

### Reliability
- Advanced cache flushes only when data actually changed; redundant saves are skipped, and runtime mutations clear the “skip” guard so follow-up writes capture the latest entries.
- Namespace-aware cache keys ensure toggling things like color scheme, Git info, or badge format immediately invalidates the correct records while leaving unrelated data untouched.

---

# Changelog

## 1.2.5 - Memory Optimization & Performance

### Memory Enhancements (Major Performance Improvement)
- **Decoration Object Pooling**: Implemented reusable `vscode.FileDecoration` pool keyed by `{badge, themeColor, tooltip}` to eliminate per-request allocation churn. Reduces memory allocations by 94-95% in normal workloads.
- **Flyweight String Caching**: Added capped FIFO flyweight caches (2,048 entries each) for badge strings (`5m`, `2h`, etc.) and readable timestamps to eliminate transient string allocations. Combined with pooling, keeps allocation overhead minimal even under zero-delay stress testing.
- **Advanced Cache Slimming**: Refactored `AdvancedCache` to collapse double-Map layout into compact single entries, eliminating per-entry overhead and reducing memory footprint by ~40% for persistent cache scenarios.
- **Memory Shedding Feature** (Opt-in): New adaptive guardrail that monitors heap usage and automatically stretches decoration refresh intervals + shrinks cache size when memory pressure builds. Triggered via `EXPLORER_DATES_MEMORY_SHEDDING=1` environment variable (tunable threshold via `EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB`, default 3 MB).
- **Lightweight Mode** (Opt-in): New environment variable `EXPLORER_DATES_LIGHTWEIGHT_MODE=1` forces `performanceMode` and disables Git, theme colors, and accessibility adornments for maximum memory efficiency (24% reduction in stress scenarios).

### Benchmarks
- **Extreme Stress Test (2000 iterations, 0ms delay, cache-friendly)**: Heap delta reduced from 28.68 MB → **0.53 MB** ✅ (95% improvement)
- **Production Hammer Test (600 iterations, 5ms delay)**: Heap delta **4.68 MB** (no regression, excellent baseline)
- **Forced Cache Bypass**: Pooling + flyweights keep allocations minimal even when caches are disabled (**0.71 MB** delta, 0.05 MB overhead)
- **Memory Shedding On**: **0.54 MB** delta with guardrail active (adaptive threshold tuning works as designed)
- **Lightweight Mode On**: **0.39 MB** delta (24% improvement when accessibility/git features disabled)

### Implementation Details
- **Decoration Pool**: `FileDateDecorationProvider._decorationPool` maintains 8-20 unique decoration instances; cache hit rate 99.9% during normal operations
- **Badge Flyweight**: `_formatDateBadge()` routes through capped FIFO cache; reduces per-iteration string churn from `~16 KB` to `<1 KB`
- **Readable Timestamp Flyweight**: `_formatDateReadable()` caches tooltip strings by time bucket (`readable:minutes:5`, etc.)
- **Timer Deduplication**: `_scheduleIncrementalRefresh()` cancels pending timers before rescheduling to prevent Set accumulation
- **Smart Cache Refresh**: `_markCacheEntryForRefresh()` only forces refresh if entry is >75% through TTL; eliminated 99.95% of unnecessary file stat operations (from 16,000 down to 8 calls)
- **Lightweight Mode Cache Purge**: When `EXPLORER_DATES_LIGHTWEIGHT_MODE=1`, decoration pooling/flyweight caches stay disabled, cache timeout shrinks to 5s, and caches are auto-purged every ~400 decorations so Node 18 runners consistently stay below the 0.65 MB heap guardrail in CI.

### Test Coverage & CI Integration
- New `tests/test-memory-isolation-forced-miss.js` validates pooling/flyweights work correctly under forced cache bypass
- `tests/test-memory-isolation-matrix.js` runs comparative analysis across 4 scenarios (control, pool-only, flyweights-only, neither)
- GitHub Actions workflow (`.github/workflows/memory-regression.yml`) enforces <1 MB heap delta for baseline and all optimization modes
- npm scripts for easy testing:
  - `npm run test:memory` (baseline, standard optimizations)
  - `npm run test:memory-shedding` (with 2 MB adaptive threshold)
  - `npm run test:memory-lightweight` (performance mode emphasis)

### Configuration & Feature Flags

**Environment Variables** (for advanced users / CI):
```bash
# Memory Shedding (Adaptive)
EXPLORER_DATES_MEMORY_SHEDDING=1                    # Enable adaptive memory guardrail
EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=3           # Trigger at heap delta > 3 MB (default)
EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT=1000         # Cache cap during shedding (default)
EXPLORER_DATES_MEMORY_SHED_REFRESH_MS=60000         # Min refresh interval during shedding (1 minute default)

# Lightweight Mode
EXPLORER_DATES_LIGHTWEIGHT_MODE=1                   # Force performance mode + disable git/colors/accessibility
```

**Recommended for Users:**
- **Large workspaces (1000+ files)**: Enable `performanceMode: true` in settings
- **Memory-constrained systems**: Set `EXPLORER_DATES_MEMORY_SHEDDING=1` before launching VS Code
- **Codespaces/Dev Containers/Embedded**: Combine both shedding and lightweight: `EXPLORER_DATES_MEMORY_SHEDDING=1 EXPLORER_DATES_LIGHTWEIGHT_MODE=1 code .`

### Documentation
- Updated README with memory optimization details and env var usage
- ARCHITECTURE.md now documents pooling, flyweight caching, and memory shedding implementation
- New section in SETTINGS_GUIDE.md for advanced memory tuning (Feature Flags)

### Breaking Changes
- None. All memory optimizations are transparently internal; pooling/flyweights work without user configuration changes.

### Known Limitations
- Pooling provides greatest benefit in normal cached workloads; forced-bypass scenarios (diagnostic testing only) show minimal overhead
- Memory shedding is a safety guardrail for pathological zero-delay scenarios; typical usage with 5+ ms delays between updates doesn't trigger it
- Lightweight mode sacrifices visual features (colors, Git info) in exchange for 24% memory reduction; recommended only for resource-constrained environments

---

## 1.2.4 - Color & Stability Hotfix

### Color Scheme Regression _(fixes [#30](https://github.com/incredincomp/explorer-dates/issues/30))_
- Restored the custom color scheme so the theme integration’s adaptive pipeline respects user-defined `explorerDates.customColor.*` entries again instead of falling back to grayscale decorations.
- Ensured cache refreshes no longer temporarily drop colors when the Explorer repaint coincides with the theme-aware color resolver.

### Virtual Resource Safety _(fixes [#31](https://github.com/incredincomp/explorer-dates/issues/31))_
- Ignore VS Code’s virtual URIs (webviews, settings editor, PR lists, etc.) instead of trying to `stat` them, eliminating ENOENT spam and avoiding decoration crashes when the explorer hosts non-file entries.
- Treat missing files as a benign cache miss so background refreshes or recently deleted files no longer emit critical error logs.

## 1.2.3 - Performance Mode

### Minimal Resource Mode _(fixes [#21](https://github.com/incredincomp/explorer-dates/issues/21))_
- Added `performanceMode` setting to reduce CPU and memory usage for large projects or low-resource systems
- When enabled, disables resource-intensive features:
  - File system watching for automatic updates (manual refresh still available)
  - Git blame operations and author information
  - Progressive loading and background batch processing
  - Status bar integration
  - Advanced caching layers (uses simple memory cache only)
  - Color schemes and visual enhancements
  - File size display calculations
  - Verbose logging (reduces console output)
- Full date/time information remains available in tooltips on hover
- Recommended for users experiencing high CPU usage, laptop fan noise, or working with very large workspaces

### Badge Freshness & Accuracy _(fixes [#20](https://github.com/incredincomp/explorer-dates/issues/20) & [#19](https://github.com/incredincomp/explorer-dates/issues/19))_
- Added a configurable `badgeRefreshInterval` that periodically clears caches and forces VS Code to re-request decorations so badge text stays current even during long sessions.
- Introduced `tests/test-periodic-refresh.js` to simulate the timer, verify cache clears, and ensure timers dispose correctly.
- Hardened badge formatting to treat future-dated filesystem timestamps as “just updated,” eliminating the `-1` regression on skewed clocks.

### Custom Color Workflow _(fixes [#17](https://github.com/incredincomp/explorer-dates/issues/17))_
- Registered `explorerDates.customColor.*` theme color IDs so VS Code can apply user-defined colors when `colorScheme: "custom"` is selected.
- Added the `Explorer Dates: Apply Custom Colors` helper that copies the correct `workbench.colorCustomizations` snippet or opens Settings directly.
- Updated README and SETTINGS_GUIDE with a dedicated “Custom Colors Configuration” walkthrough.

### Keyboard Shortcut Safety _(fixes [#18](https://github.com/incredincomp/explorer-dates/issues/18))_
- Moved the `Debug Cache Performance` shortcut to `Ctrl+Shift+M` / `Cmd+Shift+M` so we no longer conflict with VS Code’s build command (`Ctrl+Shift+B`).
- Updated docs and troubleshooting guides with the new binding.

### User Experience
- Performance mode can be toggled at runtime without restarting VS Code
- Automatically disables file watcher and reinitializes when mode is changed
- Clear documentation in README about when to use performance mode and what gets disabled

## 1.2.2 - Workspace Exclusion Reliability

### Automatic Profile Cleanup
- Smart Exclusion Manager now deduplicates every workspace profile at startup and quietly persists the trimmed list, preventing `.vscode/settings.json` from ballooning with repeated entries.
- Existing installs are cleaned in-place before any new suggestions run, so users who already had hundreds of redundant exclusions immediately regain a tidy configuration.

### Smarter Suggestions
- When Explorer Dates auto-detects new heavy folders it adds only the delta, informs you once, and lets you keep, review, or revert those exclusions without re-adding everything on the next reload.
- Workspace-level exclusion saves are now idempotent and skip pointless writes when nothing changed, removing the repeated prompts you were seeing on every reload.

## 1.2.1 - Web Stability Hotfix

### Web Decorations
- Normalized URI handling so VS Code for Web workspaces no longer require `fsPath`, restoring Explorer decorations on `vscode.dev`, `github.dev`, and other browser hosts.
- Simplified exclusion logic to use the same URI helper, ensuring cached badges refresh correctly regardless of scheme.

### Git Notice Reliability
- The Git feature warning now awaits storage writes and schedules the info toast without blocking activation, preventing configuration initialization from hanging after install.

## 1.2.0 - Configuration Validation & Progressive Loading

### Feature Gating & Extensibility Controls
- `enableWorkspaceTemplates`, `enableReporting`, `enableExtensionApi`, and `allowExternalPlugins` now actively gate the managers, commands, and exported APIs that rely on them so locked-down workspaces can fully disable optional systems.
- Public API exports and plugin hooks check the new toggles at runtime to prevent accidental access when organizations need a hardened configuration.

### Reporting Accuracy & Retention
- Reporting flows now respect every `reportFormats` selection and embed `timeTrackingIntegration` metadata for downstream tools.
- Historical activity caches are trimmed automatically according to `activityTrackingDays`, keeping bundle sizes small while still providing useful analytics snapshots.

### Progressive Loading Warm-up
- When `progressiveLoading` is true, the decoration provider now stages background batches so large workspaces see warm Explorer badges without blocking VS Code startup.
- Added configuration listeners to ensure the warm-up queue shuts down cleanly when the feature is disabled mid-session.

### VS Code for Web Support
- Added a dedicated browser bundle (served via `dist/extension.web.js`) plus a normalized file-system adapter so Explorer Dates runs inside `vscode.dev`, `github.dev`, and other web-backed workspaces.
- Template exports/imports fall back to download prompts, persistent cache/onboarding data migrates to `globalState`, and Git-locked commands stay hidden automatically in sandboxed environments.

### Workspace Templates
- Built-in workspace templates point to the real Explorer Dates setting keys/values instead of placeholders, so exports/imports stay accurate across machines.
- Template exports include the new gating toggles so teams can share hardened presets confidently.

### Configuration Verification Tooling
- Added `npm run test:config` (backed by `tests/verify-config.js`) to ensure every contributed setting is referenced in code/docs before publishing.
- Extended `tests/exercise-flows.js` and bundle tests to cover the new gating paths so regressions are caught prior to packaging.
- Introduced `tests/test-feature-gates.js` plus a consolidated `npm test` workflow that runs linting, configuration coverage, feature-gate activation scenarios, flow exercises, and bundle sanity checks with one command before release.

## 1.1.0

### Major Configuration Improvements
- **Fixed Configuration Conflicts**: Consolidated conflicting timestamp format settings into a single, comprehensive `dateDecorationFormat` option
- **Enhanced Display Options**: New format options including smart, relative-short, relative-long, absolute-short, and absolute-long
- **File Size Display**: New option to show file size alongside modification dates (e.g., '5m|~1K') with visual distinction from time badges
- **Advanced Color Schemes**: Replaced basic color coding with flexible color schemes (none, recency, subtle, vibrant)

### New Features
- **Context Menu Integration**: Added "Copy File Date" and "Show File Details" to Explorer context menu
- **Keyboard Shortcuts**: Quick toggle for decorations with Ctrl+Shift+D (Cmd+Shift+D on Mac)
- **Enhanced Commands**: New commands for toggling decorations, copying file dates, and showing detailed file information
- **Hover Mode**: Optional setting to only show decorations on file hover (reduces visual clutter)
- **Fade Old Files**: New option to fade decorations for files older than specified threshold (1-365 days)
- **Advanced Visual Control**: Fine-tune visual clutter with hover and fade options
- **Git Integration**: Show commit author initials alongside file dates (e.g., "5m•JD")
- **File-Type Color Coding**: Color decorations based on file extensions
- **Custom Color Schemes**: Define your own colors for different file ages
- **Complete Enhancement Implementation**: All Priority 1 suggestions from enhancement roadmap

### Improved User Experience
- **Better Settings Organization**: Clearer setting descriptions and better categorization
- **More Intuitive Defaults**: Smart defaults that work well for most users
- **Enhanced File Size Formatting**: Auto-format (1.2KB, 3.4MB) with manual override options
- **Improved Context Menu**: Seamlessly integrated with VS Code's native Explorer context menu

### Bug Fixes
- **Fixed Badge Length Issue**: Resolved VS Code badge validation errors by enforcing 2-character limit on all badges
- **Updated Documentation**: Corrected format examples to reflect VS Code's 2-character badge limitation
- **Fixed Quick Setup Presets**: Corrected configuration presets to use formats that work within badge limits
- Fixed conflicting configuration options that could cause inconsistent behavior
- Improved error handling for file access issues
- Better memory management for large workspaces

### Performance & Bundle Optimization
- **38% Smaller Bundle Size**: Optimized from 284KB to 175KB through intelligent bundling
- **Lazy Loading**: Large modules load only when needed, improving startup time
- **Tree Shaking**: Unused code automatically removed from bundle
- **Production Optimization**: Selective minification and dead code elimination
- **Memory Management**: Advanced caching with size limits and automatic cleanup

### Developer Experience
- **Enhanced Logging**: More detailed debug information for troubleshooting
- **Performance Metrics**: Better tracking of extension performance and cache usage
- **Code Organization**: Improved code structure and documentation
- **Professional Bundling**: esbuild configuration with development/production modes


## 1.0.3
- Added file creation date display alongside modification dates
- Integrated Git blame to show the user who last modified the file (when in a Git repository)
- Enhanced hover tooltips with detailed information:
  - Exact timestamps with timezone information
  - Both creation and modification dates
  - Git author information (name, email, and date)


## 1.0.2
Restarted Changelog to clear past project version information.

## 1.0.1
Bumped package.json: "eslint": "^9.37.0"

## 1.0.0 - Initial release
