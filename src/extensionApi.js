const vscode = require('vscode');
const { getLogger } = require('./utils/logger');
const logger = getLogger();

class BaseEventEmitter {
    constructor() {
        this._listeners = new Map();
    }

    on(event, listener) {
        const handlers = this._listeners.get(event) || [];
        handlers.push(listener);
        this._listeners.set(event, handlers);
        return this;
    }

    off(event, listener) {
        const handlers = this._listeners.get(event);
        if (!handlers) {
            return this;
        }
        const index = handlers.indexOf(listener);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
        return this;
    }

    emit(event, ...args) {
        const handlers = this._listeners.get(event);
        if (handlers) {
            handlers.slice().forEach((handler) => {
                try {
                    handler(...args);
                } catch (error) {
                    logger.error(`Explorer Dates API handler failed for "${event}":`, error);
                }
            });
        }
        return this;
    }
}

/**
 * Extension API Manager
 * Provides public APIs for other extensions and manages the plugin system
 */
class ExtensionApiManager extends BaseEventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.api = null;
        this.decorationProviders = new Map();
        this._configurationWatcher = null;
        this.initialize();
        this._setupConfigurationListener();
    }

    initialize() {
        this.api = this.createPublicApi();
        logger.info('Extension API Manager initialized');
    }

    /**
     * Create the public API that other extensions can use
     */
    createPublicApi() {
        return {
            // Core decoration functionality
            getFileDecorations: this.getFileDecorations.bind(this),
            refreshDecorations: this.refreshDecorations.bind(this),
            
            // Plugin system
            registerPlugin: this.registerPlugin.bind(this),
            unregisterPlugin: this.unregisterPlugin.bind(this),
            
            // Custom decoration providers
            registerDecorationProvider: this.registerDecorationProvider.bind(this),
            unregisterDecorationProvider: this.unregisterDecorationProvider.bind(this),
            
            // Events
            onDecorationChanged: this.onDecorationChanged.bind(this),
            onFileScanned: this.onFileScanned.bind(this),
            
            // Utilities
            formatDate: this.formatDate.bind(this),
            getFileStats: this.getFileStats.bind(this),
            
            // Version info
            version: '1.1.0',
            apiVersion: '1.0.0'
        };
    }

    /**
     * Get file decorations for specified files
     */
    async getFileDecorations(filePaths) {
        if (!this._isApiUsable('getFileDecorations')) {
            return [];
        }
        try {
            const decorations = [];
            
            for (const filePath of filePaths) {
                const uri = vscode.Uri.file(filePath);
                const decoration = await this.getDecorationForFile(uri);
                
                if (decoration) {
                    decorations.push({
                        uri: uri.toString(),
                        decoration: decoration
                    });
                }
            }
            
            return decorations;
        } catch (error) {
            logger.error('Failed to get file decorations:', error);
            return [];
        }
    }

    async getDecorationForFile(uri) {
        if (!this._isApiUsable('getDecorationForFile')) {
            return null;
        }
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            const lastModified = new Date(stat.mtime);
            
            // Basic decoration without relying on external dependencies
            let decoration = {
                badge: this.formatDate(lastModified, 'smart'),
                color: undefined, // Let the main decoration provider handle colors
                tooltip: `Modified: ${lastModified.toLocaleString()}`
            };

            // Apply custom decoration providers
            for (const [providerId, provider] of this.decorationProviders) {
                try {
                    const customDecoration = await provider.provideDecoration(uri, stat, decoration);
                    if (customDecoration) {
                        decoration = { ...decoration, ...customDecoration };
                    }
                } catch (error) {
                    logger.error(`Decoration provider ${providerId} failed:`, error);
                }
            }

            return decoration;
        } catch (error) {
            logger.error('Failed to get decoration for file:', error);
            return null;
        }
    }

    /**
     * Refresh decorations for all files or specific files
     */
    async refreshDecorations(filePaths = null) {
        if (!this._isApiUsable('refreshDecorations')) {
            return false;
        }
        try {
            this.emit('decorationRefreshRequested', filePaths);
            logger.info('Decoration refresh requested');
            return true;
        } catch (error) {
            logger.error('Failed to refresh decorations:', error);
            return false;
        }
    }

    /**
     * Register a plugin with the extension
     */
    registerPlugin(pluginId, plugin) {
        if (!this._canUsePlugins(`registerPlugin:${pluginId}`)) {
            return false;
        }
        try {
            // Validate plugin structure
            if (!this.validatePlugin(plugin)) {
                throw new Error('Invalid plugin structure');
            }

            this.plugins.set(pluginId, {
                ...plugin,
                registeredAt: new Date(),
                active: true
            });

            // Initialize plugin if it has an init method
            if (typeof plugin.activate === 'function') {
                plugin.activate(this.api);
            }

            this.emit('pluginRegistered', { pluginId, plugin });
            logger.info(`Plugin registered: ${pluginId}`);
            
            return true;
        } catch (error) {
            logger.error(`Failed to register plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Unregister a plugin
     */
    unregisterPlugin(pluginId) {
        if (!this._canUsePlugins(`unregisterPlugin:${pluginId}`)) {
            return false;
        }
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                return false;
            }

            // Deactivate plugin if it has a deactivate method
            if (typeof plugin.deactivate === 'function') {
                plugin.deactivate();
            }

            this.plugins.delete(pluginId);
            this.emit('pluginUnregistered', { pluginId });
            logger.info(`Plugin unregistered: ${pluginId}`);
            
            return true;
        } catch (error) {
            logger.error(`Failed to unregister plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Register a custom decoration provider
     */
    registerDecorationProvider(providerId, provider) {
        if (!this._canUsePlugins(`registerDecorationProvider:${providerId}`)) {
            return false;
        }
        try {
            if (!this.validateDecorationProvider(provider)) {
                throw new Error('Invalid decoration provider');
            }

            this.decorationProviders.set(providerId, provider);
            this.emit('decorationProviderRegistered', { providerId, provider });
            logger.info(`Decoration provider registered: ${providerId}`);
            
            return true;
        } catch (error) {
            logger.error(`Failed to register decoration provider ${providerId}:`, error);
            return false;
        }
    }

    /**
     * Unregister a decoration provider
     */
    unregisterDecorationProvider(providerId) {
        if (!this._canUsePlugins(`unregisterDecorationProvider:${providerId}`)) {
            return false;
        }
        try {
            const removed = this.decorationProviders.delete(providerId);
            if (removed) {
                this.emit('decorationProviderUnregistered', { providerId });
                logger.info(`Decoration provider unregistered: ${providerId}`);
            }
            return removed;
        } catch (error) {
            logger.error(`Failed to unregister decoration provider ${providerId}:`, error);
            return false;
        }
    }

    /**
     * Subscribe to decoration change events
     */
    onDecorationChanged(callback) {
        this.on('decorationChanged', callback);
        return () => this.off('decorationChanged', callback);
    }

    /**
     * Subscribe to file scan events
     */
    onFileScanned(callback) {
        this.on('fileScanned', callback);
        return () => this.off('fileScanned', callback);
    }

    /**
     * Utility: Format date according to current settings
     */
    formatDate(date, format = null) {
        if (!this._isApiUsable('formatDate')) {
            return '';
        }
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const displayFormat = format || config.get('displayFormat', 'smart');
            
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            switch (displayFormat) {
                case 'relative-short':
                    return this.getRelativeTimeShort(diffMs);
                case 'relative-long':
                    return this.getRelativeTimeLong(diffMs);
                case 'absolute-short':
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                case 'absolute-long':
                    return date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                case 'smart':
                default:
                    return diffDays < 7 ? this.getRelativeTimeShort(diffMs) : 
                           date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch (error) {
            logger.error('Failed to format date:', error);
            return date.toLocaleDateString();
        }
    }

    /**
     * Utility: Get file statistics
     */
    async getFileStats(filePath) {
        if (!this._isApiUsable('getFileStats')) {
            return null;
        }
        try {
            const uri = vscode.Uri.file(filePath);
            const stat = await vscode.workspace.fs.stat(uri);
            
            return {
                path: filePath,
                size: stat.size,
                created: new Date(stat.ctime),
                modified: new Date(stat.mtime),
                type: stat.type === vscode.FileType.Directory ? 'directory' : 'file'
            };
        } catch (error) {
            logger.error('Failed to get file stats:', error);
            return null;
        }
    }

    /**
     * Get the public API object
     */
    getApi() {
        return this.api;
    }

    /**
     * Get list of registered plugins
     */
    getRegisteredPlugins() {
        const plugins = [];
        for (const [id, plugin] of this.plugins) {
            plugins.push({
                id: id,
                name: plugin.name,
                version: plugin.version,
                author: plugin.author,
                active: plugin.active,
                registeredAt: plugin.registeredAt
            });
        }
        return plugins;
    }

    /**
     * Validate plugin structure
     */
    validatePlugin(plugin) {
        if (!plugin || typeof plugin !== 'object') {
            return false;
        }

        // Required fields
        if (!plugin.name || !plugin.version) {
            return false;
        }

        // Optional but validated fields
        if (plugin.activate && typeof plugin.activate !== 'function') {
            return false;
        }

        if (plugin.deactivate && typeof plugin.deactivate !== 'function') {
            return false;
        }

        return true;
    }

    /**
     * Validate decoration provider
     */
    validateDecorationProvider(provider) {
        if (!provider || typeof provider !== 'object') {
            return false;
        }

        if (typeof provider.provideDecoration !== 'function') {
            return false;
        }

        return true;
    }

    /**
     * Helper: Get relative time in short format
     */
    getRelativeTimeShort(diffMs) {
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return `${diffSeconds}s`;
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 30) return `${diffDays}d`;
        
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths}mo`;
        
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears}y`;
    }

    /**
     * Helper: Get relative time in long format
     */
    getRelativeTimeLong(diffMs) {
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
        
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }

    /**
     * Helper: Get color for file age
     */
    getColorForAge(date) {
        const config = vscode.workspace.getConfiguration('explorerDates');
        const colorCoding = config.get('colorCoding', false);
        
        if (!colorCoding) {
            return undefined;
        }

        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);

        if (diffHours < 1) return new vscode.ThemeColor('charts.green');
        if (diffHours < 24) return new vscode.ThemeColor('charts.yellow');
        if (diffHours < 168) return new vscode.ThemeColor('charts.orange');
        return new vscode.ThemeColor('charts.red');
    }

    /**
     * Create example plugin for demonstration
     */
    createExamplePlugin() {
        return {
            name: 'File Size Display',
            version: '1.0.0',
            author: 'Explorer Dates',
            description: 'Adds file size to decorations',
            
            activate: (api) => {
                // Register a decoration provider that adds file size
                api.registerDecorationProvider('fileSize', {
                    provideDecoration: async (uri, stat, currentDecoration) => {
                        const size = this.formatFileSize(stat.size);
                        return {
                            badge: `${currentDecoration.badge} • ${size}`,
                            tooltip: `${currentDecoration.tooltip}\nSize: ${size}`
                        };
                    }
                });
                
                logger.info('File Size Display plugin activated');
            },
            
            deactivate: () => {
                logger.info('File Size Display plugin deactivated');
            }
        };
    }

    _setupConfigurationListener() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('explorerDates.enableExtensionApi') ||
                event.affectsConfiguration('explorerDates.allowExternalPlugins')) {
                logger.info('Explorer Dates API configuration changed', {
                    apiEnabled: this._isApiEnabled(),
                    externalPluginsAllowed: this._allowsExternalPlugins()
                });
            }
        });
    }

    _isApiEnabled() {
        return vscode.workspace.getConfiguration('explorerDates').get('enableExtensionApi', true);
    }

    _allowsExternalPlugins() {
        return vscode.workspace.getConfiguration('explorerDates').get('allowExternalPlugins', true);
    }

    _isApiUsable(featureName) {
        if (!this._isApiEnabled()) {
            logger.warn(`Explorer Dates API request "${featureName}" ignored because enableExtensionApi is disabled.`);
            return false;
        }
        return true;
    }

    _canUsePlugins(featureName) {
        if (!this._isApiUsable(featureName)) {
            return false;
        }
        if (!this._allowsExternalPlugins()) {
            logger.warn(`Explorer Dates plugin request "${featureName}" ignored because allowExternalPlugins is disabled.`);
            return false;
        }
        return true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    dispose() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        this.plugins.clear();
        this.decorationProviders.clear();
        logger.info('Extension API Manager disposed');
    }
}

module.exports = { ExtensionApiManager };
