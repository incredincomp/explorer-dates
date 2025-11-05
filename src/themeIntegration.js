const vscode = require('vscode');
const { getLogger } = require('./logger');

/**
 * Theme Integration Manager for automatic color adaptation and custom theme support
 */
class ThemeIntegrationManager {
    constructor() {
        this._logger = getLogger();
        this._currentThemeKind = vscode.window.activeColorTheme.kind;
        this._themeChangeListeners = [];
        
        // Setup theme change detection
        this._setupThemeChangeDetection();
        
        this._logger.info('ThemeIntegrationManager initialized', {
            currentTheme: this._getThemeKindName(this._currentThemeKind)
        });
    }

    /**
     * Setup theme change detection
     */
    _setupThemeChangeDetection() {
        vscode.window.onDidChangeActiveColorTheme((theme) => {
            const oldTheme = this._currentThemeKind;
            this._currentThemeKind = theme.kind;
            
            this._logger.debug('Theme changed', {
                from: this._getThemeKindName(oldTheme),
                to: this._getThemeKindName(theme.kind)
            });
            
            // Notify listeners
            this._themeChangeListeners.forEach(listener => {
                try {
                    listener(theme, oldTheme);
                } catch (error) {
                    this._logger.error('Theme change listener failed', error);
                }
            });
        });
    }

    /**
     * Get readable theme kind name
     */
    _getThemeKindName(kind) {
        switch (kind) {
            case vscode.ColorThemeKind.Light: return 'Light';
            case vscode.ColorThemeKind.Dark: return 'Dark';
            case vscode.ColorThemeKind.HighContrast: return 'High Contrast';
            default: return 'Unknown';
        }
    }

    /**
     * Register theme change listener
     */
    onThemeChange(callback) {
        this._themeChangeListeners.push(callback);
        return {
            dispose: () => {
                const index = this._themeChangeListeners.indexOf(callback);
                if (index !== -1) {
                    this._themeChangeListeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Get adaptive colors based on current theme
     */
    getAdaptiveColors() {
        const isLight = this._currentThemeKind === vscode.ColorThemeKind.Light;
        const isHighContrast = this._currentThemeKind === vscode.ColorThemeKind.HighContrast;
        
        if (isHighContrast) {
            return this._getHighContrastColors();
        } else if (isLight) {
            return this._getLightThemeColors();
        } else {
            return this._getDarkThemeColors();
        }
    }

    /**
     * Get colors optimized for light themes
     */
    _getLightThemeColors() {
        return {
            // Recency colors - more vibrant for light backgrounds
            veryRecent: new vscode.ThemeColor('terminal.ansiGreen'),
            recent: new vscode.ThemeColor('terminal.ansiYellow'),
            old: new vscode.ThemeColor('terminal.ansiRed'),
            
            // File type colors - adapted for light theme
            javascript: new vscode.ThemeColor('terminal.ansiBlue'),
            css: new vscode.ThemeColor('terminal.ansiMagenta'),
            html: new vscode.ThemeColor('terminal.ansiYellow'),
            json: new vscode.ThemeColor('terminal.ansiGreen'),
            markdown: new vscode.ThemeColor('terminal.ansiCyan'),
            python: new vscode.ThemeColor('terminal.ansiRed'),
            
            // Subtle colors
            subtle: new vscode.ThemeColor('editorInfo.foreground'),
            muted: new vscode.ThemeColor('editorHint.foreground'),
            emphasis: new vscode.ThemeColor('editorError.foreground')
        };
    }

    /**
     * Get colors optimized for dark themes
     */
    _getDarkThemeColors() {
        return {
            // Recency colors - softer for dark backgrounds
            veryRecent: new vscode.ThemeColor('charts.green'),
            recent: new vscode.ThemeColor('charts.yellow'),
            old: new vscode.ThemeColor('charts.red'),
            
            // File type colors - optimized for dark theme
            javascript: new vscode.ThemeColor('charts.blue'),
            css: new vscode.ThemeColor('charts.purple'),
            html: new vscode.ThemeColor('charts.orange'),
            json: new vscode.ThemeColor('charts.green'),
            markdown: new vscode.ThemeColor('charts.yellow'),
            python: new vscode.ThemeColor('charts.red'),
            
            // Subtle colors
            subtle: new vscode.ThemeColor('editorWarning.foreground'),
            muted: new vscode.ThemeColor('editorGutter.commentRangeForeground'),
            emphasis: new vscode.ThemeColor('editorInfo.foreground')
        };
    }

    /**
     * Get colors optimized for high contrast themes
     */
    _getHighContrastColors() {
        return {
            // High contrast - use only high contrast theme colors
            veryRecent: new vscode.ThemeColor('editorInfo.foreground'),
            recent: new vscode.ThemeColor('editorWarning.foreground'),
            old: new vscode.ThemeColor('editorError.foreground'),
            
            // File type colors - limited palette for accessibility
            javascript: new vscode.ThemeColor('editorInfo.foreground'),
            css: new vscode.ThemeColor('editorWarning.foreground'),
            html: new vscode.ThemeColor('editorError.foreground'),
            json: new vscode.ThemeColor('editorInfo.foreground'),
            markdown: new vscode.ThemeColor('editorWarning.foreground'),
            python: new vscode.ThemeColor('editorError.foreground'),
            
            // All subtle colors use same high contrast color
            subtle: new vscode.ThemeColor('editorForeground'),
            muted: new vscode.ThemeColor('editorForeground'),
            emphasis: new vscode.ThemeColor('editorForeground')
        };
    }

    /**
     * Get color for specific context based on current theme
     */
    getColorForContext(context, intensity = 'normal') {
        const colors = this.getAdaptiveColors();
        
        switch (context) {
            case 'success':
            case 'recent':
                return intensity === 'subtle' ? colors.subtle : colors.veryRecent;
                
            case 'warning':
            case 'medium':
                return intensity === 'subtle' ? colors.muted : colors.recent;
                
            case 'error':
            case 'old':
                return intensity === 'subtle' ? colors.emphasis : colors.old;
                
            case 'javascript':
            case 'typescript':
                return colors.javascript;
                
            case 'css':
            case 'scss':
            case 'less':
                return colors.css;
                
            case 'html':
            case 'xml':
                return colors.html;
                
            case 'json':
            case 'yaml':
                return colors.json;
                
            case 'markdown':
            case 'text':
                return colors.markdown;
                
            case 'python':
                return colors.python;
                
            default:
                return intensity === 'subtle' ? colors.muted : colors.subtle;
        }
    }

    /**
     * Apply theme-aware color scheme
     */
    applyThemeAwareColorScheme(colorScheme, filePath = '', fileAge = 0) {
        if (colorScheme === 'none') {
            return undefined;
        }
        
        if (colorScheme === 'adaptive') {
            // Adaptive scheme that changes based on theme
            return this._getAdaptiveColorForFile(filePath, fileAge);
        }
        
        // Standard color schemes with theme-aware colors
        const colors = this.getAdaptiveColors();
        
        switch (colorScheme) {
            case 'recency':
                if (fileAge < 3600000) return colors.veryRecent; // < 1 hour
                if (fileAge < 86400000) return colors.recent;    // < 1 day
                return colors.old;
                
            case 'file-type':
                return this._getFileTypeColor(filePath);
                
            case 'subtle':
                if (fileAge < 3600000) return colors.subtle;
                if (fileAge < 604800000) return colors.muted;    // < 1 week
                return colors.emphasis;
                
            case 'vibrant':
                // Use terminal colors for more vibrant display
                if (fileAge < 3600000) return new vscode.ThemeColor('terminal.ansiGreen');
                if (fileAge < 86400000) return new vscode.ThemeColor('terminal.ansiYellow');
                return new vscode.ThemeColor('terminal.ansiRed');
                
            default:
                return undefined;
        }
    }

    /**
     * Get adaptive color based on file characteristics and theme
     */
    _getAdaptiveColorForFile(filePath, fileAge) {
        // Primary factor: file type
        const typeColor = this._getFileTypeColor(filePath);
        if (typeColor) return typeColor;
        
        // Secondary factor: age with theme adaptation
        const colors = this.getAdaptiveColors();
        if (fileAge < 3600000) return colors.veryRecent;
        if (fileAge < 86400000) return colors.recent;
        return colors.old;
    }

    /**
     * Get theme-appropriate color for file type
     */
    _getFileTypeColor(filePath) {
        const ext = require('path').extname(filePath).toLowerCase();
        const colors = this.getAdaptiveColors();
        
        // Group similar file types
        if (['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(ext)) {
            return colors.javascript;
        }
        if (['.css', '.scss', '.sass', '.less', '.stylus'].includes(ext)) {
            return colors.css;
        }
        if (['.html', '.htm', '.xml', '.svg'].includes(ext)) {
            return colors.html;
        }
        if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) {
            return colors.json;
        }
        if (['.md', '.markdown', '.txt', '.rst'].includes(ext)) {
            return colors.markdown;
        }
        if (['.py', '.pyx', '.pyi'].includes(ext)) {
            return colors.python;
        }
        
        return null;
    }

    /**
     * Get suggested color scheme based on current theme
     */
    getSuggestedColorScheme() {
        switch (this._currentThemeKind) {
            case vscode.ColorThemeKind.Light:
                return 'vibrant'; // More visible on light backgrounds
                
            case vscode.ColorThemeKind.Dark:
                return 'recency'; // Subtle but informative for dark themes
                
            case vscode.ColorThemeKind.HighContrast:
                return 'none'; // Avoid colors in high contrast mode
                
            default:
                return 'recency';
        }
    }

    /**
     * Get icon theme integration suggestions
     */
    getIconThemeIntegration() {
        const iconTheme = vscode.workspace.getConfiguration('workbench').get('iconTheme');
        
        return {
            iconTheme: iconTheme,
            suggestions: {
                'vs-seti': {
                    recommendedColorScheme: 'file-type',
                    description: 'File-type colors complement Seti icons perfectly'
                },
                'material-icon-theme': {
                    recommendedColorScheme: 'subtle',
                    description: 'Subtle colors work well with Material icons'
                },
                'vscode-icons': {
                    recommendedColorScheme: 'recency',
                    description: 'Recency-based colors pair nicely with VS Code icons'
                }
            }
        };
    }

    /**
     * Auto-configure based on current theme and user preferences
     */
    async autoConfigureForTheme() {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const currentColorScheme = config.get('colorScheme', 'none');
            
            // Only auto-configure if user hasn't set a specific preference
            if (currentColorScheme === 'none' || currentColorScheme === 'auto') {
                const suggestedScheme = this.getSuggestedColorScheme();
                await config.update('colorScheme', suggestedScheme, vscode.ConfigurationTarget.Global);
                
                this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${suggestedScheme}`);
                
                // Show notification to user
                const action = await vscode.window.showInformationMessage(
                    `Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,
                    'Customize',
                    'OK'
                );
                
                if (action === 'Customize') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'explorerDates.colorScheme');
                }
            }
            
        } catch (error) {
            this._logger.error('Failed to auto-configure for theme', error);
        }
    }

    /**
     * Get current theme information
     */
    getCurrentThemeInfo() {
        return {
            kind: this._currentThemeKind,
            kindName: this._getThemeKindName(this._currentThemeKind),
            isLight: this._currentThemeKind === vscode.ColorThemeKind.Light,
            isDark: this._currentThemeKind === vscode.ColorThemeKind.Dark,
            isHighContrast: this._currentThemeKind === vscode.ColorThemeKind.HighContrast,
            suggestedColorScheme: this.getSuggestedColorScheme(),
            adaptiveColors: this.getAdaptiveColors()
        };
    }

    /**
     * Dispose theme integration
     */
    dispose() {
        this._themeChangeListeners.length = 0;
        this._logger.info('ThemeIntegrationManager disposed');
    }
}

module.exports = { ThemeIntegrationManager };