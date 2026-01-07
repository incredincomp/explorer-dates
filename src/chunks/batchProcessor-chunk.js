/**
 * Batch Processor Chunk Entry Point
 * Provides the BatchProcessor class for progressive loading scenarios
 */

const { BatchProcessor } = require('../batchProcessor');

function createBatchProcessor(options = {}) {
    const processor = new BatchProcessor();
    if (typeof processor.initialize === 'function' && options.autoInitialize) {
        processor.initialize(options.autoInitialize);
    }
    return processor;
}

module.exports = {
    BatchProcessor,
    createBatchProcessor,
    default: { BatchProcessor, createBatchProcessor }
};
