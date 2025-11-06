# Changelog

## 1.2.0

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

### Developer Experience
- **Enhanced Logging**: More detailed debug information for troubleshooting
- **Performance Metrics**: Better tracking of extension performance and cache usage
- **Code Organization**: Improved code structure and documentation

## 1.1.0

### Performance Optimization
- Added configurable folder and pattern exclusions for better performance with large projects
- Implemented intelligent cache size management with automatic cleanup
- Added configurable cache timeout (5-300 seconds)
- Added performance metrics tracking (cache hit rate, total decorations, errors)
- Optimized file system operations with better exclusion patterns

### Accessibility
- Added high-contrast mode support for improved visibility
- Enhanced screen reader compatibility with descriptive tooltips
- Uses native VS Code decorations for full keyboard navigation support

### Localization
- Added support for 6 languages: English, Spanish, French, German, Japanese, Chinese
- Auto-detection of VS Code's display language
- Localized time badges and user-facing messages

### Error Handling & Debugging
- Comprehensive logging system with dedicated output channel
- User-friendly error messages throughout the extension
- New command: "Show Performance Metrics" to view cache statistics
- New command: "Open Logs" to access debug information
- Automatic error recovery for inaccessible files

### Other Improvements
- Migrated to ESLint 9 configuration
- Enhanced configuration options with better defaults
- Improved code documentation and structure
## 1.0.3
- Added file creation date display alongside modification dates
- Integrated Git blame to show the user who last modified the file (when in a Git repository)
- Enhanced hover tooltips with detailed information:
  - Exact timestamps with timezone information
  - Both creation and modification dates
  - Git author information (name, email, and date)
## 1.1.0

### Added
- **Customizable Time Badge Format**: New `timeBadgeFormat` setting to choose between short (`5m`) or long (`5 mins`) format
- **Color-Coding Based on Recency**: New `enableColorCoding` setting to color-code files by modification time:
  - Green: Files modified within the last hour
  - Yellow: Files modified within the last day
  - Red: Files modified more than a day ago
- **Toggle Timestamp Format**: New `timestampFormat` setting to switch between relative (`5m ago`) and absolute (`October 12, 2025`) timestamps
- Enhanced configuration documentation in README

### Changed
- Updated README to remove all emojis
- Improved configuration section with detailed examples

## 1.0.2
Restarted Changelog to clear past project version information.

## 1.0.1
Bumped package.json: "eslint": "^9.37.0"

## 1.0.0 - Initial release
