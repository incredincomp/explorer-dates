const vscode = require('vscode');
const { getLogger } = require('./utils/logger');

/**
 * Batch Processing Manager for file decorations
 * Handles progressive loading and background processing
 */
class BatchProcessor {
    constructor() {
        this._logger = getLogger();
        this._processingQueue = [];
        this._isProcessing = false;
        this._batchSize = 50;
        this._processedCount = 0;
        this._totalCount = 0;
        this._statusBar = null;
        this._configurationWatcher = null;
        this._adaptiveBatching = true;
        this._workspaceScale = 'normal';
        this._minBatchSize = 5;
        
        // Performance tracking
        this._metrics = {
            totalBatches: 0,
            averageBatchTime: 0,
            totalProcessingTime: 0
        };
        
        this._logger.info('BatchProcessor initialized');
    }

    /**
     * Initialize batch processor with configuration
     */
    initialize() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        this._batchSize = this._clampBatchSize(config.get('batchSize', 50));
        this._adaptiveBatching = config.get('adaptiveBatchProcessing', true);
        
        // Create status bar for progress indication
        this._statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -1000);
        
        // Listen for configuration changes
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
        }
        this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.batchSize')) {
                this._batchSize = this._clampBatchSize(vscode.workspace.getConfiguration('explorerDates').get('batchSize', 50));
                this._logger.debug(`Batch size updated to: ${this._batchSize}`);
            }
            if (e.affectsConfiguration('explorerDates.adaptiveBatchProcessing')) {
                this._adaptiveBatching = vscode.workspace.getConfiguration('explorerDates').get('adaptiveBatchProcessing', true);
                this._logger.debug(`Adaptive batch processing ${this._adaptiveBatching ? 'enabled' : 'disabled'}`);
            }
        });
    }

    /**
     * Add URIs to processing queue
     */
    queueForProcessing(uris, processor, options = {}) {
        const batch = {
            id: Date.now() + Math.random(),
            uris: Array.isArray(uris) ? uris : [uris],
            processor: processor,
            priority: options.priority || 'normal',
            background: options.background || false,
            onProgress: options.onProgress,
            onComplete: options.onComplete,
            cancelSignal: options.cancellationToken || null,
            jobLabel: options.jobLabel || 'batch',
            abortListener: null
        };

        if (batch.cancelSignal) {
            if (batch.cancelSignal.aborted) {
                this._logger.debug(`Skipped queueing batch (${batch.jobLabel}) - cancellation requested`);
                return null;
            }
            batch.abortListener = () => {
                this.cancelBatch(batch.id, 'aborted');
            };
            if (typeof batch.cancelSignal.addEventListener === 'function') {
                batch.cancelSignal.addEventListener('abort', batch.abortListener, { once: true });
            }
        }

        // Insert based on priority
        if (batch.priority === 'high') {
            this._processingQueue.unshift(batch);
        } else {
            this._processingQueue.push(batch);
        }

        this._logger.debug(`Queued batch ${batch.id} with ${batch.uris.length} URIs`);
        
        // Start processing if not already running
        if (!this._isProcessing) {
            this._startProcessing();
        }

        return batch.id;
    }

    /**
     * Start batch processing
     */
    async _startProcessing() {
        if (this._isProcessing) return;
        
        this._isProcessing = true;
        this._processedCount = 0;
        this._totalCount = this._processingQueue.reduce((sum, batch) => sum + batch.uris.length, 0);
        
        this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`);
        
        // Show progress in status bar
        this._updateStatusBar();
        
        const startTime = Date.now();
        
        try {
            while (this._processingQueue.length > 0) {
                const batch = this._processingQueue.shift();
                await this._processBatch(batch);
                
                // Allow UI to breathe between batches
                if (!batch.background) {
                    await this._sleep(1);
                }
            }
        } catch (error) {
            this._logger.error('Batch processing failed', error);
        } finally {
            this._isProcessing = false;
            this._hideStatusBar();
            
            // Update metrics
            const totalTime = Date.now() - startTime;
            this._updateMetrics(totalTime);
            
            this._logger.info(`Batch processing completed in ${totalTime}ms`);
        }
    }

    /**
     * Process a single batch
     */
    async _processBatch(batch) {
        const batchStartTime = Date.now();
        if (batch.cancelSignal?.aborted) {
            this._logger.debug(`Batch ${batch.id} (${batch.jobLabel}) aborted before processing`);
            this._completeBatch(batch, false, 'aborted');
            return;
        }

        this._logger.debug(`Processing batch ${batch.id} with ${batch.uris.length} URIs`);
        
        try {
            // Process URIs in chunks of batch size
            const effectiveBatchSize = this._getEffectiveBatchSize(batch.uris.length);
            const chunks = this._chunkArray(batch.uris, effectiveBatchSize);
            
            for (let i = 0; i < chunks.length; i++) {
                if (batch.cancelSignal?.aborted) {
                    this._logger.debug(`Batch ${batch.id} cancelled during chunk processing`);
                    break;
                }

                const chunk = chunks[i];
                const chunkResults = [];
                
                // Process chunk items
                for (const uri of chunk) {
                    try {
                        if (batch.cancelSignal?.aborted) {
                            this._logger.debug(`Batch ${batch.id} cancelled mid-item`);
                            break;
                        }

                        const result = await batch.processor(uri);
                        chunkResults.push({ uri, result, success: true });
                        this._processedCount++;
                    } catch (error) {
                        chunkResults.push({ uri, error, success: false });
                        this._processedCount++;
                        this._logger.debug(`Failed to process ${uri.fsPath}`, error);
                    }
                    
                    // Update progress
                    this._updateStatusBar();
                    
                    // Report progress if callback provided
                    if (batch.onProgress) {
                        batch.onProgress({
                            processed: this._processedCount,
                            total: this._totalCount,
                            current: uri
                        });
                    }
                }
                
                // Allow cancellation checks and UI updates
                await this._sleep(0);

                if (batch.cancelSignal?.aborted) {
                    this._logger.debug(`Batch ${batch.id} cancelled after chunk`);
                    break;
                }
                
                // Check if we should pause for UI responsiveness
                if (!batch.background && i < chunks.length - 1) {
                    await this._sleep(5);
                }
            }
            
            // Call completion callback
            this._completeBatch(batch, true, null, Date.now() - batchStartTime);
            
        } catch (error) {
            this._logger.error(`Batch ${batch.id} processing failed`, error);
            
            this._completeBatch(batch, false, error, Date.now() - batchStartTime);
        }
        
        this._metrics.totalBatches++;
    }

    /**
     * Progressive loading for large directories
     */
    async processDirectoryProgressively(directoryUri, processor, options = {}) {
        const maxFiles = options.maxFiles || 1000;
        
        try {
            // Get all files in directory
            const pattern = new vscode.RelativePattern(directoryUri, '**/*');
            const files = await vscode.workspace.findFiles(pattern, null, maxFiles);
            
            if (files.length === 0) {
                this._logger.debug(`No files found in directory: ${directoryUri.fsPath}`);
                return;
            }
            
            this._logger.info(`Processing directory progressively: ${files.length} files in ${directoryUri.fsPath}`);
            
            // Queue files for batch processing
            return this.queueForProcessing(files, processor, {
                priority: 'normal',
                background: true,
                ...options
            });
            
        } catch (error) {
            this._logger.error('Progressive directory processing failed', error);
            throw error;
        }
    }

    /**
     * Background refresh without blocking UI
     */
    async refreshInBackground(uris, processor, options = {}) {
        return this.queueForProcessing(uris, processor, {
            background: true,
            priority: 'low',
            ...options
        });
    }

    /**
     * Priority refresh for visible files
     */
    async refreshVisible(uris, processor, options = {}) {
        return this.queueForProcessing(uris, processor, {
            background: false,
            priority: 'high',
            ...options
        });
    }

    /**
     * Chunk array into smaller arrays
     */
    _chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Sleep utility for yielding control
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update status bar with progress
     */
    _updateStatusBar() {
        if (!this._statusBar) return;
        
        const percentage = this._totalCount > 0 ? Math.round((this._processedCount / this._totalCount) * 100) : 0;
        this._statusBar.text = `$(sync~spin) Processing files... ${percentage}% (${this._processedCount}/${this._totalCount})`;
        this._statusBar.tooltip = 'Explorer Dates is processing file decorations';
        this._statusBar.show();
    }

    /**
     * Hide status bar
     */
    _hideStatusBar() {
        if (this._statusBar) {
            this._statusBar.hide();
        }
    }

    /**
     * Update processing metrics
     */
    _updateMetrics(totalTime) {
        this._metrics.totalProcessingTime += totalTime;
        if (this._metrics.totalBatches > 0) {
            this._metrics.averageBatchTime = this._metrics.totalProcessingTime / this._metrics.totalBatches;
        }
    }

    /**
     * Get processing metrics
     */
    getMetrics() {
        return {
            ...this._metrics,
            isProcessing: this._isProcessing,
            queueLength: this._processingQueue.length,
            currentProgress: this._totalCount > 0 ? (this._processedCount / this._totalCount) : 0,
            batchSize: this._batchSize,
            adaptiveBatching: this._adaptiveBatching,
            workspaceScale: this._workspaceScale
        };
    }

    /**
     * Cancel all pending processing
     */
    cancelAll() {
        this._processingQueue.length = 0;
        this._hideStatusBar();
        this._logger.info('All batch processing cancelled');
    }

    /**
     * Cancel specific batch
     */
    cancelBatch(batchId, reason = 'manual') {
        const index = this._processingQueue.findIndex(batch => batch.id === batchId);
        if (index !== -1) {
            const cancelled = this._processingQueue.splice(index, 1)[0];
            this._detachAbort(cancelled);
            this._logger.debug(`Cancelled batch ${batchId} with ${cancelled.uris.length} URIs`);
            if (cancelled.onComplete) {
                cancelled.onComplete({
                    processed: 0,
                    success: false,
                    error: new Error(`Batch cancelled (${reason})`),
                    duration: 0
                });
            }
            return true;
        }
        return false;
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.cancelAll();
        if (this._statusBar) {
            this._statusBar.dispose();
        }
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        this._logger.info('BatchProcessor disposed', this.getMetrics());
    }

    setWorkspaceScale(scale = 'normal') {
        if (['normal', 'large', 'extreme'].includes(scale)) {
            this._workspaceScale = scale;
        } else {
            this._workspaceScale = 'normal';
        }
        this._logger.debug(`Batch processor workspace scale set to ${this._workspaceScale}`);
    }

    _getEffectiveBatchSize(totalItems) {
        if (!this._adaptiveBatching) {
            return this._batchSize;
        }

        let scaleFactor = 1;
        if (this._workspaceScale === 'large') {
            scaleFactor = 0.6;
        } else if (this._workspaceScale === 'extreme') {
            scaleFactor = 0.35;
        }

        let effective = Math.max(this._minBatchSize, Math.floor(this._batchSize * scaleFactor));

        if (totalItems > 2000) {
            effective = Math.max(this._minBatchSize, Math.floor(effective * 0.5));
        } else if (totalItems > 500) {
            effective = Math.max(this._minBatchSize, Math.floor(effective * 0.75));
        }

        return Math.max(this._minBatchSize, effective);
    }

    _clampBatchSize(value) {
        const numeric = Number(value) || 50;
        return Math.min(200, Math.max(this._minBatchSize, Math.round(numeric)));
    }

    _completeBatch(batch, success, error = null, duration = 0) {
        this._detachAbort(batch);
        if (batch.onComplete) {
            batch.onComplete({
                processed: success ? batch.uris.length : 0,
                success,
                error,
                duration
            });
        }
    }

    _detachAbort(batch) {
        if (!batch?.cancelSignal || !batch.abortListener) {
            return;
        }
        if (typeof batch.cancelSignal.removeEventListener === 'function') {
            try {
                batch.cancelSignal.removeEventListener('abort', batch.abortListener);
            } catch {
                // ignore
            }
        }
        batch.abortListener = null;
    }
}

module.exports = { BatchProcessor };
