/**
 * Incremental Workers Chunk
 * Contains IndexWorkerHost and worker infrastructure
 * Only loaded when progressive analysis is specifically requested
 */

const { IndexWorkerHost } = require('../workers/indexWorkerHost');
const { getLogger } = require('../utils/logger');

class IncrementalWorkersManager {
    constructor(options = {}) {
        this._logger = options.logger || getLogger();
        this._workerHost = null;
        this._wasmPath = options.wasmPath;
    }

    /**
     * Initialize the worker host
     */
    async initialize() {
        if (!this._workerHost) {
            this._workerHost = new IndexWorkerHost({ 
                logger: this._logger,
                wasmPath: this._wasmPath
            });
            this._logger.debug('Incremental workers initialized');
        }
        return this._workerHost;
    }

    /**
     * Get the worker host instance
     */
    getWorkerHost() {
        return this._workerHost;
    }

    /**
     * Check if worker is enabled
     */
    isWorkerEnabled() {
        return this._workerHost?.isEnabled() || false;
    }

    /**
     * Run a task on the worker
     */
    async runTask(task, payload) {
        if (!this._workerHost) {
            await this.initialize();
        }
        return this._workerHost.runTask(task, payload);
    }

    /**
     * Dispose of the worker host
     */
    dispose() {
        if (this._workerHost) {
            this._workerHost.dispose();
            this._workerHost = null;
            this._logger.debug('Incremental workers disposed');
        }
    }
}

module.exports = {
    IncrementalWorkersManager,
    IndexWorkerHost // Export for backward compatibility if needed
};
