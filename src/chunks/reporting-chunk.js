/**
 * Export reporting chunk - lazy loaded module
 */

const { ExportReportingManager } = require('../exportReporting');

module.exports = {
    ExportReportingManager,
    createExportReportingManager: (context) => new ExportReportingManager(context)
};
