# Explorer Dates - Complete Settings Guide

## Quick Setup Guide

### Basic Settings (Most Users)
1. **Enable/Disable Decorations**
   - Setting: `explorerDates.showDateDecorations`
   - Default: `true`
   - Use: Turn date decorations on or off completely

2. **Date Format**
   - Setting: `explorerDates.dateDecorationFormat`
   - Options: `smart`, `relative-short`, `relative-long`, `absolute-short`, `absolute-long`
   - Default: `smart`
   - Examples:
     - `smart`: Recent files show "5m", older files show "Oct 12"
     - `relative-short`: Always "5m", "2h", "3d"
     - `relative-long`: Always "5min", "2hrs", "3day"
     - `absolute-short`: Always "Oct 12", "Mar 23"
     - `absolute-long`: Always "Oct 12", "Mar 23" (with year when needed)

### Visual Enhancements

3. **Color Schemes**
   - Setting: `explorerDates.colorScheme`
   - Options: `none`, `recency`, `file-type`, `subtle`, `vibrant`, `custom`
   - Description:
     - `none`: No colors
     - `recency`: Green (recent), Yellow (medium), Red (old)
     - `file-type`: Different colors for different file extensions
     - `subtle`: Subtle text color variations
     - `vibrant`: Bright, high-contrast colors
     - `custom`: Use colors defined in customColors setting
   - Default: `none`
   - Description:
     - `none`: No colors
     - `recency`: Green (recent), Yellow (medium), Red (old)
     - `subtle`: Subtle text color variations
     - `vibrant`: Bright, high-contrast colors

4. **File Size Display**
   - Setting: `explorerDates.showFileSize`
   - Default: `false`
   - Example: Shows "5m|~1K" instead of just "5m" (~ prefix distinguishes file size from time)
   
   - Size Format: `explorerDates.fileSizeFormat`
   - Options: `auto`, `bytes`, `kb`, `mb`
   - Default: `auto`

5. **High Contrast Mode**
   - Setting: `explorerDates.highContrastMode`
   - Default: `false`
   - Use: Better visibility for accessibility needs

6. **Hover Mode**
   - Setting: `explorerDates.showOnHover`
   - Default: `false`
   - Use: Only show decorations when hovering over files (reduces clutter)

7. **Fade Old Files**
   - Setting: `explorerDates.fadeOldFiles`
   - Default: `false`
   - Use: Fade decorations for files older than specified threshold
   
   - Threshold: `explorerDates.fadeThreshold`
   - Default: `30` days
   - Range: 1-365 days
   - Use: Set how old files must be before fading

8. **Git Integration**
   - Setting: `explorerDates.showGitInfo`
   - Options: `none`, `author`, `both`
   - Default: `none`
   - Description:
     - `none`: No Git information
     - `author`: Show commit author initials (e.g., "5m•JD")
     - `both`: Show modification time and commit info

9. **Custom Colors**
   - Setting: `explorerDates.customColors`
   - Type: Object with color properties
   - Default: `{"veryRecent": "#00ff00", "recent": "#ffff00", "old": "#ff0000"}`
   - Use: Define custom colors when colorScheme is set to "custom"

### Performance Settings

7. **Excluded Folders**
   - Setting: `explorerDates.excludedFolders`
   - Default: `["node_modules", ".git", "dist", "build", "out", ".vscode-test"]`
   - Use: Skip these folders to improve performance

8. **Excluded Patterns**
   - Setting: `explorerDates.excludedPatterns`
   - Default: `["**/*.tmp", "**/*.log", "**/.git/**", "**/node_modules/**"]`
   - Use: Skip files matching these patterns

9. **Cache Settings**
   - Cache Timeout: `explorerDates.cacheTimeout` (5000-300000ms, default: 30000)
   - Max Cache Size: `explorerDates.maxCacheSize` (100-50000 entries, default: 10000)

### Localization & Context Menu

10. **Language**
    - Setting: `explorerDates.locale`
    - Options: `auto`, `en`, `es`, `fr`, `de`, `ja`, `zh`
    - Default: `auto` (uses VS Code's language)

11. **Context Menu Integration**
    - Setting: `explorerDates.enableContextMenu`
    - Default: `true`
    - Adds "Copy File Date" and "Show File Details" to right-click menu

### Debugging

12. **Enable Logging**
    - Setting: `explorerDates.enableLogging`
    - Default: `false`
    - Use: Enable for troubleshooting issues

## Keyboard Shortcuts

- **Ctrl+Shift+D** (Cmd+Shift+D on Mac): Toggle date decorations on/off

## Commands (Ctrl/Cmd+Shift+P)

- **Explorer Dates: Refresh Date Decorations**: Manually refresh all decorations
- **Explorer Dates: Toggle Date Decorations**: Quick on/off toggle
- **Explorer Dates: Show Performance Metrics**: View cache statistics
- **Explorer Dates: Open Logs**: View debug logs
- **Explorer Dates: Copy File Date**: Copy file's modification date to clipboard
- **Explorer Dates: Show File Details**: Show detailed file information
- **Explorer Dates: Toggle Fade Old Files**: Quick toggle for fading old files

## Recommended Configurations

### For Large Projects (Performance Focus)
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.showFileSize": false,
  "explorerDates.colorScheme": "none",
  "explorerDates.cacheTimeout": 60000,
  "explorerDates.maxCacheSize": 5000,
  "explorerDates.excludedFolders": [
    "node_modules", ".git", "dist", "build", "out", 
    ".vscode-test", "coverage", ".next", "target"
  ]
}
```

### For Visual Users (Rich Display)
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.showFileSize": true,
  "explorerDates.fileSizeFormat": "auto",
  "explorerDates.colorScheme": "recency",
  "explorerDates.enableContextMenu": true
}
```

### For Minimal Clutter
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "relative-short",
  "explorerDates.showFileSize": false,
  "explorerDates.colorScheme": "none",
  "explorerDates.showOnHover": true,
  "explorerDates.fadeOldFiles": true,
  "explorerDates.fadeThreshold": 14
}
```

### For Accessibility
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "relative-long",
  "explorerDates.colorScheme": "subtle",
  "explorerDates.highContrastMode": true,
  "explorerDates.enableContextMenu": true
}
```

### For Focused Workflow (Minimal Distraction)
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.showFileSize": false,
  "explorerDates.colorScheme": "none",
  "explorerDates.fadeOldFiles": true,
  "explorerDates.fadeThreshold": 7,
  "explorerDates.showOnHover": false
}
```

### For Git-Focused Development
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.dateDecorationFormat": "smart",
  "explorerDates.showFileSize": true,
  "explorerDates.colorScheme": "file-type",
  "explorerDates.showGitInfo": "author",
  "explorerDates.enableContextMenu": true
}
```

## Troubleshooting

### Settings Not Appearing
1. Restart VS Code after installing the extension
2. Check VS Code Settings UI: search for "explorer dates"
3. Verify extension is enabled: Extensions → Explorer Dates

### Decorations Not Showing
1. Check `explorerDates.showDateDecorations` is `true`
2. Verify files aren't excluded by `excludedFolders` or `excludedPatterns`
3. Try "Explorer Dates: Refresh Date Decorations" command
4. Enable logging and check Output → Explorer Dates

### Performance Issues
1. Increase `excludedFolders` list for your project type
2. Reduce `maxCacheSize` if using too much memory
3. Increase `cacheTimeout` to cache longer
4. Disable `showFileSize` for better performance

### Context Menu Missing
1. Verify `explorerDates.enableContextMenu` is `true`
2. Right-click on files (not folders) in Explorer
3. Look in the "modification" section of the context menu

## Feature Requests & Feedback

With 50+ users, your feedback helps prioritize new features! Common requests being considered:

- **Workspace file activity dashboard**
- **Custom date format strings**
- **Integration with Git timeline**
- **Status bar file info**
- **Batch file operations**
- **Export file modification reports**

Submit issues and suggestions at: https://github.com/incredincomp/explorer-dates/issues