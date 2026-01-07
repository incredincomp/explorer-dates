/**
 * Git insights chunk - lazy loaded module
 * Provides git blame parsing, cache management, and worker integration
 */

const { getGitInsightsManager } = require('./git-insights-chunk');

// Export the manager for lazy loading
module.exports = {
    default: getGitInsightsManager,
    getGitInsightsManager
};