const logic = require('../workspaceIntelligence.logic');

module.exports = {
    scorePatterns: logic.scorePatterns,
    generateReviewHTML: logic.generateReviewHTML,
    showExclusionReviewSingle: logic.showExclusionReviewSingle,
    showExclusionReviewBulk: logic.showExclusionReviewBulk
};