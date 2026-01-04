const GLOBAL_VSCODE_SYMBOL = '__explorerDatesVscode';
let cachedVscode = null;
let fallbackVscode = null;
let fallbackInUse = false;

function getGlobalVscode() {
    try {
        return globalThis[GLOBAL_VSCODE_SYMBOL];
    } catch {
        return undefined;
    }
}

function createFallbackVscode() {
    if (fallbackVscode) {
        return fallbackVscode;
    }

    const noopDisposable = { dispose() {} };
    class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    }

    const ColorThemeKind = {
        Light: 1,
        Dark: 2,
        HighContrast: 3
    };

    fallbackVscode = {
        window: {
            activeColorTheme: { kind: ColorThemeKind.Dark },
            onDidChangeActiveColorTheme: () => noopDisposable,
            showInformationMessage: async () => undefined,
            createOutputChannel: () => ({
                appendLine: () => {},
                dispose: () => {}
            })
        },
        ColorThemeKind,
        ThemeColor,
        commands: {
            executeCommand: async () => undefined
        },
        workspace: {
            getConfiguration: () => ({
                get: () => undefined,
                update: async () => undefined
            })
        },
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
        }
    };
    return fallbackVscode;
}

const FALLBACK_ERROR_CODES = new Set([
    'MODULE_NOT_FOUND',
    'ERR_MODULE_NOT_FOUND',
    'WEB_NATIVE_MODULE'
]);

function shouldFallbackToMock(error) {
    if (!error) {
        return true;
    }
    if (error.code && FALLBACK_ERROR_CODES.has(error.code)) {
        return true;
    }
    const message = typeof error.message === 'string' ? error.message : '';
    return message.includes("Cannot find module 'vscode'");
}

function resolveVscode() {
    const globalMock = getGlobalVscode();
    if (globalMock) {
        cachedVscode = globalMock;
        fallbackInUse = false;
        return cachedVscode;
    }

    if (cachedVscode && !fallbackInUse) {
        return cachedVscode;
    }

    try {
        cachedVscode = require('vscode');
        fallbackInUse = false;
    } catch (error) {
        if (shouldFallbackToMock(error)) {
            cachedVscode = createFallbackVscode();
            fallbackInUse = true;
        } else {
            throw error;
        }
    }
    return cachedVscode;
}

// Lazily proxy VS Code so tests can install their mock before the real module loads
const vscode = new Proxy({}, {
    get(_target, prop) {
        return resolveVscode()[prop];
    },
    set(_target, prop, value) {
        resolveVscode()[prop] = value;
        return true;
    },
    has(_target, prop) {
        return prop in resolveVscode();
    },
    ownKeys() {
        return Reflect.ownKeys(resolveVscode());
    },
    getOwnPropertyDescriptor(_target, prop) {
        const descriptor = Object.getOwnPropertyDescriptor(resolveVscode(), prop);
        if (descriptor) {
            descriptor.configurable = true;
        }
        return descriptor;
    }
});
const { getLogger } = require('./utils/logger');
const { getExtension } = require('./utils/pathUtils');

/**
 * Theme Integration Manager for automatic color adaptation and custom theme support
 */
class ThemeIntegrationManager {
    constructor() {
        this._logger = getLogger();
        this._currentThemeKind = vscode.window.activeColorTheme.kind;
        this._themeChangeListeners = [];
        this._themeChangeDisposable = null;
        
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
        this._themeChangeDisposable = vscode.window.onDidChangeActiveColorTheme((theme) => {
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
            // Recency colors - optimized for light backgrounds and selection states
            veryRecent: new vscode.ThemeColor('list.highlightForeground'),
            recent: new vscode.ThemeColor('list.warningForeground'),
            old: new vscode.ThemeColor('list.errorForeground'),
            
            // File type colors - adapted for light theme with better selection visibility
            javascript: new vscode.ThemeColor('symbolIcon.functionForeground'),
            css: new vscode.ThemeColor('symbolIcon.colorForeground'),
            html: new vscode.ThemeColor('symbolIcon.snippetForeground'),
            json: new vscode.ThemeColor('symbolIcon.stringForeground'),
            markdown: new vscode.ThemeColor('symbolIcon.textForeground'),
            python: new vscode.ThemeColor('symbolIcon.classForeground'),
            
            // Subtle colors with selection contrast
            subtle: new vscode.ThemeColor('list.inactiveSelectionForeground'),
            muted: new vscode.ThemeColor('list.deemphasizedForeground'),
            emphasis: new vscode.ThemeColor('list.highlightForeground')
        };
    }

    /**
     * Get colors optimized for dark themes
     */
    _getDarkThemeColors() {
        return {
            // Recency colors - softer for dark backgrounds, optimized for selection contrast
            veryRecent: new vscode.ThemeColor('list.highlightForeground'),
            recent: new vscode.ThemeColor('charts.yellow'),
            old: new vscode.ThemeColor('charts.red'),
            
            // File type colors - optimized for dark theme with better selection contrast
            javascript: new vscode.ThemeColor('symbolIcon.functionForeground'),
            css: new vscode.ThemeColor('charts.purple'),
            html: new vscode.ThemeColor('charts.orange'),
            json: new vscode.ThemeColor('symbolIcon.stringForeground'),
            markdown: new vscode.ThemeColor('charts.yellow'),
            python: new vscode.ThemeColor('symbolIcon.classForeground'),
            
            // Subtle colors with selection awareness
            subtle: new vscode.ThemeColor('list.inactiveSelectionForeground'),
            muted: new vscode.ThemeColor('list.deemphasizedForeground'),
            emphasis: new vscode.ThemeColor('list.highlightForeground')
        };
    }

    /**
     * Get colors optimized for high contrast themes
     */
    _getHighContrastColors() {
        return {
            // High contrast - use selection-aware theme colors for maximum visibility
            veryRecent: new vscode.ThemeColor('list.highlightForeground'),
            recent: new vscode.ThemeColor('list.warningForeground'),
            old: new vscode.ThemeColor('list.errorForeground'),
            
            // File type colors - simplified palette with excellent selection contrast
            javascript: new vscode.ThemeColor('list.highlightForeground'),
            css: new vscode.ThemeColor('list.warningForeground'),
            html: new vscode.ThemeColor('list.errorForeground'),
            json: new vscode.ThemeColor('list.highlightForeground'),
            markdown: new vscode.ThemeColor('list.warningForeground'),
            python: new vscode.ThemeColor('list.errorForeground'),
            
            // Subtle colors - all highly visible in high contrast with selection awareness
            subtle: new vscode.ThemeColor('list.highlightForeground'),
            muted: new vscode.ThemeColor('list.inactiveSelectionForeground'),
            emphasis: new vscode.ThemeColor('list.focusHighlightForeground')
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
        
        // Standard color schemes with theme-aware colors optimized for Explorer selection states
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
                // Use selection-aware colors for vibrant display
                return this._getVibrantSelectionAwareColor(fileAge);

            case 'custom':
                // Respect user-defined custom colors via workbench.colorCustomizations
                if (fileAge < 3600000) {
                    return new vscode.ThemeColor('explorerDates.customColor.veryRecent');
                }
                if (fileAge < 86400000) {
                    return new vscode.ThemeColor('explorerDates.customColor.recent');
                }
                return new vscode.ThemeColor('explorerDates.customColor.old');
                
            default:
                return undefined;
        }
    }

    /**
     * Get vibrant colors that work well in selection states
     */
    _getVibrantSelectionAwareColor(fileAge) {
        if (fileAge < 3600000) {
            return new vscode.ThemeColor('list.highlightForeground'); // Always visible against selection
        }
        if (fileAge < 86400000) {
            return new vscode.ThemeColor('list.warningForeground');   // Warning-style yellow/orange
        }
        return new vscode.ThemeColor('list.errorForeground');        // Error-style red
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
                const ext = getExtension(filePath);
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
        if (this._themeChangeDisposable) {
            try {
                this._themeChangeDisposable.dispose();
            } catch (error) {
                this._logger.warn('Failed to dispose theme change subscription', error);
            }
            this._themeChangeDisposable = null;
        }
        this._logger.info('ThemeIntegrationManager disposed');
    }
}

module.exports = { ThemeIntegrationManager };
