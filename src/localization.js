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
        errorAccessingFile: 'Error accessing file for decoration'
    },
    es: {
        now: 'ahora',
        minutes: 'm',
        hours: 'h',
        days: 'd',
        weeks: 's',
        months: 'm',
        years: 'a',
        justNow: 'ahora mismo',
        minutesAgo: (n) => `hace ${n} minuto${n !== 1 ? 's' : ''}`,
        hoursAgo: (n) => `hace ${n} hora${n !== 1 ? 's' : ''}`,
        yesterday: 'ayer',
        daysAgo: (n) => `hace ${n} día${n !== 1 ? 's' : ''}`,
        lastModified: 'Última modificación',
        refreshSuccess: 'Decoraciones de fecha actualizadas',
        activationError: 'Explorer Dates no se pudo activar',
        errorAccessingFile: 'Error al acceder al archivo para decoración'
    },
    fr: {
        now: 'maintenant',
        minutes: 'm',
        hours: 'h',
        days: 'j',
        weeks: 's',
        months: 'm',
        years: 'a',
        justNow: 'à l\'instant',
        minutesAgo: (n) => `il y a ${n} minute${n !== 1 ? 's' : ''}`,
        hoursAgo: (n) => `il y a ${n} heure${n !== 1 ? 's' : ''}`,
        yesterday: 'hier',
        daysAgo: (n) => `il y a ${n} jour${n !== 1 ? 's' : ''}`,
        lastModified: 'Dernière modification',
        refreshSuccess: 'Décorations de date actualisées',
        activationError: 'Échec de l\'activation d\'Explorer Dates',
        errorAccessingFile: 'Erreur lors de l\'accès au fichier pour la décoration'
    },
    de: {
        now: 'jetzt',
        minutes: 'Min',
        hours: 'Std',
        days: 'T',
        weeks: 'W',
        months: 'Mon',
        years: 'J',
        justNow: 'gerade eben',
        minutesAgo: (n) => `vor ${n} Minute${n !== 1 ? 'n' : ''}`,
        hoursAgo: (n) => `vor ${n} Stunde${n !== 1 ? 'n' : ''}`,
        yesterday: 'gestern',
        daysAgo: (n) => `vor ${n} Tag${n !== 1 ? 'en' : ''}`,
        lastModified: 'Zuletzt geändert',
        refreshSuccess: 'Datumsdekorationen aktualisiert',
        activationError: 'Explorer Dates konnte nicht aktiviert werden',
        errorAccessingFile: 'Fehler beim Zugriff auf Datei für Dekoration'
    },
    ja: {
        now: '今',
        minutes: '分',
        hours: '時間',
        days: '日',
        weeks: '週',
        months: 'ヶ月',
        years: '年',
        justNow: 'たった今',
        minutesAgo: (n) => `${n}分前`,
        hoursAgo: (n) => `${n}時間前`,
        yesterday: '昨日',
        daysAgo: (n) => `${n}日前`,
        lastModified: '最終更新',
        refreshSuccess: '日付装飾が更新されました',
        activationError: 'Explorer Datesのアクティベーションに失敗しました',
        errorAccessingFile: 'ファイルアクセス中にエラーが発生しました'
    },
    zh: {
        now: '现在',
        minutes: '分钟',
        hours: '小时',
        days: '天',
        weeks: '周',
        months: '月',
        years: '年',
        justNow: '刚刚',
        minutesAgo: (n) => `${n}分钟前`,
        hoursAgo: (n) => `${n}小时前`,
        yesterday: '昨天',
        daysAgo: (n) => `${n}天前`,
        lastModified: '最后修改',
        refreshSuccess: '日期装饰已刷新',
        activationError: 'Explorer Dates 激活失败',
        errorAccessingFile: '访问文件装饰时出错'
    }
};

/**
 * Localization manager
 */
class LocalizationManager {
    constructor() {
        this._currentLocale = 'en';
        this._updateLocale();
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.locale')) {
                this._updateLocale();
            }
        });
    }

    /**
     * Update current locale from configuration
     */
    _updateLocale() {
        const config = vscode.workspace.getConfiguration('explorerDates');
        let locale = config.get('locale', 'auto');
        
        if (locale === 'auto') {
            // Try to detect from VS Code's display language
            const vsCodeLocale = vscode.env.language;
            // Extract language code (e.g., 'en-US' -> 'en')
            locale = vsCodeLocale.split('-')[0];
        }
        
        // Fallback to English if locale not supported
        if (!translations[locale]) {
            locale = 'en';
        }
        
        this._currentLocale = locale;
    }

    /**
     * Get a localized string
     */
    getString(key, ...args) {
        const strings = translations[this._currentLocale] || translations.en;
        const value = strings[key];
        
        if (typeof value === 'function') {
            return value(...args);
        }
        
        return value || translations.en[key] || key;
    }

    /**
     * Get current locale
     */
    getCurrentLocale() {
        return this._currentLocale;
    }

    /**
     * Format date using locale settings
     */
    formatDate(date, options = {}) {
        try {
            return date.toLocaleDateString(this._currentLocale, options);
        } catch (error) {
            // Fallback to English if locale formatting fails
            return date.toLocaleDateString('en', options);
        }
    }
}

// Singleton instance
let localizationInstance = null;

/**
 * Get the localization manager instance
 */
function getLocalization() {
    if (!localizationInstance) {
        localizationInstance = new LocalizationManager();
    }
    return localizationInstance;
}

module.exports = { LocalizationManager, getLocalization };
