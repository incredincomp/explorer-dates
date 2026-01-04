# Explorer Dates - v1.3.0 Upgrade & Configuration Guide

This guide helps users understand and manage Explorer Dates settings across different versions, with emphasis on automatic migration and proper configuration.

## 🆕 What’s New in v1.3.0

### Module Federation Architecture
Explorer Dates v1.3.0 introduces a revolutionary module federation system:
- **Base bundle reduced** from 267KB to ~99KB core + 281KB optional chunks
- **Feature gating** - disable unused features to save up to 36% bundle size
- **Dynamic loading** - features load only when needed
- **Cross-platform optimization** - dedicated Node.js and web bundles

### Team Configuration System
New collaborative features for development teams:
- **Team configuration profiles** - share standardized settings
- **Conflict resolution** - intelligent merging of team vs user preferences
- **Export/Import** - JSON-based configuration sharing with validation
- **Real-time sync** - file watching for team configuration updates

### Enhanced Performance & Reliability
- **40+ comprehensive test suites** covering all extension aspects
- **Graceful degradation** when chunks fail to load
- **Memory optimization** retained from v1.2.5 with additional improvements
- **Advanced diagnostics** for configuration and performance troubleshooting

## 🛠️ Breaking Changes & Migration

### Minimum Requirements
- **VS Code 1.105.0+** (up from 1.90.0)
- **Node.js compatibility** maintained for all supported VS Code versions
- **Web compatibility** enhanced with dedicated browser bundle

### Automatic Migration Features

#### Settings Migration
The following settings are automatically migrated:

```json
// v1.2.x → v1.3.0 automatic migrations
{
  "explorerDates.enableReporting": true,           // → enableExportReporting
  "explorerDates.customColors": {...},             // → workbench.colorCustomizations  
  "explorerDates.enableApi": true                  // → enableExtensionApi
}
```

#### New Feature Flags (Default: enabled for compatibility)
```json
{
  "explorerDates.enableOnboardingSystem": true,     // Welcome flows (~34KB)
  "explorerDates.enableExportReporting": true,      // Reports & analytics (~17KB)
  "explorerDates.enableWorkspaceTemplates": true,   // Templates & team config (~14KB)
  "explorerDates.enableExtensionApi": true,         // Third-party integration (~15KB)
  "explorerDates.enableAdvancedCache": true,        // Cache optimizations (~5KB)
  "explorerDates.enableAnalysisCommands": true,     // Diagnostics (~8KB)
  "explorerDates.enableWorkspaceIntelligence": true, // Smart features (~12KB)
  "explorerDates.enableIncrementalWorkers": false   // Background workers (~19KB)
}
```

### Manual Migration Steps

#### Step 1: Update VS Code
Ensure you have VS Code 1.105.0 or later:
1. Go to `Help` → `About` (or `Code` → `About` on Mac)
2. Check version number
3. Update if needed: `Help` → `Check for Updates`

#### Step 2: Review Feature Flags
After upgrading, review which features you need:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run `Explorer Dates: Show Chunk Status`
3. Disable unused features to optimize bundle size

#### Step 3: Configure Team Settings (Optional)
If working in a team environment:
1. Run `Explorer Dates: Configure Team Profiles`
2. Set up shared configurations for your team
3. Export/import team profiles as needed

#### Step 4: Optimize Bundle Size
To minimize extension size:
1. Run `Explorer Dates: Optimize Bundle Size`
2. Review recommendations and disable unused features
3. Consider your specific use case:
   - **Minimal setup**: Disable onboarding + reporting + templates
   - **Team setup**: Keep templates enabled, disable onboarding
   - **Development setup**: Keep analysis commands, disable reporting

## 🎨 Quick Start for New Users

### Step 1: Initial Setup
1. **Install Explorer Dates** from the VS Code marketplace
2. **Run the setup wizard**: Press `Ctrl+Shift+P` and run `Explorer Dates: Quick Setup`
3. **Choose a preset**:
   - **Minimal**: Basic time badges only  
   - **Developer**: Git info + file sizes + color coding
   - **Accessible**: High contrast + screen reader support

### Step 2: Verify Installation
- Open the Explorer panel in VS Code
- You should see time badges (e.g., `5m`, `2h`) next to files
- Hover over files to see detailed tooltips

### Step 3: Customize (Optional)
- Press `Ctrl+,` to open Settings
- Search for "Explorer Dates" 
- Adjust colors, formats, and features as needed

## Prerequisites

### VS Code Version Requirement
**Explorer Dates v1.3.0 requires VS Code 1.105.0 or later.**

To check your VS Code version:
1. Go to `Help` → `About` (or `Code` → `About` on Mac)
2. Look for the version number
3. Update VS Code if needed: `Help` → `Check for Updates`

**Note**: Teams using older VS Code builds will need to update before installing Explorer Dates v1.3.0.

## 🔄 Automatic Migration System

### What Gets Migrated Automatically (v1.3.0)

Explorer Dates automatically handles these migrations when you update:

#### 1. **Legacy Settings Migration**
- `enableReporting` → `enableExportReporting`
- `enableApi` → `enableExtensionApi`
- `customColors` → `workbench.colorCustomizations`
- Invalid configuration values are corrected automatically
- Deprecated settings are marked for removal (with user permission)

#### 2. **Feature Flag Initialization**
- New v1.3.0 feature flags are set to enabled by default
- Existing configurations are preserved and validated
- Invalid values are corrected with notifications
- Missing required settings are added with sensible defaults

#### 3. **Bundle Optimization Suggestions**
- Extension analyzes your actual feature usage
- Suggests which features can be safely disabled
- Provides bundle size impact estimates
- Offers one-click optimization for common scenarios

#### 4. **Team Configuration Detection**
- Automatically detects existing team configuration files
- Migrates legacy team templates to new format
- Validates team configurations for v1.3.0 compatibility
- Resolves conflicts between user and team settings

### Migration Process Flow

```
Extension Startup
│
├─ Detect v1.3.0 first run
│
├─ Load existing configuration
│
├─ Run automatic migrations
│   ├─ Rename legacy settings
│   ├─ Validate setting values
│   ├─ Initialize new feature flags
│   └─ Update workspace templates
│
├─ Show migration notifications
│   ├─ "Settings updated for compatibility"
│   ├─ "Bundle optimization available"
│   └─ "Team configuration detected"
│
└─ Complete initialization
```

### Migration Notifications

When settings are migrated, you'll see notifications like:

#### Successful Migration
> ✅ **Explorer Dates updated 3 setting(s) for v1.3.0 compatibility.** Your configuration has been preserved.
> 
> **[View Changes]** **[Open Settings]** **[Dismiss]**

#### Bundle Optimization Available
> 📦 **Bundle size can be reduced by 34%.** Consider disabling unused features.
> 
> **[Optimize Now]** **[Show Details]** **[Later]**

#### Team Configuration Detected
> 👥 **Team configuration found.** Apply team settings or keep current configuration?
> 
> **[Apply Team Settings]** **[Keep Current]** **[View Conflicts]**

### Manual Migration Commands

If you need to re-run migration processes:

- `Explorer Dates: Migrate Settings` - Re-run automatic migration
- `Explorer Dates: Validate Configuration` - Check for configuration issues  
- `Explorer Dates: Clean Legacy Settings` - Remove deprecated settings
- `Explorer Dates: Show Migration History` - View what was migrated

## 👥 Team Configuration Management (New in v1.3.0)

### Overview

Team Configuration allows development teams to share standardized Explorer Dates configurations while preserving individual user preferences.

### Key Features

#### **Team Profiles**
- Centralized configuration management
- JSON-based export/import with validation
- Version tracking and change history
- Conflict resolution when team settings clash with user preferences

#### **Collaboration Workflow**
```
Team Lead creates profile → Export to JSON → Team imports → Conflicts resolved → Standardized setup
```

### Setting Up Team Configuration

#### For Team Leads

1. **Configure optimal settings** for your team's workflow
2. **Create team profile**:
   ```
   Ctrl+Shift+P → "Explorer Dates: Save Team Profile"
   ```
3. **Export configuration**:
   ```
   Ctrl+Shift+P → "Explorer Dates: Export Team Configuration"
   ```
4. **Share the JSON file** with your team (via Git, shared drive, etc.)

#### For Team Members

1. **Receive team configuration** JSON file from team lead
2. **Import team profile**:
   ```
   Ctrl+Shift+P → "Explorer Dates: Import Team Configuration"
   ```
3. **Resolve any conflicts** between team and personal settings
4. **Apply team configuration** with selected merge strategy

### Conflict Resolution

When team configurations conflict with user settings:

#### **Merge Strategies**
- **Team Wins**: Use team settings, backup user settings
- **User Wins**: Keep user settings, ignore conflicting team settings
- **Merge**: Combine settings where possible, prompt for conflicts
- **Preview**: Show differences before applying changes

#### **Conflict Resolution UI**
```
Conflict Detected: "colorScheme"

User Setting:    "recency"
Team Setting:    "file-type"

Recommendation:  Use team setting for consistency

[ Use Team ] [ Keep User ] [ Preview Changes ]
```

### Team Configuration Commands

| Command | Purpose |
|---------|----------|
| `Explorer Dates: Create Team Profile` | Create new team configuration |
| `Explorer Dates: Edit Team Profile` | Modify existing team profile |
| `Explorer Dates: Export Team Configuration` | Export profile to JSON file |
| `Explorer Dates: Import Team Configuration` | Import profile from JSON file |
| `Explorer Dates: Validate Team Configuration` | Check configuration for issues |
| `Explorer Dates: Apply Team Configuration` | Apply team settings to current workspace |
| `Explorer Dates: Show Team Configuration Conflicts` | View conflicts between team and user settings |
| `Explorer Dates: Reset to Team Configuration` | Revert to original team settings |
| `Explorer Dates: Organize Settings` | Move Explorer Dates settings to the correct scope and tidy Explorer Dates workspace files (runs automatically when drift is detected) |

> **Automatic Housekeeping**  
> v1.3.0+ automatically runs the organizer during activation/migrations whenever it finds Explorer Dates keys stored at the wrong scope or out-of-order `.vscode/explorer-dates-*.json` files. Use `Explorer Dates: Organize Settings` or `npm run format:settings` if you need to run it manually (for example, after importing an older project or when automation is disabled).

### File Format

Team configuration files use this JSON structure:

```json
{
  "version": "1.3.0",
  "createdAt": "2026-01-03T23:00:00.000Z",
  "defaultProfile": "development-team",
  "profiles": {
    "development-team": {
      "name": "Development Team Standard",
      "description": "Standard configuration for development team",
      "settings": {
        "explorerDates.showDateDecorations": true,
        "explorerDates.colorScheme": "recency",
        "explorerDates.showFileSize": true,
        "explorerDates.showGitInfo": "author",
        "explorerDates.enableOnboardingSystem": false,
        "explorerDates.enableExportReporting": true
      },
      "conflicts": {
        "strategy": "merge",
        "allowUserOverrides": ["colorScheme", "showFileSize"]
      }
    }
  },
  "metadata": {
    "teamName": "Development Team",
    "author": "team-lead@company.com",
    "bundleSizeOptimization": true,
    "targetWorkspaceSize": "medium"
  }
}
```

### Best Practices

#### **For Teams**
- Start with minimal configuration, add features as needed
- Allow user overrides for personal preferences (colors, formats)
- Disable unused features to optimize bundle size
- Document the reasoning behind team configuration choices
- Regular review and updates of team configurations

#### **For Individual Users**
- Communicate with team leads before making significant changes
- Use user overrides for personal preferences
- Test team configurations in development environments first
- Provide feedback to team leads about configuration effectiveness

#### **Configuration Examples**

**Minimal Team Configuration:**
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.enableOnboardingSystem": false,
  "explorerDates.enableExportReporting": false,
  "explorerDates.enableWorkspaceTemplates": false
}
```

**Full-Feature Team Configuration:**
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.colorScheme": "recency",
  "explorerDates.showFileSize": true,
  "explorerDates.showGitInfo": "author",
  "explorerDates.enableContextMenu": true,
  "explorerDates.enableAdvancedCache": true
}
```

## Configuration Management

### Built-in Templates

Explorer Dates includes several configuration templates:

#### **Minimal Template**
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "relative-short",
  "explorerDates.colorScheme": "none", 
  "explorerDates.showFileSize": false,
  "explorerDates.showGitInfo": "none",
  "explorerDates.enableContextMenu": false
}
```

#### **Developer Template** 
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.colorScheme": "recency",
  "explorerDates.showFileSize": true,
  "explorerDates.showGitInfo": "author",
  "explorerDates.enableContextMenu": true,
  "explorerDates.showStatusBar": true
}
```

#### **Enterprise Template**
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart", 
  "explorerDates.colorScheme": "recency",
  "explorerDates.showFileSize": true,
  "explorerDates.showGitInfo": "author",
  "explorerDates.enableExportReporting": true,
  "explorerDates.smartExclusions": true,
  "explorerDates.persistentCache": true
}
```

### Managing Templates

#### **Save Your Configuration**
```
Command Palette → Explorer Dates: Save Template
```

#### **Load a Template**
```
Command Palette → Explorer Dates: Load Template
```

#### **Share with Team**
1. Set `explorerDates.templateSyncPath` to a shared location
2. Save template to that path
3. Team members can load the shared template

### Feature Flags & Bundle Optimization

Control which features are loaded to optimize performance:

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

**Important for teams upgrading from v1.2.x**:
- **Workspace Templates** (`enableWorkspaceTemplates`): If disabled, you lose the ability to save/load configuration presets and team synchronization
- **Extension API** (`enableExtensionApi`): If disabled, other extensions cannot integrate with Explorer Dates (affects compatibility)
- **Progressive Analysis** (`enableProgressiveAnalysis`): New setting that auto-enables WASM indexing for large workspaces

**Disable unused features** to reduce memory usage and startup time.

#### Progressive Analysis (New in v1.3.0)

The `enableProgressiveAnalysis` setting controls WASM-accelerated file indexing:

```json
{
  "explorerDates.enableProgressiveAnalysis": null  // Default: auto-detect
}
```

**Behavior**:
- `null` (default): Automatically enables for workspaces with >10,000 files
- `true`: Force-enable progressive analysis (uses more memory but faster indexing)
- `false`: Disable progressive analysis (lower memory usage, slower for large repos)

**When to configure manually**:
- **Force enable** (`true`): Large repositories where you want maximum performance
- **Force disable** (`false`): Memory-constrained environments or small workspaces
- **Auto-detect** (`null`): Let Explorer Dates decide based on workspace size (recommended)

#### Feature Impact Warnings for Teams

When upgrading from v1.2.x to v1.3.x, be aware of these feature dependencies:

**If you disable `enableWorkspaceTemplates`**:
- ❌ Cannot save/load configuration templates
- ❌ No team configuration synchronization
- ❌ Commands like `Save Template` and `Load Template` become unavailable
- ✅ Saves ~14KB of bundle size

**If you disable `enableExtensionApi`**:
- ❌ Other extensions cannot integrate with Explorer Dates
- ❌ No programmatic access to file date information
- ❌ Third-party tools cannot extend functionality
- ✅ Saves ~15KB of bundle size

**Recommendation**: Keep both enabled unless your team specifically doesn't use templates or extension integrations.

## Settings Validation & Troubleshooting

### Validate Your Configuration

Run this command to check for issues:
```
Command Palette → Explorer Dates: Validate Configuration
```

**Common issues detected:**
- Invalid enum values (wrong format types)
- Out-of-range numbers (cache sizes, timeouts)
- Conflicting settings
- Deprecated settings

### Fix Configuration Issues

#### **Automatic Fixes**
```
Command Palette → Explorer Dates: Migrate Settings
```

#### **Manual Cleanup**
```
Command Palette → Explorer Dates: Clean Legacy Settings
```

#### **Reset to Defaults**
```
Command Palette → Explorer Dates: Reset to Defaults
```

### Export/Import Configuration

#### **Export Your Settings**
```
Command Palette → Explorer Dates: Export Configuration
```
Choose to copy to clipboard or save to file.

#### **Import Team Settings**
1. Get configuration JSON from your team
2. Open VS Code Settings (JSON)
3. Merge the settings into your configuration

## Onboarding & Help System

### First-Time Setup

New users see the onboarding flow automatically:

1. **Welcome Message** with setup options
2. **Quick Setup Wizard** for common configurations  
3. **Feature Tour** explaining key capabilities

### Returning Users

When updating versions, users see:
- **What's New** panel highlighting new features
- **Migration History** showing what changed
- **Gentle notifications** for minor updates

### Disable Onboarding

To disable the welcome message:
```json
{
  "explorerDates.showWelcomeOnStartup": false
}
```

To disable the entire onboarding system:
```json
{
  "explorerDates.enableOnboardingSystem": false
}
```

## Performance Optimization

### Large Workspaces

For workspaces with 1000+ files:

```json
{
  "explorerDates.featureLevel": "enhanced",
  "explorerDates.smartFileWatching": true,
  "explorerDates.maxTrackedActivityFiles": 1000,
  "explorerDates.excludedPatterns": [
    "**/node_modules/**",
    "**/build/**", 
    "**/dist/**",
    "**/.next/**",
    "**/target/**"
  ]
}
```

### Performance Mode

For maximum performance (disables most features):
```json
{
  "explorerDates.performanceMode": true
}
```

### Memory Management

For memory-constrained environments:
```bash
export EXPLORER_DATES_MEMORY_SHEDDING=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
```

## Team & Workspace Configuration

### Recommended Settings Structure

#### **User Settings** (`settings.json`)
Personal preferences that don't affect functionality:
```json
{
  "explorerDates.colorScheme": "recency",
  "explorerDates.accessibilityMode": false,
  "explorerDates.showWelcomeOnStartup": false
}
```

#### **Workspace Settings** (`.vscode/settings.json`)
Project-specific configuration:
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.showGitInfo": "author",
  "explorerDates.excludedPatterns": [
    "**/node_modules/**",
    "**/build/**",
    "**/coverage/**"
  ]
}
```

> 💡 **Smart Exclusions Storage**: Auto-detected exclusion folders now live in `.vscode/explorer-dates-exclusions.json`. This workspace-local file (and any other `explorer-dates-*.json` you opt into) is automatically kept alphabetized so it can be safely committed for team-wide consistency.

### Synchronize Team Settings

1. **Create team template**:
   ```
   Command Palette → Explorer Dates: Save Template
   Template Name: "Team Standard"
   ```

2. **Set sync path** in workspace settings:
   ```json
   {
     "explorerDates.templateSyncPath": ".vscode/explorer-dates-templates/"
   }
   ```

3. **Commit template to version control**:
   ```bash
   git add .vscode/explorer-dates-templates/
   git commit -m "Add Explorer Dates team configuration"
   ```

4. **Team members load template**:
   ```
   Command Palette → Explorer Dates: Load Template → Team Standard
   ```

## Troubleshooting Common Issues

### Settings Not Working

1. **Reload window**: `Developer: Reload Window`
2. **Check scope**: User settings may override workspace settings
3. **Validate settings**: Run `Explorer Dates: Validate Configuration`
4. **Reset if needed**: Run `Explorer Dates: Reset to Defaults`

### Performance Issues

1. **Enable performance mode**:
   ```json
   {
     "explorerDates.performanceMode": true
   }
   ```

2. **Reduce feature level**:
   ```json
   {
     "explorerDates.featureLevel": "standard"
   }
   ```

3. **Check exclusions**:
   ```
   Command Palette → Explorer Dates: Analyze Excluded Files
   ```

### Migration Issues

1. **Re-run migration**:
   ```
   Command Palette → Explorer Dates: Migrate Settings
   ```

2. **Check migration history**:
   ```
   Command Palette → Explorer Dates: Show Migration History
   ```

3. **Clean legacy settings**:
   ```
   Command Palette → Explorer Dates: Clean Legacy Settings
   ```

## Advanced Configuration

### Custom Colors

1. **Set color scheme to custom**:
   ```json
   {
     "explorerDates.colorScheme": "custom"
   }
   ```

2. **Define custom colors**:
   ```json
   {
     "workbench.colorCustomizations": {
       "explorerDates.customColor.veryRecent": "#00ff00",
       "explorerDates.customColor.recent": "#ffaa00", 
       "explorerDates.customColor.old": "#888888"
     }
   }
   ```

3. **Or use the helper command**:
   ```
   Command Palette → Explorer Dates: Apply Custom Colors
   ```

### Environment Variables

For CI/CD or containerized environments:

```bash
# Enable performance mode
export EXPLORER_DATES_PERFORMANCE_MODE=1

# Disable Git features (for environments without Git)
export EXPLORER_DATES_DISABLE_GIT_FEATURES=1

# Enable memory management
export EXPLORER_DATES_MEMORY_SHEDDING=1
export EXPLORER_DATES_LIGHTWEIGHT_MODE=1
```

### Multi-Root Workspaces

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

## Support & Resources

### Getting Help

1. **Run diagnostics**:
   ```
   Command Palette → Explorer Dates: Run Diagnostics
   ```

2. **Check logs**:
   ```
   Command Palette → Explorer Dates: Open Logs
   ```

3. **View current config**:
   ```
   Command Palette → Explorer Dates: Show Current Configuration
   ```

### Documentation

- **Settings Reference**: `DOCS/SETTINGS_GUIDE.md`
- **Troubleshooting**: `DOCS/TROUBLESHOOTING.md`  
- **Migration Guide**: `DOCS/SETTINGS_MIGRATION_GUIDE.md`
- **Architecture**: `DOCS/ARCHITECTURE.md`

### Community & Support

- **GitHub Repository**: https://github.com/incredincomp/explorer-dates
- **Issue Tracker**: https://github.com/incredincomp/explorer-dates/issues
- **Feature Requests**: Use GitHub Issues with "enhancement" label

## Version-Specific Changes

### v1.3.0 (Released January 4, 2026)
- ✅ Automatic settings migration
- ✅ Enhanced onboarding system  
- ✅ Feature flag system for bundle optimization
- ✅ Web/browser bundle support
- ✅ Improved memory management
- ✅ Progressive analysis with WASM-accelerated indexing
- ⚠️ **Requires VS Code 1.105.0+**

### v1.2.0
- ✅ Configuration validation
- ✅ Workspace templates system
- ✅ Progressive loading
- ⚠️ Deprecated `enableReporting` → use `enableExportReporting`

### v1.1.0  
- ✅ Git integration
- ✅ Performance optimizations
- ⚠️ Deprecated `customColors` → use `workbench.colorCustomizations`

## Quick Reference

### Essential Commands
- `Explorer Dates: Quick Setup` - Initial configuration wizard
- `Explorer Dates: Validate Configuration` - Check for issues
- `Explorer Dates: Migrate Settings` - Update deprecated settings
- `Explorer Dates: Export Configuration` - Backup your settings
- `Explorer Dates: Reset to Defaults` - Start fresh

### Essential Settings
- `explorerDates.showDateDecorations` - Enable/disable the extension
- `explorerDates.dateDecorationFormat` - How dates appear
- `explorerDates.colorScheme` - Visual color coding
- `explorerDates.performanceMode` - Maximum performance
- `explorerDates.excludedPatterns` - What files to skip

### Keyboard Shortcuts
- `Ctrl+Shift+R` / `Cmd+Shift+R` - Refresh decorations
- `Ctrl+Shift+H` / `Cmd+Shift+H` - Run diagnostics  
- `Ctrl+Shift+I` / `Cmd+Shift+I` - Show file details
- `Ctrl+Shift+A` / `Cmd+Shift+A` - Show workspace activity
