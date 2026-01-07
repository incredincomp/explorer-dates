/**
 * Advanced Cache Chunk Entry Point
 * Exposes AdvancedCache for lazy loading via the chunk loader
 */

const { AdvancedCache } = require('../advancedCache');

function createAdvancedCache(context) {
    return new AdvancedCache(context);
}

module.exports = {
    AdvancedCache,
    createAdvancedCache,
    default: { AdvancedCache, createAdvancedCache }
};
