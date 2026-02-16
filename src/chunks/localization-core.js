const vscode = require('vscode');

/**
 * Localization strings for different languages
 */
const translations = {
    en: {
        now: 'now',
        minutes: 'm',
        hours: 'h',
        days: 'd',
        weeks: 'w',
        months: 'mo',
        years: 'y',
        justNow: 'just now',
        minutesAgo: (n) => `${n} minute${n !== 1 ? 's' : ''} ago`,
        hoursAgo: (n) => `${n} hour${n !== 1 ? 's' : ''} ago`,
        yesterday: 'yesterday',
        daysAgo: (n) => `${n} day${n !== 1 ? 's' : ''} ago`,
        lastModified: 'Last modified',
        refreshSuccess: 'Date decorations refreshed',
        activationError: 'Explorer Dates failed to activate',
        errorAccessingFile: 'Error accessing file for decoration',
        // Telemetry/commands
        clearTelemetryPrompt: 'This will permanently delete locally-stored telemetry events for Explorer Dates. This action cannot be undone. Proceed?',
        clearTelemetryConfirm: 'Clear Telemetry',
        clearTelemetryCancel: 'Cancel',
        clearTelemetrySuccess: '✅ Explorer Dates telemetry cleared.',
        // Migration & settings
        migrateChecking: 'Checking for settings that need migration...',
        migrateAllUpToDate: '✅ All settings are up to date!',
        migrateApplied: (details) => `✅ Explorer Dates maintenance applied: ${details}.`,
        organizeSettingsResult: (details) => `Explorer Dates settings organized: ${details}`,
        cleanupSuccess: '✅ Deprecated settings have been cleaned up!',
        // Export reporting messages
        reportFormatDisabled: (format, allowed) => `Report format "${format}" is disabled. Allowed formats: ${allowed}`,
        reportSaved: (path) => `Report saved to ${path}`,
        reportGenerateFailed: 'Failed to generate report',
        reportDownloadTriggered: 'Report download triggered in browser',
        selectReportTimeRangePlaceholder: 'Select report time range',
        selectReportFormatPlaceholder: 'Select report format',
        cleanupNoDeprecated: 'ℹ️ No deprecated settings found to clean up.',
        showMigrationHistoryNoHistory: 'No migration history found.',
        resetConfirmation: 'This will reset all Explorer Dates settings to their default values. Are you sure?',
        migrationDetailsTitle: 'Explorer Dates - Settings Migration',
        migrationDetailsHeader: 'Settings Migration',
        gitAttributionWarning: 'Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.',
        noOverridesToDocument: 'No overrides to document.',
        overrideNotesHeader: '# Explorer Dates Override Notes\n\n',
        analysisCommandsDisabled: 'Explorer Dates analysis commands are disabled. Shortcuts like Ctrl+Shift+M/H/A will not work until you enable explorerDates.enableAnalysisCommands.',
        analysisEnableNow: 'Enable Now',
        analysisEnablePartially: 'Enable partially succeeded. Update explorerDates.enableAnalysisCommands in remaining workspace folders manually.',
        analysisEnableFailed: 'Enable failed: update explorerDates.enableAnalysisCommands in workspace settings.',
        workspaceTemplatesDisabled: 'Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.',
        workspaceTemplatesDisabledSave: 'Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.',
        enterTemplateName: 'Enter template name',
        enterTemplateDescription: 'Enter description (optional)',
        failedToOpenTemplateManager: (msg) => `Failed to open template manager: ${msg}`,
        failedToSaveTemplate: (msg) => `Failed to save template: ${msg}`,
        reportingDisabled: 'Reporting features are disabled. Enable explorerDates.enableExportReporting to generate reports.',
        failedToGenerateReport: (msg) => `Failed to generate report: ${msg}`,
        apiDisabled: 'Explorer Dates API is disabled via settings.',
        failedToShowApiInformation: (msg) => `Failed to show API information: ${msg}`,
        failedToShowWorkspaceActivity: (msg) => `Failed to show workspace activity: ${msg}`,
        failedToShowPerformanceAnalytics: (msg) => `Failed to show performance analytics: ${msg}`,
        failedToShowCacheDebugInfo: (msg) => `Failed to show cache debug info: ${msg}`,
        noWorkspaceFolderOpen: 'No workspace folder open',
        resetConfirm: 'Reset Settings',
        resetCancel: 'Cancel',
        resetSuccess: (count) => `✅ Reset ${count} settings to defaults.`,
        validateNoIssues: '✅ Configuration is valid - no issues found!',
        validateFoundIssues: (count) => `Found ${count} configuration issue(s). Would you like to see details?`,
        validateShowDetails: 'Show Details',
        validateDismiss: 'Dismiss',
        migrationNotificationMessage: (count) => `Explorer Dates updated ${count} setting(s) for compatibility. Your configuration has been preserved.`,
        migrationViewChanges: 'View Changes',
        migrationOpenSettings: 'Open Settings',
        deprecatedPrompt: (count) => `Explorer Dates found ${count} deprecated setting(s). Would you like to remove them?`,
        deprecatedClean: 'Clean Up Now',
        deprecatedKeep: 'Keep Old Settings',
        deprecatedAskLater: 'Ask Later',
        // Team config labels
        showFileLocation: 'Show File Location',
        teamConfigCorrupted: 'Explorer Dates team configuration file appears to be corrupted. Please check the .explorer-dates-profiles.json file or restore from backup.',
        appliedFromTeamProfile: (count, profileName) => `Applied ${count} Explorer Dates settings from team profile "${profileName}".`,
        documentedOverrides: 'Documented Explorer Dates overrides in .vscode/explorer-dates-overrides.md',
        teamConfigMissingProfile: 'Team configuration is missing an active profile.',
        ephemeralStorageEnospc: 'Explorer Dates team configuration could not be saved because the disk is full.',
        ephemeralStorageGeneric: 'Explorer Dates team configuration could not be saved because the workspace is read-only or permissions are restricted.',
        ephemeralStorageSuffix: ' Changes will be kept in memory until VS Code restarts, so they may be lost.'
    }
    // (other languages omitted for brevity)
};

// Merge generated locale json when available (generated by scripts/generate-locales.js)
try {
    const generated = require('../locales/index.js');
    if (generated && typeof generated === 'object') {
        for (const [locale, map] of Object.entries(generated)) {
            if (!translations[locale]) translations[locale] = {};
            for (const [k, v] of Object.entries(map)) {
                // preserve functions where present in core, otherwise use generated string
                if (typeof translations[locale][k] === 'undefined') {
                    translations[locale][k] = v;
                }
            }
        }
    }
} catch {
    // missing generated locales is fine; we keep built-in English fallback
}

class LocalizationManager {
    constructor() {
        this._currentLocale = 'en';
        this._configurationWatcher = null;
        this._updateLocale();
        if (typeof vscode.workspace.onDidChangeConfiguration === 'function') {
            this._configurationWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('explorerDates.locale')) {
                    this._updateLocale();
                }
            });
        } else {
            // Defensive fallback for test environments / web mocks that do not
            // expose a callable onDidChangeConfiguration - avoid throwing during
            // construction so provider initialization remains resilient.
            this._configurationWatcher = null;
        }
    }

    _updateLocale() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        let locale = config.get('locale', 'auto');
        if (locale === 'auto') {
            const vsCodeLocale = (vscode && vscode.env && typeof vscode.env.language === 'string') ? vscode.env.language : 'en';
            try {
                locale = String(vsCodeLocale || 'en').split('-')[0];
            } catch {
                locale = 'en';
            }
        }
        if (!translations[locale]) {
            locale = 'en';
        }
        this._currentLocale = locale;
    }

    getString(key, ...args) {
        const strings = translations[this._currentLocale] || translations.en;
        const value = strings[key];
        if (typeof value === 'function') {
            return value(...args);
        }
        return value || translations.en[key] || key;
    }

    getCurrentLocale() {
        return this._currentLocale;
    }

    formatDate(date, options = {}) {
        try {
            return date.toLocaleDateString(this._currentLocale, options);
        } catch {
            return date.toLocaleDateString('en', options);
        }
    }

    dispose() {
        if (this._configurationWatcher) {
            this._configurationWatcher.dispose();
            this._configurationWatcher = null;
        }
        if (localizationInstance === this) {
            localizationInstance = null;
        }
    }
}

let localizationInstance = null;
function getLocalization() {
    if (!localizationInstance) {
        localizationInstance = new LocalizationManager();
    }
    return localizationInstance;
}

module.exports = { LocalizationManager, getLocalization };