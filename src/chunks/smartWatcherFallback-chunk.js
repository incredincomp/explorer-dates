/**
 * Smart Watcher Fallback Chunk
 * Lazy-loaded fallback for legacy file watching when native watchers fail
 * Only loaded when smartFileWatching is enabled and platform requires fallbacks
 */

const { SmartWatcherFallback, LegacyFileWatcher } = require('../smartWatcherFallback');
const { getLogger } = require('../utils/logger');

/**
 * Smart Watcher Fallback Manager
 * Provides lazy-loaded fallback mechanisms for problematic platforms
 */
class SmartWatcherFallbackManager {
    constructor(options = {}) {
        this._logger = options.logger || getLogger();
        this._fallbackInstance = null;
        this._isLoaded = false;
    }

    /**
     * Initialize the fallback system if not already loaded
     */
    async initialize() {
        if (this._isLoaded) {
            return this._fallbackInstance;
        }

        this._fallbackInstance = new SmartWatcherFallback({
            logger: this._logger
        });
        
        this._isLoaded = true;
        this._logger.info('📦 Smart watcher fallback chunk loaded on demand (~3-4KB)');
        
        return this._fallbackInstance;
    }

    /**
     * Get the fallback instance (initializes if needed)
     */
    async getFallback() {
        if (!this._isLoaded) {
            await this.initialize();
        }
        return this._fallbackInstance;
    }

    /**
     * Check if fallback is needed for current platform
     */
    static isPlatformFallbackRequired() {
        return SmartWatcherFallback.platformRequiresFallback();
    }

    /**
     * Test native watcher support
     */
    static async testNativeSupport() {
        return SmartWatcherFallback.testNativeWatcherSupport();
    }

    /**
     * Dispose resources
     */
    dispose() {
        if (this._fallbackInstance) {
            this._fallbackInstance.dispose();
            this._fallbackInstance = null;
        }
        this._isLoaded = false;
    }
}

module.exports = {
    SmartWatcherFallbackManager,
    SmartWatcherFallback,
    LegacyFileWatcher
};