/**
 * Team persistence chunk - lightweight lazy factory
 * The heavy TeamConfigPersistenceManager is imported and instantiated on-demand
 * to keep the runtime chunks small at activation time.
 */

module.exports = {
    createTeamPersistenceManager: (context) => {
        let _manager = null;

        function ensureManager() {
            if (_manager) return _manager;
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
            if (typeof dynamicRequire !== 'function') {
                throw new Error('Team persistence manager requires a Node environment');
            }
            const candidates = [
                '../teamConfigPersistence.proxy',
                '../teamConfigPersistence.proxy.js',
                '../../src/teamConfigPersistence.proxy',
                '../../src/teamConfigPersistence.proxy.js'
            ];
            let mod = null;
            for (const candidate of candidates) {
                try {
                    mod = dynamicRequire(candidate);
                    if (mod) break;
                } catch {
                    // try next candidate
                }
            }
            if (!mod) {
                throw new Error('Unable to load teamConfigPersistence.proxy');
            }
            _manager = new mod.TeamConfigPersistenceManager(context);
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
