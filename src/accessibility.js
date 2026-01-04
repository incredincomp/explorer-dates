const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const { getLocalization } = require('./utils/localization');
const { getFileName } = require('./utils/pathUtils');
const { getSettingsCoordinator } = require('./utils/settingsCoordinator');

/**
 * Accessibility Manager for enhanced keyboard navigation and screen reader support
 */
class AccessibilityManager {
    constructor() {
        this._logger = getLogger();
        this._l10n = getLocalization();
        this._settings = getSettingsCoordinator();
        this._isAccessibilityMode = false;
        this._keyboardNavigationEnabled = true;
        this._focusIndicators = new Map();
        this._configurationWatcher = null;
        
        // Load configuration
        this._loadConfiguration();
        
        // Setup configuration change listener
        this._setupConfigurationListener();
        
        this._logger.info('AccessibilityManager initialized', {
            accessibilityMode: this._isAccessibilityMode,
            keyboardNavigation: this._keyboardNavigationEnabled
        });
    }

    /**
     * Load accessibility configuration
     */
    _loadConfiguration() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        // Don't auto-detect accessibility mode unless explicitly enabled
        this._isAccessibilityMode = config.get('accessibilityMode', false);
        
        // Only auto-enable accessibility if user explicitly has screen reader support on
        // AND the accessibility mode isn't explicitly set to false
        if (!config.has('accessibilityMode') && this._detectScreenReader()) {
            // Only suggest, don't force
            this._logger.info('Screen reader detected - consider enabling accessibility mode in settings');
        }
        
        this._keyboardNavigationEnabled = config.get('keyboardNavigation', true);
    }

    /**
     * Setup configuration change listener
     */
    _setupConfigurationListener() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.accessibilityMode') ||
                e.affectsConfiguration('explorerDates.keyboardNavigation')) {
                this._loadConfiguration();
                this._logger.debug('Accessibility configuration updated', {
                    accessibilityMode: this._isAccessibilityMode,
                    keyboardNavigation: this._keyboardNavigationEnabled
                });
            }
        });
    }

    /**
     * Get accessibility-optimized tooltip
     */
    getAccessibleTooltip(filePath, mtime, ctime, fileSize, gitInfo = null) {
        if (!this._isAccessibilityMode) {
            return null; // Use default tooltip
        }

        const fileName = getFileName(filePath);
        const readableModified = this._formatAccessibleDate(mtime);
        const readableCreated = this._formatAccessibleDate(ctime);
        
        // Create structured, screen reader friendly tooltip
        let tooltip = `File: ${fileName}. `;
        tooltip += `Last modified: ${readableModified}. `;
        tooltip += `Created: ${readableCreated}. `;
        
        if (fileSize !== undefined) {
            tooltip += `Size: ${this._formatAccessibleFileSize(fileSize)}. `;
        }
        
        if (gitInfo && gitInfo.authorName) {
            tooltip += `Last modified by: ${gitInfo.authorName}. `;
        }
        
        tooltip += `Full path: ${filePath}`;
        
        return tooltip;
    }

    /**
     * Format date in screen reader friendly way
     */
    _formatAccessibleDate(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Use full words for screen readers
        if (diffMins < 1) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        } else {
            // Use full date format
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Format file size in screen reader friendly way
     */
    _formatAccessibleFileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} bytes`;
        }
        
        const kb = bytes / 1024;
        if (kb < 1024) {
            const rounded = Math.round(kb);
            return `${rounded} kilobytes`;
        }
        
        const mb = kb / 1024;
        const rounded = Math.round(mb * 10) / 10;
        return `${rounded} megabytes`;
    }

    /**
     * Get accessibility-optimized badge text
     */
    getAccessibleBadge(originalBadge) {
        if (!this._isAccessibilityMode) {
            return originalBadge;
        }

        // For accessibility mode, provide more descriptive badges
        // Screen readers will read these more naturally
        
        // Extract time and size components
        const parts = originalBadge.split('|');
        const timePart = parts[0];
        const sizePart = parts[1];
        const gitPart = parts.length > 2 ? parts[2] : null;

        let accessibleBadge = this._expandTimeAbbreviation(timePart);
        
        if (sizePart) {
            accessibleBadge += ` ${this._expandSizeAbbreviation(sizePart)}`;
        }
        
        if (gitPart) {
            accessibleBadge += ` by ${gitPart.replace('•', '')}`;
        }

        return accessibleBadge;
    }

    /**
     * Expand time abbreviations for screen readers
     */
    _expandTimeAbbreviation(timePart) {
        // Convert abbreviated formats to full words
        const expansions = {
            'm': ' minutes ago',
            'h': ' hours ago',
            'd': ' days ago',
            'w': ' weeks ago',
            'mo': ' months ago',
            'yr': ' years ago',
            'min': ' minutes ago',
            'hrs': ' hours ago',
            'day': ' days ago',
            'wk': ' weeks ago'
        };

        let expanded = timePart;
        for (const [abbrev, full] of Object.entries(expansions)) {
            if (timePart.endsWith(abbrev)) {
                const number = timePart.slice(0, -abbrev.length);
                expanded = number + full;
                break;
            }
        }

        return expanded;
    }

    /**
     * Expand size abbreviations for screen readers
     */
    _expandSizeAbbreviation(sizePart) {
        if (!sizePart.startsWith('~')) return sizePart;
        
        const sizeValue = sizePart.slice(1); // Remove ~
        
        if (sizeValue.endsWith('B')) {
            return sizeValue.slice(0, -1) + ' bytes';
        } else if (sizeValue.endsWith('K')) {
            return sizeValue.slice(0, -1) + ' kilobytes';
        } else if (sizeValue.endsWith('M')) {
            return sizeValue.slice(0, -1) + ' megabytes';
        }
        
        return sizeValue;
    }

    /**
     * Create focus indicator for keyboard navigation
     */
    createFocusIndicator(element, description) {
        if (!this._keyboardNavigationEnabled) return null;

        const focusId = Math.random().toString(36).substr(2, 9);
        this._focusIndicators.set(focusId, {
            element,
            description,
            timestamp: Date.now()
        });

        return {
            id: focusId,
            dispose: () => {
                this._focusIndicators.delete(focusId);
            }
        };
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message, priority = 'polite') {
        if (!this._isAccessibilityMode) return;

        // Use VS Code's notification system which is accessible
        if (priority === 'assertive') {
            vscode.window.showWarningMessage(message);
        } else {
            // For polite announcements, we could use a custom ARIA live region
            // but VS Code doesn't provide direct access to this
            this._logger.debug('Screen reader announcement', { message, priority });
        }
    }

    /**
     * Get keyboard shortcut help
     */
    getKeyboardShortcutHelp() {
        const shortcuts = [
            {
                key: 'Ctrl+Shift+D (Cmd+Shift+D)',
                command: 'Toggle date decorations',
                description: 'Show or hide file modification times in Explorer'
            },
            {
                key: 'Ctrl+Shift+C (Cmd+Shift+C)',
                command: 'Copy file date',
                description: 'Copy selected file\'s modification date to clipboard'
            },
            {
                key: 'Ctrl+Shift+I (Cmd+Shift+I)',
                command: 'Show file details',
                description: 'Display detailed information about selected file'
            },
            {
                key: 'Ctrl+Shift+R (Cmd+Shift+R)',
                command: 'Refresh decorations',
                description: 'Refresh all file modification time decorations'
            },
            {
                key: 'Ctrl+Shift+A (Cmd+Shift+A)',
                command: 'Show workspace activity',
                description: 'Open workspace file activity analysis'
            },
            {
                key: 'Ctrl+Shift+F (Cmd+Shift+F)',
                command: 'Toggle fade old files',
                description: 'Toggle fading effect for old files'
            }
        ];

        return shortcuts;
    }

    /**
     * Show keyboard shortcuts help dialog
     */
    async showKeyboardShortcutsHelp() {
        const shortcuts = this.getKeyboardShortcutHelp();

        await vscode.window.showInformationMessage(
            'Keyboard shortcuts help available in output panel',
            'Show Shortcuts'
        ).then(action => {
            if (action === 'Show Shortcuts') {
                // Create output channel for detailed help
                const outputChannel = vscode.window.createOutputChannel('Explorer Dates Shortcuts');
                outputChannel.appendLine('Explorer Dates Keyboard Shortcuts');
                outputChannel.appendLine('=====================================');
                outputChannel.appendLine('');
                shortcuts.forEach(shortcut => {
                    outputChannel.appendLine(`${shortcut.key}`);
                    outputChannel.appendLine(`  Command: ${shortcut.command}`);
                    outputChannel.appendLine(`  Description: ${shortcut.description}`);
                    outputChannel.appendLine('');
                });
                outputChannel.show();
            }
        });
    }

    /**
     * Check if accessibility features should be enhanced
     */
    shouldEnhanceAccessibility() {
        return this._isAccessibilityMode || this._detectScreenReader();
    }

    /**
     * Detect if screen reader is likely being used
     */
    _detectScreenReader() {
        // VS Code provides some accessibility detection
        // This is a simplified check - in reality, VS Code handles most screen reader detection
        const config = vscode.workspace.getConfiguration('editor');
        return config.get('accessibilitySupport') === 'on';
    }

    /**
     * Get accessibility recommendations
     */
    getAccessibilityRecommendations() {
        const recommendations = [];
        
        if (this._detectScreenReader()) {
            recommendations.push({
                type: 'setting',
                setting: 'explorerDates.accessibilityMode',
                value: true,
                reason: 'Enable enhanced tooltips and screen reader optimizations'
            });
            
            recommendations.push({
                type: 'setting',
                setting: 'explorerDates.colorScheme',
                value: 'none',
                reason: 'Colors may not be useful with screen readers'
            });
            
            recommendations.push({
                type: 'setting',
                setting: 'explorerDates.dateDecorationFormat',
                value: 'relative-long',
                reason: 'Longer format is more descriptive for screen readers'
            });
        }
        
        const theme = vscode.window.activeColorTheme;
        if (theme.kind === vscode.ColorThemeKind.HighContrast) {
            recommendations.push({
                type: 'setting',
                setting: 'explorerDates.highContrastMode',
                value: true,
                reason: 'Optimize for high contrast themes'
            });
        }
        
        return recommendations;
    }

    /**
     * Apply accessibility recommendations
     */
    async applyAccessibilityRecommendations() {
        const recommendations = this.getAccessibilityRecommendations();
        
        if (recommendations.length === 0) {
            vscode.window.showInformationMessage('No accessibility recommendations at this time.');
            return;
        }
        
        let appliedCount = 0;
        
        for (const rec of recommendations) {
            if (rec.type === 'setting') {
                try {
                    await this._settings.updateSetting(rec.setting, rec.value, {
                        scope: 'user',
                        reason: 'accessibility-recommendation'
                    });
                    appliedCount++;
                    this._logger.info(`Applied accessibility recommendation: ${rec.setting} = ${rec.value}`);
                } catch (error) {
                    this._logger.error(`Failed to apply recommendation: ${rec.setting}`, error);
                }
            }
        }
        
        if (appliedCount > 0) {
            vscode.window.showInformationMessage(
                `Applied ${appliedCount} accessibility recommendations. Restart may be required for all changes to take effect.`
            );
        }
    }

    /**
     * Dispose accessibility manager
     */
    dispose() {
        this._focusIndicators.clear();
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        this._logger.info('AccessibilityManager disposed');
    }
}

module.exports = { AccessibilityManager };
