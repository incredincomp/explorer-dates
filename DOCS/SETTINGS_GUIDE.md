# Explorer Dates - Complete Settings Guide

This guide documents every setting and recommended configuration for Explorer Dates. It includes examples for the extension's practical badge strategy (2‑character visual limit) and an optional diagnostic you can run to confirm behavior on your environment.

## Quick Setup Guide

### Basic Settings (Most Users)
1. **Enable/Disable Decorations**
   - Setting: `explorerDates.showDateDecorations`
   - Default: `true`

2. **Date Format**
   - Setting: `explorerDates.dateDecorationFormat`
   - Options: `smart`, `relative-short`, `relative-long`, `absolute-short`, `absolute-long`
   - Default: `smart`
   - Examples:
     - `relative-short`: `5m`, `2h`, `3d`, `1w`
     - `smart`: mixes short relative where appropriate (`5m`, `2h`) and short absolute month tokens for older items (`Oc`, `Se`)
     - `absolute-short`: short tokens for month/day (truncated to fit 2 chars)
   - **Note**: Visual tokens are truncated to fit the Explorer badge; full dates appear in tooltips.

### Badge Length & Priority

- VS Code enforces a practical 2-character limit for Explorer badges across platforms. Explorer Dates enforces this by truncating visual badges to 2 characters to avoid layout or rendering rejections.
- Tooltip and accessibility text always contain the full date/size/commit information regardless of what appears visually.

**Badge Priority Setting**
- Setting: `explorerDates.badgePriority`
- Options: `time`, `author`, `size`
- Default: `time`

Behavior:
- `time`: Shows the time-based token (e.g., `5m`, `2h`) as the visual badge.
- `author`: Uses author initials (up to 2 chars) as the visual badge when Git author info is available; otherwise falls back to `time`.
- `size`: When `showFileSize` is enabled, uses a compact size token (e.g., `5K`, `2M`, or `12`) as the visual badge; otherwise falls back to `time`.

Examples (visual badge only — actual tooltip contains full info):
- `time`: `5m`
- `author`: `JD` (for "Jane Doe")
- `size`: `5K` (compact kilobytes)

Compact size formatting examples:
- `512` bytes → `512` (fits in 2 chars? fallback to `51` or `512` depending on format; extension uses a 2-char compact fallback)
- `1,200` bytes → `1K` or `12` (display chooses the clearest 2-char representation)
- `2,400,000` bytes → `2M`

### Visual & Accessibility Settings

- `explorerDates.colorScheme` — `none`, `recency`, `file-type`, `subtle`, `vibrant`, `custom`
- `explorerDates.highContrastMode` — `true`/`false` — toggles high-contrast color choices and accessibility text improvements
- The extension always supplies an accessibility-friendly text string for screen readers combining full date, author (if any), and size.

#### Custom Colors Configuration

To use custom colors with Explorer Dates, you need to:

1. **Set the color scheme to custom**:
   ```json
   "explorerDates.colorScheme": "custom"
   ```

2. **Define your custom colors in workbench.colorCustomizations**:
   ```json
   "workbench.colorCustomizations": {
     "explorerDates.customColor.veryRecent": "#FF6095",
     "explorerDates.customColor.recent": "#E72969",
     "explorerDates.customColor.old": "#CCCCCC"
   }
   ```

3. **Or use the built-in command**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run `Explorer Dates: Apply Custom Colors`
   - Choose "Copy to Clipboard" or "Open Settings"

**Color Categories**:
- `explorerDates.customColor.veryRecent` — Files modified within 1 hour
- `explorerDates.customColor.recent` — Files modified within 1 day  
- `explorerDates.customColor.old` — Files modified more than 1 day ago

**Example Configuration**:
```json
{
  "explorerDates.colorScheme": "custom",
  "workbench.colorCustomizations": {
    "explorerDates.customColor.veryRecent": "#00ff00",
    "explorerDates.customColor.recent": "#ffaa00",
    "explorerDates.customColor.old": "#888888"
  }
}
```

**Note**: The old `explorerDates.customColors` setting is deprecated. Use `workbench.colorCustomizations` instead for proper theme integration and full hex color support.

### Git Integration
- `explorerDates.showGitInfo` — `none`, `author`, `both`
- `author` shows initials in tooltip and optionally in the visual badge when `badgePriority` is set to `author`.

### Performance Settings
- `explorerDates.performanceMode`
- `explorerDates.badgeRefreshInterval`
- `explorerDates.excludedFolders`
- `explorerDates.excludedPatterns`
- `explorerDates.cacheTimeout`
- `explorerDates.maxCacheSize`

(See in-file examples and recommended profiles at the bottom of this doc.)

#### Performance Mode

- Setting: `explorerDates.performanceMode`
- Default: `false`
- Purpose: Disable every optional subsystem (file watching, Git blame, status bar, progressive loading, advanced cache, color schemes, file size calculations, verbose logging) while keeping basic hover tooltips.
- Ideal for: Large monorepos, Codespaces/remote setups, battery-sensitive devices, or anyone who only needs quick hover info.
- Behavior: Can be toggled live. When turning **on**, file watchers and periodic refresh timers are disposed; when turning **off**, they are reinstated immediately.

Recommended snippet for resource-constrained workspaces:

```json
{
  "explorerDates.performanceMode": true,
  "explorerDates.showGitInfo": "none",
  "explorerDates.showFileSize": false
}
```

#### Badge Refresh Interval

- Setting: `explorerDates.badgeRefreshInterval`
- Default: `60000` (1 minute)
- Range: `10000` – `600000` milliseconds
- Purpose: Controls how often Explorer Dates clears caches and re-requests decorations to keep relative badges (`5m`, `2h`, etc.) accurate while VS Code stays open.
- Guidance:
  - Lower values (10s–30s) keep badges hyper-fresh but require more decoration recomputation.
  - Higher values (2–10 min) are lighter on CPU but may show older relative timestamps until the next refresh.
- When `performanceMode` is `true`, the periodic timer is paused entirely.

## Advanced Memory Tuning (v1.2.5)

Explorer Dates includes several memory optimizations and tuning options for advanced users and resource-constrained environments.

### Default Memory Optimizations (Transparent)

These features are enabled by default and require no configuration:

1. **Decoration Pooling**
   - Reuses `FileDecoration` objects instead of allocating new ones per decoration request
   - Reduces allocation churn by 94-95% in typical workloads
   - Cache hit rate: 99.9%
   - Zero user-facing changes—optimizations are entirely internal

2. **Flyweight String Caching**
   - Efficient caching for badge strings (`5m`, `2h`, etc.) and tooltips
   - Eliminates per-iteration transient allocations
   - Two capped FIFO caches (2,048 entries each)
   - Automatically evicts old entries when full

3. **Advanced Cache Slimming**
   - Compact storage for persistent cache entries
   - 40% reduction in per-entry memory overhead vs. prior structure
   - Better disk serialization efficiency

### Optional Memory Features

For users with very large workspaces (1000+ files) or memory-constrained systems:

#### Memory Shedding (Opt-in)

Enable adaptive memory guardrail:
```bash
export EXPLORER_DATES_MEMORY_SHEDDING=1
code .
```

**Configuration:**
```bash
# Trigger threshold in MB (default: 3, range: 1-5)
export EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=2

# Cache size limit when shedding is active (default: 1000 entries)
export EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT=500

# Minimum refresh interval when shedding is active (default: 60000 ms = 1 minute)
export EXPLORER_DATES_MEMORY_SHED_REFRESH_MS=120000
```

**How it works:**
- Monitors heap usage during idle periods
- When heap delta exceeds threshold, automatically:
  - Stretches decoration refresh intervals to reduce recomputation
  - Shrinks cache size to reduce memory footprint
- Falls back to normal caching if threshold not exceeded
- Useful for pathological zero-delay scenarios and large monorepos

**Recommended for:**
- Workspaces with 1000+ files
- Codespaces or containerized environments
- Systems with <4GB RAM
- Remote development with bandwidth constraints

#### Lightweight Mode (Opt-in)

Force performance-focused profile with additional savings:
```bash
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
code .
```

**What gets disabled:**
- Git blame operations and author information
- Theme color customizations
- Accessibility adornments
- File size calculations
- Decoration pooling/flyweight caches (auto-purged every few hundred decorations to keep Node 18 heaps below CI thresholds)

**What remains:**
- Basic date/time tooltips
- Explorer decorations
- Keyboard shortcuts

**Benefits:**
- 24% additional memory reduction in stress scenarios
- Faster initialization for large workspaces
- Lower CPU overhead

**Recommended for:**
- Resource-constrained embedded systems
- Battery-sensitive environments
- Scenarios where only date/time info is needed

#### Combined Memory Optimization

For maximum memory efficiency (e.g., Codespaces with limited resources):

```bash
export EXPLORER_DATES_MEMORY_SHEDDING=1
export EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
code .
```

**Expected heap delta:** ~0.25 MB (54-65% reduction from baseline)

### Memory Benchmark Summary (v1.2.5)

All tests run with 2000 iterations at 0ms delay (extreme stress scenario):

| Configuration | Heap Delta | Improvement | Status |
|---------------|-----------|------------|--------|
| Baseline (before v1.2.5) | 28.68 MB | – | ❌ Over budget |
| Default (pooling + flyweights) | 0.53 MB | 95% | ✅ Pass |
| With memory shedding | 0.54 MB | 95% | ✅ Pass |
| With lightweight mode | 0.39 MB | 98% | ✅ Pass |
| Both features combined | ~0.25 MB | 99% | ✅ Pass |

Production usage (600 iterations, 5ms delay): **4.68 MB** heap delta (excellent baseline)

### Verification

To verify memory optimizations are working:

1. **View Performance Metrics**:
   - Command: `Explorer Dates: Show Performance Metrics`
   - Shows decoration pool statistics, cache hit rates, flyweight cache sizes

2. **Check Memory Usage**:
   - Open Task Manager (Windows) or Activity Monitor (Mac)
   - Monitor memory usage while opening large workspaces
   - Compare with/without `EXPLORER_DATES_MEMORY_SHEDDING=1`

3. **Enable Logging**:
   ```json
   "explorerDates.enableLogging": true
   ```
   - Open Command Palette → `Explorer Dates: Open Logs`
   - Look for decoration pool hit/miss ratios and memory shedding events

## Diagnostic: Verify Badge Acceptance (Optional)

Because visual badge acceptance can vary by platform and VS Code build, Explorer Dates includes a small diagnostic you can run locally to help capture how your VS Code instance handles badges of varying lengths.

1. Add this command snippet to `extension.js` (inside `activate(context)`) — it registers a temporary command you can run from the Command Palette:

```js
// Add near other command registrations in [extension.js](http://_vscodecontentref_/5)
const vscode = require('vscode');

function registerBadgeDiagnostics(context, provider) {
  const cmd = 'explorerDates.diagnostics.checkBadgeLengths';
  const disposable = vscode.commands.registerCommand(cmd, async () => {
    const channel = vscode.window.createOutputChannel('Explorer Dates Diagnostics');
    channel.show(true);
    channel.appendLine('Explorer Dates Diagnostics — checking badge lengths...');
    channel.appendLine('NOTE: Open Help → Toggle Developer Tools → Console to capture any rejection/warning messages from the Extension Host.');

    // A list of test badges to emit via a temporary provider
    const testBadges = ['', 'A', 'AB', 'ABC', '12', '123'];
    channel.appendLine('Test badges: ' + testBadges.join(', '));
    channel.appendLine('Registering temporary decoration provider and triggering refresh...');

    // Create a temporary provider that returns decorations for the first few workspace files
    const tmpProvider = {
      onDidChangeFileDecorations: new vscode.EventEmitter().event,
      provideFileDecoration(uri) {
        // Calculate an index to choose a test badge (use file name hash)
        const name = uri.path.split('/').pop() || uri.path;
        const idx = Math.abs(name.split('').reduce((s,c)=>s*31 + c.charCodeAt(0), 7)) % testBadges.length;
        const badge = testBadges[idx];
        channel.appendLine(`Providing badge "${badge}" for ${name}`);
        return new vscode.FileDecoration(badge || undefined, `Diagnostics for badge="${badge}"`, undefined);
      }
    };

    const reg = vscode.window.registerFileDecorationProvider(tmpProvider);
    channel.appendLine('Temporary provider registered. Open Explorer to force decorations to render.');
    channel.appendLine('When done, run "explorerDates.diagnostics.clearBadgeDiagnostics" to unregister the provider.');

    // Register a cleanup command
    const cleanupCmd = 'explorerDates.diagnostics.clearBadgeDiagnostics';
    const cleanup = vscode.commands.registerCommand(cleanupCmd, () => {
      reg.dispose();
      cleanup.dispose();
      channel.appendLine('Temporary diagnostic provider unregistered.');
    });
    context.subscriptions.push(reg, cleanup);
  });

  context.subscriptions.push(disposable);
}
```
