// Lightweight localization shim.
// Full locale bundles are placed in `src/chunks/localization-core.js` and loaded lazily.
class LocalizationManager {
    constructor() {
        this._real = null;
        this._loading = null;
    }

    _ensureLoaded() {
        if (this._real) return Promise.resolve(this._real);
        if (this._loading) return this._loading;
        this._loading = import('../chunks/localization-core.js')
            .then((mod) => {
                try {
                    this._real = mod.getLocalization();
                } catch {
                    this._real = null;
                }
                this._loading = null;
                return this._real;
            })
            .catch(() => { this._loading = null; return null; });
        return this._loading;
    }

    getString(key, ...args) {
        if (this._real && typeof this._real.getString === 'function') {
            return this._real.getString(key, ...args);
        }
        if (this._default && typeof key === 'string' && Object.prototype.hasOwnProperty.call(this._default, key)) {
            const fallback = this._default[key];
            return (typeof fallback === 'function') ? fallback(...args) : fallback;
        }
        // Minimal fallback
        return typeof key === 'string' ? key : '';
    }

    formatDate(d) {
        if (this._real && typeof this._real.formatDate === 'function') {
            return this._real.formatDate(d);
        }
        return (d instanceof Date) ? d.toString() : String(d);
    }

    getCurrentLocale() {
        if (this._real && typeof this._real.getCurrentLocale === 'function') {
            return this._real.getCurrentLocale();
        }
        return 'en';
    }

    dispose() {
        if (this._real && typeof this._real.dispose === 'function') {
            try { this._real.dispose(); } catch {};
        }
        this._real = null;
        this._loading = null;
    }
}

// Minimal English fallback translations for immediate availability
const _DEFAULT_EN = {
    now: 'now',
    justNow: 'just now',
    minutesAgo: (n) => `${n} minute${n !== 1 ? 's' : ''} ago`,
    hoursAgo: (n) => `${n} hour${n !== 1 ? 's' : ''} ago`,
    yesterday: 'yesterday',
    daysAgo: (n) => `${n} day${n !== 1 ? 's' : ''} ago`,
    lastModified: 'Last modified',
    refreshSuccess: 'Date decorations refreshed',
    activationError: 'Explorer Dates failed to activate',
    errorAccessingFile: 'Error accessing file for decoration',
    clearTelemetrySuccess: '✅ Explorer Dates telemetry cleared.',
    migrateChecking: 'Checking for settings that need migration...',
    migrateAllUpToDate: '✅ All settings are up to date!',
    migrateApplied: (details) => `✅ Explorer Dates maintenance applied: ${details}.`,
    organizeSettingsResult: (details) => `Explorer Dates settings organized: ${details}`,
    cleanupSuccess: '✅ Deprecated settings have been cleaned up!',
    reportingDisabled: 'Reporting features are disabled. Enable explorerDates.enableExportReporting to generate reports.',
    reportSaved: (path) => `Report saved to ${path}`,
    failedToGenerateReport: (msg) => `Failed to generate report: ${msg}`
};

// Merge generated English keys into fallback so immediate lookups are richer without loading heavy chunk
try {
    const genEn = require('../locales/en.json');
    if (genEn && typeof genEn === 'object') {
        for (const [k, v] of Object.entries(genEn)) {
            if (typeof _DEFAULT_EN[k] === 'undefined') {
                if (typeof v === 'string' && v.includes('{')) {
                    // Convert placeholder strings like "Failed: {0}" into functions that substitute args
                    _DEFAULT_EN[k] = (...args) => {
                        let out = v;
                        args.forEach((a, i) => {
                            out = out.replace(new RegExp(`\\{${i}\\}`, 'g'), String(a));
                        });
                        return out;
                    };
                } else {
                    _DEFAULT_EN[k] = v;
                }
            }
        }
    }
} catch {
    // ignore if generated locale isn't present
}

let _shared = null;
function getLocalization() {
    if (_shared) return _shared;
    _shared = new LocalizationManager();
    // Attach the lightweight fallback for immediate synchronous lookups
    _shared._default = _DEFAULT_EN;
    // Start background load of full locale bundles
    _shared._ensureLoaded().catch(() => {});
    return _shared;
}

module.exports = { LocalizationManager, getLocalization };
