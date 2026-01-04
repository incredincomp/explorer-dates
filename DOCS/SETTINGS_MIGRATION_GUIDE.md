# Settings Migration & Upgrade Guide

This guide helps users migrate settings between Explorer Dates versions and understand deprecated/renamed configuration options.

## Current Migration Status

### Automatic Migrations (No Action Required)

#### 1. Reporting Settings (v1.2.0+)
- **Legacy Setting**: `explorerDates.enableReporting`
- **New Setting**: `explorerDates.enableExportReporting`
- **Migration**: Automatic fallback (no user action required)
- **Status**: Legacy setting still works but is deprecated

#### 2. Custom Colors (v1.1.0+)
- **Legacy Setting**: `explorerDates.customColors` (object)
- **New Setting**: `workbench.colorCustomizations` (VS Code standard)
- **Migration**: Use command `Explorer Dates: Apply Custom Colors`
- **Status**: Legacy setting deprecated with warning

### Settings Requiring Manual Migration

#### 1. Feature Flags (v1.3.0+)
Several new feature flags were added to reduce bundle size. Check these settings:

```json
{
  "explorerDates.enableOnboardingSystem": true,        // ~34KB chunk
  "explorerDates.enableExportReporting": true,         // ~17KB chunk  
  "explorerDates.enableAnalysisCommands": true,        // ~8KB chunk
  "explorerDates.enableAdvancedCache": true,           // ~5KB chunk
  "explorerDates.enableWorkspaceIntelligence": true,   // ~12KB chunk
  "explorerDates.enableWorkspaceTemplates": true,      // ~14KB chunk
  "explorerDates.enableExtensionApi": true,            // ~15KB chunk
  "explorerDates.enableProgressiveAnalysis": null      // Auto-detect WASM indexing
}
```

**Progressive Analysis (v1.3.0+)**:
- Controls WASM-accelerated file indexing for large workspaces
- `null` (default): Automatically enables for workspaces with >10,000 files
- `true`: Force-enable progressive analysis (uses more memory but faster)
- `false`: Disable progressive analysis (lower memory, slower for large repos)

**Action**: Review and disable features you don't use to reduce memory usage.

#### 2. Performance Profiles (v1.2.5+)
New performance tuning options:

```json
{
  "explorerDates.featureLevel": "auto",              // New: adaptive optimization
  "explorerDates.smartFileWatching": true,          // New: intelligent file watching
  "explorerDates.maxTrackedActivityFiles": 3000,    // New: memory guardrail
  "explorerDates.smartExclusions": true             // Enhanced exclusion logic
}
```

**Action**: Leave as defaults unless you have specific performance needs.

## Migration Workflows

### Upgrading from v1.0.x to v1.3.x

1. **Check Deprecated Settings**:
   - Open VS Code Settings UI
   - Search for "explorerDates"
   - Look for yellow warning icons indicating deprecated settings

2. **Run Migration Helper**:
   ```
   Command Palette → Explorer Dates: Migrate Settings
   ```

3. **Verify Feature Flags**:
   - Check that features you use are enabled
   - Disable features you don't need to reduce bundle size

4. **Update Custom Colors** (if used):
   ```
   Command Palette → Explorer Dates: Apply Custom Colors
   ```

### Upgrading from v0.x to v1.x

1. **Enable New Features**:
   - Git integration: `"explorerDates.showGitInfo": "author"`
   - File sizes: `"explorerDates.showFileSize": true`
   - Smart caching: `"explorerDates.persistentCache": true`

2. **Check Performance**:
   - Large workspaces may benefit from `"explorerDates.featureLevel": "enhanced"`
   - Enable `"explorerDates.smartFileWatching": true` for better performance

## Setting Validation & Cleanup

### Validate Current Configuration

Run this command to check for issues:
```
Command Palette → Explorer Dates: Validate Configuration
```

This checks for:
- Deprecated settings with suggested replacements
- Invalid values (out of range, incorrect types)
- Conflicting settings
- Missing required configuration

### Clean Up Legacy Settings

To remove deprecated settings from your configuration:

1. **Automatic Cleanup**:
   ```
   Command Palette → Explorer Dates: Clean Legacy Settings
   ```

2. **Manual Cleanup**:
   Open `settings.json` and remove:
   - `explorerDates.customColors` (use `workbench.colorCustomizations`)
   - `explorerDates.enableReporting` (use `explorerDates.enableExportReporting`)

## Team/Workspace Migrations

### Sync Settings Across Team

1. **Use Workspace Templates**:
   ```
   Command Palette → Explorer Dates: Save Template
   Template Name: "Team Standard"
   Description: "Standard team configuration for Explorer Dates"
   ```

2. **Export/Import Configuration**:
   ```
   Command Palette → Explorer Dates: Export Configuration
   Command Palette → Explorer Dates: Import Configuration
   ```

3. **Version Control Integration**:
   Add to `.vscode/settings.json`:
   ```json
   {
     "explorerDates.templateSyncPath": ".vscode/explorer-dates-templates/",
     "explorerDates.enableWorkspaceTemplates": true
   }
   ```

### Workspace-Level vs User-Level Settings

**Recommended Workspace Settings** (`.vscode/settings.json`):
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart", 
  "explorerDates.excludedPatterns": [
    "**/node_modules/**",
    "**/build/**",
    "**/dist/**"
  ],
  "explorerDates.showGitInfo": "author"
}
```

**Recommended User Settings**:
```json
{
  "explorerDates.colorScheme": "recency",
  "explorerDates.accessibilityMode": false,
  "explorerDates.keyboardNavigation": true,
  "explorerDates.showWelcomeOnStartup": false
}
```

## Troubleshooting Migration Issues

### Settings Not Taking Effect

1. **Reload Window**:
   ```
   Command Palette → Developer: Reload Window
   ```

2. **Check Scope Conflicts**:
   - User settings may override workspace settings
   - Use Settings UI to see which scope is active

3. **Validate JSON**:
   - Ensure `settings.json` is valid JSON
   - Check for trailing commas or syntax errors

### Performance Issues After Upgrade

1. **Check Feature Level**:
   ```json
   {
     "explorerDates.featureLevel": "enhanced"  // Try less aggressive than "full"
   }
   ```

2. **Enable Performance Mode**:
   ```json
   {
     "explorerDates.performanceMode": true
   }
   ```

3. **Review Exclusions**:
   ```
   Command Palette → Explorer Dates: Analyze Excluded Files
   ```

### Lost Configuration After Upgrade

1. **Restore from Template**:
   ```
   Command Palette → Explorer Dates: Load Template
   ```

2. **Check Settings Backup**:
   - VS Code automatically backs up settings
   - Check: `~/.vscode/settings.json.backup`

3. **Reset to Defaults**:
   ```
   Command Palette → Explorer Dates: Reset to Defaults
   ```

## Advanced Migration Scenarios

### CI/CD Environment Setup

For automated deployments:

```bash
# Environment variables for headless setup
export EXPLORER_DATES_PERFORMANCE_MODE=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
export EXPLORER_DATES_MEMORY_SHEDDING=1
```

### Docker/Container Migration

```dockerfile
# In Dockerfile
ENV EXPLORER_DATES_PERFORMANCE_MODE=1
ENV EXPLORER_DATES_DISABLE_GIT_FEATURES=1
```

### Multi-Root Workspace Handling

Each workspace root can have different settings:
```json
{
  "folders": [
    { "path": "./frontend" },
    { "path": "./backend" }
  ],
  "settings": {
    "explorerDates.excludedPatterns": [
      "**/node_modules/**",
      "**/target/**"
    ]
  }
}
```

## Version-Specific Changes

### v1.3.0 Changes
- Added feature flag system
- Improved memory management
- Enhanced onboarding system
- Web/browser bundle support

### v1.2.0 Changes  
- Deprecated `enableReporting` → `enableExportReporting`
- Added progressive loading
- Enhanced workspace templates
- Configuration validation

### v1.1.0 Changes
- Deprecated `customColors` → `workbench.colorCustomizations`
- Added Git integration
- Performance optimizations

## Support & Resources

- **GitHub Issues**: https://github.com/incredincomp/explorer-dates/issues
- **Settings Reference**: See `DOCS/SETTINGS_GUIDE.md`
- **Troubleshooting**: See `DOCS/TROUBLESHOOTING.md`
- **Architecture**: See `DOCS/ARCHITECTURE.md`

## Migration Checklist

- [ ] Run `Explorer Dates: Validate Configuration`
- [ ] Update deprecated settings
- [ ] Test functionality after migration  
- [ ] Clean up legacy settings
- [ ] Update team documentation
- [ ] Verify performance is acceptable
- [ ] Save working configuration as template