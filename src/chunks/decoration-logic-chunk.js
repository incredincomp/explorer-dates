// Lightweight chunk that houses heavy decoration helpers to keep core bundle small
// Exports a factory that accepts the provider instance and returns helper methods

function createDecorationLogic(provider) {
    const vscode = require('vscode');

    function _getFlyweightValue(cache, order, limit, key, factory, statsTracker) {
        if (!provider._enableFlyweights) {
            if (statsTracker) { statsTracker.misses++; statsTracker.allocations++; }
            return factory();
        }

        if (!key) {
            if (statsTracker) { statsTracker.misses++; statsTracker.allocations++; }
            return factory();
        }

        if (cache.has(key)) {
            if (statsTracker) { statsTracker.hits++; statsTracker.reuses++; }
            return cache.get(key);
        }

        if (statsTracker) { statsTracker.misses++; statsTracker.allocations++; }
        const value = factory();
        cache.set(key, value);
        order.push(key);
        if (order.length > limit) {
            const oldestKey = order.shift();
            if (oldestKey) cache.delete(oldestKey);
        }
        return value;
    }

    function _buildBadgeDescriptor({ formatType, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, date }) {
        const build = (value, keySuffix = null) => ({ value, key: keySuffix ? `badge:${formatType || 'default'}:${keySuffix}` : null });

        switch (formatType) {
            case 'relative-short':
            case 'relative-long':
                if (diffMinutes < 1) return build('●●', 'just');
                if (diffMinutes < 60) return build(`${Math.min(diffMinutes, 99)}m`, `m:${Math.min(diffMinutes, 99)}`);
                if (diffHours < 24) return build(`${Math.min(diffHours, 23)}h`, `h:${Math.min(diffHours, 23)}`);
                if (diffDays < 7) return build(`${diffDays}d`, `d:${diffDays}`);
                if (diffWeeks < 4) return build(`${diffWeeks}w`, `w:${diffWeeks}`);
                if (diffMonths < 12) return build(`${diffMonths}M`, `M:${diffMonths}`);
                return build('1y', 'y:1');

            case 'absolute-short':
            case 'absolute-long': {
                const MONTH_ABBREVIATIONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const day = date.getDate();
                const badge = `${MONTH_ABBREVIATIONS[date.getMonth()]}${day < 10 ? '0' + day : day}`;
                const keyParts = [date.getMonth(), day];
                if (formatType === 'absolute-long') keyParts.push(date.getFullYear());
                return build(badge, `abs:${keyParts.join('-')}`);
            }

            case 'technical':
                if (diffMinutes < 60) return build(`${diffMinutes}m`, `tech:m:${diffMinutes}`);
                if (diffHours < 24) return build(`${diffHours}h`, `tech:h:${diffHours}`);
                return build(`${diffDays}d`, `tech:d:${diffDays}`);

            case 'minimal':
                if (diffHours < 1) return build('••', 'min:now');
                if (diffHours < 24) return build('○○', 'min:hours');
                return build('──', 'min:days');

            default: {
                if (diffMinutes < 60) return build(`${diffMinutes}m`, `smart:m:${diffMinutes}`);
                if (diffHours < 24) return build(`${diffHours}h`, `smart:h:${diffHours}`);
                return build(`${diffDays}d`, `smart:d:${diffDays}`);
            }
        }
    }

    function _formatDateBadge(date, formatType, precalcDiffMs = null) {
        const now = new Date();
        const diffMs = precalcDiffMs !== null ? precalcDiffMs : (now.getTime() - date.getTime());
        if (diffMs < 0) { provider._logger.debug(`File has future modification time (diffMs: ${diffMs}), treating as just modified`); return '●●'; }
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const descriptor = _buildBadgeDescriptor({ formatType, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, date });
        return _getFlyweightValue(provider._badgeFlyweightCache, provider._badgeFlyweightOrder, provider._badgeFlyweightLimit, descriptor.key, () => descriptor.value, provider._badgeFlyweightStats);
    }

    function _getColorIdentifier(color) {
        if (!color) return 'none';
        if (typeof color === 'string') return color;
        if (color.id) return color.id;
        try { return JSON.stringify(color); } catch { return String(color); }
    }

    function _buildDecorationPoolKey(badge, tooltip, color) {
        const normalizedBadge = badge || '';
        const normalizedTooltip = tooltip || '';
        const colorKey = _getColorIdentifier(color);
        return `${normalizedBadge}::${colorKey}::${normalizedTooltip}`;
    }

    function acquireDecorationFromPool({ badge, tooltip, color }) {
        if (!provider._enableDecorationPool) {
            provider._decorationPoolStats.misses++;
            provider._decorationPoolStats.allocations++;
            const decoration = new vscode.FileDecoration(badge || '??');
            if (tooltip) decoration.tooltip = tooltip;
            if (color) decoration.color = color;
            decoration.propagate = false;
            return decoration;
        }

        if (!badge) { provider._decorationPoolStats.allocations++; return new vscode.FileDecoration('??'); }
        const key = _buildDecorationPoolKey(badge, tooltip, color);
        if (key && provider._decorationPool.has(key)) { provider._decorationPoolStats.hits++; provider._decorationPoolStats.reuses++; return provider._decorationPool.get(key); }

        const decoration = new vscode.FileDecoration(badge);
        if (tooltip) decoration.tooltip = tooltip; if (color) decoration.color = color; decoration.propagate = false;
        provider._decorationPoolStats.allocations++;
        if (key) {
            provider._decorationPool.set(key, decoration);
            provider._decorationPoolOrder.push(key);
            if (provider._decorationPoolOrder.length > provider._maxDecorationPoolSize) {
                const oldestKey = provider._decorationPoolOrder.shift(); if (oldestKey && oldestKey !== key) provider._decorationPool.delete(oldestKey);
            }
        }
        provider._decorationPoolStats.misses++;
        return decoration;
    }

    function clearDecorationPool(reason = 'unspecified') {
        if (provider._decorationPool.size === 0) return;
        provider._decorationPool.clear(); provider._decorationPoolOrder.length = 0; provider._logger.debug(`🧼 Cleared decoration pool (${reason})`);
    }

    // Tooltip builder - keep somewhat compact but move heavy string building here
    async function _buildTooltipContent({ filePath, stat, gitBlame, shouldUseAccessibleTooltips, fileSizeFormat }) {
        // Accessible tooltip supersedes rich tooltip when enabled
        if (shouldUseAccessibleTooltips) {
            const accessibleTooltip = provider._accessibility?.getAccessibleTooltip?.(filePath, stat.mtime, stat.birthtime, stat.size, gitBlame);
            if (accessibleTooltip) return accessibleTooltip;
        }

        const parts = [];
        try {
            const dateStr = provider._l10n.formatDate(stat.mtime);
            parts.push(`${dateStr}`);
            if (fileSizeFormat && typeof stat.size === 'number') {
                const sizeStr = provider._formatFileSize(stat.size, fileSizeFormat);
                parts.push(sizeStr);
            }
            if (gitBlame && gitBlame.author) {
                parts.push(`Author: ${gitBlame.author}`);
            }
        } catch (e) {
            provider._logger.debug('Tooltip builder failed', e);
        }
        return parts.join(' — ');
    }

    return {
        acquireDecorationFromPool,
        clearDecorationPool,
        _buildDecorationPoolKey,
        _getColorIdentifier,
        _formatDateBadge,
        _buildBadgeDescriptor,
        _getFlyweightValue,
        _buildTooltipContent
    };
}

module.exports = { createDecorationLogic };
