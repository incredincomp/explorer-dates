const { getLogger } = require('./utils/logger');
const { normalizePath, getUriPath } = require('./utils/pathUtils');
const { isDateLike, ensureDate } = require('./utils/dateHelpers');

class IncrementalIndexer {
    constructor(fileSystem) {
        this._fileSystem = fileSystem;
        this._logger = getLogger();
        this._batchProcessor = null;
        this._index = new Map();
        this._workerHost = null;
        this._incrementalWorkersManager = null;
        this._progressiveAnalysisEnabled = false;
        this._initialController = null;
        this._initialJobs = new Set();
        this._deltaQueue = new Map();
        this._deltaTimer = null;
        this._maxCachedStatAgeMs = 60000;
    }

    initialize(options = {}) {
        this._batchProcessor = options.batchProcessor || null;
        this._progressiveAnalysisEnabled = options.enableProgressiveAnalysis || false;
        
        // Clean up existing worker
        if (this._workerHost) {
            this._workerHost.dispose();
            this._workerHost = null;
        }
        if (this._incrementalWorkersManager) {
            this._incrementalWorkersManager.dispose();
            this._incrementalWorkersManager = null;
        }
    }

    async startInitialIndex(workspaceFolders, options = {}) {
        if (!this._batchProcessor || !Array.isArray(workspaceFolders) || workspaceFolders.length === 0) {
            return;
        }

        this._cancelInitialIndex('restart');

        this._initialController = new AbortController();
        const maxFiles = options.maxFiles || 2000;

        workspaceFolders.forEach((folder) => {
            const jobId = this._batchProcessor.processDirectoryProgressively(
                folder.uri,
                async (uri) => this._indexUri(uri, { source: 'initial' }),
                {
                    background: true,
                    priority: 'low',
                    maxFiles,
                    cancellationToken: this._initialController.signal
                }
            );
            if (jobId) {
                this._initialJobs.add(jobId);
            }
        });

        this._logger.info(`Incremental indexer scheduled initial scan for ${workspaceFolders.length} workspace folder(s).`);
    }

    _cancelInitialIndex(reason = 'unspecified') {
        if (this._initialController && !this._initialController.signal.aborted) {
            this._initialController.abort();
        }
        this._initialController = null;

        if (this._batchProcessor && this._initialJobs.size) {
            for (const jobId of this._initialJobs) {
                this._batchProcessor.cancelBatch(jobId);
            }
        }
        this._initialJobs.clear();
        if (reason !== 'unspecified') {
            this._logger.debug(`Incremental indexer cancelled initial scan (${reason})`);
        }
    }

    async _indexUri(uri, context = {}) {
        try {
            const stat = await this._fileSystem.stat(uri);
            await this._ingestStat(uri, stat, context);
        } catch (error) {
            this._logger.debug('Incremental indexer failed to stat URI', { error: error?.message, uri: uri?.toString?.() });
        }
    }

    async _ingestStat(uri, stat, context = {}) {
        const filePath = getUriPath(uri);
        if (!filePath) {
            return;
        }
        const normalized = normalizePath(filePath);
        if (!normalized) {
            return;
        }

        const entry = {
            path: normalized,
            size: stat?.size || 0,
            mtimeMs: this._toMs(stat?.mtime),
            birthtimeMs: this._toMs(stat?.birthtime || stat?.ctime || stat?.mtime),
            indexedAt: Date.now(),
            digest: null,
            context
        };

        // Load worker infrastructure if progressive analysis is enabled or a worker host is manually injected
        if (this._progressiveAnalysisEnabled || this._workerHost) {
            const workerHost = this._workerHost || await this._getOrCreateWorkerHost();
            if (workerHost?.isEnabled()) {
                try {
                    const [digest] = await workerHost.runTask('digest', [entry]);
                    entry.digest = digest?.hash || null;
                    entry.sizeBucket = digest?.sizeBucket;
                    entry.ageBucket = digest?.ageBucket;
                } catch (workerError) {
                    this._logger.debug('Incremental index worker error', workerError);
                }
            }
        }

        this._index.set(normalized, entry);
    }

    getIndexedStat(filePath, maxAgeMs = this._maxCachedStatAgeMs) {
        if (!filePath) {
            return null;
        }
        const normalized = normalizePath(filePath);
        const entry = this._index.get(normalized);
        if (!entry) {
            return null;
        }
        if ((Date.now() - (entry.indexedAt || 0)) > maxAgeMs) {
            return null;
        }
        return {
            size: entry.size || 0,
            mtime: ensureDate(entry.mtimeMs || Date.now()),
            birthtime: ensureDate(entry.birthtimeMs || entry.mtimeMs || Date.now()),
            isFile: () => true
        };
    }

    queueDelta(uri, eventType = 'change') {
        if (!uri) {
            return;
        }
        const key = uri.toString();
        this._deltaQueue.set(key, { uri, eventType });

        if (!this._deltaTimer) {
            this._deltaTimer = setTimeout(() => this._flushDeltaQueue(), 300);
        }
    }

    async _flushDeltaQueue() {
        if (this._deltaTimer) {
            clearTimeout(this._deltaTimer);
            this._deltaTimer = null;
        }

        const items = Array.from(this._deltaQueue.values());
        this._deltaQueue.clear();

        for (const { uri, eventType } of items) {
            if (eventType === 'delete') {
                const normalized = normalizePath(getUriPath(uri));
                if (normalized) {
                    this._index.delete(normalized);
                }
                continue;
            }
            await this._indexUri(uri, { source: 'delta', eventType });
        }
    }

    primeFromStat(uri, stat) {
        if (!uri || !stat) {
            return;
        }
        this._ingestStat(uri, stat, { source: 'prime' }).catch((error) => {
            this._logger.debug('Failed to prime index from stat', error);
        });
    }

    /**
     * Lazy load worker host when progressive analysis is requested
     */
    async _getOrCreateWorkerHost() {
        if (!this._progressiveAnalysisEnabled) {
            return null;
        }

        if (!this._incrementalWorkersManager) {
            try {
                // Load the incremental workers chunk on demand
                const { loadFeatureModule } = require('./featureFlags');
                const IncrementalWorkersModule = await loadFeatureModule('incrementalWorkers');
                
                if (IncrementalWorkersModule) {
                    const { IncrementalWorkersManager } = IncrementalWorkersModule;
                    this._incrementalWorkersManager = new IncrementalWorkersManager({ logger: this._logger });
                    await this._incrementalWorkersManager.initialize();
                    this._logger.info('📦 Incremental workers chunk loaded on demand (~8-10KB)');
                } else {
                    this._logger.warn('Failed to load incremental workers chunk');
                    return null;
                }
            } catch (error) {
                this._logger.error('Failed to load incremental workers manager', error);
                return null;
            }
        }

        return this._incrementalWorkersManager.getWorkerHost();
    }

    /**
     * Enable progressive analysis and load worker infrastructure
     */
    async enableProgressiveAnalysis() {
        if (!this._progressiveAnalysisEnabled) {
            this._progressiveAnalysisEnabled = true;
            this._logger.debug('Progressive analysis enabled, workers will be loaded on demand');
        }
        return this._getOrCreateWorkerHost();
    }

    /**
     * Disable progressive analysis and dispose worker infrastructure
     */
    disableProgressiveAnalysis() {
        this._progressiveAnalysisEnabled = false;
        if (this._incrementalWorkersManager) {
            this._incrementalWorkersManager.dispose();
            this._incrementalWorkersManager = null;
            this._logger.debug('Progressive analysis disabled, worker resources disposed');
        }
    }

    getMetrics() {
        return {
            entries: this._index.size,
            workerEnabled: !!(this._incrementalWorkersManager?.isWorkerEnabled()),
            progressiveAnalysisEnabled: this._progressiveAnalysisEnabled,
            deltaQueue: this._deltaQueue.size
        };
    }

    removeFoldersFromIndex(folderUris = []) {
        if (!Array.isArray(folderUris) || folderUris.length === 0) {
            return 0;
        }

        const normalizedFolders = folderUris
            .map((uri) => normalizePath(getUriPath(uri)))
            .filter(Boolean);

        if (!normalizedFolders.length) {
            return 0;
        }

        let removed = 0;
        for (const key of Array.from(this._index.keys())) {
            if (normalizedFolders.some((folderPath) => key === folderPath || key.startsWith(`${folderPath}/`))) {
                this._index.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            this._logger.debug(`Incremental indexer pruned ${removed} entr${removed === 1 ? 'y' : 'ies'} for removed workspace folder(s).`);
        }
        return removed;
    }

    _toMs(value) {
        if (!value) {
            return Date.now();
        }
        if (typeof value === 'number') {
            return value;
        }
        if (isDateLike(value)) {
            return value.getTime();
        }
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : Date.now();
        }
        if (typeof value.getTime === 'function') {
            return value.getTime();
        }
        return Date.now();
    }

    dispose() {
        this._cancelInitialIndex('dispose');
        if (this._deltaTimer) {
            clearTimeout(this._deltaTimer);
            this._deltaTimer = null;
        }
        this._deltaQueue.clear();
        if (this._incrementalWorkersManager) {
            this._incrementalWorkersManager.dispose();
            this._incrementalWorkersManager = null;
        }
        this._index.clear();
    }
}

module.exports = { IncrementalIndexer };
