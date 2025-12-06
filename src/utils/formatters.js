const { MAX_BADGE_LENGTH } = require('../constants');

function formatFileSize(bytes = 0, format = 'auto') {
    const safeBytes = typeof bytes === 'number' && !Number.isNaN(bytes) ? bytes : 0;

    if (format === 'bytes') {
        return `~${safeBytes}B`;
    }

    const kb = safeBytes / 1024;
    if (format === 'kb') {
        return `~${kb.toFixed(1)}K`;
    }

    const mb = kb / 1024;
    if (format === 'mb') {
        return `~${mb.toFixed(1)}M`;
    }

    if (safeBytes < 1024) {
        return `~${safeBytes}B`;
    }

    if (kb < 1024) {
        return `~${Math.round(kb)}K`;
    }

    return `~${mb.toFixed(1)}M`;
}

function trimBadge(badge) {
    if (!badge) {
        return undefined;
    }

    return badge.length > MAX_BADGE_LENGTH ? badge.substring(0, MAX_BADGE_LENGTH) : badge;
}

module.exports = {
    formatFileSize,
    trimBadge
};
