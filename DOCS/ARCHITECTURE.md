# Architecture Documentation

## Overview

Explorer Dates is a VS Code extension that displays file modification dates as decorations in the Explorer sidebar. This document outlines the architecture and key components of version 1.3.0, including the module federation system that powers chunking, feature gating, and bundle optimization.

## Module Federation & Chunking (v1.3.0)

Version 1.3.0 splits non-essential subsystems into lazy chunks so teams can disable unused capabilities and ship a ~99KB core bundle. Each chunk is gated by a setting or runtime trigger, and the feature flag loader handles dynamic imports for both desktop and web builds.

### Chunk Inventory

| Chunk / Feature | Approx Size | Setting or Trigger | Notes |
|-----------------|-------------|--------------------|-------|
| Onboarding assets | ~23KB | `enableOnboardingSystem` + onboarding wizard commands | Webview HTML/CSS/JS templates load only when the setup wizard, feature tour, or “What’s New” surfaces. Inline templates remain as fallbacks if the chunk fails. |
| Export & reporting | ~17KB | `enableExportReporting` | Powers CSV/JSON exports, analytics panels, and scheduled summaries. Disable for minimal installations that just need Explorer decorations. |
| Workspace templates & team config | ~14KB | `enableWorkspaceTemplates` | Includes profile storage, conflict resolution, and synchronization helpers. Required for team JSON profiles and preset management. |
| Extension API | ~15KB | `enableExtensionApi` or an external consumer requesting the API | Provides `ExtensionApiManager`, plugin wiring, and command exports. Dynamically instantiated so users without integrations save bundle weight. |
| Workspace intelligence | ~12KB | `enableWorkspaceIntelligence` (auto-disabled in performance mode) | Packages the incremental indexer + smart exclusion manager. Skipped entirely for lightweight installs or repos without workspace folders. |
| Incremental workers | ~8–10KB + WASM | `enableProgressiveAnalysis` (auto for large/extreme workspaces) | Hosts WASM digest computation and worker thread/WebWorker scaffolding. Loaded only when progressive analysis is on. |
| Batch processor | ~7KB | `progressiveLoading` + performance mode | Moves the BatchProcessor into its own chunk so low-power installs can skip progressive decoration warmups entirely. |
| Git insights | ~13KB | `showGitInfo !== "none"` or `badgePriority === "author"` | Contains blame parsing, git cache management, and WASM digest helpers. Invisible for time-only or size-only badges. |
| On-demand analysis commands | ~8KB | `enableAnalysisCommands` | Adds diagnostics/quick pick tooling surfaced via command palette. |
| Advanced cache | ~5KB | `enableAdvancedCache` | Provides the optional persistent cache and slimmed serialization helpers. |
| Incremental workers + workspace intelligence combo | ~19KB + 12KB | `enableIncrementalWorkers`/`enableProgressiveAnalysis` with smart exclusions | When both are enabled the indexer pulls in worker hosts and smart exclusion heuristics; otherwise they stay dormant. |

### Chunk Loading Flow

- `featureFlags.js` registers default loaders for every chunk via `registerDefaultLoaders()`, ensuring tests and CLI scripts work even when the federation resolver is absent. Loaders first consult the runtime resolver, then fall back to dev sources, `dist/chunks/*`, and finally Node’s filesystem loader.  
- Production builds call `setFeatureChunkResolver()` so lazy imports resolve through the module federation runtime in both Node.js and web bundles.  
- Each chunk loader performs early exits based on configuration (for example, `extensionApi()` returns `null` when `enableExtensionApi` is false, progressive analysis skips worker creation unless enabled, and git insights never initialize when `showGitInfo` is `'none'`).  
- Performance mode and lightweight environment variables cascade into the loader layer, skipping heavy chunks such as workspace intelligence, batch processing, and incremental workers altogether.

### Chunk-Specific Notes

- **Batch Processor Dynamic Chunking** – The progressive loading BatchProcessor is lazy-loaded via `_loadBatchProcessorIfNeeded()`. Builds emit `dist/chunks/batchProcessor.js`, saving ~7KB whenever `progressiveLoading` is disabled or performance mode is active. Fallbacks cover dev source imports and error recovery.  
- **Extension API Chunk** – `extension.js` requests the chunk only when `explorerDates.enableExtensionApi` is true and someone accesses the API. The chunk exports `ExtensionApiManager` plus a factory to wire `context.subscriptions`, keeping installations without integrations lightweight.  
- **Workspace Intelligence Chunk** – Groups `IncrementalIndexer` and `SmartExclusionManager` under a unified `WorkspaceIntelligenceManager`. Initialization occurs during advanced systems startup and is skipped when performance mode or the feature flag disables the subsystem.  
- **Git Insights Gating** – Author badges and git-powered tooltips trigger `gitInsights-chunk.js`, which houses `GitInsightsManager`, cache plumbing, and worker integration. Configurations that set `showGitInfo: "none"` and time/size badge priorities never load git code, saving ~13KB and avoiding git detection work.  
- **Incremental Workers Chunk** – Progressive analysis flips on-demand worker hosts driven by `enableProgressiveAnalysis` (auto-enabling for large/extreme workspaces when the setting is `null`). Disposal routines tear workers down when feature level changes.  
- **Onboarding Assets Chunk** – Webview assets (HTML/CSS/JS) move into `onboarding-assets-chunk.js`, reducing the core bundle by ~23KB. The onboarding manager gracefully falls back to inline HTML when chunk loading fails so the UX still works offline.  
- **Default Loaders for Federation** – Development scripts and tests rely on the default loaders declared in `featureFlags`, so importing feature helpers “just works” without manually seeding chunk resolvers. Production resolvers override the defaults automatically once federation initializes.

### Testing & Guardrails

- **Preset & Chunk UI flows** – `test-preset-ui-flows.js` and `test-quickpick-regressions.js` exercise the preset comparison wizard, browse flows, chunk status quick picks, and bundle savings math.  
- **Restart batching** – `test-restart-batching.js` covers debounce timers, queued restart prompts, and command execution so configuration changes don’t spam reload notifications.  
- **Workspace detection heuristics** – `test-workspace-detection-heuristics.js` validates remote/web environment detection, project markers, and edge cases that influence automatic progressive analysis decisions.  
- **Onboarding asset chunking, incremental worker gating, and git insights gating** – Dedicated chunk tests verify lazy imports, fallback paths, configuration plumbing, and bundle reporting, ensuring each chunk remains loadable and optional.


## Core Components

### 1. FileDateDecorationProvider (`src/fileDateDecorationProvider.js`)

The main provider class that implements VS Code's `FileDecorationProvider` API.

**Key Responsibilities:**
- Provides date decorations for files in the Explorer
- Manages layered caching (memory + persistent advanced cache) to minimize file system operations
- Handles file system watching and a configurable periodic refresh loop so badges stay accurate during long sessions
- Applies exclusion rules to avoid decorating unwanted files
- Enforces VS Code's 2-character badge limit with automatic truncation and defensive handling of skewed filesystem timestamps

**Performance Features (v1.2.5):**
- **Decoration Pooling**: Reusable `FileDecoration` instances keyed by `{badge, themeColor, tooltip}` eliminate per-request allocations (99.9% cache hit rate)
- **Flyweight String Caching**: Capped FIFO caches for badge strings and readable timestamps prevent transient allocations:
  - Badge flyweight (2,048 entries): Caches formatted dates like `5m`, `2h`, `3d`
  - Readable flyweight (2,048 entries): Caches full tooltip text indexed by time bucket
- **Intelligent cache with configurable timeout and size limits**
- Optional persistent cache layer (AdvancedCache) with slimmed structure (single Map vs double-Map layout)
- Configurable periodic refresh (`badgeRefreshInterval`) that clears caches on a timer and re-requests decorations
- Performance metrics tracking (cache hits/misses, git/file stat timings, total decorations, errors, pool statistics)
- Batch processing support through VS Code's decoration API and progressive loading warm-up jobs
- `performanceMode` switch that suspends file watchers, git blame, advanced caches, progressive loading, and visual embellishments for low-resource environments
- **Memory Shedding** (Opt-in): Adaptive guardrail that monitors heap usage and stretches refresh intervals / shrinks cache when memory pressure builds
- **Lightweight Mode** (Opt-in): Environment variable `EXPLORER_DATES_LIGHTWEIGHT_MODE=1` forces `performanceMode` and disables Git, colors, accessibility

**Memory Optimization Details:**
```javascript
// Decoration pooling
this._decorationPool = new Map(); // keyed by {badge, themeColor, tooltipKind}
// Example entry: {badge, themeColor, tooltip} → vscode.FileDecoration instance

// Flyweight string caches
this._badgeFlyweight = new FixedSizeCache(2048); // badges like '5m', '2h'
this._readableFlyweight = new FixedSizeCache(2048); // tooltips by time bucket

// Timer deduplication
this._scheduledRefreshPending = false;
// Prevents accumulation of scheduled refresh timers

// Smart cache refresh
_markCacheEntryForRefresh(key) {
  // Only force refresh if >75% through TTL, eliminating 99.95% of unnecessary file stats
}
```

**Configuration Integration:**
- Reads user settings for exclusion patterns, color schemes, and accessibility options
- Supports high-contrast mode and custom color IDs (`explorerDates.customColor.*`) supplied via `workbench.colorCustomizations`
- Respects locale settings for date formatting
- Responds to runtime configuration changes (toggle performance mode, change refresh intervals, swap badge formats) without requiring a VS Code reload

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
- `performanceMode`: Minimal mode that keeps tooltip data but disables heavy subsystems
- `badgeRefreshInterval`: Interval (10s–10m) for clearing caches and forcing a refresh
- `excludedFolders`: Array of folder names to skip
- `excludedPatterns`: Glob patterns for file exclusion
- `cacheTimeout`: Cache entry lifetime (5-300 seconds)
- `maxCacheSize`: Maximum cached decorations (100-50000)

### Appearance Settings
- `showDateDecorations`: Master enable/disable switch
- `dateDecorationFormat`: smart/relative/absolute
- `colorScheme`: none/recency/file-type/subtle/vibrant/custom
- `highContrastMode`: Enhanced visibility for accessibility
- `showFileSize`: Adds compact size indicators, optionally prioritized via `badgePriority`
- `workbench.colorCustomizations`: VS Code setting that supplies actual hex values for `explorerDates.customColor.*`

### Localization
- `locale`: Language selection (auto/en/es/fr/de/ja/zh)

### Debugging
- `enableLogging`: Enable detailed logging

## Performance Considerations

### Caching Strategy (v1.2.5)
1. Cache lookup on every decoration request (memory cache, optional persistent cache)
2. Return cached value if within timeout period
3. Fetch fresh data from file system if cache miss or expired
4. Store in cache with timestamp (and persist if AdvancedCache is enabled)
5. Periodic cleanup when cache exceeds size limit
6. Optional periodic refresh timer clears caches on an interval so decoration requests restart with fresh data

### Decoration Pooling (v1.2.5)
The `_decorationPool` maintains reusable `FileDecoration` instances keyed by `{badge, themeColor, tooltip}`:
- **Typical Scenario**: 8-20 unique decoration instances per session (99.9% hit rate)
- **Benefit**: Eliminates allocation churn; reduces 2000 iterations of zero-delay stress from 28.68 MB → 0.53 MB heap delta
- **Flyweight Integration**: Pooling works with flyweight string caches to keep both allocation and GC overhead minimal

### Flyweight String Caching (v1.2.5)
Two capped FIFO caches (2,048 entries each) prevent transient string allocations:
- **Badge Flyweight**: Caches formatted dates like `5m`, `2h`, `3d`, `1w`, etc.
  - Keyed by time bucket (e.g., `badge:smart:h:2` for "2 hours")
  - FIFO eviction when cache fills
- **Readable Flyweight**: Caches tooltip text for full date descriptions
  - Keyed by time bucket and format type
  - Removes per-iteration string churn (~16 KB → <1 KB per iteration)

### Advanced Cache Slimming (v1.2.5)
The `AdvancedCache` now uses a single `Map<key, entry>` with compact metadata:
- **Before**: Double-Map layout (value Map + separate metadata Map)
- **After**: Single entry object with compact keys (`ts`, `la`, `sz`, `ttl`, `tg`, `v`)
- **Savings**: ~40% reduction in per-entry memory overhead
- **Persistence**: Hydration/serialization uses compact form for both memory and disk storage

### Memory Shedding (v1.2.5)
Adaptive guardrail controlled via `EXPLORER_DATES_MEMORY_SHEDDING=1`:
- Monitors heap usage during idle periods via `performance.getHeapStatistics()`
- Triggers when heap delta exceeds threshold (default 3 MB, tunable via `EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB`)
- Actions when triggered:
  - Stretches decoration refresh intervals (default 60s, tunable via `EXPLORER_DATES_MEMORY_SHED_REFRESH_MS`)
  - Shrinks cache size limit (default 1000, tunable via `EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT`)
- **Benefit**: Automatically protects against zero-delay pathological scenarios without impacting normal usage (5+ ms delays)
- **Safety**: Fallback operates normally with standard caching if feature unavailable

### Lightweight Mode (v1.2.5)
Optional lightweight mode via `EXPLORER_DATES_LIGHTWEIGHT_MODE=1`:
- Disables Git blame operations and author information
- Disables theme color customizations
- Disables accessibility adornments
- Keeps basic date/time tooltips
- **Benefit**: 24% additional memory reduction (0.53 MB → 0.39 MB in stress tests)
- **Trade-off**: Visual features and Git info not available
- **Best for**: Codespaces, embedded systems, resource-constrained environments

### File Exclusions
Two-level exclusion system:
1. **Folder-based**: Skip entire directories (node_modules, .git, etc.)
2. **Pattern-based**: Glob patterns for fine-grained control

### Optimization Techniques
- Early return for excluded files (minimal overhead)
- Cancellation token support for long-running operations
- Only decorate files, not directories
- Batch refresh on configuration changes
- Configurable periodic refresh loop (`badgeRefreshInterval`) proactively refreshes caches
- Progressive loading queue warms Explorer decorations without blocking startup
- Performance mode disables heavy systems entirely when users only need hover tooltips

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
1. Additional locales and localized docs
2. Custom date format tokens once VS Code lifts the 2-character badge constraint
3. Richer reporting/visualizations surfaced directly in VS Code webviews
4. Auto-detected performance presets per workspace (based on size, hardware, or remote host)

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

- **1.2.5**: Decoration pooling, flyweight string caching, memory shedding (opt-in), lightweight mode (opt-in), advanced cache slimming, 95% memory reduction in stress tests
- **1.2.4**: Custom color scheme regression fix, virtual/webview resource guards
- **1.2.3**: Performance mode, periodic badge refresh, custom color IDs, keyboard shortcut updates
- **1.1.0**: Performance, accessibility, localization, and debugging features
- **1.0.2**: Changelog cleanup
- **1.0.1**: ESLint update
- **1.0.0**: Initial release with basic decoration support
