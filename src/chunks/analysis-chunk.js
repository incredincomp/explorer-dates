/**
 * Analysis and diagnostics chunk - lazy loaded module
 */

const analysisCommands = require('../commands/analysisCommands');

module.exports = {
    ...analysisCommands,
    registerAnalysisCommands: analysisCommands.registerAnalysisCommands
};