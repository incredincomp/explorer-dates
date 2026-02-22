// Implementation chunk for workspace intelligence heavy components
// Exports IncrementalIndexer and SmartExclusionManager as a small surface
const { IncrementalIndexer } = require('../incrementalIndexer');

// Export IncrementalIndexer directly but fetch SmartExclusion lazily at runtime
module.exports = {
    IncrementalIndexer,
    async getSmartExclusionManagerConstructor() {
        try {
            const mod = await import('../smartExclusion.js');
            return mod.SmartExclusionManager;
        } catch {
            return null;
        }
    }
};