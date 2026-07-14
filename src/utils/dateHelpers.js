// Lightweight wrapper - prefer lazy chunk when available
let chunk = null;
try {
    const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
    if (typeof dynamicRequire === 'function') {
        try { chunk = dynamicRequire('../chunks/utils-shared-chunk'); } catch { /* ignore */ }
        try { if (!chunk) chunk = dynamicRequire('./chunks/utils-shared-chunk'); } catch { /* ignore */ }
        // Back-compat fallbacks
        try { if (!chunk) chunk = dynamicRequire('../chunks/date-helpers-chunk'); } catch { /* ignore */ }
        try { if (!chunk) chunk = dynamicRequire('./chunks/date-helpers-chunk'); } catch { /* ignore */ }
    }
} catch { /* ignore */ }

if (chunk && (chunk.ensureDate || chunk.isDateLike || chunk.getCurrentTimestamp)) {
    module.exports = {
        ensureDate: chunk.ensureDate,
        isDateLike: chunk.isDateLike,
        getCurrentTimestamp: chunk.getCurrentTimestamp
    };
} else {
    // Minimal fallback implementations
    function getCurrentTimestamp() {
        return (typeof Date === 'function' && Date.now) ? Date.now() : 1640995200000;
    }

    function isDateLike(value) {
        return Boolean(value && typeof value === 'object' && typeof value.getTime === 'function');
    }

    function ensureDate(value) {
        if (isDateLike(value)) return value;
        if (typeof value === 'number') return new Date(value);
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return isNaN(parsed) ? new Date() : new Date(parsed);
        }
        return new Date(NaN);
    }

    module.exports = { ensureDate, isDateLike, getCurrentTimestamp };
}
