# Changelog

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
