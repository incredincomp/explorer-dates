/**
 * Team persistence chunk - lightweight lazy factory
 * The heavy TeamConfigPersistenceManager is imported and instantiated on-demand
 * to keep the runtime chunks small at activation time.
 *
 * Static require is used intentionally so esbuild bundles the proxy and its
 * impl into this chunk. This avoids runtime path failures caused by the
 * src/ directory being excluded from the installed VSIX package.
 */

const { TeamConfigPersistenceManager } = require('../teamConfigPersistence.proxy');

module.exports = {
    createTeamPersistenceManager: (context) => {
        let _manager = null;

        function ensureManager() {
            if (_manager) return _manager;
            _manager = new TeamConfigPersistenceManager(context);
            return _manager;
        }

        return {
            async validateTeamConfiguration() {
                const m = ensureManager();
                return m.validateTeamConfiguration();
            },

            async saveTeamProfiles(profiles) {
                const m = ensureManager();
                return m.saveTeamProfiles(profiles);
            },

            async loadTeamProfiles(skipUserNotifications = false) {
                const m = ensureManager();
                return m.loadTeamProfiles(skipUserNotifications);
            },

            async hasTeamConfiguration() {
                const m = ensureManager();
                return m.hasTeamConfiguration();
            },

            async createTeamProfile(profileId, profileData) {
                const m = ensureManager();
                return m.createTeamProfile(profileId, profileData);
            },

            async validateTeamConfigurationAndNotify() {
                const m = ensureManager();
                return m.validateTeamConfiguration();
            },

            dispose() {
                if (_manager && typeof _manager.dispose === 'function') {
                    try { _manager.dispose(); } catch { /* ignore dispose errors */ }
                }
                _manager = null;
            }
        };
    }
};
