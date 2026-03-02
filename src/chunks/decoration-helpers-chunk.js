function buildSummaryTooltip(provider, { filePath, stat, badgeDetails }) {
    try {
        const parts = [];
        if (badgeDetails?.readableModified) parts.push(`Modified ${badgeDetails.readableModified}`);
        const sizeLabel = badgeDetails?.fileSizeLabel || (stat?.size ? provider._formatFileSize(stat.size, 'auto') : null);
        if (sizeLabel) parts.push(sizeLabel);
        return `${describeFile(filePath)} — ${parts.filter(Boolean).join(' • ') || provider._formatFullDate(stat?.mtime || new Date())}`;
    } catch (error) {
        provider._logger?.debug?.('buildSummaryTooltip failed', error);
        return `${describeFile(filePath)} — ${provider._formatFullDate(stat?.mtime || new Date())}`;
    }
}

function describeFile(filePath) {
    if (!filePath) return 'unknown file';
    try { return filePath.replace(/^.*[\\/]/, ''); } catch { return filePath; }
}

function formatDateReadable(provider, date) {
    try {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const descriptor = provider._buildReadableDescriptor(date, now, diffMins, diffHours, diffDays);
        if (descriptor) {
            return provider._getFlyweightValue(provider._readableDateFlyweightCache, provider._readableDateFlyweightOrder, provider._readableDateFlyweightLimit, descriptor.key, descriptor.factory, provider._readableFlyweightStats);
        }
        if (date.getFullYear() === now.getFullYear()) return provider._l10n.formatDate(date, { month: 'short', day: 'numeric' });
        return provider._l10n.formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
        provider._logger?.debug?.('formatDateReadable failed', error);
        return provider._l10n.formatDate(date);
    }
}

function getInitials(provider, fullName) {
    if (provider._gitInsightsManager && typeof provider._gitInsightsManager.getInitials === 'function') {
        return provider._gitInsightsManager.getInitials(fullName);
    }
    if (!fullName || typeof fullName !== 'string') return null;
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || '')).substring(0, 2).toUpperCase();
}

function formatCompactSize(provider, bytes) {
    try {
        if (typeof bytes !== 'number' || isNaN(bytes)) return null;
        const units = ['B', 'K', 'M', 'G', 'T'];
        let i = 0; let val = bytes;
        while (val >= 1024 && i < units.length - 1) { val = val / 1024; i++; }
        const rounded = Math.round(val); const unit = units[i];
        if (rounded <= 9) return `${rounded}${unit}`;
        const s = String(rounded); if (s.length >= 2) return s.slice(0, 2);
        return s;
    } catch (error) {
        provider._logger?.debug?.('formatCompactSize failed', error);
        return null;
    }
}

function formatFullDate(provider, date) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
        return date.toLocaleString('en-US', options);
    } catch (error) {
        provider._logger?.debug?.('formatFullDate failed', error);
        return date.toString();
    }
}

module.exports = { buildSummaryTooltip, formatDateReadable, getInitials, formatCompactSize, formatFullDate };