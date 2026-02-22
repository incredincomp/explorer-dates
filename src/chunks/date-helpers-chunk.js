// Date helpers moved to lazy chunk to reduce duplication across bundles
function getCurrentTimestamp() {
    if (typeof performance !== 'undefined' && performance.now && performance.timeOrigin) {
        return Math.floor(performance.timeOrigin + performance.now());
    }
    if (typeof Date === 'function' && Date.now) {
        return Date.now();
    }
    return 1640995200000;
}
function isDateLike(value) {
    return Boolean(value && typeof value === 'object' && typeof value.getTime === 'function');
}
function fallbackDateFormat(timestamp) {
    if (!timestamp || isNaN(timestamp)) return 'Invalid Date';
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).format(timestamp);
        } catch {}
    }
    const MILLISECONDS_PER_DAY = 86400000;
    const MILLISECONDS_PER_HOUR = 3600000;
    const MILLISECONDS_PER_MINUTE = 60000;
    const MILLISECONDS_PER_SECOND = 1000;
    const epochYear = 1970;
    const daysSinceEpoch = Math.floor(timestamp / MILLISECONDS_PER_DAY);
    const millisecondsInDay = timestamp % MILLISECONDS_PER_DAY;
    const hours = Math.floor(millisecondsInDay / MILLISECONDS_PER_HOUR);
    const minutes = Math.floor((millisecondsInDay % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
    const seconds = Math.floor((millisecondsInDay % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);
    const approximateYear = epochYear + Math.floor(daysSinceEpoch / 365.25);
    const approximateMonth = Math.floor((daysSinceEpoch % 365.25) / 30.44) + 1;
    const approximateDay = Math.floor(daysSinceEpoch % 30.44) + 1;
    const month = String(Math.min(approximateMonth, 12)).padStart(2, '0');
    const day = String(Math.min(approximateDay, 31)).padStart(2, '0');
    const hourStr = String(hours).padStart(2, '0');
    const minuteStr = String(minutes).padStart(2, '0');
    const secondStr = String(seconds).padStart(2, '0');
    return `${month}/${day}/${approximateYear}, ${hourStr}:${minuteStr}:${secondStr}`;
}
function ensureDate(value) {
    if (isDateLike(value)) return value;
    const hasDateConstructor = typeof Date === 'function' && Date.prototype && Date.prototype.constructor === Date;
    if (value === undefined || value === null) {
        if (!hasDateConstructor) {
            const now = getCurrentTimestamp();
            return { getTime: () => now, toLocaleString: () => fallbackDateFormat(now), toString: () => fallbackDateFormat(now) };
        }
        return new Date();
    }
    if (typeof value === 'number') {
        if (!hasDateConstructor) {
            return { getTime: () => value, toLocaleString: () => fallbackDateFormat(value), toString: () => fallbackDateFormat(value) };
        }
        return new Date(value);
    }
    if (typeof value === 'string') {
        let timestamp = 0;
        if (hasDateConstructor) timestamp = Date.parse(value); else { const parsed = parseFloat(value); timestamp = isNaN(parsed) ? 0 : parsed; }
        if (!hasDateConstructor) return { getTime: () => timestamp, toLocaleString: () => fallbackDateFormat(timestamp), toString: () => fallbackDateFormat(timestamp) };
        return new Date(value);
    }
    if (!hasDateConstructor) return { getTime: () => 0, toLocaleString: () => 'Invalid Date', toString: () => 'Invalid Date' };
    return new Date(value);
}
module.exports = { ensureDate, isDateLike, getCurrentTimestamp, fallbackDateFormat };