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
