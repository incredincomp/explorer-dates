// Expose UI helpers for team persistence as a separate chunk
const ui = require('../teamConfigPersistence.ui');

module.exports = {
    showTeamConflictWarning: ui.showTeamConflictWarning,
    showConflictDetails: ui.showConflictDetails,
    applyTeamConfiguration: ui.applyTeamConfiguration,
    documentUserOverrides: ui.documentUserOverrides
};