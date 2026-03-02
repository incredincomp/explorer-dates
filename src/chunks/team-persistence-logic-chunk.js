// Expose logic helpers for team persistence as a separate chunk
const logic = require('../teamConfigPersistence.logic');

module.exports = {
    detectConfigConflicts: logic.detectConfigConflicts,
    validateSettings: logic.validateSettings,
    validateSettingValue: logic.validateSettingValue,
    exportTeamConfiguration: logic.exportTeamConfiguration,
    importTeamConfiguration: logic.importTeamConfiguration
};
