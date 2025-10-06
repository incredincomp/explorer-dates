# Changelog

## 2.0.0 - Major rewrite

### Added
- **FileDecorationProvider integration**: Date decorations now appear directly in VS Code's built-in Explorer
- **Smart date formatting**: Clear, readable dates - recent files show relative time (e.g., "5min", "2hr"), older files show absolute dates
- **Intelligent caching**: Performance optimizations with 30-second TTL cache
- **File watching**: Automatic decoration updates when files change
- **Configurable formatting**: Choose between smart, relative, or absolute date formats
- **Refresh command**: Manual refresh option via Command Palette

### Changed
- **Complete architecture rewrite**: Replaced complex webview implementation with elegant FileDecorationProvider
- **Improved date readability**: No more confusing "1, 3m," format - now shows clear "5min", "2hr", "Oct 3" etc.
- **Simplified configuration**: Removed unused settings, focused on date decoration essentials
- **Better performance**: Lightweight decorations vs. heavy webview rendering

### Removed
- **Webview implementation**: Removed separate Explorer Plus panel/sidebar
- **File size calculations**: Focused purely on date information for better performance
- **Complex UI**: No more resizable columns, sorting, or separate tree views
- **Unused dependencies**: Cleaned up codebase significantly

### Fixed
- **Date format confusion**: Replaced unclear format with human-readable dates
- **Performance issues**: Eliminated webview overhead and resize bugs
- **UI complexity**: Simplified to elegant, non-intrusive decorations

## 0.0.1 - Initial release
